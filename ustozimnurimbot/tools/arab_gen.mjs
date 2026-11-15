// Arab alifbosi kursi savollarini GENERATSIYA qiladi (src/quiz_bank.json ga qo'shish uchun).
//
// MANBA: «Muallim soniy» (https://arabic.uz/kitoblar/muallim_soniy.pdf), 2009.
//   1-bet      — 29 ta harf jadvali (لا ham kiradi) va tartibi.
//   1-12-bet   — har harf uch harakat (fatha, kasra, zamma) va sukunli so'zlar bilan,
//                kitobdagi tartib: ا ر | ز م | ت ن | ي ب | ك ل | و ه | ف ق | ش س | ث ص | ط ج | خ ح | غ ع | د ض | ذ ظ
//   13-bet     — mad (cho'zish): بَا بِي بُو
//   16-bet     — tashdid: harf ikki marta o'qiladi
//   19-bet     — tanvin: so'z oxirida sukunli «n»
// Atamalar kitobdagidek: fatha, kasra, ZAMMA, sukun, tashdid, tanvin, mad.
//
// NEGA KOD ORQALI: arab matnini qo'lda yozganda bitta belgi adashsa, savol
// o'quvchiga NOTO'G'RI narsa o'rgatadi. Harflar va harakatlar bitta jadvalda
// turadi; savollar undan olinadi. tools/arab_tekshir.py natijani mustaqil tekshiradi.
//
// Ishlatish:  node tools/arab_gen.mjs > tools/arab_new.json
//
// Kurs 35 kun. 1-14: harflar (29 ta). 15-28: harakat va so'zlar (kitob tartibida).
// 29-35: mad, tashdid, tanvin, harf shakllari, takror. Har kuni 3 ta savol (g = kun).
// g = 0 — kursdan keyingi takror uchun.

const TAT = "ـ";
const MARK = { fatha: "َ", kasra: "ِ", zamma: "ُ", sukun: "ْ", shadda: "ّ" };

const L = (h, n, fam, iz) => ({ h, n, fam: [...fam], iz });
// Kitobning 1-betidagi tartib (o'ngdan chapga): 29 ta
const LETTERS = [
  L("ا", "Alif", "لكدر", "Alif — tik chiziq, nuqtasi yo'q. «Ā» ni cho'zish uchun ishlatiladi (masalan, بَا — «bā»)."),
  L("ب", "Bā", "تثني", "Bā — tagida bitta nuqta. Tā (ت) tepasida 2 ta, Sā (ث) tepasida 3 ta nuqta bilan farqlanadi."),
  L("ت", "Tā", "بثني", "Tā — tepasida ikkita nuqta. Bā (ب) tagida bitta, Sā (ث) tepasida uchta nuqta bilan farqlanadi."),
  L("ث", "Sā", "بتنش", "Sā — tepasida uchta nuqta; inglizcha «think» dagi «th» kabi, til uchi tishlar orasida."),
  L("ج", "Jīm", "حخعغ", "Jīm — tagida bitta nuqta. Ḥā (ح) da nuqta yo'q, Xō (خ) da tepasida bitta nuqta bor."),
  L("ح", "Ḥā", "جخعه", "Ḥā — nuqtasi yo'q; bo'g'izdan, nafasni ishqalab chiqariladi. Jīm (ج) ning tagida, Xō (خ) ning tepasida nuqta bor."),
  L("خ", "Xō", "جحغز", "Xō — tepasida bitta nuqta; o'zbekcha «x» (xona) ga yaqin. Ḥā (ح) da nuqta yo'q, Jīm (ج) da tagida bor."),
  L("د", "Dāl", "ذرزو", "Dāl — nuqtasi yo'q. Zāl (ذ) xuddi shunday, lekin tepasida bitta nuqta bor."),
  L("ذ", "Zāl", "درزظ", "Zāl — tepasida bitta nuqta; inglizcha «this» dagi «th» kabi. Dāl (د) da nuqta yo'q."),
  L("ر", "Rō", "زدون", "Rō — nuqtasi yo'q, tilning uchi titrab aytiladi. Zā (ز) da tepasida bitta nuqta bor."),
  L("ز", "Zā", "رذدن", "Zā — tepasida bitta nuqta. Rō (ر) da nuqta yo'q."),
  L("س", "Sīn", "شصثض", "Sīn — nuqtasi yo'q, uchta tishchasi bor. Shīn (ش) da tepasida uchta nuqta qo'shiladi."),
  L("ش", "Shīn", "سصضث", "Shīn — tepasida uchta nuqta. Sīn (س) da nuqta yo'q."),
  L("ص", "Sōd", "ضسطش", "Sōd — nuqtasi yo'q, qalin «s». Zōd (ض) da tepasida bitta nuqta bor."),
  L("ض", "Zōd", "صظطش", "Zōd — tepasida bitta nuqta, qalin «d». Sōd (ص) da nuqta yo'q."),
  L("ط", "Tō", "ظصضك", "Tō — nuqtasi yo'q, qalin «t». Zō (ظ) da tepasida bitta nuqta bor."),
  L("ظ", "Zō", "طضصذ", "Zō — tepasida bitta nuqta, qalin «z». Tō (ط) da nuqta yo'q."),
  L("ع", "'Ayyn", "غحجف", "'Ayyn — nuqtasi yo'q; bo'g'izning chuqurligidan chiqadigan tovush. G'oyyn (غ) da tepasida nuqta bor."),
  L("غ", "G'oyyn", "عفخق", "G'oyyn — tepasida bitta nuqta; o'zbekcha «g'» ga yaqin. 'Ayyn (ع) da nuqta yo'q."),
  L("ف", "Fā", "قغون", "Fā — tepasida bitta nuqta. Qōf (ق) da tepasida ikkita nuqta bor."),
  L("ق", "Qōf", "فنغو", "Qōf — tepasida ikkita nuqta; «q» ga yaqin, lekin chuqurroq. Fā (ف) da bitta nuqta bor."),
  L("ك", "Kāf", "لاطق", "Kāf — nuqtasi yo'q, ichida kichik belgi bor. Lām (ل) dan shu bilan farqlanadi."),
  L("ل", "Lām", "اكطن", "Lām — nuqtasi yo'q, Alif (ا) ga o'xshash, lekin pastki qismi egilgan."),
  L("م", "Mīm", "وهفق", "Mīm — nuqtasi yo'q, kichik yumaloq «boshi» bor."),
  L("ن", "Nūn", "بتيز", "Nūn — tepasida bitta nuqta. Bā (ب) da tagida bitta, Tā (ت) da tepasida ikkita nuqta bor."),
  L("ه", "Hā", "حموخ", "Hā — nuqtasi yo'q, yengil «h» (nafas bilan). Ḥā (ح) dan farqli: u bo'g'izdan qattiq aytiladi."),
  L("و", "Vāv", "مرزف", "Vāv — nuqtasi yo'q, yumaloq «boshi» va dumi bor. «v» yoki cho'ziq «ū» tovushini beradi."),
  L("لا", "Lām-alif", "لاكط", "Lām-alif (لا) — Lām (ل) va Alif (ا) ning birikkan shakli; kitobda harflar qatoriga kiritilgan."),
  L("ي", "Yā", "بتنث", "Yā — tagida ikkita nuqta. Tā (ت) da tepasida ikkita nuqta bor."),
];
const byH = Object.fromEntries(LETTERS.map((x) => [x.h, x]));

const NUQTA = {
  yoq: "Nuqtasi yo'q", t1: "Tagida bitta nuqta", u1: "Tepasida bitta nuqta",
  u2: "Tepasida ikkita nuqta", u3: "Tepasida uchta nuqta", t2: "Tagida ikkita nuqta",
};
const NUQTA_OF = {
  ا: "yoq", ب: "t1", ت: "u2", ث: "u3", ج: "t1", ح: "yoq", خ: "u1", د: "yoq", ذ: "u1", ر: "yoq",
  ز: "u1", س: "yoq", ش: "u3", ص: "yoq", ض: "u1", ط: "yoq", ظ: "u1", ع: "yoq", غ: "u1", ف: "u1",
  ق: "u2", ك: "yoq", ل: "yoq", م: "yoq", ن: "u1", ه: "yoq", و: "yoq", لا: "yoq", ي: "t2",
};

// Taxminiy o'zbekcha yozuv (harakat bilan o'qishni ko'rsatish uchun).
const SND = {
  ا: "", ب: "b", ت: "t", ث: "s", ج: "j", ح: "h", خ: "x", د: "d", ذ: "z", ر: "r", ز: "z", س: "s",
  ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "'", غ: "g'", ف: "f", ق: "q", ك: "k", ل: "l",
  م: "m", ن: "n", ه: "h", و: "v", ي: "y",
};
const TAXMIN = new Set(["ث", "ص", "ط", "ح", "ض", "ذ", "ظ", "ع"]); // o'zbekchada aniq tovushi yo'q
const HK = { fatha: ["fatha", "a"], kasra: ["kasra", "i"], zamma: ["zamma", "u"] };
const MARKS3 = ["fatha", "kasra", "zamma"];

const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let s = hash(String(seed)) || 1; return () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; }; };
const shuffle = (a, r) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

const out = [];
function add(q, correct, wrongs, e, g) {
  const opts = [correct, ...wrongs];
  if (new Set(opts).size !== opts.length) throw new Error("takroriy variant: " + q);
  const sh = shuffle(opts, rngOf("c:" + q));
  out.push({ q, o: sh, c: sh.indexOf(correct), t: "Arab", e, g });
}
const pickWrong = (correctH, r) => {
  const fam = byH[correctH].fam.filter((x) => x !== correctH);
  const rest = LETTERS.map((x) => x.h).filter((x) => x !== correctH && !fam.includes(x));
  return [...shuffle(fam, r), ...shuffle(rest, r)].slice(0, 3);
};
const qNomHarf = (h, g) => add(`«${byH[h].n}» harfi qaysi?`, h, pickWrong(h, rngOf("w:" + h)), byH[h].iz, g);
const qHarfNom = (h, g) => add(`Bu harfning nomi nima?  ${h}`, byH[h].n, pickWrong(h, rngOf("v:" + h)).map((x) => byH[x].n), byH[h].iz, g);

// ——— 1-14 kun: harflar (kitobning 1-betidagi tartib)
const learned = [];
for (let d = 1; d <= 14; d++) {
  const yangi = d < 14 ? [LETTERS[2 * (d - 1)].h, LETTERS[2 * (d - 1) + 1].h] : [LETTERS[26].h, LETTERS[27].h, LETTERS[28].h];
  if (d < 14) {
    const [A, B] = yangi;
    qNomHarf(A, d);
    qHarfNom(B, d);
    if (d === 1) qNomHarf(B, d);
    else { const r = learned.shift(); (r.dir === "harf->nom" ? qHarfNom : qNomHarf)(r.h, d); }
    learned.push({ h: A, dir: "harf->nom" });
    if (d !== 1) learned.push({ h: B, dir: "nom->harf" });
  } else {
    // 14-kun: uchta yangi — و، لا، ي
    qNomHarf("و", d); qNomHarf("لا", d); qHarfNom("ي", d);
    learned.push({ h: "و", dir: "harf->nom" }, { h: "لا", dir: "harf->nom" }, { h: "ي", dir: "nom->harf" });
  }
}
for (const r of learned) (r.dir === "harf->nom" ? qHarfNom : qNomHarf)(r.h, 0);
for (const x of LETTERS) {
  const k = NUQTA_OF[x.h];
  const wrongs = shuffle(Object.keys(NUQTA).filter((z) => z !== k), rngOf("n:" + x.h)).slice(0, 3).map((z) => NUQTA[z]);
  add(`«${x.n}» harfi (${x.h}) nuqtalari qayerda va nechta?`, NUQTA[k], wrongs, x.iz, 0);
}

// ——— 15-28 kun: har harf uch harakat bilan (kitob tartibida) + kitobdagi so'z
const ORDER2 = ["ا", "ر", "ز", "م", "ت", "ن", "ي", "ب", "ك", "ل", "و", "ه", "ف", "ق", "ش", "س", "ث", "ص", "ط", "ج", "خ", "ح", "غ", "ع", "د", "ض", "ذ", "ظ"];
function qHarakat(g, h, mk) {
  const x = byH[h];
  const correct = `${x.n} + ${HK[mk][0]}`;
  const wrongs = MARKS3.filter((m) => m !== mk).map((m) => `${x.n} + ${HK[m][0]}`);
  wrongs.push(`${byH[x.fam[0]].n} + ${HK[mk][0]}`);
  const s = SND[h];
  add(`«${h}${MARK[mk]}» — qaysi harf va qanday harakat?`, correct, wrongs,
    `${h}${MARK[mk]} — «${s}${HK[mk][1]}». Kitobda har harf uch harakat bilan o'qitiladi: ${h}${MARK.fatha} ${h}${MARK.kasra} ${h}${MARK.zamma} — «${s}a, ${s}i, ${s}u»${TAXMIN.has(h) ? " (taxminiy yozuv)" : ""}.`, g);
}
const rom = (ps) => ps.map(([c, v]) => SND[c] + (v === "sukun" ? "" : HK[v][1])).join("");
const wordOf = (ps) => ps.map(([c, v]) => c + MARK[v]).join("");
function qSoz(g, parts, ma, bet) {
  const word = wordOf(parts), correct = rom(parts);
  const alts = new Set();
  parts.forEach(([c, v], i) => {
    if (v === "sukun") { alts.add(rom(parts.map((p, j) => (j === i ? [c, "fatha"] : p)))); return; }
    for (const a of MARKS3.filter((x) => x !== v)) alts.add(rom(parts.map((p, j) => (j === i ? [c, a] : p))));
  });
  alts.delete(correct);
  const w = shuffle([...alts], rngOf("s:" + word)).slice(0, 3);
  if (w.length < 3) throw new Error("variant yetmadi: " + word);
  add(`«${word}» qanday o'qiladi?`, correct, w,
    `${word} — «${correct}»${ma ? " (" + ma + ")" : ""}. Kitob, ${bet}-bet. Har harf o'z harakati bilan o'qiladi.`, g);
}
// Kitobdagi so'zlar (bet raqami bilan)
const SOZ = {
  15: [[["ا", "fatha"], ["ر", "sukun"]], null, 1],
  16: [[["م", "zamma"], ["ر", "sukun"]], "buyur", 2],
  17: [[["م", "kasra"], ["ن", "sukun"]], "«-dan»", 3],
  18: [[["ب", "fatha"], ["ي", "sukun"], ["ت", "zamma"]], "uy", 3],
  19: [[["ك", "zamma"], ["ن", "sukun"]], "bo'l", 4],
  20: [[["ه", "zamma"], ["و", "fatha"]], "u (erkak)", 5],
  21: [[["ف", "fatha"], ["م", "sukun"]], "og'iz", 5],
  22: [[["س", "kasra"], ["ن", "sukun"]], "tish", 7],
  23: [[["ث", "fatha"], ["م", "fatha"], ["ر", "sukun"]], "meva", 7],
  24: [[["ج", "fatha"], ["م", "fatha"], ["ل", "sukun"]], "tuya", 9],
  25: [[["خ", "fatha"], ["ب", "fatha"], ["ر", "sukun"]], "xabar", 9],
  26: [[["غ", "fatha"], ["م", "sukun"]], "g'am, qayg'u", 10],
  27: [[["د", "fatha"], ["ر", "sukun"], ["س", "zamma"]], "dars", 11],
  28: [[["ذ", "fatha"], ["ه", "fatha"], ["ب", "sukun"]], "oltin", 12],
};
for (let d = 15; d <= 28; d++) {
  const A = ORDER2[2 * (d - 15)], B = ORDER2[2 * (d - 15) + 1];
  qHarakat(d, A, MARKS3[d % 3]);
  qHarakat(d, B, MARKS3[(d + 1) % 3]);
  const [parts, ma, bet] = SOZ[d];
  qSoz(d, parts, ma, bet);
}

// ——— 29-35 kun: mad, tashdid, tanvin, shakllar, takror
const TAT_ = TAT;
const hk = (g, q, correct, wrongs, e) => add(q, correct, wrongs, e, g);
// 29 — mad (13-bet jadvali)
add("«بَا» qanday o'qiladi?", "bā — cho'ziq «ā»", ["ba — qisqa «a»", "bī — cho'ziq «ī»", "bū — cho'ziq «ū»"],
  "Fatha + Alif — «a» cho'ziladi: بَا — «bā». Kitob, 13-bet (madli so'zlar).", 29);
add("«بِي» qanday o'qiladi?", "bī — cho'ziq «ī»", ["bi — qisqa «i»", "bā — cho'ziq «ā»", "bū — cho'ziq «ū»"],
  "Kasra + Yā — «i» cho'ziladi: بِي — «bī». Kitob, 13-bet.", 29);
add("«بُو» qanday o'qiladi?", "bū — cho'ziq «ū»", ["bu — qisqa «u»", "bā — cho'ziq «ā»", "bī — cho'ziq «ī»"],
  "Zamma + Vāv — «u» cho'ziladi: بُو — «bū». Kitob, 13-bet.", 29);
// 30 — mad qoidasi
hk(30, "Fatha + Alif, Kasra + Yā, Zamma + Vāv — qanday o'qiladi?", "Unli cho'zib o'qiladi", ["Qisqa o'qiladi", "Harf ikki marta o'qiladi", "Harf o'qilmaydi"],
  "Bu — mad (cho'zish): unli ovoz cho'zib, davomli aytiladi. Cho'ziq «ā», «ī», «ū».");
add("Qaysi birida «a» tovushi cho'ziladi?", "تَا", ["تَ", "تِ", "تُ"], "Fatha + Alif (تَا) — «tā», «a» cho'ziladi. Boshqalarida unli qisqa.", 30);
add("«مُو» qanday o'qiladi?", "mū — cho'ziq «ū»", ["mu — qisqa «u»", "mā — cho'ziq «ā»", "mī — cho'ziq «ī»"], "Zamma + Vāv — «u» cho'ziladi: مُو — «mū».", 30);
// 31 — tashdid (16-bet)
hk(31, `Harf ustidagi «w» shaklidagi belgi (${TAT_}${MARK.shadda}) nimani bildiradi?`, "Harf ikki marta o'qiladi",
  ["Harf cho'ziladi", "Harf unlisiz o'qiladi", "Harf o'qilmaydi"],
  "Tashdid — ustidagi belgi qo'yilgan harf ikki martadan aytib o'qiladi (kitob, 16-bet): رَبِّ — «rabbi» (b ikki marta).");
add("«رَبِّ» qanday o'qiladi?", "rabbi", ["rabi", "rabbu", "rubbi"], "Tashdidli ب ikki marta o'qiladi: رَبِّ — «rabbi» (Robbim, Parvardigorim).", 31);
add("«مَدَّ» qanday o'qiladi?", "madda", ["mada", "maddi", "madu"], "Tashdidli د ikki marta o'qiladi: مَدَّ — «madda» (cho'zdi).", 31);
// 32 — tanvin (19-bet)
hk(32, "Harf ustida yoki tagida ikkita harakat (tanvin) kelsa, qanday tovush qo'shiladi?", "Oxirida sukunli «n» (-an, -in, -un)",
  ["Oxirida «a» cho'ziladi", "Boshida «n» qo'shiladi", "Harf ikki marta o'qiladi"],
  "Tanvin — so'z oxirida sukunli «n» qo'shib o'qiladi (kitob, 19-bet): ــً — «-an», ــٍ — «-in», ــٌ — «-un».");
add("«تٌ» qanday o'qiladi?", "tun", ["tan", "tin", "tu"], "Zamma tanvini (ــٌ): «-un» tovushi. Demak, تٌ — «tun».", 32);
add("«لٍ» qanday o'qiladi?", "lin", ["lan", "lun", "li"], "Kasra tanvini (ــٍ): «-in» tovushi. Demak, لٍ — «lin».", 32);
// 33, 34 — harf shakllari (qo'shib yozish)
const shakl = { yakka: (h) => h, bosh: (h) => h + TAT, orta: (h) => TAT + h + TAT, oxir: (h) => TAT + h };
const NOM = { yakka: "yakka", bosh: "so'z BOSHIDAGI (keyingisiga ulangan)", orta: "so'z O'RTASIDAGI (ikki tomonga ulangan)", oxir: "so'z OXIRIDAGI (oldingisiga ulangan)" };
function qShakl(g, h, joy) {
  const x = byH[h];
  const w = ["yakka", "bosh", "orta", "oxir"].filter((j) => j !== joy).map((j) => shakl[j](h));
  add(`«${x.n}» (${h}) harfining ${NOM[joy]} shakli qaysi?`, shakl[joy](h), w,
    `${x.n}: yakka ${h}, boshida ${shakl.bosh(h)}, o'rtasida ${shakl.orta(h)}, oxirida ${shakl.oxir(h)}. Chiziqcha (${TAT}) — ulanish joyi.`, g);
}
qShakl(33, "ب", "bosh"); qShakl(33, "ت", "orta"); qShakl(33, "ن", "oxir");
qShakl(34, "ك", "bosh"); qShakl(34, "م", "orta");
hk(34, "Qaysi harf o'zidan KEYINGI harfga ulanmaydi?", "ا (Alif)", ["ب (Bā)", "ت (Tā)", "ن (Nūn)"],
  "O'zidan keyingi harfga ulanmaydigan olti harf: ا د ذ ر ز و. Keyingi harf ulanmay, yangi so'zdek boshlanadi.");
// 35 — yakuniy takror
hk(35, "Qaysi harakat «i» tovushini beradi?", "Kasra", ["Fatha", "Zamma", "Sukun"], "Kasra — harf tagidagi qiya chiziq, «i» tovushi. Fatha — «a», Zamma — «u».");
qSoz(35, [["ك", "fatha"], ["ت", "fatha"], ["ب", "fatha"]], "yozdi", 4);
hk(35, "Harf ustidagi kichik doira belgisi qanday ataladi?", "Sukun", ["Fatha", "Tashdid", "Tanvin"], "Sukun — kichik doira: harf unlisiz, qisqa o'qiladi. Masalan, مِنْ — «min».");

console.log(JSON.stringify(out, null, 1));
