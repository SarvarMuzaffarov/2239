export type CertificateDesignId =
  | 'modern_sidebar'
  | 'uzbek_portal'
  | 'header_footer_bands'
  | 'diagonal_ribbon'
  | 'government_decree'
  | 'cyber_tech'
  | 'swiss_minimal'
  | 'baroque_laurel'
  | 'diplomatic_wax'
  | 'corporate_id_card'
  // Backward compatibility aliases
  | 'royal_gold'
  | 'presidential_emerald'
  | 'modern_minimal'
  | 'national_girih'
  | 'academic_burgundy'
  | 'innovation_tech'
  | 'luxe_platinum'
  | 'sapphire_night'
  | 'diplomatic_ruby'
  | 'eco_emerald';

export type BackgroundPatternId =
  | 'guilloche'
  | 'girih'
  | 'tech_nodes'
  | 'parchment'
  | 'sunburst'
  | 'dots_grid'
  | 'concentric'
  | 'minimal_clean'
  | 'argyle_diamonds'
  | 'royal_damask';

export type CertificateLayoutType =
  | 'sidebar'       // Chap vertikal blokli
  | 'arch'          // Sharqona portal/arka
  | 'bands'         // Tepa va pastki qalin lentalar
  | 'ribbon'        // Burchakli ipak lenta va medalyon
  | 'decree'        // Davlat attestati va rasmiy diplom
  | 'cyber'         // Kiber-geometrik texno
  | 'minimalist'    // Lakonik Shveysariya minimalizmi
  | 'baroque'       // Klassik barokko dafna shoxlari
  | 'wax_seal'      // Diplomatik mum muhrli
  | 'smart_card';   // Xalqaro smart karta va reestr

export interface CertificateDesign {
  id: CertificateDesignId;
  name: string;
  category: string;
  badge: string;
  layoutType: CertificateLayoutType;
  layoutTitle: string;
  description: string;
  defaultPattern: BackgroundPatternId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  bgCenter: string;
  bgMid: string;
  bgEdge: string;
  previewGradient: string;
  tags: string[];
}

export interface BackgroundPatternOption {
  id: BackgroundPatternId;
  name: string;
  description: string;
  icon: string;
}

export const BACKGROUND_PATTERNS: BackgroundPatternOption[] = [
  {
    id: 'guilloche',
    name: 'Gilosh to‘lqinlari',
    description: 'Banknot va rasmiy qimmatli qog‘ozlar xavfsizlik to‘lqinlari',
    icon: '🌊',
  },
  {
    id: 'girih',
    name: 'O‘zbek milliy girih',
    description: 'Sharqona geometrik 8 qirrali yulduz va naqshlar',
    icon: '✨',
  },
  {
    id: 'tech_nodes',
    name: 'Molekulyar texno-to‘r',
    description: 'Kimyoviy molekulalar va innovatsion texnologik to‘r',
    icon: '🔬',
  },
  {
    id: 'parchment',
    name: 'Klassik pergament',
    description: 'Qadimiy oliyjanob qog‘oz to‘qimasi va yumshoq iliqlik',
    icon: '📜',
  },
  {
    id: 'sunburst',
    name: 'Radiatsion nur',
    description: 'Markazdan taraluvchi tantanavor quyosh nurlari',
    icon: '☀️',
  },
  {
    id: 'dots_grid',
    name: 'Meʼmoriy nuqtalar',
    description: 'Zamonaviy lakonik minimalist nuqtali panjara',
    icon: '▫️',
  },
  {
    id: 'concentric',
    name: 'Konsentrik ellipslar',
    description: 'Xavfsizlik muhrining konsentrik himoya xalqasi',
    icon: '🎯',
  },
  {
    id: 'minimal_clean',
    name: 'Toza oq aura',
    description: 'Yorqin shaffof, beg‘ubor va ortiqcha bezaklarsiz',
    icon: '⚪',
  },
  {
    id: 'argyle_diamonds',
    name: 'Geometrik romblar',
    description: 'Hashamatli nozik geometrik olmos to‘r va simmetriya',
    icon: '💠',
  },
  {
    id: 'royal_damask',
    name: 'Qirollik damashq naqshi',
    description: 'Oliyjanob klassik aristokratik ornament to‘qimasi',
    icon: '⚜️',
  },
];

export const CERTIFICATE_DESIGNS: CertificateDesign[] = [
  {
    id: 'modern_sidebar',
    name: 'Chap Vertikal Blokli',
    category: 'Zamonaviy IT & Split',
    badge: '📱',
    layoutType: 'sidebar',
    layoutTitle: 'Split Sidebar (Chap vertikal lenta)',
    description: 'Chapda institut ramzi va QR-karta vertikal panelda, o‘ngda keng ochiq tipografiya',
    defaultPattern: 'dots_grid',
    primaryColor: '#0f172a',
    secondaryColor: '#0d9488',
    accentColor: '#14b8a6',
    textColor: '#0f172a',
    subtextColor: '#475569',
    bgCenter: '#ffffff',
    bgMid: '#f8fafc',
    bgEdge: '#f1f5f9',
    previewGradient: 'from-slate-900 via-teal-800 to-teal-500',
    tags: ['Asimmetrik', 'Vertikal blok', 'Zamonaviy', 'QR-karta'],
  },
  {
    id: 'uzbek_portal',
    name: 'Sharqona Registon Arkasi',
    category: 'Milliy Meʼmorchilik',
    badge: '🕌',
    layoutType: 'arch',
    layoutTitle: 'Oriental Uzbek Portal (Arka & Ustunlar)',
    description: 'Samarqand-Buxoro naqshli Registon mehrob arkasi, feruza ustunlar va islimiy naqshlar',
    defaultPattern: 'girih',
    primaryColor: '#0369a1',
    secondaryColor: '#b45309',
    accentColor: '#f59e0b',
    textColor: '#0c4a6e',
    subtextColor: '#1e293b',
    bgCenter: '#ffffff',
    bgMid: '#f0f9ff',
    bgEdge: '#e0f2fe',
    previewGradient: 'from-sky-900 via-blue-700 to-amber-500',
    tags: ['Mehrob', 'Arka', 'Girih', 'Registon'],
  },
  {
    id: 'header_footer_bands',
    name: 'Tepa va Pastki Qalin Lentalar',
    category: 'Korporativ Blokli',
    badge: '🏛️',
    layoutType: 'bands',
    layoutTitle: 'Header & Footer Solid Bands',
    description: 'Tepada to‘liq to‘q rangli vazirlik lentasi, pastda muhr va imzoli rasmiy footer paneli',
    defaultPattern: 'guilloche',
    primaryColor: '#0b1f3a',
    secondaryColor: '#c5a059',
    accentColor: '#854d0e',
    textColor: '#0b1f3a',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#fcfcf9',
    bgEdge: '#f8f7f3',
    previewGradient: 'from-blue-950 via-slate-900 to-amber-500',
    tags: ['Gorizontal lentalar', 'Qalin bloklar', 'Rasmiy', 'Oltin hoshiya'],
  },
  {
    id: 'diagonal_ribbon',
    name: 'Ipak Lenta va Medalyon',
    category: 'Tantanali & Hashamat',
    badge: '🎗️',
    layoutType: 'ribbon',
    layoutTitle: 'Diagonal Ribbon & Hanging Seal',
    description: 'Yuqori burchakda qiya ipak lenta, pastki burchakda osilib turgan relyefli oltin medal',
    defaultPattern: 'sunburst',
    primaryColor: '#881337',
    secondaryColor: '#eab308',
    accentColor: '#ca8a04',
    textColor: '#4c0519',
    subtextColor: '#374151',
    bgCenter: '#ffffff',
    bgMid: '#fff7ed',
    bgEdge: '#fef2f2',
    previewGradient: 'from-rose-950 via-rose-800 to-amber-400',
    tags: ['Ipak lenta', 'Oltin medal', 'Tantanali', 'Hashamatli'],
  },
  {
    id: 'government_decree',
    name: 'Davlat Attestati / Diplom',
    category: 'Davlat Standarti',
    badge: '🇺🇿',
    layoutType: 'decree',
    layoutTitle: 'Bilateral Emblems & State Decree',
    description: 'Tepada ikkita mustaqil gerb (Vazirlik va Institut), qat’iy davlat hoshiyasi va qo‘sh imzo',
    defaultPattern: 'girih',
    primaryColor: '#064e3b',
    secondaryColor: '#d97706',
    accentColor: '#047857',
    textColor: '#064e3b',
    subtextColor: '#1e3a5f',
    bgCenter: '#ffffff',
    bgMid: '#f0fdf4',
    bgEdge: '#ecfdf5',
    previewGradient: 'from-emerald-950 via-emerald-800 to-amber-500',
    tags: ['Davlat diplomi', 'Qo‘sh gerb', 'Attestat', 'Ilmiy kengash'],
  },
  {
    id: 'cyber_tech',
    name: 'Kiber-Geometrik Texno',
    category: 'Startap & IT',
    badge: '⚡',
    layoutType: 'cyber',
    layoutTitle: 'Cyber Angled Tech & Chip Badge',
    description: '45° qirrali poligonlar, neon-indigo aksentlari, texnik koordinatalar va mikrosxema QR-karta',
    defaultPattern: 'tech_nodes',
    primaryColor: '#1e1b4b',
    secondaryColor: '#0284c7',
    accentColor: '#06b6d4',
    textColor: '#1e1b4b',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#f8fafc',
    bgEdge: '#e0f2fe',
    previewGradient: 'from-indigo-950 via-indigo-900 to-cyan-500',
    tags: ['Kiber', 'Startap', 'Texno', 'Mikrosxema'],
  },
  {
    id: 'swiss_minimal',
    name: 'Lakonik Shveysariya Minimalizmi',
    category: 'Zamonaviy Bauhaus',
    badge: '📐',
    layoutType: 'minimalist',
    layoutTitle: 'Swiss Asymmetrical Typographic',
    description: 'Chapga tekislangan qat’iy tipografik san’at, ultra-toza oq maydon va ixcham QR-karta',
    defaultPattern: 'minimal_clean',
    primaryColor: '#0f172a',
    secondaryColor: '#475569',
    accentColor: '#2563eb',
    textColor: '#0f172a',
    subtextColor: '#64748b',
    bgCenter: '#ffffff',
    bgMid: '#f8fafc',
    bgEdge: '#ffffff',
    previewGradient: 'from-slate-900 via-slate-700 to-blue-600',
    tags: ['Shveysariya', 'Minimalist', 'Tipografiya', 'Toza'],
  },
  {
    id: 'baroque_laurel',
    name: 'Barokko Dafna Shoxlari',
    category: 'Klassik Akademiya',
    badge: '👑',
    layoutType: 'baroque',
    layoutTitle: 'Baroque Laurel Garland & Filigree',
    description: 'To‘rtta burchakda tilla dafna barglari chambari, kalligrafik harflar va filigran ramka',
    defaultPattern: 'guilloche',
    primaryColor: '#0b1f3a',
    secondaryColor: '#c5a059',
    accentColor: '#854d0e',
    textColor: '#0b1f3a',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#fcfcf9',
    bgEdge: '#f8f7f3',
    previewGradient: 'from-blue-950 via-amber-700 to-amber-500',
    tags: ['Dafna chambari', 'Barokko', 'Oltin filigran', 'Akademiya'],
  },
  {
    id: 'diplomatic_wax',
    name: 'Diplomatik Mum Muhrli',
    category: 'Xalqaro Shartnoma',
    badge: '🔴',
    layoutType: 'wax_seal',
    layoutTitle: 'Diplomatic Treaty & Red Wax Seal',
    description: 'Qadimiy yunon hoshiyasi, pastki markazda qizil lentalar bilan bosilgan 3D relyefli mum muhr',
    defaultPattern: 'parchment',
    primaryColor: '#7f1d1d',
    secondaryColor: '#991b1b',
    accentColor: '#b45309',
    textColor: '#7f1d1d',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#fef2f2',
    bgEdge: '#fff7ed',
    previewGradient: 'from-red-950 via-red-900 to-amber-600',
    tags: ['Mum muhr', 'Qizil lenta', 'Diplomatik', 'Shartnoma'],
  },
  {
    id: 'corporate_id_card',
    name: 'Xalqaro Smart Karta va Reestr',
    category: 'Xalqaro Standart',
    badge: '💳',
    layoutType: 'smart_card',
    layoutTitle: 'International Dual-Tone & Smart Card',
    description: 'Ikki tilli xalqaro format, o‘ng burchakda himoyalangan chip-karta ko‘rinishidagi elektron reestr',
    defaultPattern: 'concentric',
    primaryColor: '#082f49',
    secondaryColor: '#0284c7',
    accentColor: '#38bdf8',
    textColor: '#082f49',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#f0f9ff',
    bgEdge: '#e0f2fe',
    previewGradient: 'from-sky-950 via-blue-900 to-sky-400',
    tags: ['Smart karta', 'Ikki tilli', 'Xalqaro', 'Elektron reestr'],
  },
];

// Map legacy IDs to new structural designs if old certificates have legacy IDs
const LEGACY_MAP: Record<string, CertificateDesignId> = {
  royal_gold: 'baroque_laurel',
  presidential_emerald: 'government_decree',
  modern_minimal: 'modern_sidebar',
  national_girih: 'uzbek_portal',
  academic_burgundy: 'header_footer_bands',
  innovation_tech: 'cyber_tech',
  luxe_platinum: 'diagonal_ribbon',
  sapphire_night: 'corporate_id_card',
  diplomatic_ruby: 'diplomatic_wax',
  eco_emerald: 'swiss_minimal',
};

export function getCertificateDesign(designId?: string): CertificateDesign {
  if (!designId) return CERTIFICATE_DESIGNS[0];
  const direct = CERTIFICATE_DESIGNS.find(d => d.id === designId);
  if (direct) return direct;
  const mappedId = LEGACY_MAP[designId];
  if (mappedId) {
    const mapped = CERTIFICATE_DESIGNS.find(d => d.id === mappedId);
    if (mapped) return mapped;
  }
  return CERTIFICATE_DESIGNS[0];
}

export function getBackgroundPattern(patternId?: string): BackgroundPatternOption {
  if (!patternId) return BACKGROUND_PATTERNS[0];
  const found = BACKGROUND_PATTERNS.find(p => p.id === patternId);
  return found || BACKGROUND_PATTERNS[0];
}
