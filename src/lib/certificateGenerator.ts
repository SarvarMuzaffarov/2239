import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

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

  // ----------------------------------------------------
  // 1. BASE CANVAS BACKGROUND: Pure white with noble soft luxury aura
  // ----------------------------------------------------
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Soft luxurious radial warmth from center
  ctx.save();
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.48,
    200,
    width / 2,
    height * 0.48,
    1480
  );
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.7, '#fcfcf9');
  bgGrad.addColorStop(1, '#f8f7f3');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Banknote security micro-guilloché background curves (subtle security lines)
  drawSecurityGuillocheWaves(ctx, width, height);

  // ----------------------------------------------------
  // 2. TWO-LAYER PREMIUM FRAME WITH GEOMETRIC CORNER ELEMENTS
  // ----------------------------------------------------
  drawClassicalArchitecturalFrame(ctx, width, height);

  // ----------------------------------------------------
  // 3. TOP CENTRAL MINISTRY & UNIVERSITY HEADERS
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';

  // Ministry of Higher Education, Science and Innovations
  ctx.fillStyle = '#0b1f3a';
  ctx.font = 'bold 26px "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(
    'O‘ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR VAZIRLIGI',
    width / 2,
    240
  );

  // Tashkent Chemical-Technological Institute Yangiyer Branch
  ctx.fillStyle = '#0b1f3a';
  ctx.font = 'bold 42px "Times New Roman", Georgia, serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(
    'TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI YANGIYER FILIALI',
    width / 2,
    305
  );

  // Classical ornamental gold geometric divider
  drawHeaderDivider(ctx, width / 2, 350, 780);
  ctx.restore();

  // ----------------------------------------------------
  // 4. MAIN CERTIFICATE TITLE & DECREE PREAMBLE
  // “IQTIDORLI TALABA FAXRIY SERTIFIKATI”
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';

  // Refined ambient warm-gold glow
  ctx.shadowColor = 'rgba(197, 160, 89, 0.28)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#0b1f3a';
  // Adapt font size dynamically if title is extraordinarily long
  let mainTitleFontSize = 96;
  ctx.font = `900 ${mainTitleFontSize}px "Times New Roman", Georgia, serif`;
  ctx.letterSpacing = '4px';
  let titleMeasureWidth = ctx.measureText(docTitle.toUpperCase()).width;
  if (titleMeasureWidth > 2350) {
    mainTitleFontSize = Math.max(72, Math.floor(mainTitleFontSize * (2350 / titleMeasureWidth)));
    ctx.font = `900 ${mainTitleFontSize}px "Times New Roman", Georgia, serif`;
  }
  ctx.fillText(docTitle.toUpperCase(), width / 2, 480);
  ctx.shadowColor = 'transparent';

  // Subtitle / Preamble (paired closely with the title)
  // “Ushbu sertifikat iqtidorli talaba sifatida erishgan yuksak natijalari hamda faoliyati uchun taqdim etiladi.”
  ctx.fillStyle = '#334155';
  ctx.font = 'italic 600 30px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(presentedTo, width / 2, 550);
  ctx.restore();

  // ----------------------------------------------------
  // 5. AWARDEE HERO GROUP: Student Name + Underline + Direction
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';

  let studentFontSize = 96;
  ctx.font = `bold ${studentFontSize}px "Times New Roman", Georgia, serif`;
  let studentWidth = ctx.measureText(studentName).width;
  const maxStudentWidth = 1950;
  if (studentWidth > maxStudentWidth) {
    studentFontSize = Math.max(54, Math.floor(studentFontSize * (maxStudentWidth / studentWidth)));
    ctx.font = `bold ${studentFontSize}px "Times New Roman", Georgia, serif`;
    studentWidth = ctx.measureText(studentName).width;
  }

  ctx.fillStyle = '#0b1f3a'; // rich deep navy obsidian
  const studentY = 680;
  ctx.fillText(studentName, width / 2, studentY);

  // Decorative dual-tone underline bar with centerpiece diamond & wings
  const lineHalfWidth = Math.min(740, Math.max(420, studentWidth / 2 + 80));
  const lineY = studentY + 28;

  // Outer navy accent line
  ctx.strokeStyle = '#0b1f3a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - lineHalfWidth, lineY);
  ctx.lineTo(width / 2 + lineHalfWidth, lineY);
  ctx.stroke();

  // Inner bold gold accent segment
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 160, lineY);
  ctx.lineTo(width / 2 + 160, lineY);
  ctx.stroke();

  // Center decorative gold & navy diamond
  ctx.fillStyle = '#0b1f3a';
  ctx.beginPath();
  ctx.moveTo(width / 2, lineY - 10);
  ctx.lineTo(width / 2 + 10, lineY);
  ctx.lineTo(width / 2, lineY + 10);
  ctx.lineTo(width / 2 - 10, lineY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Student Direction, Course, & Group (cohesively placed directly under the line)
  let nextBlockY = lineY + 44;
  if (studentDirectionText) {
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'italic 600 25px Georgia, "Times New Roman", serif';
    ctx.letterSpacing = '0.5px';
    let dirDisplay = studentDirectionText.trim();
    if (!dirDisplay.startsWith('«') && !dirDisplay.endsWith('»')) {
      dirDisplay = `«${dirDisplay}»`;
    }
    const dirLines = wrapText(ctx, dirDisplay, 1900);
    for (const dLine of dirLines) {
      ctx.fillText(dLine, width / 2, nextBlockY);
      nextBlockY += 34;
    }
    nextBlockY += 10;
  } else {
    nextBlockY += 8;
  }
  ctx.restore();

  // ----------------------------------------------------
  // 6. CITATION & EVENT GROUP: Activity Name + Reason + Confirmation
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b1f3a';
  ctx.font = 'bold 42px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '0.8px';

  let displayEvent = eventName;
  if (!displayEvent.startsWith('«') && !displayEvent.endsWith('»')) {
    displayEvent = `«${displayEvent}»`;
  }

  // Wrap competition name if it exceeds 2000px
  const compLines = wrapText(ctx, displayEvent, 2000);
  let compCurrentY = nextBlockY + 26;
  for (const line of compLines) {
    ctx.fillText(line, width / 2, compCurrentY);
    compCurrentY += 50;
  }
  ctx.restore();

  // Main citation description text
  ctx.save();
  ctx.textAlign = 'center';

  let descFontSize = 29;
  const maxDescWidth = 2050;
  ctx.font = `500 ${descFontSize}px system-ui, -apple-system, sans-serif`;
  let lines = wrapText(ctx, mainText, maxDescWidth);

  if (lines.length > 3) {
    descFontSize = 26;
    ctx.font = `500 ${descFontSize}px system-ui, -apple-system, sans-serif`;
    lines = wrapText(ctx, mainText, maxDescWidth);
  }

  ctx.fillStyle = '#1e293b'; // high-contrast readable dark slate
  const lineHeight = descFontSize * 1.5;
  let currentY = compCurrentY + 24;
  for (const line of lines) {
    ctx.fillText(line, width / 2, currentY);
    currentY += lineHeight;
  }

  // Confirmation Text (Ilmiy kengash qaroriga asosan)
  if (confirmationText) {
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 600 24px "Times New Roman", Georgia, serif';
    ctx.fillText(confirmationText, width / 2, currentY + 24);
  }
  ctx.restore();

  // ----------------------------------------------------
  // 7. PRESTIGIOUS LOWER THIRD: Balanced 3-Column Symmetrical Layout
  // Chapda: Katta va aniq QR-kod + “HAQIQIYLIKNI TEKSHIRISH” + ID + Sana
  // Markazda: Mas’ul shaxs imzosi (Xakimov Zafar Tulyaganovich)
  // O‘ngda: Rasmiy muhr (TKTI Yangiyer filiali rasmiy muhri)
  // ----------------------------------------------------
  const lowerBaseY = 1370;

  // COLUMN 1: Left (Cryptographic QR Verification Block with ID & Date)
  const leftColCenterX = 610;
  const baseUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin.replace(/\/+$/, '') : '';
  const verifyUrl = data.verificationUrl || `${baseUrl}/?verify=${encodeURIComponent(certNumber)}`;
  await drawVerificationBlock(
    ctx,
    leftColCenterX,
    lowerBaseY,
    certNumber,
    issueDateFormatted,
    verifyUrl
  );

  // COLUMN 2: Center (Director Signature Block)
  const centerColCenterX = width / 2;
  drawSignatoryBlock(
    ctx,
    centerColCenterX,
    lowerBaseY,
    signatoryName,
    signatoryRole
  );

  // COLUMN 3: Right (Official Academic Seal / Medal of Yangiyer Branch)
  const rightColCenterX = 2360;
  drawOfficialAcademicMedal(
    ctx,
    rightColCenterX,
    lowerBaseY + 195,
    150,
    awardLevel
  );

  // ----------------------------------------------------
  // 11. BOTTOM MICRO-CREDIT BAR (Clean, subtle, institutional)
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '500 16px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(
    'Toshkent kimyo-texnologiya instituti Yangiyer filiali • Oliy ta’lim muassasasining rasmiy elektron reestri hujjati',
    width / 2,
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
