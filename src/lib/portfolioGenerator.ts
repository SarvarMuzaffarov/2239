import { jsPDF } from 'jspdf';
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

export interface PortfolioData {
  student: StudentProfile;
  supervisor?: SupervisorProfile;
  projects: ProjectOrStartup[];
  startups: ProjectOrStartup[];
  achievements: Achievement[];
  certificates: CertificateItem[];
  languageCertificates?: LanguageCertificate[];
  events: EventItem[];
}

/**
 * Generates a clean, professional, multi-page Student Portfolio PDF.
 * Never includes sensitive credentials (passwords, phone numbers, salt, internal tokens).
 */
export async function generateStudentPortfolioPdf(data: PortfolioData): Promise<void> {
  const { student, supervisor, projects, startups, achievements, certificates, events } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = margin;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(margin, currentY, contentWidth, 1.5, 'F');
    currentY += 6;
  };

  // 1. TOP OFFICIAL HEADER
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, currentY, contentWidth, 36, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(margin, currentY, contentWidth, 36, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(
    'O‘ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR VAZIRLIGI',
    pageWidth / 2,
    currentY + 8,
    { align: 'center' }
  );

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('IQTIDORLI TALABA RASMIY PORTFOLIOSI', pageWidth / 2, currentY + 18, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const genDateStr = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Hujjat shakllantirilgan sana: ${genDateStr}`, pageWidth / 2, currentY + 26, {
    align: 'center',
  });

  currentY += 44;

  // 2. STUDENT BASIC INFORMATION CARD
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(student.fullName || 'Talaba', margin + 6, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  const supName = supervisor ? supervisor.fullName : student.customSupervisorName || 'Biriktirilmagan';

  const formattedFaculty = canonicalizeDirection(student.facultyOrField) || student.facultyOrField || '—';
  doc.text(`Ta’lim yo‘nalishi: ${formattedFaculty}`, margin + 6, currentY + 18);
  doc.text(
    `Bosqich: ${student.course ? `${student.course}-kurs` : '—'}    |    Guruh: ${student.group || '—'}`,
    margin + 6,
    currentY + 25
  );
  doc.text(`Ilmiy rahbar: ${supName}`, margin + 6, currentY + 32);

  currentY += 46;

  // Helper for Section Headers
  const drawSectionTitle = (title: string, count: number) => {
    checkPageBreak(18);
    doc.setFillColor(239, 246, 255); // blue-50
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.line(margin, currentY + 8, margin + contentWidth, currentY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(`${title} (${count})`, margin + 4, currentY + 5.5);
    currentY += 12;
  };

  // 3. ACHIEVEMENTS SECTION
  drawSectionTitle('1. YUTUQLAR VA MUKOFOTLAR', achievements.length);
  if (achievements.length === 0) {
    checkPageBreak(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Hozircha rasmiy yutuqlar kiritilmagan.', margin + 4, currentY);
    currentY += 8;
  } else {
    achievements.forEach((ach, i) => {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${ach.title}`, margin + 4, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Kategoriya: ${ach.category}   |   Sana: ${ach.date || '—'}   |   Holat: ${ach.status}`, margin + 8, currentY + 5);

      if (ach.description) {
        const descLines = doc.splitTextToSize(ach.description, contentWidth - 12);
        doc.setTextColor(71, 85, 105);
        doc.text(descLines.slice(0, 2), margin + 8, currentY + 10);
        currentY += 10 + Math.min(2, descLines.length) * 4;
      } else {
        currentY += 10;
      }
    });
  }
  currentY += 4;

  // 4. SCIENTIFIC PROJECTS & STARTUPS
  const allProjects = [...projects, ...startups];
  drawSectionTitle('2. ILMIY LOYIHALAR VA STARTAPLAR', allProjects.length);
  if (allProjects.length === 0) {
    checkPageBreak(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Hozircha ro‘yxatdan o‘tkazilgan loyihalar mavjud emas.', margin + 4, currentY);
    currentY += 8;
  } else {
    allProjects.forEach((proj, i) => {
      checkPageBreak(22);
      const isStartup = proj.type === 'startap';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. [${isStartup ? 'STARTAP' : 'LOYIHA'}] ${proj.title}`, margin + 4, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Yo‘nalish: ${proj.field || '—'}   |   Holat: ${proj.status}   |   Mualliflar: ${proj.authorNames || student.fullName}`, margin + 8, currentY + 5);

      if (proj.description) {
        const descLines = doc.splitTextToSize(proj.description, contentWidth - 12);
        doc.setTextColor(71, 85, 105);
        doc.text(descLines.slice(0, 2), margin + 8, currentY + 10);
        currentY += 10 + Math.min(2, descLines.length) * 4;
      } else {
        currentY += 10;
      }
    });
  }
  currentY += 4;

  // 5. CERTIFICATES SECTION
  drawSectionTitle('3. SERTIFIKATLAR VA GUVIHNOMALAR', certificates.length);
  if (certificates.length === 0) {
    checkPageBreak(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Hozircha rasmiy sertifikatlar mavjud emas.', margin + 4, currentY);
    currentY += 8;
  } else {
    certificates.forEach((cert, i) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${cert.title}`, margin + 4, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `№ ${cert.certificateNumber}   |   Tadbir: ${cert.eventTitle}   |   Tashkilot: ${cert.organizationName}   |   Sana: ${cert.issueDate || '—'}`,
        margin + 8,
        currentY + 5
      );
      currentY += 11;
    });
  }
  currentY += 4;

  // 6. LANGUAGE CERTIFICATES SECTION
  const validLangCerts = (data.languageCertificates || []).filter(c => !c.isDeleted && c.status === 'Tasdiqlangan');
  drawSectionTitle('4. XORIJIIY TIL SERTIFIKATLARI (LANGUAGE CERTIFICATES)', validLangCerts.length);
  if (validLangCerts.length === 0) {
    checkPageBreak(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Hozircha tasdiqlangan xorijiy til sertifikati mavjud emas.', margin + 4, currentY);
    currentY += 8;
  } else {
    validLangCerts.forEach((lc, i) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${lc.language} — ${lc.certificateType} (Daraja: ${lc.level}${lc.score ? `, Ball: ${lc.score}` : ''})`, margin + 4, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Seriya/Raqam: ${lc.certificateNumber}   |   Berilgan: ${lc.issueDate || '—'}   |   Amal qilish muddati: ${lc.expiryDate || 'Muddatsiz'}`,
        margin + 8,
        currentY + 5
      );
      currentY += 11;
    });
  }
  currentY += 4;

  // 7. EVENTS PARTICIPATION
  drawSectionTitle('5. ISHTIROK ETGAN TADBIR VA TANLOVLAR', events.length);
  if (events.length === 0) {
    checkPageBreak(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Hozircha ishtirok etilgan tadbirlar qayd etilmagan.', margin + 4, currentY);
    currentY += 8;
  } else {
    events.forEach((ev, i) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${ev.title}`, margin + 4, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Sana: ${ev.date || '—'} ${ev.time ? `(${ev.time})` : ''}   |   Joy: ${ev.location || '—'}`, margin + 8, currentY + 5);
      currentY += 11;
    });
  }

  // 7. FOOTER & VERIFICATION NOTE
  checkPageBreak(25);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY + 4, margin + contentWidth, currentY + 4);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Ushbu portfolio «Iqtidorli Talabalar» axborot tizimining tasdiqlangan elektron ma’lumotlari asosida shakllantirildi.',
    pageWidth / 2,
    currentY + 10,
    { align: 'center' }
  );

  const safeFileName = (student.fullName || 'Talaba').replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_');
  doc.save(`Talaba_Portfolio_${safeFileName}.pdf`);
}
