/**
 * Arabcha savollar uchun rasm: harflar matn ichida o'xshash ko'rinadi (ج / ح / خ),
 * shuning uchun savol oldidan harf katta rasm bilan yuboriladi.
 *
 * Ikki tur:
 *   a — arabcha belgi SAVOL matnida («Bu harfning nomi nima? ج»): bitta katta belgi.
 *   b — arabcha belgilar VARIANTLARDA («Alif harfi qaysi?»): to'rt variant 1–4 raqam bilan.
 *       Variantlar tartibi qat'iy (aralashtirilmaydi), chunki rasm shu tartibda chizilgan.
 *
 * Kalit belgilarning Unicode kodlaridan tuziladi: rasm generatori (tools/arab_rasm.mjs)
 * va bot bir xil funksiyadan foydalanadi, shuning uchun kalitlar hech qachon farq qilmaydi.
 */

const AR = /[؀-ۿ]/;
const cp = (s) => [...s].map((c) => c.codePointAt(0).toString(16)).join(".");

export const opsiyaKalit = (v) => "o:" + cp(v);
export const arabchami = (s) => AR.test(String(s || ""));

/** Savolga rasm kerakmi? {tur, kalit, ...} yoki null. */
export function rasmTuri(q) {
  // Boshqa mavzulardagi rasmli savol (kod, mantiq shakllari): rasm "q:<id>" kaliti bilan, poll tepasida
  if (q && q.img) return { tur: "a", kalit: "q:" + q.img, matn: "" };
  if (!q || q.t !== "Arab" || !Array.isArray(q.o)) return null;
  if (q.o.length && q.o.every(arabchami)) {
    return { tur: "b", kalit: "b:" + q.o.map(cp).join("_"), variantlar: q.o };
  }
  const bol = String(q.q).match(/[؀-ۿـ]+/g);
  if (bol && bol.length) {
    const matn = bol.join(" ");
    return { tur: "a", kalit: "a:" + cp(matn), matn };
  }
  return null;
}
