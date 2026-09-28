/**
 * IndexedDB storage engine for Iqtidorli Talabalar platform.
 * Bypasses the 5MB browser localStorage quota limitation,
 * allowing full persistent storage of all 223+ students, 157+ official certificates,
 * 74+ language certificate PDFs, avatars, and audit logs.
 */

const DB_NAME = 'iqtidorli_university_idb_v1';
const DB_VERSION = 1;
const STORE_NAME = 'collections_store';

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = event => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = err => {
        console.warn('IndexedDB open error (fallback to in-memory):', err);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('IndexedDB blocked');
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB initialization failed:', e);
      resolve(null);
    }
  });
}

export async function idbGetCollection<T = any>(collectionName: string): Promise<T[] | null> {
  const db = await openIDB();
  if (!db) return null;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(collectionName);

      req.onsuccess = () => {
        resolve((req.result as T[]) || null);
      };

      req.onerror = () => {
        resolve(null);
      };
    } catch (err) {
      console.warn(`idbGetCollection error for ${collectionName}:`, err);
      resolve(null);
    }
  });
}

export async function idbSaveCollection<T = any>(
  collectionName: string,
  items: T[]
): Promise<boolean> {
  const db = await openIDB();
  if (!db) return false;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(items, collectionName);

      req.onsuccess = () => {
        resolve(true);
      };

      req.onerror = err => {
        console.warn(`idbSaveCollection error for ${collectionName}:`, err);
        resolve(false);
      };
    } catch (err) {
      console.warn(`idbSaveCollection exception for ${collectionName}:`, err);
      resolve(false);
    }
  });
}

export async function idbClearAll(): Promise<void> {
  const db = await openIDB();
  if (!db) return;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
