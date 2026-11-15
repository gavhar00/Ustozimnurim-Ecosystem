/**
 * Soxta Cloudflare D1 — node:sqlite ustiga qurilgan.
 *
 * NEGA SHU YO'L: D1 ning o'zi SQLite. SQL ni qo'lda talqin qiladigan maket
 * yozish — so'rovlarning yarmini noto'g'ri bajarishga va sinovning yolg'on
 * "o'tdi" berishiga olib keladi. Node 22+ dagi node:sqlite esa aynan shu
 * dvigatel, shuning uchun sinovda SQL xatosi ham, indeks xatosi ham,
 * ON CONFLICT mantig'i ham haqiqiy bazadagidek ishlaydi.
 *
 * Qaytarilgan obyekt D1 API sining faqat biz ishlatadigan qismini beradi:
 *   prepare(sql).bind(...).first() | .all() | .run()
 *   batch([...])
 */
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ILDIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SXEMA = readFileSync(path.join(ILDIZ, "schema.sql"), "utf8");

/** D1 faqat primitivlarni qabul qiladi — undefined/boolean ni moslashtiramiz. */
const moslash = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
};

export function yangiD1() {
  const sq = new DatabaseSync(":memory:");
  sq.exec(SXEMA);

  /**
   * Tayyorlangan so'rov.
   *
   * MUHIM: bind() YANGI obyekt qaytaradi, eskisini o'zgartirmaydi.
   * Ilgari bu yerda bitta obyekt qayta ishlatilar va argumentlar
   * ustiga yozilardi — bitta so'rovni ikki xil argument bilan
   * ishlatganda ikkinchisi birinchisini buzardi. Haqiqiy D1 da
   * bunday emas, demak maket sinovga yolg'on gapirardi.
   */
  // Node 23.11 ning node:sqlite i `?1, ?2` raqamli parametrlarni qabul qilmaydi
  // ("column index out of range"), D1 esa qabul qiladi. Maket D1 ga o'xshash
  // bo'lishi uchun raqamli parametrlarni oddiy `?` ga o'giramiz (oddiyla).
  const oddiyla = (sql, args) => {
    if (!/\?\d/.test(sql)) return [sql, args];
    const yangi = [];
    const q = sql.replace(/\?(\d+)/g, (_, n) => { yangi.push(args[Number(n) - 1]); return "?"; });
    return [q, yangi];
  };

  const soz = (sql, args = []) => ({
    _sql: sql,
    _args: args,
    bind: (...a) => soz(sql, a.map(moslash)),
    async first(col) {
      const [q_, a_] = oddiyla(sql, args);
      const r = sq.prepare(q_).get(...a_);
      if (r === undefined || r === null) return null;
      return col === undefined ? r : r[col];
    },
    async all() {
      const [q_, a_] = oddiyla(sql, args);
      return { results: sq.prepare(q_).all(...a_), success: true, meta: {} };
    },
    async run() {
      const [q_, a_] = oddiyla(sql, args);
      const r = sq.prepare(q_).run(...a_);
      return {
        success: true,
        meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) },
      };
    },
  });

  return {
    _sq: sq,
    prepare: (sql) => soz(sql),

    /**
     * D1 da batch() — TRANZAKSIYA: yo hammasi bajariladi, yo hech biri.
     * Maket ham shunday bo'lishi shart. Aks holda sinov "yarmi o'tib
     * yarmi o'tmasa nima bo'ladi?" degan savolni umuman ko'rmaydi —
     * aynan shu savol agregat sonlarining chalkashishiga olib keladi.
     */
    async batch(lar) {
      sq.exec("BEGIN");
      try {
        const natija = [];
        for (const st of lar) {
          const sql = String(st._sql || "").trim().toUpperCase();
          if (sql.startsWith("SELECT") || sql.includes(" RETURNING ")) {
            natija.push({ results: sq.prepare(st._sql).all(...st._args), success: true, meta: {} });
          } else {
            const r = sq.prepare(st._sql).run(...st._args);
            natija.push({
              success: true,
              meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) },
            });
          }
        }
        sq.exec("COMMIT");
        return natija;
      } catch (e) {
        sq.exec("ROLLBACK");
        throw e;
      }
    },

    async exec(s) { sq.exec(s); },
  };
}

// ——— sinovda bazaga qarash uchun qisqa yordamchilar ———

export const qatorlar = (env, sql, ...a) => env._sq.prepare(sql).all(...a.map(moslash));
export const qator = (env, sql, ...a) => env._sq.prepare(sql).get(...a.map(moslash)) ?? null;
