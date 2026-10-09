import realSnapshot from '../data/realFirestoreSnapshot.json';
import { idbGetCollection, idbSaveCollection } from './indexedDbStorage';
import type {
  UserAccount,
  SupervisorProfile,
  StudentProfile,
  LanguageCertificate,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
  Announcement,
  AuditLog,
} from '../types';
import { normalizePhone } from './crypto';

interface StoreData {
  users: UserAccount[];
  supervisors: SupervisorProfile[];
  students: StudentProfile[];
  languageCertificates: LanguageCertificate[];
  projects: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  events: EventItem[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
}

type CollectionKey = keyof StoreData;
type Listener<T = any> = (items: T[]) => void;

/**
 * Ensures all certificates in the registry have 100% unique sequential serial numbers.
 * Resolves any duplicates, missing numbers, or legacy mismatches between DIP and CERT.
 */
export function sanitizeCertificates(certs: CertificateItem[]): { items: CertificateItem[]; hasChanges: boolean } {
  if (!Array.isArray(certs) || certs.length === 0) return { items: certs, hasChanges: false };

  const used = new Set<string>();
  let diplomMax = 1000;
  let certMax = 1000;

  // First pass: detect maximum numbers in active usage
  for (const c of certs) {
    if (!c || !c.certificateNumber) continue;
    const num = c.certificateNumber.trim().toUpperCase();
    const dipMatch = num.match(/^DIP-2026-(\d+)$/);
    if (dipMatch) {
      const v = parseInt(dipMatch[1], 10);
      if (v > diplomMax && v < 90000) diplomMax = v;
    }
    const certMatch = num.match(/^CERT-2026-(\d+)$/);
    if (certMatch) {
      const v = parseInt(certMatch[1], 10);
      if (v > certMax && v < 5000) certMax = v;
    }
  }

  let hasChanges = false;
  const result: CertificateItem[] = [];

  for (const c of certs) {
    if (!c) continue;
    const rawNum = (c.certificateNumber || '').trim().toUpperCase();
    const isDip = c.documentType === 'diplom' || (c.title || '').toLowerCase().includes('diplom');

    let needsRepair = false;
    if (!rawNum) needsRepair = true;
    else if (used.has(rawNum)) needsRepair = true;
    else if (isDip && rawNum.startsWith('CERT-2026-')) needsRepair = true;
    else if (rawNum === 'CERT-2026-5127') needsRepair = true;

    if (needsRepair) {
      hasChanges = true;
      let newNum = '';
      if (isDip) {
        diplomMax++;
        while (used.has(`DIP-2026-${diplomMax}`)) diplomMax++;
        newNum = `DIP-2026-${diplomMax}`;
      } else {
        certMax++;
        while (used.has(`CERT-2026-${certMax}`)) certMax++;
        newNum = `CERT-2026-${certMax}`;
      }
      used.add(newNum);
      result.push({
        ...c,
        certificateNumber: newNum,
        documentType: isDip ? 'diplom' : (c.documentType || 'sertifikat'),
      });
    } else {
      used.add(rawNum);
      result.push(c);
    }
  }

  return { items: result, hasChanges };
}

class OfflineStore {
  private data: StoreData;
  private listeners: Map<CollectionKey, Set<Listener>> = new Map();
  private isHydratedFromIdb = false;

  constructor() {
    const rawCerts = (realSnapshot.certificates as any[]) || [];
    const sanitizedCerts = sanitizeCertificates(rawCerts);

    // 1. Immediately initialize with complete real snapshot so UI is populated on frame 0
    this.data = {
      users: (realSnapshot.users as any[]) || [],
      supervisors: (realSnapshot.supervisors as any[]) || [],
      students: (realSnapshot.students as any[]) || [],
      languageCertificates: (realSnapshot.languageCertificates as any[]) || [],
      projects: (realSnapshot.projects as any[]) || [],
      achievements: (realSnapshot.achievements as any[]) || [],
      certificates: sanitizedCerts.items,
      events: (realSnapshot.events as any[]) || [],
      announcements: (realSnapshot.announcements as any[]) || [],
      auditLogs: (realSnapshot.auditLogs as any[]) || [],
    };

    // 2. Asynchronously hydrate from IndexedDB for any newer locally saved items
    this.hydrateFromIndexedDb().catch(err => {
      console.warn('IDB hydration notice:', err);
    });
  }

  private async hydrateFromIndexedDb() {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    const collections: CollectionKey[] = [
      'users',
      'supervisors',
      'students',
      'languageCertificates',
      'projects',
      'achievements',
      'certificates',
      'events',
      'announcements',
      'auditLogs',
    ];

    let hasUpdates = false;

    for (const col of collections) {
      try {
        const storedItems = await idbGetCollection<any>(col);
        if (storedItems && Array.isArray(storedItems) && storedItems.length > 0) {
          const map = new Map<string, any>();
          // Base data
          for (const item of (this.data[col] as any[])) {
            if (item && item.id) map.set(item.id, item);
          }
          // Stored items overlay
          for (const item of storedItems) {
            if (item && item.id) {
              map.set(item.id, { ...(map.get(item.id) || {}), ...item });
            }
          }

          let finalColItems = Array.from(map.values()) as any[];

          // Guarantee zero duplicate certificate numbers even when restoring older IDB caches
          if (col === 'certificates') {
            const cleanRes = sanitizeCertificates(finalColItems);
            if (cleanRes.hasChanges) {
              finalColItems = cleanRes.items;
              idbSaveCollection('certificates', finalColItems).catch(() => {});
            }
          }

          this.data[col] = finalColItems as any;
          hasUpdates = true;
          this.notify(col);
        } else {
          // If IDB is empty for this collection, seed it with the snapshot
          await idbSaveCollection(col, this.data[col] as any[]);
        }
      } catch (e) {
        console.warn(`Could not hydrate ${col} from IndexedDB:`, e);
      }
    }

    this.isHydratedFromIdb = true;
  }

  private persistCollection<K extends CollectionKey>(key: K) {
    if (typeof window === 'undefined') return;
    try {
      idbSaveCollection(key, this.data[key] as any[]).catch(() => {});
    } catch (e) {
      console.warn(`Persist to IndexedDB error for ${key}:`, e);
    }
  }

  public get<K extends CollectionKey>(key: K): StoreData[K] {
    return [...(this.data[key] as any)];
  }

  public getById<K extends CollectionKey>(key: K, id: string): any | undefined {
    return (this.data[key] as any[]).find(item => item && item.id === id);
  }

  public subscribe<K extends CollectionKey>(
    key: K,
    callback: (items: StoreData[K]) => void
  ): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    set.add(callback as Listener);

    // Call immediately with current state
    try {
      callback([...(this.data[key] as any)]);
    } catch (err) {
      console.error(`Error in initial subscriber for ${key}:`, err);
    }

    return () => {
      set.delete(callback as Listener);
    };
  }

  public notify<K extends CollectionKey>(key: K) {
    const set = this.listeners.get(key);
    if (!set) return;
    const current = [...(this.data[key] as any)];
    for (const cb of set) {
      try {
        cb(current);
      } catch (err) {
        console.error(`Error notifying listener for ${key}:`, err);
      }
    }
  }

  public saveItem<K extends CollectionKey>(key: K, item: any) {
    if (!item || !item.id) return;
    const list = this.data[key] as any[];
    const idx = list.findIndex(i => i && i.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.unshift(item);
    }
    this.persistCollection(key);
    this.notify(key);
  }

  public deleteItem<K extends CollectionKey>(key: K, id: string, soft = true) {
    const list = this.data[key] as any[];
    const idx = list.findIndex(i => i && i.id === id);
    if (idx >= 0) {
      if (soft) {
        list[idx] = {
          ...list[idx],
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        };
      } else {
        list.splice(idx, 1);
      }
      this.persistCollection(key);
      this.notify(key);
    }
  }

  public syncFromFirestore<K extends CollectionKey>(key: K, firestoreItems: any[]) {
    if (!firestoreItems || firestoreItems.length === 0) return;
    const current = this.data[key] as any[];
    const map = new Map<string, any>();

    // Current items first
    for (const item of current) {
      if (item && item.id) map.set(item.id, item);
    }
    // Overlay fresh firestore items
    for (const item of firestoreItems) {
      if (item && item.id) {
        map.set(item.id, { ...(map.get(item.id) || {}), ...item });
      }
    }

    this.data[key] = Array.from(map.values()) as any;
    this.persistCollection(key);
    this.notify(key);
  }

  // Authentication Helpers
  public findUserByPhone(phone: string): UserAccount | undefined {
    const norm = normalizePhone(phone);
    if (!norm) return undefined;
    return this.data.users.find(u => u && normalizePhone(u.phone) === norm && !u.isDeleted);
  }

  public hasSuperAdmin(): boolean {
    return this.data.users.some(
      u => u && (u.role === 'superAdmin' || u.role === 'admin') && u.isActive !== false && !u.isDeleted
    );
  }

  public repairAndDeduplicateCertificates(): { total: number; fixed: number } {
    const current = this.data.certificates;
    const { items, hasChanges } = sanitizeCertificates(current);
    let fixed = 0;
    for (let i = 0; i < current.length; i++) {
      if (current[i].certificateNumber !== items[i]?.certificateNumber) {
        fixed++;
      }
    }
    if (hasChanges || fixed > 0) {
      this.data.certificates = items;
      this.persistCollection('certificates');
      this.notify('certificates');
    }
    return { total: items.length, fixed };
  }

  public resetToSeed(): void {
    this.data = {
      users: (realSnapshot.users as any[]) || [],
      supervisors: (realSnapshot.supervisors as any[]) || [],
      students: (realSnapshot.students as any[]) || [],
      languageCertificates: (realSnapshot.languageCertificates as any[]) || [],
      projects: (realSnapshot.projects as any[]) || [],
      achievements: (realSnapshot.achievements as any[]) || [],
      certificates: (realSnapshot.certificates as any[]) || [],
      events: (realSnapshot.events as any[]) || [],
      announcements: (realSnapshot.announcements as any[]) || [],
      auditLogs: (realSnapshot.auditLogs as any[]) || [],
    };
    for (const key of Object.keys(this.data) as CollectionKey[]) {
      this.persistCollection(key);
      this.notify(key);
    }
  }
}

export const offlineStore = new OfflineStore();
