/**
 * Ustozim Nurim — universal viktorina boti (Cloudflare Worker).
 *
 * REJIMLAR
 *  1) Kunlik viktorina — hamma bir kunda bir xil savollarni oladi (musobaqa).
 *  2) O'z tezligimda   — yangi a'zo 1-savoldan boshlab ketma-ket yuradi.
 *
 * IMKONIYATLAR
 *  - Menyu (doimiy klaviatura)
 *  - Natijalarim: umumiy ball, foiz, streak, mavzular kesimida
 *  - Reyting: guruhda kunlik top-10, lichkada shaxsiy o'rin
 *  - Streak (ketma-ket kunlar)
 *  - 21:00 da eslatma, 22:00 da guruhga reyting (cron)
 *  - Admin: /stats
 *
 * ARXITEKTURA IZOHI
 *  Cloudflare KV "eventually consistent" — yozilgan qiymat darhol o'qilmasligi mumkin.
 *  Shuning uchun "nechanchi savoldaman" degan holat hisoblagichdan EMAS,
 *  poll_id → savol indeksi bog'lanishidan olinadi. Bu viktorinaning
 *  yarim yo'lda qotib qolishini oldini oladi.
 */

import bank from "./quiz_bank.json";
import { pickToday, todayCount, dayIndex, shuffleOptions, planFor } from "./config.js";
import {
  KITOB_JAMI, KITOB_BATCH, faslQuestions, faslLabel, faslMeta,
  faslSavolSoni, kitobJamiSavol, turLabel, progressBar, marafonKuni, FASL,
} from "./kitob.js";

/**
 * Yuborilgan, lekin hali muddati tugamagan savollar.
 * fetch() so'rov oxirida bularni ctx.waitUntil ga topshiradi —
 * shunda Telegram xabar yubormasa ham vaqt tugashini o'zimiz ushlaymiz.
 */

/**
 * Zanjir uchun ajratilgan real vaqt.
 *
 * Jonli sinov ko'rsatdi: Cloudflare waitUntil'ni ~30 soniyadan keyin
 * to'xtatadi. Shuning uchun bir marta avtomatik o'tkazamiz (bu "bir zumga
 * chalg'idim" holatini qoplaydi), so'ng foydalanuvchiga "Davom etish"
 * tugmasini beramiz — bosgan zahoti to'xtagan joyidan davom etadi.
 */

const SEQ_BATCH = 5;          // "O'z tezligimda" rejimida bir seansda nechta savol
const TTL_POLL = 60 * 60 * 12;
const TTL_DAY = 60 * 60 * 24 * 3;
const TTL_USER = 60 * 60 * 24 * 400;

// ——————————————————————————————————————————————— yordamchi

async function tg(env, method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

/**
 * KV ro'yxatini TO'LIQ o'qiydi.
 *
 * env.SESSIONS.list() bir chaqiruvda ko'pi bilan 1000 ta kalit qaytaradi va
 * qolganini list_complete:false + cursor orqali bildiradi. Sahifalashsiz
 * 1000-chi a'zodan keyingilari jimgina yo'qoladi: eslatma bormaydi, reytingga
 * tushmaydi, xato ham chiqmaydi. Shuning uchun barcha ro'yxatlar shu yerdan
 * o'tadi.
 */
async function listAll(env, prefix) {
  const keys = [];
  let cursor;
  for (let sahifa = 0; sahifa < 50; sahifa++) {   // 50 000 kalitgacha yetadi
    const r = await env.SESSIONS.list(cursor ? { prefix, cursor } : { prefix });
    keys.push(...r.keys);
    if (r.list_complete) return keys;
    cursor = r.cursor;
  }
  console.warn("listAll: chegaraga yetdi, prefix =", prefix);
  return keys;
}

/** Ro'yxatni to'plamlarga bo'lib beradi — parallel ishlov berish uchun. */
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const dayKey = (offset = 0) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

const esc = (s) =>
  String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const clip = (s, n) => (String(s).length <= n ? String(s) : String(s).slice(0, n - 1) + "…");

const MENU = {
  keyboard: [
    [{ text: "🧠 Kunlik viktorina" }, { text: "📖 Kitob marafoni" }],
    [{ text: "📚 O'z tezligimda" }, { text: "📊 Natijalarim" }],
    [{ text: "🏆 Reyting" }, { text: "ℹ️ Yordam" }],
  ],
  resize_keyboard: true,
};

// Butun bazaning barqaror tartibi ("o'z tezligimda" rejimi uchun)
let SEQ = null;
function seqOrder() {
  if (SEQ) return SEQ;
  const arr = bank.slice();
  let s = 987654321 >>> 0;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  SEQ = arr;
  return SEQ;
}

// ——————————————————————————————————————————————— foydalanuvchi

async function getUser(env, uid) {
  const raw = await env.SESSIONS.get(`u:${uid}`);
  return raw
    ? JSON.parse(raw)
    : { seq: 0, streak: 0, lastDaily: null, answered: 0, correct: 0, topics: {}, days: 0 };
}

async function saveUser(env, uid, u) {
  // Foydalanuvchi biror harakat qilyapti — demak bot bloklanmagan.
  // Bu belgini shu yerda tozalash eng ishonchli joy: qaytib kelgan odam
  // avtomatik ravishda yana eslatma oladigan bo'ladi.
  if (u.blocked) delete u.blocked;
  await env.SESSIONS.put(`u:${uid}`, JSON.stringify(u), { expirationTtl: TTL_USER });
}

async function recordAnswer(env, uid, topic, ok) {
  const u = await getUser(env, uid);
  u.answered = (u.answered || 0) + 1;
  if (ok) u.correct = (u.correct || 0) + 1;
  u.topics = u.topics || {};
  const t = u.topics[topic] || { a: 0, c: 0 };
  t.a += 1; if (ok) t.c += 1;
  u.topics[topic] = t;
  await saveUser(env, uid, u);
}

// ——————————————————————————————————————————————— savol yuborish

// ——— Savol taymeri (Telegram "Limit Duration" = open_period) ———
//
// Taymer FAQAT kunlik viktorinada qo'yiladi. Sababi oddiy: kunlik natija
// reytingga tushadi, demak hamma bir xil sharoitda bo'lishi kerak.
//
// "O'z tezligimda" va "Kitob marafoni" — o'rganish rejimlari. Ularda taymer
// yo'q: nomi "o'z tezligimda" bo'lgan rejim odamni vaqtga qisishi mumkin
// emas, kitobni tushunib o'qish esa shoshilishni ko'tarmaydi. Har kimning
// o'qish tezligi har xil — sekin o'qiydigan odamni jazolash uni butunlay
// yo'qotishga olib keladi.
//
// Qiymat matn hajmiga qarab hisoblanadi: o'zbekcha savol + 4 ta variantni
// o'qib, tushunib, tanlash kerak. 10 soniya bunga yetmaydi.
const OP_MIN = 20;          // eng qisqa savolga ham shuncha
const OP_MAX = 45;          // eng uzun/qiyin savolga
const OP_BASE = 12;         // bazaviy
const OP_PER_WORD = 0.8;    // har bir so'zga — o'qish tezligi ~75 so'z/daqiqa
const OP_THINK_BONUS = 8;   // mantiq savoli: o'qish emas, o'ylash vaqti
const OP_BUFFER = 3;        // tarmoq va Telegram kechikishi

function openPeriodFor(q, mode) {
  if (mode !== "d") return null;            // faqat kunlik viktorina
  const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
  const total = words(q.q) + (q.o || []).reduce((n, o) => n + words(o), 0);
  let value = OP_BASE + total * OP_PER_WORD + OP_BUFFER;
  if (q.t === "Mantiq") value += OP_THINK_BONUS;
  return Math.max(OP_MIN, Math.min(OP_MAX, Math.round(value)));
}

async function sendQuestion(env, chatId, uid, mode, index, questions, extra = {}) {
  const q = questions[index];
  const izoh = mode === "k" ? turLabel(q.k) : topicLabel(q.t);
  const vaqt = openPeriodFor(q, mode);

  // Sarlavhada taymer borligini oldindan aytamiz. Telegramning o'z
  // hisoblagichi kichkina va kech ko'zga tashlanadi — odam savolni o'qiy
  // boshlaganda vaqt ketayotganini bilishi kerak.
  const sarlavha = vaqt
    ? `Savol ${index + 1} / ${questions.length}  ·  ⏱ ${vaqt} soniya`
    : `Savol ${index + 1} / ${questions.length}  ·  vaqt cheklovsiz`;

  const payload = {
    chat_id: chatId,
    question: clip(`${sarlavha}\n${q.q}`, 300),
    options: q.o.map((o) => clip(o, 100)),
    type: "quiz",
    correct_option_id: q.c,
    is_anonymous: false,
    explanation: clip(izoh, 200),
  };
  if (vaqt) payload.open_period = vaqt;

  const res = await tg(env, "sendPoll", payload);
  if (res.ok && res.result?.poll?.id) {
    await env.SESSIONS.put(
      `p:${res.result.poll.id}`,
      JSON.stringify({ u: uid, i: index, m: mode, c: chatId, msg: res.result.message_id, ...extra }),
      { expirationTtl: TTL_POLL }
    );
    return true;
  }
  console.error("sendPoll", JSON.stringify(res));
  return false;
}

/**
 * Savolni oldinga surish huquqini OLADI.
 *
 * Viktorinani bir necha yo'l oldinga surishi mumkin: javob berish, Telegramning
 * "poll yopildi" xabari, "Davom etish" tugmasi. Cloudflare KV darhol
 * yangilanmagani uchun "javob berilganmi?" degan tekshiruv ishonchsiz —
 * ikki yo'l bir vaqtda o'tib ketib, foydalanuvchiga bitta savol ikki marta
 * yoki ketma-ket 3-4 ta savol yuborilardi.
 *
 * Yechim: p:{pollId} yozuvining o'zi kalit vazifasini bajaradi. Kim uni
 * birinchi bo'lib o'chira olsa — o'sha davom ettiradi, qolganlari to'xtaydi.
 * Bitta poll bitta marta o'chiriladi, shuning uchun zanjir ham bitta bo'ladi.
 */
async function navbatniOl(env, pollId) {
  const raw = await env.SESSIONS.get(`p:${pollId}`);
  if (!raw) return null;
  await env.SESSIONS.delete(`p:${pollId}`);
  return JSON.parse(raw);
}

function topicLabel(t) {
  return {
    IT: "💻 IT va dasturlash",
    Liderlik: "🌟 Fazilatli liderlik",
    Diniy: "🕌 Diniy savodxonlik",
    Kino: "🎬 Kino va multfilm",
    Mantiq: "🧩 Mantiq va zakovat",
    Kitob: "📖 Ilm olish sirlari",
  }[t] || t;
}

// Rejimga qarab bugungi savollar to'plami
function questionsFor(mode, uid, u) {
  if (mode === "d") return pickToday(bank);
  const order = seqOrder();
  const start = (u.seq || 0) % order.length;
  const day = dayIndex();
  const out = [];
  for (let i = 0; i < SEQ_BATCH; i++) out.push(order[(start + i) % order.length]);
  return out.map((q, i) => shuffleOptions(q, day + start + i));
}

// ——————————————————————————————————————————————— kunlik rejim

const aKey = (uid, i) => `a:${uid}:${dayKey()}:${i}`;
const doneKey = (uid) => `done:${uid}:${dayKey()}`;

async function firstUnanswered(env, uid, total) {
  for (let i = 0; i < total; i++) {
    if ((await env.SESSIONS.get(aKey(uid, i))) === null) return i;
  }
  return total;
}

async function startDaily(env, chatId, uid, name) {
  const questions = pickToday(bank);
  const total = questions.length;

  const done = await env.SESSIONS.get(doneKey(uid));
  if (done !== null) {
    const d = JSON.parse(done);
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `✅ <b>Bugungi viktorinani yakunlagansiz.</b>\n\n` +
        `Natija: <b>${d.score} / ${d.total}</b>\n\n` +
        `📚 Yana mashq qilmoqchimisiz? <b>«O'z tezligimda»</b> rejimini tanlang — ` +
        `u yerda bazadagi barcha ${bank.length} ta savol ketma-ket keladi.`,
      reply_markup: MENU,
    });
    return;
  }

  const next = await firstUnanswered(env, uid, total);
  if (next >= total) { await finishDaily(env, chatId, uid, total, name); return; }

  if (next === 0) {
    const plan = planFor(dayIndex());
    const lines = Object.entries(plan).filter(([, n]) => n)
      .map(([t, n]) => `${topicLabel(t)} — ${n} ta`).join("\n");
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `🧠 <b>Kunlik viktorina</b>\n\n${lines}\n\n` +
        `Jami: <b>${total} ta savol</b>\n` +
        `Har savolga bitta javob tanlang — keyingisi avtomatik keladi.\n\n` +
        `Omad! 🍀`,
    });
  } else {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: `▶️ Davom etamiz — ${next + 1}/${total}-savol:`,
    });
  }
  await sendQuestion(env, chatId, uid, "d", next, questions);
}

async function finishDaily(env, chatId, uid, total, name, known = {}) {
  if ((await env.SESSIONS.get(doneKey(uid))) !== null) return;

  let score = 0;
  for (let i = 0; i < total; i++) {
    const v = i in known ? known[i] : await env.SESSIONS.get(aKey(uid, i));
    if (v === "1") score += 1;
  }
  const pct = Math.round((score / total) * 100);
  await env.SESSIONS.put(doneKey(uid), JSON.stringify({ score, total }), { expirationTtl: TTL_DAY });

  // streak va hisoblagichlar
  const u = await getUser(env, uid);
  if ((u.answered || 0) < total) {          // eski ma'lumot bilan nomuvofiqlikni tuzatish
    u.answered = total;
    u.correct = Math.max(u.correct || 0, score);
  }
  u.streak = u.lastDaily === dayKey(-1) ? (u.streak || 0) + 1 : 1;
  u.lastDaily = dayKey();
  u.days = (u.days || 0) + 1;
  await saveUser(env, uid, u);

  // reyting yozuvi
  await env.SESSIONS.put(
    `b:${dayKey()}:${uid}`,
    JSON.stringify({ n: name || u.name || "Ishtirokchi", un: u.uname || "", s: score, t: total }),
    { expirationTtl: TTL_DAY }
  );

  const verdict =
    pct === 100 ? "🏆 Mukammal! Barcha savollar to'g'ri." :
    pct >= 80 ? "🌟 Ajoyib natija! Shu zayilda davom eting." :
    pct >= 60 ? "👍 Yaxshi. Yana bir oz mashq — zo'r bo'ladi." :
    pct >= 40 ? "💪 Yomon emas. Har kuni ishlasangiz, natija tez o'sadi." :
                "📚 Bugun qiyin bo'ldi. Muhimi — urinib ko'rdingiz!";

  const filled = Math.round(pct / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  const streakLine = u.streak > 1 ? `\n🔥 <b>${u.streak} kun ketma-ket!</b> Zanjirni uzmang.\n` : "\n";

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `🎯 <b>Viktorina yakunlandi!</b>\n\n` +
      `Natija: <b>${score} / ${total}</b>  (${pct}%)\n<code>${bar}</code>\n${streakLine}\n` +
      `${verdict}\n\n` +
      `🏆 Bugungi reyting soat 22:00 da guruhga chiqadi.`,
    reply_markup: MENU,
  });
}

// ——————————————————————————————————————————————— o'z tezligida rejim

const seqPollTotal = (u) => SEQ_BATCH;

async function startSeq(env, chatId, uid) {
  const u = await getUser(env, uid);
  const order = seqOrder();
  const qs = questionsFor("s", uid, u);
  const from = (u.seq || 0) + 1;
  const to = (u.seq || 0) + SEQ_BATCH;

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `📚 <b>O'z tezligimda</b>\n\n` +
      `Savollar: <b>${from}–${Math.min(to, order.length)}</b> / ${order.length}\n` +
      `Bu rejimda kun cheklovi yo'q — xohlagancha davom etasiz.`,
  });
  await sendQuestion(env, chatId, uid, "s", 0, qs);
}

// ——————————————————————————————————————————————— kitob marafoni

const kKey = (uid, f, i) => `k:${uid}:${f}:${i}`;
const kDoneKey = (uid, f) => `kd:${uid}:${f}`;

function joriyFasl(u) {
  return Math.min((u.kitob || 0) + 1, KITOB_JAMI);
}

async function kitobMenyu(env, chatId, uid) {
  const u = await getUser(env, uid);
  const done = u.kitob || 0;
  const joriy = joriyFasl(u);
  const tugagan = done >= KITOB_JAMI;

  const satrlar = [];
  for (const f of [joriy - 1, joriy, joriy + 1].filter((n) => n >= 1 && n <= KITOB_JAMI)) {
    const belgi = f <= done ? "✅" : f === joriy ? "▶️" : "🔒";
    satrlar.push(`${belgi} ${faslLabel(f)}`);
  }

  const tugma = tugagan
    ? [[{ text: "🔁 Boshidan takrorlash", callback_data: "k:1" }]]
    : [
        [{ text: `▶️ ${joriy}-faslni boshlash`, callback_data: `k:${joriy}` }],
        done > 0 ? [{ text: "🔁 O'tgan faslni takrorlash", callback_data: `k:${done}` }] : [],
      ].filter((r) => r.length);

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `📖 <b>«Ilm olish sirlari» marafoni</b>\n` +
      `<i>Imom Zarnujiy — Ta'limul muta'allim</i>\n\n` +
      `${progressBar(done)}  <b>${done}/${KITOB_JAMI}</b> fasl\n\n` +
      satrlar.join("\n") +
      (tugagan
        ? `\n\n🎓 <b>Tabriklaymiz! Kitobni to'liq yakunladingiz.</b>`
        : `\n\nHar bosqichda o'sha faslga oid <b>${faslSavolSoni(joriy)}</b> ta savol bo'ladi. ` +
          `Kun cheklovi yo'q — o'zingizga qulay tezlikda yuring.`),
    reply_markup: { inline_keyboard: tugma },
  });
}

async function startFasl(env, chatId, uid, faslNo) {
  const u = await getUser(env, uid);
  const joriy = joriyFasl(u);

  if (faslNo > joriy) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `🔒 <b>${faslNo}-fasl hali ochilmagan.</b>\n\nAvval ${joriy}-faslni yakunlashingiz kerak.`,
    });
    return kitobMenyu(env, chatId, uid);
  }

  const qs = faslQuestions(faslNo, uid, faslNo <= (u.kitob || 0) ? 1 : 0);
  if (!qs.length) {
    await tg(env, "sendMessage", { chat_id: chatId, text: "Bu faslga savollar hali qo'shilmagan." });
    return;
  }

  // Yarim yo'lda to'xtab qolgan bo'lsa — o'sha yerdan davom etamiz,
  // boshidan qayta boshlamaymiz.
  let keyingi = 0;
  while (keyingi < qs.length && (await env.SESSIONS.get(kKey(uid, faslNo, keyingi))) !== null) {
    keyingi++;
  }
  if (keyingi >= qs.length) {
    for (let i = 0; i < KITOB_BATCH; i++) await env.SESSIONS.delete(kKey(uid, faslNo, i));
    keyingi = 0;
  }

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      keyingi === 0
        ? `${faslLabel(faslNo)}\n\n` +
          `Savollar soni: <b>${qs.length}</b> ta\n` +
          `Bosqich: <b>${faslNo}/${KITOB_JAMI}</b>\n\nOmad! 🍀`
        : `▶️ Davom etamiz — ${keyingi + 1}/${qs.length}-savol:`,
  });
  await sendQuestion(env, chatId, uid, "k", keyingi, qs, { f: faslNo });
}

async function finishFasl(env, chatId, uid, faslNo, total, oxirgi) {
  let ball = oxirgi ? 1 : 0;
  for (let i = 0; i < total - 1; i++) {
    if ((await env.SESSIONS.get(kKey(uid, faslNo, i))) === "1") ball++;
  }
  const foiz = Math.round((ball / total) * 100);

  const u = await getUser(env, uid);
  const yangi = faslNo > (u.kitob || 0);
  if (yangi) u.kitob = faslNo;
  u.kitobBall = (u.kitobBall || 0) + (yangi ? ball : 0);
  u.kitobJavob = (u.kitobJavob || 0) + (yangi ? total : 0);
  await saveUser(env, uid, u);
  await env.SESSIONS.put(kDoneKey(uid, faslNo), JSON.stringify({ ball, total }), { expirationTtl: TTL_USER });

  // Kitob marafonining kunlik reytingi — kanalga aynan shu chiqadi.
  // Ilgari kanalga kunlik VIKTORINA jadvali ketardi: ikkala joyga bir xil
  // ro'yxat tushib, kanal mazmuniga aloqasiz bo'lib qolardi.
  // Faqat birinchi urinish hisobga olinadi (yangi), takror ishlash reytingni
  // ko'tarmasin uchun.
  if (yangi) {
    await env.SESSIONS.put(
      `kb:${dayKey()}:${uid}`,
      JSON.stringify({ n: u.name || "Ishtirokchi", un: u.uname || "", s: ball, t: total, f: faslNo }),
      { expirationTtl: TTL_DAY }
    );
  }

  const baho =
    foiz === 100 ? "🏆 Mukammal! Faslni to'liq o'zlashtirdingiz."
    : foiz >= 75 ? "👏 Juda yaxshi. Fasl mazmuni o'zlashtirilgan."
    : foiz >= 50 ? "🙂 Yomonmas, lekin faslni qayta o'qib chiqsangiz foydali bo'ladi."
    : "📖 Bu faslni qaytadan o'qishni tavsiya qilaman — mazmuni hali mustahkamlanmagan.";

  const done = Math.max(u.kitob || 0, faslNo);
  const tugadi = done >= KITOB_JAMI;

  const tugma = tugadi
    ? [[{ text: "📊 Natijalarim", callback_data: "stats" }]]
    : [[{ text: `▶️ ${done + 1}-faslga o'tish`, callback_data: `k:${done + 1}` }],
       [{ text: "📖 Marafon menyusi", callback_data: "kmenu" }]];

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `${faslLabel(faslNo)}\n\n` +
      `Natija: <b>${ball}/${total}</b> — ${foiz}%\n${baho}\n\n` +
      `${progressBar(done)}  <b>${done}/${KITOB_JAMI}</b> fasl` +
      (tugadi
        ? `\n\n🎓 <b>MARAFON YAKUNLANDI!</b>\n\n` +
          `Siz «Ilm olish sirlari» kitobining barcha ${KITOB_JAMI} bosqichini o'tdingiz.\n` +
          `Umumiy natija: <b>${u.kitobBall}/${u.kitobJavob}</b> ` +
          `(${u.kitobJavob ? Math.round((u.kitobBall / u.kitobJavob) * 100) : 0}%)\n\n` +
          `<i>«Ilm o'rgan har on, ilm ahliga ziynatu fazilat.»</i>`
        : ``),
    reply_markup: { inline_keyboard: tugma },
  });
}

// ——————————————————————————————————————————————— javob qabul qilish

async function handleAnswer(env, pa) {
  // Kalitni olamiz — shu savolni oldinga surish huquqi bittada bo'ladi.
  const rec = await navbatniOl(env, pa.poll_id);
  if (!rec) return;
  const { u: uid, i: index, m: mode, c: chatId, f: faslNo } = rec;
  if (!pa.user || pa.user.id !== uid) return;

  const name = [pa.user.first_name, pa.user.last_name].filter(Boolean).join(" ");
  const uname = pa.user.username || "";
  // Ism va username'ni saqlab qo'yamiz: vaqt tugab avtomatik yakunlanganda
  // poll_answer kelmaydi va reytingda "Ishtirokchi" deb chiqib qolardi.
  if (name || uname) {
    const uu = await getUser(env, uid);
    if (uu.name !== name || uu.uname !== uname) {
      if (name) uu.name = name;
      uu.uname = uname;
      await saveUser(env, uid, uu);
    }
  }

  if (mode === "k") {
    const u0 = await getUser(env, uid);
    const qs = faslQuestions(faslNo, uid, faslNo <= (u0.kitob || 0) ? 1 : 0);
    if (index >= qs.length) return;
    if ((await env.SESSIONS.get(kKey(uid, faslNo, index))) !== null) return;

    const q = qs[index];
    const ok = (pa.option_ids || [])[0] === q.c;
    await env.SESSIONS.put(kKey(uid, faslNo, index), ok ? "1" : "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, "Kitob", ok);

    if (index + 1 >= qs.length) await finishFasl(env, chatId, uid, faslNo, qs.length, ok);
    else await sendQuestion(env, chatId, uid, "k", index + 1, qs, { f: faslNo });
    return;
  }


  if (mode === "d") {
    const questions = pickToday(bank);
    const total = questions.length;
    if (index >= total) return;
    if ((await env.SESSIONS.get(aKey(uid, index))) !== null) return; // takroriy

    const q = questions[index];
    const ok = (pa.option_ids || [])[0] === q.c;
    await env.SESSIONS.put(aKey(uid, index), ok ? "1" : "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, q.t, ok);

    if (index + 1 >= total) await finishDaily(env, chatId, uid, total, name, { [index]: ok ? "1" : "0" });
    else await sendQuestion(env, chatId, uid, "d", index + 1, questions);
    return;
  }

  // "o'z tezligimda"
  const u = await getUser(env, uid);
  const qs = questionsFor("s", uid, u);
  if (index >= qs.length) return;
  const q = qs[index];
  const ok = (pa.option_ids || [])[0] === q.c;
  await recordAnswer(env, uid, q.t, ok);

  if (index + 1 < SEQ_BATCH) {
    await sendQuestion(env, chatId, uid, "s", index + 1, qs);
  } else {
    const u2 = await getUser(env, uid);
    u2.seq = ((u2.seq || 0) + SEQ_BATCH) % seqOrder().length;
    await saveUser(env, uid, u2);
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `✅ <b>${SEQ_BATCH} ta savol yakunlandi.</b>\n\n` +
        `Umumiy natijangiz: <b>${u2.correct}/${u2.answered}</b> ` +
        `(${u2.answered ? Math.round((u2.correct / u2.answered) * 100) : 0}%)\n\n` +
        `Davom etasizmi?`,
      reply_markup: {
        inline_keyboard: [[{ text: "▶️ Keyingi 5 ta savol", callback_data: "seq" }]],
      },
    });
  }
}


/**
 * Poll yopilganda chaqiriladi — vaqt tugadi yoki qo'lda to'xtatildi.
 *
 * Busiz viktorina qotib qolardi: foydalanuvchi ulgurmasa poll_answer kelmaydi,
 * demak keyingi savol ham yuborilmaydi. Endi ulgurmagan savol "xato" deb
 * belgilanadi va navbat davom etadi.
 */
async function handlePollClosed(env, poll) {
  if (!poll || !poll.is_closed) return;
  await savolniOtkaz(env, poll.id);
}

/**
 * Muddati tugagan savolni o'tkazib yuboradi va keyingisini jo'natadi.
 * Ikki joydan chaqiriladi (Telegram xabari va ichki taymer), shuning uchun
 * javob kaliti yagona haqiqat manbai: kim birinchi yozsa, ikkinchisi chekinadi.
 */
async function savolniOtkaz(env, pollId) {
  // Kalitni olamiz. Ololmasak — bu savolni allaqachon boshqa yo'l
  // (javob berish yoki tugma) oldinga surgan, biz aralashmaymiz.
  const rec = await navbatniOl(env, pollId);
  if (!rec) return;
  const { u: uid, i: index, m: mode, c: chatId, f: faslNo, msg: msgId } = rec;

  const javobniOchib = async (q) => {
    if (msgId) {
      await tg(env, "stopPoll", { chat_id: chatId, message_id: msgId }).catch(() => {});
    }
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `⏱ <b>Vaqt tugadi.</b>\n✅ To'g'ri javob: <b>${esc(q.o[q.c])}</b>`,
    });
  };

  if (mode === "d") {
    const questions = pickToday(bank);
    if (index >= questions.length) return;
    await env.SESSIONS.put(aKey(uid, index), "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, questions[index].t, false);
    await javobniOchib(questions[index]);
    if (index + 1 >= questions.length) await finishDaily(env, chatId, uid, questions.length, "", {});
    else await sendQuestion(env, chatId, uid, "d", index + 1, questions);
    return;
  }

  // "k" va "s" rejimlarida taymer yo'q, demak bu yerga faqat "Davom etish"
  // tugmasi orqali kelinadi — foydalanuvchi o'zi o'tkazishni so'raganda.
  if (mode === "k") {
    const u0 = await getUser(env, uid);
    const qs = faslQuestions(faslNo, uid, faslNo <= (u0.kitob || 0) ? 1 : 0);
    if (index >= qs.length) return;
    await env.SESSIONS.put(kKey(uid, faslNo, index), "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, "Kitob", false);
    await javobniOchib(qs[index]);
    if (index + 1 >= qs.length) await finishFasl(env, chatId, uid, faslNo, qs.length, false);
    else await sendQuestion(env, chatId, uid, "k", index + 1, qs, { f: faslNo });
    return;
  }

  if (mode === "s") {
    const u = await getUser(env, uid);
    const qs = questionsFor("s", uid, u);
    if (index >= qs.length) return;
    await javobniOchib(qs[index]);
    if (index + 1 < SEQ_BATCH) await sendQuestion(env, chatId, uid, "s", index + 1, qs);
  }
}

// ——————————————————————————————————————————————— natijalar / reyting

async function showStats(env, chatId, uid) {
  const u = await getUser(env, uid);
  if (!u.answered) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Siz hali birorta savolga javob bermadingiz. «🧠 Kunlik viktorina» dan boshlang!",
      reply_markup: MENU,
    });
    return;
  }
  const pct = Math.round((u.correct / u.answered) * 100);
  const rows = Object.entries(u.topics || {})
    .map(([t, v]) => `${topicLabel(t)}\n   ${v.c}/${v.a} — ${Math.round((v.c / v.a) * 100)}%`)
    .join("\n");

  const today = await env.SESSIONS.get(doneKey(uid));
  const todayLine = today
    ? `\n📅 Bugun: <b>${JSON.parse(today).score}/${JSON.parse(today).total}</b>`
    : `\n📅 Bugun: hali ishlanmagan`;

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `📊 <b>Natijalaringiz</b>\n\n` +
      `Jami javob: <b>${u.answered}</b> ta\n` +
      `To'g'ri: <b>${u.correct}</b> ta (${pct}%)\n` +
      `🔥 Ketma-ket kunlar: <b>${u.streak || 0}</b>\n` +
      `🗓 Ishlagan kunlar: <b>${u.days || 0}</b>` +
      todayLine +
      `\n\n<b>Mavzular kesimida:</b>\n${rows}`,
    reply_markup: MENU,
  });
}


/** Reyting satrlari — barcha ishtirokchilar, o'rin raqami bilan. */
/**
 * Reytingda ko'rinadigan nom.
 * @username bo'lsa o'shani ko'rsatamiz — bosib profilga o'tish mumkin va
 * bir xil ismli ikki kishi aralashib ketmaydi. Username yo'q bo'lsa ismga
 * qaytamiz, u ham yo'q bo'lsa oxirgi chora sifatida "Ishtirokchi".
 */
function korinadiganNom(r) {
  if (r.un) return `@${esc(r.un)}`;
  return esc(r.n || "Ishtirokchi");
}

/** "8-avgust" ko'rinishidagi sana — sarlavhada qaysi kun ekani ko'rinsin. */
function sanaUz(d = new Date(Date.now() + 5 * 3600000)) {
  const oylar = ["yanvar","fevral","mart","aprel","may","iyun",
                 "iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  return `${d.getUTCDate()}-${oylar[d.getUTCMonth()]}`;
}

/** Reyting sarlavhasi: sana, savollar soni va ishtirokchilar bir joyda. */
function reytingSarlavha(rows) {
  const birxil = rows.every((r) => r.t === rows[0].t);
  const savol = birxil ? `${rows[0].t} ta savol · ` : "";
  return `🏆 <b>Bugungi reyting</b> · ${sanaUz()}\n` +
         `${savol}${rows.length} ta ishtirokchi\n` +
         `━━━━━━━━━━━━━━\n\n`;
}

function reytingSatrlari(rows, meniUid = null) {
  const medal = ["🥇", "🥈", "🥉"];
  // Hamma bir xil sondagi savol ishlagan bo'lsa, "x/9" ni har satrda
  // takrorlamaymiz — u sarlavhaga chiqadi va ro'yxat ancha tiniq bo'ladi.
  const birxil = rows.every((r) => r.t === rows[0].t);
  return rows.map((r, i) => {
    const orin = medal[i] || `<b>${i + 1}.</b>`;
    const men = meniUid && String(r.uid) === String(meniUid);
    const ball = birxil ? `<b>${r.s}</b>` : `<b>${r.s}/${r.t}</b>`;
    const ism = men ? `<b>${korinadiganNom(r)}</b> (siz)` : korinadiganNom(r);
    return `${orin} ${ism} — ${ball}`;
  });
}

/** Foydalanuvchiga o'z o'rnini tushuntiradigan bitta satr. */
function shaxsiySatr(rows, uid) {
  const i = rows.findIndex((r) => String(r.uid) === String(uid));
  if (i < 0) return `Siz bugun hali ishlamadingiz — qo'shiling! 🚀`;
  if (i === 0) return `🎉 Siz <b>birinchi o'rindasiz</b>. Ushlab turing!`;
  const farq = rows[i - 1].s - rows[i].s;
  const yuqori = korinadiganNom(rows[i - 1]);
  // Diqqat: username'ga o'zbekcha qo'shimcha yopishtirmaymiz ("@userdan"
  // noto'g'ri o'qiladi va Telegram havolasini buzadi) — nomni alohida qoldiramiz.
  return farq === 0
    ? `📍 <b>${i + 1}-o'rin.</b> Oldingizda ${yuqori} — ball teng, keyingi safar o'zib ketasiz.`
    : `📍 <b>${i + 1}-o'rin.</b> Oldingizda ${yuqori} — farq atigi <b>${farq} ball</b>.`;
}


/** Uzun ro'yxatni Telegram limitiga sig'adigan bo'laklarga bo'ladi. */
function bolaklarga(satrlar, sarlavha = "", chegara = 3500) {
  const chiqish = [];
  let joriy = sarlavha;
  for (const s of satrlar) {
    if (joriy.length + s.length + 1 > chegara) {
      chiqish.push(joriy);
      joriy = "";
    }
    joriy += s + "\n";
  }
  if (joriy.trim()) chiqish.push(joriy);
  return chiqish.length ? chiqish : [sarlavha + "—"];
}

async function collectBoard(env, date, prefix = "b") {
  const keys = await listAll(env, `${prefix}:${date}:`);
  const rows = [];
  // Ketma-ket o'qish sekin: 500 ta yozuv = 500 ta navbatdagi so'rov.
  // 50 tadan parallel o'qiymiz — cron vaqt chegarasiga urilmaslik uchun.
  for (const bolak of chunk(keys, 50)) {
    const qiymatlar = await Promise.all(bolak.map((k) => env.SESSIONS.get(k.name)));
    bolak.forEach((k, i) => {
      const v = qiymatlar[i];
      if (!v) return;
      rows.push({ uid: k.name.split(":").pop(), ...JSON.parse(v) });
    });
  }

  // Ism va username'ni KO'RSATISH paytida foydalanuvchi yozuvidan olamiz.
  // Ilgari ular natija yozuviga yakunlash paytida muhrlanardi — kim
  // username'ini keyin qo'shsa yoki o'zgartirsa, reytingda eski nom
  // qolib ketardi. Endi joriy qiymat ko'rinadi.
  for (const bolak of chunk(rows, 50)) {
    const userlar = await Promise.all(bolak.map((r) => env.SESSIONS.get(`u:${r.uid}`)));
    bolak.forEach((r, i) => {
      if (!userlar[i]) return;
      try {
        const u = JSON.parse(userlar[i]);
        if (u.uname) r.un = u.uname;
        if (u.name && !r.n) r.n = u.name;
      } catch (_) {}
    });
  }

  rows.sort((a, b) => b.s - a.s || b.t - a.t);
  return rows;
}


async function showRank(env, chatId, uid) {
  const rows = await collectBoard(env, dayKey());
  if (!rows.length) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Bugun hali hech kim viktorinani yakunlamagan. Birinchi bo'ling! 🚀",
      reply_markup: MENU,
    });
    return;
  }

  // Ro'yxat va shaxsiy xulosa bitta xabarda: ikkiga bo'linganda odam
  // o'z o'rnini ikkinchi xabardan qidirishga majbur bo'lardi.
  const bolaklar = bolaklarga(reytingSatrlari(rows, uid), reytingSarlavha(rows));
  for (let i = 0; i < bolaklar.length; i++) {
    const oxirgi = i === bolaklar.length - 1;
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: bolaklar[i] + (oxirgi ? `\n${shaxsiySatr(rows, uid)}` : ""),
      ...(oxirgi ? { reply_markup: MENU } : {}),
    });
  }
}


// ——————————————————————————————————————————————— cron vazifalari

/**
 * Kunlik eslatma.
 *
 * Uchta narsaga e'tibor berilgan:
 *  1) Ro'yxat listAll orqali to'liq o'qiladi (1000 ta chegara yo'q).
 *  2) Xabarlar 25 tadan parallel ketadi. Ketma-ket yuborishda 1000 kishi
 *     60 soniyadan ko'p vaqt olardi va cron yarim yo'lda uzilardi.
 *     Telegram bot API sekundiga ~30 xabarga ruxsat beradi, shuning uchun
 *     har to'plamdan keyin qisqa pauza qoldirilgan.
 *  3) Botni bloklagan foydalanuvchi (403) nofaol deb belgilanadi — aks holda
 *     ular har kuni qayta urinilaverib, cron vaqtini bekorga yeydi.
 */
const REMINDER_BATCH = 25;
const REMINDER_BUDGET_MS = 20000;   // cron uzilib qolmasligi uchun chegara

async function sendReminders(env) {
  const boshlandi = Date.now();
  const keys = await listAll(env, "u:");
  let sent = 0, bloklangan = 0, otkazildi = 0;

  for (const bolak of chunk(keys, REMINDER_BATCH)) {
    if (Date.now() - boshlandi > REMINDER_BUDGET_MS) {
      console.warn("sendReminders: vaqt byudjeti tugadi, qolgani:", keys.length - sent - otkazildi);
      break;
    }

    await Promise.all(bolak.map(async (k) => {
      const uid = k.name.slice(2);
      const [done, raw] = await Promise.all([
        env.SESSIONS.get(doneKey(uid)),
        env.SESSIONS.get(k.name),
      ]);
      if (done) { otkazildi++; return; }               // bugun allaqachon ishlagan

      const u = JSON.parse(raw || "{}");
      if (u.blocked) { otkazildi++; return; }          // bot bloklangan

      const streakLine = u.streak > 1
        ? `🔥 <b>${u.streak} kunlik zanjiringiz</b> uzilib qolmasin!\n\n`
        : "";
      const r = await tg(env, "sendMessage", {
        chat_id: uid,
        parse_mode: "HTML",
        text:
          `⏰ <b>Bugungi viktorina hali ishlanmadi.</b>\n\n${streakLine}` +
          `Atigi bir necha daqiqa oladi 👇`,
        reply_markup: MENU,
      });

      if (r.ok) { sent++; return; }

      // 403 = foydalanuvchi botni bloklagan yoki chatni o'chirgan.
      // Yozuvni o'chirmaymiz (natijalari yo'qolmasin), faqat belgilaymiz.
      if (r.error_code === 403) {
        u.blocked = true;
        await env.SESSIONS.put(k.name, JSON.stringify(u), { expirationTtl: TTL_USER });
        bloklangan++;
      }
    }));

    await new Promise((r2) => setTimeout(r2, 1100));   // Telegram rate-limit
  }

  console.log(`reminders: yuborildi ${sent}, o'tkazildi ${otkazildi}, bloklangan ${bloklangan}, jami ${keys.length}`);
}

async function postLeaderboard(env) {
  const rows = await collectBoard(env, dayKey());
  if (!rows.length) return;
  await reytingYubor(env, env.CHAT_ID, rows, "Ertaga soat 20:00 da yangi savollar 🌙");
}

/** Kanalga kunlik reyting — 23:00. */
/**
 * Kanalga kunlik fasl reytingi.
 *
 * Manba — kd:{uid}:{fasl} yozuvlari. Sana bo'yicha alohida jadval yuritmaymiz:
 * marafonda har kun aniq bitta fasl ishlanadi, shuning uchun "bugungi fasl"
 * raqamini hisoblab, o'sha faslni tugatganlarni yig'ish ham to'g'ri, ham
 * orqaga qarab ishlaydi (avval tugatganlar ham ro'yxatga tushadi).
 */
async function postChannelBoard(env) {
  if (!env.CHANNEL_ID) return console.log("CHANNEL_ID sozlanmagan");
  if (!env.KITOB_START) return console.log("KITOB_START sozlanmagan");

  const faslNo = marafonKuni(env.KITOB_START) + 1;
  if (faslNo < 1 || faslNo > KITOB_JAMI) return console.log("marafon oralig'idan tashqarida:", faslNo);

  // kd: kalitlari uid bo'yicha tuzilgan, shuning uchun prefiks bilan ajratib
  // bo'lmaydi — hammasini olib, oxiri bo'yicha filtrlaymiz. Yozuvlar soni kam.
  const keys = (await listAll(env, "kd:")).filter((k) => k.name.endsWith(`:${faslNo}`));
  if (!keys.length) return console.log(`${faslNo}-faslni hali hech kim tugatmagan`);

  const rows = [];
  for (const bolak of chunk(keys, 50)) {
    const [natijalar, userlar] = await Promise.all([
      Promise.all(bolak.map((k) => env.SESSIONS.get(k.name))),
      Promise.all(bolak.map((k) => env.SESSIONS.get(`u:${k.name.split(":")[1]}`))),
    ]);
    bolak.forEach((k, i) => {
      if (!natijalar[i]) return;
      const d = JSON.parse(natijalar[i]);
      let u = {};
      try { u = JSON.parse(userlar[i] || "{}"); } catch (_) {}
      rows.push({
        uid: k.name.split(":")[1],
        n: u.name || "Ishtirokchi",
        un: u.uname || "",
        s: d.ball,
        t: d.total,
      });
    });
  }
  if (!rows.length) return console.log("yozuvlar o'qilmadi");
  rows.sort((a, b) => b.s - a.s || b.t - a.t);

  await reytingYubor(env, env.CHANNEL_ID, rows, "Ertangi fasl soat 21:00 da 🌙", {
    sarlavha: `📖 <b>${faslNo}-fasl natijalari</b> · ${sanaUz()}\n` +
              `${rows[0].t} ta savol · ${rows.length} ta ishtirokchi\n` +
              `━━━━━━━━━━━━━━\n\n`,
    start: "kitob",
    tugmaMatn: "📖 Men ham marafonga qo'shilaman",
  });
}



/** Reytingni to'liq ro'yxat bilan yuborish — barcha ishtirokchilar ko'rinadi. */
async function reytingYubor(env, chatId, rows, izoh, opt = {}) {
  const avg = Math.round(rows.reduce((s, r) => s + r.s / r.t, 0) / rows.length * 100);
  const bolaklar = bolaklarga(reytingSatrlari(rows), opt.sarlavha || reytingSarlavha(rows));

  for (let i = 0; i < bolaklar.length; i++) {
    const oxirgi = i === bolaklar.length - 1;
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      text:
        bolaklar[i] +
        (oxirgi
          ? `\n📈 O'rtacha natija: <b>${avg}%</b>\n\n${izoh}`
          : ``),
      ...(oxirgi
        ? {
            reply_markup: {
              inline_keyboard: [[{
                text: opt.tugmaMatn || "▶️ Men ham ishtirok etaman",
                url: `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=${opt.start || "quiz"}`,
              }]],
            },
          }
        : {}),
    });
    await new Promise((r) => setTimeout(r, 400));
  }
}

/**
 * Guruhga kunlik viktorina e'loni — 20:00.
 *
 * Ilgari bu ish GitHub Actions'da turardi (post_daily_announcement.py).
 * GitHub ommaviy repozitoriyalarda jadvalli workflow'ni 60 kun harakatsizlikdan
 * keyin o'zi o'chiradi — 2026-oktabrda aynan shunday bo'lib, e'lon bir necha kun
 * chiqmay qoldi. Cloudflare cron'ida bunday chegara yo'q, shuning uchun mantiq
 * shu yerga ko'chirildi: endi tashqi bog'liqlik qolmadi.
 */
async function postKunlikElon(env) {
  if (!env.CHAT_ID) return console.log("CHAT_ID sozlanmagan");

  const kun = dayIndex();
  const reja = planFor(kun);
  const jami = todayCount();

  const satrlar = Object.entries(reja)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${topicLabel(t)} — <b>${n} ta</b>`)
    .join("\n");

  await tg(env, "sendMessage", {
    chat_id: env.CHAT_ID,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    text:
      `🧠 <b>KUNLIK BILIM SINOVI</b>  ·  <i>Kun ${kun + 1}</i>\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `Bugun <b>${jami} ta savol</b> sizni kutmoqda:\n\n` +
      `${satrlar}\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `⏱ Har savolga vaqt chegarasi bor\n` +
      `🏆 Reyting soat 22:00 da shu yerda\n\n` +
      `Omad! 🚀`,
    reply_markup: {
      inline_keyboard: [[{
        text: "▶️ HOZIR BOSHLASH",
        url: `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=quiz`,
      }]],
    },
  });
  console.log(`kunlik e'lon yuborildi: kun ${kun + 1}, ${jami} ta savol`);
}

/** Kanalga kunlik fasl e'loni — 21:00. 14 kun davom etadi, so'ng o'zi to'xtaydi. */
async function postFaslElon(env) {
  if (!env.CHANNEL_ID) return console.log("CHANNEL_ID sozlanmagan");
  if (!env.KITOB_START) return console.log("KITOB_START sozlanmagan");

  const kun = marafonKuni(env.KITOB_START);
  if (kun < 0) return console.log(`marafon ${env.KITOB_START} da boshlanadi`);
  if (kun >= FASL.length) return console.log("marafon yakunlangan");

  const f = FASL[kun];
  await tg(env, "sendMessage", {
    chat_id: env.CHANNEL_ID,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    text:
      `${f.ok} <b>${f.n}-FASL</b>  ·  <i>Kun ${kun + 1}/${FASL.length}</i>\n` +
      `<b>${f.ad}</b>\n\n` +
      `${f.tv}\n\n` +
      `<i>${f.iq}</i>\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `📚 Bugungi vazifa: shu faslni o'qib chiqing\n` +
      `✅ So'ng tugma orqali sinovdan o'ting — ${faslSavolSoni(f.n)} ta savol\n` +
      `⏱ Vaqt chegarasi yo'q — shoshilmay o'ylang\n` +
      `🏆 Natijalar soat 23:00 da shu yerda\n\n` +
      `<i>«Ilm olish sirlari» — Imom Zarnujiy</i>`,
    reply_markup: {
      inline_keyboard: [[{
        text: `✅ ${f.n}-fasl sinovi`,
        url: `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=fasl${f.n}`,
      }]],
    },
  });
  console.log(`fasl e'loni yuborildi: ${f.n}-fasl (kun ${kun + 1})`);
}

// ——————————————————————————————————————————————— xabarlarni qayta ishlash

async function handleMessage(env, msg) {
  if (msg.chat.type !== "private") return;
  const uid = msg.from.id;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const name = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ");

  if (text.startsWith("/start")) {
    const u = await getUser(env, uid);
    await saveUser(env, uid, u); // ro'yxatga olish

    const arg = (text.split(/\s+/)[1] || "").trim();
    if (arg === "kitob") return kitobMenyu(env, chatId, uid);
    // E'londagi tugma shu havola bilan keladi — odamni salomlashuv matniga
    // emas, to'g'ridan-to'g'ri bugungi viktorinaga olib o'tamiz.
    if (arg === "quiz") {
      const nom = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ");
      return startDaily(env, chatId, uid, nom);
    }
    if (/^fasl\d+$/.test(arg)) {
      const n = parseInt(arg.slice(4), 10);
      if (n >= 1 && n <= KITOB_JAMI) return startFasl(env, chatId, uid, n);
    }
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `🧠 <b>Salom, ${esc(msg.from.first_name || "do'stim")}!</b>\n\n` +
        `<b>Ustozim Nurim</b> bilim sinovi botiga xush kelibsiz.\n\n` +
        `🧠 <b>Kunlik viktorina</b> — bugungi savollar, hamma uchun bir xil. ` +
        `Kechqurun reytingda o'rningizni ko'rasiz.\n\n` +
        `📚 <b>O'z tezligimda</b> — bazadagi <b>${bank.length}</b> ta savol ` +
        `boshidan ketma-ket. Kechikkan bo'lsangiz ham hammasini o'tasiz.\n\n` +
        `📊 <b>Natijalarim</b> — ballingiz, foizingiz va mavzular kesimi.\n\n` +
        `Quyidagi menyudan tanlang 👇`,
      reply_markup: MENU,
    });
    return;
  }

  if (text === "🧠 Kunlik viktorina" || text.startsWith("/kunlik")) return startDaily(env, chatId, uid, name);
  if (text === "📖 Kitob marafoni" || text.startsWith("/kitob")) return kitobMenyu(env, chatId, uid);
  if (text === "📚 O'z tezligimda" || text.startsWith("/mashq")) return startSeq(env, chatId, uid);

  if (text.startsWith("/fasl")) {
    const n = parseInt(text.split(/\s+/)[1], 10);
    if (n >= 1 && n <= KITOB_JAMI) return startFasl(env, chatId, uid, n);
    return kitobMenyu(env, chatId, uid);
  }
  if (text === "📊 Natijalarim" || text.startsWith("/natija")) return showStats(env, chatId, uid);
  if (text === "🏆 Reyting" || text.startsWith("/reyting")) return showRank(env, chatId, uid);

  if (text === "ℹ️ Yordam" || text.startsWith("/yordam") || text.startsWith("/help")) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `ℹ️ <b>Bot qanday ishlaydi</b>\n\n` +
        `🧠 <b>Kunlik viktorina</b> — har kuni soat 20:00 da yangilanadi. ` +
        `Kuniga bir marta ishlanadi, natija reytingga tushadi.\n\n` +
        `📚 <b>O'z tezligimda</b> — cheklov yo'q, xohlagancha ishlaysiz. ` +
        `Qayerda to'xtasangiz, o'sha yerdan davom etadi.\n\n` +
        `🔥 <b>Streak</b> — har kuni ishlasangiz zanjir uzunlashadi. ` +
        `Bir kun tashlab ketsangiz noldan boshlanadi.\n\n` +
        `Buyruqlar: /kunlik /mashq /natija /reyting`,
      reply_markup: MENU,
    });
    return;
  }

  if (text.startsWith("/reset") && String(uid) === String(env.ADMIN_ID)) {
    const target = text.split(/\s+/)[1] || uid;          // /reset [user_id]
    const full = text.includes("--full");
    await env.SESSIONS.delete(doneKey(target));
    await env.SESSIONS.delete(`b:${dayKey()}:${target}`);
    for (let i = 0; i < 30; i++) await env.SESSIONS.delete(aKey(target, i));
    if (full) await env.SESSIONS.delete(`u:${target}`);
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `🔄 <code>${target}</code> uchun bugungi holat tozalandi` +
            (full ? " (statistika ham)" : "") + ".",
      reply_markup: MENU,
    });
    return;
  }

  if (text.startsWith("/sozla") && String(uid) === String(env.ADMIN_ID)) {
    const natija = [];

    // Webhook "poll" yangilanishlarini ham qabul qilsin —
    // vaqt tugaganini shu orqali bilamiz.
    // Telegram setWebhook ni tez-tez chaqirishga ruxsat bermaydi,
    // shuning uchun 429 kelsa bir necha bor qayta urinamiz.
    const KERAK = ["message", "callback_query", "poll_answer", "poll", "my_chat_member"];
    let wh = null;
    for (let urinish = 0; urinish < 4; urinish++) {
      wh = await tg(env, "setWebhook", {
        url: env.WEBHOOK_URL || "https://ustozim-quiz-bot.nuriddinovx2.workers.dev/",
        secret_token: env.WEBHOOK_SECRET,
        allowed_updates: KERAK,
      });
      if (wh.ok) break;
      const kut = (wh.parameters?.retry_after || 1) * 1000 + 400;
      await new Promise((r) => setTimeout(r, kut));
    }

    // Haqiqatan o'rnatilganini Telegram'dan so'rab tasdiqlaymiz
    const info = await tg(env, "getWebhookInfo", {});
    const ruxsat = info.result?.allowed_updates || [];
    const pollBor = ruxsat.includes("poll");
    natija.push(
      `Webhook: ${wh?.ok ? "✅ o'rnatildi" : "⚠️ " + (wh?.description || "javob yo'q")}`
    );
    natija.push(
      `Vaqt tugashi (poll): ${pollBor ? "✅ yoqilgan" : "❌ yoqilmagan — /sozla ni qayta bosing"}`
    );
    if (info.result?.last_error_message) {
      natija.push(`So'nggi xato: ${esc(info.result.last_error_message)}`);
    }

    const cmd = await tg(env, "setMyCommands", {
      commands: [
        { command: "kunlik", description: "Bugungi viktorina" },
        { command: "kitob", description: "Ilm olish sirlari marafoni" },
        { command: "mashq", description: "O'z tezligimda mashq" },
        { command: "natija", description: "Natijalarim" },
        { command: "reyting", description: "Bugungi reyting" },
        { command: "yordam", description: "Bot qanday ishlaydi" },
      ],
    });
    natija.push(`Buyruqlar: ${cmd.ok ? "✅" : "❌"}`);

    if (env.CHANNEL_ID) {
      const me = await tg(env, "getMe", {});
      const cm = await tg(env, "getChatMember", {
        chat_id: env.CHANNEL_ID,
        user_id: me.result?.id,
      });
      const st = cm.result?.status;
      natija.push(
        `Kanal ${env.CHANNEL_ID}: ` +
        (st === "administrator" && cm.result?.can_post_messages
          ? "✅ admin, post yozadi"
          : st === "administrator"
          ? "⚠️ admin, lekin post huquqi yo'q"
          : `❌ ${st || cm.description || "topilmadi"}`)
      );
    } else {
      natija.push("Kanal: ❌ CHANNEL_ID sozlanmagan");
    }

    const kun = env.KITOB_START ? marafonKuni(env.KITOB_START) : null;
    natija.push(
      `Marafon: ${env.KITOB_START || "sana yo'q"}` +
      (kun === null ? ""
        : kun < 0 ? ` (${-kun} kundan keyin boshlanadi)`
        : kun >= FASL.length ? " (yakunlangan)"
        : ` — bugun ${kun + 1}-kun, ${FASL[kun].n}-fasl`)
    );

    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `🔧 <b>Sozlash natijasi</b>\n\n${natija.join("\n")}`,
    });
    return;
  }

  if (text.startsWith("/sinov") && String(uid) === String(env.ADMIN_ID)) {
    const qism = (text.split(/\s+/)[1] || "").trim();
    if (qism === "fasl") {
      await postFaslElon(env);
      await tg(env, "sendMessage", { chat_id: chatId, text: "Fasl e'loni kanalga yuborildi ✅" });
    } else if (qism === "elon") {
      await postKunlikElon(env);
      await tg(env, "sendMessage", { chat_id: chatId, text: "Kunlik e'lon guruhga yuborildi ✅" });
    } else if (qism === "reyting") {
      await postChannelBoard(env);
      await tg(env, "sendMessage", { chat_id: chatId, text: "Reyting kanalga yuborildi ✅" });
    } else {
      await tg(env, "sendMessage", {
        chat_id: chatId,
        text:
          "/sinov elon — guruhga kunlik viktorina e'lonini hozir yuboradi\n" +
          "/sinov fasl — kanalga bugungi fasl e'lonini hozir yuboradi\n" +
          "/sinov reyting — kanalga bugungi reytingni hozir yuboradi",
      });
    }
    return;
  }

  if (text.startsWith("/stats") && String(uid) === String(env.ADMIN_ID)) {
    const users = { keys: await listAll(env, "u:") };
    const rows = await collectBoard(env, dayKey());
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.s / r.t, 0) / rows.length * 100) : 0;
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `🔧 <b>Admin statistika</b>\n\n` +
        `👥 Botga yozilganlar: <b>${users.keys.length}</b>\n` +
        `✅ Bugun yakunlaganlar: <b>${rows.length}</b>\n` +
        `📈 Bugungi o'rtacha: <b>${avg}%</b>\n` +
        `📚 Bazada savollar: <b>${bank.length}</b>\n` +
        `📅 Loyiha kuni: <b>${dayIndex() + 1}</b>`,
    });
    return;
  }

  await tg(env, "sendMessage", {
    chat_id: chatId,
    text: "Menyudan tanlang 👇",
    reply_markup: MENU,
  });
}

async function handleCallback(env, cb) {
  await tg(env, "answerCallbackQuery", { callback_query_id: cb.id });
  const chatId = cb.message.chat.id;
  const uid = cb.from.id;
  const data = cb.data || "";

  if (data === "seq") return startSeq(env, chatId, uid);
  if (data.startsWith("otkaz:")) return savolniOtkaz(env, data.slice(6));
  if (data === "davom_d") {
    const nom = [cb.from.first_name, cb.from.last_name].filter(Boolean).join(" ");
    return startDaily(env, chatId, uid, nom);
  }
  if (data === "kmenu") return kitobMenyu(env, chatId, uid);
  if (data === "stats") return showStats(env, chatId, uid);
  if (data.startsWith("k:")) {
    const n = parseInt(data.slice(2), 10);
    if (n >= 1 && n <= KITOB_JAMI) return startFasl(env, chatId, uid, n);
  }
}

// ——————————————————————————————————————————————— kirish nuqtalari

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        `Ustozim Nurim quiz bot — ishlayapti.\n` +
        `Kun #${dayIndex() + 1}, bugun ${todayCount()} ta savol.\nBazada ${bank.length} ta savol.`,
        { headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }

    if (request.method !== "POST") return new Response("Not found", { status: 404 });
    if (env.WEBHOOK_SECRET &&
        request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }

    let update;
    try { update = await request.json(); } catch { return new Response("bad", { status: 400 }); }

    console.log("UPDATE:", Object.keys(update).filter((k) => k !== "update_id").join(","),
      update.poll ? `poll closed=${update.poll.is_closed} id=${update.poll.id}` : "");
    try {
      if (update.poll_answer) await handleAnswer(env, update.poll_answer);
      else if (update.poll) await handlePollClosed(env, update.poll);
      else if (update.callback_query) await handleCallback(env, update.callback_query);
      else if (update.message) await handleMessage(env, update.message);
    } catch (e) {
      console.error("handler", e && e.stack ? e.stack : e);
    }

    // Shu so'rovda yuborilgan savollar uchun zaxira taymerni yoqamiz

    return new Response("ok");
  },

  async scheduled(event, env, ctx) {
    const h = new Date(event.scheduledTime).getUTCHours();
    // Toshkent vaqti = UTC+5
    if (h === 15) ctx.waitUntil(postKunlikElon(env));   // 20:00 — guruhga kunlik e'lon
    if (h === 16) {                                     // 21:00
      ctx.waitUntil(postFaslElon(env));                 //   kanalga kunlik fasl
      ctx.waitUntil(sendReminders(env));                //   ishlamaganlarga eslatma
    }
    if (h === 17) ctx.waitUntil(postLeaderboard(env));  // 22:00 — guruhga reyting
    if (h === 18) ctx.waitUntil(postChannelBoard(env)); // 23:00 — kanalga reyting
  },
};
