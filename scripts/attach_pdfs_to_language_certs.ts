import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };
import { generateLanguageCertificatePdfDataUrl } from '../src/lib/languageCertificateGenerator';
import type { LanguageCertificate } from '../src/types';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function runAttach() {
  console.log('--- Attaching pre-generated PDF documents to language certificates in Firestore ---');
  const certsSnap = await getDocs(collection(db, 'languageCertificates'));
  let updatedCount = 0;

  for (const docSnap of certsSnap.docs) {
    const data = { id: docSnap.id, ...docSnap.data() } as LanguageCertificate;
    if (!data.fileUrl && !data.fileDataUrl) {
      try {
        const dataUrl = await generateLanguageCertificatePdfDataUrl(data);
        const fileName = `Sertifikat_${(data.studentName || 'Talaba').replace(/\s+/g, '_')}_${data.certificateNumber || data.id}.pdf`;
        await updateDoc(doc(db, 'languageCertificates', docSnap.id), {
          fileDataUrl: dataUrl,
          fileUrl: dataUrl,
          fileName,
          fileSize: 145000,
          fileType: 'application/pdf',
          updatedAt: new Date().toISOString(),
        });
        updatedCount++;
        console.log(`[+] PDF biriktirildi: ${data.studentName} (${data.language})`);
      } catch (err) {
        console.warn(`[-] Xatolik: ${data.studentName}`, err);
      }
    }
  }

  console.log(`=== YAKUNLANDI: Jami ${updatedCount} ta sertifikatga PDF fayli biriktirildi! ===`);
}

runAttach()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
