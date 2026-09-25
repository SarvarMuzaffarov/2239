import * as XLSX from 'xlsx';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { canonicalizeDirection, OFFICIAL_DIRECTIONS } from '../constants/directions';
import type {
  StudentProfile,
  SupervisorProfile,
  EventItem,
  EventRegistration,
  ProjectOrStartup,
  Achievement,
  CertificateItem,
  LanguageCertificate,
  AuditLog,
} from '../types';

/**
 * Exports all students to an Excel (.xlsx) file on demand.
 * Fetches fresh students from Firestore only upon clicking.
 */
export async function exportStudentsToExcel(supervisors: SupervisorProfile[] = []): Promise<void> {
  const snap = await getDocs(collection(db, 'students'));
  const supervisorMap = new Map<string, string>();
  supervisors.forEach(s => supervisorMap.set(s.id, s.fullName));

  const rows = snap.docs.map((docSnap, index) => {
    const data = docSnap.data() as StudentProfile;
    const supName =
      (data.supervisorId ? supervisorMap.get(data.supervisorId) : '') ||
      data.customSupervisorName ||
      'Biriktirilmagan';

    return {
      '№': index + 1,
      'F.I.Sh.': data.fullName || '—',
      'Telefon': data.phone || '—',
      'Ta’lim yo‘nalishi': canonicalizeDirection(data.facultyOrField) || data.facultyOrField || '—',
      'Kurs': data.course ? `${data.course}-kurs` : '—',
      'Guruh': data.group || '—',
      'Ilmiy rahbar': supName,
      'Ro‘yxatdan o‘tgan sana': data.createdAt ? new Date(data.createdAt).toLocaleDateString('uz-UZ') : '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 18 },
    { wch: 32 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Talabalar');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Iqtidorli_Talabalar_Royxati_${dateStr}.xlsx`);
}

/**
 * Exports participants of a specific event or all events to Excel
 */
export async function exportEventParticipantsToExcel(
  eventId?: string,
  eventTitle?: string,
  events: EventItem[] = [],
  supervisors: SupervisorProfile[] = []
): Promise<void> {
  const supervisorMap = new Map<string, string>();
  supervisors.forEach(s => supervisorMap.set(s.id, s.fullName));

  const eventMap = new Map<string, string>();
  events.forEach(e => eventMap.set(e.id, e.title));

  let q = query(collection(db, 'eventRegistrations'));
  if (eventId) {
    q = query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId));
  }

  const snap = await getDocs(q);
  const rows = snap.docs.map((docSnap, index) => {
    const r = docSnap.data() as EventRegistration;
    const evTitle = eventTitle || eventMap.get(r.eventId) || 'Tadbir';
    const supName =
      (r.supervisorId ? supervisorMap.get(r.supervisorId) : '') ||
      r.supervisorName ||
      '—';

    return {
      '№': index + 1,
      'F.I.Sh.': r.studentName || '—',
      'Telefon': r.studentPhone || '—',
      'Yo‘nalish': canonicalizeDirection(r.studentFaculty) || r.studentFaculty || '—',
      'Kurs': r.studentCourse ? `${r.studentCourse}-kurs` : '—',
      'Guruh': r.studentGroup || '—',
      'Ilmiy rahbar': supName,
      'Tadbir / Tanlov': evTitle,
      'Qatnashuvchi loyiha': r.projectTitle || 'Oddiy ishtirokchi',
      'Arizaning holati': r.applicationStatus || r.status || 'Kutilmoqda',
      'Ro‘yxatdan o‘tgan sana': r.registeredAt ? new Date(r.registeredAt).toLocaleString('uz-UZ') : '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 18 },
    { wch: 32 },
    { wch: 12 },
    { wch: 14 },
    { wch: 26 },
    { wch: 32 },
    { wch: 26 },
    { wch: 18 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ishtirokchilar');
  const safeName = (eventTitle || 'Barcha_Tadbirlar').replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Ishtirokchilar_${safeName}_${dateStr}.xlsx`);
}

/**
 * Exports competition applications with their projects and status to Excel
 */
export async function exportCompetitionApplicationsToExcel(
  events: EventItem[] = [],
  supervisors: SupervisorProfile[] = []
): Promise<void> {
  const supervisorMap = new Map<string, string>();
  supervisors.forEach(s => supervisorMap.set(s.id, s.fullName));

  const eventMap = new Map<string, string>();
  events.forEach(e => eventMap.set(e.id, e.title));

  const snap = await getDocs(collection(db, 'eventRegistrations'));
  const rows: any[] = [];
  let counter = 1;

  snap.docs.forEach(docSnap => {
    const r = docSnap.data() as EventRegistration;
    // Filter registrations that have an attached project or competition entry
    if (r.projectId || r.projectTitle) {
      const supName =
        (r.supervisorId ? supervisorMap.get(r.supervisorId) : '') ||
        r.supervisorName ||
        '—';

      rows.push({
        '№': counter++,
        'F.I.Sh.': r.studentName || '—',
        'Telefon': r.studentPhone || '—',
        'Ta’lim yo‘nalishi': canonicalizeDirection(r.studentFaculty) || r.studentFaculty || '—',
        'Tanlov / Tadbir': eventMap.get(r.eventId) || r.eventId,
        'Taqdim etilgan loyiha': r.projectTitle || '—',
        'Ilmiy rahbar': supName,
        'Ariza holati': r.applicationStatus || r.status || 'Kutilmoqda',
        'Rad etish sababi / Izoh': r.rejectionReason || r.reviewNotes || '—',
        'Ariza topshirilgan sana': r.registeredAt ? new Date(r.registeredAt).toLocaleString('uz-UZ') : '—',
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 18 },
    { wch: 32 },
    { wch: 32 },
    { wch: 30 },
    { wch: 26 },
    { wch: 18 },
    { wch: 35 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tanlov_Arizalari');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Tanlov_Arizalari_${dateStr}.xlsx`);
}

export interface DirectionExportRow {
  direction: string;
  totalStudents: number;
  activeStudents: number;
  projectsCount: number;
  startupsCount: number;
  achievementsCount: number;
  certificatesCount: number;
  eventParticipationsCount: number;
  competitionApplicationsCount: number;
}

/**
 * Exports complete Direction analytics and breakdown for all 18 official directions
 */
export function exportDirectionStatisticsToExcel(statsData: DirectionExportRow[]): void {
  const rows = statsData.map((item, index) => ({
    '№': index + 1,
    'Ta’lim yo‘nalishi': item.direction,
    'Jami talabalar': item.totalStudents,
    'Faol talabalar': item.activeStudents,
    'Loyihalar soni': item.projectsCount,
    'Startaplar soni': item.startupsCount,
    'Yutuqlar soni': item.achievementsCount,
    'Sertifikatlar soni': item.certificatesCount,
    'Tadbir ishtiroklari': item.eventParticipationsCount,
    'Tanlov arizalari': item.competitionApplicationsCount,
  }));

  // Append summary row at bottom
  const totals = statsData.reduce(
    (acc, curr) => {
      acc.totalStudents += curr.totalStudents;
      acc.activeStudents += curr.activeStudents;
      acc.projectsCount += curr.projectsCount;
      acc.startupsCount += curr.startupsCount;
      acc.achievementsCount += curr.achievementsCount;
      acc.certificatesCount += curr.certificatesCount;
      acc.eventParticipationsCount += curr.eventParticipationsCount;
      acc.competitionApplicationsCount += curr.competitionApplicationsCount;
      return acc;
    },
    {
      totalStudents: 0,
      activeStudents: 0,
      projectsCount: 0,
      startupsCount: 0,
      achievementsCount: 0,
      certificatesCount: 0,
      eventParticipationsCount: 0,
      competitionApplicationsCount: 0,
    }
  );

  rows.push({
    '№': '—' as any,
    'Ta’lim yo‘nalishi': 'JAMI (Barcha yo‘nalishlar)',
    'Jami talabalar': totals.totalStudents,
    'Faol talabalar': totals.activeStudents,
    'Loyihalar soni': totals.projectsCount,
    'Startaplar soni': totals.startupsCount,
    'Yutuqlar soni': totals.achievementsCount,
    'Sertifikatlar soni': totals.certificatesCount,
    'Tadbir ishtiroklari': totals.eventParticipationsCount,
    'Tanlov arizalari': totals.competitionApplicationsCount,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 38 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Yonalishlar_Statistikasi');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Yonalishlar_Statistikasi_${dateStr}.xlsx`);
}

/**
  * Exports all supervisors to an Excel (.xlsx) file
  */
export async function exportSupervisorsToExcel(supervisors: SupervisorProfile[]): Promise<void> {
  const rows = supervisors.map((s, idx) => ({
    '№': idx + 1,
    'F.I.Sh.': s.fullName || '—',
    'Telefon': s.phone || '—',
    'Email': s.email || '—',
    'Lavozimi': s.position || '—',
    'Ilmiy darajasi': s.academicDegree || '—',
    'Kafedra': s.department || '—',
    'Qo‘shilgan sana': s.createdAt ? new Date(s.createdAt).toLocaleDateString('uz-UZ') : '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 18 },
    { wch: 26 },
    { wch: 22 },
    { wch: 20 },
    { wch: 28 },
    { wch: 18 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ilmiy_Rahbarlar');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Ilmiy_Rahbarlar_${dateStr}.xlsx`);
}

/**
  * Exports projects & startups to an Excel (.xlsx) file
  */
export async function exportProjectsToExcel(
  projects: ProjectOrStartup[],
  type?: 'loyiha' | 'startap'
): Promise<void> {
  const filtered = type ? projects.filter(p => p.type === type) : projects;
  const rows = filtered.map((p, idx) => ({
    '№': idx + 1,
    'Turi': p.type === 'startap' ? 'Startap' : 'Ilmiy loyiha',
    'Nomi': p.title || '—',
    'Talaba (Muallif)': p.studentName || '—',
    'Yo‘nalish': p.field || '—',
    'Holati': p.status || 'Kutilmoqda',
    'Yaratilgan sana': p.createdAt ? new Date(p.createdAt).toLocaleDateString('uz-UZ') : '—',
    'Taqriz xulosasi': p.reviewNotes || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 34 },
    { wch: 28 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
  ];
  const workbook = XLSX.utils.book_new();
  const sheetTitle = type === 'startap' ? 'Startaplar' : type === 'loyiha' ? 'Loyihalar' : 'Loyihalar_va_Startaplar';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${sheetTitle}_${dateStr}.xlsx`);
}

/**
  * Exports achievements to an Excel (.xlsx) file
  */
export async function exportAchievementsToExcel(achievements: Achievement[]): Promise<void> {
  const rows = achievements.map((a, idx) => ({
    '№': idx + 1,
    'Talaba': a.studentName || '—',
    'Yutuq nomi': a.title || '—',
    'Kategoriya': a.category || '—',
    'Sana': a.date || '—',
    'Holati': a.status || 'Kutilmoqda',
    'Izoh/Tavsif': a.description || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 32 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 36 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Yutuqlar');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Yutuqlar_${dateStr}.xlsx`);
}

/**
  * Exports certificates to an Excel (.xlsx) file
  */
export async function exportCertificatesToExcel(certificates: CertificateItem[]): Promise<void> {
  const rows = certificates.map((c, idx) => ({
    '№': idx + 1,
    'Hujjat ID / Raqami': c.certificateNumber || '—',
    'Hujjat turi': c.documentType === 'diplom' ? 'Diplom' : 'Sertifikat',
    'Taqdirlangan talaba': c.studentName || '—',
    'Tadbir / Musobaqa': c.eventTitle || c.competitionName || '—',
    'Nominatsiya': c.nomination || '—',
    'Berilgan sana': c.issueDate || '—',
    'Holati': c.isRevoked ? 'BEKOR QILINGAN (REVOKED)' : c.status,
    'Tasdiqlovchi mas’ul': c.signatoryName || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 16 },
    { wch: 28 },
    { wch: 32 },
    { wch: 20 },
    { wch: 16 },
    { wch: 26 },
    { wch: 26 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sertifikatlar_Diplomlar');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Sertifikatlar_Diplomlar_${dateStr}.xlsx`);
}

/**
  * Exports audit logs to an Excel (.xlsx) file
  */
export async function exportAuditLogsToExcel(logs: AuditLog[]): Promise<void> {
  const rows = logs.map((l, idx) => ({
    '№': idx + 1,
    'Bajaruvchi': l.actorName || '—',
    'Roli': l.actorRole || '—',
    'Harakat': l.action || '—',
    'Modul / Bo‘lim': l.entityType || '—',
    'Yozuv ID': l.entityId || '—',
    'Batafsil': l.details || '—',
    'Vaqt': l.timestamp ? new Date(l.timestamp).toLocaleString('uz-UZ') : '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 26 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 24 },
    { wch: 40 },
    { wch: 22 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit_Loglari');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Audit_Loglari_${dateStr}.xlsx`);
}

/**
 * Exports language certificates to an Excel (.xlsx) file
 */
export async function exportLanguageCertificatesToExcel(
  items: LanguageCertificate[],
  students: StudentProfile[] = []
): Promise<void> {
  const studentMap = new Map<string, StudentProfile>();
  students.forEach(s => studentMap.set(s.id, s));

  const rows = items
    .filter(i => !i.isDeleted)
    .map((c, index) => {
      const st = studentMap.get(c.studentId);
      return {
        '№': index + 1,
        'Talaba F.I.Sh.': c.studentName || st?.fullName || '—',
        'Guruh': st?.group || '—',
        'Yo‘nalish': st?.facultyOrField ? (canonicalizeDirection(st.facultyOrField) || st.facultyOrField) : '—',
        'Til': c.language || '—',
        'Sertifikat turi': c.certificateType || '—',
        'Darajasi': c.level || '—',
        'Ball': c.score || '—',
        'Seriya / Raqam': c.certificateNumber || '—',
        'Berilgan sana': c.issueDate || '—',
        'Amal qilish muddati': c.expiryDate || 'Muddatsiz',
        'Holati': c.status || '—',
        'Ko‘rib chiquvchi': c.reviewedByName || '—',
        'Qayd etilgan sana': c.createdAt ? new Date(c.createdAt).toLocaleDateString('uz-UZ') : '—',
      };
    });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 12 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Til_Sertifikatlari');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Til_Sertifikatlari_${dateStr}.xlsx`);
}

