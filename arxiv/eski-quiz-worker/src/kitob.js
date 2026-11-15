/**
 * «Ilm olish sirlari» kitob marafoni.
 *
 * Imom Zarnujiyning "Ta'limul muta'allim" asari 13 fasl + Imom A'zamning
 * Abu Yusufga vasiyatidan iborat. Kanaldagi o'qish jadvali "kuniga 1 fasl"
 * bo'lgani uchun viktorina ham shu ritmga moslangan: har fasl — alohida bosqich.
 *
 * Kunlik viktorinadan farqi: bu yerda kun cheklovi yo'q, foydalanuvchi
 * o'z bosqichida turadi va faqat oldinga yuradi. Tugatgan fasliga
 * xohlagancha qaytib, takrorlashi mumkin.
 */

import kitobBank from "./kitob_bank.json";

export const KITOB_JAMI = 14;      // 13 fasl + vasiyat
export const KITOB_BATCH = 8;      // bir bosqichda nechta savol

export const FASL = [
  {
    n: 1, ok: "📖", ad: "Ilm va fiqhning mohiyati va fazilati",
    tv: "Nima uchun ilm o'rganish farz? Qaysi ilmni bilish har bir insonga shart? "
      + "Muallif ilmning qadri va fiqhning o'rnini ochib beradi.",
    iq: "«Bir olim ming obiddan afzalroqdir.»"
  },
  {
    n: 2, ok: "🎯", ad: "Ilm olishda niyat qilish",
    tv: "Bir xil mehnat — niyatga ko'ra ikki xil natija. Bu fasl ilm yo'lidagi "
      + "eng nozik masalaga bag'ishlangan.",
    iq: "«Amallarning ajru savobi niyatga qarab bo'ladi.»"
  },
  {
    n: 3, ok: "🤝", ad: "Ilm, ustoz va sherik tanlash",
    tv: "Ustozni qanday tanlash kerak? Nega ikki oy sabr qilish tavsiya qilinadi? "
      + "Va nima uchun do'st tanlash ilmning yarmi hisoblanadi.",
    iq: "«Kishining kim ekanini o'zidan so'rama, do'stlariga qara.»"
  },
  {
    n: 4, ok: "🙏", ad: "Ilm va ilm ahlini ulug'lash",
    tv: "«Ilm afzalmi yoki odob?» — javob sizni o'ylantiradi. Ustoz hurmati, "
      + "kitob odobi va shogirdlik adabi haqida.",
    iq: "«Menga bir dona harf o'rgatgan kishining quliman.» — Hazrati Ali"
  },
  {
    n: 5, ok: "🔥", ad: "Jiddu-jahd, bardavomlik va himmat",
    tv: "Kechalar, mehnat va sabr. Nega yoshlikda o'rganilgan ilm toshga o'yilgan "
      + "naqshga o'xshatiladi va «rifq» nima degani?",
    iq: "«Qimirlagan qir oshar, ham tinmagan tinar.»"
  },
  {
    n: 6, ok: "📝", ad: "Darsni boshlash, miqdori va tartibi",
    tv: "Bu fasl — amaliy metodika. Saboq miqdori, takror tizimi va munozara "
      + "qoidalari. Bugungi o'quv usullariga hayratlanarli darajada yaqin.",
    iq: "«Bir soat fikr almashish bir oy takrordan xayrliroqdir.»"
  },
  {
    n: 7, ok: "🕊", ad: "Tavakkul qilish",
    tv: "Rizq tashvishi ilmni qanday to'sadi? Talaba nimaga g'am chekishi va "
      + "nimaga chekmasligi kerak — muallif aniq chegara qo'yadi.",
    iq: "«Nafsingni mashg'ul qilmasang, u seni o'zi bilan mashg'ul qiladi.»"
  },
  {
    n: 8, ok: "⏳", ad: "Tahsil vaqti",
    tv: "Sakson yoshda ilm boshlagan olim hikoyasi va kun davomidagi eng barakali "
      + "soatlar haqida.",
    iq: "«Bizning bu ishimiz beshikdan lahadgachadir.»"
  },
  {
    n: 9, ok: "💛", ad: "Nasihat va mehru shafqat",
    tv: "Dushmanlik, hasad va yomon gumon — ilm yo'lining ko'rinmas to'siqlari. "
      + "Muallif ulardan qutulishning kutilmagan yo'lini ko'rsatadi.",
    iq: "«O'nta yaxshilikka erishish uchun bitta ahmoqning zahmatiga sabr qilinglar.»"
  },
  {
    n: 10, ok: "✍️", ad: "Foyda talab qilish",
    tv: "Eshitganni yozib borish odati haqida butun bir fasl. Nega ulug'lar "
      + "siyohdondan ajralmaganlar?",
    iq: "«Kimning cho'ntagida daftar yurmas, qalbiga hikmat ham kirmas.»"
  },
  {
    n: 11, ok: "🛡", ad: "Ilm olishda parhez va taqvo",
    tv: "Ovqat, uyqu va suhbat — uchtasi ham ilmga bevosita ta'sir qiladi. "
      + "Bu fasl talabaning kundalik turmush tartibiga bag'ishlangan.",
    iq: "«Hikmatning boshi taqvodir.»"
  },
  {
    n: 12, ok: "🧠", ad: "Zehnni mustahkamlaydigan omillar",
    tv: "Xotirani kuchaytiradigan va zaiflashtiradigan narsalar ro'yxati. "
      + "Ba'zilari sizni ajablantiradi.",
    iq: "«Zehningdan shikoyat qilma — avval gunohingni tark et.»"
  },
  {
    n: 13, ok: "🌾", ad: "Rizq va umrni ziyoda qiladiganlar",
    tv: "Kundalik odatlarning rizqqa ta'siri haqida o'ttizdan ortiq aniq "
      + "ko'rsatma. Kitobning eng amaliy qismi.",
    iq: "«Aql kamol topsa, og'iz so'zga ochilavermaydi.» — Hazrati Ali"
  },
  {
    n: 14, ok: "📜", ad: "Imom A'zamning Abu Yusufga vasiyati",
    tv: "Ustozning shogirdga so'nggi so'zi: hokimiyat, jamiyat, oila va obro' "
      + "haqida. Marafonning yakuniy bosqichi.",
    iq: "«O'n yil ovqatsiz qolsang ham ilmdan voz kechma.»"
  },
];

export const faslMeta = (n) => FASL[n - 1] || { n, ok: "📖", ad: `${n}-fasl`, tv: "", iq: "" };
export const faslLabel = (n) => {
  const f = faslMeta(n);
  return `${f.ok} ${f.n}-fasl. ${f.ad}`;
};

/** Marafon boshlanganidan beri nechanchi kun (0 dan). */
export function marafonKuni(startISO, now = Date.now()) {
  const [y, m, d] = startISO.split("-").map(Number);
  const boshi = Date.UTC(y, m - 1, d);
  const bugun = new Date(now);
  const shu = Date.UTC(bugun.getUTCFullYear(), bugun.getUTCMonth(), bugun.getUTCDate());
  return Math.floor((shu - boshi) / 86400000);
}

// ——— deterministik aralashtirish (har foydalanuvchiga o'z tartibi) ———

function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
}

function shuffle(arr, seed) {
  const a = arr.slice();
  const r = rng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/** Variantlarni aralashtirish — pozitsiyadan naqsh topib bo'lmasin. */
function shuffleOptions(q, seed) {
  const r = rng((hash(q.q) ^ Math.imul(seed + 1, 2654435761)) >>> 0);
  const idx = q.o.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }
  return { ...q, o: idx.map((i) => q.o[i]), c: idx.indexOf(q.c) };
}

/**
 * Berilgan fasl uchun savollar to'plami.
 * Bir xil (uid, fasl, urinish) — bir xil natija beradi, shuning uchun
 * KV kechikishi savol ketma-ketligini buzmaydi.
 */
export function faslQuestions(faslNo, uid, attempt = 0) {
  const pool = kitobBank.filter((q) => q.f === faslNo);
  if (!pool.length) return [];
  const seed = hash(`${uid}:${faslNo}:${attempt}`) >>> 0;
  const picked = shuffle(pool, seed).slice(0, Math.min(KITOB_BATCH, pool.length));
  return picked.map((q, i) => shuffleOptions(q, seed + i));
}

export const faslSavolSoni = (faslNo) =>
  Math.min(KITOB_BATCH, kitobBank.filter((q) => q.f === faslNo).length);

export const kitobJamiSavol = () => kitobBank.length;

/** Savol turining izohi — javobdan keyin ko'rinadi. */
export function turLabel(k) {
  return {
    fakt: "📌 Faktik savol",
    sabab: "💡 Sabab-natija",
    amaliy: "🎯 Amaliy vaziyat",
    iqtibos: "💬 Iqtibos",
    taqqos: "⚖️ Taqqoslash",
  }[k] || "📖 Ilm olish sirlari";
}

/** Progress chizig'i: ▰▰▰▱▱ ko'rinishida. */
export function progressBar(done, total = KITOB_JAMI) {
  const filled = Math.round((done / total) * 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled);
}
