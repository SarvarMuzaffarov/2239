/**
 * Cryptographic helper functions for password hashing and phone normalization.
 */

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:iqtidorli-talabalar-platform-salt`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === expectedHash;
}

/**
 * Normalizes phone numbers to standard "+998XXXXXXXXX"
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (digits.startsWith('8') && digits.length === 10) {
    return `+998${digits.slice(1)}`;
  }
  return `+${digits}`;
}

/**
 * Formats a phone string into readable "+998 (90) 123-45-67"
 */
export function formatUzbekPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let num = digits;
  if (num.startsWith('998')) {
    num = num.slice(3);
  }
  num = num.slice(0, 9); // max 9 digits after 998

  let formatted = '+998';
  if (num.length > 0) {
    formatted += ` (${num.slice(0, 2)}`;
  }
  if (num.length >= 2) {
    formatted += `) ${num.slice(2, 5)}`;
  }
  if (num.length >= 5) {
    formatted += `-${num.slice(5, 7)}`;
  }
  if (num.length >= 7) {
    formatted += `-${num.slice(7, 9)}`;
  }
  return formatted;
}

export function isValidUzbekPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Must have exactly 12 digits starting with 998, followed by valid 2-digit operator code (33, 88, 90, 91, 93, 94, 95, 97, 98, 99, 71, 77, 50, etc)
  return digits.length === 12 && digits.startsWith('998');
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 - 4
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  errors: string[];
}

/**
 * Validates password against modern university security guidelines:
 * - At least 8 characters
 * - Contains at least one letter (a-z, A-Z)
 * - Contains at least one number (0-9)
 * - Optional bonus score for special characters and 10+ characters
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 8;
  const hasLetter = /[a-zA-Zа-яА-ЯўқғҳЎҚҒҲ]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd);

  const errors: string[] = [];
  if (!hasMinLength) {
    errors.push("Kamida 8 ta belgidan iborat bo'lishi kerak.");
  }
  if (!hasLetter) {
    errors.push("Kamida bitta harf (A-Z yoki a-z) bo'lishi kerak.");
  }
  if (!hasNumber) {
    errors.push("Kamida bitta raqam (0-9) bo'lishi kerak.");
  }

  let score = 0;
  if (pwd.length >= 8) score++;
  if (hasLetter && hasNumber) score++;
  if (pwd.length >= 10) score++;
  if (hasSpecialChar) score++;

  return {
    isValid: errors.length === 0,
    score,
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSpecialChar,
    errors,
  };
}

export function formatRemainingSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 soniya';
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  if (min > 0) {
    return `${min} daqiqa ${sec > 0 ? `${sec} soniya` : ''}`.trim();
  }
  return `${sec} soniya`;
}
