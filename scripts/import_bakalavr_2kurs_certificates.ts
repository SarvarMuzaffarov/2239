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

interface RawBakalavrStudent {
  fullName: string;
  passport: string;
  facultyOrField: string;
  group: string;
  certificates: {
    language: string;
    certificateType: string;
    level: string;
    score: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
  }[];
}

export const BAKALAVR_2KURS_LIST: RawBakalavrStudent[] = [
  {
    fullName: 'Sarimova Gulsanam Bahodir qizi',
    passport: 'AE 1472926',
    facultyOrField: 'Iqtisodiyot',
    group: '201-IQT',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B1',
        score: '42 ball (Listening: 45, Reading: 44, Writing: 38, Speaking: 40)',
        certificateNumber: '25BBA1408315SG',
        issueDate: '2025-05-30',
        expiryDate: '2027-05-29',
      },
    ],
  },
  {
    fullName: 'Odiljonova Sevinch Oybek qizi',
    passport: 'AD 1044985',
    facultyOrField: 'Menejment',
    group: '202-MNJ',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '51 ball (Listening: 55, Reading: 50, Writing: 43, Speaking: 56)',
        certificateNumber: '24BBA1269576OS',
        issueDate: '2024-11-12',
        expiryDate: '2026-11-11',
      },
    ],
  },
  {
    fullName: 'Turdiyev Islombek Maxmud o‘g‘li',
    passport: 'AD 3669354',
    facultyOrField: 'Kompyuter injiniringi',
    group: '201-KI',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '51 ball (Listening: 50, Reading: 52, Writing: 51, Speaking: 51)',
        certificateNumber: '25BBA1373164TI',
        issueDate: '2025-05-02',
        expiryDate: '2027-05-01',
      },
    ],
  },
  {
    fullName: 'Azimjonova Zuhroxon To‘lqin qizi',
    passport: 'AD 2711108',
    facultyOrField: 'Iqtisodiyot',
    group: '202-IQT',
    certificates: [
      {
        language: 'Turk tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B1',
        score: '43 ball (Listening: 54, Reading: 50, Writing: 31, Speaking: 37)',
        certificateNumber: '25BBA1469509AZ',
        issueDate: '2025-06-20',
        expiryDate: '2027-06-19',
      },
    ],
  },
  {
    fullName: 'Foziljonov Ilxomjon Ibraxim o‘g‘li',
    passport: 'AD 5145371',
    facultyOrField: 'Kompyuter injiniringi',
    group: '202-KI',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '51 ball (Listening: 54, Reading: 57, Writing: 43, Speaking: 49)',
        certificateNumber: '24BBA1192685FI',
        issueDate: '2024-05-15',
        expiryDate: '2026-05-14',
      },
    ],
  },
  {
    fullName: 'Abdusaliyev Abbos Erkin o‘g‘li',
    passport: '53108075660018',
    facultyOrField: 'Sun’iy intellekt',
    group: '201-SI',
    certificates: [
      {
        language: 'Matematika (Milliy sertifikat)',
        certificateType: 'Umumta’lim fani sertifikati',
        level: 'C (B2 ekvivalent)',
        score: '48.02 ball (73.88% - Algebra: 24.01, Geometriya: 24.01)',
        certificateNumber: 'UZ25 409355',
        issueDate: '2025-06-04',
        expiryDate: '2028-06-03',
      },
    ],
  },
  {
    fullName: 'Bosimova Nilufar Azimjon qizi',
    passport: 'AD 1035254',
    facultyOrField: 'Menejment',
    group: '201-MNJ',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '51 ball (Listening: 54, Reading: 52, Writing: 46, Speaking: 51)',
        certificateNumber: '25BBA1470224BN',
        issueDate: '2025-06-20',
        expiryDate: '2027-06-19',
      },
    ],
  },
  {
    fullName: 'Ismoilova Intizor Mansurbek qizi',
    passport: 'AD 2794890',
    facultyOrField: 'Iqtisodiyot',
    group: '203-IQT',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '54 ball (Listening: 62, Reading: 62, Writing: 52, Speaking: 39)',
        certificateNumber: '25BBA1508370II',
        issueDate: '2025-10-07',
        expiryDate: '2027-10-06',
      },
    ],
  },
  {
    fullName: 'Abdumo‘minova Xurshida O‘ktamovna',
    passport: 'AE 1300687',
    facultyOrField: 'Biotexnologiya',
    group: '201-BTX',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B1',
        score: '45 ball (Listening: 46, Reading: 47, Writing: 44, Speaking: 42)',
        certificateNumber: '25BBA1407863AX',
        issueDate: '2025-05-30',
        expiryDate: '2027-05-29',
      },
    ],
  },
  {
    fullName: 'Obitov Alibek Aziz o‘g‘li',
    passport: 'AD 2616809',
    facultyOrField: 'Kompyuter injiniringi',
    group: '203-KI',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '51 ball (Listening: 54, Reading: 53, Writing: 45, Speaking: 51)',
        certificateNumber: '25BBA1470693OA',
        issueDate: '2025-06-20',
        expiryDate: '2027-06-19',
      },
    ],
  },
  {
    fullName: 'Imomkulov Samandar',
    passport: 'AD 1572753',
    facultyOrField: 'Kompyuter injiniringi',
    group: '204-KI',
    certificates: [
      {
        language: 'Koreys tili',
        certificateType: 'TOPIK (TOPIK I)',
        level: '2-gup (B1)',
        score: '178 / 200 ball (Listening: 96, Reading: 82)',
        certificateNumber: '4133-9567-5702-6087',
        issueDate: '2024-04-14',
        expiryDate: '2026-05-29',
      },
      {
        language: 'Ingliz tili',
        certificateType: 'IELTS ACADEMIC',
        level: 'B2',
        score: '5.5 Band (Listening: 5.0, Reading: 5.5, Writing: 5.5, Speaking: 5.0)',
        certificateNumber: '24UZ025706IMOS004A',
        issueDate: '2024-10-01',
        expiryDate: '2026-09-19',
      },
    ],
  },
  {
    fullName: 'Xujaqulov Jasur Botirovich',
    passport: 'AD 8607300',
    facultyOrField: 'Kimyo muhandisligi',
    group: '201-KM',
    certificates: [
      {
        language: 'Turk tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '57 ball (Listening: 65, Reading: 70, Writing: 42, Speaking: 50)',
        certificateNumber: '25BBA1459462XJ',
        issueDate: '2025-06-20',
        expiryDate: '2027-06-19',
      },
    ],
  },
  {
    fullName: 'Odiljonov Doniyor Abdullajon o‘g‘li',
    passport: 'AD 2121195',
    facultyOrField: 'Kompyuter injiniringi',
    group: '201-KI',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '51 ball (Listening: 50, Reading: 56, Writing: 44, Speaking: 54)',
        certificateNumber: '25BBA1407744OD',
        issueDate: '2025-05-30',
        expiryDate: '2027-05-29',
      },
    ],
  },
  {
    fullName: 'Olimova Guli Bobomurod qizi',
    passport: 'AD 1979791',
    facultyOrField: 'Iqtisodiyot',
    group: '201-IQT',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '55 ball (Listening: 56, Reading: 61, Writing: 53, Speaking: 50)',
        certificateNumber: '25BBA1373105OG',
        issueDate: '2025-05-02',
        expiryDate: '2027-05-01',
      },
    ],
  },
  {
    fullName: 'Ravshanova Hosila',
    passport: 'AD 5283232',
    facultyOrField: 'Menejment',
    group: '202-MNJ',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'IELTS ACADEMIC',
        level: 'B1',
        score: '5.0 Band (Listening: 5.0, Reading: 5.0, Writing: 5.5, Speaking: 5.0)',
        certificateNumber: '23UZ018820RAVH020A',
        issueDate: '2024-03-19',
        expiryDate: '2026-03-07',
      },
    ],
  },
  {
    fullName: 'Marajabova Sevinch Ikrom qizi',
    passport: 'AD 3670179',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    group: '201-OOT',
    certificates: [
      {
        language: 'Turk tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B2',
        score: '51 ball (Listening: 53, Reading: 57, Writing: 38, Speaking: 54)',
        certificateNumber: '25BBA1373812MS',
        issueDate: '2025-05-02',
        expiryDate: '2027-05-01',
      },
    ],
  },
  {
    fullName: 'Alimqulov Qodirbek Marufqul o‘g‘li',
    passport: 'AD 2530410',
    facultyOrField: 'Kompyuter injiniringi',
    group: '202-KI',
    certificates: [
      {
        language: 'Ingliz tili',
        certificateType: 'CEFR / Milliy sertifikat',
        level: 'B1',
        score: '39 ball (Listening: 39, Reading: 46, Writing: 30, Speaking: 39)',
        certificateNumber: '24BBA1220213AQ',
        issueDate: '2024-06-20',
        expiryDate: '2026-06-19',
      },
    ],
  },
];

async function runImportBakalavr() {
  console.log('====================================================');
  console.log('2-KURS BAKALAVRIAT TALABALARI VA TIL SERTIFIKATLARINI KIRITISH');
  console.log('====================================================');

  const usersSnap = await getDocs(collection(db, 'users'));
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

  const defaultPassword = 'Talaba2024!';
  let createdUsersCount = 0;
  let createdStudentsCount = 0;
  let createdCertsCount = 0;

  for (const item of BAKALAVR_2KURS_LIST) {
    const cleanedName = cleanStr(item.fullName);
    let student = studentByNameMap.get(cleanedName);

    // If student doesn't exist, create user account & student profile
    if (!student) {
      const digitsFromPassport = item.passport.replace(/\D/g, '').padEnd(7, '0').slice(-7);
      const generatedPhone = `+99893${digitsFromPassport}`;

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
          level: 'bakalavr',
        },
      };

      const studentDoc = {
        id: studentRef.id,
        userId: userRef.id,
        fullName: item.fullName,
        phone: generatedPhone,
        course: 2,
        group: item.group,
        facultyOrField: item.facultyOrField,
        supervisorId: '',
        customSupervisorName: 'Kafedra mudiri',
        isDeleted: false,
        passport: item.passport,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await setDoc(userRef, userDoc);
      await setDoc(studentRef, studentDoc);

      student = studentDoc;
      studentByNameMap.set(cleanedName, student);
      createdUsersCount++;
      createdStudentsCount++;
      console.log(`[+] Yangi 2-kurs talaba: ${item.fullName} (${generatedPhone}) - ${item.facultyOrField}`);
    } else {
      console.log(`[=] Talaba allaqachon mavjud: ${item.fullName}`);
    }

    // Now insert each certificate
    for (const cert of item.certificates) {
      const cleanedCertNum = cleanStr(cert.certificateNumber);
      if (existingCertNumbers.has(cleanedCertNum)) {
        console.log(`[!] Sertifikat ${cert.certificateNumber} allaqachon mavjud, o'tkazildi.`);
        continue;
      }

      const certRef = doc(collection(db, 'languageCertificates'));
      const nowIso = new Date().toISOString();

      const rawCertData: any = {
        id: certRef.id,
        studentId: student.id,
        studentName: student.fullName,
        studentPhone: student.phone,
        language: cert.language,
        certificateType: cert.certificateType,
        level: cert.level,
        score: cert.score,
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        status: 'Tasdiqlangan',
        isDeleted: false,
        verified: true,
        reviewNotes: `2-kurs bakalavriat iqtidorli talabasi rasmiy sertifikati (ID: ${item.passport})`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Generate PDF dataURL with QR code so it can be previewed instantly
      let pdfDataUrl = '';
      try {
        pdfDataUrl = await generateLanguageCertificatePdfDataUrl(rawCertData);
      } catch (err) {
        console.warn('PDF generation error:', err);
      }

      const fileName = `Sertifikat_${student.fullName.replace(/\s+/g, '_')}_${cert.certificateNumber}.pdf`;

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
      console.log(`  [+] Sertifikat saqlandi: ${cert.language} (${cert.level}) - ${cert.certificateNumber}`);
    }
  }

  console.log('\n====================================================');
  console.log('2-KURS IMPORTI TO‘LIQ YAKUNLANDI!');
  console.log(`Yaratilgan 2-kurs talabalari: ${createdStudentsCount} ta`);
  console.log(`Kiritilgan yangi sertifikatlar: ${createdCertsCount} ta`);
  console.log(`Boshlang'ich parol: ${defaultPassword}`);
  console.log('====================================================');
}

runImportBakalavr()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Xatolik:', err);
    process.exit(1);
  });
