/**
 * Sinovni ishga tushiradi:  npm test
 *
 * Nega oraliq nusxa kerak: Cloudflare Workers JSON faylni to'g'ridan-to'g'ri
 * import qila oladi, Node esa `with { type: "json" }` yozuvini talab qiladi.
 * Ishchi kodni Node uchun o'zgartirib qo'ymaslik uchun sinov vaqtinchalik
 * nusxada o'tkaziladi.
 */
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ildiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaqtinchalik = path.join(ildiz, ".sinov-tmp");

const JSON_IMPORT = /from "\.\/(quiz_bank|kitob_bank|kitob_bank_ru)\.json"/g;

async function tayyorla(manba) {
  await rm(vaqtinchalik, { recursive: true, force: true });
  await mkdir(vaqtinchalik, { recursive: true });
  await cp(path.join(ildiz, "src"), vaqtinchalik, { recursive: true });

  if (manba) await cp(manba, path.join(vaqtinchalik, "index.js"));

  for (const fayl of ["index.js", "kitob.js"]) {
    const yol = path.join(vaqtinchalik, fayl);
    const matn = await readFile(yol, "utf8");
    await writeFile(yol, matn.replace(JSON_IMPORT, 'from "./$1.json" with { type: "json" }'));
  }
  return path.join(vaqtinchalik, "index.js");
}

const manba = process.argv[2] ? path.resolve(process.argv[2]) : null;
const kirish = await tayyorla(manba);

const bola = spawn(process.execPath, [path.join(ildiz, "test", "sinov.mjs")], {
  stdio: "inherit",
  env: { ...process.env, BOT_SRC: kirish },
});

bola.on("exit", async (kod) => {
  await rm(vaqtinchalik, { recursive: true, force: true });
  process.exit(kod ?? 1);
});
