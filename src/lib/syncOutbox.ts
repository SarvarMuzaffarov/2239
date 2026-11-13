import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { idbGetCollection, idbSaveCollection } from './indexedDbStorage';

const OUTBOX_IDB_KEY = '__sync_outbox_v1';

export interface SyncOutboxItem {
  id: string;
  collectionName: string;
  docId: string;
  op: 'set' | 'update' | 'delete';
  data?: Record<string, any>;
  merge?: boolean;
  createdAt: string;
  attempts: number;
}

let inMemoryQueue: SyncOutboxItem[] | null = null;
let isFlushing = false;
let autoFlushInitialized = false;

function isTransientFirestoreError(error: unknown): boolean {
  if (!error) return false;
  const code = (error as any)?.code || '';
  const msg = error instanceof Error ? error.message : String(error);
  return (
    code === 'unavailable' ||
    code === 'resource-exhausted' ||
    code === 'deadline-exceeded' ||
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily read units') ||
    msg.toLowerCase().includes('quota') ||
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('network')
  );
}

async function loadQueue(): Promise<SyncOutboxItem[]> {
  if (inMemoryQueue !== null) {
    return inMemoryQueue;
  }
  try {
    const stored = await idbGetCollection<SyncOutboxItem>(OUTBOX_IDB_KEY);
    inMemoryQueue = Array.isArray(stored) ? stored : [];
  } catch {
    inMemoryQueue = [];
  }
  return inMemoryQueue;
}

async function persistQueue(queue: SyncOutboxItem[]): Promise<void> {
  inMemoryQueue = queue;
  try {
    await idbSaveCollection(OUTBOX_IDB_KEY, queue);
  } catch {
    // Non-fatal in private browsing
  }
}

/**
 * Adds a Firestore write operation to the durable IndexedDB outbox queue.
 * Coalesces multiple writes to the same document so only the latest state is sent.
 */
export async function enqueueSyncOp(
  input: Omit<SyncOutboxItem, 'id' | 'createdAt' | 'attempts'>
): Promise<void> {
  if (typeof window === 'undefined' || !input.collectionName || !input.docId) return;

  const queue = [...(await loadQueue())];
  const existingIdx = queue.findIndex(
    item => item.collectionName === input.collectionName && item.docId === input.docId
  );

  const nowIso = new Date().toISOString();

  if (existingIdx >= 0) {
    const prev = queue[existingIdx];
    if (input.op === 'delete') {
      queue[existingIdx] = {
        ...prev,
        op: 'delete',
        data: undefined,
        createdAt: nowIso,
      };
    } else if (prev.op !== 'delete') {
      queue[existingIdx] = {
        ...prev,
        op: prev.op === 'set' && !prev.merge ? 'set' : input.op,
        merge: prev.op === 'set' && !prev.merge ? false : (input.merge ?? prev.merge ?? true),
        data: { ...(prev.data || {}), ...(input.data || {}) },
        createdAt: nowIso,
      };
    } else {
      queue[existingIdx] = {
        id: `${input.collectionName}_${input.docId}_${Date.now()}`,
        collectionName: input.collectionName,
        docId: input.docId,
        op: input.op,
        data: input.data,
        merge: input.merge ?? true,
        createdAt: nowIso,
        attempts: 0,
      };
    }
  } else {
    queue.push({
      id: `${input.collectionName}_${input.docId}_${Date.now()}`,
      collectionName: input.collectionName,
      docId: input.docId,
      op: input.op,
      data: input.data,
      merge: input.merge ?? true,
      createdAt: nowIso,
      attempts: 0,
    });
  }

  await persistQueue(queue);
}

/**
 * Removes a document write from the outbox if a direct write succeeded.
 */
export async function dequeueSyncOp(collectionName: string, docId: string): Promise<void> {
  const queue = await loadQueue();
  if (queue.length === 0) return;
  const filtered = queue.filter(
    item => !(item.collectionName === collectionName && item.docId === docId)
  );
  if (filtered.length !== queue.length) {
    await persistQueue(filtered);
  }
}

/**
 * Attempts to flush queued writes to Firestore when online and quota allows.
 */
export async function flushSyncOutbox(): Promise<{ flushed: number; remaining: number }> {
  if (typeof window === 'undefined' || isFlushing) {
    const q = await loadQueue();
    return { flushed: 0, remaining: q.length };
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const q = await loadQueue();
    return { flushed: 0, remaining: q.length };
  }

  const queue = [...(await loadQueue())];
  if (queue.length === 0) {
    return { flushed: 0, remaining: 0 };
  }

  isFlushing = true;
  let flushed = 0;
  const remaining: SyncOutboxItem[] = [];

  try {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        const ref = doc(db, item.collectionName, item.docId);
        if (item.op === 'delete') {
          await deleteDoc(ref);
        } else if (item.op === 'update') {
          await setDoc(ref, item.data || {}, { merge: true });
        } else {
          await setDoc(ref, item.data || {}, { merge: item.merge ?? true });
        }
        flushed++;
      } catch (err) {
        if (isTransientFirestoreError(err)) {
          // Stop batch immediately when offline or quota is exhausted; preserve order
          remaining.push(item, ...queue.slice(i + 1));
          break;
        }
        const nextAttempts = (item.attempts || 0) + 1;
        if (nextAttempts < 5) {
          remaining.push({ ...item, attempts: nextAttempts });
        }
        // Drop after 5 non-transient failures so one malformed doc never blocks the queue
      }
    }

    await persistQueue(remaining);
  } finally {
    isFlushing = false;
  }

  return { flushed, remaining: remaining.length };
}

/**
 * Starts background listeners to automatically sync queued offline writes.
 */
export function initSyncOutboxAutoFlush(): () => void {
  if (typeof window === 'undefined' || autoFlushInitialized) {
    return () => {};
  }
  autoFlushInitialized = true;

  const tryFlush = () => {
    flushSyncOutbox().catch(() => {});
  };

  const initialTimer = setTimeout(tryFlush, 4000);
  const periodicTimer = setInterval(tryFlush, 45000);

  const handleOnline = () => tryFlush();
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      tryFlush();
    }
  };

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    autoFlushInitialized = false;
    clearTimeout(initialTimer);
    clearInterval(periodicTimer);
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
