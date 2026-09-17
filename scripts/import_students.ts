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

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

// Password hashing helper exactly matching src/lib/crypto.ts
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

// 10 supervisors list
const SUPERVISORS_DATA = [
  {
    key: 'sarvar muzaffarov',
    fullName: 'Sarvar Muzaffarov',
    position: 'Dotsent',
    academicDegree: 'PhD',
    department: 'Axborot texnologiyalari',
    phone: '+998996782239',
    email: 'sarvar.muzaffarov@edu.uz',
  },
  {
    key: 'mavlonov mansur',
    fullName: 'Mansur Mavlonov',
    position: 'Katta o‘qituvchi',
    academicDegree: 'PhD',
    department: 'Oziq-ovqat va biotexnologiya',
    phone: '+998901234501',
    email: 'm.mavlonov@edu.uz',
  },
  {
    key: 'qarshibayev sirojidin',
    fullName: 'Sirojidin Qarshibayev',
    position: 'Dotsent',
    academicDegree: 'DSc',
    department: 'Dasturiy injiniring va sun’iy intellekt',
    phone: '+998901234502',
    email: 's.qarshibayev@edu.uz',
  },
  {
    key: 'jamolova fotima',
    fullName: 'Fotima Jamolova',
    position: 'Dotsent',
    academicDegree: 'PhD',
    department: 'Avtomatlashtirish va boshqaruv',
    phone: '+998901234503',
    email: 'f.jamolova@edu.uz',
  },
  {
    key: 'mo‘minov xolmurod turdiqulovich',
    fullName: 'Xolmurod Mo‘minov Turdiqulovich',
    position: 'Professor',
    academicDegree: 'DSc',
    department: 'Texnologik mashinalar va jihozlar',
    phone: '+998901234504',
    email: 'x.mominov@edu.uz',
  },
  {
    key: 'sobirova mohichehra',
    fullName: 'Mohichehra Sobirova',
    position: 'Katta o‘qituvchi',
    academicDegree: 'PhD',
    department: 'Oziq-ovqat texnologiyasi',
    phone: '+998901234505',
    email: 'm.sobirova@edu.uz',
  },
  {
    key: 'norboyev abduaxad',
    fullName: 'Abduaxad Norboyev',
    position: 'Dotsent',
    academicDegree: 'PhD',
    department: 'Mashinasozlik va mexanika',
    phone: '+998901234506',
    email: 'a.norboyev@edu.uz',
  },
  {
    key: 'samadqulov muhamadjon',
    fullName: 'Muhamadjon Samadqulov',
    position: 'Dotsent',
    academicDegree: 'PhD',
    department: 'Iqtisodiyot va menejment',
    phone: '+998901234507',
    email: 'm.samadqulov@edu.uz',
  },
  {
    key: 'kenjaboyev hasan',
    fullName: 'Hasan Kenjaboyev',
    position: 'Katta o‘qituvchi',
    academicDegree: 'PhD',
    department: 'Ishlab chiqarish jarayonlarini avtomatlashtirish',
    phone: '+998901234508',
    email: 'h.kenjaboyev@edu.uz',
  },
  {
    key: 'karimov mustafo',
    fullName: 'Mustafo Karimov',
    position: 'Professor',
    academicDegree: 'DSc',
    department: 'Texnologik mashina va uskunalar',
    phone: '+998901234509',
    email: 'm.karimov@edu.uz',
  },
];

// Raw students data from the provided document
const RAW_STUDENTS = [
  {
    num: 1,
    fullName: 'Asadbek Abduhamidov',
    phone: '+998777774217',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'ASADBEK ABDUHAMIDOV',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 2,
    fullName: 'Aliqulova Fazilat Baxtiyor qizi',
    phone: '+998701082429',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 1,
    group: 'OOT401-26',
    supervisorRaw: 'Mavlonov Mansur',
    date: '2026-09-11',
  },
  {
    num: 3,
    fullName: 'Narziqulova Odina Rashid qizi',
    phone: '+998952472503',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BIOTEX',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 4,
    fullName: 'Ganiboyeva Mohira Amirqul qizi',
    phone: '+998938781573',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BIOTEX',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 5,
    fullName: 'Dilnoza Baxtiyorova',
    phone: '+998978872907',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BT',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 6,
    fullName: 'Koʻchimova Dinora Akram qizi',
    phone: '+998938290825',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '60610500',
    supervisorRaw: 'Qarshibayev Sirojidin',
    date: '2026-09-09',
  },
  {
    num: 7,
    fullName: 'Otamurodov Dovudbek Komil oʻgʻli',
    phone: '+998946691408',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'SI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 8,
    fullName: 'Gafurov savdoni Rashidovich',
    phone: '+998905725508',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: '110126',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 9,
    fullName: 'Abduraxmonova Laylo Gayrativich',
    phone: '+998776900814',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 1,
    group: 'OOT 401-26',
    supervisorRaw: 'Mavlonov Mansur',
    date: '2026-09-11',
  },
  {
    num: 10,
    fullName: 'Saidgaliyeva Dilnoza Shuxrat qizi',
    phone: '+998948070759',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 11,
    fullName: 'Qosimov Sherzod Xamidullayevich',
    phone: '+998940115968',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'ANONIM1',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 12,
    fullName: 'Sulaymonova Zebo Komiljonovna',
    phone: '+998777234727',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 13,
    fullName: 'Abduvaliyev Otabek Sodiqjon o\'g\'li',
    phone: '+998882944111',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 14,
    fullName: 'Maftuna Qurbonboyeva',
    phone: '+998943301226',
    facultyOrField: 'Texnologik jarayonlar va ishlab chiqarishni avtomatlashtirish',
    course: 4,
    group: '401-23',
    supervisorRaw: 'Jamolova Fotima',
    date: '2026-09-09',
  },
  {
    num: 15,
    fullName: 'Namuna Nauman Namuna',
    phone: '+998996782200',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'NAMUNA',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 16,
    fullName: 'Shuxratov Musulmon',
    phone: '+998935769736',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: '60610300',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 17,
    fullName: 'Jumanov Nurmuhammad Sobir oʻgʻli',
    phone: '+998881370727',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '020126',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 18,
    fullName: 'EGAMNAZAROV ASADBEK HUSANOVICH',
    phone: '+998937640304',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'SI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 19,
    fullName: 'Madina Abdikaxarova',
    phone: '+998879613707',
    facultyOrField: 'Biotexnologiya',
    course: 2,
    group: '130125',
    supervisorRaw: 'Mavlonov Mansur',
    date: '2026-09-09',
  },
  {
    num: 20,
    fullName: 'Davlatova Odinaxon Aliqul qizi',
    phone: '+998976563808',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'CI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 21,
    fullName: 'Malika Davronova',
    phone: '+998932717704',
    facultyOrField: 'Kompyuter injiniringi',
    course: 2,
    group: '11-01-25',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 22,
    fullName: 'Jumayev Ravshan Sherzod o‘g‘li',
    phone: '+998938342772',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'S I',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 23,
    fullName: 'Raxmatullayev Ulugʻbek Akmalivich',
    phone: '+998772876810',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: '60610300',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 24,
    fullName: 'Urolov Javohir Baxtiyorovch',
    phone: '+998991658108',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KOMPYUTER INJINIRING',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 25,
    fullName: 'Raxmonaliyev Asror Abrorvich',
    phone: '+998949750711',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: '60610300',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 26,
    fullName: 'Xamraqulova Gulsevar Xazratqul qizi',
    phone: '+998501854327',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 2,
    group: '402-25OOT',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 27,
    fullName: 'Sardor Maxmanazarov',
    phone: '+998200156772',
    facultyOrField: 'Texnologik mashinalar va jihozlar',
    course: 3,
    group: '201-24',
    supervisorRaw: 'Mo‘minov Xolmurod Turdiqulovich',
    date: '2026-09-09',
  },
  {
    num: 28,
    fullName: 'Asadbek Anvarov Asilbek oʻlli',
    phone: '+998773933111',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BIOTEXNOLOGIYA',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 29,
    fullName: 'Rahmatullayev Arslonbek Ilxom oʻgʻli',
    phone: '+998939022203',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '2026SI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 30,
    fullName: 'Ubaydullayeva Gulsanam Oybek qizi',
    phone: '+998991178386',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'SI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 31,
    fullName: 'Eshqo\'ziyeva Shahnoza Abdunazar qizi',
    phone: '+998932161896',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 32,
    fullName: 'Xoliqov Shohjahon Farhodjon o\'g\'li',
    phone: '+998501010178',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: '65',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 33,
    fullName: 'Nodrbek Iskandarov Baxtiyor o\'g\'li',
    phone: '+998953800805',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 1,
    group: '401-26',
    supervisorRaw: 'Sobirova Mohichehra',
    date: '2026-09-14',
  },
  {
    num: 34,
    fullName: 'Sheratov Bobur Boxodir oʼgʼli',
    phone: '+998951781328',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'SUNʼIY INTELEKT',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 35,
    fullName: 'Raupova Ozoda Zokir qizi',
    phone: '+998970281708',
    facultyOrField: 'Qishloq xo‘jaligini mexanizatsiyalashtirish',
    course: 1,
    group: 'QXM',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 36,
    fullName: 'Shoxsanam Hamidova',
    phone: '+998940861141',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BIOTEXNOLOGIYA',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 37,
    fullName: 'Berkinova Mohichehra Ilhomovnq',
    phone: '+998870117908',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BIOTEX',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 38,
    fullName: 'Safarov Mirkomil Shuhrat oʻgʻli',
    phone: '+998500794508',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'S I',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 39,
    fullName: 'Otabek Yaxshiboyev Abdujalil oʻgli',
    phone: '+998917843055',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '60610500',
    supervisorRaw: 'Qarshibayev Sirojidin',
    date: '2026-09-10',
  },
  {
    num: 40,
    fullName: 'Sattiyev Saidabbos',
    phone: '+998937217802',
    facultyOrField: 'Texnologik mashinalar va jihozlar',
    course: 3,
    group: '201-24',
    supervisorRaw: 'Norboyev Abduaxad',
    date: '2026-09-09',
  },
  {
    num: 41,
    fullName: 'Baydivaliyev Bekzod',
    phone: '+998953730720',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 1,
    group: '2026 401',
    supervisorRaw: 'Mavlonov Mansur',
    date: '2026-09-11',
  },
  {
    num: 42,
    fullName: 'Ortiqboyev Sunnatulla Mansurovich',
    phone: '+998943646418',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '02-01 26',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 43,
    fullName: 'Oʼktamqulov Eldor',
    phone: '+998776202129',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 1,
    group: '26',
    supervisorRaw: 'Sobirova Mohichehra',
    date: '2026-09-11',
  },
  {
    num: 44,
    fullName: 'Alisherov Shohjaxon',
    phone: '+998990037103',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '60610500',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 45,
    fullName: 'Rasulberdiyev Oʻlmasbek Zoir oʻgʻli',
    phone: '+998888200136',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 46,
    fullName: "Mirzayev Humoyun Jahongir o'gʻli",
    phone: '+998773593308',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '02-01-26',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 47,
    fullName: 'Axtamov Shohjaxon',
    phone: '+998772492530',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '110226',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 48,
    fullName: 'Begmatova Odina Nurullo qizi',
    phone: '+998930904152',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: '020126',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 49,
    fullName: 'Sarimov Jumanazar Murodim oʻgʻli',
    phone: '+998505055491',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BT',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 50,
    fullName: 'Muhiddinov Muhammadjon Najimiddin o’g’li',
    phone: '+998910404016',
    facultyOrField: 'Sun’iy intellekt',
    course: 1,
    group: 'SI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 51,
    fullName: 'Sabina Abdusamatova',
    phone: '+998931410160',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 52,
    fullName: 'Husnora Boronova',
    phone: '+998995247509',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 53,
    fullName: 'Rahima Quvanova Sobirjon qizi',
    phone: '+998881741006',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 2,
    group: '401 25',
    supervisorRaw: 'Sobirova Mohichehra',
    date: '2026-09-09',
  },
  {
    num: 54,
    fullName: 'Shahriyor Muhammadiyev',
    phone: '+998995183632',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 55,
    fullName: 'Samandar Safarov',
    phone: '+998505035907',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BT',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 56,
    fullName: "Shahobiddin Alisherov Sho'xrat og'li",
    phone: '+998906790829',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 57,
    fullName: 'Xudoynazarov Muhammadjon Sherzod ogʻli',
    phone: '+998906883700',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: '60610300',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 58,
    fullName: 'Turdibekov Sherzod Zokirovich',
    phone: '+998700299105',
    facultyOrField: 'Menejment',
    course: 4,
    group: '701-23',
    supervisorRaw: 'Samadqulov Muhamadjon',
    date: '2026-09-11',
  },
  {
    num: 59,
    fullName: 'Lapadova Dinora Sherzod qizi',
    phone: '+998997896800',
    facultyOrField: 'Biotexnologiya',
    course: 1,
    group: 'BIOTX',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 60,
    fullName: 'Soldatov Timur',
    phone: '+998505705665',
    facultyOrField: 'Iqtisodiyot',
    course: 1,
    group: '1001',
    supervisorRaw: 'Samadqulov Muhamadjon',
    date: '2026-09-09',
  },
  {
    num: 61,
    fullName: 'Rasuljonova Mavluda Jaxongir qizi',
    phone: '+998971241204',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 62,
    fullName: 'Hazratqulova Ro’zigul',
    phone: '+998947015207',
    facultyOrField: 'Kompyuter injiniringi',
    course: 2,
    group: '11-01-25 KI',
    supervisorRaw: 'Qarshibayev Sirojidin',
    date: '2026-09-09',
  },
  {
    num: 63,
    fullName: 'Maloxat Abduraimova',
    phone: '+998770358408',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'KI',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 64,
    fullName: 'Javohir Nazarov Ro\'zimurodovich',
    phone: '+998919860441',
    facultyOrField: 'Menejment',
    course: 3,
    group: '502-24',
    supervisorRaw: 'Samadqulov Muhamadjon',
    date: '2026-09-09',
  },
  {
    num: 65,
    fullName: 'Murodjon Burxonov',
    phone: '+998941523582',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: 'MURODJON',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 66,
    fullName: 'Bobur Xoshimov',
    phone: '+998940925006',
    facultyOrField: 'Oziq-ovqat texnologiyasi',
    course: 1,
    group: 'OOT',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-11',
  },
  {
    num: 67,
    fullName: 'Xolyigitov Abbos',
    phone: '+998949229122',
    facultyOrField: 'Texnologik jarayonlar va ishlab chiqarishni avtomatlashtirish',
    course: 3,
    group: '301-24AB',
    supervisorRaw: 'Kenjaboyev Hasan',
    date: '2026-09-09',
  },
  {
    num: 68,
    fullName: 'Islombek Omonqulov Ilhom o’g’li',
    phone: '+998507249577',
    facultyOrField: 'Kompyuter injiniringi',
    course: 1,
    group: '60610300',
    supervisorRaw: 'sarvar muzaffarov',
    date: '2026-09-09',
  },
  {
    num: 69,
    fullName: 'Berdiyev Usmon',
    phone: '+998971238474',
    facultyOrField: 'Texnologik mashinalar va jihozlar',
    course: 4,
    group: 'TMJ 301-23',
    supervisorRaw: 'Karimov Mustafo',
    date: '2026-09-09',
  },
];

function normalizeSupervisorKey(raw: string): string {
  const clean = raw.toLowerCase().trim().replace(/\s+/g, ' ');
  if (clean.includes('sarvar') || clean.includes('muzaffarov')) return 'sarvar muzaffarov';
  if (clean.includes('mavlonov') || clean.includes('mansur')) return 'mavlonov mansur';
  if (clean.includes('qarshibayev') || clean.includes('sirojidin')) return 'qarshibayev sirojidin';
  if (clean.includes('jamolova') || clean.includes('fotima')) return 'jamolova fotima';
  if (clean.includes('mo‘minov') || clean.includes('mominov') || clean.includes('xolmurod')) return 'mo‘minov xolmurod turdiqulovich';
  if (clean.includes('sobirova') || clean.includes('mohichehra')) return 'sobirova mohichehra';
  if (clean.includes('norboyev') || clean.includes('abduaxad')) return 'norboyev abduaxad';
  if (clean.includes('samadqulov') || clean.includes('muhamadjon')) return 'samadqulov muhamadjon';
  if (clean.includes('kenjaboyev') || clean.includes('hasan')) return 'kenjaboyev hasan';
  if (clean.includes('karimov') || clean.includes('mustafo')) return 'karimov mustafo';
  return clean;
}

async function runImport() {
  console.log('--- 1. Supervisors yaratish / tekshirish boshlanmoqda ---');
  
  // Existing supervisors
  const existingSupervisorsSnap = await getDocs(collection(db, 'supervisors'));
  const supervisorMap = new Map<string, { id: string; fullName: string }>();

  existingSupervisorsSnap.forEach(d => {
    const data = d.data();
    const key = normalizeSupervisorKey(data.fullName || '');
    supervisorMap.set(key, { id: d.id, fullName: data.fullName });
  });

  // Ensure each of the 10 supervisors exists
  for (const sup of SUPERVISORS_DATA) {
    if (!supervisorMap.has(sup.key)) {
      const docRef = doc(collection(db, 'supervisors'));
      const supervisorProfile = {
        id: docRef.id,
        fullName: sup.fullName,
        phone: sup.phone,
        email: sup.email,
        position: sup.position,
        academicDegree: sup.academicDegree,
        department: sup.department,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, supervisorProfile);
      supervisorMap.set(sup.key, { id: docRef.id, fullName: sup.fullName });
      console.log(`[+] Yangi supervisor yaratildi: ${sup.fullName} (${docRef.id})`);
    } else {
      console.log(`[=] Supervisor mavjud: ${sup.fullName}`);
    }
  }

  console.log('\n--- 2. Talabalar va foydalanuvchi akkauntlarini kiritish boshlanmoqda ---');
  
  // Existing users to avoid duplicate phones
  const existingUsersSnap = await getDocs(collection(db, 'users'));
  const userPhones = new Set<string>();
  existingUsersSnap.forEach(d => {
    const data = d.data();
    if (data.phone) userPhones.add(data.phone);
  });

  const defaultPassword = 'Talaba123!';
  let createdCount = 0;
  let skippedCount = 0;

  for (const item of RAW_STUDENTS) {
    const phone = item.phone.trim();
    if (userPhones.has(phone)) {
      console.log(`[!] Telefon ${phone} allaqachon mavjud (${item.fullName}), o'tkazib yuborildi.`);
      skippedCount++;
      continue;
    }

    const supKey = normalizeSupervisorKey(item.supervisorRaw);
    const supervisor = supervisorMap.get(supKey) || {
      id: '',
      fullName: item.supervisorRaw,
    };

    const userRef = doc(collection(db, 'users'));
    const studentRef = doc(collection(db, 'students'));

    const salt = generateSalt();
    const passwordHash = await hashPassword(defaultPassword, salt);
    const createdAtIso = item.date ? `${item.date}T10:00:00.000Z` : new Date().toISOString();

    const userDoc = {
      id: userRef.id,
      phone: phone,
      passwordHash,
      salt,
      role: 'student',
      fullName: item.fullName.trim(),
      isActive: true,
      createdAt: createdAtIso,
    };

    const studentDoc = {
      id: studentRef.id,
      userId: userRef.id,
      fullName: item.fullName.trim(),
      phone: phone,
      course: Number(item.course),
      group: item.group.trim(),
      facultyOrField: item.facultyOrField,
      supervisorId: supervisor.id || '',
      customSupervisorName: supervisor.fullName || item.supervisorRaw,
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
    };

    // Save both docs
    await setDoc(userRef, userDoc);
    await setDoc(studentRef, studentDoc);
    userPhones.add(phone);
    createdCount++;

    if (createdCount % 10 === 0 || createdCount === RAW_STUDENTS.length) {
      console.log(`[+] Kiritildi: ${createdCount}/${RAW_STUDENTS.length}...`);
    }
  }

  console.log(`\n=== IMPORT YAKUNLANDI ===`);
  console.log(`Muvaffaqiyatli kiritilgan talabalar: ${createdCount} ta`);
  console.log(`O'tkazib yuborilgan (allaqachon bor): ${skippedCount} ta`);
  console.log(`Standart boshlang'ich parol: ${defaultPassword}`);
}

runImport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Import jarayonida xatolik:', err);
    process.exit(1);
  });
