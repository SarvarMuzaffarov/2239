import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  StudentProfile,
  SupervisorProfile,
  AdminProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
  EventRegistration,
  Announcement,
  AuditLog,
  UserAccount,
  UserRole,
  TopStudentAssignment,
} from '../types';
import {
  generateSalt,
  hashPassword,
  normalizePhone,
  isValidUzbekPhone,
} from '../lib/crypto';
import { isValidDirection, canonicalizeDirection, getDirectionFilterVariants } from '../constants/directions';

// Helper for timeout protection on async calls
async function withFirestoreTimeout<T>(
  promise: Promise<T>,
  ms: number = 10000,
  errMsg: string = 'Ma’lumotlarni Firestore’ga saqlashda vaqt tugadi. Qayta urinib ko‘ring.'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errMsg)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Safely removes undefined fields from an object to ensure updateDoc / setDoc never throws
 * "Unsupported field value: undefined"
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Helper for audit logging
export async function logAuditAction(
  actor: { id: string; fullName: string; role: UserRole },
  action: string,
  entityType: string,
  entityId: string,
  details: string
) {
  try {
    const logRef = doc(collection(db, 'auditLogs'));
    const log: AuditLog = {
      id: logRef.id,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    await setDoc(logRef, log);
  } catch (err) {
    console.error('Audit log creation failed:', err);
  }
}

function handleSubscriptionError(context: string, error: unknown) {
  const code = (error as any)?.code;
  if (code === 'unavailable' || String(error).includes('offline') || String(error).includes('unavailable')) {
    console.warn(`[Firestore Real-time] ${context} offline/qayta ulanmoqda...`);
  } else {
    console.warn(`[Firestore Real-time] ${context}:`, error);
  }
}

// ----------------- STUDENTS -----------------
export function subscribeStudents(onUpdate: (students: StudentProfile[]) => void): Unsubscribe {
  const colRef = collection(db, 'students');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: StudentProfile[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as StudentProfile);
      });
      // Sort by name
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('students', error);
    }
  );
}

export async function updateStudentProfile(
  studentId: string,
  updates: Partial<StudentProfile>,
  actor?: { id: string; fullName: string; role: UserRole }
) {
  const safeUpdates = { ...updates };
  if (safeUpdates.facultyOrField !== undefined) {
    if (!isValidDirection(safeUpdates.facultyOrField)) {
      throw new Error("Noto'g'ri ta'lim yo'nalishi. Faqat rasmiy 18 ta yo'nalishdan birini tanlang.");
    }
    safeUpdates.facultyOrField = canonicalizeDirection(safeUpdates.facultyOrField);
  }

  const ref = doc(db, 'students', studentId);
  const cleanedUpdates = removeUndefinedFields({
    ...safeUpdates,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(ref, cleanedUpdates);

  if (actor) {
    await logAuditAction(
      actor,
      "Talaba profilini yangilash",
      'students',
      studentId,
      `Talaba profili tahrirlandi: ${updates.fullName || studentId}`
    );
  }
}

export async function assignStudentSupervisor(
  studentId: string,
  supervisorId: string,
  actor: { id: string; fullName: string; role: UserRole }
) {
  const ref = doc(db, 'students', studentId);
  await updateDoc(ref, {
    supervisorId,
    customSupervisorName: '',
    updatedAt: new Date().toISOString(),
  });

  await logAuditAction(
    actor,
    "Ilmiy rahbar biriktirish",
    'students',
    studentId,
    `Talabaga yangi ilmiy rahbar biriktirildi (Supervisor ID: ${supervisorId})`
  );
}

export async function deleteStudent(
  studentId: string,
  userId: string,
  actor: { id: string; fullName: string; role: UserRole }
) {
  await softDeleteDocument('students', studentId, 'Talaba', actor);
  if (userId) {
    await softDeleteDocument('users', userId, 'Talaba hisobi', actor);
  }
}

// ----------------- SUPERVISORS -----------------
export function subscribeSupervisors(onUpdate: (supervisors: SupervisorProfile[]) => void): Unsubscribe {
  const colRef = collection(db, 'supervisors');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: SupervisorProfile[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as SupervisorProfile);
      });
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('supervisors', error);
    }
  );
}

export async function createSupervisorDoc(
  data: Omit<SupervisorProfile, 'id' | 'createdAt'>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<string> {
  const ref = doc(collection(db, 'supervisors'));
  const supervisor: SupervisorProfile = {
    ...data,
    id: ref.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, supervisor);

  await logAuditAction(
    actor,
    "Ilmiy rahbar qo'shish",
    'supervisors',
    ref.id,
    `Yangi ilmiy rahbar qo'shildi: ${data.fullName}`
  );
  return ref.id;
}

export async function updateSupervisorDoc(
  id: string,
  updates: Partial<SupervisorProfile>,
  actor: { id: string; fullName: string; role: UserRole }
) {
  const ref = doc(db, 'supervisors', id);
  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(ref, cleanedUpdates);
  await logAuditAction(
    actor,
    "Ilmiy rahbarni tahrirlash",
    'supervisors',
    id,
    `Ilmiy rahbar ma'lumotlari yangilandi: ${updates.fullName || id}`
  );
}

export async function deleteSupervisorDoc(
  id: string,
  actor: { id: string; fullName: string; role: UserRole },
  userId?: string
) {
  await softDeleteDocument('supervisors', id, 'Ilmiy rahbar', actor);
  if (userId) {
    await softDeleteDocument('users', userId, 'Ilmiy rahbar hisobi', actor);
  }
}

// ----------------- PROJECTS & STARTUPS -----------------
export function subscribeProjectsAndStartups(
  onUpdate: (items: ProjectOrStartup[]) => void
): Unsubscribe {
  const colRef = collection(db, 'projects');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: ProjectOrStartup[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ProjectOrStartup);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('projects/startups', error);
    }
  );
}

export async function createProjectOrStartup(
  data: Omit<ProjectOrStartup, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = doc(collection(db, 'projects'));
  const item: ProjectOrStartup = {
    ...data,
    id: ref.id,
    status: 'Kutilmoqda',
    createdAt: new Date().toISOString(),
  };
  await withFirestoreTimeout(
    setDoc(ref, item),
    12000,
    'Loyiha/Startap ma’lumotlarini saqlashda vaqt tugadi. Qayta urinib ko‘ring.'
  );
  return ref.id;
}

export async function updateProjectStatus(
  id: string,
  status: 'Tasdiqlangan' | 'Rad etilgan',
  notesOrActor?: string | { id?: string; fullName?: string; role?: UserRole },
  actorOrActorName?: { id?: string; fullName?: string; role?: UserRole } | string,
  maybeActorName?: string
) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error("Loyiha identifikatori (ID) ko'rsatilmagan.");
  }

  let notes = '';
  let adminUid = '';
  let adminName = '';
  let adminRole: UserRole = 'admin';

  if (notesOrActor && typeof notesOrActor === 'object') {
    adminUid = notesOrActor.id || '';
    adminName = notesOrActor.fullName || '';
    adminRole = notesOrActor.role || 'admin';
    if (typeof actorOrActorName === 'string') notes = actorOrActorName;
  } else if (actorOrActorName && typeof actorOrActorName === 'object') {
    notes = typeof notesOrActor === 'string' ? notesOrActor : '';
    adminUid = actorOrActorName.id || '';
    adminName = actorOrActorName.fullName || '';
    adminRole = actorOrActorName.role || 'admin';
  } else if (typeof notesOrActor === 'string' && typeof actorOrActorName === 'string' && typeof maybeActorName === 'string') {
    notes = notesOrActor;
    adminUid = actorOrActorName;
    adminName = maybeActorName;
  } else if (typeof notesOrActor === 'string' && typeof actorOrActorName === 'string') {
    adminUid = notesOrActor;
    adminName = actorOrActorName;
  }

  if (!adminUid || !adminUid.trim()) {
    throw new Error(
      "Admin identifikatori (UID) aniqlanmadi. Noto‘g‘ri ma’lumot yozilmasligi uchun tasdiqlash to‘xtatildi. Iltimos, tizimga qayta kiring."
    );
  }

  const cleanAdminUid = adminUid.trim();
  const cleanAdminName = (adminName || 'Admin').trim();
  const cleanNotes = (notes || '').trim();
  const timestampIso = new Date().toISOString();

  const ref = doc(db, 'projects', id);
  const updatePayload = removeUndefinedFields({
    status,
    reviewNotes: cleanNotes,
    reviewedAt: timestampIso,
    reviewedBy: cleanAdminUid,
    reviewedByName: cleanAdminName,
    updatedAt: timestampIso,
  });

  await withFirestoreTimeout(
    updateDoc(ref, updatePayload),
    12000,
    'Loyiha holatini yangilashda vaqt tugadi. Qayta urinib ko‘ring.'
  );

  await logAuditAction(
    { id: cleanAdminUid, fullName: cleanAdminName, role: adminRole },
    status === 'Tasdiqlangan' ? "Loyihani tasdiqlash" : "Loyihani rad etish",
    'projects',
    id,
    `Status o'zgartirildi: ${status}. Tasdiqlovchi UID: ${cleanAdminUid} (${cleanAdminName}). Izoh: ${cleanNotes || 'Izohsiz'}`
  );
}

export async function updateProjectOrStartup(
  id: string,
  updates: Partial<ProjectOrStartup>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  if (!id || !id.trim()) {
    throw new Error("Loyiha ID ko'rsatilmadi.");
  }
  const ref = doc(db, 'projects', id);
  const now = new Date().toISOString();
  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: now,
  });

  await withFirestoreTimeout(
    updateDoc(ref, cleanedUpdates),
    12000,
    "Loyiha ma'lumotlarini yangilashda vaqt tugadi. Qayta urinib ko'ring."
  );

  await logAuditAction(
    actor,
    "Loyihani tahrirlash",
    'projects',
    id,
    `Loyiha (${updates.title || id}) yangilandi. Amal bajargan: ${actor.fullName} (${actor.role})`
  );
}

export async function deleteProjectOrStartup(
  id: string,
  actor: { id: string; fullName: string; role: UserRole }
) {
  await softDeleteDocument('projects', id, 'Loyiha/Startap', actor);
}

// ----------------- ACHIEVEMENTS -----------------
export function subscribeAchievements(onUpdate: (items: Achievement[]) => void): Unsubscribe {
  const colRef = collection(db, 'achievements');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: Achievement[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Achievement);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('achievements', error);
    }
  );
}

export async function createAchievement(
  data: Omit<Achievement, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const ref = doc(collection(db, 'achievements'));
  const item: Achievement = {
    ...data,
    id: ref.id,
    status: 'Kutilmoqda',
    createdAt: new Date().toISOString(),
  };
  await withFirestoreTimeout(
    setDoc(ref, item),
    12000,
    'Yutuq ma’lumotlarini saqlashda vaqt tugadi. Qayta urinib ko‘ring.'
  );
  return ref.id;
}

export async function updateAchievementStatus(
  id: string,
  status: 'Tasdiqlangan' | 'Rad etilgan',
  notesOrActor?: string | { id?: string; fullName?: string; role?: UserRole },
  actorOrActorName?: { id?: string; fullName?: string; role?: UserRole } | string,
  maybeActorName?: string
) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error("Yutuq identifikatori (ID) ko'rsatilmagan.");
  }

  let notes = '';
  let adminUid = '';
  let adminName = '';
  let adminRole: UserRole = 'admin';

  // Case 1: notesOrActor is an object (actor: { id, fullName, role })
  if (notesOrActor && typeof notesOrActor === 'object') {
    adminUid = notesOrActor.id || '';
    adminName = notesOrActor.fullName || '';
    adminRole = notesOrActor.role || 'admin';
    if (typeof actorOrActorName === 'string') {
      notes = actorOrActorName;
    }
  }
  // Case 2: actorOrActorName is an object (actor: { id, fullName, role })
  else if (actorOrActorName && typeof actorOrActorName === 'object') {
    notes = typeof notesOrActor === 'string' ? notesOrActor : '';
    adminUid = actorOrActorName.id || '';
    adminName = actorOrActorName.fullName || '';
    adminRole = actorOrActorName.role || 'admin';
  }
  // Case 3: (id, status, notes, actorId, actorName)
  else if (typeof notesOrActor === 'string' && typeof actorOrActorName === 'string' && typeof maybeActorName === 'string') {
    notes = notesOrActor;
    adminUid = actorOrActorName;
    adminName = maybeActorName;
  }
  // Case 4: (id, status, actorId, actorName)
  else if (typeof notesOrActor === 'string' && typeof actorOrActorName === 'string') {
    adminUid = notesOrActor;
    adminName = actorOrActorName;
    notes = '';
  }

  // Requirement 9: If Admin or Super Admin cannot be determined, throw a clear error instead of writing invalid data or calling updateDoc()
  if (!adminUid || !adminUid.trim()) {
    throw new Error(
      "Admin yoki Super Admin identifikatori (UID) aniqlanmadi. Noto‘g‘ri ma’lumot yozilmasligi uchun tasdiqlash to‘xtatildi. Iltimos, tizimga qayta kiring."
    );
  }

  const cleanAdminUid = adminUid.trim();
  const cleanAdminName = (adminName || 'Admin').trim();
  const cleanNotes = (notes || '').trim();
  const timestampIso = new Date().toISOString();

  const ref = doc(db, 'achievements', id);
  const updatePayload = removeUndefinedFields({
    status,
    reviewNotes: cleanNotes,
    reviewedAt: timestampIso,
    reviewedBy: cleanAdminUid, // Stores the real Admin/Super Admin UID
    reviewedByName: cleanAdminName, // Stores the Admin full name
    updatedAt: timestampIso,
  });

  await withFirestoreTimeout(
    updateDoc(ref, updatePayload),
    12000,
    'Yutuq holatini yangilashda vaqt tugadi. Qayta urinib ko‘ring.'
  );

  await logAuditAction(
    { id: cleanAdminUid, fullName: cleanAdminName, role: adminRole },
    status === 'Tasdiqlangan' ? "Yutuqni tasdiqlash" : "Yutuqni rad etish",
    'achievements',
    id,
    `Yutuq holati: ${status}. Tasdiqlovchi UID: ${cleanAdminUid} (${cleanAdminName}). Izoh: ${cleanNotes || 'Izohsiz'}`
  );
}

export async function deleteAchievement(
  id: string,
  actor: { id: string; fullName: string; role: UserRole }
) {
  await softDeleteDocument('achievements', id, 'Yutuq', actor);
}

// ----------------- CERTIFICATES -----------------
export function subscribeCertificates(onUpdate: (items: CertificateItem[]) => void): Unsubscribe {
  const colRef = collection(db, 'certificates');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: CertificateItem[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CertificateItem);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('certificates', error);
    }
  );
}

export async function createCertificateDoc(
  data: Omit<CertificateItem, 'id' | 'createdAt'>,
  actor?: { id: string; fullName: string; role: UserRole }
): Promise<string> {
  const ref = doc(collection(db, 'certificates'));
  const cert: CertificateItem = {
    ...data,
    id: ref.id,
    createdAt: new Date().toISOString(),
  };
  await withFirestoreTimeout(
    setDoc(ref, cert),
    12000,
    'Sertifikat ma’lumotlarini saqlashda vaqt tugadi. Qayta urinib ko‘ring.'
  );

  if (actor) {
    await logAuditAction(
      actor,
      "Sertifikat yaratish",
      'certificates',
      ref.id,
      `Sertifikat rasmiylashtirildi: ${data.certificateNumber} (${data.studentName})`
    );
  }
  return ref.id;
}

export async function updateCertificateStatus(
  id: string,
  status: 'Tasdiqlangan' | 'Rad etilgan',
  actorOrActorId: { id?: string; fullName?: string; role?: UserRole } | string,
  maybeActorName?: string
) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error("Sertifikat identifikatori (ID) ko'rsatilmagan.");
  }

  let adminUid = '';
  let adminName = '';
  let adminRole: UserRole = 'admin';

  if (actorOrActorId && typeof actorOrActorId === 'object') {
    adminUid = actorOrActorId.id || '';
    adminName = actorOrActorId.fullName || '';
    adminRole = actorOrActorId.role || 'admin';
  } else if (typeof actorOrActorId === 'string') {
    adminUid = actorOrActorId;
    adminName = maybeActorName || 'Admin';
  }

  if (!adminUid || !adminUid.trim()) {
    throw new Error(
      "Admin identifikatori (UID) aniqlanmadi. Noto‘g‘ri ma’lumot yozilmasligi uchun tasdiqlash to‘xtatildi. Iltimos, qayta kiring."
    );
  }

  const cleanAdminUid = adminUid.trim();
  const cleanAdminName = (adminName || 'Admin').trim();
  const timestampIso = new Date().toISOString();

  const ref = doc(db, 'certificates', id);
  const updatePayload = removeUndefinedFields({
    status,
    reviewedAt: timestampIso,
    reviewedBy: cleanAdminUid,
    reviewedByName: cleanAdminName,
    updatedAt: timestampIso,
  });

  await withFirestoreTimeout(
    updateDoc(ref, updatePayload),
    12000,
    'Sertifikat holatini yangilashda vaqt tugadi. Qayta urinib ko‘ring.'
  );

  await logAuditAction(
    { id: cleanAdminUid, fullName: cleanAdminName, role: adminRole },
    status === 'Tasdiqlangan' ? "Sertifikatni tasdiqlash" : "Sertifikatni rad etish",
    'certificates',
    id,
    `Sertifikat statusi: ${status}. Tasdiqlovchi UID: ${cleanAdminUid} (${cleanAdminName})`
  );
}

export async function deleteCertificateDoc(
  id: string,
  actor: { id: string; fullName: string; role: UserRole }
) {
  await softDeleteDocument('certificates', id, 'Sertifikat', actor);
}

export async function getCertificateByNumber(certInput: string): Promise<CertificateItem | null> {
  if (!certInput) return null;
  let cleanInput = certInput.trim();

  // If user pasted a full URL or path, extract the certificate ID
  if (cleanInput.includes('verify/')) {
    cleanInput = cleanInput.split('verify/').pop()?.split('?')[0]?.split('#')[0] || cleanInput;
  } else if (cleanInput.includes('verify=')) {
    cleanInput = cleanInput.split('verify=').pop()?.split('&')[0]?.split('#')[0] || cleanInput;
  }
  cleanInput = decodeURIComponent(cleanInput).trim();
  const upper = cleanInput.toUpperCase();

  // Try uppercase query
  const qUpper = query(
    collection(db, 'certificates'),
    where('certificateNumber', '==', upper)
  );
  const snapUpper = await getDocs(qUpper);
  if (!snapUpper.empty) {
    const d = snapUpper.docs[0];
    return { id: d.id, ...d.data() } as CertificateItem;
  }

  // Try exact match if different
  if (cleanInput !== upper) {
    const qExact = query(
      collection(db, 'certificates'),
      where('certificateNumber', '==', cleanInput)
    );
    const snapExact = await getDocs(qExact);
    if (!snapExact.empty) {
      const d = snapExact.docs[0];
      return { id: d.id, ...d.data() } as CertificateItem;
    }
  }

  // Try matching directly by doc ID
  try {
    const directSnap = await getDoc(doc(db, 'certificates', cleanInput));
    if (directSnap.exists()) {
      return { id: directSnap.id, ...directSnap.data() } as CertificateItem;
    }
  } catch (_) {
    // Ignore invalid doc id syntax
  }

  return null;
}

// ----------------- EVENTS -----------------
export function subscribeEvents(onUpdate: (items: EventItem[]) => void): Unsubscribe {
  const colRef = collection(db, 'events');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: EventItem[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as EventItem);
      });
      list.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('events', error);
    }
  );
}

export async function createEventDoc(
  data: Omit<EventItem, 'id' | 'createdAt' | 'participantIds'>,
  actorOrId: { id: string; fullName: string; role?: UserRole } | string,
  actorName?: string
): Promise<string> {
  const actor = typeof actorOrId === 'string'
    ? { id: actorOrId, fullName: actorName || 'Admin', role: 'admin' as UserRole }
    : { id: actorOrId.id, fullName: actorOrId.fullName, role: actorOrId.role || ('admin' as UserRole) };

  const ref = doc(collection(db, 'events'));
  const ev: EventItem = {
    ...data,
    id: ref.id,
    participantIds: [],
    createdAt: new Date().toISOString(),
    createdBy: actor.fullName,
  };
  await setDoc(ref, ev);
  await logAuditAction(
    actor,
    "Tadbir yaratish",
    'events',
    ref.id,
    `Yangi tadbir e'lon qilindi: ${data.title}`
  );
  return ref.id;
}

export async function updateEventDoc(
  id: string,
  updates: Partial<EventItem>,
  actor: { id: string; fullName: string; role: UserRole }
) {
  const ref = doc(db, 'events', id);
  await updateDoc(ref, updates);
  await logAuditAction(
    actor,
    "Tadbirni tahrirlash",
    'events',
    id,
    `Tadbir yangilandi: ${updates.title || id}`
  );
}

export async function registerStudentForEvent(
  eventId: string,
  studentId: string,
  studentData?: Partial<StudentProfile>,
  supervisorName?: string,
  projectInfo?: { projectId?: string; projectTitle: string; projectDescription?: string; projectFileUrl?: string }
): Promise<boolean> {
  const regId = `${eventId}_${studentId}`;
  const regRef = doc(db, 'eventRegistrations', regId);

  // If studentData isn't fully provided, try to fetch from students doc
  let studentName = studentData?.fullName || '';
  let studentPhone = studentData?.phone || '';
  let studentCourse = studentData?.course || 1;
  let studentGroup = studentData?.group || '';
  let studentFaculty = studentData?.facultyOrField || '';
  let supId = studentData?.supervisorId || '';
  let supName = supervisorName || studentData?.customSupervisorName || '';

  if (!studentName && studentId) {
    try {
      const sSnap = await getDoc(doc(db, 'students', studentId));
      if (sSnap.exists()) {
        const s = sSnap.data() as StudentProfile;
        studentName = s.fullName || '';
        studentPhone = s.phone || '';
        studentCourse = s.course || 1;
        studentGroup = s.group || '';
        studentFaculty = s.facultyOrField || '';
        supId = s.supervisorId || '';
        supName = supName || s.customSupervisorName || '';
      }
    } catch (e) {
      console.warn('Could not fetch student doc during event registration:', e);
    }
  }

  // 1. Create or overwrite document in eventRegistrations collection
  const isCompetitionWithProject = Boolean(projectInfo?.projectId || projectInfo?.projectTitle);
  const initialStatus = isCompetitionWithProject ? 'Kutilmoqda' : 'Tasdiqlangan';

  const regDoc: EventRegistration = {
    id: regId,
    eventId,
    studentId,
    registeredAt: new Date().toISOString(),
    status: initialStatus,
    applicationStatus: initialStatus,
    studentName,
    studentPhone,
    studentCourse,
    studentGroup,
    studentFaculty,
    supervisorId: supId,
    supervisorName: supName,
    ...(isCompetitionWithProject && projectInfo
      ? {
          projectId: projectInfo.projectId || '',
          projectTitle: projectInfo.projectTitle || '',
          projectDescription: projectInfo.projectDescription || '',
        }
      : {}),
  };
  await setDoc(regRef, regDoc, { merge: true });

  // 2. Also keep event's participantIds array in sync for real-time counters
  const ref = doc(db, 'events', eventId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const current = snap.data() as EventItem;
    const currentParticipants = current.participantIds || [];
    if (!currentParticipants.includes(studentId)) {
      await updateDoc(ref, {
        participantIds: [...currentParticipants, studentId],
      });
    }
  }
  return true;
}

export async function updateEventRegistrationStatus(
  regId: string,
  status: 'Tasdiqlangan' | 'Rad etilgan' | 'Kutilmoqda',
  rejectionReason: string,
  actorOrId: { id: string; fullName: string; role?: UserRole } | string,
  actorName?: string
): Promise<void> {
  const actor = typeof actorOrId === 'string'
    ? { id: actorOrId, fullName: actorName || 'Admin', role: 'admin' as UserRole }
    : { id: actorOrId.id, fullName: actorOrId.fullName, role: actorOrId.role || ('admin' as UserRole) };

  const ref = doc(db, 'eventRegistrations', regId);
  await updateDoc(ref, {
    status,
    applicationStatus: status,
    rejectionReason: rejectionReason || '',
    reviewNotes: rejectionReason || '',
    reviewedAt: new Date().toISOString(),
    reviewedBy: actor.fullName,
  });

  await logAuditAction(
    actor,
    "Tanlov arizasi ko'rib chiqildi",
    'eventRegistrations',
    regId,
    `Holat: ${status}. Izoh: ${rejectionReason || 'Izohsiz'}`
  );
}

export async function unregisterStudentFromEvent(
  eventId: string,
  studentId: string
): Promise<void> {
  // 1. Delete from eventRegistrations collection
  const regId = `${eventId}_${studentId}`;
  try {
    await deleteDoc(doc(db, 'eventRegistrations', regId));
  } catch (e) {
    console.warn('Error deleting event registration doc:', e);
  }

  // 2. Remove studentId from event's participantIds array
  const ref = doc(db, 'events', eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = snap.data() as EventItem;
  const updated = (current.participantIds || []).filter(id => id !== studentId);
  await updateDoc(ref, {
    participantIds: updated,
  });
}

/**
 * Real-time listener for registrations of a specific event
 */
export function subscribeEventRegistrations(
  eventId: string,
  onUpdate: (regs: EventRegistration[]) => void
): Unsubscribe {
  const colRef = collection(db, 'eventRegistrations');
  const q = query(colRef, where('eventId', '==', eventId));
  return onSnapshot(
    q,
    snapshot => {
      const list: EventRegistration[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as EventRegistration);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());
      onUpdate(list);
    },
    error => {
      handleSubscriptionError(`eventRegistrations (${eventId})`, error);
    }
  );
}

/**
 * Fetch registrations for an event once, with auto-fallback to event.participantIds
 */
export async function getEventRegistrations(
  eventId: string,
  allStudents?: StudentProfile[]
): Promise<EventRegistration[]> {
  try {
    const q = query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    const regs: EventRegistration[] = [];
    snap.forEach(d => {
      regs.push({ id: d.id, ...d.data() } as EventRegistration);
    });

    if (regs.length > 0) {
      return regs;
    }

    // Fallback: check event doc's participantIds
    const eventSnap = await getDoc(doc(db, 'events', eventId));
    if (!eventSnap.exists()) return [];
    const eventData = eventSnap.data() as EventItem;
    const pIds = eventData.participantIds || [];
    if (pIds.length === 0) return [];

    const fallbackList: EventRegistration[] = [];
    for (const sid of pIds) {
      const foundStudent = allStudents?.find(s => s.id === sid);
      fallbackList.push({
        id: `${eventId}_${sid}`,
        eventId,
        studentId: sid,
        registeredAt: eventData.createdAt || new Date().toISOString(),
        status: 'Tasdiqlangan',
        studentName: foundStudent?.fullName,
        studentPhone: foundStudent?.phone,
        studentCourse: foundStudent?.course,
        studentGroup: foundStudent?.group,
        studentFaculty: foundStudent?.facultyOrField,
      });
    }
    return fallbackList;
  } catch (err) {
    console.error('Error fetching event registrations:', err);
    return [];
  }
}

export async function deleteEventDoc(
  id: string,
  actorOrId: { id: string; fullName: string; role?: UserRole } | string,
  actorName?: string
) {
  const actor = typeof actorOrId === 'string'
    ? { id: actorOrId, fullName: actorName || 'Admin', role: 'admin' as UserRole }
    : { id: actorOrId.id, fullName: actorOrId.fullName, role: actorOrId.role || ('admin' as UserRole) };

  await deleteDoc(doc(db, 'events', id));
  await logAuditAction(
    actor,
    "Tadbirni o'chirish",
    'events',
    id,
    `Tadbir o'chirildi.`
  );
}

// ----------------- ANNOUNCEMENTS -----------------
export function subscribeAnnouncements(onUpdate: (items: Announcement[]) => void): Unsubscribe {
  const colRef = collection(db, 'announcements');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: Announcement[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('announcements', error);
    }
  );
}

export async function createAnnouncementDoc(
  data: Omit<Announcement, 'id' | 'createdAt'>,
  actorOrId: { id: string; fullName: string; role?: UserRole } | string,
  actorName?: string
): Promise<string> {
  const actor = typeof actorOrId === 'string'
    ? { id: actorOrId, fullName: actorName || 'Admin', role: 'admin' as UserRole }
    : { id: actorOrId.id, fullName: actorOrId.fullName, role: actorOrId.role || ('admin' as UserRole) };

  const ref = doc(collection(db, 'announcements'));
  const ann: Announcement = {
    ...data,
    id: ref.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, ann);
  await logAuditAction(
    actor,
    "E'lon yaratish",
    'announcements',
    ref.id,
    `Yangi e'lon joylandi: ${data.title}`
  );
  return ref.id;
}

export async function updateAnnouncementDoc(
  id: string,
  updates: Partial<Announcement>,
  actorOrId: { id: string; fullName: string; role?: UserRole } | string,
  actorName?: string
): Promise<void> {
  const actor = typeof actorOrId === 'string'
    ? { id: actorOrId, fullName: actorName || 'Admin', role: 'admin' as UserRole }
    : { id: actorOrId.id, fullName: actorOrId.fullName, role: actorOrId.role || ('admin' as UserRole) };

  const ref = doc(db, 'announcements', id);
  const cleanUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(ref, cleanUpdates);
  await logAuditAction(
    actor,
    "E'lonni tahrirlash",
    'announcements',
    id,
    `E'lon yangilandi: ${updates.title || id}`
  );
}

export async function deleteAnnouncementDoc(
  id: string,
  actorOrId: { id: string; fullName: string; role?: UserRole } | string,
  actorName?: string
) {
  const actor = typeof actorOrId === 'string'
    ? { id: actorOrId, fullName: actorName || 'Admin', role: 'admin' as UserRole }
    : { id: actorOrId.id, fullName: actorOrId.fullName, role: actorOrId.role || ('admin' as UserRole) };

  await deleteDoc(doc(db, 'announcements', id));
  await logAuditAction(
    actor,
    "E'lonni o'chirish",
    'announcements',
    id,
    `E'lon o'chirildi.`
  );
}

export interface PaginatedStudentsOptions {
  pageSize?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  courseFilter?: string;
  supervisorFilter?: string;
  facultyFilter?: string;
  searchQuery?: string;
}

export interface PaginatedStudentsResult {
  students: StudentProfile[];
  totalCount: number;
  firstDoc: QueryDocumentSnapshot<DocumentData> | null;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Server-side / query-level paginated fetch for students collection.
 * Uses limit(20) and startAfter cursor.
 * Uses getCountFromServer for total count aggregation without downloading all docs.
 */
export async function fetchStudentsPaginated(
  options: PaginatedStudentsOptions = {}
): Promise<PaginatedStudentsResult> {
  const pageSize = options.pageSize || 20;
  const constraints: any[] = [];

  if (options.courseFilter && options.courseFilter !== 'all') {
    constraints.push(where('course', '==', Number(options.courseFilter)));
  }
  if (options.supervisorFilter && options.supervisorFilter !== 'all') {
    constraints.push(where('supervisorId', '==', options.supervisorFilter));
  }
  if (options.facultyFilter && options.facultyFilter !== 'all') {
    const variants = getDirectionFilterVariants(options.facultyFilter);
    if (variants.length === 1) {
      constraints.push(where('facultyOrField', '==', variants[0]));
    } else if (variants.length > 1) {
      constraints.push(where('facultyOrField', 'in', variants.slice(0, 10)));
    }
  }

  // 1. Efficient total count aggregation (downloads 0 document contents)
  let totalCount = 0;
  try {
    const countQuery = query(collection(db, 'students'), ...constraints);
    const countSnap = await getCountFromServer(countQuery);
    totalCount = countSnap.data().count;
  } catch (err) {
    console.warn('Count aggregation notice, falling back:', err);
  }

  // 2. Build paginated query with limit(20)
  const queryConstraints: any[] = [
    ...constraints,
    orderBy('fullName', 'asc'),
  ];

  if (options.startAfterDoc) {
    queryConstraints.push(startAfter(options.startAfterDoc));
  }

  queryConstraints.push(limit(pageSize));

  const q = query(collection(db, 'students'), ...queryConstraints);
  const snap = await getDocs(q);

  let students: StudentProfile[] = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as StudentProfile))
    .filter(s => !s.isDeleted);

  // If searchQuery provided, filter client-side within the targeted query window or adjust
  const searchQ = (options.searchQuery || '').trim().toLowerCase();
  if (searchQ) {
    students = students.filter(s => {
      const matchName = (s.fullName || '').toLowerCase().includes(searchQ);
      const matchPhone = (s.phone || '').includes(searchQ);
      const matchGroup = (s.group || '').toLowerCase().includes(searchQ);
      const matchFaculty = (s.facultyOrField || '').toLowerCase().includes(searchQ);
      const matchSupervisor = (s.customSupervisorName || '').toLowerCase().includes(searchQ);
      return matchName || matchPhone || matchGroup || matchFaculty || matchSupervisor;
    });
  }

  const firstDoc = snap.docs.length > 0 ? snap.docs[0] : null;
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  const hasMore = snap.docs.length === pageSize;

  return {
    students,
    totalCount: totalCount || snap.docs.length,
    firstDoc,
    lastDoc,
    hasMore,
  };
}

// ----------------- AUDIT LOGS -----------------
export function subscribeAuditLogs(onUpdate: (logs: AuditLog[]) => void): Unsubscribe {
  const colRef = collection(db, 'auditLogs');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: AuditLog[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
      });
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('auditLogs', error);
    }
  );
}

// ----------------- USERS & ADMINS -----------------
export function subscribeUsers(onUpdate: (users: UserAccount[]) => void): Unsubscribe {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: UserAccount[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as UserAccount);
      });
      onUpdate(list);
    },
    error => {
      handleSubscriptionError('users', error);
    }
  );
}

export async function toggleUserActiveStatus(
  userId: string,
  currentStatus: boolean,
  actor: { id: string; fullName: string; role: UserRole }
) {
  const newStatus = !currentStatus;
  await updateDoc(doc(db, 'users', userId), {
    isActive: newStatus,
    updatedAt: new Date().toISOString(),
  });
  await logAuditAction(
    actor,
    newStatus ? "Foydalanuvchini faollashtirish" : "Foydalanuvchini bloklash",
    'users',
    userId,
    `Foydalanuvchi holati ${newStatus ? 'Faol' : 'Bloklangan'} ga o'zgartirildi.`
  );
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  actor: { id: string; fullName: string; role: UserRole }
) {
  await updateDoc(doc(db, 'users', userId), {
    role: newRole,
    updatedAt: new Date().toISOString(),
  });
  await logAuditAction(
    actor,
    "Foydalanuvchi rolini o'zgartirish",
    'users',
    userId,
    `Foydalanuvchi roli ${newRole} ga o'zgartirildi.`
  );
}

export async function deleteUserAccount(
  userId: string,
  actor: { id: string; fullName: string; role: UserRole }
) {
  await deleteDoc(doc(db, 'users', userId));
  await logAuditAction(
    actor,
    "Foydalanuvchini o'chirish",
    'users',
    userId,
    `Foydalanuvchi akkaunti butunlay o'chirildi.`
  );
}

// ----------------- GENERIC REAL-TIME LISTENER -----------------
export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    snapshot => {
      const list: T[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      onUpdate(list);
    },
    error => {
      handleSubscriptionError(collectionName, error);
    }
  );
}

// ----------------- ALIASES AND COMPONENT WRAPPERS -----------------
export const updateProjectOrStartupStatus = async (
  id: string,
  status: 'Tasdiqlangan' | 'Rad etilgan',
  notes: string,
  actorId: string,
  actorName: string
) => {
  return updateProjectStatus(id, status, notes, { id: actorId, fullName: actorName, role: 'admin' });
};

export const updateAchievementDocStatus = async (
  id: string,
  status: 'Tasdiqlangan' | 'Rad etilgan',
  notes: string,
  actorId: string,
  actorName: string
) => {
  return updateAchievementStatus(id, status, notes, { id: actorId, fullName: actorName, role: 'admin' });
};

export const updateCertificateDocStatus = async (
  id: string,
  status: 'Tasdiqlangan' | 'Rad etilgan',
  actorId: string,
  actorName: string
) => {
  return updateCertificateStatus(id, status, { id: actorId, fullName: actorName, role: 'admin' });
};

export const assignSupervisorToStudent = async (
  studentId: string,
  supervisorId: string,
  actorId: string,
  actorName: string
) => {
  return assignStudentSupervisor(studentId, supervisorId, {
    id: actorId,
    fullName: actorName,
    role: 'admin',
  });
};

export const deleteStudentProfile = async (
  studentId: string,
  actorOrId: { id: string; fullName: string; role: UserRole } | string,
  actorName?: string,
  userId?: string
) => {
  let actor: { id: string; fullName: string; role: UserRole };
  if (typeof actorOrId === 'object' && actorOrId !== null) {
    actor = actorOrId;
  } else {
    const aid = typeof actorOrId === 'string' ? actorOrId : 'admin';
    actor = {
      id: aid,
      fullName: actorName || aid || 'Admin',
      role: 'admin',
    };
  }

  let resolvedUserId = userId || '';
  if (!resolvedUserId) {
    try {
      const studentSnap = await getDoc(doc(db, 'students', studentId));
      if (studentSnap.exists()) {
        resolvedUserId = studentSnap.data()?.userId || '';
      }
    } catch (e) {
      console.warn('Could not fetch student doc for userId:', e);
    }
  }

  return deleteStudent(studentId, resolvedUserId, actor);
};

export const createSupervisorProfile = async (
  data: Omit<SupervisorProfile, 'id' | 'createdAt'>,
  password: string,
  actorId: string,
  actorName: string
) => {
  const ref = doc(collection(db, 'supervisors'));
  const supervisor: SupervisorProfile = {
    ...data,
    id: ref.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, supervisor);

  await logAuditAction(
    { id: actorId, fullName: actorName, role: 'admin' },
    "Ilmiy rahbar qo'shish",
    'supervisors',
    ref.id,
    `Yangi ilmiy rahbar qo'shildi: ${data.fullName}`
  );
  return supervisor;
};

export const updateSupervisorProfile = async (
  id: string,
  updates: Partial<SupervisorProfile>,
  actorId: string,
  actorName: string
) => {
  return updateSupervisorDoc(id, updates, { id: actorId, fullName: actorName, role: 'admin' });
};

export const deleteSupervisorProfile = async (
  id: string,
  actorOrId: { id: string; fullName: string; role: UserRole } | string,
  actorName?: string
) => {
  let actor: { id: string; fullName: string; role: UserRole };
  if (typeof actorOrId === 'object' && actorOrId !== null) {
    actor = actorOrId;
  } else {
    const aid = typeof actorOrId === 'string' ? actorOrId : 'admin';
    actor = {
      id: aid,
      fullName: actorName || aid || 'Admin',
      role: 'admin',
    };
  }

  let resolvedUserId = '';
  try {
    const supSnap = await getDoc(doc(db, 'supervisors', id));
    if (supSnap.exists()) {
      resolvedUserId = supSnap.data()?.userId || '';
    }
  } catch (e) {
    console.warn('Could not fetch supervisor doc for userId:', e);
  }

  return deleteSupervisorDoc(id, actor, resolvedUserId);
};

export async function createOfficialCertificate(
  data: {
    studentId: string;
    studentName: string;
    eventTitle: string;
    title: string;
    organizationName?: string;
    issueDate: string;
    certificateNumber?: string;
    documentType?: 'diplom' | 'sertifikat';
    subtitle?: string;
    presentedToText?: string;
    description?: string;
    competitionName?: string;
    nomination?: string;
    additionalNote?: string;
    confirmationText?: string;
    decisionNumber?: string;
    awardLevel?: string;
    signatoryDegree?: string;
    verificationUrl?: string;
    footerText?: string;
    additionalSignatureText?: string;
    signatoryName?: string;
    signatoryRole?: string;
    studentDirection?: string;
  },
  actorId: string,
  actorName: string
): Promise<CertificateItem> {
  const certNumber = data.certificateNumber?.trim() || `CERT-2026-${Date.now().toString().slice(-4)}`;
  const ref = doc(collection(db, 'certificates'));

  const cert: CertificateItem = {
    id: ref.id,
    certificateNumber: certNumber,
    title: data.title,
    eventTitle: data.eventTitle,
    studentId: data.studentId,
    studentName: data.studentName,
    organizationName: data.organizationName || 'Toshkent kimyo-texnologiya instituti Yangiyer filiali',
    issueDate: data.issueDate,
    status: 'Tasdiqlangan',
    isOfficialGenerated: true,
    createdAt: new Date().toISOString(),
    ...(data.documentType ? { documentType: data.documentType } : {}),
    ...(data.subtitle ? { subtitle: data.subtitle } : {}),
    ...(data.presentedToText ? { presentedToText: data.presentedToText } : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(data.competitionName ? { competitionName: data.competitionName } : {}),
    ...(data.nomination ? { nomination: data.nomination } : {}),
    ...(data.additionalNote ? { additionalNote: data.additionalNote } : {}),
    ...(data.confirmationText ? { confirmationText: data.confirmationText } : {}),
    ...(data.decisionNumber ? { decisionNumber: data.decisionNumber } : {}),
    ...(data.awardLevel ? { awardLevel: data.awardLevel } : {}),
    ...(data.signatoryDegree ? { signatoryDegree: data.signatoryDegree } : {}),
    ...(data.verificationUrl ? { verificationUrl: data.verificationUrl } : {}),
    ...(data.footerText ? { footerText: data.footerText } : {}),
    ...(data.additionalSignatureText ? { additionalSignatureText: data.additionalSignatureText } : {}),
    ...(data.signatoryName ? { signatoryName: data.signatoryName } : {}),
    ...(data.signatoryRole ? { signatoryRole: data.signatoryRole } : {}),
    ...(data.studentDirection ? { studentDirection: data.studentDirection } : {}),
  };

  await setDoc(ref, cert);

  await logAuditAction(
    { id: actorId, fullName: actorName, role: 'admin' },
    (data.documentType === 'diplom' ? "Rasmiy diplom rasmiylashtirildi" : "Rasmiy sertifikat rasmiylashtirildi"),
    'certificates',
    ref.id,
    `Rasmiy ${data.documentType === 'diplom' ? 'diplom' : 'sertifikat'} berildi: ${certNumber} (${data.studentName})`
  );

  return cert;
}

/**
 * Creates multiple official certificates or diplomas in Firestore using batch commits.
 */
export async function createOfficialCertificatesBatch(
  items: Array<{
    studentId: string;
    studentName: string;
    eventTitle: string;
    title: string;
    organizationName?: string;
    issueDate: string;
    certificateNumber?: string;
    documentType?: 'diplom' | 'sertifikat';
    subtitle?: string;
    presentedToText?: string;
    description?: string;
    competitionName?: string;
    nomination?: string;
    additionalNote?: string;
    confirmationText?: string;
    decisionNumber?: string;
    awardLevel?: string;
    signatoryDegree?: string;
    verificationUrl?: string;
    footerText?: string;
    additionalSignatureText?: string;
    signatoryName?: string;
    signatoryRole?: string;
    studentDirection?: string;
  }>,
  actorId: string,
  actorName: string
): Promise<CertificateItem[]> {
  if (!items || items.length === 0) return [];

  const CHUNK_SIZE = 300;
  const result: CertificateItem[] = [];

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const data of chunk) {
      const certNumber = data.certificateNumber?.trim() || `CERT-2026-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
      const ref = doc(collection(db, 'certificates'));

      const cert: CertificateItem = {
        id: ref.id,
        certificateNumber: certNumber,
        title: data.title,
        eventTitle: data.eventTitle,
        studentId: data.studentId,
        studentName: data.studentName,
        organizationName: data.organizationName || 'Toshkent kimyo-texnologiya instituti Yangiyer filiali',
        issueDate: data.issueDate,
        status: 'Tasdiqlangan',
        isOfficialGenerated: true,
        createdAt: new Date().toISOString(),
        ...(data.documentType ? { documentType: data.documentType } : {}),
        ...(data.subtitle ? { subtitle: data.subtitle } : {}),
        ...(data.presentedToText ? { presentedToText: data.presentedToText } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.competitionName ? { competitionName: data.competitionName } : {}),
        ...(data.nomination ? { nomination: data.nomination } : {}),
        ...(data.additionalNote ? { additionalNote: data.additionalNote } : {}),
        ...(data.confirmationText ? { confirmationText: data.confirmationText } : {}),
        ...(data.decisionNumber ? { decisionNumber: data.decisionNumber } : {}),
        ...(data.awardLevel ? { awardLevel: data.awardLevel } : {}),
        ...(data.signatoryDegree ? { signatoryDegree: data.signatoryDegree } : {}),
        ...(data.verificationUrl ? { verificationUrl: data.verificationUrl } : {}),
        ...(data.footerText ? { footerText: data.footerText } : {}),
        ...(data.additionalSignatureText ? { additionalSignatureText: data.additionalSignatureText } : {}),
        ...(data.signatoryName ? { signatoryName: data.signatoryName } : {}),
        ...(data.signatoryRole ? { signatoryRole: data.signatoryRole } : {}),
        ...(data.studentDirection ? { studentDirection: data.studentDirection } : {}),
      };

      batch.set(ref, cert);
      result.push(cert);
    }

    await withFirestoreTimeout(
      batch.commit(),
      25000,
      'Sertifikatlarni ommaviy saqlashda xatolik yuz berdi.'
    );
  }

  const sampleDocType = items[0]?.documentType === 'diplom' ? 'diplom' : 'sertifikat';
  await logAuditAction(
    { id: actorId, fullName: actorName, role: 'admin' },
    `Ommaviy ${sampleDocType}lar rasmiylashtirildi`,
    'certificates',
    'bulk_create',
    `Jami ${result.length} ta rasmiy ${sampleDocType} yaratildi.`
  );

  return result;
}

/**
 * Admin updates student full profile, password and photoURL/avatarUrl
 */
export async function updateStudentFullByAdmin(
  actor: { id: string; fullName: string; role: UserRole },
  studentId: string,
  data: {
    fullName: string;
    phone: string;
    course: number;
    group: string;
    facultyOrField: string;
    supervisorId: string;
    customSupervisorName?: string;
    avatarUrl?: string;
    photoURL?: string;
    newPassword?: string;
  }
): Promise<void> {
  if (actor.role !== 'admin' && actor.role !== 'superAdmin') {
    throw new Error("Faqat Admin yoki Super Admin talaba ma'lumotlarini tahrirlashi mumkin.");
  }

  const studentRef = doc(db, 'students', studentId);
  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) {
    throw new Error("Talaba profili topilmadi.");
  }
  const currentStudent = studentSnap.data() as StudentProfile;

  const normalizedPhone = normalizePhone(data.phone);
  if (!isValidUzbekPhone(normalizedPhone)) {
    throw new Error("Telefon raqami formati noto'g'ri. Masalan: +998 (90) 123-45-67");
  }

  // If phone changed, verify uniqueness
  if (normalizedPhone !== currentStudent.phone) {
    const qPhone = query(collection(db, 'users'), where('phone', '==', normalizedPhone), limit(1));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty && snapPhone.docs[0].id !== currentStudent.userId) {
      throw new Error("Ushbu telefon raqam bilan tizimda boshqa foydalanuvchi mavjud.");
    }
  }

  if (!isValidDirection(data.facultyOrField)) {
    throw new Error("Noto'g'ri ta'lim yo'nalishi. Faqat rasmiy 18 ta yo'nalishdan birini tanlang.");
  }

  const studentUpdates: Partial<StudentProfile> = {
    fullName: data.fullName.trim(),
    phone: normalizedPhone,
    course: Number(data.course),
    group: data.group.trim().toUpperCase(),
    facultyOrField: canonicalizeDirection(data.facultyOrField),
    supervisorId: data.supervisorId || '',
    customSupervisorName: data.customSupervisorName?.trim() || '',
    updatedAt: new Date().toISOString(),
  };

  if (data.avatarUrl !== undefined) {
    studentUpdates.avatarUrl = data.avatarUrl;
    studentUpdates.photoURL = data.avatarUrl;
  }

  await setDoc(studentRef, studentUpdates, { merge: true });

  // Update corresponding user document if exists
  if (currentStudent.userId) {
    const userRef = doc(db, 'users', currentStudent.userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userUpdates: any = {
        fullName: data.fullName.trim(),
        phone: normalizedPhone,
        updatedAt: new Date().toISOString(),
      };

      if (data.avatarUrl !== undefined) {
        userUpdates.avatarUrl = data.avatarUrl;
        userUpdates.photoURL = data.avatarUrl;
      }

      // If new password provided, safely hash and update
      if (data.newPassword && data.newPassword.trim().length > 0) {
        if (data.newPassword.trim().length < 6) {
          throw new Error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.");
        }
        const salt = generateSalt();
        const passwordHash = await hashPassword(data.newPassword.trim(), salt);
        userUpdates.passwordHash = passwordHash;
        userUpdates.salt = salt;

        // Audit log: student password updated (Never log the password itself!)
        await logAuditAction(
          actor,
          "student password updated",
          'users',
          currentStudent.userId,
          `Admin (${actor.fullName}) tomonidan talaba (${data.fullName}) hisobining paroli yangilandi.`
        );
      }

      await setDoc(userRef, userUpdates, { merge: true });
    }
  }

  // Audit log: student profile updated
  await logAuditAction(
    actor,
    "student profile updated",
    'students',
    studentId,
    `Admin (${actor.fullName}) tomonidan talaba anketasi yangilandi: ${data.fullName}`
  );

  // Audit log: profile photo updated
  if (data.avatarUrl !== undefined && data.avatarUrl !== currentStudent.avatarUrl) {
    await logAuditAction(
      actor,
      "profile photo updated",
      'students',
      studentId,
      data.avatarUrl
        ? `Admin (${actor.fullName}) tomonidan talaba (${data.fullName}) profil rasmi yangilandi.`
        : `Admin (${actor.fullName}) tomonidan talaba (${data.fullName}) profil rasmi o'chirildi.`
    );
  }
}

/**
 * Admin updates supervisor full profile, password and photoURL/avatarUrl
 */
export async function updateSupervisorFullByAdmin(
  actor: { id: string; fullName: string; role: UserRole },
  supervisorId: string,
  data: {
    fullName: string;
    phone: string;
    email: string;
    position: string;
    academicDegree: string;
    department: string;
    avatarUrl?: string;
    photoURL?: string;
    newPassword?: string;
  }
): Promise<void> {
  if (actor.role !== 'admin' && actor.role !== 'superAdmin') {
    throw new Error("Faqat Admin yoki Super Admin ilmiy rahbar ma'lumotlarini tahrirlashi mumkin.");
  }

  const supRef = doc(db, 'supervisors', supervisorId);
  const supSnap = await getDoc(supRef);
  if (!supSnap.exists()) {
    throw new Error("Ilmiy rahbar topilmadi.");
  }
  const currentSup = supSnap.data() as SupervisorProfile;

  const normalizedPhone = normalizePhone(data.phone);

  const supUpdates: Partial<SupervisorProfile> = {
    fullName: data.fullName.trim(),
    phone: normalizedPhone,
    email: data.email.trim(),
    position: data.position.trim(),
    academicDegree: data.academicDegree.trim(),
    department: data.department.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (data.avatarUrl !== undefined) {
    supUpdates.avatarUrl = data.avatarUrl;
    supUpdates.photoURL = data.avatarUrl;
  }

  let targetUserId = currentSup.userId;

  // Handle users collection account & password
  if (targetUserId) {
    const userRef = doc(db, 'users', targetUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userUpdates: any = {
        fullName: data.fullName.trim(),
        phone: normalizedPhone,
        updatedAt: new Date().toISOString(),
      };
      if (data.avatarUrl !== undefined) {
        userUpdates.avatarUrl = data.avatarUrl;
        userUpdates.photoURL = data.avatarUrl;
      }
      if (data.newPassword && data.newPassword.trim().length > 0) {
        if (data.newPassword.trim().length < 6) {
          throw new Error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.");
        }
        const salt = generateSalt();
        const passwordHash = await hashPassword(data.newPassword.trim(), salt);
        userUpdates.passwordHash = passwordHash;
        userUpdates.salt = salt;

        await logAuditAction(
          actor,
          "supervisor password updated",
          'users',
          targetUserId,
          `Admin (${actor.fullName}) tomonidan ilmiy rahbar (${data.fullName}) paroli yangilandi.`
        );
      }
      await setDoc(userRef, userUpdates, { merge: true });
    }
  } else if (data.newPassword && data.newPassword.trim().length > 0) {
    // Supervisor had no userId, but admin set a password -> create login account
    if (data.newPassword.trim().length < 6) {
      throw new Error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.");
    }

    // Check if user account with phone already exists
    const qPhone = query(collection(db, 'users'), where('phone', '==', normalizedPhone), limit(1));
    const snapPhone = await getDocs(qPhone);

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.newPassword.trim(), salt);

    if (!snapPhone.empty) {
      const existingUser = snapPhone.docs[0];
      targetUserId = existingUser.id;
      await setDoc(
        existingUser.ref,
        {
          fullName: data.fullName.trim(),
          phone: normalizedPhone,
          passwordHash,
          salt,
          role: 'supervisor',
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      const newUserRef = doc(collection(db, 'users'));
      targetUserId = newUserRef.id;
      const newUser: UserAccount = {
        id: targetUserId,
        fullName: data.fullName.trim(),
        phone: normalizedPhone,
        passwordHash,
        salt,
        role: 'supervisor',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      if (data.avatarUrl) {
        newUser.avatarUrl = data.avatarUrl;
        newUser.photoURL = data.avatarUrl;
      }
      await setDoc(newUserRef, newUser);
    }

    supUpdates.userId = targetUserId;

    await logAuditAction(
      actor,
      "supervisor password updated",
      'users',
      targetUserId,
      `Admin (${actor.fullName}) tomonidan ilmiy rahbar (${data.fullName}) uchun yangi login hisobi va paroli sozlandi.`
    );
  }

  await setDoc(supRef, supUpdates, { merge: true });

  // Audit log: supervisor profile updated
  await logAuditAction(
    actor,
    "supervisor profile updated",
    'supervisors',
    supervisorId,
    `Admin (${actor.fullName}) tomonidan ilmiy rahbar ma'lumotlari yangilandi: ${data.fullName}`
  );

  // Audit log: profile photo updated
  if (data.avatarUrl !== undefined && data.avatarUrl !== currentSup.avatarUrl) {
    await logAuditAction(
      actor,
      "profile photo updated",
      'supervisors',
      supervisorId,
      data.avatarUrl
        ? `Admin (${actor.fullName}) tomonidan ilmiy rahbar (${data.fullName}) profil rasmi yangilandi.`
        : `Admin (${actor.fullName}) tomonidan ilmiy rahbar (${data.fullName}) profil rasmi o'chirildi.`
    );
  }
}

/**
 * Student updates own profile photo
 */
export async function updateStudentSelfProfilePhoto(
  studentId: string,
  userId: string,
  photoUrl: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const studentRef = doc(db, 'students', studentId);
  await setDoc(
    studentRef,
    {
      id: studentId,
      userId: userId || studentId,
      fullName: actor.fullName,
      avatarUrl: photoUrl,
      photoURL: photoUrl,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  if (userId) {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        avatarUrl: photoUrl,
        photoURL: photoUrl,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  await logAuditAction(
    actor,
    "profile photo updated",
    'students',
    studentId,
    photoUrl
      ? `Talaba (${actor.fullName}) o'z profil rasmini yangiladi.`
      : `Talaba (${actor.fullName}) o'z profil rasmini o'chirdi.`
  );
}

/**
 * Supervisor updates own profile photo
 */
export async function updateSupervisorSelfProfilePhoto(
  supervisorId: string,
  userId: string | undefined,
  photoUrl: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const supRef = doc(db, 'supervisors', supervisorId);
  await setDoc(
    supRef,
    {
      id: supervisorId,
      userId: userId || supervisorId,
      fullName: actor.fullName,
      avatarUrl: photoUrl,
      photoURL: photoUrl,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  if (userId) {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        avatarUrl: photoUrl,
        photoURL: photoUrl,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  await logAuditAction(
    actor,
    "profile photo updated",
    'supervisors',
    supervisorId,
    photoUrl
      ? `Ilmiy rahbar (${actor.fullName}) o'z profil rasmini yangiladi.`
      : `Ilmiy rahbar (${actor.fullName}) o'z profil rasmini o'chirdi.`
  );
}

/**
 * Revokes an issued certificate / diploma with reason. Status changes to 'Bekor qilingan'
 */
export async function revokeCertificate(
  id: string,
  reason: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'certificates', id);
  const revokedAt = new Date().toISOString();
  await withFirestoreTimeout(
    updateDoc(ref, {
      status: 'Bekor qilingan',
      isRevoked: true,
      revokedAt,
      revokedBy: actor.fullName,
      revokeReason: reason.trim() || 'Ma’muriyat qarori bilan bekor qilindi',
      updatedAt: revokedAt,
    }),
    12000,
    'Sertifikatni bekor qilishda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    "Sertifikat bekor qilindi (Revoked)",
    'certificates',
    id,
    `Sertifikat bekor qilindi. Sabab: ${reason || 'Ko‘rsatilmagan'}`
  );
}

/**
 * Full update of certificate or diploma details by admin
 */
export async function updateCertificateDetails(
  id: string,
  updates: Partial<CertificateItem>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'certificates', id);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  await withFirestoreTimeout(
    updateDoc(ref, cleanUpdates),
    12000,
    'Sertifikat ma’lumotlarini yangilashda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    "Sertifikat tahrirlandi",
    'certificates',
    id,
    `Sertifikat ma’lumotlari yangilandi: ${updates.certificateNumber || id}`
  );
}

/**
 * Generic Soft-delete: Moves record to trash without deleting from production Firestore!
 */
export async function softDeleteDocument(
  collectionName: string,
  id: string,
  entityLabel: string,
  actor: { id: string; fullName: string; role: UserRole } | any
): Promise<void> {
  const ref = doc(db, collectionName, id);
  const now = new Date().toISOString();

  let actorName = 'Admin';
  if (typeof actor === 'string') {
    actorName = actor;
  } else if (actor && typeof actor === 'object') {
    actorName = actor.fullName || actor.name || actor.id || 'Admin';
  }

  await withFirestoreTimeout(
    updateDoc(ref, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: actorName,
      updatedAt: now,
    }),
    12000,
    `${entityLabel}ni o'chirishda xatolik yuz berdi.`
  );

  const actorObj =
    actor && typeof actor === 'object' && actor.id
      ? actor
      : { id: 'admin', fullName: actorName, role: 'admin' as UserRole };

  await logAuditAction(
    actorObj,
    `${entityLabel} o'chirildi (Soft delete)`,
    collectionName,
    id,
    `${entityLabel} chiqindilar qutisiga o'tkazildi.`
  );
}

/**
 * Generic Restore: Recovers soft-deleted record from trash
 */
export async function restoreDocument(
  collectionName: string,
  id: string,
  entityLabel: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, collectionName, id);
  const now = new Date().toISOString();
  await withFirestoreTimeout(
    updateDoc(ref, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: now,
    }),
    12000,
    `${entityLabel}ni tiklashda xatolik yuz berdi.`
  );

  // If restoring a student or supervisor, also restore and reactivate the linked user account
  try {
    if (collectionName === 'students') {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const sData = snap.data();
        if (sData?.userId) {
          await updateDoc(doc(db, 'users', sData.userId), {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            isActive: true,
            updatedAt: now,
          });
        }
      }
    } else if (collectionName === 'supervisors') {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const supData = snap.data();
        if (supData?.userId) {
          await updateDoc(doc(db, 'users', supData.userId), {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            isActive: true,
            updatedAt: now,
          });
        }
      }
    }
  } catch (linkErr) {
    console.warn('Restoring linked user account non-fatal warning:', linkErr);
  }

  await logAuditAction(
    actor,
    `${entityLabel} qayta tiklandi`,
    collectionName,
    id,
    `${entityLabel} chiqindilar qutisidan qayta tiklandi.`
  );
}

/**
 * Permanent delete: Super Admin or Admin
 */
export async function permanentDeleteDocument(
  collectionName: string,
  id: string,
  entityLabel: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  if (actor.role !== 'superAdmin' && actor.role !== 'admin') {
    throw new Error("Faqat Super Admin yoki Admin butunlay o'chira oladi!");
  }

  const ref = doc(db, collectionName, id);

  // If student or supervisor, also delete linked user account from users collection
  try {
    if (collectionName === 'students' || collectionName === 'supervisors') {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.userId && data.userId !== actor.id) {
          await deleteDoc(doc(db, 'users', data.userId)).catch(() => {});
        }
      }
    }
  } catch (linkErr) {
    console.warn('Non-fatal error deleting linked user document:', linkErr);
  }

  await withFirestoreTimeout(
    deleteDoc(ref),
    12000,
    `${entityLabel}ni butunlay o'chirishda xatolik yuz berdi.`
  );

  await logAuditAction(
    actor,
    `${entityLabel} butunlay o'chirildi (Permanent delete)`,
    collectionName,
    id,
    `${entityLabel} bazadan butunlay tozalandi.`
  );
}

/**
 * Permanently purges multiple or all soft-deleted documents from Firestore.
 * Handles students, supervisors, projects, certificates, achievements, events, announcements, users.
 * Uses writeBatch with chunking for high performance and atomicity.
 */
export async function emptyTrashPermanently(
  items: { collectionName: string; id: string; categoryLabel?: string; title?: string }[],
  actor: { id: string; fullName: string; role: UserRole },
  scopeDescription: string = "Chiqindilar qutisi butunlay bo'shatildi"
): Promise<{ deletedCount: number }> {
  if (actor.role !== 'superAdmin' && actor.role !== 'admin') {
    throw new Error("Faqat Super Admin yoki Admin chiqindi qutisini bo'shata oladi!");
  }

  if (!items || items.length === 0) {
    return { deletedCount: 0 };
  }

  // Filter out actor's own user record to prevent accidental self-deletion
  const safeItems = items.filter(
    item => !(item.collectionName === 'users' && item.id === actor.id)
  );

  // If deleting all trash or if students/supervisors are in the batch, clean up linked & orphaned soft-deleted user docs
  const additionalUserDocIds = new Set<string>();
  const isFullPurge = scopeDescription.toLowerCase().includes('barcha') || scopeDescription.toLowerCase().includes('butunlay');

  if (isFullPurge) {
    try {
      const deletedUsersSnap = await getDocs(query(collection(db, 'users'), where('isDeleted', '==', true)));
      deletedUsersSnap.forEach(d => {
        if (d.id !== actor.id) {
          additionalUserDocIds.add(d.id);
        }
      });
    } catch (err) {
      console.warn('Non-fatal error querying soft-deleted users in emptyTrashPermanently:', err);
    }
  }

  for (const uid of additionalUserDocIds) {
    if (!safeItems.some(i => i.collectionName === 'users' && i.id === uid)) {
      safeItems.push({ collectionName: 'users', id: uid, categoryLabel: 'Hisob' });
    }
  }

  let deletedCount = 0;
  const CHUNK_SIZE = 300; // Well below 500 limit for Firestore writeBatch

  for (let i = 0; i < safeItems.length; i += CHUNK_SIZE) {
    const chunk = safeItems.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docRef = doc(db, item.collectionName, item.id);
      batch.delete(docRef);
    }

    await withFirestoreTimeout(
      batch.commit(),
      25000,
      "Chiqindilarni butunlay tozalashda xatolik yuz berdi."
    );
    deletedCount += chunk.length;
  }

  await logAuditAction(
    actor,
    "Chiqindilar qutisi butunlay bo'shatildi (Purge All Trash)",
    'trash',
    'bulk_purge',
    `${scopeDescription}. Jami ${deletedCount} ta yozuv Firestore bazasidan butunlay tozalandi.`
  );

  return { deletedCount };
}

/**
 * Recovers multiple soft-deleted documents from trash in batch.
 */
export async function restoreDocumentsBatch(
  items: { collectionName: string; id: string; categoryLabel?: string; title?: string }[],
  actor: { id: string; fullName: string; role: UserRole }
): Promise<{ restoredCount: number }> {
  if (!items || items.length === 0) return { restoredCount: 0 };
  const now = new Date().toISOString();
  let restoredCount = 0;
  const CHUNK_SIZE = 300;

  // Gather any linked user account IDs for students or supervisors to restore them together
  const linkedUserIdsToRestore = new Set<string>();
  for (const item of items) {
    if (item.collectionName === 'students' || item.collectionName === 'supervisors') {
      try {
        const snap = await getDoc(doc(db, item.collectionName, item.id));
        if (snap.exists()) {
          const data = snap.data();
          if (data?.userId) {
            linkedUserIdsToRestore.add(data.userId);
          }
        }
      } catch (err) {
        console.warn('Non-fatal error gathering linked user for batch restore:', err);
      }
    }
  }

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docRef = doc(db, item.collectionName, item.id);
      batch.update(docRef, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        updatedAt: now,
      });
    }

    for (const uid of linkedUserIdsToRestore) {
      const userRef = doc(db, 'users', uid);
      batch.update(userRef, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        isActive: true,
        updatedAt: now,
      });
    }

    await withFirestoreTimeout(
      batch.commit(),
      25000,
      "Hujjatlarni ommaviy qayta tiklashda xatolik yuz berdi."
    );
    restoredCount += chunk.length;
  }

  await logAuditAction(
    actor,
    "Chiqindilar qutisidan ommaviy tiklandi",
    'trash',
    'bulk_restore',
    `Jami ${restoredCount} ta yozuv chiqindilar qutisidan qayta tiklandi.`
  );

  return { restoredCount };
}

/**
 * Full update of Student profile by Admin
 */
export async function updateStudentProfileFull(
  studentId: string,
  updates: Partial<StudentProfile>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'students', studentId);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  await withFirestoreTimeout(
    updateDoc(ref, cleanUpdates),
    12000,
    'Talaba ma’lumotlarini saqlashda xatolik yuz berdi.'
  );

  // If fullName or phone updated, synchronize users collection if userId exists
  if (updates.userId && (updates.fullName || updates.phone)) {
    try {
      const userRef = doc(db, 'users', updates.userId);
      const userUpdates: any = {};
      if (updates.fullName) userUpdates.fullName = updates.fullName;
      if (updates.phone) userUpdates.phone = updates.phone;
      await updateDoc(userRef, userUpdates);
    } catch {
      // Non-blocking if user doc missing
    }
  }

  await logAuditAction(
    actor,
    "Talaba profili tahrirlandi",
    'students',
    studentId,
    `Talaba ma’lumotlari yangilandi: ${updates.fullName || studentId}`
  );
}

/**
 * Full update of Supervisor profile by Admin
 */
export async function updateSupervisorProfileFull(
  supervisorId: string,
  updates: Partial<SupervisorProfile>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'supervisors', supervisorId);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  await withFirestoreTimeout(
    updateDoc(ref, cleanUpdates),
    12000,
    'Ilmiy rahbar ma’lumotlarini saqlashda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    "Ilmiy rahbar profili tahrirlandi",
    'supervisors',
    supervisorId,
    `Ilmiy rahbar yangilandi: ${updates.fullName || supervisorId}`
  );
}

/**
 * Toggle supervisor active/block status
 */
export async function toggleSupervisorStatus(
  supervisorId: string,
  isActive: boolean,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'supervisors', supervisorId);
  await withFirestoreTimeout(
    updateDoc(ref, {
      isActive,
      updatedAt: new Date().toISOString(),
    }),
    12000,
    'Holatni o‘zgartirishda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    isActive ? "Ilmiy rahbar faollashtirildi" : "Ilmiy rahbar faolsizlantirildi",
    'supervisors',
    supervisorId,
    `Ilmiy rahbar holati: ${isActive ? 'Faol' : 'Nofaol'}`
  );
}

/**
 * Full update of Project / Startup details
 */
export async function updateProjectDetails(
  projectId: string,
  updates: Partial<ProjectOrStartup>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'projects', projectId);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  await withFirestoreTimeout(
    updateDoc(ref, cleanUpdates),
    12000,
    'Loyiha ma’lumotlarini saqlashda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    "Loyiha tahrirlandi",
    'projects',
    projectId,
    `Loyiha ma’lumotlari yangilandi: ${updates.title || projectId}`
  );
}

/**
 * Full update of Achievement details
 */
export async function updateAchievementDetails(
  achievementId: string,
  updates: Partial<Achievement>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'achievements', achievementId);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  await withFirestoreTimeout(
    updateDoc(ref, cleanUpdates),
    12000,
    'Yutuq ma’lumotlarini saqlashda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    "Yutuq tahrirlandi",
    'achievements',
    achievementId,
    `Yutuq ma’lumotlari yangilandi: ${updates.title || achievementId}`
  );
}

/**
 * Full update of Event details
 */
export async function updateEventDetails(
  eventId: string,
  updates: Partial<EventItem>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'events', eventId);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  await withFirestoreTimeout(
    updateDoc(ref, cleanUpdates),
    12000,
    'Tadbir ma’lumotlarini saqlashda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    "Tadbir tahrirlandi",
    'events',
    eventId,
    `Tadbir ma’lumotlari yangilandi: ${updates.title || eventId}`
  );
}

/**
 * Update competition application review status
 */
export async function updateCompetitionApplicationStatus(
  registrationId: string,
  status: 'Tasdiqlangan' | 'Rad etilgan' | 'Kutilmoqda',
  notes: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'eventRegistrations', registrationId);
  const now = new Date().toISOString();
  await withFirestoreTimeout(
    updateDoc(ref, {
      applicationStatus: status,
      status: status === 'Tasdiqlangan' ? 'Tasdiqlangan' : status === 'Rad etilgan' ? 'Bekor qilingan' : 'Kutilmoqda',
      reviewNotes: notes.trim(),
      reviewedAt: now,
      reviewedBy: actor.id,
    }),
    12000,
    'Ariza holatini yangilashda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    `Tanlov arizasi: ${status}`,
    'eventRegistrations',
    registrationId,
    `Ariza holati ${status} qilindi. Izoh: ${notes || 'Mavjud emas'}`
  );
}

/**
 * Full update of Announcement details
 */
export async function updateAnnouncementDetails(
  announcementId: string,
  updates: Partial<Announcement>,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'announcements', announcementId);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  await withFirestoreTimeout(
    updateDoc(ref, cleanUpdates),
    12000,
    'E’lon ma’lumotlarini saqlashda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    "E’lon tahrirlandi",
    'announcements',
    announcementId,
    `E’lon yangilandi: ${updates.title || announcementId}`
  );
}

/**
 * Toggle Announcement publish status
 */
export async function toggleAnnouncementPublish(
  announcementId: string,
  isPublished: boolean,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'announcements', announcementId);
  await withFirestoreTimeout(
    updateDoc(ref, {
      isPublished,
      updatedAt: new Date().toISOString(),
    }),
    12000,
    'E’lon holatini o‘zgartirishda xatolik yuz berdi.'
  );

  await logAuditAction(
    actor,
    isPublished ? "E’lon chop etildi" : "E’lon qoralamaga o‘tkazildi",
    'announcements',
    announcementId,
    `E’lon holati: ${isPublished ? 'Chop etilgan' : 'Qoralama'}`
  );
}

/**
 * Saves the Admin-designated Top 3 Active Students for the home page.
 * Updates the student records with isTopStudent, topStudentRank, and topStudentReason,
 * and clears any previously designated students who are no longer in the top 3.
 */
export async function saveTopActiveStudents(
  assignments: TopStudentAssignment[],
  allStudents: StudentProfile[],
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  const timestamp = new Date().toISOString();

  // 1. Find all students who are currently marked as top students
  const currentlyTopStudents = allStudents.filter(s => s.isTopStudent);
  const assignedIds = new Set(assignments.map(a => a.studentId));

  // 2. Clear students who are no longer in the top list
  for (const prev of currentlyTopStudents) {
    if (!assignedIds.has(prev.id)) {
      const sRef = doc(db, 'students', prev.id);
      await withFirestoreTimeout(
        updateDoc(sRef, {
          isTopStudent: false,
          topStudentRank: 0,
          topStudentReason: '',
          updatedAt: timestamp,
        }),
        8000
      );
    }
  }

  // 3. Update designated students
  for (const assign of assignments) {
    if (!assign.studentId) continue;
    const sRef = doc(db, 'students', assign.studentId);
    await withFirestoreTimeout(
      updateDoc(sRef, {
        isTopStudent: true,
        topStudentRank: assign.rank,
        topStudentReason: assign.reason?.trim() || '',
        topStudentAssignedAt: timestamp,
        topStudentAssignedBy: actor.fullName,
        updatedAt: timestamp,
      }),
      8000
    );
  }

  // 4. Also store in settings/featuredStudents for system records
  const settingsRef = doc(db, 'settings', 'featuredStudents');
  await withFirestoreTimeout(
    setDoc(
      settingsRef,
      {
        id: 'featuredStudents',
        assignments,
        updatedAt: timestamp,
        updatedBy: actor.fullName,
        updatedById: actor.id,
      },
      { merge: true }
    ),
    8000
  );

  // 5. Log audit action
  const summary = assignments
    .map(a => {
      const student = allStudents.find(s => s.id === a.studentId);
      return `${a.rank}-o‘rin: ${student?.fullName || a.studentId}`;
    })
    .join(', ');

  await logAuditAction(
    actor,
    "Eng faol talabalarni belgilash",
    'students',
    'featured',
    `Bosh sahifa uchun eng faol 3 ta talaba belgilandi: ${summary || 'Tozalandi'}`
  );
}



