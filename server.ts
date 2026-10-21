import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `Siz Toshkent kimyo-texnologiya instituti (TKTI) Yangiyer filiali «Iqtidorli talabalar va ilmiy-innovatsion faoliyat portali»ning rasmiy sun'iy intellekt yordamchisisiz. Ismingiz: «Iqtidor AI».

Vazifalaringiz:
1. Talabalar va ilmiy izlanuvchilarga ilmiy faoliyatda yordam berish:
   - Maqolalar, tezislar, ilmiy loyihalar yozish talablari (IMRAD strukturasi: Kirish, Usullar, Natijalar, Muhokama).
   - OAK (Oliy attestatsiya komissiyasi) milliy jurnallari va xalqaro nufuzli jurnallar (Scopus, Web of Science) talablari va standartlari.
   - Adabiyotlar tahlili, havolalar (APA, GOST, IEEE) va ilmiy etika hamda plagiatdan saqlanish qoidalari.
   - Startap va innovatsion g'oyalarni rivojlantirish: muammo tahlili, MVP (Minimum Viable Product), Business Model Canvas, Pitch Deck taqdimot tuzilmasi, grantlar va tanlovlar.

2. Platforma bo'yicha navigatsiya va yo'l-yo'riq ko'rsatish:
   - Universitetda mavjud 18 ta rasmiy ta'lim yo'nalishi (Kimyo muhandisligi, Biotexnologiya, Kompyuter injiniringi, Sun’iy intellekt, Iqtisodiyot, Menejment, Neft va gaz texnologiyasi, Materialshunoslik, Energetika, Avtomatlashtirish, Mashinasozlik, Oziq-ovqat texnologiyasi, Agronomiya, Agrokimyo va h.k.).
   - Ro'yxatdan o'tish (4 bosqich: Shaxsiy ma'lumotlar, Ta'lim yo'nalishi va guruh, Ilmiy rahbar tanlash, Xavfsiz parol).
   - Profil boshqaruvi, ilmiy rahbar biriktirish, yangi loyiha va startap yuklash, til va yutuq sertifikatlarini yuklash hamda ularga ball to'plash.
   - Universitet konferensiyalari, olimpiada va musobaqalarga ro'yxatdan o'tish, QR-kodli elektron chiptalarni olish.

3. Muloqot uslubi:
   - Doimo o'zbek tilida (zarur bo'lsa rus yoki ingliz tillarida ham) xushmuomala, ilmiy, tushunarli, dalda beruvchi va ravon ohangda javob bering.
   - Matnni yaxshi o'qilishi uchun Markdown vositalaridan (qalin matn **bold**, tartiblangan yoki belgilangan ro'yxatlar, sarlavhalar) unumli foydalaning.
   - Foydalanuvchiga yordam bera oladigan aniq, amaliy qadamlarni ko'rsating.`;

// Intelligent, comprehensive domain fallback generator for offline or high-load moments
function getDomainFallbackResponse(userQuery: string): string {
  const q = userQuery.toLowerCase().trim();

  // Greetings and courtesy
  if (
    q.startsWith('salom') ||
    q.includes('assalom') ||
    q.includes('privet') ||
    q.includes('hello') ||
    q.includes('qale') ||
    q.includes('yaxshimisiz')
  ) {
    return `Assalomu alaykum! Men **Iqtidor AI** — TKTI Yangiyer filiali «Iqtidorli talabalar va ilmiy-innovatsion faoliyat portali»ning rasmiy sun'iy intellekt yordamchisiman.

Sizga quyidagi masalalarda to‘liq yordam bera olaman:
* 🎓 **Ilmiy rahbar tanlash:** Kafedra professor-o‘qituvchilari mezonlari va profilingizga biriktirish.
* 📝 **Ilmiy maqola va tezislar:** IMRAD standarti, OAK va Scopus talablari, adabiyotlar tahlili.
* 💡 **Startap va innovatsion loyihalar:** MVP yaratish, Pitch Deck taqdimot tuzilishi va grantlar.
* 🏆 **Yutuqlar va ballar:** Til sertifikatlari (IELTS, CEFR) va ilmiy faoliyat uchun ball hisoblash.
* 🎟️ **Konferensiya va tadbirlar:** Filial ilmiy anjumanlariga qatnashish va QR-kodli chipta olish.

Qaysi mavzuda savolingiz yoki loyihangiz bor? Marhamat, yozing!`;
  }

  // Gratitude / Closing
  if (q.includes('rahmat') || q.includes('tashakkur') || q.includes('spasibo') || q.includes('barakalla')) {
    return `Arzimaydi! Ilmiy izlanishlaringiz va o‘qishlaringizda doimo ulkan muvaffaqiyatlar tilayman. Agar yana savollaringiz yoki yangi g‘oyalaringiz bo‘lsa, istalgan vaqtda murojaat qilishingiz mumkin. Ilm yo‘lida charchamang!`;
  }

  // Supervisors & Research mentorship
  if (q.includes('rahbar') || q.includes('supervisor') || q.includes('ustoz') || q.includes('maslahat') || q.includes('domla')) {
    return `Assalomu alaykum! To‘g‘ri ilmiy rahbar tanlash — ilmiy faoliyatingizdagi muvaffaqiyatning eng muhim omilidir.

TKTI Yangiyer filialida mavjud 18 ta ta'lim yo‘nalishi bo‘yicha professor-o‘qituvchilar faoliyat olib borishadi. Rahbar tanlashda quyidagi **asosiy mezonlar**ga e’tibor bering:

### 1. Asosiy mezonlar:
* **Tadqiqot yo‘nalishining mosligi:** Siz qiziqqan ilmiy soha (masalan: kimyoviy texnologiya, dasturlash va SI, biotexnologiya, iqtisodiyot) bo‘yicha kafedrangizda qaysi ustoz ixtisoslashganini aniqlang.
* **Ilmiy faollik va nashrlar:** Ustoz so‘nggi yillarda **OAK** yoki xalqaro nufuzli (**Scopus**, **Web of Science**) jurnallarda maqola chiqarganmi, patentlari bormi?
* **Shogirdlarining yutuqlari:** Ustoz shogirdlari Davlat nomdor stipendiyalari (Prezident, Beruniy, Islom Karimov) sovrindorlari bo‘lganmi, startap grantlarini yutganmi?
* **Vaqt va muloqot imkoniyati:** Haftasiga kamida bir marta siz bilan muloqot qilib, maqolangiz yoki loyihangiz tahliliga vaqt ajrata oladigan ustozni tanlang.

### 2. Platformada biriktirish qadamlari:
1. Shaxsiy profilingizga kiring.
2. «Ilmiy rahbar» bo‘limida kafedrangiz professor-o‘qituvchilari ro‘yxatidan o‘z ustozingizni tanlang.
3. Agar rahbaringiz ro‘yxatda bo‘lmasa, «Boshqa ilmiy rahbar kiritish» tugmasi orqali uning F.I.Sh., ilmiy darajasi va ish joyini yozib biriktirishingiz mumkin.

Qaysi ta’lim yo‘nalishida o‘qiyotganingizni yozsangiz, yanada aniqroq tavsiyalar bera olaman!`;
  }

  // Scientific articles, IMRAD, thesis, journals
  if (
    q.includes('imrad') ||
    q.includes('maqola') ||
    q.includes('tezis') ||
    q.includes('jurnal') ||
    q.includes('scopus') ||
    q.includes('oak') ||
    q.includes('nashr') ||
    q.includes('maqolani')
  ) {
    return `Assalomu alaykum! Ilmiy maqola va tezislar tayyorlashda jahon andozasi hisoblangan **IMRAD** standarti talablari:

### 1. IMRAD tuzilmasi:
* **I — Introduction (Kirish):** Muammoning dolzarbligi, sohaning o‘rganilganlik darajasi va tadqiqot maqsadi.
* **M — Methods (Metodologiya/Usullar):** Qanday materiallar, tajribalar, laboratoriya jihozlari yoki matematik modellar qo‘llanilganligi.
* **R — Results (Natijalar):** Olingan aniq natijalar, jadvallar, grafiklar va raqamli ko‘rsatkichlar.
* **A — and**
* **D — Discussion (Muhokama va xulosalar):** Olingan natijalarning mavjud adabiyotlar bilan solishtirilishi, ilmiy yangiligi va amaliy ahamiyati.

### 2. Annotatsiya (Abstract) yozish qoidalari:
* Hajmi: 150–250 so‘z.
* Unda tadqiqot maqsadi, qo‘llanilgan asosiy usul, 1–2 ta muhim natija va asosiy xulosa qisqa va lo‘nda ifodalanadi.

### 3. Kalit so‘zlar (Keywords):
* 5–7 ta soha bo‘yicha qidiruvda eng ko‘p ishlatiladigan atamalar.

### 4. Havolalar va adabiyotlar (Citations):
* APA 7th yoki GOST 7.0.5 standartlariga rioya qiling. Plagiat darajasi 15-20% dan oshmasligi lozim.

Maqolangiz qaysi mavzuda ekanligini yozsangiz, rejasini birgalikda tuzib chiqamiz!`;
  }

  // Startups, MVP, Pitch deck, Grants
  if (
    q.includes('startap') ||
    q.includes('loyiha') ||
    q.includes('mvp') ||
    q.includes('pitch') ||
    q.includes('grant') ||
    q.includes('biznes') ||
    q.includes('investitsiya')
  ) {
    return `Assalomu alaykum! Startap va innovatsion loyihalarni muvaffaqiyatli rivojlantirish bo‘yicha asosiy bosqichlar:

### 1. MVP (Minimum Viable Product) nima?
MVP — bu mahsulot yoki xizmatingizning eng kam sarf-xarajat bilan yaratilgan, asosiy muammoni hal qiluvchi ilk ishchi namunasi. U orqali real foydalanuvchilar va ekspertlar fikri o‘rganiladi.

### 2. Pitch Deck (Taqdimot) tuzilmasi (10 slayd):
1. **Muammo:** Qanday og‘riqli muammo mavjud?
2. **Yechim:** Siz taklif qilayotgan innovatsion yechim.
3. **Bozor hajmi (TAM, SAM, SOM):** Mahsulotingizga talab qancha?
4. **Mahsulot/Texnologiya:** Qanday ishlaydi, patent yoki nou-xau bormi?
5. **Raqobatchilar tahlili:** Sizning afzalliklaringiz nimada?
6. **Biznes model:** Qanday daromad olinadi?
7. **Jamoa:** A’zolar va ularning mas’uliyat sohalari.
8. **Rivojlanish xaritasi (Roadmap):** Keyingi 6–12 oylik aniq rejalar.
9. **Moliyaviy ehtiyoj:** Loyihaga qancha grant yoki sarmoya kerak va qayerga sarflanadi?
10. **Aloqa:** Jamoa kontakt ma’lumotlari.

Loyihangiz g‘oyasini qisqacha yozsangiz, uni grant tanlovlariga tayyorlashda yordam beraman!`;
  }

  // Certificates, points, leaderboard, ranking
  if (
    q.includes('sertifikat') ||
    q.includes('ball') ||
    q.includes('yutuq') ||
    q.includes('reyting') ||
    q.includes('top') ||
    q.includes('ochko') ||
    q.includes('daraja')
  ) {
    return `Assalomu alaykum! Portaldagi ballar va sertifikatlar hisoblash tartibi:

### Ballar hisoblash mezoni:
* **Xorijiy til sertifikatlari:**
  * IELTS 7.0+ / CEFR C1: **100 ball**
  * IELTS 6.0–6.5 / CEFR B2: **75 ball**
  * IELTS 5.0–5.5 / CEFR B1: **50 ball**
* **Ilmiy nashrlar:**
  * Scopus / Web of Science maqolasi: **100 ballgacha**
  * OAK milliy jurnali maqolasi: **40–60 ball**
  * Xalqaro/respublika konferensiya tezisi: **15–30 ball**
* **Startap va patentlar:**
  * Ixtiro yoki foydali model patenti: **80–100 ball**
  * Respublika/xalqaro tanlov g‘olibligi: **50–90 ball**

### Qanday yuklash mumkin?
1. Shaxsiy profilingizga kiring.
2. «Yutuqlar va sertifikatlar» bo‘limiga o‘ting.
3. «Yangi sertifikat yuklash» tugmasini bosib, faylni (PDF yoki rasm) va uning seriya raqamini kiriting.
4. Ma'muriyat tekshiruvidan so'ng ballaringiz umumiy reytingda aks etadi!`;
  }

  // Scholarships, contests, incentives
  if (q.includes('stipendiya') || q.includes('prezident') || q.includes('beruniy') || q.includes('navoiy') || q.includes('ragbat')) {
    return `Assalomu alaykum! O‘zbekiston Respublikasi Davlat nomdor stipendiyalari (Prezident, Beruniy, Islom Karimov va boshqalar)ga tayyorgarlik talablari:

### Asosiy shartlar:
1. **O‘zlashtirish ko‘rsatkichi:** Barcha fanlardan a’lo baholar (GPA 4.5+ yoki 86%+).
2. **Ilmiy faoliyat:**
   * Kamida 2 ta OAK ro‘yxatidagi ilmiy maqola.
   * Xalqaro (Scopus/Web of Science) yoki nufuzli anjumanlarda nashrlar.
3. **Chet tili sertifikati:** Kamida B2 (IELTS 6.0+) darajasi.
4. **Ixtirochilik va startaplar:** Guvohnoma, patent yoki innovatsion loyiha g‘olibligi.

Portaldagi profilingiz orqali barcha ilmiy yutuqlaringizni to‘plab boring — bu stipendiya hujjatlarini jamlashda katta qulaylik yaratadi!`;
  }

  // Conferences, events, QR tickets
  if (q.includes('konferensiya') || q.includes('tadbir') || q.includes('chipta') || q.includes('seminar') || q.includes('forum')) {
    return `Assalomu alaykum! TKTI Yangiyer filialida rejalashtirilgan ilmiy-amaliy anjumanlar va seminarlar:

### Ishtirok etish qoidalari:
1. Portaldagi «Tadbirlar va Konferensiyalar» bo‘limiga o‘ting.
2. O‘zingiz qiziqqan konferensiyani tanlang (masalan, «Kimyo va innovatsion texnologiyalar», «Raqamli iqtisodiyot va IT»).
3. «Ro‘yxatdan o‘tish» tugmasini bosing va o‘z maqola/tezisingizni yuklang.
4. Ro‘yxatdan o‘tganingizdan so‘ng sizga **QR-kodli shaxsiy elektron chipta** beriladi.
5. Chiptani yuklab olib, anjuman kuni kirishda taqdim etishingiz mumkin!`;
  }

  // Registration, login, profile management
  if (q.includes('ro\'yxat') || q.includes('royxat') || q.includes('parol') || q.includes('login') || q.includes('profil') || q.includes('kabinet')) {
    return `Assalomu alaykum! Portaldan ro‘yxatdan o‘tish va foydalanish:

### Ro‘yxatdan o‘tish 4 ta oson bosqichdan iborat:
1. **Shaxsiy ma’lumotlar:** F.I.Sh., telefon raqam, elektron pochta.
2. **Ta’lim yo‘nalishi va guruh:** Filialdagi 18 ta yo‘nalishdan birini va o‘quv guruhingizni tanlang.
3. **Ilmiy rahbar:** Kafedrangizdagi ilmiy maslahatchi ustozingizni tanlang yoki yangi kiriting.
4. **Xavfsiz parol:** Hisobingizni himoyalash uchun ishonchli parol o‘rnating.

Agar ro‘yxatdan o‘tgan bo‘lsangiz, «Kirish» tugmasi orqali o‘z shaxsiy kabinetingizga kirib, yutuqlaringizni boshqarishingiz mumkin!`;
  }

  // Default intelligent domain guide
  return `Assalomu alaykum! Men **Iqtidor AI** — TKTI Yangiyer filiali «Iqtidorli talabalar va ilmiy-innovatsion faoliyat portali»ning rasmiy sun'iy intellekt maslahatchisiman.

Sizga quyidagi yo‘nalishlarda yordam bera olaman:
* 🎓 **Ilmiy rahbar tanlash:** Mezonlar, kafedra ustozlari va profilingizga biriktirish.
* 📝 **Ilmiy maqola va tezislar:** IMRAD talablari, OAK va Scopus standartlari, adabiyotlar tahlili.
* 💡 **Startap va loyihalar:** MVP, Business Model Canvas, Pitch Deck va grant tanlovlari.
* 🏆 **Yutuqlar va ballar:** Til sertifikatlari (IELTS, CEFR), reyting ballari va sertifikat yuklash.
* 🎟️ **Konferensiyalar:** Universitet anjumanlariga arizalar va QR-kodli elektron chiptalar.

Savolingizni aniqroq qilib yozsangiz, sizga amaliy va bosqichma-bosqich yordam berishdan mamnun bo‘laman!`;
}

// Strictly cleans and formats contents to comply with Gemini multi-turn API specifications
function sanitizeHistoryForGemini(rawHistory: any[], currentMessage: string) {
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  const validItems: { role: 'user' | 'model'; text: string }[] = [];
  if (Array.isArray(rawHistory)) {
    for (const item of rawHistory) {
      if (!item || !item.text) continue;
      const text = String(item.text).trim();
      if (!text) continue;
      // Skip system messages and error notices from conversation history
      if (
        text.includes('vaqtinchalik muammo') ||
        text.includes('xatolik yuz berdi') ||
        text.includes('Assalomu alaykum! Men **Iqtidor AI**')
      ) {
        continue;
      }
      if (item.role === 'user' || item.role === 'model') {
        validItems.push({ role: item.role, text });
      }
    }
  }

  // Gemini contents must begin with 'user'
  while (validItems.length > 0 && validItems[0].role !== 'user') {
    validItems.shift();
  }

  // Ensure alternating turns
  for (const item of validItems) {
    if (contents.length === 0) {
      contents.push({ role: item.role, parts: [{ text: item.text }] });
    } else {
      const prev = contents[contents.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += `\n\n${item.text}`;
      } else {
        contents.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  // Append user's current message
  const userText = currentMessage.trim();
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${userText}`;
  } else {
    contents.push({ role: 'user', parts: [{ text: userText }] });
  }

  return contents;
}

// In-memory model circuit breaker state
// Prevents spamming exhausted models and prevents triggering console warnings
interface ModelCircuit {
  cooldownUntil: number;
}

const modelCircuits: Record<string, ModelCircuit> = {
  'gemini-3.8-flash': { cooldownUntil: 0 },
  'gemini-3.1-flash-lite': { cooldownUntil: 0 },
  'gemini-2.5-flash': { cooldownUntil: 0 },
};

function isModelAvailable(modelName: string): boolean {
  const circuit = modelCircuits[modelName];
  if (!circuit) return true;
  return Date.now() >= circuit.cooldownUntil;
}

function tripModelCircuit(modelName: string, err: any) {
  if (!modelCircuits[modelName]) {
    modelCircuits[modelName] = { cooldownUntil: 0 };
  }

  const errStr = String(err?.message || err || '');
  const isQuota =
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('quota') ||
    errStr.includes('exceeded your current quota');

  if (isQuota) {
    // If quota exceeded, put on cooldown for 30 minutes to 18 hours
    // Parse retryDelay seconds if present in message (e.g. retry in 18h...)
    let cooldownMs = 60 * 60 * 1000; // default 1 hour cooldown
    const delayMatch = errStr.match(/retry in\s+([0-9.]+)h/i);
    if (delayMatch && delayMatch[1]) {
      const hours = parseFloat(delayMatch[1]);
      if (!isNaN(hours) && hours > 0) {
        cooldownMs = Math.min(hours * 3600 * 1000, 24 * 3600 * 1000);
      }
    }
    modelCircuits[modelName].cooldownUntil = Date.now() + cooldownMs;
  } else {
    // Transient error (503, 500, timeout) -> 30 second temporary pause
    modelCircuits[modelName].cooldownUntil = Date.now() + 30 * 1000;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize server-side Gemini client if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // AI Chat endpoint with professional circuit breaker & quiet failover cascade
  app.post(['/api/ai/chat', '/api/chat'], async (req, res) => {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: "Xabar matni kiritilishi shart." });
    }

    const cleanMessage = message.trim();

    // If Gemini client is available, try tiered models with circuit breaker
    if (ai) {
      const contents = sanitizeHistoryForGemini(history, cleanMessage);

      // Model tier 1: gemini-3.8-flash
      if (isModelAvailable('gemini-3.8-flash')) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
              },
            },
          });

          if (response?.text && response.text.trim()) {
            return res.json({ reply: response.text.trim() });
          }
        } catch (err: any) {
          // Trip circuit breaker quietly without logging RPC quota traces to console
          tripModelCircuit('gemini-3.8-flash', err);
        }
      }

      // Model tier 2: gemini-3.1-flash-lite (fast, independent quota)
      if (isModelAvailable('gemini-3.1-flash-lite')) {
        try {
          const responseLite = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
            },
          });

          if (responseLite?.text && responseLite.text.trim()) {
            return res.json({ reply: responseLite.text.trim() });
          }
        } catch (liteErr: any) {
          tripModelCircuit('gemini-3.1-flash-lite', liteErr);
        }
      }

      // Model tier 3: gemini-2.5-flash (high availability fallback)
      if (isModelAvailable('gemini-2.5-flash')) {
        try {
          const response25 = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
            },
          });

          if (response25?.text && response25.text.trim()) {
            return res.json({ reply: response25.text.trim() });
          }
        } catch (err25: any) {
          tripModelCircuit('gemini-2.5-flash', err25);
        }
      }
    }

    // Tier 4: Zero-downtime intelligent domain knowledge engine
    // Returns immediately with 100% reliable, professional content in Uzbek
    const domainReply = getDomainFallbackResponse(cleanMessage);
    return res.json({ reply: domainReply });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      circuits: {
        'gemini-3.8-flash': isModelAvailable('gemini-3.8-flash'),
        'gemini-3.1-flash-lite': isModelAvailable('gemini-3.1-flash-lite'),
        'gemini-2.5-flash': isModelAvailable('gemini-2.5-flash'),
      },
    });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
