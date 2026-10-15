import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { EventItem, StudentProfile } from '../types';

export interface TicketOptions {
  event: EventItem;
  student: StudentProfile;
}

/**
 * Generates an official, printable A5 or A4 Entry Pass / Participation Ticket (PDF)
 * with institutional branding, student credentials, and a high-resolution verification QR code.
 */
export async function downloadEventTicketPdf({ event, student }: TicketOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 is standard for entry passes and passes
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background clean fill
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(30, 58, 138); // blue-900
  doc.setLineWidth(1.2);
  doc.roundedRect(6, 6, pageWidth - 12, pageHeight - 12, 4, 4, 'S');

  // Inner subtle accent frame
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 3, 3, 'S');

  // Top header banner background
  doc.setFillColor(239, 246, 255); // blue-50
  doc.rect(8.5, 8.5, pageWidth - 17, 24, 'F');

  // Institutional text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('TOSHKENT KIMYO-TEXNOLOGIYA INSTITUTI YANGIYER FILIALI', pageWidth / 2, 14, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Iqtidorli talabalar ilmiy va innovatsion faoliyati axborot tizimi", pageWidth / 2, 18, {
    align: 'center',
  });

  // Badge: Tadbir turi
  const isOlimpiada = event.eventType === 'Olimpiada' || event.title.toLowerCase().includes('olimpiada');
  const badgeLabel = isOlimpiada ? "FAN OLIMPIADASI" : (event.eventType?.toUpperCase() || "ILMIY TADBIR");

  doc.setFillColor(isOlimpiada ? 245 : 30, isOlimpiada ? 158 : 58, isOlimpiada ? 11 : 138);
  doc.roundedRect(pageWidth / 2 - 25, 22, 50, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(badgeLabel, pageWidth / 2, 26.2, { align: 'center' });

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("ISHTIROKCHI QAYD VARAQASI", pageWidth / 2, 40, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("RASMIY ISHTIROK ETISH CHIPTASI (ENTRY PASS)", pageWidth / 2, 44.5, { align: 'center' });

  // Event Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, 49, pageWidth - 24, 28, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const splitTitle = doc.splitTextToSize(event.title, pageWidth - 32);
  doc.text(splitTitle, 16, 56);

  const titleLinesCount = Array.isArray(splitTitle) ? splitTitle.length : 1;
  const currentY = 56 + (titleLinesCount * 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Sana: ${event.date}   |   Vaqt: ${event.time || "10:00"}`, 16, currentY);
  doc.text(`Manzil: ${event.location || "TKTI Yangiyer filiali binosi"}`, 16, currentY + 4.5);

  // Student Information Table/Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 82, pageWidth - 24, 60, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text("ISHTIROKCHI TALABA MA'LUMOTLARI:", 16, 89);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  let stY = 96;
  const addStudentRow = (label: string, val: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 16, stY);
    doc.setFont('helvetica', 'normal');
    doc.text(val, 55, stY);
    stY += 6.5;
  };

  addStudentRow("F.I.SH.:", student.fullName || "—");
  addStudentRow("Ta'lim yo'nalishi:", student.facultyOrField || "—");
  addStudentRow("Kurs va guruh:", `${student.course}-kurs  |  ${student.group}-guruh`);
  if (student.phone) {
    addStudentRow("Telefon raqami:", student.phone);
  }
  if (student.customSupervisorName) {
    addStudentRow("Ilmiy rahbar:", student.customSupervisorName);
  }

  // Generate QR Code with real verification data
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const qrVerificationData = `${origin}/#event/${encodeURIComponent(event.id)}?student=${encodeURIComponent(student.id)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(qrVerificationData, {
      margin: 1,
      width: 180,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    });

    // Place QR Code in bottom section
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 42, 85, 24, 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text("QR-kod orqali tekshirish", pageWidth - 30, 112, { align: 'center' });
  } catch (qrErr) {
    console.warn("QR code generation for pass note:", qrErr);
  }

  // Security and instruction footer box
  doc.setFillColor(254, 243, 199); // amber-50
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.roundedRect(12, 147, pageWidth - 24, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14); // amber-900
  doc.text("MUHIM ESLATMA:", 16, 153);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 53, 15);
  const instructions = [
    "1. Ushbu qayd varaqasi tadbir yoki olimpiada o'tkaziladigan auditoriyaga kirish uchun rasmiy ruxsatnoma hisoblanadi.",
    "2. Ishtirokchilar tadbir boshlanishidan kamida 15 daqiqa oldin shaxsni tasdiqlovchi hujjat bilan kelishlari shart.",
    "3. Natijalar va g'oliblar platformaning rasmiy portalida e'lon qilinadi hamda diplom/sertifikatlar beriladi.",
  ];
  let insY = 157.5;
  for (const ins of instructions) {
    doc.text(ins, 16, insY);
    insY += 4;
  }

  // Bottom footer timestamp & ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  const now = new Date().toLocaleString();
  doc.text(`Chop etilgan vaqt: ${now}  |  Platforma: TKTI Yangiyer filiali  |  ID: ${event.id.slice(0, 8)}`, pageWidth / 2, pageHeight - 8, {
    align: 'center',
  });

  // Trigger download
  const sanitizedStudent = (student.fullName || 'Talaba').replace(/[^a-zA-Z0-9_]/g, '_');
  doc.save(`Ishtirokchi_Chiptasi_${sanitizedStudent}.pdf`);
}
