import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };
import { OFFICIAL_STARTUPS_LIST } from './official_startups_data';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

function cleanStr(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, "'")
    .replace(/[\s\.\-]+/g, ' ')
    .trim();
}

async function runStartupSeed() {
  console.log('====================================================');
  console.log('FIRESTORE STARTUP LOYIHALARINI INTEGRATSIYA QILISH');
  console.log('====================================================');

  // 1. Fetch all students
  const studentsSnap = await getDocs(collection(db, 'students'));
  const students = studentsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[];
  console.log(`Mavjud talabalar soni: ${students.length}`);

  // 2. Fetch all supervisors
  const supervisorsSnap = await getDocs(collection(db, 'supervisors'));
  const supervisors = supervisorsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[];
  console.log(`Mavjud ilmiy rahbarlar soni: ${supervisors.length}`);

  // 3. Fetch existing projects
  const projectsSnap = await getDocs(collection(db, 'projects'));
  const existingProjects = projectsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[];
  console.log(`Mavjud loyihalar soni: ${existingProjects.length}`);

  // Build lookup maps
  const studentMap = new Map<string, any>();
  for (const st of students) {
    if (st.fullName) {
      studentMap.set(cleanStr(st.fullName), st);
    }
  }

  // Supervisor matching
  function findSupervisor(shortOrFullName: string): any {
    const cleaned = cleanStr(shortOrFullName);
    return supervisors.find(sup => {
      const supClean = cleanStr(sup.fullName);
      if (supClean === cleaned || supClean.includes(cleaned) || cleaned.includes(supClean)) {
        return true;
      }
      // Check last name matching e.g. "B.Jumayev" vs "Baxtiyor Jumayev"
      const parts = cleaned.split(' ');
      const lastName = parts[parts.length - 1];
      if (lastName && lastName.length > 3 && supClean.includes(lastName)) {
        return true;
      }
      return false;
    });
  }

  function findStudent(name: string): any {
    const cleaned = cleanStr(name);
    // Direct match
    if (studentMap.has(cleaned)) {
      return studentMap.get(cleaned);
    }
    // Partial / word match
    const words = cleaned.split(' ').filter(w => w.length > 2);
    for (const st of students) {
      const stClean = cleanStr(st.fullName);
      const matches = words.filter(w => stClean.includes(w));
      if (matches.length >= 2) {
        return st;
      }
    }
    return null;
  }

  let batch = writeBatch(db);
  let batchOps = 0;
  let inserted = 0;
  let updated = 0;
  const nowIso = new Date().toISOString();

  for (const item of OFFICIAL_STARTUPS_LIST) {
    const student = findStudent(item.studentName);
    if (!student) {
      console.warn(`[!] Talaba topilmadi: ${item.studentName} (${item.title})`);
      continue;
    }

    const sup = findSupervisor(item.supervisorName);
    const supervisorId = sup?.id || student.supervisorId || '';

    // Check if project already exists for this student with similar title
    const cleanTitle = cleanStr(item.title);
    const existing = existingProjects.find(p => {
      if (p.studentId === student.id) {
        const pClean = cleanStr(p.title);
        return pClean === cleanTitle || pClean.includes(cleanTitle) || cleanTitle.includes(pClean);
      }
      return false;
    });

    if (existing) {
      // Update existing
      const pRef = doc(db, 'projects', existing.id);
      batch.update(pRef, {
        title: item.title,
        description: item.description,
        type: 'startap',
        field: student.facultyOrField || student.group || 'Innovatsion texnologiyalar',
        supervisorId: supervisorId,
        studentId: student.id,
        studentName: student.fullName,
        studentPhone: student.phone || '',
        authorNames: student.fullName,
        status: 'Tasdiqlangan',
        reviewedBy: '1fanYvlOirJqWOGhrd0J',
        reviewedByName: 'Xakimov Zafar Tulyaganovich',
        reviewedAt: nowIso,
        updatedAt: nowIso,
      });
      batchOps++;
      updated++;
      console.log(`[UPDATE] ${item.row}. ${item.title} -> Talaba: ${student.fullName}`);
    } else {
      // Create new
      const pRef = doc(collection(db, 'projects'));
      batch.set(pRef, {
        id: pRef.id,
        title: item.title,
        description: item.description,
        type: 'startap',
        field: student.facultyOrField || student.group || 'Innovatsion texnologiyalar',
        supervisorId: supervisorId,
        studentId: student.id,
        studentName: student.fullName,
        studentPhone: student.phone || '',
        authorNames: student.fullName,
        status: 'Tasdiqlangan',
        reviewedBy: '1fanYvlOirJqWOGhrd0J',
        reviewedByName: 'Xakimov Zafar Tulyaganovich',
        reviewedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      batchOps++;
      inserted++;
      console.log(`[INSERT] ${item.row}. ${item.title} -> Talaba: ${student.fullName} (Rahbar: ${sup?.fullName || item.supervisorName})`);
    }

    if (batchOps >= 400) {
      console.log(`... Committing batch of ${batchOps} operations ...`);
      await batch.commit();
      batch = writeBatch(db);
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    console.log(`... Committing final batch of ${batchOps} operations ...`);
    await batch.commit();
  }

  console.log('\n====================================================');
  console.log('STARTUPLAR YAKUNIY NATIJALARI:');
  console.log(`Yangi kiritilgan startup loyihalar: ${inserted} ta`);
  console.log(`Yangilangan startup loyihalar: ${updated} ta`);
  console.log(`Jami kiritilgan/yangilangan: ${inserted + updated} ta`);
  console.log('====================================================\n');
}

runStartupSeed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Xatolik:', err);
    process.exit(1);
  });
