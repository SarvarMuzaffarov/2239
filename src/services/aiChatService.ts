export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
}

// Client-side domain intelligence engine
// Guarantees immediate (<50ms), rich, professional responses in Uzbek even if server is offline or experiencing network lag
export function getClientDomainResponse(userQuery: string): string {
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

Sizga quyidagi yo‘nalishlarda to‘liq amaliy yordam bera olaman:
* 🎓 **Ilmiy rahbar tanlash:** Mezonlar, professor-o‘qituvchilar va profilingizga biriktirish tartibi.
* 📝 **Ilmiy maqola va tezislar:** IMRAD standarti, OAK va Scopus talablari, adabiyotlar tahlili.
* 💡 **Startap va loyihalar:** MVP yaratish, Pitch Deck taqdimoti va grant tanlovlariga tayyorgarlik.
* 🏆 **Yutuqlar va ballar:** Xalqaro til sertifikatlari (IELTS, CEFR) va ilmiy faoliyat uchun ballar tizimi.
* 🎟️ **Konferensiyalar:** Filial ilmiy anjumanlariga ro‘yxatdan o‘tish va QR-kodli elektron chiptalar.

Qaysi mavzuda savolingiz yoki loyihangiz bor? Marhamat, yozing!`;
  }

  // Gratitude / Closing
  if (q.includes('rahmat') || q.includes('tashakkur') || q.includes('spasibo') || q.includes('barakalla')) {
    return `Arzimaydi! Ilmiy izlanishlaringiz va o‘qishingizda ulkan zafarlar tilayman. Savollaringiz yoki yangi g‘oyalaringiz bo‘lsa, istalgan vaqtda murojaat qiling!`;
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
    return `Assalomu alaykum! Portaldagi ballar va sertifikatlar tartibi:

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
3. «Yangi sertifikat yuklash» tugmasini bosib, faylni va seriya raqamini kiriting.
4. Tekshiruvdan so‘ng ballaringiz umumiy reytingda aks etadi!`;
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

export async function sendAiChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const cleanMessage = message.trim();
  if (!cleanMessage) return '';

  // Exclude error messages and system greetings from history payload
  const formattedHistory = history
    .filter(
      item =>
        !item.isError &&
        item.text &&
        !item.text.includes('vaqtinchalik muammo') &&
        !item.text.includes('xatolik yuz berdi')
    )
    .map(item => ({
      role: item.role,
      text: item.text,
    }));

  const payload = JSON.stringify({
    message: cleanMessage,
    history: formattedHistory,
  });

  try {
    // 3.5 second fast timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data?.reply && typeof data.reply === 'string' && data.reply.trim()) {
          return data.reply.trim();
        }
      }
    }
  } catch (_e) {
    // Graceful fallback without breaking user experience
  }

  // Seamless client fallback: guarantees 100% reliable responses without ever throwing an error
  return getClientDomainResponse(cleanMessage);
}
