import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  CertificateDesignId,
  BackgroundPatternId,
  CertificateDesign,
  BackgroundPatternOption,
  CERTIFICATE_DESIGNS,
  BACKGROUND_PATTERNS,
  getCertificateDesign,
  getBackgroundPattern,
} from './certificateStyles';
import {
  drawBackgroundPattern,
  drawCertificateFrame,
  drawCertificateHeaderDivider,
  drawAwardMedalForDesign,
} from './certificateStylesRenderers';

export {
  CERTIFICATE_DESIGNS,
  BACKGROUND_PATTERNS,
  getCertificateDesign,
  getBackgroundPattern,
};
export type {
  CertificateDesignId,
  BackgroundPatternId,
  CertificateDesign,
  BackgroundPatternOption,
};

export interface CertificateData {
  certificateNumber: string;
  studentName: string;
  title: string;
  eventTitle: string;
  organizationName?: string;
  issueDate: string;

  // Dynamic fields
  documentType?: 'diplom' | 'sertifikat';
  subtitle?: string;
  presentedToText?: string;
  description?: string;
  competitionName?: string;
  nomination?: string;
  confirmationText?: string;
  decisionNumber?: string;
  awardLevel?: string;
  additionalNote?: string;
  signatoryName?: string;
  signatoryRole?: string;
  signatoryDegree?: string;
  studentDirection?: string;
  footerText?: string;
  additionalSignatureText?: string;
  verificationUrl?: string;
  designId?: string;
  backgroundPattern?: string;
}

export interface PresetTemplate {
  id: string;
  name: string;
  badge: string;
  documentType: 'diplom' | 'sertifikat';
  title: string;
  subtitle: string;
  presentedToText: string;
  nomination: string;
  description: string;
  confirmationText?: string;
  awardLevel?: string;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'iqtidorli_faxriy',
    name: 'Iqtidorli talaba (Faxriy sertifikat)',
    badge: '🌟',
    documentType: 'sertifikat',
    title: 'IQTIDORLI TALABA FAXRIY SERTIFIKATI',
    subtitle: 'Maxsus faxriy e’tirof',
    presentedToText:
      'Ushbu sertifikat iqtidorli talaba sifatida erishgan yuksak natijalari hamda faoliyati uchun taqdim etiladi.',
    nomination: '«Yilning eng iqtidorli talabasi»',
    description:
      'o‘quv, ilmiy-tadqiqot, innovatsion ishlanmalar va jamoat ishlaridagi yuksak natijalari hamda faol tashabbusi uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: 'Faxriy sertifikat',
  },
  {
    id: 'winner',
    name: "Tanlov g'olibi",
    badge: '🏆',
    documentType: 'diplom',
    title: 'DIPLOM',
    subtitle: 'Tanlov g‘olibi',
    presentedToText: 'Ushbu diplom',
    nomination: '«Mutaxassislik bo‘yicha tanlov g‘olibi»',
    description:
      'tanlovida yuqori natija, chuqur bilim va iqtidor namoyish etib, faxrli g‘oliblikni qo‘lga kiritgani uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: 'Tanlov g‘olibi',
  },
  {
    id: 'place1',
    name: "1-o'rin",
    badge: '🥇',
    documentType: 'diplom',
    title: 'DIPLOM',
    subtitle: '1-o‘rin (I darajali diplom)',
    presentedToText: 'Ushbu diplom',
    nomination: '«I darajali diplom sohibi»',
    description:
      'tanlovida eng yuqori natijani ko‘rsatib, faxrli 1-o‘rinni qo‘lga kiritgani uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: '1-o‘rin',
  },
  {
    id: 'place2',
    name: "2-o'rin",
    badge: '🥈',
    documentType: 'diplom',
    title: 'DIPLOM',
    subtitle: '2-o‘rin (II darajali diplom)',
    presentedToText: 'Ushbu diplom',
    nomination: '«II darajali diplom sohibi»',
    description:
      'tanlovida yuqori bilim va mahorat namoyish etib, faxrli 2-o‘rinni qo‘lga kiritgani uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: '2-o‘rin',
  },
  {
    id: 'place3',
    name: "3-o'rin",
    badge: '🥉',
    documentType: 'diplom',
    title: 'DIPLOM',
    subtitle: '3-o‘rin (III darajali diplom)',
    presentedToText: 'Ushbu diplom',
    nomination: '«III darajali diplom sohibi»',
    description:
      'tanlovida munosib va muvaffaqiyatli ishtirok etib, faxrli 3-o‘rinni qo‘lga kiritgani uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: '3-o‘rin',
  },
  {
    id: 'honorary',
    name: 'Faxriy yorliq',
    badge: '🎖️',
    documentType: 'diplom',
    title: 'FAXRIY YORLIQ',
    subtitle: 'Faxriy e’tirof',
    presentedToText: 'Ushbu faxriy yorliq',
    nomination: '«Yuksak natijalar uchun»',
    description:
      'o‘quv, ilmiy-tadqiqot va jamoat ishlaridagi yuksak intilishi hamda erishgan yutuqlari uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: 'Faxriy yorliq',
  },
  {
    id: 'participant',
    name: 'Faol ishtirokchi',
    badge: '⭐',
    documentType: 'sertifikat',
    title: 'SERTIFIKAT',
    subtitle: 'Faol ishtirokchi',
    presentedToText: 'Ushbu sertifikat',
    nomination: '«Eng faol ishtirokchi»',
    description:
      'tashkil etilgan nufuzli ilmiy-amaliy tadbirda faol va tashabbuskor ishtiroki uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: 'Ishtirokchi',
  },
  {
    id: 'talented',
    name: 'Iqtidorli talaba',
    badge: '🎓',
    documentType: 'diplom',
    title: 'DIPLOM',
    subtitle: 'Yilning eng iqtidorli talabasi',
    presentedToText: 'Ushbu diplom',
    nomination: '«Iqtidorli talaba»',
    description:
      'o‘quv, ilmiy va ijodiy faoliyatidagi yuqori intilishi, ilg‘or g‘oyalari bilan tengdoshlariga o‘rnak bo‘lganligi uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: 'Tanlov g‘olibi',
  },
  {
    id: 'innovation',
    name: 'Innovatsion loyiha',
    badge: '🚀',
    documentType: 'diplom',
    title: 'DIPLOM',
    subtitle: 'Innovatsion loyiha g‘olibi',
    presentedToText: 'Ushbu diplom',
    nomination: '«Eng yaxshi innovatsion loyiha»',
    description:
      'startap va innovatsion ishlanmalar ko‘rgazmasida amaliy ahamiyatga molik istiqbolli loyihani himoya qilgani uchun taqdim etiladi.',
    confirmationText:
      'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.',
    awardLevel: 'G‘olib',
  },
];

/**
 * Generates the next guaranteed unique certificate or diploma number.
 * Automatically scans all existing certificates in the registry to avoid duplicates.
 * Example outputs: 'CERT-2026-1152', 'DIP-2026-1152'
 */
export function generateNextCertificateNumber(
  docType: 'diplom' | 'sertifikat' = 'diplom',
  existingCertificates: Array<{ certificateNumber?: string; documentType?: string }> = [],
  offset: number = 0
): string {
  const isDiplom = docType === 'diplom';
  const prefix = isDiplom ? 'DIP-2026-' : 'CERT-2026-';
  const usedNumbers = new Set<string>();

  // Maintain separate sequence counters for DIP and CERT
  let maxNumeric = 1000;
  const prefixRegex = isDiplom ? /^DIP-2026-(\d+)$/i : /^CERT-2026-(\d+)$/i;

  if (Array.isArray(existingCertificates)) {
    for (const c of existingCertificates) {
      if (!c || !c.certificateNumber) continue;
      const clean = c.certificateNumber.trim().toUpperCase();
      usedNumbers.add(clean);

      // Scan ONLY numbers matching the current document type prefix
      const match = clean.match(prefixRegex);
      if (match) {
        const val = parseInt(match[1], 10);
        // Exclude huge out-of-range epoch millisecond numbers like 822661
        if (!isNaN(val) && val > maxNumeric && val < 90000) {
          maxNumeric = val;
        }
      }
    }
  }

  let candidate = maxNumeric + 1 + offset;
  while (usedNumbers.has(`${prefix}${candidate}`.toUpperCase())) {
    candidate++;
  }

  return `${prefix}${candidate}`;
}

/**
 * Format date nicely in Uzbek format (e.g. 2026-yil 14-sentabr)
 */
export function formatUzbekCertificateDate(dateStr?: string): string {
  if (!dateStr) return '2026-yil';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'yanvar',
        'fevral',
        'mart',
        'aprel',
        'may',
        'iyun',
        'iyul',
        'avgust',
        'sentabr',
        'oktabr',
        'noyabr',
        'dekabr',
      ];
      return `${year}-yil ${day}-${months[monthIndex] || 'oy'}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const months = [
        'yanvar',
        'fevral',
        'mart',
        'aprel',
        'may',
        'iyun',
        'iyul',
        'avgust',
        'sentabr',
        'oktabr',
        'noyabr',
        'dekabr',
      ];
      return `${year}-yil ${d.getDate()}-${months[d.getMonth()]}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Render the full A4 Landscape Diploma to an HTML Canvas
 * Resolution: 2970 x 2100 px (exact A4 landscape 297:210, 254 DPI, ~10px/mm)
 */
export async function renderCertificateToCanvas(
  data: CertificateData,
  canvas: HTMLCanvasElement
): Promise<string> {
  const width = 2970;
  const height = 2100;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Resolve dynamic values with clean defaults
  const isDiplom =
    data.documentType === 'diplom' ||
    (!data.documentType && (data.title?.toLowerCase().includes('diplom') ?? false));

  const docTitle =
    data.title?.trim() || 'IQTIDORLI TALABA FAXRIY SERTIFIKATI';

  const docSubtitle =
    data.subtitle?.trim() || 'Iqtidorli talaba faxriy sertifikati';

  // Official wording: "Ushbu sertifikat iqtidorli talaba sifatida erishgan yuksak natijalari hamda faoliyati uchun taqdim etiladi."
  const presentedTo =
    data.presentedToText?.trim() ||
    'Ushbu sertifikat iqtidorli talaba sifatida erishgan yuksak natijalari hamda faoliyati uchun taqdim etiladi.';

  const certNumber = data.certificateNumber?.trim() || 'CERT-2026-6395';
  const issueDateFormatted = formatUzbekCertificateDate(data.issueDate);

  // Student Full Name - ensure no mock placeholder
  let rawStudentName = data.studentName?.trim() || 'SARVAR MUZAFFAROV';
  if (
    rawStudentName.toLowerCase().includes('talabaning') ||
    rawStudentName.toLowerCase().includes('f.i.sh') ||
    rawStudentName.toLowerCase().includes('placeholder')
  ) {
    rawStudentName = 'SARVAR MUZAFFAROV';
  }
  const studentName = rawStudentName;

  // Event or Competition Name
  const eventName =
    data.competitionName?.trim() ||
    data.eventTitle?.trim() ||
    data.nomination?.trim() ||
    '«O‘z mutaxassisligi bo‘yicha yilning eng iqtidorli talabasi»';

  // Description / Reason text
  let mainText = data.description?.trim();
  if (!mainText) {
    mainText = 'o‘quv, ilmiy-tadqiqot, innovatsion ishlanmalar va jamoat ishlaridagi yuksak natijalari hamda faol tashabbusi uchun taqdim etiladi.';
  }

  // Academic council decision (Ilmiy kengash qarori)
  let confirmationText = data.confirmationText?.trim();
  if (!confirmationText) {
    if (data.decisionNumber?.trim()) {
      confirmationText = `Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining 2026-yil ${data.decisionNumber.trim()} qaroriga asosan.`;
    } else {
      confirmationText = 'Toshkent kimyo-texnologiya instituti Yangiyer filiali Ilmiy kengashining qaroriga asosan.';
    }
  }

  // Responsible person info (Director) - strictly "Xakimov Zafar Tulyaganovich"
  const signatoryName = data.signatoryName?.trim() || 'Xakimov Zafar Tulyaganovich';
  const signatoryRole = data.signatoryRole?.trim() || 'TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI YANGIYER FILIALI DIREKTORI';

  // Student direction & academic group
  const studentDirectionText = data.studentDirection?.trim() || '';

  // Award level badge text for seal
  const awardLevel = data.awardLevel?.trim() || docSubtitle;

  // Resolve chosen Certificate Design and Background Pattern
  const design = getCertificateDesign(data.designId);
  const patternId = (data.backgroundPattern as BackgroundPatternId) || design.defaultPattern;

  const isSidebar = design.layoutType === 'sidebar';
  const isBands = design.layoutType === 'bands';
  const isDecree = design.layoutType === 'decree';
  const isMinimalist = design.layoutType === 'minimalist';
  const isWaxSeal = design.layoutType === 'wax_seal';
  const isSmartCard = design.layoutType === 'smart_card';

  // Effective center X for the text and certificates
  const contentCenterX = isSidebar ? 1800 : width / 2;

  // ----------------------------------------------------
  // 1. BASE CANVAS BACKGROUND: With chosen design warmth & palette
  // ----------------------------------------------------
  ctx.fillStyle = design.bgCenter;
  ctx.fillRect(0, 0, width, height);

  // Soft luxurious radial warmth from center
  ctx.save();
  const bgGrad = ctx.createRadialGradient(
    contentCenterX,
    height * 0.48,
    200,
    contentCenterX,
    height * 0.48,
    1480
  );
  bgGrad.addColorStop(0, design.bgCenter);
  bgGrad.addColorStop(0.7, design.bgMid);
  bgGrad.addColorStop(1, design.bgEdge);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Draw selected background pattern
  drawBackgroundPattern(
    ctx,
    width,
    height,
    patternId,
    design.primaryColor,
    design.secondaryColor
  );

  // ----------------------------------------------------
  // 2. MASTER ARCHITECTURAL FRAME SPECIFIC TO LAYOUT
  // ----------------------------------------------------
  drawCertificateFrame(ctx, width, height, design);

  // ----------------------------------------------------
  // 3. TOP CENTRAL MINISTRY & UNIVERSITY HEADERS
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';

  if (isDecree) {
    // Bilateral dual emblems for state decree layout
    drawGovernmentDualEmblems(ctx, 480, 2490, 260, design.secondaryColor, design.primaryColor);
  }

  // Header Y coordinates
  const headerY1 = isBands ? 140 : 240;
  const headerY2 = isBands ? 230 : 305;
  const dividerY = isBands ? 320 : 350;

  // Ministry of Higher Education, Science and Innovations
  ctx.fillStyle = isBands ? design.secondaryColor : design.primaryColor;
  ctx.font = 'bold 26px "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(
    'O‘ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR VAZIRLIGI',
    contentCenterX,
    headerY1
  );

  // Tashkent Chemical-Technological Institute Yangiyer Branch
  ctx.fillStyle = isBands ? '#ffffff' : design.primaryColor;
  ctx.font = 'bold 42px "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(
    'TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI YANGIYER FILIALI',
    contentCenterX,
    headerY2
  );

  // Style-specific ornamental divider
  const dividerWidth = isSidebar ? 680 : 780;
  drawCertificateHeaderDivider(ctx, contentCenterX, dividerY, dividerWidth, design);
  ctx.restore();

  // ----------------------------------------------------
  // 4. MAIN CERTIFICATE TITLE & DECREE PREAMBLE
  // “IQTIDORLI TALABA FAXRIY SERTIFIKATI”
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';

  // Refined ambient warm glow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = design.primaryColor;
  const titleY = isBands ? 520 : 480;
  let mainTitleFontSize = 96;
  ctx.font = `900 ${mainTitleFontSize}px "Times New Roman", Georgia, serif`;
  ctx.letterSpacing = '4px';
  const titleMaxLimit = isSidebar ? 2000 : 2350;
  let titleMeasureWidth = ctx.measureText(docTitle.toUpperCase()).width;
  if (titleMeasureWidth > titleMaxLimit) {
    mainTitleFontSize = Math.max(72, Math.floor(mainTitleFontSize * (titleMaxLimit / titleMeasureWidth)));
    ctx.font = `900 ${mainTitleFontSize}px "Times New Roman", Georgia, serif`;
  }
  ctx.fillText(docTitle.toUpperCase(), contentCenterX, titleY);
  ctx.shadowColor = 'transparent';

  // Subtitle / Preamble
  ctx.fillStyle = design.subtextColor;
  ctx.font = 'italic 600 30px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '0.5px';
  const subtitleY = titleY + 70;
  ctx.fillText(presentedTo, contentCenterX, subtitleY);
  ctx.restore();

  // ----------------------------------------------------
  // 5. AWARDEE HERO GROUP: Student Name + Underline + Direction
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';

  let studentFontSize = 96;
  ctx.font = `bold ${studentFontSize}px "Times New Roman", Georgia, serif`;
  let studentWidth = ctx.measureText(studentName).width;
  const maxStudentWidth = isSidebar ? 1700 : 1950;
  if (studentWidth > maxStudentWidth) {
    studentFontSize = Math.max(54, Math.floor(studentFontSize * (maxStudentWidth / studentWidth)));
    ctx.font = `bold ${studentFontSize}px "Times New Roman", Georgia, serif`;
    studentWidth = ctx.measureText(studentName).width;
  }

  ctx.fillStyle = design.primaryColor;
  const studentY = subtitleY + 130;
  ctx.fillText(studentName, contentCenterX, studentY);

  // Decorative dual-tone underline bar with centerpiece diamond & wings
  const lineHalfWidth = Math.min(isSidebar ? 620 : 740, Math.max(380, studentWidth / 2 + 80));
  const lineY = studentY + 28;

  // Outer primary accent line
  ctx.strokeStyle = design.primaryColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(contentCenterX - lineHalfWidth, lineY);
  ctx.lineTo(contentCenterX + lineHalfWidth, lineY);
  ctx.stroke();

  // Inner bold secondary accent segment
  ctx.strokeStyle = design.secondaryColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(contentCenterX - 160, lineY);
  ctx.lineTo(contentCenterX + 160, lineY);
  ctx.stroke();

  // Center decorative diamond
  ctx.fillStyle = design.primaryColor;
  ctx.beginPath();
  ctx.moveTo(contentCenterX, lineY - 10);
  ctx.lineTo(contentCenterX + 10, lineY);
  ctx.lineTo(contentCenterX, lineY + 10);
  ctx.lineTo(contentCenterX - 10, lineY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = design.secondaryColor;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Student Direction, Course, & Group
  let nextBlockY = lineY + 44;
  if (studentDirectionText) {
    ctx.fillStyle = design.accentColor;
    ctx.font = 'italic 600 25px Georgia, "Times New Roman", serif';
    ctx.letterSpacing = '0.5px';
    let dirDisplay = studentDirectionText.trim();
    if (!dirDisplay.startsWith('«') && !dirDisplay.endsWith('»')) {
      dirDisplay = `«${dirDisplay}»`;
    }
    const dirLines = wrapText(ctx, dirDisplay, isSidebar ? 1700 : 1900);
    for (const dLine of dirLines) {
      ctx.fillText(dLine, contentCenterX, nextBlockY);
      nextBlockY += 34;
    }
    nextBlockY += 10;
  } else {
    nextBlockY += 8;
  }
  ctx.restore();

  // ----------------------------------------------------
  // 6. CITATION & EVENT GROUP
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = design.primaryColor;
  ctx.font = 'bold 42px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '0.8px';

  let displayEvent = eventName;
  if (!displayEvent.startsWith('«') && !displayEvent.endsWith('»')) {
    displayEvent = `«${displayEvent}»`;
  }

  const compLines = wrapText(ctx, displayEvent, isSidebar ? 1750 : 2000);
  let compCurrentY = nextBlockY + 26;
  for (const line of compLines) {
    ctx.fillText(line, contentCenterX, compCurrentY);
    compCurrentY += 50;
  }
  ctx.restore();

  // Main citation description text
  ctx.save();
  ctx.textAlign = 'center';

  let descFontSize = 29;
  const maxDescWidth = isSidebar ? 1800 : 2050;
  ctx.font = `500 ${descFontSize}px system-ui, -apple-system, sans-serif`;
  let lines = wrapText(ctx, mainText, maxDescWidth);

  if (lines.length > 3) {
    descFontSize = 26;
    ctx.font = `500 ${descFontSize}px system-ui, -apple-system, sans-serif`;
    lines = wrapText(ctx, mainText, maxDescWidth);
  }

  ctx.fillStyle = '#1e293b';
  const lineHeight = descFontSize * 1.5;
  let currentY = compCurrentY + 24;
  for (const line of lines) {
    ctx.fillText(line, contentCenterX, currentY);
    currentY += lineHeight;
  }

  // Confirmation Text (Ilmiy kengash qaroriga asosan)
  if (confirmationText) {
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 600 24px "Times New Roman", Georgia, serif';
    ctx.fillText(confirmationText, contentCenterX, currentY + 24);
  }
  ctx.restore();

  // ----------------------------------------------------
  // 7. PRESTIGIOUS LOWER THIRD: Layout-Adaptive Architecture
  // ----------------------------------------------------
  const lowerBaseY = 1370;
  const baseUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin.replace(/\/+$/, '') : '';
  const verifyUrl = data.verificationUrl || `${baseUrl}/?verify=${encodeURIComponent(certNumber)}`;

  if (isSidebar) {
    // LAYOUT 1: SIDEBAR
    // QR Code inside the dedicated white card in the left dark sidebar
    await drawVerificationBlock(
      ctx,
      310,
      1380,
      certNumber,
      issueDateFormatted,
      verifyUrl
    );

    // Director signature block in center-right
    drawSignatoryBlock(
      ctx,
      1380,
      lowerBaseY,
      signatoryName,
      signatoryRole
    );

    // Official seal in right
    drawAwardMedalForDesign(
      ctx,
      2380,
      lowerBaseY + 195,
      150,
      awardLevel,
      design
    );
  } else if (isBands) {
    // LAYOUT 3: SOLID BANDS
    // Left: QR card inside footer
    await drawVerificationBlock(
      ctx,
      500,
      1740,
      certNumber,
      issueDateFormatted,
      verifyUrl
    );

    // Center: Director signature in white/gold
    drawSignatoryBlock(
      ctx,
      width / 2,
      1740,
      signatoryName,
      signatoryRole
    );

    // Right: Medal in footer
    drawAwardMedalForDesign(
      ctx,
      2450,
      1910,
      140,
      awardLevel,
      design
    );
  } else if (isDecree) {
    // LAYOUT 5: GOVERNMENT DECREE (Bilateral signatories + Grand central state seal)
    // Left signatory (Director)
    drawSignatoryBlock(
      ctx,
      720,
      lowerBaseY,
      signatoryName,
      signatoryRole
    );

    // Grand Central Seal
    drawAwardMedalForDesign(
      ctx,
      width / 2,
      lowerBaseY + 195,
      155,
      awardLevel,
      design
    );

    // Right signatory (Ilmiy kotib)
    drawSignatoryBlock(
      ctx,
      2250,
      lowerBaseY,
      'Maxmudov O. Q.',
      'ILMIY KENGASH KOTIBI, DOTSENT'
    );

    // Small QR badge in bottom left
    await drawSmallVerificationBadge(ctx, 230, height - 230, certNumber, verifyUrl);
  } else if (isWaxSeal) {
    // LAYOUT 9: DIPLOMATIC RED WAX SEAL
    await drawVerificationBlock(
      ctx,
      610,
      lowerBaseY,
      certNumber,
      issueDateFormatted,
      verifyUrl
    );

    // Center: 3D Red Wax Seal with hanging ribbons
    drawAwardMedalForDesign(
      ctx,
      width / 2,
      lowerBaseY + 195,
      135,
      awardLevel,
      design
    );

    // Right: Director signature
    drawSignatoryBlock(
      ctx,
      2360,
      lowerBaseY,
      signatoryName,
      signatoryRole
    );
  } else if (isSmartCard) {
    // LAYOUT 10: SMART VERIFICATION CARD
    drawSignatoryBlock(
      ctx,
      820,
      lowerBaseY,
      signatoryName,
      signatoryRole
    );

    drawAwardMedalForDesign(
      ctx,
      1485,
      lowerBaseY + 195,
      140,
      awardLevel,
      design
    );

    // Smart Card in bottom right
    await drawSmartVerificationCard(
      ctx,
      2050,
      lowerBaseY - 20,
      560,
      350,
      certNumber,
      issueDateFormatted,
      verifyUrl,
      design
    );
  } else {
    // STANDARD / BAROQUE / RIBBON / CYBER / MINIMALIST
    const leftColCenterX = 610;
    const centerColCenterX = width / 2;
    const rightColCenterX = 2360;

    await drawVerificationBlock(
      ctx,
      leftColCenterX,
      lowerBaseY,
      certNumber,
      issueDateFormatted,
      verifyUrl
    );

    drawSignatoryBlock(
      ctx,
      centerColCenterX,
      lowerBaseY,
      signatoryName,
      signatoryRole
    );

    drawAwardMedalForDesign(
      ctx,
      rightColCenterX,
      lowerBaseY + 195,
      150,
      awardLevel,
      design
    );
  }

  // ----------------------------------------------------
  // 11. BOTTOM MICRO-CREDIT BAR
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '500 16px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(
    'Toshkent kimyo-texnologiya instituti Yangiyer filiali • Oliy ta’lim muassasasining rasmiy elektron reestri hujjati',
    contentCenterX,
    1965
  );
  ctx.restore();

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generate A4 Landscape PDF using the high-resolution canvas render
 */
export async function generateCertificatePdf(data: CertificateData): Promise<{
  dataUri: string;
  blob: Blob;
  qrCodeUrl: string;
}> {
  const offscreenCanvas = document.createElement('canvas');
  const pngDataUrl = await renderCertificateToCanvas(data, offscreenCanvas);

  const baseUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin.replace(/\/+$/, '') : '';
  const verifyUrl = data.verificationUrl || `${baseUrl}/?verify=${encodeURIComponent(data.certificateNumber || 'CERT-2026-0001')}`;
  const qrCodeUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    width: 280,
    margin: 1,
    color: {
      dark: '#0b1f3a',
      light: '#ffffff',
    },
  });

  // Create A4 Landscape PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // A4 Landscape: 297mm x 210mm
  doc.addImage(pngDataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');

  const pdfOutput = doc.output('datauristring');
  const blob = doc.output('blob');

  return {
    dataUri: pdfOutput,
    blob,
    qrCodeUrl,
  };
}

/**
 * Trigger immediate download of the A4 Landscape PDF with compliant naming
 * Format: Diplom_[FISH]_[ID].pdf
 * Masalan: Diplom_Sarvar_Muzaffarov_CERT-2026-6395.pdf
 */
export async function downloadCertificatePdf(data: CertificateData, filename?: string): Promise<void> {
  const { blob } = await generateCertificatePdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  let finalFilename = filename;
  if (!finalFilename) {
    const safeName = (data.studentName || 'Talaba')
      .trim()
      .replace(/['`‘’ʻʼ]/g, '')
      .replace(/\s+/g, '_');
    const safeId = (data.certificateNumber || 'CERT-2026-0001')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const prefix = data.documentType === 'sertifikat' ? 'Sertifikat' : 'Diplom';
    finalFilename = `${prefix}_${safeName}_${safeId}.pdf`;
  }

  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger download of a consolidated multi-page A4 Landscape PDF for multiple certificates
 */
export async function downloadBulkCertificatesPdf(
  certificatesData: CertificateData[],
  filename?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!certificatesData || certificatesData.length === 0) return;

  if (certificatesData.length === 1) {
    return downloadCertificatePdf(certificatesData[0], filename);
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const offscreenCanvas = document.createElement('canvas');

  for (let i = 0; i < certificatesData.length; i++) {
    const cert = certificatesData[i];
    if (onProgress) onProgress(i + 1, certificatesData.length);
    const pngDataUrl = await renderCertificateToCanvas(cert, offscreenCanvas);
    if (i > 0) {
      doc.addPage([297, 210], 'landscape');
    }
    doc.addImage(pngDataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const prefix = certificatesData[0]?.documentType === 'sertifikat' ? 'Sertifikatlar' : 'Diplomlar';
  a.download =
    filename ||
    `${prefix}_Jami_${certificatesData.length}_ta_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// VECTOR DRAWING HELPERS FOR CANVAS
// ----------------------------------------------------

/**
 * Classical Banknote Security Micro-Guilloché Waves
 */
function drawSecurityGuillocheWaves(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(11, 31, 58, 0.022)';
  ctx.lineWidth = 1;

  // Interlaced sine wave curves across the canvas
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    const yOffset = 180 + i * 58;
    ctx.beginPath();
    for (let x = 120; x < width - 120; x += 15) {
      const y = yOffset + Math.sin(x * 0.008 + i * 0.4) * 22 + Math.cos(x * 0.004) * 12;
      if (x === 120) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Reverse interlaced waves
  for (let i = 0; i < steps; i += 2) {
    const yOffset = 210 + i * 58;
    ctx.beginPath();
    for (let x = 120; x < width - 120; x += 15) {
      const y = yOffset - Math.sin(x * 0.007 + i * 0.3) * 18 - Math.cos(x * 0.005) * 10;
      if (x === 120) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Large Semi-transparent University Watermark Crest
 */
function drawLargeWatermarkEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();
  ctx.strokeStyle = '#0b1f3a';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 24, 0, Math.PI * 2);
  ctx.stroke();

  // Chemical flask silhouette
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy - 80);
  ctx.lineTo(cx + 24, cy - 80);
  ctx.lineTo(cx + 20, cy - 40);
  ctx.lineTo(cx + 80, cy + 60);
  ctx.lineTo(cx - 80, cy + 60);
  ctx.lineTo(cx - 20, cy - 40);
  ctx.closePath();
  ctx.stroke();

  // Open book silhouette
  ctx.beginPath();
  ctx.moveTo(cx, cy + 90);
  ctx.quadraticCurveTo(cx - 60, cy + 80, cx - 110, cy + 110);
  ctx.lineTo(cx - 110, cy + 150);
  ctx.quadraticCurveTo(cx - 60, cy + 130, cx, cy + 140);
  ctx.quadraticCurveTo(cx + 60, cy + 130, cx + 110, cy + 150);
  ctx.lineTo(cx + 110, cy + 110);
  ctx.quadraticCurveTo(cx + 60, cy + 80, cx, cy + 90);
  ctx.stroke();
  ctx.restore();
}

/**
 * Multi-layer Classical Architectural Diploma Frame
 * Two-tier premium frame: Deep Navy (#0b1f3a) outer with Refined Gold (#c5a059) accents
 * and geometric stepped corner elements.
 */
function drawClassicalArchitecturalFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();

  const outerMargin = 60;
  const w1 = width - outerMargin * 2;
  const h1 = height - outerMargin * 2;

  // 1. Primary Deep Navy Architectural Frame (Outer)
  ctx.strokeStyle = '#0b1f3a';
  ctx.lineWidth = 14;
  ctx.strokeRect(outerMargin, outerMargin, w1, h1);

  // 2. Metallic Refined Gold Pinstripe
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(outerMargin + 20, outerMargin + 20, w1 - 40, h1 - 40);

  // 3. Delicate Inner Gold Hairline
  ctx.strokeStyle = 'rgba(197, 160, 89, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(outerMargin + 32, outerMargin + 32, w1 - 64, h1 - 64);

  // 4. Geometric Corner Elements (Stepped brackets, chevron keys, and faceted gold diamond rosettes)
  const cornerOffset = outerMargin + 32;
  drawGeometricCornerOrnament(ctx, cornerOffset, cornerOffset, 0); // TL
  drawGeometricCornerOrnament(ctx, width - cornerOffset, cornerOffset, Math.PI / 2); // TR
  drawGeometricCornerOrnament(ctx, width - cornerOffset, height - cornerOffset, Math.PI); // BR
  drawGeometricCornerOrnament(ctx, cornerOffset, height - cornerOffset, -Math.PI / 2); // BL

  // 5. Center Diamond Accents on all 4 borders
  drawSmallDiamond(ctx, width / 2, outerMargin + 20, 8);
  drawSmallDiamond(ctx, width / 2, height - (outerMargin + 20), 8);
  drawSmallDiamond(ctx, outerMargin + 20, height / 2, 8);
  drawSmallDiamond(ctx, width - (outerMargin + 20), height / 2, 8);

  ctx.restore();
}

function drawSmallDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.fillStyle = '#0b1f3a';
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * Geometric Corner Ornament (Stepped brackets & faceted diamond floret)
 */
function drawGeometricCornerOrnament(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Outer stepped bracket in gold
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.lineTo(0, 0);
  ctx.lineTo(60, 0);
  ctx.stroke();

  // Secondary stepped bracket in deep navy
  ctx.strokeStyle = '#0b1f3a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(12, 48);
  ctx.lineTo(12, 12);
  ctx.lineTo(48, 12);
  ctx.stroke();

  // Third inner step in fine gold
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(22, 38);
  ctx.lineTo(22, 22);
  ctx.lineTo(38, 22);
  ctx.stroke();

  // Faceted gold diamond floret at the corner juncture
  ctx.fillStyle = '#0b1f3a';
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(22, 11);
  ctx.lineTo(33, 22);
  ctx.lineTo(22, 33);
  ctx.lineTo(11, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner gold star/dot
  ctx.fillStyle = '#c5a059';
  drawStar(ctx, 22, 22, 5, 2.5, 4);

  ctx.restore();
}

/**
 * Classical Header Divider with Stylized Laurel Leaves and Diamond
 */
function drawHeaderDivider(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number) {
  ctx.save();

  // Gold central lines
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, cy);
  ctx.lineTo(cx - 36, cy);
  ctx.moveTo(cx + 36, cy);
  ctx.lineTo(cx + width / 2, cy);
  ctx.stroke();

  // Micro-dots flanking
  ctx.fillStyle = '#c5a059';
  ctx.beginPath();
  ctx.arc(cx - 28, cy, 3, 0, Math.PI * 2);
  ctx.arc(cx + 28, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Center Faceted Gold & Navy Diamond
  ctx.fillStyle = '#0b1f3a';
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx + 10, cy);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx - 10, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Official TKTI Yangiyer Institutional Emblem
 */
function drawTktiEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();

  // Outer gold rim
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1f3a';
  ctx.fill();

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#c5a059';
  ctx.stroke();

  // Inner gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 7, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#e5c07b';
  ctx.stroke();

  // Center crest background
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 14, 0, Math.PI * 2);
  ctx.fillStyle = '#102a4e';
  ctx.fill();

  // Chemical flask icon
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 18);
  ctx.lineTo(cx + 5, cy - 18);
  ctx.moveTo(cx - 4, cy - 18);
  ctx.lineTo(cx - 4, cy - 9);
  ctx.lineTo(cx - 14, cy + 9);
  ctx.lineTo(cx + 14, cy + 9);
  ctx.lineTo(cx + 4, cy - 9);
  ctx.lineTo(cx + 4, cy - 18);
  ctx.stroke();

  // Flask bubbles
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(cx - 4, cy + 3, 2, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy, 1.8, 0, Math.PI * 2);
  ctx.arc(cx, cy + 5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Open book below flask
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 13);
  ctx.quadraticCurveTo(cx - 9, cy + 11, cx - 16, cy + 15);
  ctx.lineTo(cx - 16, cy + 22);
  ctx.quadraticCurveTo(cx - 9, cy + 19, cx, cy + 21);
  ctx.quadraticCurveTo(cx + 9, cy + 19, cx + 16, cy + 22);
  ctx.lineTo(cx + 16, cy + 15);
  ctx.quadraticCurveTo(cx + 9, cy + 11, cx, cy + 13);
  ctx.fill();

  // Laurel branch left & right
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 11, Math.PI * 0.65, Math.PI * 0.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 11, Math.PI * 0.05, Math.PI * 0.35);
  ctx.stroke();

  ctx.restore();
}

/**
 * Dignified Signatory Block (Center Column)
 * Strictly adheres to official name: "Xakimov Zafar Tulyaganovich"
 * Academic degree omitted as requested.
 */
function drawSignatoryBlock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  startY: number,
  name: string,
  role: string
) {
  ctx.save();
  ctx.textAlign = 'center';

  // Role title in dignified uppercase deep navy
  ctx.fillStyle = '#0b1f3a';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI', cx, startY + 22);

  ctx.font = '800 22px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('YANGIYER FILIALI DIREKTORI', cx, startY + 52);

  // Realistic fountain pen ink signature flourish
  drawArtisticSignature(ctx, cx, startY + 155);

  // Baseline rule with gold centerpiece
  ctx.strokeStyle = '#0b1f3a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 230, startY + 250);
  ctx.lineTo(cx + 230, startY + 250);
  ctx.stroke();

  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx - 75, startY + 250);
  ctx.lineTo(cx + 75, startY + 250);
  ctx.stroke();

  // Full Name of Director in bold serif
  ctx.fillStyle = '#0b1f3a';
  ctx.font = 'bold 34px "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(name, cx, startY + 298);

  ctx.restore();
}

/**
 * Authentic Hand-drawn Fountain Pen Ink Signature of Director Xakimov Zafar Tulyaganovich
 * 100% exact replica of the director's handwritten signature with authentic ink shade, spires, and sweeping underline
 */
function drawArtisticSignature(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();

  const inkColor = '#1d4ed8'; // Authentic royal blue fountain pen ink
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const scale = 1.0;
  const mapX = (x: number) => cx + (x - 238) * scale;
  const mapY = (y: number) => cy + (y - 121) * scale;

  // 1. Left teardrop lobe/loop of initial letter 'X'
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(mapX(190), mapY(48));
  ctx.bezierCurveTo(mapX(172), mapY(88), mapX(142), mapY(140), mapX(134), mapY(168));
  ctx.bezierCurveTo(mapX(126), mapY(190), mapX(144), mapY(198), mapX(160), mapY(186));
  ctx.bezierCurveTo(mapX(178), mapY(172), mapX(202), mapY(136), mapX(222), mapY(102));
  ctx.stroke();

  // 2. The grand unbroken diagonal slash from bottom-left to top highest spire
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(mapX(18), mapY(224));
  ctx.bezierCurveTo(mapX(80), mapY(180), mapX(162), mapY(114), mapX(268), mapY(18));
  ctx.stroke();

  // 3. Top highest spire needle apex and downward crossing stroke of 'X'
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(mapX(268), mapY(18));
  ctx.bezierCurveTo(mapX(272), mapY(12), mapX(278), mapY(14), mapX(276), mapY(22));
  ctx.bezierCurveTo(mapX(270), mapY(52), mapX(258), mapY(92), mapX(246), mapY(130));
  ctx.stroke();

  // 4. Upright vertical oval loop
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(mapX(246), mapY(130));
  ctx.bezierCurveTo(mapX(242), mapY(104), mapX(252), mapY(76), mapX(264), mapY(72));
  ctx.bezierCurveTo(mapX(272), mapY(70), mapX(278), mapY(80), mapX(274), mapY(100));
  ctx.bezierCurveTo(mapX(270), mapY(118), mapX(260), mapY(138), mapX(256), mapY(148));
  ctx.stroke();

  // 5. Connected cursive body waves
  ctx.lineWidth = 3.3;
  ctx.beginPath();
  ctx.moveTo(mapX(256), mapY(148));
  ctx.bezierCurveTo(mapX(264), mapY(135), mapX(274), mapY(133), mapX(284), mapY(147));
  ctx.bezierCurveTo(mapX(292), mapY(135), mapX(302), mapY(133), mapX(312), mapY(147));
  ctx.bezierCurveTo(mapX(320), mapY(135), mapX(330), mapY(133), mapX(340), mapY(147));
  ctx.bezierCurveTo(mapX(348), mapY(135), mapX(356), mapY(135), mapX(364), mapY(148));
  ctx.stroke();

  // 6. Tall right ascender loop
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(mapX(364), mapY(148));
  ctx.bezierCurveTo(mapX(374), mapY(108), mapX(388), mapY(50), mapX(396), mapY(32));
  ctx.bezierCurveTo(mapX(400), mapY(24), mapX(404), mapY(28), mapX(400), mapY(40));
  ctx.lineTo(mapX(388), mapY(156));
  ctx.stroke();

  // 7. Sharp rightward beak and sweeping underline flourish back to the start
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(mapX(388), mapY(156));
  ctx.lineTo(mapX(442), mapY(152));
  ctx.bezierCurveTo(mapX(448), mapY(152), mapX(450), mapY(156), mapX(444), mapY(160));
  ctx.bezierCurveTo(mapX(370), mapY(172), mapX(235), mapY(198), mapX(90), mapY(220));
  ctx.lineTo(mapX(18), mapY(224));
  ctx.stroke();

  // 8. Distinct signature dot on the right
  ctx.beginPath();
  ctx.arc(mapX(458), mapY(88), 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Official Academic Medal / Seal of Yangiyer Branch (Right Column)
 * "TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI YANGIYER FILIALI"
 * Deep Navy & Refined Gold
 */
function drawOfficialAcademicMedal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  awardLevelText: string
) {
  ctx.save();

  // 1. Subtle warm golden ambient glow
  const goldGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius + 25);
  goldGrad.addColorStop(0, 'rgba(197, 160, 89, 0.28)');
  goldGrad.addColorStop(0.7, 'rgba(197, 160, 89, 0.12)');
  goldGrad.addColorStop(1, 'rgba(197, 160, 89, 0)');
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 25, 0, Math.PI * 2);
  ctx.fill();

  // 2. Scalloped gold rim teeth (28 decorative petals)
  ctx.save();
  ctx.fillStyle = '#c5a059';
  const numTeeth = 28;
  for (let i = 0; i < numTeeth; i++) {
    const angle = (i * 2 * Math.PI) / numTeeth;
    const tx = cx + Math.cos(angle) * (radius - 2);
    const ty = cy + Math.sin(angle) * (radius - 2);
    ctx.beginPath();
    ctx.arc(tx, ty, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Primary deep navy disc
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1f3a';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#c5a059';
  ctx.stroke();

  // 4. Inner gold pinstripe ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 16, 0, Math.PI * 2);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#fbbf24';
  ctx.stroke();

  // 5. Curved text on arc:
  // Top Arc: "TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI"
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 12px "Times New Roman", Georgia, serif';
  drawCurvedText(
    ctx,
    'TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI',
    cx,
    cy,
    radius - 28,
    (-145 * Math.PI) / 180,
    (-35 * Math.PI) / 180,
    false
  );

  // Bottom Arc: "YANGIYER FILIALI"
  ctx.font = 'bold 13px "Times New Roman", Georgia, serif';
  drawCurvedText(
    ctx,
    'YANGIYER FILIALI',
    cx,
    cy,
    radius - 28,
    (145 * Math.PI) / 180,
    (35 * Math.PI) / 180,
    true
  );

  // 6. Inner Core Medallion
  const innerRadius = radius - 46;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#102a4e';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#c5a059';
  ctx.stroke();

  // Laurel branch left & right inside core
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius - 8, Math.PI * 0.6, Math.PI * 0.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius - 8, Math.PI * 0.05, Math.PI * 0.4);
  ctx.stroke();

  // Center star & award text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  drawStar(ctx, cx, cy - 24, 12, 5, 5);

  let centerLine1 = 'IQTIDORLI';
  let centerLine2 = 'TALABA';
  if (awardLevelText.includes('1-o‘rin') || awardLevelText.includes('1st')) {
    centerLine1 = '1-O‘RIN';
    centerLine2 = 'G‘OLIBI';
  } else if (awardLevelText.includes('2-o‘rin') || awardLevelText.includes('2nd')) {
    centerLine1 = '2-O‘RIN';
    centerLine2 = 'SOHIBI';
  } else if (awardLevelText.includes('3-o‘rin') || awardLevelText.includes('3rd')) {
    centerLine1 = '3-O‘RIN';
    centerLine2 = 'SOHIBI';
  } else if (awardLevelText.toLowerCase().includes('diplom')) {
    centerLine1 = 'TANLOV';
    centerLine2 = 'G‘OLIBI';
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 13px "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(centerLine1, cx, cy - 2);
  ctx.fillText(centerLine2, cx, cy + 14);

  // Year badge
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('★ 2026 ★', cx, cy + 32);

  // 7. Five polished golden stars underneath the medallion
  for (let s = -2; s <= 2; s++) {
    const starX = cx + s * 22;
    const starY = cy + radius + 12 + Math.abs(s) * 3;
    ctx.fillStyle = '#c5a059';
    drawStar(ctx, starX, starY, 6, 2.8, 5);
  }

  ctx.restore();
}

/**
 * Render text along a circular arc
 */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  inward = false
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const len = text.length;
  if (len === 0) {
    ctx.restore();
    return;
  }
  const totalAngle = endAngle - startAngle;
  const anglePerChar = totalAngle / (len > 1 ? len - 1 : 1);

  for (let i = 0; i < len; i++) {
    const char = text[i];
    const angle = startAngle + i * anglePerChar;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + (inward ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Draws dual bilateral state emblems for government decree layout
 */
function drawGovernmentDualEmblems(
  ctx: CanvasRenderingContext2D,
  leftX: number,
  rightX: number,
  y: number,
  goldColor: string,
  primaryColor: string
) {
  ctx.save();
  const radius = 64;

  // Left Emblem (Ministry of Higher Education & Innovation)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftX, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(leftX, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(leftX, y, radius - 8, 0, Math.PI * 2);
  ctx.stroke();

  drawCenter8PointStar(ctx, leftX, y, 28, goldColor);

  // Right Emblem (TKT Yangiyer Branch)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(rightX, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(rightX, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(rightX, y, radius - 8, 0, Math.PI * 2);
  ctx.stroke();

  drawCenter8PointStar(ctx, rightX, y, 28, primaryColor);

  ctx.restore();
}

/**
 * Draws small verification badge in corner for decree layout
 */
async function drawSmallVerificationBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  certNumber: string,
  verifyUrl: string
) {
  ctx.save();
  const size = 170;
  const x = cx - size / 2;
  const y = cy - size / 2;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 12;
  roundRect(ctx, x, y, size, size + 40, 10);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#064e3b';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, size, size + 40, 10);
  ctx.stroke();

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    width: 200,
    margin: 1,
    color: { dark: '#064e3b', light: '#ffffff' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, x + 10, y + 10, size - 20, size - 20);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#064e3b';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`№ ${certNumber}`, cx, y + size + 24);
  ctx.restore();
}

/**
 * Draws digital smart verification credential card
 */
async function drawSmartVerificationCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  certNumber: string,
  issueDateFormatted: string,
  verifyUrl: string,
  design: CertificateDesign
) {
  ctx.save();

  // Dark metallic card body with soft shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  const cardGrad = ctx.createLinearGradient(x, y, x + width, y + height);
  cardGrad.addColorStop(0, '#0f172a');
  cardGrad.addColorStop(0.5, '#1e293b');
  cardGrad.addColorStop(1, '#082f49');
  ctx.fillStyle = cardGrad;
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Metallic cyan/gold edge
  ctx.strokeStyle = design.accentColor || '#38bdf8';
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, width, height, 18);
  ctx.stroke();

  // Gold Microchip simulation
  const chipX = x + 35;
  const chipY = y + 35;
  const chipW = 75;
  const chipH = 55;
  ctx.fillStyle = '#eab308';
  roundRect(ctx, chipX, chipY, chipW, chipH, 6);
  ctx.fill();

  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chipX, chipY + chipH / 2);
  ctx.lineTo(chipX + chipW, chipY + chipH / 2);
  ctx.moveTo(chipX + chipW / 2, chipY);
  ctx.lineTo(chipX + chipW / 2, chipY + chipH);
  ctx.stroke();

  // Smart Registry Header
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px monospace';
  ctx.letterSpacing = '1px';
  ctx.fillText('ELECTRONIC REGISTRY ID', chipX + chipW + 24, y + 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(certNumber, chipX + chipW + 24, y + 78);

  // High-res QR code
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    width: 220,
    margin: 1,
    color: { dark: '#082f49', light: '#ffffff' },
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 150;
  const qrX = x + width - qrSize - 35;
  const qrY = y + height - qrSize - 30;

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8);
  ctx.fill();
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Security credentials text
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText(`STATUS: VERIFIED // ACTIVE`, x + 35, y + 160);
  ctx.fillText(`ISSUED: ${issueDateFormatted}`, x + 35, y + 190);
  ctx.fillText(`KEY: TKTI-SEC-2026-NFC`, x + 35, y + 220);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('XALQARO ELEKTRON REESTR HUJJATI', x + 35, y + height - 35);

  ctx.restore();
}

/**
 * Helper to draw 8-pointed star on canvas
 */
function drawCenter8PointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const r = i % 2 === 0 ? radius : radius * 0.55;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Cryptographic QR Verification Card (Left Column)
 * Includes large clear QR code + "HAQIQIYLIKNI TEKSHIRISH" + Certificate ID + Issue Date
 */
async function drawVerificationBlock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  startY: number,
  certNumber: string,
  issueDateFormatted: string,
  verifyUrl: string
) {
  ctx.save();

  const cardW = 440;
  const cardH = 390;
  const cardX = cx - cardW / 2;
  const cardY = startY;

  // Background white card with soft ambient shadow
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(11, 31, 58, 0.08)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  // Outer navy border
  ctx.strokeStyle = '#0b1f3a';
  ctx.lineWidth = 2.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.stroke();

  // Inner refined gold hairline
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 1.4;
  roundRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, 12);
  ctx.stroke();

  // Top header in card: “HAQIQIYLIKNI TEKSHIRISH”
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b1f3a';
  ctx.font = '800 18px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('HAQIQIYLIKNI TEKSHIRISH', cx, cardY + 36);

  // Gold accent divider line
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 110, cardY + 46);
  ctx.lineTo(cx + 110, cardY + 46);
  ctx.stroke();

  // Generate high-resolution QR code
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    width: 320,
    margin: 1,
    color: {
      dark: '#0b1f3a',
      light: '#ffffff',
    },
  });

  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 205;
  const qrX = cx - qrSize / 2;
  const qrY = cardY + 58;

  // Subtle gold border around QR
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Document registration ID: "Sertifikat ID"
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1.2px';
  ctx.fillText('SERTIFIKAT ID', cx, cardY + 292);

  ctx.fillStyle = '#0b1f3a';
  ctx.font = '800 22px monospace, Courier, sans-serif';
  ctx.fillText(`№ ${certNumber}`, cx, cardY + 318);

  // Date issued: "Berilgan sana"
  ctx.fillStyle = '#475569';
  ctx.font = '600 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Berilgan sana: ${issueDateFormatted}`, cx, cardY + 348);

  // Instruction text
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 500 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Haqiqiyligini tekshirish uchun skaner qiling', cx, cardY + 372);

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / points;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < points; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}
