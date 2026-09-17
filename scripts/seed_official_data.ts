import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };
import { SUPERVISORS_SEED_LIST, OFFICIAL_STUDENTS_LIST } from './official_data';

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

async function runSeed() {
  console.log('====================================================');
  console.log('FIRESTORE TALABALAR VA ILMIY RAHBARLARNI INTEGRATSIYA QILISH');
  console.log('====================================================');

  // 1. Existing supervisors
  const existingSupervisorsSnap = await getDocs(collection(db, 'supervisors'));
  const existingSupervisors = existingSupervisorsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  console.log(`Mavjud ilmiy rahbarlar soni bazada: ${existingSupervisors.length} ta`);

  const supervisorMap = new Map<string, { id: string; fullName: string }>();

  // Map existing supervisors by their names and aliases
  for (const sup of existingSupervisors) {
    const cleaned = cleanStr(sup.fullName);
    supervisorMap.set(cleaned, { id: sup.id, fullName: sup.fullName });
  }

  // Ensure all seed supervisors are in the map or created
  for (const seedSup of SUPERVISORS_SEED_LIST) {
    let found = existingSupervisors.find(ex => {
      const exClean = cleanStr(ex.fullName);
      return (
        seedSup.aliases.some(alias => cleanStr(alias) === exClean || exClean.includes(cleanStr(alias)) || cleanStr(alias).includes(exClean)) ||
        ex.phone === seedSup.phone
      );
    });

    let supId = '';
    let supFullName = seedSup.fullName;

    if (found) {
      supId = found.id;
      supFullName = found.fullName || seedSup.fullName;
    } else {
      const newRef = doc(collection(db, 'supervisors'));
      supId = newRef.id;
      await setDoc(newRef, {
        id: supId,
        fullName: seedSup.fullName,
        phone: seedSup.phone,
        email: seedSup.email,
        position: seedSup.position,
        academicDegree: seedSup.academicDegree,
        department: seedSup.department,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      console.log(`[+] Yangi ilmiy rahbar yaratildi: ${seedSup.fullName} (${seedSup.shortName}) -> ID: ${supId}`);
    }

    for (const alias of seedSup.aliases) {
      supervisorMap.set(cleanStr(alias), { id: supId, fullName: supFullName });
    }
    supervisorMap.set(cleanStr(seedSup.shortName), { id: supId, fullName: supFullName });
    supervisorMap.set(cleanStr(seedSup.fullName), { id: supId, fullName: supFullName });
  }

  // 2. Existing Students & Users
  console.log('\n--- 2. Mavjud talabalar va hisoblarni o\'qish ---');
  const existingStudentsSnap = await getDocs(collection(db, 'students'));
  const existingStudents = existingStudentsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  const existingUsersSnap = await getDocs(collection(db, 'users'));
  const existingUsers = existingUsersSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  console.log(`Bazadagi mavjud talabalar soni: ${existingStudents.length} ta`);
  console.log(`Bazadagi mavjud foydalanuvchilar soni: ${existingUsers.length} ta`);

  const studentByPhone = new Map<string, any>();
  const studentByName = new Map<string, any>();
  for (const st of existingStudents) {
    if (st.phone) studentByPhone.set(st.phone.trim(), st);
    if (st.fullName) studentByName.set(cleanStr(st.fullName), st);
  }

  console.log('\n--- 3. 71 ta rasmiy talabalarni Batch orqali kiritish / yangilash ---');
  let insertedCount = 0;
  let updatedCount = 0;
  const defaultPassword = 'Talaba123!';

  // Use writeBatch for fast atomic execution
  let batch = writeBatch(db);
  let batchOps = 0;

  for (const item of OFFICIAL_STUDENTS_LIST) {
    const cleanSup = cleanStr(item.supervisorName);
    const supInfo = supervisorMap.get(cleanSup) || {
      id: '',
      fullName: item.supervisorName,
    };

    const cleanName = cleanStr(item.fullName);
    const existingSt = studentByPhone.get(item.phone) || studentByName.get(cleanName);

    if (existingSt) {
      // Update existing student
      const stRef = doc(db, 'students', existingSt.id);
      batch.update(stRef, {
        fullName: item.fullName,
        phone: item.phone,
        course: item.course,
        group: item.group,
        facultyOrField: item.facultyOrField,
        supervisorId: supInfo.id || existingSt.supervisorId || '',
        customSupervisorName: supInfo.fullName || item.supervisorName,
        updatedAt: new Date().toISOString(),
      });
      batchOps++;

      if (existingSt.userId) {
        const uRef = doc(db, 'users', existingSt.userId);
        batch.update(uRef, {
          fullName: item.fullName,
          phone: item.phone,
          updatedAt: new Date().toISOString(),
        });
        batchOps++;
      }

      console.log(`[UPDATE] ${item.row}. ${item.fullName} (${item.group}) -> Rahbar: ${supInfo.fullName}`);
      updatedCount++;
    } else {
      // Create new student and user account
      const userRef = doc(collection(db, 'users'));
      const stRef = doc(collection(db, 'students'));

      const salt = generateSalt();
      const passwordHash = await hashPassword(defaultPassword, salt);
      const nowIso = new Date().toISOString();

      const userDoc = {
        id: userRef.id,
        phone: item.phone,
        passwordHash,
        salt,
        role: 'student',
        fullName: item.fullName,
        isActive: true,
        createdAt: nowIso,
      };

      const studentDoc = {
        id: stRef.id,
        userId: userRef.id,
        fullName: item.fullName,
        phone: item.phone,
        course: item.course,
        group: item.group,
        facultyOrField: item.facultyOrField,
        supervisorId: supInfo.id || '',
        customSupervisorName: supInfo.fullName || item.supervisorName,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      batch.set(userRef, userDoc);
      batch.set(stRef, studentDoc);
      batchOps += 2;

      studentByPhone.set(item.phone, studentDoc);
      studentByName.set(cleanName, studentDoc);

      console.log(`[INSERT] ${item.row}. ${item.fullName} (${item.group}) -> Rahbar: ${supInfo.fullName} (Tel: ${item.phone})`);
      insertedCount++;
    }

    // Firestore batch limit is 500
    if (batchOps >= 350) {
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
  console.log('YAKUNIY NATIJALAR:');
  console.log(`Yangi kiritilgan talabalar: ${insertedCount} ta`);
  console.log(`Yangilangan mavjud talabalar: ${updatedCount} ta`);
  console.log(`Barcha talabalar uchun boshlang'ich parol: ${defaultPassword}`);
  console.log('====================================================\n');
}

runSeed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Xatolik yuz berdi:', err);
    process.exit(1);
  });
