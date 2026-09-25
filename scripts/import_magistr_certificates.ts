import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };

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

interface RawMagistrCert {
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

const MAGISTR_CERTIFICATES: RawMagistrCert[] = [
  {
    fullName: 'Xaydarova Mahliyo Axmat qizi',
    passport: 'AD 3898992',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'C1',
    score: '67 ball (Listening: 75, Reading: 68, Writing: 59, Speaking: 64)',
    certificateNumber: '26BBA1826840XM',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Isroilova Mohina Abdushoxid qizi',
    passport: 'AE 4944569',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '44 ball (Listening: 57, Reading: 49, Writing: 33, Speaking: 37)',
    certificateNumber: '26BBA1644856IM',
    issueDate: '2024-03-13',
    expiryDate: '2028-03-12',
  },
  {
    fullName: 'Donabayeva Yulduz Zafarjon qizi',
    passport: 'AC 0467543',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '47 ball (Listening: 47, Reading: 57, Writing: 41, Speaking: 42)',
    certificateNumber: '26BBA1838054DY',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Turdiqulova Sitora Norqul qizi',
    passport: 'AC 2959732',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '51 ball (Listening: 59, Reading: 63, Writing: 45, Speaking: 38)',
    certificateNumber: '26BBA1838038TS',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Suyundikova Manzura Sobirjon qizi',
    passport: 'AD 0150207',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '41 ball (Listening: 53, Reading: 46, Writing: 31, Speaking: 33)',
    certificateNumber: '26BBA1644874SM',
    issueDate: '2024-03-13',
    expiryDate: '2028-03-12',
  },
  {
    fullName: 'Ro‘ziqulova Ziyoda Umidjon qizi',
    passport: 'AC 2676771',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '53 ball (Listening: 66, Reading: 59, Writing: 50, Speaking: 37)',
    certificateNumber: '26BBA1716757RZ',
    issueDate: '2024-05-12',
    expiryDate: '2028-05-11',
  },
  {
    fullName: 'Xudaykulova Nasiba Sherqo‘zi qizi',
    passport: 'AD 1038772',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '40 ball (Listening: 42, Reading: 47, Writing: 41, Speaking: 30)',
    certificateNumber: '26BBA1716604XN',
    issueDate: '2024-05-12',
    expiryDate: '2028-05-11',
  },
  {
    fullName: 'Umirqulova Diyora Erkin qizi',
    passport: 'AD 0605479',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '49 ball (Listening: 50, Reading: 57, Writing: 47, Speaking: 40)',
    certificateNumber: '26BBA1716833UD',
    issueDate: '2024-05-12',
    expiryDate: '2028-05-11',
  },
  {
    fullName: 'Karamov Eldor Alifboy o‘g‘li',
    passport: 'AB 6638897',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '41 ball (Listening: 46, Reading: 49, Writing: 33, Speaking: 37)',
    certificateNumber: '26BBA1612039KE',
    issueDate: '2024-02-02',
    expiryDate: '2028-02-01',
  },
  {
    fullName: 'Abdusattarova Madina Baxodir qizi',
    passport: 'AD 8554442',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '48 ball (Listening: 54, Reading: 48, Writing: 37, Speaking: 51)',
    certificateNumber: '26BBA1826619AM',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Egamberdiyev Doston Tolibjon o‘g‘li',
    passport: 'AD 1178296',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '53 ball (Listening: 56, Reading: 53, Writing: 47, Speaking: 56)',
    certificateNumber: '26BBA1699771ED',
    issueDate: '2024-05-12',
    expiryDate: '2028-05-11',
  },
  {
    fullName: 'Abduraimova Nilufar Bahodir qizi',
    passport: 'AC 1616901',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '39 ball (Listening: 46, Reading: 59, Writing: 25, Speaking: 27)',
    certificateNumber: '26BBA1744741AN',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Boyzoqova Nilufar Abduhamid qizi',
    passport: 'AE 3652395',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '44 ball (Listening: 44, Reading: 42, Writing: 41, Speaking: 49)',
    certificateNumber: '26BBA1758955BN',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Sodiqova Sayyoraxon G‘ayratjon qizi',
    passport: 'AD 0909575',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '39 ball (Listening: 37, Reading: 47, Writing: 35, Speaking: 38)',
    certificateNumber: '26BBA1593764SS',
    issueDate: '2024-01-15',
    expiryDate: '2028-01-14',
  },
  {
    fullName: 'Obidova Marjona Mavlonqul qizi',
    passport: 'AE 3543631',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '44 ball (Listening: 56, Reading: 51, Writing: 37, Speaking: 30)',
    certificateNumber: '26BBA1818368OM',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'G‘aybullayeva Nilufar Axmad qizi',
    passport: 'AD 1066616',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '40 ball (Listening: 42, Reading: 42, Writing: 40, Speaking: 37)',
    certificateNumber: '26BBA1645220GN',
    issueDate: '2024-03-13',
    expiryDate: '2028-03-12',
  },
  {
    fullName: 'Abduvaliyeva Hilola Rahim qizi',
    passport: 'AC 3105098',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '45 ball (Listening: 51, Reading: 43, Writing: 48, Speaking: 38)',
    certificateNumber: '26BBA1616041AH',
    issueDate: '2024-02-02',
    expiryDate: '2028-02-01',
  },
  {
    fullName: 'Yo‘ldosheva Muqaddas Shovkat qizi',
    passport: 'AC 0954294',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '38 ball (Listening: 40, Reading: 47, Writing: 35, Speaking: 30)',
    certificateNumber: '26BBA1644936YM',
    issueDate: '2024-03-13',
    expiryDate: '2028-03-12',
  },
  {
    fullName: 'Mexmonaliyev Diyorbek Ikromjon o‘g‘li',
    passport: 'AC 2680353',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '45 ball (Listening: 42, Reading: 49, Writing: 35, Speaking: 52)',
    certificateNumber: '26BBA1595030MD',
    issueDate: '2024-01-15',
    expiryDate: '2028-01-14',
  },
  {
    fullName: 'Turdiboyeva Ro‘zigul Muhammad qizi',
    passport: 'AB 8164123',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '43 ball (Listening: 54, Reading: 48, Writing: 33, Speaking: 37)',
    certificateNumber: '26BBA1835947TR',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Ibrohimova Zamira Xolmurod qizi',
    passport: 'AD 1133958',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '43 ball (Listening: 47, Reading: 50, Writing: 38, Speaking: 38)',
    certificateNumber: '26BBA1716839IZ',
    issueDate: '2024-05-12',
    expiryDate: '2028-05-11',
  },
  {
    fullName: 'Ataniyazova Aynura Maxsetovna',
    passport: 'AE 2503226',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '41 ball (Listening: 50, Reading: 56, Writing: 28, Speaking: 29)',
    certificateNumber: '26BBA1820595AA',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Muhammadiyeva Muborak Sulaymonqul qizi',
    passport: 'AD 6708748',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '38 ball (Listening: 49, Reading: 33, Writing: 33, Speaking: 38)',
    certificateNumber: '26BBA1668612MM',
    issueDate: '2024-04-16',
    expiryDate: '2028-04-15',
  },
  {
    fullName: 'Mardanova O‘g‘iloy Karimovna',
    passport: 'AB 6416321',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '39 ball (Listening: 46, Reading: 51, Writing: 33, Speaking: 24)',
    certificateNumber: '26BBA1593752MO',
    issueDate: '2024-01-15',
    expiryDate: '2028-01-14',
  },
  {
    fullName: 'Anvar Shukurov',
    passport: 'AD 6472773',
    language: 'Arab tili',
    certificateType: 'Attanal Al-Arabi',
    level: 'B1',
    score: '56.90 / 150 ball [37.93%]',
    certificateNumber: '1162057',
    issueDate: '2024-07-07',
    expiryDate: '2029-07-04',
  },
  {
    fullName: 'Xanturayeva O‘g‘iloy Turdimurod qizi',
    passport: 'AE 6772523',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '41 ball (Listening: 41, Reading: 43, Writing: 43, Speaking: 38)',
    certificateNumber: '26BBA1669875XO',
    issueDate: '2024-04-16',
    expiryDate: '2028-04-15',
  },
  {
    fullName: 'Izbosarov G‘ayrat Tirkash o‘g‘li',
    passport: 'AB 8169880',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '39 ball (Listening: 47, Reading: 36, Writing: 41, Speaking: 32)',
    certificateNumber: '26BBA1594193IG',
    issueDate: '2024-01-15',
    expiryDate: '2028-01-14',
  },
  {
    fullName: 'Tagirova Diyora Murodjon qizi',
    passport: 'AD 0318821',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '42 ball (Listening: 48, Reading: 48, Writing: 27, Speaking: 43)',
    certificateNumber: '25BBA1469858TD',
    issueDate: '2023-06-20',
    expiryDate: '2027-06-19',
  },
  {
    fullName: 'Ochilova Marjona Fayzulla qizi',
    passport: 'AC 1680560',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '42 ball (Listening: 38, Reading: 41, Writing: 52, Speaking: 37)',
    certificateNumber: '25BBA1315436OM',
    issueDate: '2023-01-29',
    expiryDate: '2027-01-28',
  },
  {
    fullName: 'Shermatov Bahrom Ilhomjon o‘g‘li',
    passport: 'AB 9379024',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '49 ball (Listening: 62, Reading: 68, Writing: 37, Speaking: 27)',
    certificateNumber: '26BBA1826817SB',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Karimqulova Marg‘uba Xidirqul qizi',
    passport: 'AC 1781841',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '47 ball (Listening: 58, Reading: 48, Writing: 43, Speaking: 38)',
    certificateNumber: '25BBA1469883KM',
    issueDate: '2023-06-20',
    expiryDate: '2027-06-19',
  },
  {
    fullName: 'Tojiqulova Aziza Mamadzokir qizi',
    passport: 'AD 8822802',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '41 ball (Listening: 51, Reading: 39, Writing: 35, Speaking: 38)',
    certificateNumber: '25BBA1532196MA',
    issueDate: '2023-11-13',
    expiryDate: '2027-11-12',
  },
  {
    fullName: 'Alimova Nigora Abdusattor qizi',
    passport: 'AD 1633649',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '45 ball (Listening: 52, Reading: 47, Writing: 38, Speaking: 42)',
    certificateNumber: '26BBA1593760BN',
    issueDate: '2024-01-15',
    expiryDate: '2028-01-14',
  },
  {
    fullName: 'Haydarova Feruza Sevdiyor qizi',
    passport: 'AD 9717515',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '42 ball (Listening: 47, Reading: 48, Writing: 35, Speaking: 38)',
    certificateNumber: '26BBA1826710HF',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Suyarkulov Sardor Baxtiyor o‘g‘li',
    passport: 'AD 0412971',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '51 ball (Listening: 54, Reading: 55, Writing: 51, Speaking: 42)',
    certificateNumber: '26BBA1692580SS',
    issueDate: '2024-05-12',
    expiryDate: '2028-05-11',
  },
  {
    fullName: 'Ibrohimova Nigora Hasanboy qizi',
    passport: 'AD 1129446',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '49 ball (Listening: 65, Reading: 48, Writing: 45, Speaking: 38)',
    certificateNumber: '26BBA1711571IN',
    issueDate: '2024-05-12',
    expiryDate: '2028-05-11',
  },
  {
    fullName: 'Imomnazarova Feruza G‘ulom qizi',
    passport: 'AC 2962059',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '45 ball (Listening: 53, Reading: 55, Writing: 38, Speaking: 32)',
    certificateNumber: '26BBA1838253IF',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Sayduvova Dilshoda Ikrom qizi',
    passport: 'AE 4187285',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '40 ball (Listening: 37, Reading: 39, Writing: 50, Speaking: 32)',
    certificateNumber: '26BBA1644950SD',
    issueDate: '2024-03-13',
    expiryDate: '2028-03-12',
  },
  {
    fullName: 'Turatova Dilnura Kattabek qizi',
    passport: 'AD 0122090',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '48 ball (Listening: 60, Reading: 51, Writing: 45, Speaking: 37)',
    certificateNumber: '26BBA1593837TD',
    issueDate: '2024-01-15',
    expiryDate: '2028-01-14',
  },
  {
    fullName: 'Kakharov Oybek',
    passport: 'AB 7448503',
    language: 'Ingliz tili',
    certificateType: 'IELTS',
    level: 'B1',
    score: '5.0 Band (Listening: 5.5, Reading: 4.0, Writing: 5.0, Speaking: 5.0)',
    certificateNumber: '26UZ503516KAKO025A',
    issueDate: '2024-05-31',
    expiryDate: '2026-05-30',
  },
  {
    fullName: 'Quranboyeva Rayhona Temurbek qizi',
    passport: 'AC 0488329',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B2',
    score: '53 ball (Listening: 58, Reading: 64, Writing: 45, Speaking: 46)',
    certificateNumber: '26BBA1807236QR',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Qo‘chqorova Dildora Rasul qizi',
    passport: 'AB 4072850',
    language: 'Ingliz tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '46 ball (Listening: 51, Reading: 43, Writing: 45, Speaking: 46)',
    certificateNumber: '25BBA1344105QD',
    issueDate: '2023-03-19',
    expiryDate: '2027-03-18',
  },
  {
    fullName: 'Xujabekova Komila Ilhom qizi',
    passport: 'AD 5249849',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '47 ball (Listening: 63, Reading: 52, Writing: 22, Speaking: 49)',
    certificateNumber: '25BBA1469531XK',
    issueDate: '2023-06-20',
    expiryDate: '2027-06-19',
  },
  {
    fullName: 'Rahimov Jamshidshox Rahimovich',
    passport: 'AB 5390625',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '42 ball (Listening: 54, Reading: 52, Writing: 28, Speaking: 35)',
    certificateNumber: '26BBA1838195RJ',
    issueDate: '2024-06-18',
    expiryDate: '2028-06-17',
  },
  {
    fullName: 'Abduraqibova Malohat Alisher qizi',
    passport: 'AC 2182606',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '45 ball (Listening: 52, Reading: 53, Writing: 38, Speaking: 37)',
    certificateNumber: '26BBA1668636AM',
    issueDate: '2024-04-16',
    expiryDate: '2028-04-15',
  },
  {
    fullName: 'Toshpo‘latov Azizbek Shuhrat o‘g‘li',
    passport: 'AD 0795839',
    language: 'Turk tili',
    certificateType: 'CEFR / Milliy sertifikat',
    level: 'B1',
    score: '49 ball (Listening: 54, Reading: 53, Writing: 45, Speaking: 43)',
    certificateNumber: '26BBA1668661TA',
    issueDate: '2024-04-16',
    expiryDate: '2028-04-15',
  },
];

async function runImport() {
  console.log('====================================================');
  console.log('MAGISTRATURA 1-KURS TALABALARINI VA TIL SERTIFIKATLARINI KIRITISH');
  console.log('====================================================');

  // 1. Fetch existing users & students to prevent duplicates
  const usersSnap = await getDocs(collection(db, 'users'));
  const studentsSnap = await getDocs(collection(db, 'students'));
  const certsSnap = await getDocs(collection(db, 'languageCertificates'));

  const existingUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  const existingStudents = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  const existingCerts = certsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  console.log(`Bazada mavjud talabalar: ${existingStudents.length} ta, sertifikatlar: ${existingCerts.length} ta`);

  const studentByNameMap = new Map<string, any>();
  for (const s of existingStudents) {
    studentByNameMap.set(cleanStr(s.fullName), s);
  }

  const existingCertNumbers = new Set<string>();
  for (const c of existingCerts) {
    if (c.certificateNumber) existingCertNumbers.add(cleanStr(c.certificateNumber));
  }

  const defaultPassword = 'Magistr2024!';
  let createdUsersCount = 0;
  let createdStudentsCount = 0;
  let createdCertsCount = 0;
  let phoneCounter = 90100; // Base for synthetic unique logins if not provided

  const resultsSummary: any[] = [];

  for (let i = 0; i < MAGISTR_CERTIFICATES.length; i++) {
    const item = MAGISTR_CERTIFICATES[i];
    const cleanedName = cleanStr(item.fullName);
    const cleanedCertNum = cleanStr(item.certificateNumber);

    let student = studentByNameMap.get(cleanedName);

    // If student doesn't exist, create user account & student profile
    if (!student) {
      phoneCounter++;
      // Form clean Uzbekistan phone number
      const digitsFromPassport = item.passport.replace(/\D/g, '').padEnd(7, '0').slice(0, 7);
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
          isMagistr: true,
        },
      };

      const studentDoc = {
        id: studentRef.id,
        userId: userRef.id,
        fullName: item.fullName,
        phone: generatedPhone,
        course: 1,
        group: '1-Magistratura',
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
      createdUsersCount++;
      createdStudentsCount++;
      console.log(`[+] Yangi talaba yaratildi: ${item.fullName} (${generatedPhone})`);
    } else {
      console.log(`[=] Talaba allaqachon mavjud: ${item.fullName}`);
    }

    // Check if certificate is already recorded
    if (existingCertNumbers.has(cleanedCertNum)) {
      console.log(`[!] Sertifikat ${item.certificateNumber} allaqachon mavjud, o'tkazildi.`);
      continue;
    }

    // Create LanguageCertificate document
    const certRef = doc(collection(db, 'languageCertificates'));
    const nowIso = new Date().toISOString();

    const certDoc = {
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
      reviewNotes: `Magistratura 1-kurs qabuli bo'yicha rasmiy tasdiqlangan (Passport: ${item.passport})`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await setDoc(certRef, certDoc);
    existingCertNumbers.add(cleanedCertNum);
    createdCertsCount++;

    resultsSummary.push({
      fullName: item.fullName,
      passport: item.passport,
      phone: student.phone,
      language: item.language,
      level: item.level,
      score: item.score,
      certificateNumber: item.certificateNumber,
      login: student.phone,
      password: defaultPassword,
    });
  }

  console.log('\n====================================================');
  console.log('IMPORT YAKUNLANDI!');
  console.log(`Yaratilgan yangi foydalanuvchilar: ${createdUsersCount} ta`);
  console.log(`Yaratilgan talabalar profili: ${createdStudentsCount} ta`);
  console.log(`Kiritilgan til sertifikatlari: ${createdCertsCount} ta`);
  console.log(`Boshlang'ich parol: ${defaultPassword}`);
  console.log('====================================================');
}

runImport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Importda xatolik:', err);
    process.exit(1);
  });
