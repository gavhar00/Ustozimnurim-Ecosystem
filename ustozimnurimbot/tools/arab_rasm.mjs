// Arabcha savollar uchun rasm HTML sahifalarini quradi (kalit bo'yicha noyob).
// Ishlatish: node tools/arab_rasm.mjs  →  tools/rasm/sahifa-N.html + tools/rasm/manifest.json
import fs from "node:fs";
import { rasmTuri } from "../src/rasm.js";

const bank = JSON.parse(fs.readFileSync(new URL("../src/quiz_bank.json", import.meta.url), "utf8"));
const xarita = new Map();
for (const q of bank) { const r = rasmTuri(q); if (r && !r.kalit.startsWith("q:") && !xarita.has(r.kalit)) xarita.set(r.kalit, r); }
const royxat = [...xarita.values()];

const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{width:1000px;background:#FBF7EE;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif}
.k{width:1000px;height:520px;position:relative;background:radial-gradient(520px 320px at 50% 48%,#fff,#FBF7EE);border-bottom:1px solid #FBF7EE;display:flex;align-items:center;justify-content:center}
.k:before{content:"";position:absolute;inset:14px;border:2px solid #E8DFC6;border-radius:28px}
.ar{font-family:"Geeza Pro","Noto Naskh Arabic","Al Nile",serif;direction:rtl;color:#1f1a10;line-height:1.5;white-space:nowrap}
.tag{position:absolute;left:40px;top:30px;font-size:22px;letter-spacing:4px;color:#a98a1f;font-weight:700}
.row{display:flex;gap:22px;direction:ltr;padding:0 46px;width:100%;justify-content:center}
.c{flex:1;background:#fff;border:2px solid #E8DFC6;border-radius:24px;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.n{position:absolute;top:14px;left:18px;width:46px;height:46px;border-radius:50%;background:#E2B93B;color:#1f1a10;font-weight:800;font-size:26px;display:flex;align-items:center;justify-content:center}`;
const size = (m) => { const n = [...m.replace(/[ً-ْـ]/g, "")].length; return n <= 1 ? 330 : n <= 3 ? 230 : n <= 5 ? 170 : 120; };
const kart = (r) => r.tur === "a"
  ? `<div class="k"><div class="tag">ARAB ALIFBOSI</div><div class="ar" style="font-size:${size(r.matn)}px">${r.matn}</div></div>`
  : `<div class="k"><div class="tag">VARIANTLAR</div><div class="row">${r.variantlar.map((v, i) =>
      `<div class="c"><div class="n">${i + 1}</div><div class="ar" style="font-size:${size(v) > 200 ? 150 : 100}px">${v}</div></div>`).join("")}</div></div>`;

const SAHIFA = 24;   // bitta sahifada nechta kartochka (Chrome balandlik chegarasi)
const manifest = [];
for (let s = 0; s * SAHIFA < royxat.length; s++) {
  const qism = royxat.slice(s * SAHIFA, (s + 1) * SAHIFA);
  fs.writeFileSync(new URL(`./rasm/sahifa-${s}.html`, import.meta.url),
    `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${qism.map(kart).join("")}</body></html>`);
  qism.forEach((r, i) => manifest.push({ kalit: r.kalit, sahifa: s, indeks: i }));
}
fs.writeFileSync(new URL("./rasm/manifest.json", import.meta.url), JSON.stringify(manifest));
console.log(royxat.length, "ta rasm,", Math.ceil(royxat.length / SAHIFA), "ta sahifa");
