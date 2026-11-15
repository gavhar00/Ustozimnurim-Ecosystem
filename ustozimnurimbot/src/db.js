/**
 * Ma'lumotlar qatlami — D1 (SQLite).
 *
 * NEGA KV DAN KO'CHDIK
 *  1) Bepul KV kuniga atigi 1 000 ta yozuvga ruxsat beradi. Bitta foydalanuvchi
 *     kunlik viktorinada ~43 ta yozuv qiladi, ya'ni chegara ~23 faol odam edi.
 *     Undan oshganda KV xato bermay, jimgina yozishni to'xtatardi.
 *  2) KV da so'rov (query) yo'q. Xatolar banki, savol sifati statistikasi va
 *     o'qituvchi hisoboti — hammasi so'rovni talab qiladi.
 *
 * D1 bepul rejasi: kuniga 100 000 qator yozuv. Shu arxitekturada bu ~2 000
 * faol foydalanuvchiga yetadi.
 */

/** Savol matnidan barqaror identifikator — statistika shu bo'yicha yig'iladi. */
export function qid(savol) {
  let h = 2166136261 >>> 0;
  const s = String(savol || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

// ——————————————————————————————————————————————— foydalanuvchi

const BOSH_USER = {
  seq: 0, streak: 0, last_daily: null, days: 0, kitob: 0, blocked: 0,
  name: null, uname: null,
};

export async function getUser(env, uid) {
  const r = await env.DB.prepare("SELECT * FROM users WHERE uid = ?").bind(String(uid)).first();
  if (!r) return { uid: String(uid), ...BOSH_USER };
  // «Ilm olish sirlari» — bitta kitob, ikki tilda. Progress tilga bog'liq emas:
  // tilni almashtirgan odam qaysi faslda bo'lsa, o'sha yerdan davom etadi.
  const k = Math.max(r.kitob || 0, r.kitob_ru || 0);
  r.kitob = k; r.kitob_ru = k;
  return r;
}

/** Foydalanuvchini yaratadi yoki mavjudini yangilaydi. */
export async function saveUser(env, uid, u) {
  await env.DB.prepare(`
    INSERT INTO users (uid, name, uname, streak, last_daily, days, seq, kitob, blocked, yonalish, kitob_ru, lang, seen)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, datetime('now'))
    ON CONFLICT(uid) DO UPDATE SET
      name       = COALESCE(excluded.name, users.name),
      uname      = COALESCE(excluded.uname, users.uname),
      streak     = excluded.streak,
      last_daily = excluded.last_daily,
      days       = excluded.days,
      seq        = excluded.seq,
      kitob      = excluded.kitob,
      blocked    = excluded.blocked,
      yonalish   = excluded.yonalish,
      kitob_ru   = excluded.kitob_ru,
      lang       = COALESCE(excluded.lang, users.lang),
      seen       = datetime('now')
  `).bind(
    String(uid), u.name ?? null, u.uname ?? null, u.streak ?? 0,
    u.last_daily ?? null, u.days ?? 0, u.seq ?? 0, u.kitob ?? 0, u.blocked ? 1 : 0,
    u.yonalish ?? null, u.kitob_ru ?? 0, u.lang ?? null
  ).run();
}

/** Faollik belgisi — arzon yozuv, har xabarda chaqirilmaydi. */
export async function touchUser(env, uid, name, uname) {
  await env.DB.prepare(`
    INSERT INTO users (uid, name, uname, seen) VALUES (?1, ?2, ?3, datetime('now'))
    ON CONFLICT(uid) DO UPDATE SET
      name  = COALESCE(?2, users.name),
      uname = COALESCE(?3, users.uname),
      seen  = datetime('now')
  `).bind(String(uid), name || null, uname || null).run();
}

export async function setBlocked(env, uid, holat) {
  const yangi = holat ? 1 : 0;
  const u = await env.DB.prepare("SELECT blocked, joined, streak FROM users WHERE uid = ?").bind(String(uid)).first();
  if (!u) return;
  await env.DB.prepare("UPDATE users SET blocked = ? WHERE uid = ?").bind(yangi, String(uid)).run();
  if ((u.blocked ? 1 : 0) === yangi) return;     // holat o'zgarmagan — tarixga yozmaymiz
  // Tarix: kim, qachon, qancha faol edi — "nega ketishdi" savoliga javob uchun. Xato bo'lsa asosiy ish buzilmaydi.
  try {
    const j = await env.DB.prepare("SELECT COUNT(*) AS n FROM answers WHERE uid = ?").bind(String(uid)).first();
    const kun = Math.max(0, Math.floor((Date.now() - new Date(String(u.joined).replace(" ", "T") + "Z").getTime()) / 86400e3)) || 0;
    await env.DB.prepare("INSERT INTO ketish_log (uid, holat, kun, javob, streak) VALUES (?, ?, ?, ?, ?)")
      .bind(String(uid), yangi ? "ketdi" : "qaytdi", kun, j?.n || 0, u.streak || 0).run();
  } catch { /* log yozilmasa ham blok belgisi saqlandi */ }
}

/** Oxirgi N kunda botni to'xtatganlar (yangisi birinchi) + qaytganlar soni. */
export async function ketganlar(env, kunlar = 7, limit = 10) {
  const { results } = await env.DB.prepare(`
    SELECT l.uid, l.at, l.kun, l.javob, l.streak, u.name, u.uname FROM ketish_log l
    LEFT JOIN users u ON u.uid = l.uid
    WHERE l.holat = 'ketdi' AND l.at > datetime('now', ?) ORDER BY l.id DESC LIMIT ?
  `).bind(`-${Number(kunlar) || 7} days`, limit).all();
  const jami = await env.DB.prepare("SELECT COUNT(*) AS n FROM ketish_log WHERE holat = 'ketdi' AND at > datetime('now', ?)").bind(`-${Number(kunlar) || 7} days`).first();
  const qaytdi = await env.DB.prepare("SELECT COUNT(*) AS n FROM ketish_log WHERE holat = 'qaytdi' AND at > datetime('now', ?)").bind(`-${Number(kunlar) || 7} days`).first();
  return { royxat: results, jami: jami?.n || 0, qaytdi: qaytdi?.n || 0 };
}

/** "Foydalanuvchilar" ekrani uchun sonlar. */
export async function foydalanuvchiSonlari(env, kun) {
  const q = (sql, ...b) => sonQ(env, sql, ...b);
  const [jami, bloklagan, yangi1, yangi7, dau, wau, mau] = await Promise.all([
    q("SELECT COUNT(*) AS n FROM users"),
    q("SELECT COUNT(*) AS n FROM users WHERE blocked = 1"),
    q("SELECT COUNT(*) AS n FROM users WHERE date(joined, '+5 hours') = ?", kun),
    q("SELECT COUNT(*) AS n FROM users WHERE date(joined, '+5 hours') >= date(?, '-6 days')", kun),
    q("SELECT COUNT(*) AS n FROM users WHERE date(seen, '+5 hours') = ? AND blocked = 0", kun),
    q("SELECT COUNT(*) AS n FROM users WHERE date(seen, '+5 hours') >= date(?, '-6 days') AND blocked = 0", kun),
    q("SELECT COUNT(*) AS n FROM users WHERE date(seen, '+5 hours') >= date(?, '-29 days') AND blocked = 0", kun),
  ]);
  return { jami, bloklagan, yangi1, yangi7, dau, wau, mau };
}

// ——————————————————————————————————————————————— so'rovnoma navbati

export async function pollSaqla(env, pollId, rec) {
  await env.DB.prepare(`
    INSERT OR REPLACE INTO polls (poll_id, uid, mode, idx, fasl, chat_id, msg_id, created, qid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    String(pollId), String(rec.u), rec.m, rec.i,
    rec.f ?? null, String(rec.c), rec.msg ?? null, Math.floor(Date.now() / 1000),
    rec.qid ?? null
  ).run();
}

export async function pollKor(env, pollId) {
  return env.DB.prepare("SELECT * FROM polls WHERE poll_id = ?").bind(String(pollId)).first();
}

/**
 * Navbatni olish: qatorni o'chira olgan tomon savolni oldinga suradi.
 * D1 da DELETE atomar, shuning uchun ikki yo'l bir vaqtda o'tib keta olmaydi —
 * KV dagi "eventually consistent" muammosi yo'qoladi.
 */
export async function navbatniOl(env, pollId, tekshir = null) {
  const rec = await pollKor(env, pollId);
  if (!rec) return null;
  if (tekshir && !tekshir({ u: Number(rec.uid), m: rec.mode, i: rec.idx })) return null;

  const r = await env.DB.prepare("DELETE FROM polls WHERE poll_id = ?")
    .bind(String(pollId)).run();
  if (!r.meta.changes) return null;      // boshqa chaqiruv bizdan oldin ulgurdi

  return { u: Number(rec.uid), i: rec.idx, m: rec.mode, c: Number(rec.chat_id),
           f: rec.fasl ?? undefined, msg: rec.msg_id ?? undefined,
           qid: rec.qid ?? undefined };
}

/** Eski so'rovnoma yozuvlarini tozalash (cron). */
/**
 * Shu foydalanuvchiga ayni shu savol yaqinda yuborilgan va hali javobsizmi?
 *
 * Takroriy kirish himoyasi shu yerda. Ilgari bu Map'da (xotirada) turgan edi,
 * lekin Worker har so'rovda boshqa izolyatsiyada ishga tushishi mumkin —
 * u holda himoya umuman ishlamaydi. polls jadvali esa javob berilgan zahoti
 * tozalanadi, shuning uchun "ochiq savol bormi?" degan savolga eng ishonchli
 * javobni aynan o'sha beradi.
 */
export async function ochiqSavol(env, uid, mode, idx, oynaMs) {
  const chegara = Math.floor((Date.now() - oynaMs) / 1000);
  return env.DB.prepare(`
    SELECT poll_id FROM polls
    WHERE uid = ? AND mode = ? AND idx = ? AND created >= ?
    LIMIT 1
  `).bind(String(uid), mode, idx, chegara).first();
}

export async function pollTozala(env, soat = 12) {
  const chegara = Math.floor(Date.now() / 1000) - soat * 3600;
  const r = await env.DB.prepare("DELETE FROM polls WHERE created < ?").bind(chegara).run();
  return r.meta.changes;
}

// ——————————————————————————————————————————————— javoblar

/**
 * Javobni yozadi VA agregatlarni yangilaydi — bitta tranzaksiyada.
 *
 * NEGA batch(): uch yozuv bir-biriga bog'liq. Agar xom javob yozilib,
 * yig'indi yozilmay qolsa, sonlar abadiy chalkashadi va buni hech kim
 * sezmaydi — bot xato bermaydi, shunchaki noto'g'ri son ko'rsatadi.
 * D1 da batch() tranzaksiya: yo hammasi, yo hech biri.
 *
 * NEGA bu yerda hisoblaymiz: "bu odam nechta javob berdi?" degan savol
 * kuniga o'nlab marta so'raladi, javob esa kuniga o'nlab marta
 * o'zgaradi. Har so'rashda qaytadan sanash — bir xil ishni qayta-qayta
 * bajarish. Yozishda bir marta hisoblab qo'yish arzonroq va, eng
 * muhimi, tarix o'sganda ham qimmatlashmaydi.
 */
export async function javobYoz(env, { uid, mode, day, fasl, idx, savol, topic, ok, skipped }) {
  const u = String(uid);
  const q = qid(savol);
  const t = topic ?? null;
  const togri = ok ? 1 : 0;

  const amallar = [
    env.DB.prepare(`
      INSERT INTO answers (uid, mode, day, fasl, idx, qid, topic, correct, skipped)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(u, mode, day ?? null, fasl ?? null, idx, q, t, togri, skipped ? 1 : 0),

    // Umumiy yig'indi (topic = '')
    env.DB.prepare(`
      INSERT INTO user_stat (uid, topic, a, c) VALUES (?, '', 1, ?)
      ON CONFLICT(uid, topic) DO UPDATE SET a = a + 1, c = c + ?
    `).bind(u, togri, togri),
  ];

  if (t) {
    amallar.push(env.DB.prepare(`
      INSERT INTO user_stat (uid, topic, a, c) VALUES (?, ?, 1, ?)
      ON CONFLICT(uid, topic) DO UPDATE SET a = a + 1, c = c + ?
    `).bind(u, t, togri, togri));
  }

  // Xatolar banki. To'g'ri javob bergandan keyin savol ro'yxatdan
  // CHIQADI va qaytmaydi — `ochiq` faqat 1 dan 0 ga o'tadi.
  // Aks holda bir marta o'rgangan savol keyingi xatoda qayta paydo
  // bo'lib, "tuzatilmagan xatolar" ro'yxati hech qachon tugamasdi.
  amallar.push(env.DB.prepare(`
    INSERT INTO mistake (uid, qid, topic, urinish, ochiq, oxirgi)
    VALUES (?, ?, ?, 1, ?, datetime('now'))
    ON CONFLICT(uid, qid) DO UPDATE SET
      urinish = urinish + 1,
      ochiq   = CASE WHEN ? = 1 THEN 0 ELSE ochiq END,
      topic   = COALESCE(excluded.topic, topic),
      oxirgi  = datetime('now')
  `).bind(u, q, t, ok ? 0 : 1, togri));

  await env.DB.batch(amallar);
}

/** Shu savolga allaqachon javob berilganmi (takrorni to'sish). */
export async function javobBorMi(env, uid, mode, kun, fasl, idx) {
  const r = await env.DB.prepare(`
    SELECT 1 FROM answers
    WHERE uid = ? AND mode = ? AND idx = ?
      AND (day  IS ? OR day  = ?)
      AND (fasl IS ? OR fasl = ?)
    LIMIT 1
  `).bind(String(uid), mode, idx, kun ?? null, kun ?? null, fasl ?? null, fasl ?? null).first();
  return !!r;
}

/** Kunlik viktorinada birinchi javobsiz savol indeksi. */
export async function birinchiJavobsiz(env, uid, kun, jami) {
  const { results } = await env.DB.prepare(
    "SELECT idx FROM answers WHERE uid = ? AND mode = 'd' AND day = ?"
  ).bind(String(uid), kun).all();
  const bor = new Set(results.map((r) => r.idx));
  for (let i = 0; i < jami; i++) if (!bor.has(i)) return i;
  return jami;
}

/** Kitob faslida berilgan javoblar soni (davom ettirish uchun). */
/**
 * NEGA REJIM KERAK: o'zbek va rus marafoni bitta `answers` jadvalida
 * yashaydi va fasl raqamlari ustma-ust tushadi (ikkalasida ham 1-14).
 * Rejimsiz so'rov ikkisini aralashtirib yuboradi: rus bo'limida
 * foydalanuvchi o'zbekcha javob bergan savollarni "javob berilgan" deb
 * o'tkazib yuborardi.
 */
export async function faslJavoblari(env, uid, fasl, mode = "k") {
  const { results } = await env.DB.prepare(
    "SELECT idx, correct FROM answers WHERE uid = ? AND mode = ? AND fasl = ? ORDER BY idx"
  ).bind(String(uid), mode, fasl).all();
  return results;
}

/**
 * Faslni qayta boshlash uchun javoblarni o'chiradi.
 *
 * AGREGAT TUZOG'I: qo'shishni hamma eslaydi, ayirishni ko'pchilik
 * unutadi. Javoblar o'chsa, yig'indi ham kamayishi SHART — aks holda
 * faslni uch marta qayta ishlagan odamning "jami javob" soni uch
 * barobar ko'rinadi va bu xato hech qachon o'z-o'zidan tuzalmaydi.
 *
 * Xatolar banki ataylab TOZALANMAYDI: qayta boshlash javoblarni
 * o'chiradi, lekin xato qilingani — fakt. Uni o'chirish o'rganish
 * tarixini yo'q qilish bo'lardi.
 */
export async function faslTozala(env, uid, fasl, mode = "k") {
  const u = String(uid);

  // O'chiriladigan satrlar mavzular kesimida sanaladi — kompensatsiya
  // aynan shu kesimda bajarilishi kerak.
  const { results } = await env.DB.prepare(`
    SELECT COALESCE(topic, '') AS topic, COUNT(*) AS a, SUM(correct) AS c
    FROM answers WHERE uid = ? AND mode = ? AND fasl = ?
    GROUP BY COALESCE(topic, '')
  `).bind(u, mode, fasl).all();

  if (!results.length) return;

  let jamiA = 0, jamiC = 0;
  const amallar = [];
  for (const r of results) {
    jamiA += r.a;
    jamiC += r.c || 0;
    if (r.topic) {
      amallar.push(env.DB.prepare(
        "UPDATE user_stat SET a = MAX(0, a - ?), c = MAX(0, c - ?) WHERE uid = ? AND topic = ?"
      ).bind(r.a, r.c || 0, u, r.topic));
    }
  }
  amallar.push(env.DB.prepare(
    "UPDATE user_stat SET a = MAX(0, a - ?), c = MAX(0, c - ?) WHERE uid = ? AND topic = ''"
  ).bind(jamiA, jamiC, u));
  amallar.push(env.DB.prepare("DELETE FROM answers WHERE uid = ? AND mode = ? AND fasl = ?")
    .bind(u, mode, fasl));

  await env.DB.batch(amallar);
}

// ——————————————————————————————————————————————— kunlik yakun va reyting

export async function kunYakunlandiMi(env, uid, kun) {
  return env.DB.prepare("SELECT score, total FROM daily WHERE uid = ? AND day = ?")
    .bind(String(uid), kun).first();
}

export async function kunYakunla(env, uid, kun, score, total) {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO daily (uid, day, score, total) VALUES (?, ?, ?, ?)"
  ).bind(String(uid), kun, score, total).run();
}

/** Kunlik ball — javoblar jadvalidan hisoblanadi, alohida sanoq saqlanmaydi. */
export async function kunlikBall(env, uid, kun) {
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS jami, SUM(correct) AS togri FROM answers WHERE uid = ? AND mode = 'd' AND day = ?"
  ).bind(String(uid), kun).first();
  return { togri: r?.togri || 0, jami: r?.jami || 0 };
}

/** Berilgan qiyin savollardan (qid ro'yxati) bugun nechtasiga to'g'ri javob berilgan. */
export async function qiyinTogri(env, uid, kun, qidlar) {
  if (!qidlar.length) return 0;
  const r = await env.DB.prepare(
    `SELECT COUNT(DISTINCT qid) AS n FROM answers WHERE uid = ? AND mode = 'd' AND day = ? AND correct = 1 AND qid IN (${qidlar.map(() => "?").join(",")})`
  ).bind(String(uid), kun, ...qidlar).first();
  return r?.n || 0;
}

/** «Hero» nishoni: qiyin savollarning hammasi to'g'ri. Zanjir = ketma-ket kunlar. */
export async function heroBer(env, uid, kun, kecha, gacha) {
  const u = await env.DB.prepare("SELECT hero_last, hero_n, hero_jami FROM users WHERE uid = ?").bind(String(uid)).first();
  const zanjir = u?.hero_last === kecha ? (u.hero_n || 0) + 1 : 1;
  await env.DB.prepare("UPDATE users SET hero_until = ?, hero_last = ?, hero_n = ?, hero_jami = COALESCE(hero_jami, 0) + 1 WHERE uid = ?")
    .bind(gacha, kun, zanjir, String(uid)).run();
  return zanjir;
}

/** Kunlik reyting — bitta so'rov. KV da bu 500 ta alohida o'qish edi. */
export async function reyting(env, kun) {
  const { results } = await env.DB.prepare(`
    SELECT d.uid, d.score AS s, d.total AS t, u.name AS n, u.uname AS un,
           COALESCE(a.n, 0) AS sn, COALESCE(a.ok, 0) AS sok,
           CASE WHEN p.tugaydi > datetime('now') THEN 1 ELSE 0 END AS p,
           CASE WHEN u.super_until > datetime('now') THEN 1 ELSE 0 END AS sm,
           CASE WHEN u.hero_until > datetime('now') THEN 1 ELSE 0 END AS hr
    FROM daily d LEFT JOIN users u ON u.uid = d.uid
    LEFT JOIN premium p ON p.uid = d.uid
    LEFT JOIN (SELECT uid, COUNT(DISTINCT idx) AS n, COUNT(DISTINCT CASE WHEN correct = 1 THEN idx END) AS ok
               FROM answers WHERE mode = 'd' AND day = ? GROUP BY uid) a ON a.uid = d.uid
    WHERE d.day = ?
    ORDER BY d.score DESC, d.at ASC
  `).bind(kun, kun).all();
  return results;
}

// ——————————————————————————————————————————————— kitob marafoni

/**
 * Tugatilgan fasl. Rus marafoni uchun kalit 100 + fasl bo'ladi.
 *
 * NEGA SHUNDAY: fasl_done jadvalining birlamchi kaliti (uid, fasl) va
 * SQLite'da uni o'zgartirib bo'lmaydi. Yangi ustun qo'shish kalitni
 * ajratmaydi, ya'ni rus 3-fasli o'zbek 3-faslini bosib yozardi.
 * 100 dan boshlangan oraliq — eng sodda va buzilmaydigan ajratish;
 * fasllar soni 14 ta bo'lgani uchun to'qnashuv ehtimoli yo'q.
 */
// 2026-10-30 dan: kitob progressi tillar orasida umumiy — yangi yozuvlar til farqisiz kalitda.
// Eski rus yozuvlari (101–114) o'qishda fasl % 100 bilan birlashtiriladi.
export const faslKaliti = (fasl, _lang) => fasl;

export async function faslYakunla(env, uid, fasl, score, total, lang = "uz") {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO fasl_done (uid, fasl, score, total) VALUES (?, ?, ?, ?)"
  ).bind(String(uid), faslKaliti(fasl, lang), score, total).run();
}

/** Marafon yakunidagi umumiy natija — barcha tugatilgan fasllar yig'indisi. */
export async function faslJamiNatija(env, uid, _lang = "uz") {
  // Har fasl bir marta (o'zbek va eski rus yozuvlaridan eng yaxshisi); 300+ — arab bloklari
  const r = await env.DB.prepare(`
    SELECT SUM(b) AS ball, SUM(t) AS jami FROM (
      SELECT fasl % 100 AS f, MAX(score) AS b, MAX(total) AS t FROM fasl_done
      WHERE uid = ? AND fasl BETWEEN 1 AND 199 GROUP BY fasl % 100)
  `).bind(String(uid)).first();
  return { ball: r?.ball || 0, jami: r?.jami || 0 };
}

// ——————————————————————————————————————————————— statistika

/** Foydalanuvchining umumiy va mavzular kesimidagi natijasi. */
/**
 * Foydalanuvchi statistikasi — endi hisoblamaydi, O'QIYDI.
 *
 * ILGARI: `answers` dan ikkita to'liq skaner (jami + mavzular kesimi).
 * Narx foydalanuvchining tarixi bilan birga o'sardi: 600 javob = 1200
 * satr o'qish, 5000 javob = 10 000 satr.
 *
 * ENDI: bitta indeksli so'rov, ~6 satr. Tarix qanchalik uzun bo'lsa
 * ham o'zgarmaydi — chunki narx javoblar soniga emas, MAVZULAR soniga
 * bog'liq, mavzular esa chekli.
 */
export async function statistika(env, uid) {
  const { results } = await env.DB.prepare(
    "SELECT topic, a, c FROM user_stat WHERE uid = ?"
  ).bind(String(uid)).all();

  const umumiy = results.find((r) => r.topic === "") || { a: 0, c: 0 };
  const mavzular = results
    .filter((r) => r.topic !== "")
    .map((r) => ({ topic: r.topic, a: r.a, c: r.c }))
    .sort((x, y) => y.a - x.a);

  // KV davridagi yig'indini qo'shamiz — aks holda eski a'zolar hisobi
  // nolga tushib ketadi va ular "hech narsa ishlamagan" bo'lib ko'rinadi.
  const eski = await env.DB.prepare(
    "SELECT legacy_answered AS a, legacy_correct AS c FROM users WHERE uid = ?"
  ).bind(String(uid)).first();

  return {
    jami: umumiy.a + (eski?.a || 0),
    togri: umumiy.c + (eski?.c || 0),
    yangiJami: umumiy.a,
    mavzular,
  };
}


/**
 * Xatolar banki — foydalanuvchi xato qilgan, hali tuzatilmagan savollar.
 * Bir savolga keyin to'g'ri javob bergan bo'lsa, ro'yxatdan chiqadi.
 */
/**
 * Tuzatilmagan xatolar. Agregat jadvaldan o'qiladi.
 *
 * ILGARI: `answers` ni GROUP BY qilib, HAVING MAX(correct) = 0 bilan
 * filtrlash — ya'ni butun tarixni skanerlash. Shu so'rov cheksiz
 * siklda minglab marta takrorlanib, kunlik limitni yoqib yuborgan edi.
 *
 * ENDI: indeks to'g'ridan-to'g'ri kerakli satrlarni beradi.
 */
export async function xatolar(env, uid, limit = 50) {
  const { results } = await env.DB.prepare(`
    SELECT qid, topic, oxirgi, urinish
    FROM mistake
    WHERE uid = ? AND ochiq = 1
    ORDER BY oxirgi ASC
    LIMIT ?
  `).bind(String(uid), limit).all();
  return results;
}


/**
 * Takrorlash jadvali: xato qilingandan keyin savol necha kun o'tib qaytadi.
 *
 * NEGA SHUNDAY: yangi bilim olishdan ko'ra, olinganini unutmaslik qiyin.
 * Xato qilingan savolni darhol qayta ko'rsatish yodda saqlashga deyarli
 * ta'sir qilmaydi — javob hali qisqa muddatli xotirada turadi. Oraliq
 * uzaygan sayin esa har bir muvaffaqiyatli eslash xotirani kuchaytiradi.
 * Shuning uchun oraliq har urinishdan keyin kattalashadi.
 *
 * Jadval qat'iy emas: foydalanuvchi xohlasa, muddati kelmagan savollarni
 * ham takrorlashi mumkin (bu holda ro'yxatning boshidagisi olinadi).
 */
export const TAKROR_JADVAL = [1, 2, 4, 7, 14];   // kunlarda

/**
 * Xatolar banki — tuzatilmagan savollar, takrorlash muddati bilan.
 *
 * "Tuzatilmagan" degani: shu savolga BERILGAN ENG YaXShI javob ham xato.
 * Keyin to'g'ri javob bergan bo'lsa, savol ro'yxatdan o'zi chiqib ketadi —
 * alohida "o'rganildi" belgisi kerak emas.
 */
export async function xatoRoyxat(env, uid, limit = 50) {
  const { results } = await env.DB.prepare(`
    SELECT qid, topic, oxirgi, urinish,
           CAST((julianday('now') - julianday(oxirgi)) AS REAL) AS kun
    FROM mistake
    WHERE uid = ? AND ochiq = 1
    ORDER BY oxirgi ASC
    LIMIT ?
  `).bind(String(uid), limit).all();

  return results.map((r) => {
    const kutish = TAKROR_JADVAL[Math.min(r.urinish - 1, TAKROR_JADVAL.length - 1)];
    return { ...r, kutish, tayyor: (r.kun ?? 0) >= kutish };
  });
}


/** Savol sifati — hamma xato qiladigan savol, ehtimol, buzuq. */
export async function shubhaliSavollar(env, kamida = 5, chegara = 0.25) {
  const { results } = await env.DB.prepare(`
    SELECT qid, COUNT(*) AS n, AVG(correct) AS aniqlik
    FROM answers WHERE skipped = 0
    GROUP BY qid HAVING n >= ? AND aniqlik < ?
    ORDER BY aniqlik ASC LIMIT 20
  `).bind(kamida, chegara).all();
  return results;
}

/** Admin hisoboti uchun kunlik kesim. */
export async function kunlikHisobot(env, kun) {
  const umumiy = await env.DB.prepare(`
    SELECT COUNT(DISTINCT uid) AS boshlagan, COUNT(*) AS javob, SUM(correct) AS togri
    FROM answers WHERE day = ? AND mode = 'd'
  `).bind(kun).first();

  const yakun = await env.DB.prepare("SELECT COUNT(*) AS n FROM daily WHERE day = ?")
    .bind(kun).first();

  const { results: mavzular } = await env.DB.prepare(`
    SELECT topic, COUNT(*) AS a, SUM(correct) AS c
    FROM answers WHERE day = ? AND mode = 'd' AND topic IS NOT NULL
    GROUP BY topic ORDER BY (CAST(SUM(correct) AS REAL) / COUNT(*)) ASC
  `).bind(kun).all();

  const jami = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE blocked = 0").first();

  return {
    boshlagan: umumiy?.boshlagan || 0,
    yakunlagan: yakun?.n || 0,
    javob: umumiy?.javob || 0,
    togri: umumiy?.togri || 0,
    mavzular,
    jamiFoydalanuvchi: jami?.n || 0,
  };
}

/**
 * Eslatma yuboriladigan foydalanuvchilar — bugun ishlamaganlar.
 *
 * MUHIM CHEGARA: "bloklamagan hamma" emas. Bir yil oldin bir marta kirib
 * qaytmagan odamga har kuni eslatma yuborish — spam. U eslatmani o'qimaydi,
 * lekin cron vaqtini yeydi va odamni botni bloklashga undaydi.
 *
 * Shuning uchun nomzod bo'lish sharti: yo oxirgi 14 kun ichida viktorina
 * ishlagan (ya'ni hozir faol), yo oxirgi 3 kunda qo'shilgan (hali tanishib
 * ulgurmagan yangi a'zo).
 */
export async function eslatmaRoyxati(env, kun, faolKun = 14, yangiKun = 3) {
  const { results } = await env.DB.prepare(`
    SELECT u.uid, u.streak FROM users u
    WHERE u.blocked = 0
      AND NOT EXISTS (SELECT 1 FROM daily d WHERE d.uid = u.uid AND d.day = ?)
      AND (u.last_daily >= date(?, '-' || ? || ' days')
           OR u.joined   >= datetime(?, '-' || ? || ' days'))
  `).bind(kun, kun, faolKun, kun, yangiKun).all();
  return results;
}

export async function savolBelgila(env, uid, savolMatni) {
  return belgilaQid(env, uid, qid(savolMatni));
}

/**
 * Savolni qid bo'yicha belgilaydi.
 *
 * NEGA qid BO'YICHA: foydalanuvchi savolni ro'yxatdan tanlaydi, bizda
 * esa seansdan faqat qid qolgan — savol matni emas. Matnni qayta
 * topib, undan qid hisoblash ortiqcha ish va xato manbai bo'lardi.
 *
 * Bir odam bir savolni BIR MARTA belgilay oladi: aks holda bitta
 * norozi odam hisobni shishirib, haqiqatan buzuq savollarni ro'yxat
 * tubiga tushirib yuborishi mumkin.
 */
export async function belgilaQid(env, uid, qid_) {
  const r = await env.DB.prepare(
    "INSERT INTO flags (uid, qid) SELECT ?, ? " +
    "WHERE NOT EXISTS (SELECT 1 FROM flags WHERE uid = ? AND qid = ?) RETURNING id"
  ).bind(String(uid), qid_, String(uid), qid_).first();
  return !!r;
}


// ═══════════════════════════════════════════════════════════════════
// TIZIM — kalit-qiymat saqlagich
// ═══════════════════════════════════════════════════════════════════

/**
 * Kalit bo'yicha bir martalik belgi qo'yadi.
 *
 * Qaytaradi: true — belgi SHU chaqiruvda qo'yildi (ya'ni birinchi marta),
 *            false — allaqachon bor edi.
 *
 * Ogohlantirishlarni cheklash uchun: "bugun bu haqda aytilganmi?".
 * INSERT ... ON CONFLICT DO NOTHING atomar, shuning uchun ikki
 * parallel so'rov ham ikki xabar yubora olmaydi.
 */
export async function birMarta(env, kalit) {
  const r = await env.DB.prepare(
    "INSERT INTO tizim (k, v) VALUES (?, ?) ON CONFLICT(k) DO NOTHING RETURNING k"
  ).bind(kalit, String(Date.now())).first();
  return !!r;
}

/**
 * Agregatlarni `answers` dan qaytadan hisoblaydi.
 *
 * NEGA KERAK: agregat — nusxa, nusxa esa asl nusxadan ajralib qolishi
 * mumkin (kod xatosi, yarim bajarilgan ko'chirish, qo'lda o'zgartirish).
 * Shuning uchun `answers` haqiqat manbai bo'lib qoladi va undan har
 * doim qayta qurish mumkin. Tiklash yo'li bo'lmagan agregat — vaqt
 * bombasi.
 *
 * uid berilmasa — hamma foydalanuvchi uchun (dastlabki to'ldirish).
 */
export async function qaytaHisobla(env, uid = null) {
  const qayerda = uid ? "WHERE uid = ?" : "";
  const arg = uid ? [String(uid)] : [];

  const amallar = [
    env.DB.prepare(`DELETE FROM user_stat ${uid ? "WHERE uid = ?" : ""}`).bind(...arg),
    env.DB.prepare(`DELETE FROM mistake ${uid ? "WHERE uid = ?" : ""}`).bind(...arg),

    env.DB.prepare(`
      INSERT INTO user_stat (uid, topic, a, c)
      SELECT uid, '', COUNT(*), SUM(correct) FROM answers ${qayerda} GROUP BY uid
    `).bind(...arg),

    env.DB.prepare(`
      INSERT INTO user_stat (uid, topic, a, c)
      SELECT uid, topic, COUNT(*), SUM(correct) FROM answers
      ${qayerda ? qayerda + " AND" : "WHERE"} topic IS NOT NULL
      GROUP BY uid, topic
    `).bind(...arg),

    env.DB.prepare(`
      INSERT INTO mistake (uid, qid, topic, urinish, ochiq, oxirgi)
      SELECT uid, qid, MIN(topic), COUNT(*),
             CASE WHEN MAX(correct) = 1 THEN 0 ELSE 1 END, MAX(at)
      FROM answers ${qayerda} GROUP BY uid, qid
    `).bind(...arg),
  ];

  await env.DB.batch(amallar);
}


/** Kalit bo'yicha qiymat yozadi (mavjud bo'lsa ustiga). */
export async function tizimYoz(env, kalit, qiymat) {
  await env.DB.prepare(
    "INSERT INTO tizim (k, v, at) VALUES (?, ?, datetime('now')) " +
    "ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at"
  ).bind(kalit, String(qiymat)).run();
}

/** Kalit bo'yicha qiymat o'qiydi. Topilmasa null. */
export async function tizimOqi(env, kalit) {
  const r = await env.DB.prepare("SELECT v FROM tizim WHERE k = ?").bind(kalit).first();
  return r ? r.v : null;
}


// ═══════════════════════════════════════════════════════════════════
// YUTUQLAR
// ═══════════════════════════════════════════════════════════════════

/** Foydalanuvchi qo'lga kiritgan yutuqlar kodlari. */
export async function yutuqlarim(env, uid) {
  const { results } = await env.DB.prepare(
    "SELECT kod, at FROM yutuq WHERE uid = ? ORDER BY at"
  ).bind(String(uid)).all();
  return results;
}

/**
 * Yangi yutuqlarni yozadi va FAQAT shu chaqiruvda yozilganlarini qaytaradi.
 *
 * NEGA RETURNING: «avval o'qib, keyin yozish» ikki parallel so'rovda
 * bitta yutuqni ikki marta e'lon qilishi mumkin — foydalanuvchi bir xil
 * tabrikni ikki marta oladi. INSERT ... ON CONFLICT DO NOTHING RETURNING
 * atomar: faqat haqiqatdan yozilgan satr qaytadi.
 */
export async function yutuqBer(env, uid, kodlar) {
  if (!kodlar.length) return [];
  const yangi = [];
  for (const kod of kodlar) {
    const r = await env.DB.prepare(
      "INSERT INTO yutuq (uid, kod) VALUES (?, ?) ON CONFLICT(uid, kod) DO NOTHING RETURNING kod"
    ).bind(String(uid), kod).first();
    if (r) yangi.push(kod);
  }
  return yangi;
}

/**
 * Yutuq shartlarini tekshirish uchun kerakli hisoblar.
 *
 * Hammasi AGREGAT jadvallardan olinadi — `answers` ga tegilmaydi.
 * Yutuqlar har kunlik yakunda tekshiriladi, ya'ni bu so'rov tez-tez
 * bajariladi: uni arzon tutish shart.
 */
export async function yutuqHolati(env, uid) {
  const u = String(uid);
  const [stat, tuzatilgan, fasl, toliq, ing] = await Promise.all([
    env.DB.prepare("SELECT a FROM user_stat WHERE uid = ? AND topic = ''").bind(u).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM mistake WHERE uid = ? AND ochiq = 0").bind(u).first(),
    env.DB.prepare("SELECT COUNT(DISTINCT fasl % 100) AS n FROM fasl_done WHERE uid = ? AND fasl < 200").bind(u).first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM daily WHERE uid = ? AND score = total AND total > 0").bind(u).first(),
    env.DB.prepare("SELECT COUNT(DISTINCT qid) AS n FROM answers WHERE uid = ? AND topic = 'Ingliz' AND correct = 1").bind(u).first(),
  ]);
  const user = await getUser(env, uid);
  return {
    jami: stat?.a || 0,
    tuzatilgan: tuzatilgan?.n || 0,
    fasl: fasl?.n || 0,
    toliqKun: toliq?.n || 0,
    inglizTogri: ing?.n || 0,
    heroKun: user.hero_jami || 0,
    heroZanjir: user.hero_n || 0,
    streak: user.streak || 0,
    kunlar: user.days || 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ATRIBUSIYA
// ═══════════════════════════════════════════════════════════════════

/**
 * Taklif qilgan odam va manbani FAQAT BIR MARTA yozadi.
 *
 * NEGA BIR MARTA: odam botga qayta-qayta kirishi mumkin, har safar
 * boshqa havola bilan. Agar har safar ustiga yozilsa, atribusiya
 * «oxirgi bosilgan havola» ni ko'rsatadi — bu esa odamni ASLIDA kim
 * olib kelganini yo'qotadi. Birinchi manba — haqiqiy manba.
 */
export async function manbaYoz(env, uid, kelgan, manba) {
  await env.DB.prepare(
    "UPDATE users SET kelgan = COALESCE(kelgan, ?), manba = COALESCE(manba, ?) WHERE uid = ?"
  ).bind(kelgan || null, manba || null, String(uid)).run();
}

/** Shu odam nechta kishini olib kelgan va ulardan nechtasi faol. */
export async function takliflarim(env, uid) {
  const r = await env.DB.prepare(`
    SELECT COUNT(*) AS jami,
           SUM(CASE WHEN days > 0 THEN 1 ELSE 0 END) AS faol
    FROM users WHERE kelgan = ?
  `).bind(String(uid)).first();
  return { jami: r?.jami || 0, faol: r?.faol || 0 };
}

/** Manbalar kesimi — qaysi kanal qancha odam olib kelgan. */
export async function manbalar(env) {
  const { results } = await env.DB.prepare(`
    SELECT COALESCE(manba, 'to''g''ridan-to''g''ri') AS manba,
           COUNT(*) AS jami,
           SUM(CASE WHEN days > 0 THEN 1 ELSE 0 END) AS faol
    FROM users GROUP BY COALESCE(manba, 'to''g''ridan-to''g''ri')
    ORDER BY jami DESC LIMIT 20
  `).all();
  return results;
}

// ═══════════════════════════════════════════════════════════════════
// SAVOL SIFATI
// ═══════════════════════════════════════════════════════════════════

/**
 * Foydalanuvchi bildirgan savol xatolari.
 *
 * NEGA MUHIM: bazada 800 dan ortiq savol bor va ularning hammasi odam
 * tomonidan yozilgan. Xato bo'lishi muqarrar — savolning o'zida,
 * variantda yoki izohda. Buni ADMIN topa olmaydi: u har bir savolni
 * qayta o'qib chiqmaydi. Foydalanuvchi esa aynan o'sha paytda,
 * savolga duch kelganda ko'radi.
 *
 * Xabar berish yo'li bo'lmasa, xato abadiy qoladi va har safar yangi
 * odamni chalg'itadi.
 */
export async function belgilanganlar(env, limit = 30) {
  const { results } = await env.DB.prepare(`
    SELECT qid, COUNT(*) AS n, MAX(at) AS oxirgi
    FROM flags GROUP BY qid ORDER BY n DESC, oxirgi DESC LIMIT ?
  `).bind(limit).all();
  return results;
}

/** Shu odam shu savolni allaqachon belgilaganmi. */
export async function belgilaganmi(env, uid, qid_) {
  const r = await env.DB.prepare(
    "SELECT 1 FROM flags WHERE uid = ? AND qid = ? LIMIT 1"
  ).bind(String(uid), qid_).first();
  return !!r;
}

/** Seansda berilgan savollar — xato bildirish ro'yxati uchun. */
export async function seansSavollari(env, uid, mode, { kun = null, fasl = null } = {}) {
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT qid, idx FROM answers
    WHERE uid = ? AND mode = ?
      AND (day  IS ? OR day  = ?)
      AND (fasl IS ? OR fasl = ?)
    ORDER BY idx
  `).bind(String(uid), mode, kun, kun, fasl, fasl).all();
  return results;
}


// ═══════════════════════════════════════════════════════════════════
// TAJRIBA: KUNLIK 5 — fikr va «yana 5 ta»
// ═══════════════════════════════════════════════════════════════════

/** Bir odam bir kunga bitta baho; qayta bossa yangilanadi. */
export async function fikrYoz(env, uid, kun, baho) {
  await env.DB.prepare(
    "INSERT INTO fikr (uid, kun, baho) VALUES (?, ?, ?) " +
    "ON CONFLICT(uid, kun) DO UPDATE SET baho = excluded.baho"
  ).bind(String(uid), kun, baho ? 1 : 0).run();
}

/** «Yana 5 ta» bosilganini belgilaydi (baho bo'lmasa ham qator ochiladi). */
export async function yanaYoz(env, uid, kun) {
  await env.DB.prepare(
    "INSERT INTO fikr (uid, kun, yana) VALUES (?, ?, 1) " +
    "ON CONFLICT(uid, kun) DO UPDATE SET yana = 1"
  ).bind(String(uid), kun).run();
}

/**
 * Davr ko'rsatkichlari [dan, gacha) — kun kalitlari 'YYYY-MM-DD'.
 * Hammasi indekslangan ustunlar (day) bo'yicha: admin so'rovi kvotani yemasin.
 */
export async function davrKorsatkichi(env, dan, gacha) {
  const [boshlagan, tugatgan, fikr] = await Promise.all([
    env.DB.prepare("SELECT COUNT(DISTINCT uid) AS n FROM answers WHERE mode = 'd' AND day >= ? AND day < ?").bind(dan, gacha).first(),
    env.DB.prepare("SELECT COUNT(*) AS n, AVG(total) AS t FROM daily WHERE day >= ? AND day < ?").bind(dan, gacha).first(),
    env.DB.prepare("SELECT COUNT(*) AS n, SUM(baho) AS ha, SUM(yana) AS yana FROM fikr WHERE kun >= ? AND kun < ?").bind(dan, gacha).first(),
  ]);
  return {
    boshlagan: boshlagan?.n || 0,
    tugatgan: tugatgan?.n || 0,
    uzunlik: Math.round(tugatgan?.t || 0),
    fikrSoni: fikr?.n || 0,
    ha: fikr?.ha || 0,
    yana: fikr?.yana || 0,
  };
}


// ═══════════════════════════════════════════════════════════════════
// FIKR-MULOHAZALAR (foydalanuvchi → admin)
// ═══════════════════════════════════════════════════════════════════

export async function murojaatYoz(env, { uid, ism, uname, matn }) {
  const r = await env.DB.prepare(
    "INSERT INTO murojaat (uid, ism, uname, matn) VALUES (?, ?, ?, ?) RETURNING id"
  ).bind(String(uid), ism || "", uname || "", matn).first();
  return r.id;
}

export async function murojaatAdminMsg(env, id, msgId) {
  await env.DB.prepare("UPDATE murojaat SET admin_msg = ? WHERE id = ?").bind(msgId, id).run();
}

/** Adminning xabari bo'yicha murojaatni topadi (javob berish uchun). */
export async function murojaatTop(env, msgId) {
  return env.DB.prepare("SELECT * FROM murojaat WHERE admin_msg = ?").bind(msgId).first();
}

export async function murojaatJavob(env, id, javob) {
  await env.DB.prepare("UPDATE murojaat SET javob = ?, javob_at = datetime('now') WHERE id = ?").bind(javob, id).run();
}

/** Oxirgi 24 soatda shu foydalanuvchi nechta yuborgan (spamdan himoya). */
export async function murojaatSoni(env, uid) {
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM murojaat WHERE uid = ? AND at > datetime('now','-1 day')"
  ).bind(String(uid)).first();
  return r?.n || 0;
}

/** Fikrni "e'longa tayyor" deb belgilaydi va egasini qaytaradi. */
export async function murojaatIsh(env, id, ish) {
  const m = await env.DB.prepare("SELECT id, uid, matn FROM murojaat WHERE id = ?").bind(id).first();
  if (!m) return null;
  await env.DB.prepare("UPDATE murojaat SET ish = ?, ochiq = 1 WHERE id = ?").bind(ish, id).run();
  return m;
}

export async function murojaatOchiq(env, n = 8) {
  const { results } = await env.DB.prepare(
    "SELECT id, matn, ish FROM murojaat WHERE ochiq = 1 ORDER BY id DESC LIMIT ?"
  ).bind(n).all();
  return results.reverse();
}

export async function murojaatChiqdi(env, ids) {
  for (const id of ids) await env.DB.prepare("UPDATE murojaat SET ochiq = 2 WHERE id = ?").bind(id).run();
}

export async function murojaatOxirgi(env, n = 10) {
  const { results } = await env.DB.prepare(
    "SELECT id, uid, ism, uname, substr(matn,1,80) AS q, javob IS NOT NULL AS javob_bor, at " +
    "FROM murojaat ORDER BY id DESC LIMIT ?"
  ).bind(n).all();
  return results;
}


// ═══════════════════════════════════════════════════════════════════
// ARAB ALIFBOSI BLOKLARI — progress fasl_done jadvalida (kalit 300 + blok)
// ═══════════════════════════════════════════════════════════════════

/** Blok 100% bilan o'tilganda yoziladi. */
export async function arabYakunla(env, uid, blok, score, total) {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO fasl_done (uid, fasl, score, total) VALUES (?, ?, ?, ?)"
  ).bind(String(uid), 300 + blok, score, total).run();
}

/** Ketma-ket o'tilgan bloklar soni (1-blokdan boshlab uzilmasdan). */
export async function arabBosqich(env, uid) {
  const { results } = await env.DB.prepare(
    "SELECT fasl FROM fasl_done WHERE uid = ? AND fasl BETWEEN 301 AND 399"
  ).bind(String(uid)).all();
  const bor = new Set(results.map((r) => r.fasl - 300));
  let n = 0;
  while (bor.has(n + 1)) n++;
  return n;
}


// ═══════════════════════════════════════════════════════════════════
// PREMIUM
// ═══════════════════════════════════════════════════════════════════

/** Faol premium bo'lsa qatorni qaytaradi, aks holda null. */
export async function premiumHolat(env, uid) {
  return env.DB.prepare(
    "SELECT uid, tarif, boshlandi, tugaydi, manba FROM premium WHERE uid = ? AND tugaydi > datetime('now')"
  ).bind(String(uid)).first();
}

/** Kunlar qo'shadi: faol bo'lsa tugash sanasidan, bo'lmasa hozirdan boshlab. */
export async function premiumBer(env, uid, kun, manba = "admin", izoh = "") {
  await env.DB.prepare(`
    INSERT INTO premium (uid, tugaydi, manba, izoh)
    VALUES (?1, datetime('now', '+' || ?2 || ' days'), ?3, ?4)
    ON CONFLICT(uid) DO UPDATE SET
      tugaydi = datetime(MAX(tugaydi, datetime('now')), '+' || ?2 || ' days'),
      manba = ?3, izoh = ?4
  `).bind(String(uid), String(kun), manba, izoh).run();
  return premiumHolat(env, uid);
}

export async function premiumOl(env, uid) {
  await env.DB.prepare("UPDATE premium SET tugaydi = datetime('now', '-1 second') WHERE uid = ?")
    .bind(String(uid)).run();
}

export async function premiumRoyxat(env, n = 15) {
  const { results } = await env.DB.prepare(`
    SELECT p.uid, p.tugaydi, p.manba, u.name, u.uname FROM premium p
    LEFT JOIN users u ON u.uid = p.uid
    WHERE p.tugaydi > datetime('now') ORDER BY p.tugaydi DESC LIMIT ?
  `).bind(n).all();
  return results;
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN HISOBOTI — har bir ko'rsatkich bitta oddiy so'rov
// ═══════════════════════════════════════════════════════════════════

const sonQ = async (env, sql, ...b) => (await env.DB.prepare(sql).bind(...b).first())?.n || 0;

export async function adminHisobot(env, kun) {
  const oqish = (kunlar) => sonQ(env,
    "SELECT COUNT(*) AS n FROM users WHERE date(seen, '+5 hours') >= date(?, ?) AND blocked = 0", kun, `-${kunlar} days`);
  const [h, jami, bloklagan, yangi, dau, wau, mau, xavf, fikr, prem, trend, qiyin] = await Promise.all([
    kunlikHisobot(env, kun),
    sonQ(env, "SELECT COUNT(*) AS n FROM users"),
    sonQ(env, "SELECT COUNT(*) AS n FROM users WHERE blocked = 1"),
    sonQ(env, "SELECT COUNT(*) AS n FROM users WHERE date(joined, '+5 hours') = ?", kun),
    sonQ(env, "SELECT COUNT(*) AS n FROM users WHERE date(seen, '+5 hours') = ? AND blocked = 0", kun),
    oqish(6),
    oqish(29),
    sonQ(env, `SELECT COUNT(*) AS n FROM users WHERE blocked = 0
               AND date(seen, '+5 hours') BETWEEN date(?, '-14 days') AND date(?, '-3 days')`, kun, kun),
    sonQ(env, "SELECT COUNT(*) AS n FROM murojaat WHERE javob IS NULL AND ish IS NULL"),
    sonQ(env, "SELECT COUNT(*) AS n FROM premium WHERE tugaydi > datetime('now')"),
    env.DB.prepare("SELECT day, COUNT(*) AS n FROM daily WHERE day >= date(?, '-6 days') GROUP BY day ORDER BY day")
      .bind(kun).all().then((r) => r.results),
    env.DB.prepare(`SELECT topic, COUNT(*) AS a, SUM(correct) AS c FROM answers
                    WHERE at > datetime('now', '-7 days') AND topic IS NOT NULL AND topic != ''
                    GROUP BY topic HAVING a >= 10`).all().then((r) => r.results),
  ]);
  const [duelOchildi, duelTugadi, manbaBugun] = await Promise.all([
    sonQ(env, "SELECT COUNT(*) AS n FROM duel WHERE date(at, '+5 hours') = ?", kun).catch(() => 0),
    sonQ(env, "SELECT COUNT(*) AS n FROM duel WHERE bitdi = 1 AND date(at, '+5 hours') = ?", kun).catch(() => 0),
    env.DB.prepare(`SELECT COALESCE(manba, '') AS m, COUNT(*) AS n FROM users WHERE date(joined, '+5 hours') = ?
                    GROUP BY COALESCE(manba, '') ORDER BY n DESC LIMIT 5`).bind(kun).all().then((r) => r.results).catch(() => []),
  ]);
  return { h, jami, bloklagan, yangi, dau, wau, mau, xavf, fikr, prem, trend, qiyin, duelOchildi, duelTugadi, manbaBugun };
}


/** Arabcha savol rasmi (base64 JPEG). Topilmasa null. */
export async function rasmOl(env, kalit) {
  const r = await env.DB.prepare("SELECT b FROM rasm WHERE k = ?").bind(kalit).first();
  return r ? r.b : null;
}

/**
 * Shu seansdagi oxirgi javoblardan nechtasi ketma-ket vaqt tugab o'tkazib yuborilgan (maks. 3).
 * Kunlik rejimda seans = bugungi kun, fasl rejimlarida = fasl.
 */
export async function ketmaKetOtkazilgan(env, uid, mode, day, fasl) {
  const sharti = day != null ? "day = ?" : "fasl = ?";
  const { results } = await env.DB.prepare(
    `SELECT skipped FROM answers WHERE uid = ? AND mode = ? AND ${sharti} ORDER BY id DESC LIMIT 3`
  ).bind(String(uid), mode, day != null ? day : fasl).all();
  let n = 0;
  for (const r of results) { if (r.skipped) n++; else break; }
  return n;
}


// ═══════════════════════════════════════════════════════════════════
// DO'ST BILAN DUEL
// ═══════════════════════════════════════════════════════════════════

const tomon = (x) => (x === "b" ? "b" : "a");   // ustun nomi tashqaridan kelmaydi, shunda ham tekshiramiz

export async function duelSoni(env, uid) {
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM duel WHERE a = ? AND b IS NULL AND at > datetime('now','-1 day')"
  ).bind(String(uid)).first();
  return r?.n || 0;
}

export async function duelYarat(env, uid) {
  const r = await env.DB.prepare("INSERT INTO duel (a) VALUES (?) RETURNING id").bind(String(uid)).first();
  return r.id;
}

export async function duelOl(env, id) {
  return env.DB.prepare("SELECT * FROM duel WHERE id = ?").bind(id).first();
}

/** Do'stni ikkinchi tomon qilib yozadi. Faqat bo'sh joy bo'lsa va o'zi bilan emas. */
export async function duelQosh(env, id, uid) {
  const r = await env.DB.prepare("UPDATE duel SET b = ? WHERE id = ? AND b IS NULL AND a != ?")
    .bind(String(uid), id, String(uid)).run();
  return r.meta.changes === 1;
}

export async function duelBosh(env, id, x) {
  const k = tomon(x);
  const r = await env.DB.prepare(`UPDATE duel SET ${k}_start = ? WHERE id = ? AND ${k}_start IS NULL`)
    .bind(Date.now(), id).run();
  return r.meta.changes === 1;
}

export async function duelJavob(env, id, x, ok) {
  const k = tomon(x);
  await env.DB.prepare(`UPDATE duel SET ${k}_ok = ${k}_ok + ? WHERE id = ?`).bind(ok ? 1 : 0, id).run();
}

export async function duelTugat(env, id, x) {
  const k = tomon(x);
  await env.DB.prepare(`UPDATE duel SET ${k}_done = 1, ${k}_ms = ? - ${k}_start WHERE id = ?`)
    .bind(Date.now(), id).run();
}

/** Muddati o'tgan duellar: bir tomon tugatgan, ikkinchisi `soat` ichida tugatmagan → ikkinchisi yutqazadi (ok = -1).
 *  Ikkalasi ham tugatmagan, 1 kundan eski duel jimgina yopiladi (bitdi = 2). Yangi yopilgan duellarni qaytaradi. */
export async function duelMuddat(env, soat = 6) {
  const chegara = Date.now() - soat * 3600e3;
  await env.DB.prepare("UPDATE duel SET bitdi = 2 WHERE bitdi = 0 AND b IS NOT NULL AND a_done = 0 AND b_done = 0 AND at < datetime('now','-1 day')").run();
  const q = (await env.DB.prepare(
    "SELECT * FROM duel WHERE bitdi = 0 AND b IS NOT NULL AND ((a_done = 1 AND b_done = 0 AND a_start + a_ms < ?) OR (b_done = 1 AND a_done = 0 AND b_start + b_ms < ?))"
  ).bind(chegara, chegara).all()).results || [];
  const yopilgan = [];
  for (const d of q) {
    const k = d.a_done ? "b" : "a";   // tugatmagan tomon
    const r = await env.DB.prepare(`UPDATE duel SET bitdi = 1, ${k}_done = 1, ${k}_ok = -1, ${k}_ms = 0 WHERE id = ? AND bitdi = 0`).bind(d.id).run();
    if (r.meta.changes === 1) yopilgan.push(await duelOl(env, d.id));
  }
  return yopilgan;
}

/** Natijani yuborish huquqi: ikkala tomon tugatgan bo'lsa va hali yuborilmagan bo'lsa true. */
export async function duelYakunla(env, id) {
  const r = await env.DB.prepare("UPDATE duel SET bitdi = 1 WHERE id = ? AND bitdi = 0 AND a_done = 1 AND b_done = 1")
    .bind(id).run();
  return r.meta.changes === 1;
}


// ═══════════════════════════════════════════════════════════════════
// SAQLANGAN SAVOLLAR
// ═══════════════════════════════════════════════════════════════════

/** Saqlangan bo'lsa olib tashlaydi, bo'lmasa saqlaydi. Yangi holatni qaytaradi (true = saqlangan). */
export async function saqlashToggle(env, uid, qidV) {
  const bor = await env.DB.prepare("SELECT 1 AS x FROM saqlangan WHERE uid = ? AND qid = ?").bind(String(uid), qidV).first();
  if (bor) {
    await env.DB.prepare("DELETE FROM saqlangan WHERE uid = ? AND qid = ?").bind(String(uid), qidV).run();
    return false;
  }
  await env.DB.prepare("INSERT OR IGNORE INTO saqlangan (uid, qid) VALUES (?, ?)").bind(String(uid), qidV).run();
  return true;
}

export async function saqlanganlar(env, uid, n = 10) {
  const { results } = await env.DB.prepare(
    "SELECT qid FROM saqlangan WHERE uid = ? ORDER BY at DESC, rowid DESC LIMIT ?"
  ).bind(String(uid), n).all();
  return results.map((r) => r.qid);
}

export async function saqlanganSoni(env, uid) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM saqlangan WHERE uid = ?").bind(String(uid)).first();
  return r?.n || 0;
}

export async function saqlanganOchir(env, uid, qidV) {
  await env.DB.prepare("DELETE FROM saqlangan WHERE uid = ? AND qid = ?").bind(String(uid), qidV).run();
}


// ═══════════════════════════════════════════════════════════════════
// REYTING (davr bo'yicha)
// ═══════════════════════════════════════════════════════════════════

const BELGILAR_SQL = `
  CASE WHEN p.tugaydi > datetime('now') THEN 1 ELSE 0 END AS p,
  CASE WHEN u.super_until > datetime('now') THEN 1 ELSE 0 END AS sm,
  CASE WHEN u.hero_until > datetime('now') THEN 1 ELSE 0 END AS hr`;

/** Viktorina reytingi: berilgan kundan (YYYY-MM-DD) boshlab ball yig'indisi. */
export async function reytingDavr(env, dan) {
  const { results } = await env.DB.prepare(`
    SELECT d.uid, SUM(d.score) AS s, SUM(d.total) AS t, COUNT(*) AS k, u.name AS n, u.uname AS un,${BELGILAR_SQL}
    FROM daily d LEFT JOIN users u ON u.uid = d.uid LEFT JOIN premium p ON p.uid = d.uid
    WHERE d.day >= ?
    GROUP BY d.uid ORDER BY s DESC, k ASC LIMIT 100
  `).bind(dan).all();
  return results;
}

/** Duel reytingi: tugagan duellar bo'yicha g'alabalar. G'olib — ko'p to'g'ri javob, teng bo'lsa tezroq. */
export async function duelReyting(env, dan) {
  const { results } = await env.DB.prepare(`
    WITH r AS (
      SELECT a AS uid, CASE WHEN a_ok > b_ok OR (a_ok = b_ok AND b_ms - a_ms >= 1000) THEN 1 ELSE 0 END AS w FROM duel WHERE bitdi = 1 AND at >= ?
      UNION ALL
      SELECT b AS uid, CASE WHEN b_ok > a_ok OR (b_ok = a_ok AND a_ms - b_ms >= 1000) THEN 1 ELSE 0 END AS w FROM duel WHERE bitdi = 1 AND at >= ?
    )
    SELECT r.uid, SUM(r.w) AS g, COUNT(*) AS o, u.name AS n, u.uname AS un,${BELGILAR_SQL}
    FROM r LEFT JOIN users u ON u.uid = r.uid LEFT JOIN premium p ON p.uid = r.uid
    GROUP BY r.uid ORDER BY g DESC, o ASC LIMIT 100
  `).bind(dan, dan).all();
  return results;
}
