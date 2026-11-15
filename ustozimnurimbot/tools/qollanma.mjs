// Arab alifbosi qo'llanma rasmlari uchun HTML quradi (3 ta sahifa).
// Arabcha matn KODDAN hosil qilinadi (Unicode kodlari) — qo'lda yozilmaydi.
// Harf nomlari esa tools/arab_gen.mjs dagi LETTERS jadvalidan olinadi,
// shuning uchun rasm va savollar bir-biridan farq qilmaydi.
import fs from "node:fs";

const gen = fs.readFileSync(new URL("./arab_gen.mjs", import.meta.url), "utf8");
const LET = [...gen.matchAll(/L\("([^"]+)", "([^"]+)"/g)].map((m) => ({ c: m[1], n: m[2] }));
if (LET.length !== 29) throw new Error("harflar soni 29 emas: " + LET.length);

const u = (...k) => String.fromCodePoint(...k);
const BA = u(0x628), ALIF = u(0x627), YA = u(0x64A), WAW = u(0x648), MIM = u(0x645), RA = u(0x631);
const FATHA = u(0x64E), KASRA = u(0x650), ZAMMA = u(0x64F), SUKUN = u(0x652), SHADDA = u(0x651);
const TAN_A = u(0x64B), TAN_K = u(0x64D), TAN_Z = u(0x64C), TATWEEL = u(0x640);

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;background:#FBF7EE;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;color:#1f1a10;padding:44px 48px 40px}
.ar{font-family:"Geeza Pro","Noto Naskh Arabic","Al Nile","Arial",serif;direction:rtl}
h1{font-size:46px;letter-spacing:.2px;color:#1f1a10}
.sub{font-size:25px;color:#7a6a3a;margin:8px 0 26px}
.bar{height:6px;background:#C9A227;border-radius:3px;margin-bottom:28px}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;direction:rtl}
.cell{background:#fff;border:2px solid #E8DFC6;border-radius:20px;text-align:center;padding:10px 4px 12px}
.cell .ar{font-size:84px;line-height:1.35}
.cell .nm{font-size:26px;font-weight:700;color:#8a6d0b;direction:ltr}
.foot{margin-top:26px;font-size:23px;color:#7a6a3a;text-align:center}
table{width:100%;border-collapse:separate;border-spacing:0 12px}
td{background:#fff;padding:14px 22px;font-size:30px;vertical-align:middle}
td:first-child{border-radius:18px 0 0 18px;border:2px solid #E8DFC6;border-right:0;width:34%;font-weight:700}
td:last-child{border-radius:0 18px 18px 0;border:2px solid #E8DFC6;border-left:0;color:#4b4228}
td.m{border-top:2px solid #E8DFC6;border-bottom:2px solid #E8DFC6;text-align:center;width:22%}
td.m .ar{font-size:68px;line-height:1.4}
.tag{font-size:22px;color:#8a6d0b;font-weight:600;display:block;margin-top:2px}
.f4{display:grid;grid-template-columns:1fr 1fr;gap:0 26px}
.row{display:grid;grid-template-columns:118px repeat(4,1fr);align-items:center;background:#fff;border:2px solid #E8DFC6;border-radius:16px;margin-bottom:10px;padding:2px 14px;text-align:center}
.row .nm{font-size:24px;font-weight:700;color:#8a6d0b;text-align:left}
.row .ar{font-size:44px;line-height:1.55;white-space:nowrap}
.hd{display:grid;grid-template-columns:118px repeat(4,1fr);font-size:20px;color:#7a6a3a;text-align:center;margin:0 14px 6px}
`;

const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

// 1) Harflar
const cells = LET.map((l) => `<div class="cell"><div class="ar">${l.c}</div><div class="nm">${l.n}</div></div>`).join("");
const alifbo = page(`
<h1>Arab alifbosi — 29 ta harf</h1>
<div class="sub">«Muallim soniy» kitobi tartibida · o'ngdan chapga o'qiladi ➜</div>
<div class="bar"></div>
<div class="grid">${cells}</div>
<div class="foot">Ko'k rangdagi nomlar — harfning o'qilishi. Nuqtalar soni va o'rniga e'tibor bering.</div>`.replace("Ko'k rangdagi nomlar", "Tagidagi nomlar"));

// 2) Harakatlar
const R = (arab, lat, nom, izoh) =>
  `<tr><td>${nom}<span class="tag">${izoh}</span></td><td class="m"><div class="ar">${arab}</div></td><td>${lat}</td></tr>`;
const harakat = page(`
<h1>Harakatlar va belgilar</h1>
<div class="sub">Harf ustida/tagida turib, qanday o'qilishini ko'rsatadi</div>
<div class="bar"></div>
<table>
${R(BA + FATHA, "ba — qisqa «a»", "Fatha", "harf ustida chiziqcha")}
${R(BA + KASRA, "bi — qisqa «i»", "Kasra", "harf tagida chiziqcha")}
${R(BA + ZAMMA, "bu — qisqa «u»", "Zamma", "harf ustida kichik belgi")}
${R(BA + SUKUN, "b — unlisiz, qisqa", "Sukun", "kichik doira")}
${R(BA + FATHA + ALIF, "bā — cho'ziq «ā»", "Mad", "fatha + Alif")}
${R(BA + KASRA + YA, "bī — cho'ziq «ī»", "Mad", "kasra + Yā")}
${R(BA + ZAMMA + WAW, "bū — cho'ziq «ū»", "Mad", "zamma + Vāv")}
${R(RA + FATHA + BA + SHADDA + KASRA, "rabbi — harf 2 marta", "Tashdid", "«w» shaklidagi belgi")}
${R(BA + TAN_A, "-an (ban)", "Tanvin", "so'z oxirida «n» qo'shiladi")}
${R(BA + TAN_K, "-in (bin)", "Tanvin", "ikkita kasra")}
${R(BA + TAN_Z, "-un (bun)", "Tanvin", "ikkita zamma")}
</table>`);

// 3) Harf shakllari
const NOJOIN = new Set([u(0x627), u(0x62F), u(0x630), u(0x631), u(0x632), u(0x648)]);
const rows = LET.filter((l) => l.c.length === 1).map((l) => {
  const j = !NOJOIN.has(l.c);
  const ini = j ? l.c + TATWEEL : "—", med = j ? TATWEEL + l.c + TATWEEL : "—";
  const fin = TATWEEL + l.c;
  return `<div class="row"><div class="nm">${l.n}</div><div class="ar">${l.c}</div><div class="ar">${fin}</div><div class="ar">${med}</div><div class="ar">${ini}</div></div>`;
});
const half = Math.ceil(rows.length / 2);
const shakl = page(`
<h1>Harf shakllari</h1>
<div class="sub">Harf so'z ichida joyiga qarab o'zgaradi (o'ngdan chapga)</div>
<div class="bar"></div>
<div class="f4"><div><div class="hd"><span></span><span>yakka</span><span>oxirida</span><span>o'rtada</span><span>boshida</span></div>${rows.slice(0, half).join("")}</div>
<div><div class="hd"><span></span><span>yakka</span><span>oxirida</span><span>o'rtada</span><span>boshida</span></div>${rows.slice(half).join("")}</div></div>
<div class="foot">«—» : bu harflar keyingi harfga ulanmaydi (Alif, Dāl, Zāl, Rō, Zā, Vāv).</div>`);

fs.mkdirSync(new URL("./qollanma/", import.meta.url), { recursive: true });
for (const [n, h] of Object.entries({ alifbo, harakat, shakl }))
  fs.writeFileSync(new URL(`./qollanma/${n}.html`, import.meta.url), h);
console.log("HTML tayyor");
