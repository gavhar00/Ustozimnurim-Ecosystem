// tools/qollanma/*.png → src/qollanma.js (base64). Rasmlar kodga kiritiladi:
// Worker faylga kira olmaydi, rasm esa har safar yuklanmasin deb file_id keshlanadi.
import fs from "node:fs";
const nomlar = ["alifbo", "harakat", "shakl"];
let out = "// AVTOMATIK: tools/qollanma_pack.mjs yaratadi. Qo'lda tahrir qilmang.\nexport const QOLLANMA = {\n";
for (const n of nomlar) {
  const b = fs.readFileSync(new URL(`./qollanma/${n}.png`, import.meta.url));
  out += `  ${n}: "${b.toString("base64")}",\n`;
}
out += "};\n";
fs.writeFileSync(new URL("../src/qollanma.js", import.meta.url), out);
console.log("src/qollanma.js", (out.length / 1024).toFixed(0), "KB");
