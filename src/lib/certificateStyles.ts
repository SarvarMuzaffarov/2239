export type CertificateDesignId =
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
  | 'minimal_clean';

export interface CertificateDesign {
  id: CertificateDesignId;
  name: string;
  category: string;
  badge: string;
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
];

export const CERTIFICATE_DESIGNS: CertificateDesign[] = [
  {
    id: 'royal_gold',
    name: 'Klassik Qirollik',
    category: 'Akademik & Qirollik',
    badge: '👑',
    description: 'Chuqur to‘q ko‘k va oltin hoshiya, banknot to‘lqinlari va akademik oltin medal',
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
    tags: ['Klassik', 'Qirollik', 'Oltin', 'Oliy e’tirof'],
  },
  {
    id: 'presidential_emerald',
    name: 'Prezidentlik va Davlat',
    category: 'Davlat & Faxriy',
    badge: '🏛️',
    description: 'O‘zbekiston zumrad yashili va jiloli oltin, davlat e’tirofi va 8 qirrali yulduz muhri',
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
    tags: ['Davlat', 'Prezidentlik', 'Zumrad', 'G‘olib'],
  },
  {
    id: 'modern_minimal',
    name: 'Zamonaviy Minimalist',
    category: 'Innovatsion',
    badge: '💎',
    description: 'Zamonaviy lakonik uslub, chuqur grafit va firuza aksentlari, toza geometriya',
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
    tags: ['Zamonaviy', 'Minimal', 'Firuza', 'Texno'],
  },
  {
    id: 'national_girih',
    name: 'Milliy Sharqona',
    category: 'Milliy Meros',
    badge: '🇺🇿',
    description: 'Sharqona girih va islimiy naqshlar, feruza ko‘k va sharqona oltin uyg‘unligi',
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
    tags: ['Milliy', 'Sharqona', 'Girih', 'Meros'],
  },
  {
    id: 'academic_burgundy',
    name: 'Akademik Meros',
    category: 'Ilmiy-tadqiqot',
    badge: '📜',
    description: 'Universitet an’anaviy to‘q yoqut/bordo rangi, antiqa bronza va ilmiy kitob muhri',
    defaultPattern: 'parchment',
    primaryColor: '#4c0519',
    secondaryColor: '#b45309',
    accentColor: '#881337',
    textColor: '#4c0519',
    subtextColor: '#374151',
    bgCenter: '#ffffff',
    bgMid: '#fff7ed',
    bgEdge: '#fef2f2',
    previewGradient: 'from-rose-950 via-rose-900 to-amber-600',
    tags: ['Akademik', 'Ilmiy', 'Bordo', 'Institut'],
  },
  {
    id: 'innovation_tech',
    name: 'Innovatsiya va Texnologiya',
    category: 'Startap & IT',
    badge: '🔬',
    description: 'Elektr indigo va kiber-sian aksentlari, molekulyar to‘r va kimyo-texnologiya belgisi',
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
    tags: ['Startap', 'Innovatsiya', 'Texnologiya', 'Kimyo'],
  },
  {
    id: 'luxe_platinum',
    name: 'Platina va Oltin',
    category: 'Premium Lyuks',
    badge: '⭐',
    description: 'Yorqin metallik oltin va platina hoshiyalar, radial quyosh nurlari va tantanavorlik',
    defaultPattern: 'sunburst',
    primaryColor: '#1e293b',
    secondaryColor: '#eab308',
    accentColor: '#ca8a04',
    textColor: '#0f172a',
    subtextColor: '#475569',
    bgCenter: '#ffffff',
    bgMid: '#fefce8',
    bgEdge: '#fef08a',
    previewGradient: 'from-slate-900 via-amber-600 to-yellow-400',
    tags: ['Lyuks', 'Platina', 'Yorqin oltin', 'Tantanali'],
  },
  {
    id: 'sapphire_night',
    name: 'Tungi Sapfir',
    category: 'Kosmik & Ilm',
    badge: '🌌',
    description: 'Tungi chuqur sapfir moviyligi, yulduzli kumush chiziqlar va intellektual salobat',
    defaultPattern: 'concentric',
    primaryColor: '#082f49',
    secondaryColor: '#0284c7',
    accentColor: '#38bdf8',
    textColor: '#082f49',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#f0fdf4',
    bgEdge: '#f0f9ff',
    previewGradient: 'from-sky-950 via-blue-900 to-sky-400',
    tags: ['Sapfir', 'Kumush', 'Intellektual', 'Ilm-fan'],
  },
  {
    id: 'diplomatic_ruby',
    name: 'Diplomatik va Xalqaro',
    category: 'Xalqaro & Rasmiy',
    badge: '🎖️',
    description: 'Xalqaro rasmiy qizil yoqut va kumush hoshiya, xalqaro e’tirof va rasmiy muhr',
    defaultPattern: 'concentric',
    primaryColor: '#7f1d1d',
    secondaryColor: '#991b1b',
    accentColor: '#475569',
    textColor: '#7f1d1d',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#fef2f2',
    bgEdge: '#fef2f2',
    previewGradient: 'from-red-950 via-red-900 to-slate-400',
    tags: ['Diplomatik', 'Xalqaro', 'Yoqut', 'Nufuzli'],
  },
  {
    id: 'eco_emerald',
    name: 'Yashil Innovatsiya',
    category: 'Biologiya & Ekologiya',
    badge: '🌿',
    description: 'Toza tabiat va o‘rmon zumradi, iliq zaytun bronzasi, ekologik va bio-kimyoviy uslub',
    defaultPattern: 'minimal_clean',
    primaryColor: '#14532d',
    secondaryColor: '#854d0e',
    accentColor: '#16a34a',
    textColor: '#14532d',
    subtextColor: '#334155',
    bgCenter: '#ffffff',
    bgMid: '#f0fdf4',
    bgEdge: '#dcfce7',
    previewGradient: 'from-emerald-950 via-green-800 to-lime-500',
    tags: ['Ekologik', 'Bio-kimyo', 'Yashil', 'Innovatsion'],
  },
];

export function getCertificateDesign(designId?: string): CertificateDesign {
  if (!designId) return CERTIFICATE_DESIGNS[0];
  const found = CERTIFICATE_DESIGNS.find(d => d.id === designId);
  return found || CERTIFICATE_DESIGNS[0];
}

export function getBackgroundPattern(patternId?: string): BackgroundPatternOption {
  if (!patternId) return BACKGROUND_PATTERNS[0];
  const found = BACKGROUND_PATTERNS.find(p => p.id === patternId);
  return found || BACKGROUND_PATTERNS[0];
}
