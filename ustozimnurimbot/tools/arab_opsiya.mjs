// Poll variantlari yoniga qo'yiladigan kichik harf rasmlari (har bir noyob variant uchun).
// Ishlatish: node tools/arab_opsiya.mjs  →  tools/opsiya/*.jpg  va  tools/opsiya/yukla.sql
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { opsiyaKalit, arabchami } from "../src/rasm.js";

const bank = JSON.parse(fs.readFileSync(new URL("../src/quiz_bank.json", import.meta.url), "utf8"));
const set = new Set();
for (const q of bank) {
  if (q.t === "Arab" && q.o?.length && q.o.every(arabchami)) q.o.forEach((o) => set.add(o));
}
const dir = new URL("./opsiya/", import.meta.url).pathname;
fs.mkdirSync(dir, { recursive: true });
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const size = (m) => { const n = [...m.replace(/[ً-ْـ]/g, "")].length; return n <= 1 ? 230 : n <= 3 ? 170 : 120; };

let sql = "";
let i = 0;
for (const v of set) {
  const nom = "o" + String(i++).padStart(3, "0");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}
html,body{width:320px;height:320px}body{background:radial-gradient(200px 200px at 50% 50%,#fff,#FBF7EE);display:flex;align-items:center;justify-content:center}
.ar{font-family:"Geeza Pro","Noto Naskh Arabic","Al Nile",serif;direction:rtl;color:#1f1a10;line-height:1.5;white-space:nowrap;font-size:${size(v)}px}</style></head><body><div class="ar">${v}</div></body></html>`;
  fs.writeFileSync(`${dir}${nom}.html`, html);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=320,320",
    `--screenshot=${dir}${nom}.png`, `file://${dir}${nom}.html`], { stdio: "ignore" });
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", `${dir}${nom}.png`, "--out", `${dir}${nom}.jpg`], { stdio: "ignore" });
  const b64 = fs.readFileSync(`${dir}${nom}.jpg`).toString("base64");
  sql += `INSERT OR REPLACE INTO rasm (k, b) VALUES ('${opsiyaKalit(v)}', '${b64}');\n`;
}
fs.writeFileSync(`${dir}yukla.sql`, sql);
console.log(set.size, "ta variant rasmi tayyor");
