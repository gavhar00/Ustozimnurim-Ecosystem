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

const TOPICS = ["IT", "Liderlik", "Diniy", "Kino", "Mantiq"];

export function dayIndex(now = Date.now()) {
  const d = new Date(now);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const n = Math.floor((today - START_DATE_UTC) / 86400000);
  return n < 0 ? 0 : n;
}

export function planFor(day) {
  return WEEK_PLAN[Math.min(Math.floor(day / 7), WEEK_PLAN.length - 1)];
}

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
  return { ...q, o: idx.map((i) => q.o[i]), c: idx.indexOf(q.c) };
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
