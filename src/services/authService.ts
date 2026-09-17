import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  hashPassword,
  generateSalt,
  verifyPassword,
  normalizePhone,
  isValidUzbekPhone,
  validatePasswordStrength,
  formatRemainingSeconds,
} from '../lib/crypto';
import { logAuditAction } from './firestoreService';
import { isValidDirection, canonicalizeDirection } from '../constants/directions';
import type { UserAccount, StudentProfile, SupervisorProfile, UserRole, AdminPermissions } from '../types';

const SESSION_KEY = 'iqtidorli_talabalar_current_user_v1';

// Session Security: Max idle time 24 hours, absolute max 7 days
export const MAX_IDLE_SESSION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_ABSOLUTE_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Brute-force protection constants
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface LoginRateLimitInfo {
  isLocked: boolean;
  remainingSeconds: number;
  failedCount: number;
}

export function isSessionExpired(user: UserAccount): boolean {
  const now = Date.now();
  if (user.sessionLastActiveAt && now - user.sessionLastActiveAt > MAX_IDLE_SESSION_MS) {
    return true;
  }
  if (user.sessionStartedAt && now - user.sessionStartedAt > MAX_ABSOLUTE_SESSION_MS) {
    return true;
  }
  return false;
}

export function refreshUserSessionActivity() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const cached = JSON.parse(raw) as UserAccount;
    if (isSessionExpired(cached)) {
      clearUserSession();
      return;
    }
    cached.sessionLastActiveAt = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(cached));
  } catch {
    // ignore
  }
}

/**
 * Checks if a given phone number has exceeded failed attempts and is currently locked out
 */
export async function checkLoginRateLimit(phone: string): Promise<LoginRateLimitInfo> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
  const docId = `phone_${normalized.replace(/\D/g, '')}`;

  try {
    const attemptDoc = await getDoc(doc(db, 'loginAttempts', docId));
    if (attemptDoc.exists()) {
      const data = attemptDoc.data();
      const failedCount = Number(data.failedCount || 0);
      if (data.lockedUntil) {
        const lockTime = new Date(data.lockedUntil).getTime();
        const diff = lockTime - Date.now();
        if (diff > 0) {
          return {
            isLocked: true,
            remainingSeconds: Math.ceil(diff / 1000),
            failedCount,
          };
        }
      }
      return { isLocked: false, remainingSeconds: 0, failedCount };
    }
  } catch (err) {
    console.warn('Error checking login rate limit:', err);
  }
  return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
}

export async function getCurrentStoredUser(): Promise<UserAccount | null> {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const cached = JSON.parse(raw) as UserAccount;

    // Verify session expiry
    if (isSessionExpired(cached)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    // Verify latest status directly from Firestore
    const userDoc = await getDoc(doc(db, 'users', cached.id));
    if (userDoc.exists()) {
      const fresh = { id: userDoc.id, ...userDoc.data() } as UserAccount;
      if (!fresh.isActive || fresh.isDeleted) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      // Refresh session activity
      fresh.sessionStartedAt = cached.sessionStartedAt || Date.now();
      fresh.sessionLastActiveAt = Date.now();
      saveUserSession(fresh);
      return fresh;
    }
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch (err) {
    console.error('Session retrieval error:', err);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveUserSession(user: UserAccount) {
  // Never save hash/salt in storage, attach security timestamps
  const now = Date.now();
  const sanitized: UserAccount = {
    ...user,
    passwordHash: '',
    salt: '',
    sessionStartedAt: user.sessionStartedAt || now,
    sessionLastActiveAt: now,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sanitized));
}

export function clearUserSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Checks if the system has at least one Super Admin.
 * If 0, the first Super Admin setup form is shown to safely initialize the university system.
 */
export async function checkSystemHasSuperAdmin(): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'superAdmin'),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.warn('SuperAdmin existence check note (offline/connecting):', err);
    return false;
  }
}

/**
 * First-time initialization of Super Admin safely.
 */
export async function initializeFirstSuperAdmin(data: {
  fullName: string;
  phone: string;
  password: string;
}): Promise<UserAccount> {
  const normalized = normalizePhone(data.phone);
  if (!isValidUzbekPhone(normalized)) {
    throw new Error("Telefon raqami formati noto'g'ri. Masalan: +998 (90) 123-45-67");
  }

  const pwdCheck = validatePasswordStrength(data.password);
  if (!pwdCheck.isValid) {
    throw new Error("Parol xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
  }

  // Double check no superAdmin exists yet
  const exists = await checkSystemHasSuperAdmin();
  if (exists) {
    throw new Error("Tizimda Super Admin allaqachon mavjud. Yangi adminni faqat Super Admin yaratishi mumkin.");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);

  const userRef = doc(collection(db, 'users'));
  const superAdminUser: UserAccount = {
    id: userRef.id,
    phone: normalized,
    passwordHash,
    salt,
    role: 'superAdmin',
    fullName: data.fullName.trim(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, superAdminUser);

  await logAuditAction(
    { id: superAdminUser.id, fullName: superAdminUser.fullName, role: 'superAdmin' },
    "Super Admin dastlabki sozlandi",
    'users',
    superAdminUser.id,
    `Bosh Super Admin muvaffaqiyatli ro'yxatdan o'tdi.`
  );

  saveUserSession(superAdminUser);
  return superAdminUser;
}

/**
 * Student Registration
 */
export async function registerStudent(data: {
  fullName: string;
  phone: string;
  course: number;
  group: string;
  facultyOrField: string;
  supervisorId: string;
  customSupervisorName?: string;
  password: string;
}): Promise<{ user: UserAccount; student: StudentProfile }> {
  const normalized = normalizePhone(data.phone);
  if (!isValidUzbekPhone(normalized)) {
    throw new Error("Telefon raqami formati noto'g'ri. Masalan: +998 (90) 123-45-67");
  }

  if (!data.fullName.trim()) {
    throw new Error("F.I.Sh. (Familiya, Ism, Sharif) kiritilishi shart.");
  }

  if (!data.course || data.course < 1 || data.course > 5) {
    throw new Error("Iltimos, o'quv kursingizni to'g'ri tanlang.");
  }

  if (!data.group.trim()) {
    throw new Error("Guruh raqami yoki nomini kiriting.");
  }

  if (!data.facultyOrField || !data.facultyOrField.trim()) {
    throw new Error("Ta'lim yo'nalishi kiritilishi shart.");
  }

  if (!isValidDirection(data.facultyOrField)) {
    throw new Error("Noto'g'ri ta'lim yo'nalishi. Faqat rasmiy 18 ta yo'nalishdan birini tanlang.");
  }

  const canonicalFaculty = canonicalizeDirection(data.facultyOrField);

  const pwdCheck = validatePasswordStrength(data.password);
  if (!pwdCheck.isValid) {
    throw new Error("Parol xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
  }

  // Check unique phone number
  const qPhone = query(collection(db, 'users'), where('phone', '==', normalized), limit(1));
  const snap = await getDocs(qPhone);
  if (!snap.empty) {
    throw new Error("Bu telefon raqam allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring.");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);

  const userRef = doc(collection(db, 'users'));
  const studentRef = doc(collection(db, 'students'));

  const userAccount: UserAccount = {
    id: userRef.id,
    phone: normalized,
    passwordHash,
    salt,
    role: 'student',
    fullName: data.fullName.trim(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const studentProfile: StudentProfile = {
    id: studentRef.id,
    userId: userRef.id,
    fullName: data.fullName.trim(),
    phone: normalized,
    course: Number(data.course),
    group: data.group.trim().toUpperCase(),
    facultyOrField: canonicalFaculty,
    supervisorId: data.supervisorId || '',
    customSupervisorName: data.customSupervisorName?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, userAccount);
  await setDoc(studentRef, studentProfile);

  await logAuditAction(
    { id: userAccount.id, fullName: userAccount.fullName, role: 'student' },
    "Talaba ro'yxatdan o'tdi",
    'students',
    studentProfile.id,
    `Yangi talaba mustaqil ro'yxatdan o'tdi: ${data.fullName}`
  );

  saveUserSession(userAccount);
  return { user: userAccount, student: studentProfile };
}

/**
 * Login with Phone and Password with Anti-Brute-Force rate limiting
 */
export async function loginWithPhone(phone: string, password: string): Promise<UserAccount> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error("Telefon raqami kiritilmadi.");
  }
  if (!password) {
    throw new Error("Parol kiritilmadi.");
  }

  // 1. Check rate limit
  const rateLimit = await checkLoginRateLimit(normalized);
  if (rateLimit.isLocked) {
    throw new Error(
      `Xavfsizlik himoyasi: ketma-ket ${MAX_FAILED_LOGIN_ATTEMPTS} marta noto‘g‘ri parol kiritilgani sababli ushbu hisobga kirish vaqtincha to‘xtatildi. Qayta urinish uchun ${formatRemainingSeconds(rateLimit.remainingSeconds)} kuting.`
    );
  }

  const docId = `phone_${normalized.replace(/\D/g, '')}`;

  const q = query(collection(db, 'users'), where('phone', '==', normalized), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) {
    // Record failed attempt to prevent user enumeration attacks
    let currentFailed = 1;
    try {
      const attemptSnap = await getDoc(doc(db, 'loginAttempts', docId));
      currentFailed = attemptSnap.exists() ? Number(attemptSnap.data()?.failedCount || 0) + 1 : 1;
      let lockedUntil: string | null = null;
      if (currentFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOGIN_LOCKOUT_DURATION_MS).toISOString();
      }
      await setDoc(doc(db, 'loginAttempts', docId), {
        phone: normalized,
        failedCount: currentFailed,
        lockedUntil,
        lastFailedAt: new Date().toISOString(),
      });
    } catch {
      // non-fatal
    }

    if (currentFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new Error(
        `Ketma-ket ${MAX_FAILED_LOGIN_ATTEMPTS} marta noto‘g‘ri ma’lumot kiritildi! Xavfsizlik yuzasidan tizimga kirish 15 daqiqaga bloklandi.`
      );
    }
    const remaining = MAX_FAILED_LOGIN_ATTEMPTS - currentFailed;
    throw new Error(
      `Telefon raqami yoki parol noto‘g‘ri. (Xavfsizlik ogohlantirishi: yana ${remaining} ta urinish qoldi)`
    );
  }

  const userDoc = snap.docs[0];
  let user = { id: userDoc.id, ...userDoc.data() } as UserAccount;

  // Auto-sync status if user was restored in student/supervisor registry
  if (user.isDeleted) {
    try {
      if (user.role === 'student') {
        const qStudent = query(collection(db, 'students'), where('phone', '==', normalized), limit(1));
        const sSnap = await getDocs(qStudent);
        if (!sSnap.empty) {
          const sData = sSnap.docs[0].data();
          if (!sData.isDeleted) {
            user.isDeleted = false;
            user.isActive = true;
            await updateDoc(doc(db, 'users', user.id), {
              isDeleted: false,
              isActive: true,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } else if (user.role === 'supervisor') {
        const qSup = query(collection(db, 'supervisors'), where('phone', '==', normalized), limit(1));
        const supSnap = await getDocs(qSup);
        if (!supSnap.empty) {
          const supData = supSnap.docs[0].data();
          if (!supData.isDeleted) {
            user.isDeleted = false;
            user.isActive = true;
            await updateDoc(doc(db, 'users', user.id), {
              isDeleted: false,
              isActive: true,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (syncErr) {
      console.warn('Status sync check failed:', syncErr);
    }
  }

  if (user.isActive === false || user.isDeleted) {
    throw new Error("Ushbu hisob ma'muriyat tomonidan vaqtincha bloklangan yoki o‘chirilgan.");
  }

  const valid = await verifyPassword(password, user.salt, user.passwordHash);
  if (!valid) {
    let currentFailed = 1;
    try {
      const attemptSnap = await getDoc(doc(db, 'loginAttempts', docId));
      currentFailed = attemptSnap.exists() ? Number(attemptSnap.data()?.failedCount || 0) + 1 : 1;
      let lockedUntil: string | null = null;

      if (currentFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOGIN_LOCKOUT_DURATION_MS).toISOString();
        await logAuditAction(
          { id: user.id, fullName: user.fullName, role: user.role },
          "Xavfsizlik ogohlantirishi: Hisob bloklandi",
          'users',
          user.id,
          `Ketma-ket 5 marta noto'g'ri parol terildi. Brute-force himoyasi faollashdi (15 daqiqa blok).`
        );
      }

      await setDoc(doc(db, 'loginAttempts', docId), {
        phone: normalized,
        failedCount: currentFailed,
        lockedUntil,
        lastFailedAt: new Date().toISOString(),
      });
    } catch {
      // non-fatal
    }

    if (currentFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new Error(
        `Ketma-ket 5 marta noto‘g‘ri parol kiritildi! Xavfsizlik yuzasidan hisobga kirish 15 daqiqaga bloklandi.`
      );
    }
    const remaining = MAX_FAILED_LOGIN_ATTEMPTS - currentFailed;
    throw new Error(
      `Telefon raqami yoki parol noto‘g‘ri. (Xavfsizlik ogohlantirishi: yana ${remaining} ta urinish qoldi)`
    );
  }

  // Password is valid - reset failed attempts
  try {
    await deleteDoc(doc(db, 'loginAttempts', docId));
  } catch {
    // non-fatal
  }

  // Update lastLoginAt
  try {
    await updateDoc(doc(db, 'users', user.id), {
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // non-fatal
  }

  // Save session with activity timestamps
  saveUserSession(user);

  await logAuditAction(
    { id: user.id, fullName: user.fullName, role: user.role },
    "Tizimga kirildi",
    'users',
    user.id,
    `Foydalanuvchi tizimga muvaffaqiyatli kirdi.`
  );

  return user;
}

/**
 * Super Admin creates an Admin
 */
export async function createAdminAccount(
  actor: { id: string; fullName: string; role: UserRole },
  data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
  }
): Promise<UserAccount> {
  if (actor.role !== 'superAdmin') {
    throw new Error("Faqat Super Admin yangi Admin yarata oladi!");
  }

  const normalized = normalizePhone(data.phone);
  if (!isValidUzbekPhone(normalized)) {
    throw new Error("Telefon raqami formati noto'g'ri.");
  }

  const pwdCheck = validatePasswordStrength(data.password);
  if (!pwdCheck.isValid) {
    throw new Error("Admin paroli xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
  }

  const qPhone = query(collection(db, 'users'), where('phone', '==', normalized), limit(1));
  const snap = await getDocs(qPhone);
  if (!snap.empty) {
    throw new Error("Bu telefon raqam bilan allaqachon boshqa foydalanuvchi mavjud.");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);

  const userRef = doc(collection(db, 'users'));
  const newAdmin: UserAccount = {
    id: userRef.id,
    phone: normalized,
    passwordHash,
    salt,
    role: 'admin',
    fullName: data.fullName.trim(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, newAdmin);

  await logAuditAction(
    actor,
    "Yangi Admin yaratildi",
    'users',
    newAdmin.id,
    `Super Admin tomonidan yangi Admin qo'shildi: ${data.fullName}`
  );

  return newAdmin;
}

/**
 * Supervisor user account creation (if supervisor wants to log in)
 */
export async function createSupervisorAccount(
  actor: { id: string; fullName: string; role: UserRole },
  data: {
    fullName: string;
    phone: string;
    email: string;
    position: string;
    academicDegree: string;
    department: string;
    password?: string;
  }
): Promise<SupervisorProfile> {
  if (actor.role !== 'superAdmin' && actor.role !== 'admin') {
    throw new Error("Faqat Admin yoki Super Admin ilmiy rahbar yarata oladi!");
  }

  const normalized = normalizePhone(data.phone);

  let userId: string | undefined;

  // If password provided, create login account
  if (data.password) {
    const pwdCheck = validatePasswordStrength(data.password);
    if (!pwdCheck.isValid) {
      throw new Error("Ilmiy rahbar paroli xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
    }
    const qPhone = query(collection(db, 'users'), where('phone', '==', normalized), limit(1));
    const snap = await getDocs(qPhone);
    if (!snap.empty) {
      throw new Error("Bu telefon raqam allaqachon ro'yxatdan o'tgan.");
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const userRef = doc(collection(db, 'users'));
    userId = userRef.id;
    const userAccount: UserAccount = {
      id: userId,
      phone: normalized,
      passwordHash,
      salt,
      role: 'supervisor',
      fullName: data.fullName.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(userRef, userAccount);
  }

  const supRef = doc(collection(db, 'supervisors'));
  const supervisor: SupervisorProfile = {
    id: supRef.id,
    userId,
    fullName: data.fullName.trim(),
    phone: normalized,
    email: data.email.trim(),
    position: data.position.trim(),
    academicDegree: data.academicDegree.trim(),
    department: data.department.trim(),
    createdAt: new Date().toISOString(),
  };

  await setDoc(supRef, supervisor);

  await logAuditAction(
    actor,
    "Ilmiy rahbar qo'shildi",
    'supervisors',
    supervisor.id,
    `Yangi ilmiy rahbar biriktirildi: ${data.fullName}`
  );

  return supervisor;
}

export const checkSuperAdminExists = checkSystemHasSuperAdmin;

export function getCurrentUserSession(): UserAccount | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserAccount;
  } catch {
    return null;
  }
}

export async function logoutUserSession(userId?: string, fullName?: string) {
  if (userId) {
    await logAuditAction(
      { id: userId, fullName: fullName || 'Foydalanuvchi', role: 'student' },
      "Tizimdan chiqish",
      'users',
      userId,
      "Foydalanuvchi tizimdan chiqdi."
    );
  }
  clearUserSession();
}

export async function registerAdminUser(
  data: {
    fullName: string;
    phone: string;
    password: string;
    role?: 'admin' | 'superAdmin';
  },
  actorId: string,
  actorName: string
) {
  const normalized = normalizePhone(data.phone);
  if (!isValidUzbekPhone(normalized)) {
    throw new Error("Telefon raqami noto'g'ri.");
  }

  const pwdCheck = validatePasswordStrength(data.password);
  if (!pwdCheck.isValid) {
    throw new Error("Admin paroli xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);
  const userRef = doc(collection(db, 'users'));
  const user: UserAccount = {
    id: userRef.id,
    fullName: data.fullName,
    phone: normalized,
    passwordHash,
    salt,
    role: data.role || 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  await setDoc(userRef, user);

  await logAuditAction(
    { id: actorId, fullName: actorName, role: 'superAdmin' },
    "Admin ro'yxatga olindi",
    'users',
    user.id,
    `Yangi ${user.role} qo'shildi: ${data.fullName}`
  );
  return user;
}

export async function toggleUserBlockStatus(
  userId: string,
  isActive: boolean,
  actorId: string,
  actorName: string
) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { isActive, updatedAt: new Date().toISOString() });
  await logAuditAction(
    { id: actorId, fullName: actorName, role: 'superAdmin' },
    isActive ? "Admin faollashtirildi" : "Admin bloklandi",
    'users',
    userId,
    `Admin holati: ${isActive ? 'Faol' : 'Bloklangan'}`
  );
}

export async function createAdminUserWithPermissions(
  data: {
    fullName: string;
    phone: string;
    password: string;
    email?: string;
    login?: string;
    position?: string;
    photoURL?: string;
    role?: 'admin' | 'superAdmin';
    permissions?: AdminPermissions;
  },
  actor: { id: string; fullName: string; role: UserRole }
): Promise<UserAccount> {
  if (actor.role !== 'superAdmin') {
    throw new Error("Faqat Super Admin yangi Admin yarata oladi!");
  }

  const normalized = normalizePhone(data.phone);
  if (!isValidUzbekPhone(normalized)) {
    throw new Error("Telefon raqami formati noto'g'ri. Masalan: +998 (90) 123-45-67");
  }

  if (!data.fullName.trim()) {
    throw new Error("Admin F.I.Sh. kiritilishi shart!");
  }

  const pwdCheck = validatePasswordStrength(data.password);
  if (!pwdCheck.isValid) {
    throw new Error("Admin paroli xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
  }

  // Check unique phone number
  const qPhone = query(collection(db, 'users'), where('phone', '==', normalized), limit(1));
  const snap = await getDocs(qPhone);
  if (!snap.empty) {
    throw new Error("Bu telefon raqam allaqachon boshqa foydalanuvchi tomonidan ro'yxatdan o'tgan.");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);
  const userRef = doc(collection(db, 'users'));

  const user: UserAccount = {
    id: userRef.id,
    fullName: data.fullName.trim(),
    phone: normalized,
    email: data.email?.trim() || '',
    login: data.login?.trim() || '',
    position: data.position?.trim() || 'Admin',
    photoURL: data.photoURL || '',
    passwordHash,
    salt,
    role: data.role || 'admin',
    permissions: data.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, user);

  await logAuditAction(
    actor,
    "Yangi Admin yaratildi",
    'users',
    user.id,
    `Super Admin tomonidan yangi ${user.role === 'superAdmin' ? 'Super Admin' : 'Admin'} yaratildi: ${user.fullName} (${user.phone})`
  );

  return user;
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  actor: { id: string; fullName: string; role: UserRole },
  targetPhone?: string,
  targetFullName?: string,
  targetRole?: UserRole
): Promise<void> {
  if (actor.role !== 'superAdmin' && actor.role !== 'admin') {
    throw new Error("Parolni yangilash huquqiga ega emassiz!");
  }

  const pwdCheck = validatePasswordStrength(newPassword);
  if (!pwdCheck.isValid) {
    throw new Error("Yangi parol xavfsizlik talablariga javob bermaydi: " + pwdCheck.errors.join(' '));
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);

  // 1. Try direct user doc lookup
  let foundUserDocId: string | null = null;
  let normalizedPhone = targetPhone ? normalizePhone(targetPhone) : '';

  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
      foundUserDocId = userId;
      if (!normalizedPhone && userSnap.data()?.phone) {
        normalizedPhone = userSnap.data()?.phone;
      }
    }
  } catch (err) {
    console.warn("Direct user lookup error:", err);
  }

  // 2. Check student doc
  if (!foundUserDocId) {
    try {
      const studentSnap = await getDoc(doc(db, 'students', userId));
      if (studentSnap.exists()) {
        const sData = studentSnap.data();
        if (sData?.userId) {
          const linkedUserSnap = await getDoc(doc(db, 'users', sData.userId));
          if (linkedUserSnap.exists()) {
            foundUserDocId = sData.userId;
          }
        }
        if (!normalizedPhone && sData?.phone) {
          normalizedPhone = normalizePhone(sData.phone);
        }
      }
    } catch (err) {
      console.warn("Student lookup error:", err);
    }
  }

  // 3. Check supervisor doc
  if (!foundUserDocId) {
    try {
      const supSnap = await getDoc(doc(db, 'supervisors', userId));
      if (supSnap.exists()) {
        const supData = supSnap.data();
        if (supData?.userId) {
          const linkedUserSnap = await getDoc(doc(db, 'users', supData.userId));
          if (linkedUserSnap.exists()) {
            foundUserDocId = supData.userId;
          }
        }
        if (!normalizedPhone && supData?.phone) {
          normalizedPhone = normalizePhone(supData.phone);
        }
      }
    } catch (err) {
      console.warn("Supervisor lookup error:", err);
    }
  }

  // 4. Search by phone in users collection
  if (!foundUserDocId && normalizedPhone) {
    try {
      const qPhone = query(collection(db, 'users'), where('phone', '==', normalizedPhone), limit(1));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        foundUserDocId = snapPhone.docs[0].id;
      }
    } catch (err) {
      console.warn("Phone query lookup error:", err);
    }
  }

  // 5. Update or create user
  if (foundUserDocId) {
    await updateDoc(doc(db, 'users', foundUserDocId), {
      passwordHash,
      salt,
      isActive: true,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: new Date().toISOString(),
    });
  } else {
    // If user doc doesn't exist yet, create it so the student/supervisor can log in
    if (!normalizedPhone) {
      throw new Error("Foydalanuvchining telefon raqami topilmadi. Parolni tiklash uchun telefon raqami kiritilgan bo'lishi kerak.");
    }
    const newUserRef = doc(collection(db, 'users'));
    foundUserDocId = newUserRef.id;
    const newAccount: UserAccount = {
      id: newUserRef.id,
      phone: normalizedPhone,
      passwordHash,
      salt,
      role: targetRole || 'student',
      fullName: targetFullName || 'Foydalanuvchi',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(newUserRef, newAccount);

    // Link back to student or supervisor document
    try {
      const studentSnap = await getDoc(doc(db, 'students', userId));
      if (studentSnap.exists()) {
        await updateDoc(doc(db, 'students', userId), { userId: newUserRef.id });
      }
      const supSnap = await getDoc(doc(db, 'supervisors', userId));
      if (supSnap.exists()) {
        await updateDoc(doc(db, 'supervisors', userId), { userId: newUserRef.id });
      }
    } catch {
      // non-fatal
    }
  }

  // 6. Reset any failed login attempts lockout
  if (normalizedPhone) {
    try {
      const docId = `phone_${normalizedPhone.replace(/\D/g, '')}`;
      await deleteDoc(doc(db, 'loginAttempts', docId));
    } catch {
      // non-fatal
    }
  }

  // 7. Log audit action
  await logAuditAction(
    actor,
    "Parol yangilandi",
    'users',
    foundUserDocId,
    `Foydalanuvchi (${targetFullName || normalizedPhone || foundUserDocId}) paroli muvaffaqiyatli yangilandi.`
  );
}

export async function updateAdminProfile(
  adminId: string,
  data: {
    fullName?: string;
    phone?: string;
    email?: string;
    login?: string;
    position?: string;
    photoURL?: string;
    avatarUrl?: string;
    permissions?: AdminPermissions;
    role?: UserRole;
    isActive?: boolean;
  },
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  if (actor.role !== 'superAdmin') {
    throw new Error("Faqat Super Admin admin ma'lumotlarini tahrirlay oladi!");
  }

  const updates: any = {
    updatedAt: new Date().toISOString(),
  };

  if (data.fullName !== undefined) updates.fullName = data.fullName.trim();
  if (data.phone !== undefined) {
    const normalized = normalizePhone(data.phone);
    if (!isValidUzbekPhone(normalized)) {
      throw new Error("Telefon raqami formati noto'g'ri.");
    }
    updates.phone = normalized;
  }
  if (data.email !== undefined) updates.email = data.email.trim();
  if (data.login !== undefined) updates.login = data.login.trim();
  if (data.position !== undefined) updates.position = data.position.trim();
  if (data.photoURL !== undefined) updates.photoURL = data.photoURL;
  if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
  if (data.permissions !== undefined) updates.permissions = data.permissions;
  if (data.role !== undefined) updates.role = data.role;
  if (data.isActive !== undefined) updates.isActive = data.isActive;

  const userRef = doc(db, 'users', adminId);
  await updateDoc(userRef, updates);

  await logAuditAction(
    actor,
    "Admin profili tahrirlandi",
    'users',
    adminId,
    `Admin profili yangilandi: ${updates.fullName || adminId}`
  );
}

export async function changeUserRole(
  userId: string,
  newRole: UserRole,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  return updateAdminProfile(userId, { role: newRole }, actor);
}

export async function softDeleteUser(
  userId: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  if (actor.role !== 'superAdmin' && actor.role !== 'admin') {
    throw new Error("Faqat Super Admin yoki Admin foydalanuvchini o'chira oladi!");
  }
  if (userId === actor.id) {
    throw new Error("O'z hisobingizni o'chira olmaysiz!");
  }

  const actorName = actor.fullName || (actor as any).name || actor.id || 'Admin';

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: actorName,
    isActive: false,
    updatedAt: new Date().toISOString(),
  });

  await logAuditAction(
    actor,
    "Admin/Foydalanuvchi o'chirildi (Soft delete)",
    'users',
    userId,
    `Foydalanuvchi chiqindilar qutisiga o'tkazildi.`
  );
}

export async function restoreUser(
  userId: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  if (actor.role !== 'superAdmin' && actor.role !== 'admin') {
    throw new Error("Faqat Super Admin yoki Admin hisobni qayta tiklay oladi!");
  }

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    isActive: true,
    updatedAt: new Date().toISOString(),
  });

  await logAuditAction(
    actor,
    "Foydalanuvchi qayta tiklandi",
    'users',
    userId,
    `Foydalanuvchi chiqindilar qutisidan tiklandi.`
  );
}

export async function permanentDeleteUser(
  userId: string,
  actor: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  if (actor.role !== 'superAdmin' && actor.role !== 'admin') {
    throw new Error("Faqat Super Admin yoki Admin butunlay o'chira oladi!");
  }
  if (userId === actor.id) {
    throw new Error("O'z hisobingizni o'chira olmaysiz!");
  }

  await deleteDoc(doc(db, 'users', userId));

  await logAuditAction(
    actor,
    "Foydalanuvchi butunlay o'chirildi (Permanent delete)",
    'users',
    userId,
    `Foydalanuvchi hisobi ma'lumotlar bazasidan butunlay tozalandi.`
  );
}


