import { StudentProfile } from '../types';
import { canonicalizeDirection } from '../constants/directions';

/**
 * Cyrillic to Latin mapping for Uzbek language
 */
const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': "'",
  'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': "o'", 'ғ': "g'",
  'қ': 'q', 'ҳ': 'h'
};

/**
 * Normalizes Uzbek text by:
 * 1. Converting to lower case and trimming
 * 2. Transliterating Cyrillic Uzbek to Latin
 * 3. Normalizing all types of apostrophes/okinas (’, ‘, ʻ, ʼ, `, ´) to standard single quote (')
 * 4. Collapsing extra whitespace
 */
export function normalizeUzbekText(text?: string | null): string {
  if (!text) return '';
  let str = text.toLowerCase().trim();

  // Transliterate Cyrillic to Latin if contains Cyrillic
  if (/[а-яёқҳғў]/i.test(str)) {
    let converted = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      converted += CYRILLIC_TO_LATIN_MAP[char] !== undefined ? CYRILLIC_TO_LATIN_MAP[char] : char;
    }
    str = converted;
  }

  // Unify all apostrophe variants: ‘, ’, ʻ, ʼ, `, ´, '
  str = str.replace(/[‘’ʻʼ`´]/g, "'");

  // Normalize Unicode representations
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Collapse multiple whitespaces
  str = str.replace(/\s+/g, ' ');

  return str;
}

/**
 * Strips apostrophes and non-alphanumeric characters for fuzzy fallback matching.
 * e.g. "bo'riyev" -> "boriyev", "o'g'li" -> "ogli"
 */
export function stripApostrophes(text?: string | null): string {
  if (!text) return '';
  return normalizeUzbekText(text).replace(/['\-_.\s]/g, '');
}

/**
 * Extracts only digits from text (useful for phone numbers)
 */
export function extractDigits(text?: string | null): string {
  if (!text) return '';
  return text.replace(/\D/g, '');
}

/**
 * Smart matching algorithm for students in Uzbek higher education system.
 * Matches multi-word queries regardless of word order (e.g. "Sarvar Muzaffarov" or "Muzaffarov Sarvar").
 * Handles apostrophes ("Bo'riyev" vs "Boʻriyev" vs "Boriyev"), Cyrillic transliteration,
 * phone numbers, groups ("21-01"), courses, and faculties.
 */
export function matchesStudentSearch(
  student: StudentProfile,
  searchQuery: string,
  supervisorName?: string
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;

  const rawQuery = searchQuery.trim();
  const tokens = rawQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  // Pre-calculate normalized and stripped student fields
  const normName = normalizeUzbekText(student.fullName);
  const strippedName = stripApostrophes(student.fullName);

  const rawPhone = student.phone || '';
  const digitsPhone = extractDigits(rawPhone);

  const normGroup = normalizeUzbekText(student.group);
  const strippedGroup = stripApostrophes(student.group);

  const rawFaculty = student.facultyOrField || '';
  const canonicalFaculty = canonicalizeDirection(rawFaculty);
  const normFaculty = normalizeUzbekText(rawFaculty);
  const normCanonicalFaculty = normalizeUzbekText(canonicalFaculty);
  const strippedFaculty = stripApostrophes(rawFaculty);

  const courseStr = student.course ? student.course.toString() : '';
  const courseWithSuffix = courseStr ? `${courseStr}-kurs` : '';

  const normCustomSupervisor = normalizeUzbekText(student.customSupervisorName);
  const normSupervisor = supervisorName ? normalizeUzbekText(supervisorName) : '';

  const studentId = student.id ? student.id.toLowerCase() : '';

  // ALL tokens in the query must match at least one of the student's attributes
  return tokens.every(token => {
    const normToken = normalizeUzbekText(token);
    const strippedToken = stripApostrophes(token);
    const tokenDigits = extractDigits(token);

    // 1. Full name match (normal, stripped, or token included in name)
    if (normName.includes(normToken)) return true;
    if (strippedToken && strippedName.includes(strippedToken)) return true;

    // 2. Phone match (exact digits or substring of phone)
    if (tokenDigits.length >= 3) {
      if (digitsPhone.includes(tokenDigits)) return true;
      if (rawPhone.includes(token)) return true;
    }

    // 3. Group match (e.g. "21-01", "2101", "01")
    if (normGroup.includes(normToken)) return true;
    if (strippedToken && strippedGroup.includes(strippedToken)) return true;

    // 4. Direction / Faculty match (e.g. "kimyo", "iqtisodiyot", "axborot")
    if (normFaculty.includes(normToken)) return true;
    if (normCanonicalFaculty.includes(normToken)) return true;
    if (strippedToken && strippedFaculty.includes(strippedToken)) return true;

    // 5. Course match (e.g. "1-kurs", "2-kurs", "1", "2", "3", "4")
    if (normToken === courseStr || normToken === courseWithSuffix) return true;

    // 6. Supervisor match (assigned or custom entered)
    if (normSupervisor && normSupervisor.includes(normToken)) return true;
    if (normCustomSupervisor && normCustomSupervisor.includes(normToken)) return true;

    // 7. Student Document ID match
    if (studentId.includes(normToken)) return true;

    return false;
  });
}
