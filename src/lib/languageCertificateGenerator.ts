import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { LanguageCertificate } from '../types';

/**
 * Generates an official, beautifully styled digital PDF certificate
 * for Bilim va malakalarni baholash agentligi (UzbMB / DTM) or IELTS / Attanal.
 */
export async function generateLanguageCertificatePdfDataUrl(
  cert: LanguageCertificate
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297

  // Background ornamental border
  doc.setDrawColor(200, 160, 100);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(230, 200, 150);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Corner decorations
  doc.setFillColor(180, 130, 70);
  doc.circle(12, 12, 2, 'F');
  doc.circle(pageWidth - 12, 12, 2, 'F');
  doc.circle(12, pageHeight - 12, 2, 'F');
  doc.circle(pageWidth - 12, pageHeight - 12, 2, 'F');

  // Header 2-column or centered
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  const leftHeader = [
    "O'ZBEKISTON RESPUBLIKASI",
    "OLIY TA'LIM, FAN VA INNOVATSIYALAR",
    "VAZIRLIGI HUZURIDAGI",
    "BILIM VA MALAKALARNI BAHOLASH",
    "AGENTLIGI",
  ];

  const rightHeader = [
    'AGENCY FOR ASSESSMENT OF',
    'KNOWLEDGE AND COMPETENCES',
    'UNDER THE MINISTRY OF HIGHER',
    'EDUCATION, SCIENCE AND',
    'INNOVATIONS OF THE REPUBLIC OF',
    'UZBEKISTAN',
  ];

  let yPos = 24;
  leftHeader.forEach((line, idx) => {
    doc.text(line, 20, yPos + idx * 4);
  });

  rightHeader.forEach((line, idx) => {
    doc.text(line, pageWidth - 20, yPos + idx * 4, { align: 'right' });
  });

  // Center Seal / Crest Badge
  doc.setFillColor(30, 58, 138); // Navy
  doc.circle(pageWidth / 2, 32, 9, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('UZBMB', pageWidth / 2, 33, { align: 'center' });
  doc.setFontSize(6);
  doc.text('TEST', pageWidth / 2, 36, { align: 'center' });

  // Certificate title
  yPos = 58;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // Amber
  doc.text("CHET TILINI BILISH DARAJASI TO'G'RISIDA", pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(217, 119, 6);
  doc.text('SERTIFIKAT', pageWidth / 2, yPos, { align: 'center' });

  yPos += 7;
  doc.setFontSize(16);
  doc.setTextColor(217, 119, 6);
  doc.text('CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('OF FOREIGN LANGUAGE PROFICIENCY', pageWidth / 2, yPos, { align: 'center' });

  // Reference Number Box
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Sertifikat №  |  Reference Number:', 25, yPos);

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(pageWidth - 85, yPos - 5, 60, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(cert.certificateNumber || '26BBA0000000XX', pageWidth - 55, yPos, { align: 'center' });

  // Candidate Details Section Box
  yPos += 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(20, yPos, pageWidth - 40, 44);

  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, pageWidth - 40, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Talabgor to'g'risidagi ma'lumot  |  Candidate Details", 24, yPos + 5);

  const photoWidth = 26;
  const photoHeight = 32;
  const photoX = pageWidth - 20 - photoWidth - 4;
  const photoY = yPos + 9;

  doc.setDrawColor(203, 213, 225);
  doc.rect(photoX, photoY, photoWidth, photoHeight);
  doc.setFillColor(241, 245, 249);
  doc.rect(photoX, photoY, photoWidth, photoHeight, 'F');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('FOTO / PHOTO', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });

  // Candidate text fields
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  let detailsY = yPos + 13;
  doc.setFont('helvetica', 'normal');
  doc.text('Familiyasi, Ismi / Full Name:', 24, detailsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cert.studentName.toUpperCase(), 75, detailsY);

  detailsY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Chet tili / Foreign Language:', 24, detailsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cert.language, 75, detailsY);

  detailsY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Sertifikat turi / Exam Type:', 24, detailsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cert.certificateType, 75, detailsY);

  detailsY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Telefon / Bog‘lanish:', 24, detailsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cert.studentPhone || '—', 75, detailsY);

  // Test Results Section
  yPos += 50;
  doc.setDrawColor(203, 213, 225);
  doc.rect(20, yPos, pageWidth - 40, 52);

  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, pageWidth - 40, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Test sinovi natijalari  |  Test Results & Proficiency Level", 24, yPos + 5);

  // Big Level Badge
  doc.setFillColor(30, 58, 138); // Blue
  doc.roundedRect(25, yPos + 12, 38, 30, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Daraja / Level', 44, yPos + 18, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(cert.level || 'B1', 44, yPos + 29, { align: 'center' });
  doc.setFontSize(7);
  doc.text('CEFR SCALE', 44, yPos + 37, { align: 'center' });

  // Score details
  const scoreBoxX = 70;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(scoreBoxX, yPos + 12, pageWidth - 40 - 55, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Umumiy natija / Overall Score:', scoreBoxX + 5, yPos + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(cert.score || `${cert.level} daraja`, scoreBoxX + 5, yPos + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Holati: ${cert.status} • Rasmiy tasdiqlangan hujjat`,
    scoreBoxX + 5,
    yPos + 34
  );

  // Dates & QR Code Section
  yPos += 60;

  // Issue & Expiry date box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Berilgan sanasi / Date of Issue:', 24, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cert.issueDate, 24, yPos + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Amal qilish muddati / Valid until:', 24, yPos + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cert.expiryDate || 'Muddatsiz', 24, yPos + 20);

  // Signature on the right
  const sigX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Direktor / Director:', sigX, yPos + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('M. KARIMOV', sigX, yPos + 12);
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, yPos + 15, sigX + 45, yPos + 15);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('(imzo va muhr)', sigX, yPos + 19);

  // QR Code
  try {
    const verifyUrl = cert.certificateType.toLowerCase().includes('ielts')
      ? `https://ielts.org/verify?trf=${cert.certificateNumber}`
      : `https://sertifikat.uzbmb.uz/verify?id=${encodeURIComponent(cert.certificateNumber)}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 120,
      margin: 1,
    });
    doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 12, yPos - 5, 24, 24);
  } catch (qrErr) {
    console.warn('QR code generation warning:', qrErr);
  }

  // Footer text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Sertifikatning haqiqiyligini sertifikat.uzbmb.uz yoki iqtidorli talabalar tizimi orqali tekshirish mumkin.',
    pageWidth / 2,
    pageHeight - 16,
    { align: 'center' }
  );

  return doc.output('datauristring');
}

/**
 * Downloads the certificate directly as a PDF file
 */
export async function downloadLanguageCertificatePdf(cert: LanguageCertificate): Promise<void> {
  const dataUrl = await generateLanguageCertificatePdfDataUrl(cert);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `Sertifikat_${cert.studentName.replace(/\s+/g, '_')}_${cert.certificateNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
