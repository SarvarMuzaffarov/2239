import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };
import { generateLanguageCertificatePdfDataUrl } from '../src/lib/languageCertificateGenerator';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:iqtidorli-talabalar-platform-salt`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

function cleanStr(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, "'")
    .replace(/[\s\.\-]+/g, ' ')
    .trim();
}

interface RawMagistr2Student {
  fullName: string;
  passport: string;
  language: string;
  certificateType: string;
  level: string;
  score: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
}

export const MAGISTR_2KURS_LIST: RawMagistr2Student[] = [
  {
    fullName: 'Mo‘minov Sherdorbek Toshmurod o‘g‘li',
    passport: 'AC 2079977',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '48 ball (Listening: 55, Reading: 49, Writing: 45, Speaking: 43)',
    certificateNumber: '25BBA1373823MS',
    issueDate: '2025-05-02',
    expiryDate: '2027-05-01',
  },
  {
    fullName: 'Abdunabiyeva Xurshidaxon Jahongir qizi',
    passport: 'AC 2051065',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '51 ball (Listening: 53, Reading: 51, Writing: 57, Speaking: 43)',
    certificateNumber: '25BBA1470083AX',
    issueDate: '2025-06-20',
    expiryDate: '2027-06-19',
  },
  {
    fullName: 'Toshboyeva Ra’no Ne’mat qizi',
    passport: 'AD 0273740',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '45 ball (Listening: 47, Reading: 56, Writing: 40, Speaking: 37)',
    certificateNumber: '25BBA1373409TR',
    issueDate: '2025-05-02',
    expiryDate: '2027-05-01',
  },
  {
    fullName: 'G‘ulomova Shahlo Islomjon qizi',
    passport: 'AB 7636686',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '46 ball (Listening: 50, Reading: 54, Writing: 47, Speaking: 32)',
    certificateNumber: '25BBA1373614GS',
    issueDate: '2025-05-02',
    expiryDate: '2027-05-01',
  },
  {
    fullName: 'Ne’madjonova Laylo G‘ulomjon qizi',
    passport: 'AC 2219404',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '51 ball (Listening: 57, Reading: 50, Writing: 57, Speaking: 39)',
    certificateNumber: '25BBA1352630NL',
    issueDate: '2025-03-24',
    expiryDate: '2027-03-23',
  },
  {
    fullName: 'Usmonova Munavvar Shodiyor qizi',
    passport: 'AA 2230602',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '48 ball (Listening: 54, Reading: 55, Writing: 42, Speaking: 40)',
    certificateNumber: '25BBA1315352UM',
    issueDate: '2025-01-29',
    expiryDate: '2027-01-28',
  },
  {
    fullName: 'Obobakirova Saydinsa Mirzoxid qizi',
    passport: 'AC 0309419',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '53 ball (Listening: 62, Reading: 52, Writing: 52, Speaking: 45)',
    certificateNumber: '25BBA1352534OS',
    issueDate: '2025-03-24',
    expiryDate: '2027-03-23',
  },
  {
    fullName: 'To‘ychiyev Jahongir Abdurasul o‘g‘li',
    passport: 'AC 1781843',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '42 ball (Listening: 48, Reading: 50, Writing: 38, Speaking: 32)',
    certificateNumber: '25BBA1469517TJ',
    issueDate: '2025-06-20',
    expiryDate: '2027-06-19',
  },
];

async function runImportMagistr2() {
  console.log('====================================================');
  console.log('2-KURS MAGISTRATURA TALABALARINI VA TIL SERTIFIKATLARINI KIRITISH');
  console.log('====================================================');

  const studentsSnap = await getDocs(collection(db, 'students'));
  const certsSnap = await getDocs(collection(db, 'languageCertificates'));

  const existingStudents = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  const existingCerts = certsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  console.log(`Bazada mavjud talabalar: ${existingStudents.length} ta, til sertifikatlari: ${existingCerts.length} ta`);

  const studentByNameMap = new Map<string, any>();
  for (const s of existingStudents) {
    studentByNameMap.set(cleanStr(s.fullName), s);
  }

  const existingCertNumbers = new Set<string>();
  for (const c of existingCerts) {
    if (c.certificateNumber) existingCertNumbers.add(cleanStr(c.certificateNumber));
  }

  const defaultPassword = 'Magistr2024!';
  let createdStudentsCount = 0;
  let createdCertsCount = 0;

  for (const item of MAGISTR_2KURS_LIST) {
    const cleanedName = cleanStr(item.fullName);
    const cleanedCertNum = cleanStr(item.certificateNumber);
    let student = studentByNameMap.get(cleanedName);

    // If student doesn't exist, create user account & student profile
    if (!student) {
      const digitsFromPassport = item.passport.replace(/\D/g, '').padEnd(7, '0').slice(-7);
      const generatedPhone = `+99895${digitsFromPassport}`;

      const userRef = doc(collection(db, 'users'));
      const studentRef = doc(collection(db, 'students'));

      const salt = generateSalt();
      const passwordHash = await hashPassword(defaultPassword, salt);
      const nowIso = new Date().toISOString();

      const userDoc = {
        id: userRef.id,
        phone: generatedPhone,
        passwordHash,
        salt,
        role: 'student',
        fullName: item.fullName,
        isActive: true,
        createdAt: nowIso,
        metadata: {
          passport: item.passport,
          course: 2,
          isMagistr: true,
        },
      };

      const studentDoc = {
        id: studentRef.id,
        userId: userRef.id,
        fullName: item.fullName,
        phone: generatedPhone,
        course: 2,
        group: '2-Magistratura',
        facultyOrField: 'Magistratura',
        supervisorId: '',
        customSupervisorName: 'Magistratura bo‘limi',
        isDeleted: false,
        passport: item.passport,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await setDoc(userRef, userDoc);
      await setDoc(studentRef, studentDoc);

      student = studentDoc;
      studentByNameMap.set(cleanedName, student);
      createdStudentsCount++;
      console.log(`[+] Yangi 2-kurs magistr: ${item.fullName} (${generatedPhone})`);
    } else {
      console.log(`[=] Talaba allaqachon mavjud: ${item.fullName}`);
    }

    // Insert Certificate
    if (existingCertNumbers.has(cleanedCertNum)) {
      console.log(`[!] Sertifikat ${item.certificateNumber} allaqachon mavjud, o'tkazildi.`);
      continue;
    }

    const certRef = doc(collection(db, 'languageCertificates'));
    const nowIso = new Date().toISOString();

    const rawCertData: any = {
      id: certRef.id,
      studentId: student.id,
      studentName: student.fullName,
      studentPhone: student.phone,
      language: item.language,
      certificateType: item.certificateType,
      level: item.level,
      score: item.score,
      certificateNumber: item.certificateNumber,
      issueDate: item.issueDate,
      expiryDate: item.expiryDate,
      status: 'Tasdiqlangan',
      isDeleted: false,
      verified: true,
      reviewNotes: `2-kurs magistratura talabasi rasmiy til sertifikati (ID: ${item.passport})`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    let pdfDataUrl = '';
    try {
      pdfDataUrl = await generateLanguageCertificatePdfDataUrl(rawCertData);
    } catch (err) {
      console.warn('PDF generation warning:', err);
    }

    const fileName = `Sertifikat_${student.fullName.replace(/\s+/g, '_')}_${item.certificateNumber}.pdf`;

    const certDoc: any = {
      ...rawCertData,
      fileName,
      fileSize: 145000,
      fileType: 'application/pdf',
    };

    if (pdfDataUrl) {
      certDoc.fileDataUrl = pdfDataUrl;
      certDoc.fileUrl = pdfDataUrl;
    }

    await setDoc(certRef, certDoc);
    existingCertNumbers.add(cleanedCertNum);
    createdCertsCount++;
    console.log(`  [+] Sertifikat saqlandi: ${item.language} (${item.level}) - ${item.certificateNumber}`);
  }

  console.log('\n====================================================');
  console.log('2-KURS MAGISTRATURA IMPORTI TO‘LIQ YAKUNLANDI!');
  console.log(`Yaratilgan 2-kurs magistrantlar: ${createdStudentsCount} ta`);
  console.log(`Kiritilgan sertifikatlar: ${createdCertsCount} ta`);
  console.log(`Boshlang'ich parol: ${defaultPassword}`);
  console.log('====================================================');
}

runImportMagistr2()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Xatolik:', err);
    process.exit(1);
  });
