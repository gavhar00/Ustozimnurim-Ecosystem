// Qiyin va interaktiv viktorina savollari: bir nechta to'g'ri javobli pollar + rasmli savollar.
// Ishlatish: node tools/qiyin_gen.mjs
//   → src/quiz_bank.json ga h:true belgili savollarni yozadi (eskilarini almashtiradi)
//   → tools/qiyin/*.jpg  va  tools/qiyin/yukla.sql  (rasm jadvaliga, kalit "q:<id>")
// Kod chiqishlari (JS) shu skript ichida HAQIQATAN ishga tushirib tekshiriladi.
import fs from "node:fs";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const bankYoli = new URL("../src/quiz_bank.json", import.meta.url);
const dir = new URL("./qiyin/", import.meta.url).pathname;
fs.mkdirSync(dir, { recursive: true });
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ───────────── BIR NECHTA TO'G'RI JAVOBLI (cs = to'g'ri indekslar)
const KO = [];   // {t, q, o, cs, e}
const multi = (t, q, o, cs, e) => KO.push({ q, o, c: cs[0], cs, t, h: true, e });

multi("IT", "Qaysilari DASTURLASH tillari? (hammasini belgilang)", ["Python", "HTML", "JavaScript", "CSS", "Java"], [0, 2, 4],
  "Python, JavaScript va Java — dasturlash tillari. HTML — belgilash (markup), CSS — uslub tili: ular mantiq/hisoblash bajarmaydi.");
multi("IT", "JavaScriptda qaysilari PRIMITIV tiplar?", ["string", "number", "object", "boolean", "array"], [0, 1, 3],
  "Primitivlar: string, number, boolean (shuningdek undefined, null, symbol, bigint). object va array — murakkab (reference) tiplar.");
multi("IT", "Qaysilari HTTP metodlari?", ["GET", "POST", "FETCH", "PUT", "SEND"], [0, 1, 3],
  "HTTP metodlari: GET, POST, PUT, PATCH, DELETE. fetch() — brauzer funksiyasi, SEND esa metod emas.");
multi("IT", "Qaysilari Git buyruqlari?", ["commit", "push", "deploy", "clone", "run"], [0, 1, 3],
  "git commit, git push, git clone — haqiqiy buyruqlar. deploy va run — Git buyrug'i emas.");
multi("IT", "Qaysilari MA'LUMOTLAR BAZASI boshqaruv tizimlari?", ["PostgreSQL", "Docker", "MySQL", "React", "SQLite"], [0, 2, 4],
  "PostgreSQL, MySQL, SQLite — ma'lumotlar bazalari. Docker — konteynerlar, React — interfeys kutubxonasi.");
multi("IT", "Qaysilari React HOOK'lari?", ["useState", "useEffect", "useRouter", "useMemo", "useFetch"], [0, 1, 3],
  "useState, useEffect, useMemo — React'ning ichki hook'lari. useRouter — Next.js'niki, useFetch esa standart hook emas.");
multi("IT", "Qaysilari CSS xossalari?", ["color", "margin", "onclick", "padding", "href"], [0, 1, 3],
  "color, margin, padding — CSS xossalari. onclick va href — HTML atributlari.");
multi("IT", "Qaysilari HTML teglari?", ["div", "span", "print", "section", "echo"], [0, 1, 3],
  "div, span, section — HTML teglari. print va echo — dasturlash tillaridagi chiqarish buyruqlari.");

multi("Ingliz", "Qaysi gaplar PRESENT PERFECT zamonida?", ["She has finished.", "She finished yesterday.", "I have seen it.", "They are playing.", "We had left."], [0, 2],
  "Present Perfect: have/has + V3. 'She has finished' va 'I have seen it'. 'finished yesterday' — Past Simple, 'are playing' — Continuous, 'had left' — Past Perfect.");
multi("Ingliz", "Qaysi so'zlar PAST SIMPLE bilan ishlatiladi?", ["yesterday", "since", "ago", "just", "last year"], [0, 2, 4],
  "yesterday, ago, last year — tugagan o'tmish vaqti → Past Simple. since va just — odatda Present Perfect bilan.");
multi("Ingliz", "Qaysi so'zlar SANALMAYDIGAN otlar?", ["water", "information", "book", "advice", "apple"], [0, 1, 3],
  "water, information, advice — sanalmaydi (a/an va -s olmaydi). book va apple sanaladi.");
multi("Ingliz", "Qaysi gaplarda grammatik xato YO'Q?", ["He doesn't like tea.", "She don't know.", "I have been here since Monday.", "They was late.", "We went to the park."], [0, 2, 4],
  "To'g'ri: 'doesn't like', 'have been ... since', 'went'. Xato: 'She don't' (doesn't bo'lishi kerak), 'They was' (were).");
multi("Ingliz", "Qaysilari MODAL fe'llar?", ["can", "must", "go", "should", "eat"], [0, 1, 3],
  "can, must, should — modal fe'llar (keyin to'siz fe'l keladi). go va eat — oddiy fe'llar.");
multi("Ingliz", "Qaysi fe'llarning o'tgan zamon (V2) shakli TO'G'RI?", ["go → went", "buy → bought", "teach → teached", "have → had", "write → writed"], [0, 1, 3],
  "To'g'ri: go→went, buy→bought, have→had. teach→taught, write→wrote (teached, writed xato).");
multi("Ingliz", "Qaysilari ARTIKLLAR (articles)?", ["a", "an", "the", "this", "some"], [0, 1, 2],
  "Artikllar faqat uchta: a, an, the. this va some — boshqa aniqlovchilar.");
multi("Ingliz", "Qaysi so'zlar PREDLOG (preposition)?", ["in", "on", "quickly", "at", "because"], [0, 1, 3],
  "in, on, at — predloglar. quickly — ravish, because — bog'lovchi.");
multi("Ingliz", "Qaysi gaplar PASSIVE VOICE (majhul nisbat)da?", ["The book was written by him.", "He wrote a book.", "The house is being built.", "She is reading.", "The letter has been sent."], [0, 2, 4],
  "Passive: be + V3 (was written, is being built, has been sent). 'He wrote' va 'is reading' — aktiv.");
multi("Ingliz", "Qaysi gaplar FIRST CONDITIONAL (real kelajak)?", ["If it rains, we will stay home.", "If I were rich, I would travel.", "If you study, you will pass.", "If he had known, he would have come.", "If she calls, I will answer."], [0, 2, 4],
  "First Conditional: If + Present Simple, will + V1. 'were...would' — Second, 'had known...would have' — Third conditional.");

// ───────────── KOD RASMLI SAVOLLAR (JS chiqishi haqiqatan hisoblanadi)
const KODLAR = [];
const kod = (id, til, src, savol, to_g_ri, notogri, e, eval_) => KODLAR.push({ id, til, src, savol, to_g_ri, notogri, e, eval_ });

kod("k1", "js", `console.log(typeof null);`, "Rasmdagi kod nimani chiqaradi?", "object", ["null", "undefined", "number"],
  "JavaScriptdagi mashhur xususiyat: typeof null → 'object' (tilning eski xatosi).", "object");
kod("k2", "js", `console.log(0.1 + 0.2 === 0.3);`, "Rasmdagi kod nimani chiqaradi?", "false", ["true", "undefined", "NaN"],
  "Suzuvchi nuqtali sonlar aniq emas: 0.1 + 0.2 = 0.30000000000000004, shuning uchun tenglik false.", "false");
kod("k3", "js", `let a = [1, 2, 3];\nlet b = a;\nb.push(4);\nconsole.log(a.length);`, "Rasmdagi kod nimani chiqaradi?", "4", ["3", "undefined", "xato beradi"],
  "Massiv — reference tip: b va a bitta massivga ishora qiladi, push ikkalasida ko'rinadi.", "4");
kod("k4", "js", `console.log("5" + 3, "5" - 3);`, "Rasmdagi kod nimani chiqaradi?", "53 2", ["8 2", "53 53", "8 8"],
  "'+' satr bilan birlashtiradi ('53'), '-' esa sonlarga aylantirib ayiradi (2).", "53 2");
kod("k5", "js", `for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}`, "Rasmdagi kod nimani (3 qatorda) chiqaradi?", "3 3 3", ["0 1 2", "0 0 0", "undefined x3"],
  "var funksiya doirasida bitta o'zgaruvchi: setTimeout ishlaganda sikl tugagan va i = 3 bo'ladi. let bilan 0 1 2 chiqardi.", "3 3 3");
kod("k6", "js", `console.log(\n  [1, 2, 3]\n    .map(n => n * 2)\n    .filter(n => n > 2)\n    .length\n);`, "Rasmdagi kod nimani chiqaradi?", "2", ["3", "1", "6"],
  "map → [2, 4, 6]; filter(n > 2) → [4, 6]; uzunligi 2.", "2");
kod("k7", "py", `x = [1, 2, 3]\nprint(x[-1] + len(x))`, "Rasmdagi Python kodi nimani chiqaradi?", "6", ["4", "5", "xato beradi"],
  "x[-1] — oxirgi element (3), len(x) = 3, yig'indi 6.", "6");
kod("k8", "js", `console.log([] + []);\nconsole.log([] + {} === "[object Object]");`, "Rasmdagi kod 2 qatorda nima chiqaradi?", "(bo'sh qator) va true", ["0 va false", "[] va true", "undefined va false"],
  "[] + [] → bo'sh satr (massivlar satrga aylanadi). [] + {} → '' + '[object Object]' — tenglik true.", "\ntrue");

// JS kodlarini haqiqatan ishga tushirib chiqishini tekshiramiz
for (const k of KODLAR.filter((x) => x.til === "js")) {
  let chiqish = "";
  const sandbox = { console: { log: (...a) => { chiqish += a.join(" ") + "\n"; } }, setTimeout: (f) => f() };
  // var-sikl natijasini haqiqiy hodisa tsikli o'rniga oxirgi i bilan hisoblaymiz (k5): setTimeout navbatga qo'yiladi
  if (k.id === "k5") { chiqish = "3\n3\n3\n"; }
  else vm.runInNewContext(k.src, sandbox);
  const kutilgan = k.id === "k5" ? "3\n3\n3\n" : k.eval_ === undefined ? "" : k.eval_.replace(/\n$/, "") + "\n";
  if (k.id !== "k5" && chiqish.trim() !== kutilgan.trim()) throw new Error(`${k.id}: kod chiqishi ${JSON.stringify(chiqish)} ≠ ${JSON.stringify(kutilgan)}`);
}
// k5 ni alohida haqiqiy hodisa tsikli bilan tekshiramiz
{ let o = []; await new Promise((res) => { vm.runInNewContext(`for (var i = 0; i < 3; i++) { setTimeout(() => out.push(i), 0); }`, { out: o, setTimeout }); setTimeout(res, 20); });
  if (o.join(" ") !== "3 3 3") throw new Error("k5: " + o); }
// k7 (Python) ni tekshirish
const py = execFileSync("python3", ["-c", "x=[1,2,3]\nprint(x[-1]+len(x))"]).toString().trim();
if (py !== "6") throw new Error("k7 python: " + py);

// ───────────── MANTIQ RASMLI SAVOLLAR (javoblar kodda hisoblanadi)
const MANTIQ = [];
// 1) nuqtali uchburchaklar 1,3,6,10 → ?
{
  const tri = (n) => { let s = ""; for (let r = 1; r <= n; r++) { s += `<div class="rw">${"<i></i>".repeat(r)}</div>`; } return `<div class="tri">${s}</div>`; };
  const javob = 15;
  MANTIQ.push({ id: "m1", w: 900, h: 420, savol: "Keyingi shaklda nechta nuqta bo'ladi?", javob: String(javob), boshqa: ["14", "16", "12"],
    e: "Nuqtalar soni: 1, 3, 6, 10 — har safar bir qator ko'payadi (+2, +3, +4), keyingisi +5 → 15 (uchburchak sonlar).",
    html: `<style>.tri{display:flex;flex-direction:column;align-items:center;gap:6px}.rw{display:flex;gap:6px}i{width:22px;height:22px;border-radius:50%;background:#E2B93B}.row{display:flex;gap:70px;align-items:center;justify-content:center;height:100%}.q{font-size:110px;color:#9a8a60;font-weight:700}</style><div class="row">${[1, 2, 3, 4].map(tri).join("")}<div class="q">?</div></div>` });
}
// 2) 3x3 sehrli kvadrat
{
  const g = [[8, 1, 6], [3, 5, 7], [4, 9, 2]];
  const javob = g[2][1];
  const kat = g.map((r, i) => r.map((v, j) => `<div class="c${i === 2 && j === 1 ? " q" : ""}">${i === 2 && j === 1 ? "?" : v}</div>`).join("")).join("");
  MANTIQ.push({ id: "m2", w: 700, h: 520, savol: "Har qator yig'indisi bir xil. «?» o'rniga qaysi son kerak?", javob: String(javob), boshqa: ["7", "10", "11"],
    e: "Birinchi qator: 8+1+6 = 15. Uchinchi qatorda 4 + ? + 2 = 15 bo'lishi kerak, demak ? = 9.",
    html: `<style>.g{display:grid;grid-template-columns:repeat(3,130px);gap:12px;justify-content:center;align-content:center;height:100%}.c{height:130px;background:#fff;border:2px solid #E8DFC6;border-radius:20px;display:flex;align-items:center;justify-content:center;font:700 64px -apple-system,Arial;color:#1f1a10}.q{background:#E2B93B;color:#1f1a10;border-color:#E2B93B}</style><div class="g">${kat}</div>` });
}
// 3) strelkalar 45° ga aylanadi
{
  const ang = [0, 45, 90, 135];   // ↑ ↗ → ↘ keyin 180° = ↓
  const javob = "↓";
  const strelka = ang.map((a) => `<div class="s" style="transform:rotate(${a}deg)">↑</div>`).join("") + `<div class="s q">?</div>`;
  MANTIQ.push({ id: "m3", w: 1000, h: 300, savol: "Strelka har safar bir xil burchakka buriladi. Keyingisi qaysi?", javob, boshqa: ["←", "↙", "↖"],
    e: "Har qadamda strelka 45° soat strelkasi bo'ylab buriladi: ↑ ↗ → ↘ → keyingisi ↓.",
    html: `<style>.r{display:flex;gap:34px;align-items:center;justify-content:center;height:100%}.s{width:130px;height:130px;background:#fff;border:2px solid #E8DFC6;border-radius:24px;display:flex;align-items:center;justify-content:center;font:700 90px Arial;color:#1f1a10}.q{background:#E2B93B;border-color:#E2B93B;color:#1f1a10}</style><div class="r">${strelka}</div>` });
}
// 4) soat
{
  const h = 3, m = 40;
  const ha = (h % 12) * 30 + m * 0.5, ma = m * 6;
  const tick = Array.from({ length: 12 }, (_, i) => `<line x1="150" y1="22" x2="150" y2="38" stroke="#1f1a10" stroke-width="4" transform="rotate(${i * 30} 150 150)"/><text x="${150 + 100 * Math.sin(((i || 12) * 30) * Math.PI / 180)}" y="${150 - 100 * Math.cos(((i || 12) * 30) * Math.PI / 180) + 9}" text-anchor="middle" font-size="26" font-family="Arial" font-weight="700" fill="#1f1a10">${i || 12}</text>`).join("");
  MANTIQ.push({ id: "m4", w: 500, h: 500, savol: "Rasmdagi soat nechchi? (qisqa strelka — soat, uzun — daqiqa)", javob: "3:40", boshqa: ["4:40", "3:08", "2:40"],
    e: "Uzun strelka 8 raqamida — 40 daqiqa. Qisqa strelka 3 va 4 orasida (4 ga yaqin) — soat 3. Demak 3:40.",
    html: `<svg width="420" height="420" viewBox="0 0 300 300" style="display:block;margin:40px auto"><circle cx="150" cy="150" r="140" fill="#fff" stroke="#E2B93B" stroke-width="8"/>${tick}<line x1="150" y1="150" x2="150" y2="70" stroke="#1f1a10" stroke-width="9" stroke-linecap="round" transform="rotate(${ha} 150 150)"/><line x1="150" y1="150" x2="150" y2="40" stroke="#c98f12" stroke-width="5" stroke-linecap="round" transform="rotate(${ma} 150 150)"/><circle cx="150" cy="150" r="9" fill="#1f1a10"/></svg>` });
}
// 5) bo'yalgan kataklar (chegara + markaz)
{
  let soni = 0; let kat = "";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const on = r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2);
    if (on) soni++;
    kat += `<div class="k${on ? " on" : ""}"></div>`;
  }
  MANTIQ.push({ id: "m5", w: 560, h: 560, savol: "Rasmdagi to'rda nechta katak bo'yalgan?", javob: String(soni), boshqa: ["16", "20", "13"],
    e: "Chegara: 5×4 − 4 = 16 ta katak, markazda yana 1 ta. Jami 17.",
    html: `<style>.g{display:grid;grid-template-columns:repeat(5,80px);gap:6px;justify-content:center;align-content:center;height:100%}.k{width:80px;height:80px;background:#fff;border:2px solid #E8DFC6;border-radius:10px}.on{background:#E2B93B;border-color:#E2B93B}</style><div class="g">${kat}</div>` });
}
// 6) ortiqcha son
{
  const sonlar = [2, 3, 5, 9, 7, 11, 13];
  const tub = (n) => n > 1 && [...Array(n).keys()].slice(2).every((d) => n % d);
  const ortiqcha = sonlar.filter((n) => !tub(n));
  if (ortiqcha.length !== 1) throw new Error("m6");
  MANTIQ.push({ id: "m6", w: 1000, h: 260, savol: "Rasmdagi sonlardan qaysi biri ortiqcha?", javob: String(ortiqcha[0]), boshqa: ["2", "11", "13"],
    e: "2, 3, 5, 7, 11, 13 — tub sonlar. 9 = 3×3, u tub emas, shuning uchun ortiqcha.",
    html: `<style>.r{display:flex;gap:26px;align-items:center;justify-content:center;height:100%}.n{width:110px;height:110px;background:#fff;border:2px solid #E8DFC6;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 54px Arial;color:#1f1a10}</style><div class="r">${sonlar.map((n) => `<div class="n">${n}</div>`).join("")}</div>` });
}

// ───────────── RENDER
const CSS_KARD = `*{margin:0;padding:0;box-sizing:border-box}body{background:radial-gradient(60% 60% at 50% 50%,#fff,#FBF7EE)}`;
const CSS_KOD = `*{margin:0;padding:0;box-sizing:border-box}body{background:#0f1115;padding:34px;font-family:"SF Mono",Menlo,Consolas,monospace}
.bar{display:flex;gap:10px;margin-bottom:22px}.bar i{width:16px;height:16px;border-radius:50%;background:#ff5f57}.bar i:nth-child(2){background:#febc2e}.bar i:nth-child(3){background:#28c840}
.til{color:#E2B93B;font-size:20px;letter-spacing:4px;margin-left:auto;font-family:Arial;font-weight:700}
pre{color:#e6e6e6;font-size:34px;line-height:1.55;white-space:pre}
.ln{color:#4b5263;display:inline-block;width:46px}`;

function render(id, html, w, h) {
  const f = `${dir}${id}.html`;
  fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${w},${h}`, `--screenshot=${dir}${id}.png`, `file://${f}`], { stdio: "ignore" });
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "86", `${dir}${id}.png`, "--out", `${dir}${id}.jpg`], { stdio: "ignore" });
  return fs.readFileSync(`${dir}${id}.jpg`).toString("base64");
}

let sql = "";
const bankChiq = [];
for (const k of KODLAR) {
  const satrlar = k.src.split("\n");
  const w = 1000, h = 130 + satrlar.length * 53 + 60;
  const html = `<style>${CSS_KOD}</style><div class="bar"><i></i><i></i><i></i><span class="til">${k.til === "py" ? "PYTHON" : "JAVASCRIPT"}</span></div><pre>${satrlar.map((s, i) => `<span class="ln">${i + 1}</span>${esc(s)}`).join("\n")}</pre>`;
  sql += `INSERT OR REPLACE INTO rasm (k, b) VALUES ('q:${k.id}', '${render(k.id, html, w, h)}');\n`;
  bankChiq.push({ q: k.savol, o: [k.to_g_ri, ...k.notogri], c: 0, t: "IT", h: true, img: k.id, e: k.e });
}
for (const m of MANTIQ) {
  sql += `INSERT OR REPLACE INTO rasm (k, b) VALUES ('q:${m.id}', '${render(m.id, `<style>${CSS_KARD}</style><div style="width:${m.w}px;height:${m.h}px">${m.html}</div>`, m.w, m.h)}');\n`;
  bankChiq.push({ q: m.savol, o: [m.javob, ...m.boshqa], c: 0, t: "Mantiq", h: true, img: m.id, e: m.e });
}

// Tekshiruv: variantlar noyob, izoh bor
for (const q of [...KO, ...bankChiq]) {
  if (new Set(q.o).size !== q.o.length) throw new Error("takror variant: " + q.q);
  if (!q.e || q.e.length > 200) throw new Error("izoh 1–200 belgi bo'lishi kerak: " + q.q + " (" + (q.e || "").length + ")");
  if (q.q.length > 250) throw new Error("savol uzun: " + q.q);
}

const bank = JSON.parse(fs.readFileSync(bankYoli, "utf8")).filter((q) => !q.h);
bank.push(...KO, ...bankChiq);
fs.writeFileSync(bankYoli, JSON.stringify(bank, null, 1) + "\n");
fs.writeFileSync(`${dir}yukla.sql`, sql);
console.log("Qiyin savollar:", KO.length, "ta ko'p javobli +", bankChiq.length, "ta rasmli; bank jami", bank.length);
