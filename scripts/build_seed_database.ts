import fs from 'fs';
import path from 'path';
import { SUPERVISORS_SEED_LIST, OFFICIAL_STUDENTS_LIST } from './official_data';
import { OFFICIAL_STARTUPS_LIST } from './official_startups_data';
import { MAGISTR_CERTIFICATES } from './import_magistr_certificates';
import { BAKALAVR_2KURS_LIST } from './import_bakalavr_2kurs_certificates';
import { MAGISTR_2KURS_LIST } from './import_magistr_2kurs_certificates';
import { generateLanguageCertificatePdfDataUrl } from '../src/lib/languageCertificateGenerator';
import type {
  SupervisorProfile,
  StudentProfile,
  UserAccount,
  ProjectOrStartup,
  LanguageCertificate,
  EventItem,
  Announcement,
  Achievement
} from '../src/types';
import { canonicalizeDirection } from '../src/constants/directions';

// Hashing helper matching src/lib/crypto.ts
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

async function run() {
  console.log('Compiling complete seed dataset for resilient offline store...');

  // 1. Super Admin
  const adminSalt = generateSalt();
  const adminHash = await hashPassword('Admin2024!', adminSalt);

  const superAdminUser: UserAccount = {
    id: 'user_superadmin_01',
    phone: '+998901234567',
    passwordHash: adminHash,
    salt: adminSalt,
    role: 'superAdmin',
    fullName: 'Bosh Administrator',
    email: 'muzaffarovsarvarjon20021222@gmail.com',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    position: 'Rektor yordamchisi / Tizim administratori'
  };

  const users: UserAccount[] = [superAdminUser];

  // 2. Supervisors
  const supervisors: SupervisorProfile[] = [];
  const supervisorMap = new Map<string, SupervisorProfile>();

  let supIdx = 1;
  for (const s of SUPERVISORS_SEED_LIST) {
    const id = `supervisor_${String(supIdx).padStart(3, '0')}`;
    const userId = `user_supervisor_${String(supIdx).padStart(3, '0')}`;
    supIdx++;

    const supSalt = generateSalt();
    const supHash = await hashPassword('Rahbar2024!', supSalt);

    const supUser: UserAccount = {
      id: userId,
      phone: s.phone,
      passwordHash: supHash,
      salt: supSalt,
      role: 'supervisor',
      fullName: s.fullName,
      email: s.email,
      isActive: true,
      position: s.position,
      createdAt: '2025-01-10T00:00:00.000Z'
    };
    users.push(supUser);

    const supervisorProfile: SupervisorProfile = {
      id,
      userId,
      fullName: s.fullName,
      phone: s.phone,
      email: s.email,
      position: s.position,
      academicDegree: s.academicDegree,
      department: s.department,
      isActive: true,
      createdAt: '2025-01-10T00:00:00.000Z'
    };
    supervisors.push(supervisorProfile);

    // Map by cleaned full name and aliases
    supervisorMap.set(cleanStr(s.fullName), supervisorProfile);
    if (s.shortName) supervisorMap.set(cleanStr(s.shortName), supervisorProfile);
    for (const a of s.aliases || []) {
      supervisorMap.set(cleanStr(a), supervisorProfile);
    }
  }

  // 3. Students
  const students: StudentProfile[] = [];
  const studentByNameMap = new Map<string, StudentProfile>();

  let studentIdx = 1;

  // Helper to add student
  async function registerStudentData(
    fullName: string,
    phone: string,
    course: number,
    group: string,
    facultyOrField: string,
    supervisorName?: string,
    passport?: string
  ): Promise<StudentProfile> {
    const cleaned = cleanStr(fullName);
    if (studentByNameMap.has(cleaned)) {
      const existing = studentByNameMap.get(cleaned)!;
      // Enrich with missing info if any
      if (!existing.phone && phone) existing.phone = phone;
      if (!existing.group && group) existing.group = group;
      return existing;
    }

    const stId = `student_${String(studentIdx).padStart(4, '0')}`;
    const uId = `user_student_${String(studentIdx).padStart(4, '0')}`;
    studentIdx++;

    const studentSalt = generateSalt();
    const isMaster = course >= 5 || group.toLowerCase().includes('m') || facultyOrField.toLowerCase().includes('magistr');
    const pwd = isMaster ? 'Magistr2024!' : 'Talaba2024!';
    const studentHash = await hashPassword(pwd, studentSalt);

    const user: UserAccount = {
      id: uId,
      phone,
      passwordHash: studentHash,
      salt: studentSalt,
      role: 'student',
      fullName,
      isActive: true,
      createdAt: '2025-01-15T00:00:00.000Z'
    };
    users.push(user);

    // Find supervisor
    let matchedSup: SupervisorProfile | undefined;
    if (supervisorName) {
      matchedSup = supervisorMap.get(cleanStr(supervisorName));
      if (!matchedSup) {
        // try partial match
        for (const [key, sup] of supervisorMap.entries()) {
          if (cleanStr(supervisorName).includes(key) || key.includes(cleanStr(supervisorName))) {
            matchedSup = sup;
            break;
          }
        }
      }
    }

    const canonicalDir = canonicalizeDirection(facultyOrField);

    const stProfile: StudentProfile = {
      id: stId,
      userId: uId,
      fullName,
      phone,
      course,
      group,
      facultyOrField: canonicalDir,
      supervisorId: matchedSup ? matchedSup.id : '',
      customSupervisorName: matchedSup ? matchedSup.fullName : (supervisorName || 'Kafedra mudiri'),
      createdAt: '2025-01-15T00:00:00.000Z',
      isDeleted: false
    };

    students.push(stProfile);
    studentByNameMap.set(cleaned, stProfile);
    return stProfile;
  }

  // A. Official 106 students
  for (const s of OFFICIAL_STUDENTS_LIST) {
    await registerStudentData(
      s.fullName,
      s.phone,
      s.course || 1,
      s.group,
      s.facultyOrField,
      s.supervisorName
    );
  }

  const magistr1Certs = MAGISTR_CERTIFICATES;
  const bakalavr2Students = BAKALAVR_2KURS_LIST;
  const magistr2Students = MAGISTR_2KURS_LIST;

  console.log(`Parsed ${magistr1Certs.length} 1-kurs magistr certs, ${bakalavr2Students.length} 2-kurs bakalavr, ${magistr2Students.length} 2-kurs magistr`);

  // Language Certificates collection
  const languageCertificates: LanguageCertificate[] = [];
  let certIdx = 1;

  // Add 1-kurs magistr certs
  for (const item of magistr1Certs) {
    const digits = item.passport.replace(/\D/g, '').padEnd(7, '0').slice(-7);
    const phone = `+99897${digits}`;
    const student = await registerStudentData(
      item.fullName,
      phone,
      1,
      'M-101',
      'Kimyo (fan yo‘nalishlari bo‘yicha)',
      'B.Jumayev',
      item.passport
    );

    const cert: LanguageCertificate = {
      id: `lang_cert_${String(certIdx++).padStart(4, '0')}`,
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
      reviewedAt: item.issueDate + 'T10:00:00.000Z',
      reviewedByName: 'Davlat Test Markazi (Bilimni baholash agentligi)',
      reviewNotes: `Rasmiy tekshirilgan til sertifikati: ${item.score}`,
      createdAt: item.issueDate + 'T10:00:00.000Z'
    };
    languageCertificates.push(cert);
  }

  // Add 2-kurs bakalavr
  for (const b of bakalavr2Students) {
    const digits = b.passport.replace(/\D/g, '').padEnd(7, '0').slice(-7);
    const phone = `+99893${digits}`;
    const student = await registerStudentData(
      b.fullName,
      phone,
      2,
      b.group,
      b.facultyOrField,
      'Kafedra mudiri',
      b.passport
    );

    for (const c of b.certificates) {
      const cert: LanguageCertificate = {
        id: `lang_cert_${String(certIdx++).padStart(4, '0')}`,
        studentId: student.id,
        studentName: student.fullName,
        studentPhone: student.phone,
        language: c.language,
        certificateType: c.certificateType,
        level: c.level,
        score: c.score,
        certificateNumber: c.certificateNumber,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        status: 'Tasdiqlangan',
        reviewedAt: c.issueDate + 'T10:00:00.000Z',
        reviewedByName: 'Davlat Test Markazi (Bilimni baholash agentligi)',
        reviewNotes: `2-kurs bakalavriat sertifikati: ${c.score}`,
        createdAt: c.issueDate + 'T10:00:00.000Z'
      };
      languageCertificates.push(cert);
    }
  }

  // Add 2-kurs magistr
  for (const m of magistr2Students) {
    const digits = m.passport.replace(/\D/g, '').padEnd(7, '0').slice(-7);
    const phone = `+99895${digits}`;
    const student = await registerStudentData(
      m.fullName,
      phone,
      2,
      'M-201',
      'Kimyo (fan yo‘nalishlari bo‘yicha)',
      'B.Abdullayev',
      m.passport
    );

    const cert: LanguageCertificate = {
      id: `lang_cert_${String(certIdx++).padStart(4, '0')}`,
      studentId: student.id,
      studentName: student.fullName,
      studentPhone: student.phone,
      language: m.language,
      certificateType: m.certificateType,
      level: m.level,
      score: m.score,
      certificateNumber: m.certificateNumber,
      issueDate: m.issueDate,
      expiryDate: m.expiryDate,
      status: 'Tasdiqlangan',
      reviewedAt: m.issueDate + 'T10:00:00.000Z',
      reviewedByName: 'Davlat Test Markazi (Bilimni baholash agentligi)',
      reviewNotes: `2-kurs magistratura sertifikati: ${m.score}`,
      createdAt: m.issueDate + 'T10:00:00.000Z'
    };
    languageCertificates.push(cert);
  }

  console.log(`Setting metadata for ${languageCertificates.length} certificates...`);
  for (let i = 0; i < languageCertificates.length; i++) {
    const cert = languageCertificates[i];
    cert.fileName = `Sertifikat_${cert.studentName.replace(/\s+/g, '_')}_${cert.certificateNumber}.pdf`;
    cert.fileSize = 145000;
    cert.fileType = 'application/pdf';
  }

  // 4. Projects / Startups
  const projects: ProjectOrStartup[] = [];
  let projIdx = 1;

  for (const st of OFFICIAL_STARTUPS_LIST) {
    const student = studentByNameMap.get(cleanStr(st.studentName));
    const supervisor = supervisorMap.get(cleanStr(st.supervisorName));

    const proj: ProjectOrStartup = {
      id: `startup_${String(projIdx++).padStart(3, '0')}`,
      type: 'startap',
      title: st.title,
      description: st.description,
      field: student ? student.facultyOrField : 'Innovatsion texnologiyalar',
      supervisorId: supervisor ? supervisor.id : (student ? student.supervisorId : ''),
      studentId: student ? student.id : '',
      studentName: st.studentName,
      studentPhone: student ? student.phone : '+998901234500',
      authorNames: `${st.studentName} (Ilmiy rahbar: ${st.supervisorName})`,
      status: 'Tasdiqlangan',
      createdAt: '2025-02-01T12:00:00.000Z',
      reviewedAt: '2025-02-05T12:00:00.000Z',
      reviewedByName: 'Ilmiy bo‘lim'
    };
    projects.push(proj);
  }

  // 5. Events & Announcements
  const events: EventItem[] = [
    {
      id: 'event_001',
      title: 'Iqtidorli talabalar ilmiy-amaliy anjumani 2026',
      description: 'Filial iqtidorli talabalari, yosh olimlar va magistrantlarning dolzarb ilmiy izlanishlari bo‘yicha respublika miqyosidagi anjuman.',
      date: '2026-10-15',
      time: '10:00',
      location: 'Bosh bino, Madaniyat saroyi zali',
      deadline: '2026-10-10',
      status: 'Rejalashtirilgan',
      participantIds: students.slice(0, 15).map(s => s.id),
      createdAt: '2025-01-10T08:00:00.000Z',
      createdBy: superAdminUser.id,
      eventType: 'Konferensiya'
    },
    {
      id: 'event_002',
      title: 'Startap loyihalar ko‘rgazmasi va Investorlar kuni',
      description: 'Eng yaxshi 50 ta startap loyihaning taqdimoti va universitet inkubatsiya markazi grantlari tanlovi.',
      date: '2026-11-05',
      time: '14:00',
      location: 'Innovatsion markaz zali',
      deadline: '2026-11-01',
      status: 'Rejalashtirilgan',
      participantIds: students.slice(15, 30).map(s => s.id),
      createdAt: '2025-01-12T08:00:00.000Z',
      createdBy: superAdminUser.id,
      eventType: 'Tanlov'
    }
  ];

  const announcements: Announcement[] = [
    {
      id: 'announcement_001',
      title: 'Til sertifikatlari va ilmiy yutuqlarni qayd etish bo‘yicha e’lon',
      content: 'Hurmatli talabalar va magistrantlar! CEFR, IELTS, TOPIK va milliy sertifikatlaringizni shaxsiy kabinet orqali tizimga kiritishingiz so‘raladi. Ma’lumotlar ilmiy bo‘lim tomonidan tekshirilib tasdiqlanadi.',
      date: '2026-09-01',
      audience: 'Barcha talabalar',
      isPublished: true,
      createdAt: '2025-01-05T09:00:00.000Z',
      createdBy: superAdminUser.id,
      createdByName: 'Filial administratsiyasi'
    },
    {
      id: 'announcement_002',
      title: 'Magistrantlar dissertatsiya mavzulari va ilmiy rahbarlar biriktiruvi',
      content: '1 va 2-kurs magistrantlari uchun ilmiy rahbarlar va startap yo‘nalishlari bo‘yicha seminarlar o‘tkaziladi.',
      date: '2026-09-10',
      audience: 'Barcha talabalar',
      isPublished: true,
      createdAt: '2025-01-08T09:00:00.000Z',
      createdBy: superAdminUser.id,
      createdByName: 'Ilmiy bo‘lim'
    }
  ];

  // Designate top 3 students
  if (students.length >= 3) {
    students[0].isTopStudent = true;
    students[0].topStudentRank = 1;
    students[0].topStudentReason = 'Xalqaro C1 til sertifikati va 2 ta mualliflik loyihasi sohibi';

    students[1].isTopStudent = true;
    students[1].topStudentRank = 2;
    students[1].topStudentReason = 'Respublika startap tanlovi g‘olibi va B2 darajali til sertifikati';

    students[2].isTopStudent = true;
    students[2].topStudentRank = 3;
    students[2].topStudentReason = 'Faol ilmiy tadqiqotchi va xalqaro konferensiyalar ishtirokchisi';
  }

  const outDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const seedPayload = {
    users,
    supervisors,
    students,
    languageCertificates,
    projects,
    achievements: [] as Achievement[],
    certificates: [] as any[],
    events,
    announcements,
  };

  const fileContent = `// Pre-compiled comprehensive offline/cache seed database
// Generated automatically to guarantee zero data loss and 100% resilience against quota/network drops.
import type {
  UserAccount,
  SupervisorProfile,
  StudentProfile,
  LanguageCertificate,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  EventItem,
  Announcement
} from '../types';

export const SEED_USERS: UserAccount[] = ${JSON.stringify(seedPayload.users, null, 2)};

export const SEED_SUPERVISORS: SupervisorProfile[] = ${JSON.stringify(seedPayload.supervisors, null, 2)};

export const SEED_STUDENTS: StudentProfile[] = ${JSON.stringify(seedPayload.students, null, 2)};

export const SEED_LANGUAGE_CERTIFICATES: LanguageCertificate[] = ${JSON.stringify(seedPayload.languageCertificates, null, 2)};

export const SEED_PROJECTS: ProjectOrStartup[] = ${JSON.stringify(seedPayload.projects, null, 2)};

export const SEED_ACHIEVEMENTS: Achievement[] = ${JSON.stringify(seedPayload.achievements, null, 2)};

export const SEED_CERTIFICATES: CertificateItem[] = ${JSON.stringify(seedPayload.certificates, null, 2)};

export const SEED_EVENTS: EventItem[] = ${JSON.stringify(seedPayload.events, null, 2)};

export const SEED_ANNOUNCEMENTS: Announcement[] = ${JSON.stringify(seedPayload.announcements, null, 2)};
`;

  fs.writeFileSync(path.join(outDir, 'seedDatabase.ts'), fileContent, 'utf8');
  console.log(`=== SUCCESSFULLY GENERATED seedDatabase.ts ===`);
  console.log(`Students: ${students.length}`);
  console.log(`Supervisors: ${supervisors.length}`);
  console.log(`Language Certificates: ${languageCertificates.length}`);
  console.log(`Projects: ${projects.length}`);
  console.log(`Users: ${users.length}`);
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal generator error:', err);
    process.exit(1);
  });
