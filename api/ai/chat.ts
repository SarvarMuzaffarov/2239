import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const SYSTEM_INSTRUCTION = `Siz Toshkent kimyo-texnologiya instituti (TKTI) Yangiyer filiali «Iqtidorli talabalar va ilmiy-innovatsion faoliyat portali»ning rasmiy sun'iy intellekt yordamchisisiz. Ismingiz: «Iqtidor AI».

Vazifalaringiz:
1. Talabalar va ilmiy izlanuvchilarga ilmiy faoliyatda yordam berish:
   - Maqolalar, tezislar, ilmiy loyihalar yozish talablari (IMRAD strukturasi: Kirish, Usullar, Natijalar, Muhokama).
   - OAK (Oliy attestatsiya komissiyasi) milliy jurnallari va xalqaro nufuzli jurnallar (Scopus, Web of Science) talablari va standartlari.
   - Adabiyotlar tahlili, havolalar (APA, GOST, IEEE) va ilmiy etika hamda plagiatdan saqlanish qoidalari.
   - Startap va innovatsion g'oyalarni rivojlantirish: muammo tahlili, MVP (Minimum Viable Product), Business Model Canvas, Pitch Deck taqdimot tuzilmasi, grantlar va tanlovlar.

2. Platforma bo'yicha navigatsiya va yo'l-yo'riq ko'rsatish:
   - Universitetda mavjud 18 ta rasmiy ta'lim yo'nalishi.
   - Ro'yxatdan o'tish, profil boshqaruvi, ilmiy rahbar biriktirish, yangi loyiha va startap yuklash, til va yutuq sertifikatlarini yuklash hamda ularga ball to'plash.
   - Universitet konferensiyalari, olimpiada va musobaqalarga ro'yxatdan o'tish, QR-kodli elektron chiptalarni olish.

3. Muloqot uslubi:
   - Doimo o'zbek tilida xushmuomala, ilmiy, tushunarli, dalda beruvchi va ravon ohangda javob bering.
   - Matnni yaxshi o'qilishi uchun Markdown vositalaridan unumli foydalaning.`;

function getDomainFallback(userQuery: string): string {
  const q = userQuery.toLowerCase().trim();

  if (q.includes('startap') || q.includes('loyiha') || q.includes('mvp') || q.includes('pitch') || q.includes('grant')) {
    return `Assalomu alaykum! Startap va innovatsion loyihalarni muvaffaqiyatli rivojlantirish bo‘yicha asosiy bosqichlar:

### 1. MVP (Minimum Viable Product) yaratish qoidalari:
MVP — bu mahsulot yoki xizmatingizning eng kam sarf-xarajat bilan yaratilgan, asosiy muammoni hal qiluvchi ilk ishchi namunasi.
* **Faqat asosiy funksiyaga e'tibor qarating:** Qo‘shimcha bezaklarni keyingi bosqichlarga qoldiring.
* **Tezkor sinov:** Foydalanuvchilar va ekspertlar sinovidan o‘tkazib, ularning fikrlarini (feedback) jamlang.
* **Prototip tayyorlash:** Figma (UI/UX dizayn), 3D model yoki laboratoriya namunasi ko‘rinishida boshlang.

### 2. Pitch Deck (Taqdimot) tuzilmasi (10 ta slayd):
1. **Muammo (Problem):** Bozor yoki sohadagi qanday og‘riqli muammoni hal qilyapsiz?
2. **Yechim (Solution):** Siz taklif qilayotgan innovatsion yechim qanday ishlaydi?
3. **Bozor hajmi (Market Size):** TAM, SAM, SOM tahlili — mahsulotga talab qancha?
4. **Mahsulot/Texnologiya (Product):** Ishlash mexanizmi, patent yoki laboratoriya sinov natijalari.
5. **Raqobatchilar tahlili (Competitors):** Boshqa mavjud yechimlardan ustunliklaringiz.
6. **Biznes model (Business Model):** Qanday daromad olinadi (savdo, obuna, litsenziya)?
7. **Jamoa (Team):** A’zolar, ularning yo‘nalishlari va tajribasi.
8. **Rivojlanish xaritasi (Roadmap):** Keyingi 6–12 oylik aniq bosqichlar.
9. **Moliyaviy ehtiyoj (Ask):** Qancha grant yoki sarmoya kerak va qayerga yo‘naltiriladi?
10. **Aloqa (Contacts):** Jamoa koordinatalari va ijtimoiy tarmoqlar.

Loyihangiz g‘oyasini qisqacha yozsangiz, uni grant tanlovlariga tayyorlashda yordam beraman!`;
  }

  if (q.includes('rahbar') || q.includes('supervisor') || q.includes('ustoz') || q.includes('maslahat')) {
    return `Assalomu alaykum! To‘g‘ri ilmiy rahbar tanlash — ilmiy faoliyatingizdagi muvaffaqiyatning eng muhim omilidir.

TKTI Yangiyer filialida mavjud 18 ta ta'lim yo‘nalishi bo‘yicha professor-o‘qituvchilar faoliyat olib borishadi. Rahbar tanlashda tadqiqot sohangizga mosligi, OAK va Scopus nashrlari hamda vaqt ajrata olishiga e’tibor bering. Shaxsiy profilingizdagi «Ilmiy rahbar» bo‘limi orqali o‘z ustozingizni biriktirishingiz mumkin!`;
  }

  if (q.includes('sertifikat') || q.includes('ball') || q.includes('yutuq') || q.includes('reyting')) {
    return `Assalomu alaykum! Portaldagi ballar va sertifikatlar tartibi:
* **Til sertifikatlari:** IELTS 7.0+ (100 ball), IELTS 6.0–6.5 (75 ball), IELTS 5.0–5.5 (50 ball).
* **Ilmiy nashrlar:** Scopus maqolasi (100 ballgacha), OAK jurnali (40–60 ball), konferensiya tezisi (15–30 ball).
* **Patent va startaplar:** 50–100 ball.
Sertifikatlaringizni profilingizning «Yutuqlar» bo‘limiga yuklab borishingiz mumkin!`;
  }

  if (q.includes('imrad') || q.includes('maqola') || q.includes('tezis') || q.includes('jurnal')) {
    return `Assalomu alaykum! Ilmiy maqola va tezislar tayyorlashda jahon andozasi hisoblangan **IMRAD** standarti talablari:
* **I (Introduction):** Kirish, muammo dolzarbligi va maqsad.
* **M (Methods):** Tadqiqot metodologiyasi va materiallar.
* **R (Results):** Olingan aniq natijalar va jadvallar.
* **D (Discussion):** Muhokama, xulosalar va adabiyotlar tahlili.
Maqolangiz mavzusini yozsangiz, rejasini birgalikda shakllantiramiz!`;
  }

  return `Assalomu alaykum! Men **Iqtidor AI** — TKTI Yangiyer filiali «Iqtidorli talabalar va ilmiy-innovatsion faoliyat portali»ning rasmiy sun'iy intellekt maslahatchisiman.

Sizga ilmiy rahbar tanlash, IMRAD maqolalari, startaplar, grantlar va ballar tizimi bo‘yicha to‘liq yordam bera olaman. Marhamat, savolingizni yozing!`;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', message: 'Iqtidor AI Vercel Service is running.' });
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Xabar matni kiritilishi shart." });
  }

  const cleanMessage = message.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: cleanMessage,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      if (response?.text && response.text.trim()) {
        return res.status(200).json({ reply: response.text.trim() });
      }
    } catch (_err) {
      // Fallback seamlessly to domain reply
    }
  }

  // Instant zero-downtime domain response
  const domainReply = getDomainFallback(cleanMessage);
  return res.status(200).json({ reply: domainReply });
}
