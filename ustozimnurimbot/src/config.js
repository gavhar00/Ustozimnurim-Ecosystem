// Ustozim Nurim — kunlik viktorina sozlamalari.
// DIQQAT: bu qiymatlar post_daily_announcement.py bilan bir xil bo'lishi shart.

export const START_DATE_UTC = Date.UTC(2026, 7, 3); // 2026-08-03

// Har kuni qaysi mavzudan nechta savol beriladi (haftama-hafta ortib boradi).
// Jami: 7 → 9 → 11 → 13 → 15, so'ng doimiy 15.
export const WEEK_PLAN = [
  { IT: 3, Liderlik: 1, Diniy: 1, Kino: 1, Mantiq: 1 }, // 1-hafta  = 7
  { IT: 3, Liderlik: 2, Diniy: 1, Kino: 2, Mantiq: 1 }, // 2-hafta  = 9
  { IT: 4, Liderlik: 2, Diniy: 2, Kino: 2, Mantiq: 1 }, // 3-hafta  = 11
  { IT: 5, Liderlik: 3, Diniy: 2, Kino: 2, Mantiq: 1 }, // 4-hafta  = 13
  { IT: 6, Liderlik: 3, Diniy: 2, Kino: 2, Mantiq: 2 }, // 5-haftadan = 15
];

const TOPICS = ["IT", "Liderlik", "Diniy", "Kino", "Mantiq", "Ingliz"];

/**
 * Yo'nalishlar.
 *
 * ADOLAT ShARTI: yo'nalish faqat savollarning MAVZUSINI o'zgartiradi,
 * SONINI emas. Hamma bir kunda bir xil sonda savol oladi, shuning uchun
 * maksimal ball ham bir xil va reyting taqqoslanadigan bo'lib qoladi.
 * Agar yo'nalishlar soni har xil bo'lsa, reyting mavzu tanlashga
 * aylanib qolardi — kim osonroq mavzuni tanlasa, o'sha yuqorida turardi.
 */
export const YONALISHLAR = [
  { k: "aralash",  ok: "🎲", ad: "Aralash — hamma mavzu" },
  { k: "IT",       ok: "💻", ad: "IT va dasturlash" },
  { k: "Liderlik", ok: "🌟", ad: "Fazilatli liderlik" },
  { k: "Diniy",    ok: "🕌", ad: "Diniy savodxonlik" },
  { k: "Kino",     ok: "🎬", ad: "Kino va madaniyat" },
  { k: "Mantiq",   ok: "🧩", ad: "Mantiq va topishmoq" },
  { k: "Ingliz",   ok: "🇬🇧", ad: "Ingliz tili (zamonlar, qoidalar)" },
];

export function dayIndex(now = Date.now()) {
  const d = new Date(now);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const n = Math.floor((today - START_DATE_UTC) / 86400000);
  return n < 0 ? 0 : n;
}

export function planFor(day) {
  return WEEK_PLAN[Math.min(Math.floor(day / 7), WEEK_PLAN.length - 1)];
}

/**
 * Shaxsiy botda kunlik sinov uzunligi.
 *
 * GURUH BILAN ADASHTIRMANG: guruh e'loni `todayCount()` ni ishlatadi va
 * o'zgarmaydi. 5 savollik tajriba (2026-10-20) admin qaroriga ko'ra to'xtatildi:
 * sinov yana 15 ta. Shu bitta son uzunlikni belgilaydi.
 */
export const KUNLIK_SHAXSIY = 15;

export function todayCount(now = Date.now()) {
  const p = planFor(dayIndex(now));
  return TOPICS.reduce((s, t) => s + (p[t] || 0), 0);
}

// ——— Javob variantlarini aralashtirish ———
// Bazada to'g'ri javob turli pozitsiyada, lekin qo'shimcha himoya sifatida
// har kuni deterministik aralashtiriladi: o'quvchi pozitsiyadan naqsh topa olmaydi.
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffleOptions(q, day) {
  // Variantlari arabcha bo'lgan savollar: rasm shu tartibda chizilgan — aralashtirilmaydi (src/rasm.js)
  if (q.t === "Arab" && q.o.length && q.o.every((o) => /[\u0600-\u06FF]/.test(o))) return q;
  let s = (hashStr(q.q) ^ Math.imul(day + 1, 2654435761)) >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  const idx = q.o.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }
  return { ...q, o: idx.map((i) => q.o[i]), c: idx.indexOf(q.c),
           ...(q.cs ? { cs: q.cs.map((i) => idx.indexOf(i)).sort((x, y) => x - y) } : {}) };
}

/**
 * Javob to'g'rimi? Bitta to'g'ri javobli savolda — bitta variant tanlangan va u to'g'ri;
 * ko'p javobli savolda (q.cs) — tanlangan to'plam to'g'ri to'plam bilan AYNAN bir xil.
 */
export function togriMi(q, optionIds) {
  const ids = [...(optionIds || [])].sort((a, b) => a - b);
  if (Array.isArray(q.cs)) return ids.length === q.cs.length && ids.every((v, i) => v === q.cs[i]);
  return ids.length === 1 && ids[0] === q.c;
}

/**
 * Tanlangan yo'nalish bo'yicha bugungi savollar.
 *
 * Soni aralash rejim bilan BIR XIL (todayCount) — adolat sharti shu.
 *
 * Har foydalanuvchiga o'z boshlanish nuqtasi beriladi (uid xeshi). Sababi:
 * bitta mavzu bazasi kichik bo'lsa (hozir eng kichigi 60 ta savol), kuniga
 * 15 ta savolda baza to'rt kunda tugaydi. Umumiy kursor bo'lsa, hamma bir
 * kunda bir xil takrorni ko'rardi. Ofset bilan takror foydalanuvchilar
 * o'rtasida yoyiladi.
 *
 * MUHIM CHEKLOV: bu takrorni KAMAYTIRADI, lekin YO'QOTMAYDI. Bitta
 * yo'nalishda savol soni kuniga beriladigan sondan kamida 20-30 barobar ko'p
 * bo'lmasa, takror sezilarli bo'lib qoladi. Shuning uchun kichik bazalarni
 * (Diniy, Kino, Mantiq) kengaytirish zarur.
 */
export function pickTodayFor(bank, yonalish, uid, now = Date.now()) {
  if (!yonalish || yonalish === "aralash" || !TOPICS.includes(yonalish)) {
    return pickToday(bank, now);
  }

  const day = dayIndex(now);
  const soni = todayCount(now);
  const pool = bank.filter((q) => q.t === yonalish);

  // Yo'nalishda bir kunlik savol ham yo'q bo'lsa, aralashga qaytamiz —
  // foydalanuvchi bo'sh viktorina olishi mumkin emas.
  if (pool.length < soni) return pickToday(bank, now);

  const ofset = hashStr(`y:${uid}:${yonalish}`) % pool.length;
  const start = (ofset + day * soni) % pool.length;

  const out = [];
  for (let i = 0; i < soni; i++) out.push(pool[(start + i) % pool.length]);

  let s = Math.imul(day + ofset + 7, 2654435761) >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }

  return out.map((q) => shuffleOptions(q, day + ofset));
}

/** Bugungi savollar — mavzular aralash, 30 kun ichida takrorlanmaydi. */
export function pickToday(bank, now = Date.now()) {
  const day = dayIndex(now);
  const plan = planFor(day);
  const out = [];

  for (const topic of TOPICS) {
    const need = plan[topic] || 0;
    if (!need) continue;
    const pool = bank.filter((q) => q.t === topic);
    if (!pool.length) continue;

    // Oldingi kunlarda shu mavzudan nechta ishlatilganini hisoblaymiz
    let used = 0;
    for (let d = 0; d < day; d++) used += planFor(d)[topic] || 0;

    const start = used % pool.length;
    for (let i = 0; i < need; i++) out.push(pool[(start + i) % pool.length]);
  }

  // Mavzular aralashib ketsin (kunga bog'liq, lekin barqaror tartib)
  let s = Math.imul(day + 7, 2654435761) >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }

  return out.map((q) => shuffleOptions(q, day));
}


// ═══════════════════════════════════════════════════════════════════
// KUNLIK TARKIB (shaxsiy bot)
// ═══════════════════════════════════════════════════════════════════

/**
 * Arab alifbosi kursi: 35 kun. Boshlanish — 2026-10-26 (dushanba).
 * Manba: «Muallim soniy» (arabic.uz, 2009). 1-14 kun: 29 harf (1-bet jadvali).
 * 15-28: kitob tartibida har harf uch harakat bilan va kitobdagi so'zlar (1-12-bet).
 * 29-35: mad (13-bet), tashdid (16), tanvin (19), harf shakllari, takror.
 */
export const ARAB_BOSHI = Math.round((Date.UTC(2026, 9, 26) - START_DATE_UTC) / 86400000);
export const ARAB_KUNLAR = 35;
export const ARAB_SONI = 3;      // kurs kunlarida kunlik savollardan nechtasi arabcha

/** Bugun kursning nechanchi darsi (1..28). Kursdan oldin yoki keyin — 0. */
export function arabDars(day = dayIndex()) {
  const n = day - ARAB_BOSHI + 1;
  return n >= 1 && n <= ARAB_KUNLAR ? n : 0;
}

/**
 * «Arab alifbosi» bo'limi — kursdan ALOHIDA mavzu sifatida: istalgan vaqt,
 * istalgan blok. Bloklar kurs kunlariga (g) mos: har blokda 12–21 savol.
 * qol — savoldan oldin yuboriladigan qo'llanma rasmi (src/qollanma.js).
 */
export const ARAB_BLOKLAR = [
  { n: 1, dan: 1,  gacha: 5,  ad: "Harflar · 1-qism",            qol: "alifbo" },
  { n: 2, dan: 6,  gacha: 10, ad: "Harflar · 2-qism",            qol: "alifbo" },
  { n: 3, dan: 11, gacha: 14, ad: "Harflar · 3-qism",            qol: "alifbo" },
  { n: 4, dan: 15, gacha: 21, ad: "Harakatlar · 1-qism",         qol: "harakat" },
  { n: 5, dan: 22, gacha: 28, ad: "Harakatlar · 2-qism",         qol: "harakat" },
  { n: 6, dan: 29, gacha: 32, ad: "Mad, tashdid, tanvin",        qol: "harakat" },
  { n: 7, dan: 33, gacha: 35, ad: "Harf shakllari",              qol: "shakl" },
  { n: 8, dan: 0,  gacha: 0,  ad: "Umumiy takror (aralash)",     qol: "alifbo" },
];

/** Blok savollari. 8-blok: takror hovuzidan 15 ta, kunga qarab almashadi. */
export function arabBlok(bank, n, uid = 0, now = Date.now()) {
  const b = ARAB_BLOKLAR.find((x) => x.n === n);
  if (!b) return [];
  const hammasi = bank.filter((q) => q.t === "Arab");
  let royxat;
  if (b.dan === 0) {
    const pool = hammasi.filter((q) => q.g === 0);
    let s = Math.imul(dayIndex(now) + 7 + (Number(uid) % 997), 2654435761) >>> 0;
    const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
    const a = pool.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    royxat = a.slice(0, 15);
  } else {
    royxat = hammasi.filter((q) => q.g >= b.dan && q.g <= b.gacha);
  }
  return royxat.map((q, i) => shuffleOptions(q, n * 1000 + i));
}

/** Kurs kuni uchun qo'llanma rasmi: harflar → harakatlar → shakllar. */
export const arabQollanma = (dars) => (dars <= 14 ? "alifbo" : dars <= 32 ? "harakat" : "shakl");

// Arab bo'lmagan "boshqa mavzu" o'rni: IT asosiy auditoriya, shuning uchun ko'proq.
const AYLANMA = ["IT", "Liderlik", "IT", "Diniy", "Mantiq", "IT", "Liderlik"];

/**
 * Shaxsiy botda BUGUNGI savollar (KUNLIK_SHAXSIY ta).
 *
 * Kurs kunlarida: 3 ta arabcha (shu kunning darsi) + 1 multfilm + 1 kino + 10 ta
 * boshqa mavzu. Kursdan keyin: 1 ta arabcha takror + oddiy tarkib.
 * Yo'nalish tanlagan foydalanuvchi o'z mavzusini oladi, arabcha esa hamma uchun.
 */
const ARAB_KUNLIK = 2;
/**
 * Aralash viktorinaning qat'iy tarkibi (admin qarori, 2026-10-22), jami 15:
 *   Arab 2 · Ingliz 2 · Diniy 3 · IT 4 · Mantiq 2 · Liderlik 1 · Kino/Multfilm 1.
 * Hamma uchun bir xil (reyting adolatli), kunlar bo'yicha aylanadi.
 */
const ARALASH_REJA = [["Ingliz", 2], ["Diniy", 3], ["IT", 4], ["Mantiq", 2], ["Liderlik", 1]];
// Har mavzuda 1 ta o'rin — QIYIN/interaktiv savol (ko'p javobli yoki rasmli, h:true)
const QIYIN_ORIN = { IT: 1, Mantiq: 1, Ingliz: 1 };
// IT o'rinlari mavzular bo'yicha aylanadi (admin qarori, 2026-10-22)
const IT_MAVZULAR = ["figma", "python", "js", "html", "css", "react"];

export function kunlikToplam(bank, yonalish, uid, now = Date.now()) {
  const day = dayIndex(now);
  const dars = arabDars(day);
  const arabQ = bank.filter((q) => q.t === "Arab");
  const n = KUNLIK_SHAXSIY;

  const kursKuni = dars > 0 && arabQ.some((q) => q.g === dars);
  const kursdanKeyin = day >= ARAB_BOSHI + ARAB_KUNLAR && arabQ.length > 0;

  // 1) Arabcha qism
  let arab = [];
  if (kursKuni) {
    arab = arabQ.filter((q) => q.g === dars).slice(0, ARAB_KUNLIK).map((q) => shuffleOptions(q, day));
  } else if (kursdanKeyin) {
    const pool = arabQ.filter((q) => q.g === 0);
    // Har kuni 2 ta turli takror savoli (kunga bog'liq, barqaror)
    const bosh = (Math.imul(day + 11, 2654435761) >>> 0) % Math.max(1, pool.length);
    for (let i = 0; i < Math.min(ARAB_KUNLIK, pool.length); i++) arab.push(shuffleOptions(pool[(bosh + i * 7) % pool.length], day));
  }

  // 2) Qolgan savollar (arab bo'lmagan bank)
  const baza = pickTodayFor(bank.filter((q) => q.t !== "Arab"), yonalish, uid, now);
  const aralash = !yonalish || yonalish === "aralash" || !TOPICS.includes(yonalish);
  const joy = n - arab.length;
  let rest;

  if (aralash) {
    const qism = [];
    for (const [tur, soni] of ARALASH_REJA) {
      const qiyin = bank.filter((q) => q.t === tur && q.h);
      const oddiy = bank.filter((q) => q.t === tur && !q.h);
      let k = QIYIN_ORIN[tur] || 0;
      if (k && !qiyin.length) k = 0;
      for (let i = 0; i < k; i++) qism.push(shuffleOptions(qiyin[(day + i) % qiyin.length], day));
      const qolgan = soni - k;
      for (let i = 0; i < qolgan; i++) {
        let q;
        if (tur === "IT") {
          const mav = IT_MAVZULAR[(day * qolgan + i) % IT_MAVZULAR.length];
          const hovuz = oddiy.filter((x) => x.s === mav);
          q = hovuz.length ? hovuz[Math.floor((day * qolgan + i) / IT_MAVZULAR.length) % hovuz.length] : undefined;
        }
        if (!q) { const p = oddiy.length ? oddiy : bank.filter((x) => x.t === tur); if (!p.length) continue; q = p[(day * qolgan + i) % p.length]; }
        qism.push(shuffleOptions(q, day));
      }
    }
    // Kino/multfilm: bitta, kunlar bo'yicha almashadi (juft kun — multfilm, toq — kino)
    const kp = bank.filter((q) => q.t === "Kino" && q.s === (day % 2 === 0 ? "m" : "k"));
    const kpAll = kp.length ? kp : bank.filter((q) => q.t === "Kino");
    if (kpAll.length) qism.push(shuffleOptions(kpAll[Math.floor(day / 2) % kpAll.length], day));
    rest = qism;
  } else {
    // Reyting adolati (admin qarori, 2026-11-02): yo'nalish tanlaganlar ham aralash bilan bir xil 3 ta qiyin
    // (⭐ 2 ball) savol oladi — hamma uchun maksimum 18 ball. Qolgan o'rinlar o'z yo'nalishidan.
    const qiyinlar = [];
    for (const tur of Object.keys(QIYIN_ORIN)) {
      const p = bank.filter((q) => q.t === tur && q.h);
      if (p.length) qiyinlar.push(shuffleOptions(p[day % p.length], day));
    }
    // 70/30 (admin qarori, 2026-11-11): o'z mavzusi ko'pchilik, qolgani boshqa mavzulardan —
    // "faqat bitta mavzu" bo'lmasin va kichik bank tezroq tugamasin. Jami joy soni o'zgarmaydi (reyting adolati).
    const bos = Math.max(0, joy - qiyinlar.length);
    let ozSoni = Math.ceil(bos * 0.7);
    const ozHovuz = bank.filter((q) => q.t === yonalish && !q.h);
    let oz;
    if (ozHovuz.length >= ozSoni) {
      // Hovuz bo'ylab ketma-ket: kunlik oyna to'liq ishlatiladi, savol tushib qolmaydi
      const bosh = (hashStr(`y:${uid}:${yonalish}`) + day * ozSoni) % ozHovuz.length;
      oz = [];
      for (let i = 0; i < ozSoni; i++) oz.push(shuffleOptions(ozHovuz[(bosh + i) % ozHovuz.length], day));
    } else {
      oz = baza.filter((q) => !q.h).slice(0, ozSoni);   // hovuz kichik — eski usul
    }
    const boshqaTur = TOPICS.filter((t) => t !== yonalish);
    const bor = new Set([...oz, ...qiyinlar].map((q) => q.q));
    const boshqa = [];
    for (let i = 0; boshqa.length < bos - oz.length && i < 30; i++) {
      const tur = boshqaTur[(day * 3 + i) % boshqaTur.length];
      const hovuz = bank.filter((q) => q.t === tur && !q.h && !bor.has(q.q));
      if (!hovuz.length) continue;
      const q = hovuz[Math.floor((day * 3 + i) / boshqaTur.length + hashStr("m" + tur)) % hovuz.length];
      bor.add(q.q); boshqa.push(shuffleOptions(q, day));
    }
    rest = [...oz, ...boshqa, ...qiyinlar];
  }
  // Bir xil mavzular ketma-ket to'planib qolmasin: kunga bog'liq, barqaror aralashtirish
  {
    let sd = Math.imul(day + 5, 2654435761) >>> 0;
    const rnd = () => { sd = (Math.imul(sd, 1103515245) + 12345) >>> 0; return sd / 4294967296; };
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  }

  // Arabcha dars bloki birinchi, keyin umumiy savollar
  const out = [...arab, ...rest];
  // Arab kursi boshlanmagan kunlarda 2 ta o'rin bo'sh qoladi — IT bilan to'ldiramiz
  if (out.length < n) {
    const bor = new Set(out.map((q) => q.q));
    const ort = bank.filter((q) => q.t === "IT" && !q.h && !bor.has(q.q));
    for (let i = 0; out.length < n && i < ort.length; i++) out.push(shuffleOptions(ort[(day * 2 + i) % ort.length], day));
  }
  return out.slice(0, n);
}

/** Bugungi tarkib mavzular bo'yicha: { Arab: 3, Kino: 1, IT: 1 } — e'lon matni uchun. */
export function kunlikReja(bank, now = Date.now()) {
  const reja = {};
  for (const q of kunlikToplam(bank, null, 0, now)) reja[q.t] = (reja[q.t] || 0) + 1;
  return reja;
}
