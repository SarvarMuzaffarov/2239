import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { canonicalizeDirection } from '../constants/directions';
import type {
  StudentProfile,
  SupervisorProfile,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  LanguageCertificate,
  EventItem,
} from '../types';

export type PortfolioTemplateId = 'master' | 'academic' | 'modern' | 'europass';

export interface PortfolioGeneratorOptions {
  template?: PortfolioTemplateId;
  includeQrCode?: boolean;
  includeSupervisorSignature?: boolean;
  includeStudentPhoto?: boolean;
  language?: 'uz' | 'en';
}

export interface PortfolioData {
  student: StudentProfile;
  supervisor?: SupervisorProfile;
  projects: ProjectOrStartup[];
  startups: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  languageCertificates?: LanguageCertificate[];
  events: EventItem[];
  options?: PortfolioGeneratorOptions;
}

/**
 * Safely converts an image URL to a Base64 data URL.
 * Returns null if network fails or CORS prevents loading.
 */
async function getBase64ImageFromUrl(url: string): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null;
  if (url.startsWith('data:image/')) return url;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.naturalWidth || 300, 400);
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          // Draw image centered & cropped to square
          const minDim = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minDim) / 2;
          const sy = (img.naturalHeight - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
      // 2.5s timeout guard so PDF generation never hangs
      setTimeout(() => resolve(null), 2500);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Cleans and sanitizes strings for jsPDF WinAnsi encoding.
 * Automatically converts typographic apostrophes (o‘, g‘), Cyrillic letters, dashes, and smart quotes.
 */
export function sanitizePdfText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/[\u2018\u2019\u02BB\u02BC\u0060\u00B4\u02CA\u02CB]/g, "'")
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    .replace(/ў/g, "o'").replace(/Ў/g, "O'")
    .replace(/ғ/g, "g'").replace(/Ғ/g, "G'")
    .replace(/қ/g, "q").replace(/Қ/g, "Q")
    .replace(/ҳ/g, "h").replace(/Ҳ/g, "H")
    .replace(/ш/g, "sh").replace(/Ш/g, "Sh")
    .replace(/ч/g, "ch").replace(/Ч/g, "Ch")
    .replace(/ю/g, "yu").replace(/Ю/g, "Yu")
    .replace(/я/g, "ya").replace(/Я/g, "Ya")
    .replace(/ё/g, "yo").replace(/Ё/g, "Yo")
    .replace(/е/g, "ye").replace(/Е/g, "Ye")
    .replace(/а/g, "a").replace(/А/g, "A")
    .replace(/б/g, "b").replace(/Б/g, "B")
    .replace(/в/g, "v").replace(/В/g, "V")
    .replace(/г/g, "g").replace(/Г/g, "G")
    .replace(/д/g, "d").replace(/Д/g, "D")
    .replace(/ж/g, "j").replace(/Ж/g, "J")
    .replace(/з/g, "z").replace(/З/g, "Z")
    .replace(/и/g, "i").replace(/И/g, "I")
    .replace(/й/g, "y").replace(/Й/g, "Y")
    .replace(/к/g, "k").replace(/К/g, "K")
    .replace(/л/g, "l").replace(/Л/g, "L")
    .replace(/м/g, "m").replace(/М/g, "M")
    .replace(/н/g, "n").replace(/Н/g, "N")
    .replace(/о/g, "o").replace(/О/g, "O")
    .replace(/п/g, "p").replace(/П/g, "P")
    .replace(/р/g, "r").replace(/Р/g, "R")
    .replace(/с/g, "s").replace(/С/g, "S")
    .replace(/т/g, "t").replace(/Т/g, "T")
    .replace(/у/g, "u").replace(/У/g, "U")
    .replace(/ф/g, "f").replace(/Ф/g, "F")
    .replace(/х/g, "x").replace(/Х/g, "X")
    .replace(/ц/g, "ts").replace(/Ц/g, "Ts")
    .replace(/ь/g, "").replace(/Ь/g, "")
    .replace(/ъ/g, "'").replace(/Ъ/g, "'")
    .replace(/э/g, "e").replace(/Э/g, "E")
    .trim();
}

/**
 * Master Student Portfolio PDF Generator
 * Combines Academic Rigor (Vazirlik standarti), Modern Silicon Valley KPI aesthetics,
 * and Europass International CV structure into an elite document.
 */
export async function generateStudentPortfolioPdf(data: PortfolioData): Promise<void> {
  const { student, supervisor, projects, startups, achievements, certificates, events } = data;
  const options = data.options || {};
  const template = options.template || 'master';
  const includeQr = options.includeQrCode !== false;
  const includeSignatures = options.includeSupervisorSignature !== false;
  const includePhoto = options.includeStudentPhoto !== false;

  const validLangCerts = (data.languageCertificates || []).filter(
    (c) => !c.isDeleted && (c.status === 'Tasdiqlangan' || !c.status)
  );
  const allProjects = [...projects, ...startups];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Patch doc.text to automatically sanitize text for standard PDF fonts
  const originalText = doc.text.bind(doc);
  doc.text = function (text: any, x: any, y: any, textOptions?: any) {
    if (typeof text === 'string') {
      text = sanitizePdfText(text);
    } else if (Array.isArray(text)) {
      text = text.map(t => (typeof t === 'string' ? sanitizePdfText(t) : t));
    }
    return originalText(text, x, y, textOptions);
  } as any;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Generate Unique Portfolio Registration Serial
  const cleanId = (student.id || '0000').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  const serialNumber = `PORT-2026-${student.course || 1}${cleanId}`;
  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify?type=portfolio&id=${encodeURIComponent(student.id || '')}&serial=${serialNumber}`
      : `https://iqtidorli.edu.uz/verify/${serialNumber}`;

  // Pre-generate QR Code
  let qrDataUrl: string | null = null;
  if (includeQr) {
    try {
      qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff',
        },
      });
    } catch {
      qrDataUrl = null;
    }
  }

  // Pre-fetch photo if requested
  const photoUrl = student.avatarUrl || student.photoURL;
  let photoDataUrl: string | null = null;
  if (includePhoto && photoUrl) {
    photoDataUrl = await getBase64ImageFromUrl(photoUrl);
  }

  // Helper for page break
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 24) {
      doc.addPage();
      currentY = margin;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(margin, currentY, contentWidth, 1.2, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Iqtidorli Talaba Portfoliosi • ${student.fullName} • № ${serialNumber}`, margin, currentY - 2);
    currentY += 6;
  };

  // =========================================================================
  // ROUTE ACCORDING TO SELECTED TEMPLATE
  // =========================================================================
  if (template === 'europass') {
    renderEuropassStyle();
  } else if (template === 'academic') {
    renderAcademicStyle();
  } else if (template === 'modern') {
    renderModernStyle();
  } else {
    renderMasterHarmonizedStyle();
  }

  // Draw Page Numbers and Footers on ALL pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Oliy ta’lim, fan va innovatsiyalar vazirligi «Iqtidorli Talabalar» platformasi`,
      margin,
      pageHeight - 7.5
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`Sahifa ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  }

  const safeFileName = (student.fullName || 'Talaba').replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_');
  doc.save(`Portfolio_${safeFileName}_${serialNumber}.pdf`);

  // =========================================================================
  // 1. MASTER HARMONIZED VARIANT (3-in-1 Masterpiece)
  // =========================================================================
  function renderMasterHarmonizedStyle() {
    // Top Official Ribbon & Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 7, 'F');
    doc.setFillColor(217, 119, 6); // amber-600 gold accent
    doc.rect(0, 7, pageWidth, 1.8, 'F');

    currentY = 14;

    // Header Emblem & Ministry Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);
    doc.text(
      'O‘ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR VAZIRLIGI',
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 6;
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('IQTIDORLI TALABA MILLIY PORTFOLIOSI', pageWidth / 2, currentY, { align: 'center' });

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const dateFormatted = new Date().toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(
      `Davlat standarti asosida shakllantirilgan rasmiy reestr hujjati • Sana: ${dateFormatted}`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 8;

    // Top Metadata Bar: Serial, Security Hash, Verification Badge
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 9, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`REESTR RAQAMI: ${serialNumber}`, margin + 5, currentY + 6);

    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(margin + contentWidth - 48, currentY + 1.8, 44, 5.4, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('TASDIQLANGAN PORTFOLIO', margin + contentWidth - 26, currentY + 5.5, { align: 'center' });

    currentY += 14;

    // STUDENT HERO PROFILE CARD (Photo + Details + QR Code)
    const cardHeight = 44;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'FD');

    // Left Accent bar
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(margin, currentY, 3, cardHeight, 1, 1, 'F');

    // Photo Box or Monogram
    const photoBoxSize = 34;
    const photoX = margin + 8;
    const photoY = currentY + 5;

    if (photoDataUrl) {
      try {
        doc.addImage(photoDataUrl, 'JPEG', photoX, photoY, photoBoxSize, photoBoxSize);
        doc.setDrawColor(203, 213, 225);
        doc.rect(photoX, photoY, photoBoxSize, photoBoxSize, 'S');
      } catch {
        drawVectorAvatar(doc, photoX, photoY, photoBoxSize, student.fullName);
      }
    } else {
      drawVectorAvatar(doc, photoX, photoY, photoBoxSize, student.fullName);
    }

    // Student Info (Middle)
    const textStartX = photoX + photoBoxSize + 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(student.fullName || 'Talaba', textStartX, currentY + 10);

    // Top Student Badge if applicable
    if (student.isTopStudent) {
      doc.setFillColor(254, 243, 199); // amber-100
      doc.roundedRect(textStartX, currentY + 12.5, 42, 4.8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(
        `★ OTM IQTIDORLI TALABASI ${student.topStudentRank ? `(#${student.topStudentRank})` : ''}`,
        textStartX + 2,
        currentY + 16
      );
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(71, 85, 105);

    const dirFormatted = canonicalizeDirection(student.facultyOrField) || student.facultyOrField || '—';
    const courseGroup = `Bosqich: ${student.course ? `${student.course}-kurs` : '—'}   |   Guruh: ${student.group || '—'}`;
    const supName = supervisor ? supervisor.fullName : student.customSupervisorName || 'Biriktirilmagan';
    const supDegree = supervisor?.academicDegree ? ` (${supervisor.academicDegree})` : '';

    doc.text(`Mutaxassislik: ${dirFormatted}`, textStartX, currentY + (student.isTopStudent ? 22 : 18));
    doc.text(courseGroup, textStartX, currentY + (student.isTopStudent ? 27.5 : 23.5));
    doc.text(`Ilmiy rahbar: ${supName}${supDegree}`, textStartX, currentY + (student.isTopStudent ? 33 : 29));
    doc.text(
      `Aloqa / Tizim ID: ${student.phone ? `+998 ${student.phone.slice(-9)}` : student.userId || '—'}`,
      textStartX,
      currentY + (student.isTopStudent ? 38.5 : 34.5)
    );

    // QR Code (Right side)
    if (qrDataUrl && includeQr) {
      const qrSize = 30;
      const qrX = margin + contentWidth - qrSize - 6;
      const qrY = currentY + 5;
      try {
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 58, 138);
        doc.text('ELEKTRON TEKSHIRISH', qrX + qrSize / 2, qrY + qrSize + 3.5, { align: 'center' });
      } catch {
        // skip QR if error
      }
    }

    currentY += cardHeight + 6;

    // SILICON VALLEY KPI METRIC CARDS (6 Blocks across width)
    const metrics = [
      { label: 'Yutuqlar', value: achievements.length, color: [245, 158, 11] }, // amber
      { label: 'Loyihalar', value: projects.length, color: [59, 130, 246] }, // blue
      { label: 'Startaplar', value: startups.length, color: [147, 51, 234] }, // purple
      { label: 'Sertifikatlar', value: certificates.length, color: [16, 185, 129] }, // emerald
      { label: 'Chet tillari', value: validLangCerts.length, color: [79, 70, 229] }, // indigo
      { label: 'Tadbirlar', value: events.length, color: [244, 63, 94] }, // rose
    ];

    const cardGap = 3.5;
    const singleCardWidth = (contentWidth - cardGap * (metrics.length - 1)) / metrics.length;
    const metricCardHeight = 16;

    metrics.forEach((m, idx) => {
      const mx = margin + idx * (singleCardWidth + cardGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(mx, currentY, singleCardWidth, metricCardHeight, 1.5, 1.5, 'FD');

      // Top color indicator bar
      doc.setFillColor(m.color[0], m.color[1], m.color[2]);
      doc.roundedRect(mx, currentY, singleCardWidth, 1.5, 1, 1, 'F');

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(String(m.value), mx + singleCardWidth / 2, currentY + 8.5, { align: 'center' });

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(m.label, mx + singleCardWidth / 2, currentY + 13, { align: 'center' });
    });

    currentY += metricCardHeight + 8;

    // SECTION BUILDERS
    renderSections();

    // SUPERVISOR & DEAN ENDORSEMENT BLOCK
    if (includeSignatures) {
      renderEndorsementSignatures();
    }
  }

  // =========================================================================
  // 2. ACADEMIC STYLE
  // =========================================================================
  function renderAcademicStyle() {
    // Elegant Double Border
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.8);
    doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8, 'S');
    doc.setLineWidth(0.3);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4, 'S');

    currentY = margin + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text(
      'O‘ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR VAZIRLIGI',
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
    currentY += 6;
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('TALABANING ILMIY-AKADEMIK PORTFOLIOSI', pageWidth / 2, currentY, { align: 'center' });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Hujjat № ${serialNumber}   |   Sana: ${new Date().toLocaleDateString('uz-UZ')}`, pageWidth / 2, currentY, {
      align: 'center',
    });

    currentY += 10;

    // Academic Profile Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 32, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(student.fullName, margin + 6, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Ta’lim yo‘nalishi: ${canonicalizeDirection(student.facultyOrField) || '—'}`, margin + 6, currentY + 16);
    doc.text(`Bosqich: ${student.course || '—'}-kurs   |   Guruh: ${student.group || '—'}`, margin + 6, currentY + 22);
    doc.text(`Ilmiy rahbar: ${supervisor?.fullName || student.customSupervisorName || 'Biriktirilmagan'}`, margin + 6, currentY + 28);

    if (qrDataUrl && includeQr) {
      doc.addImage(qrDataUrl, 'PNG', margin + contentWidth - 28, currentY + 3, 26, 26);
    }

    currentY += 38;
    renderSections();
    if (includeSignatures) renderEndorsementSignatures();
  }

  // =========================================================================
  // 3. MODERN SILICON VALLEY STYLE
  // =========================================================================
  function renderModernStyle() {
    // Dark modern gradient-like banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, currentY, contentWidth, 36, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(student.fullName, margin + 8, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${canonicalizeDirection(student.facultyOrField) || 'Taʼlim yo‘nalishi'} • ${student.course}-kurs`, margin + 8, currentY + 20);
    doc.text(`Ilmiy rahbar: ${supervisor?.fullName || student.customSupervisorName || '—'}`, margin + 8, currentY + 27);

    if (qrDataUrl && includeQr) {
      doc.addImage(qrDataUrl, 'PNG', margin + contentWidth - 30, currentY + 4, 28, 28);
    }

    currentY += 42;

    // High Tech Stat Chips
    const chips = [
      { t: 'Yutuqlar', v: achievements.length },
      { t: 'Loyihalar', v: projects.length },
      { t: 'Startaplar', v: startups.length },
      { t: 'Sertifikatlar', v: certificates.length },
    ];
    const cW = (contentWidth - 9) / 4;
    chips.forEach((c, idx) => {
      const cx = margin + idx * (cW + 3);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(cx, currentY, cW, 14, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text(String(c.v), cx + cW / 2, currentY + 6.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(c.t, cx + cW / 2, currentY + 11, { align: 'center' });
    });

    currentY += 20;
    renderSections();
    if (includeSignatures) renderEndorsementSignatures();
  }

  // =========================================================================
  // 4. EUROPASS STYLE
  // =========================================================================
  function renderEuropassStyle() {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth * 0.32, pageHeight - margin * 2, 'F');

    // Sidebar left: Photo, Personal, Languages, Supervisor
    const sideW = contentWidth * 0.32;
    const mainX = margin + sideW + 6;
    const mainW = contentWidth - sideW - 6;

    let sideY = currentY + 4;
    if (photoDataUrl) {
      try {
        doc.addImage(photoDataUrl, 'JPEG', margin + 4, sideY, sideW - 8, sideW - 8);
        sideY += sideW - 4;
      } catch {
        drawVectorAvatar(doc, margin + 4, sideY, sideW - 8, student.fullName);
        sideY += sideW - 4;
      }
    } else {
      drawVectorAvatar(doc, margin + 4, sideY, sideW - 8, student.fullName);
      sideY += sideW - 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(student.fullName, margin + 4, sideY);
    sideY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Bosqich: ${student.course}-kurs`, margin + 4, sideY);
    sideY += 4.5;
    doc.text(`Guruh: ${student.group}`, margin + 4, sideY);
    sideY += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('XORIJIY TILLAR', margin + 4, sideY);
    sideY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    if (validLangCerts.length === 0) {
      doc.text('Maʼlumot yo‘q', margin + 4, sideY);
      sideY += 6;
    } else {
      validLangCerts.forEach((lc) => {
        doc.text(`• ${lc.language}: ${lc.level} (${lc.score || lc.certificateType})`, margin + 4, sideY);
        sideY += 4.5;
      });
    }

    if (qrDataUrl && includeQr) {
      doc.addImage(qrDataUrl, 'PNG', margin + (sideW - 22) / 2, pageHeight - margin - 35, 22, 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 58, 138);
      doc.text('Onlayn tekshirish', margin + sideW / 2, pageHeight - margin - 10, { align: 'center' });
    }

    // Right column header & content
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('EUROPEAN / ACADEMIC CURRICULUM VITAE', mainX, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ta’lim yo‘nalishi: ${canonicalizeDirection(student.facultyOrField) || '—'}`, mainX, currentY + 15);

    currentY += 24;
    renderSections(mainX, mainW);
  }

  // =========================================================================
  // SECTION RENDERERS
  // =========================================================================
  function renderSections(overrideMargin = margin, overrideWidth = contentWidth) {
    const drawSectionTitle = (title: string, count: number, accentColor = [30, 58, 138]) => {
      checkPageBreak(16);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(overrideMargin, currentY, overrideWidth, 7.5, 1, 1, 'F');

      // Left small color indicator
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(overrideMargin, currentY, 2.5, 7.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`${title} (${count})`, overrideMargin + 6, currentY + 5.2);
      currentY += 11;
    };

    // 1. ACHIEVEMENTS
    drawSectionTitle('1. ILMIY VA IJODIY YUTUQLAR', achievements.length, [217, 119, 6]);
    if (achievements.length === 0) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Hozircha rasmiy yutuqlar kiritilmagan.', overrideMargin + 4, currentY);
      currentY += 7;
    } else {
      achievements.forEach((ach, i) => {
        checkPageBreak(18);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(overrideMargin, currentY, overrideWidth, 14, 1.5, 1.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`${i + 1}. ${ach.title}`, overrideMargin + 4, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Kategoriya: ${ach.category || 'Umumiy'}   |   Sana: ${ach.date || '—'}   |   Holat: ${ach.status}`,
          overrideMargin + 4,
          currentY + 10
        );

        currentY += 17;
      });
    }
    currentY += 2;

    // 2. PROJECTS & STARTUPS
    drawSectionTitle('2. ILMIY LOYIHALAR VA STARTAPLAR', allProjects.length, [37, 99, 235]);
    if (allProjects.length === 0) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Hozircha rasmiy loyihalar mavjud emas.', overrideMargin + 4, currentY);
      currentY += 7;
    } else {
      allProjects.forEach((proj, i) => {
        checkPageBreak(20);
        const isStartup = proj.type === 'startap';
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(overrideMargin, currentY, overrideWidth, 15, 1.5, 1.5, 'S');

        // Badge [STARTAP] or [LOYIHA]
        doc.setFillColor(isStartup ? 243 : 239, isStartup ? 232 : 246, isStartup ? 255 : 255);
        doc.roundedRect(overrideMargin + 4, currentY + 2.5, 20, 4.5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(isStartup ? 147 : 37, isStartup ? 51 : 99, isStartup ? 234 : 235);
        doc.text(isStartup ? 'STARTAP' : 'LOYIHA', overrideMargin + 14, currentY + 5.8, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`${i + 1}. ${proj.title}`, overrideMargin + 27, currentY + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Soha: ${proj.field || '—'}   |   Holat: ${proj.status}   |   Muallif(lar): ${proj.authorNames || student.fullName}`,
          overrideMargin + 4,
          currentY + 11.5
        );

        currentY += 18;
      });
    }
    currentY += 2;

    // 3. CERTIFICATES
    drawSectionTitle('3. RASMIY SERTIFIKATLAR VA GUVIHNOMALAR', certificates.length, [16, 185, 129]);
    if (certificates.length === 0) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Hozircha rasmiy sertifikatlar mavjud emas.', overrideMargin + 4, currentY);
      currentY += 7;
    } else {
      certificates.forEach((cert, i) => {
        checkPageBreak(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(15, 23, 42);
        doc.text(`${i + 1}. ${cert.title}`, overrideMargin + 4, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `№ ${cert.certificateNumber}   |   Tadbir: ${cert.eventTitle}   |   Tashkilot: ${cert.organizationName || 'OTM'}   |   Sana: ${cert.issueDate || '—'}`,
          overrideMargin + 7,
          currentY + 4.5
        );
        currentY += 10;
      });
    }
    currentY += 2;

    // 4. LANGUAGE CERTIFICATES
    drawSectionTitle('4. XORIJIY TIL SERTIFIKATLARI (CEFR / IELTS)', validLangCerts.length, [79, 70, 229]);
    if (validLangCerts.length === 0) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Hozircha tasdiqlangan til sertifikatlari mavjud emas.', overrideMargin + 4, currentY);
      currentY += 7;
    } else {
      validLangCerts.forEach((lc, i) => {
        checkPageBreak(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `${i + 1}. ${lc.language} — ${lc.certificateType} (Daraja: ${lc.level}${lc.score ? `, Ball: ${lc.score}` : ''})`,
          overrideMargin + 4,
          currentY
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `№ ${lc.certificateNumber}   |   Berilgan: ${lc.issueDate || '—'}   |   Amal qilish muddati: ${lc.expiryDate || 'Muddatsiz'}`,
          overrideMargin + 7,
          currentY + 4.5
        );
        currentY += 10;
      });
    }
    currentY += 2;

    // 5. EVENTS
    drawSectionTitle('5. ISHTIROK ETILGAN TADBIR VA TANLOVLAR', events.length, [244, 63, 94]);
    if (events.length === 0) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Hozircha qayd etilgan tadbirlar mavjud emas.', overrideMargin + 4, currentY);
      currentY += 7;
    } else {
      events.forEach((ev, i) => {
        checkPageBreak(13);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(15, 23, 42);
        doc.text(`${i + 1}. ${ev.title}`, overrideMargin + 4, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Sana: ${ev.date || '—'}   |   O‘tkazilish joyi: ${ev.location || '—'}`, overrideMargin + 7, currentY + 4.5);
        currentY += 10;
      });
    }
  }

  // =========================================================================
  // ENDORSEMENT & OFFICIAL SIGNATURE BLOCK
  // =========================================================================
  function renderEndorsementSignatures() {
    checkPageBreak(36);
    currentY += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 30, 2, 2, 'FD');

    const colWidth = (contentWidth - 16) / 3;

    // 1. Supervisor signature
    const supName = supervisor?.fullName || student.customSupervisorName || 'Biriktirilgan rahbar';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('ILMIY RAHBAR TASDIG‘I:', margin + 6, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(supName, margin + 6, currentY + 13);
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 6, currentY + 22, margin + 6 + colWidth, currentY + 22);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(imzo va sana)', margin + 6, currentY + 26);

    // 2. Official Seal Box
    const sealX = margin + colWidth + 10;
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(sealX + (colWidth - 22) / 2, currentY + 4, 22, 22, 1, 1, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(217, 119, 6);
    doc.text('M.O‘.', sealX + colWidth / 2, currentY + 13, { align: 'center' });
    doc.setFontSize(5.8);
    doc.text('RASMIY MUHR', sealX + colWidth / 2, currentY + 18, { align: 'center' });

    // 3. Dean / Innovation Dept
    const deanX = margin + colWidth * 2 + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('ILMIY BO‘LIM / DEKANAT:', deanX, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Mas’ul shaxs tasdig‘i', deanX, currentY + 13);
    doc.setDrawColor(148, 163, 184);
    doc.line(deanX, currentY + 22, deanX + colWidth - 4, currentY + 22);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(imzo va sana)', deanX, currentY + 26);

    currentY += 34;
  }
}

/**
 * Draws an elegant vector monogram badge if photo is absent or failed to load.
 */
function drawVectorAvatar(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  fullName: string
): void {
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(x, y, size, size, 2, 2, 'FD');

  const initials = (fullName || 'T')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size * 0.4);
  doc.setTextColor(30, 58, 138);
  doc.text(initials, x + size / 2, y + size * 0.62, { align: 'center' });
}
