/**
 * Centralized list of the 18 official educational directions for the platform.
 * All modules (Registration, Student Profile, Admin, Supervisor, Statistics,
 * Reports, Excel Export, Search, Filters, Portfolio PDF) MUST use this single source of truth.
 */

export const OFFICIAL_DIRECTIONS = [
  "Iqtisodiyot",
  "Menejment",
  "Kompyuter injiniringi",
  "Sun’iy intellekt",
  "Kimyo muhandisligi",
  "Biotexnologiya",
  "Energetika muhandisligi",
  "Texnologik jarayonlar va ishlab chiqarishni avtomatlashtirish",
  "Atrof-muhit muhandisligi",
  "Oziq-ovqat texnologiyasi",
  "Materialshunoslik",
  "Texnologik mashinalar va jihozlar",
  "Neft va neft-gazni qayta ishlash texnologiyasi",
  "Qishloq xo‘jaligini mexanizatsiyalashtirish",
  "Agrokimyo va tuproqshunoslik",
  "Agronomiya",
  "O‘simliklar himoyasi va karantini",
  "Qishloq xo‘jalik mahsulotlarini saqlash va qayta ishlash texnologiyasi",
] as const;

/** Alias for convenient import */
export const DIRECTIONS = OFFICIAL_DIRECTIONS;

export type OfficialDirection = (typeof OFFICIAL_DIRECTIONS)[number];

/**
 * Standardize text for loose comparison:
 * handles Uzbek apostrophes (' , ‘ , ’ , `) and case.
 */
function cleanForComparison(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, "'")
    .replace(/\s+/g, ' ');
}

// Map for quick canonical lookup
const lookupMap = new Map<string, OfficialDirection>();
OFFICIAL_DIRECTIONS.forEach(dir => {
  lookupMap.set(cleanForComparison(dir), dir);
});

// Safe mapping for common historical/legacy aliases to preserve existing data compatibility
const legacyAliases: Record<string, OfficialDirection> = {
  "kompyuter muhandisligi": "Kompyuter injiniringi",
  "dasturiy injiniring": "Kompyuter injiniringi",
  "axborot xavfsizligi": "Kompyuter injiniringi",
  "axborot texnologiyalari": "Kompyuter injiniringi",
  "sun'iy intellekt": "Sun’iy intellekt",
  "o'simliklar himoyasi va karantini": "O‘simliklar himoyasi va karantini",
  "qishloq xo'jaligini mexanizatsiyalashtirish": "Qishloq xo‘jaligini mexanizatsiyalashtirish",
  "qishloq xo'jalik mahsulotlarini saqlash va qayta ishlash texnologiyasi": "Qishloq xo‘jalik mahsulotlarini saqlash va qayta ishlash texnologiyasi",
  "oziq-ovqat texnologiyalari": "Oziq-ovqat texnologiyasi",
  "kimyoviy texnologiya": "Kimyo muhandisligi",
};

Object.entries(legacyAliases).forEach(([alias, target]) => {
  const key = cleanForComparison(alias);
  if (!lookupMap.has(key)) {
    lookupMap.set(key, target);
  }
});

/**
 * Checks whether a given string corresponds to one of the 18 official directions.
 * Strictly rejects generic strings like "IT", "Computer", "Boshqa", "Test", etc.
 */
export function isValidDirection(val?: string | null): val is OfficialDirection {
  if (!val || typeof val !== 'string') return false;
  const cleaned = cleanForComparison(val);
  return lookupMap.has(cleaned);
}

/**
 * Returns the exact canonical official string if matched,
 * or gracefully returns the original trimmed string for unmapped existing legacy records
 * so production data is never lost or blanked out.
 */
export function canonicalizeDirection(val?: string | null): string {
  if (!val || typeof val !== 'string') return '';
  const cleaned = cleanForComparison(val);
  const matched = lookupMap.get(cleaned);
  if (matched) return matched;
  return val.trim();
}

/**
 * Strict validator for new registrations and updates:
 * Returns an error message if invalid.
 */
export function validateDirectionInput(val?: string | null): {
  isValid: boolean;
  canonical: string;
  error?: string;
} {
  if (!val || typeof val !== 'string' || !val.trim()) {
    return {
      isValid: false,
      canonical: '',
      error: "Iltimos, ta'lim yo'nalishini tanlang.",
    };
  }

  const cleaned = cleanForComparison(val);
  const matched = lookupMap.get(cleaned);

  if (!matched) {
    return {
      isValid: false,
      canonical: '',
      error: "Noto'g'ri ta'lim yo'nalishi. Faqat rasmiy 18 ta yo'nalishdan birini tanlang.",
    };
  }

  return {
    isValid: true,
    canonical: matched,
  };
}

/**
 * Returns array of known variants (canonical + legacy aliases) for a direction
 * to enable fuzzy matching in Firestore 'in' queries.
 */
export function getDirectionFilterVariants(val: string): string[] {
  if (!val || val === 'all') return [];
  const canonical = canonicalizeDirection(val);
  const variants = new Set<string>();
  variants.add(val);
  if (canonical) {
    variants.add(canonical);
  }

  // Check which legacy aliases map to this canonical
  Object.entries(legacyAliases).forEach(([alias, target]) => {
    if (target === canonical || target === val) {
      variants.add(alias);
      // Capitalize first letter variant as well
      variants.add(alias.charAt(0).toUpperCase() + alias.slice(1));
    }
  });

  return Array.from(variants);
}
