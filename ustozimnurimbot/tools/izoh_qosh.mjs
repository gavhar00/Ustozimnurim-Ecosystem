import fs from "fs";
const P = "src/quiz_bank.json";
const bank = JSON.parse(fs.readFileSync(P, "utf8"));
let n = 0, uzun = [];
for (const f of ["diniy", "kino", "liderlik", "it1", "it2"]) {
  const m = JSON.parse(fs.readFileSync(`tools/izoh_${f}.json`, "utf8"));
  for (const [i, e] of Object.entries(m)) {
    const q = bank[+i];
    if (!q) throw new Error("yo'q indeks " + i);
    if (q.e) continue;
    if (e.length > 200) uzun.push([i, e.length]);
    q.e = e; n++;
  }
}
console.log("qo'shildi", n, "uzun(>200):", uzun);
fs.writeFileSync(P, JSON.stringify(bank, null, 1));
const bos = bank.filter((q) => !q.e && q.t !== "Kitob");
console.log("izohsiz qoldi:", bos.length, bos.slice(0, 5).map((q) => q.q));
