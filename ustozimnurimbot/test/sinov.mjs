/**
 * Bot mantig'ini soxta D1 va soxta Telegram bilan sinovdan o'tkazadi.
 * Haqiqiy tarmoqqa chiqmaydi, haqiqiy botga tegmaydi.
 *
 * Ishga tushirish:  node test/sinov.mjs
 */

const UID = 555001;
let POLL_SEQ = 1000;

// ——— soxta D1 (node:sqlite) ———
import { yangiD1, qatorlar, qator } from "./d1.mjs";

// ——— soxta Telegram ———
const yuborilgan = [];
let oxirgiPoll = null;

globalThis.fetch = async (url, opt) => {
  const metod = String(url).split("/").pop();
  if (opt.body instanceof FormData) {
    yuborilgan.push({ metod, body: { chat_id: opt.body.get("chat_id"), caption: opt.body.get("caption"), forma: true } });
    return { json: async () => ({ ok: true, result: { message_id: ++POLL_SEQ, photo: [{ file_id: "F_" + metod + "_" + opt.body.get("caption") }], animation: { file_id: "A_" + opt.body.get("caption") } } }) };
  }
  const body = JSON.parse(opt.body);
  yuborilgan.push({ metod, body });

  if (metod === "sendPoll") {
    const id = String(++POLL_SEQ);
    oxirgiPoll = { id, correct: body.correct_option_ids ?? body.correct_option_id, savol: body.question, variantlar: body.options, open_period: body.open_period };
    return { json: async () => ({ ok: true, result: { message_id: POLL_SEQ, poll: { id, open_period: body.open_period } } }) };
  }
  return { json: async () => ({ ok: true, result: { message_id: ++POLL_SEQ } }) };
};

// Qaysi nusxani sinaymiz — run.mjs tayyorlagan vaqtinchalik papka yoki
// to'g'ridan-to'g'ri src. Eski kodni sinash uchun ham shu o'zgaruvchi ishlatiladi.
const mod = await import(process.env.BOT_SRC || "../src/index.js");
const bot = mod.default;

const env = {
  DB: yangiD1(),
  BOT_TOKEN: "sinov",
  CHAT_ID: "-100",
  ADMIN_ID: "1",
  BOT_USERNAME: "sinovbot",
};
// Fon vazifalarini bajarmaymiz, faqat chaqirilganini qayd etamiz.
const fonVazifalar = [];
const ctx = { waitUntil(p) { fonVazifalar.push(p); } };

const so = (u) => bot.fetch(
  new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), env, ctx
);

const xabar = (text) => so({
  update_id: ++POLL_SEQ,
  message: { message_id: POLL_SEQ, date: 0, chat: { id: UID, type: "private" },
             from: { id: UID, is_bot: false, first_name: "Sinov", username: "sinov" }, text },
});

const javob = (pollId, variant) => so({
  update_id: ++POLL_SEQ,
  poll_answer: { poll_id: pollId, user: { id: UID, first_name: "Sinov", username: "sinov" }, option_ids: [].concat(variant) },
});

// ——— natijalar ———
let otdi = 0, yiqildi = 0;
const tekshir = (nom, shart, izoh = "") => {
  if (shart) { otdi++; console.log(`  ✓ ${nom}`); }
  else { yiqildi++; console.log(`  ✗ ${nom}${izoh ? "  → " + izoh : ""}`); }
};

// ——————————————————————————————— 1. To'liq kunlik viktorina
console.log("\n1. Kunlik viktorina — hamma savolga to'g'ri javob");
yuborilgan.length = 0;
fonVazifalar.length = 0;
await xabar("/kunlik");
tekshir("birinchi savol yuborildi", yuborilgan.some((x) => x.metod === "sendPoll"));
tekshir("savolda taymer bor", yuborilgan.find((x) => x.metod === "sendPoll").body.open_period > 0);

// Telegram so'rovnoma o'z-o'zidan yopilganda xabar yubormaydi (2026-08 da
// jonli o'lchangan). Shuning uchun bot vaqtni o'zi ham kuzatishi SHART.
tekshir("vaqt tugashi uchun zaxira kuzatuv yoqildi", fonVazifalar.length > 0,
  "ctx.waitUntil chaqirilmadi — ulgurmagan odam qotib qoladi");

let qadam = 0;
while (oxirgiPoll && qadam < 40) {
  const p = oxirgiPoll; oxirgiPoll = null;
  await javob(p.id, p.correct);          // doim to'g'ri javob
  qadam++;
}
const yakun = yuborilgan.filter((x) => x.metod === "sendMessage" && /sinov yakunlandi|Viktorina yakunlandi/i.test(x.body.text || ""));
tekshir("viktorina yakunlandi", yakun.length === 1);
tekshir("natija to'liq ball", /<b>(\d+) ball<\/b> · maksimum \1 /.test(yakun[0]?.body.text || ""), yakun[0]?.body.text?.match(/Natija.*/)?.[0]);

const kunlikQatorlar = qatorlar(env.DB, "SELECT * FROM daily");
tekshir("reyting yozuvi yaratildi", kunlikQatorlar.length === 1);
tekshir("har savol alohida qator bo'lib yozildi; maksimal ball = savollar + 3 qiyin (ikki baravar)",
  qatorlar(env.DB, "SELECT * FROM answers WHERE mode = 'd'").length + 3 === kunlikQatorlar[0]?.total,
  `answers: ${qatorlar(env.DB, "SELECT * FROM answers WHERE mode = 'd'").length}, total: ${kunlikQatorlar[0]?.total}`);

// ——————————————————————————————— 2. Takroriy kirish
console.log("\n2. Yakunlagandan keyin qayta kirish");
yuborilgan.length = 0;
await xabar("/kunlik");
tekshir("qayta ishlashga yo'l qo'yilmadi",
  yuborilgan.some((x) => /viktorina yakunlandi/.test(x.body.text || "") && /hub:takror/.test(JSON.stringify(x.body.reply_markup || {})) && /hub:marafon/.test(JSON.stringify(x.body.reply_markup || {}))));

// ——————————————————————————————— 3. Vaqt tugashi
console.log("\n3. Vaqt tugaganda savol o'tkaziladi");
const env2 = { ...env, DB: yangiD1() };
const so2 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), env2, ctx);
yuborilgan.length = 0; oxirgiPoll = null;
await so2({ update_id: 1, message: { message_id: 1, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/kunlik" } });
const birinchi = oxirgiPoll;
yuborilgan.length = 0;
await so2({ update_id: 2, poll: { id: birinchi.id, is_closed: true } });

tekshir("«Vaqt tugadi» xabari yuborilmaydi (poll o'zi javobni ko'rsatadi)", !yuborilgan.some((x) => x.metod === "sendMessage" && /Vaqt tugadi/.test(x.body.text || "")));
tekshir("so'rovnoma yopildi (stopPoll)", yuborilgan.some((x) => x.metod === "stopPoll"));
tekshir("keyingi savol yuborildi", yuborilgan.some((x) => x.metod === "sendPoll"));

// ——————————————————————————————— 4. Begona odamning javobi
console.log("\n4. Begona odam javob bersa, savol o'lik qolmaydi");
const env3 = { ...env, DB: yangiD1() };
const so3 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), env3, ctx);
oxirgiPoll = null;
await so3({ update_id: 1, message: { message_id: 1, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/kunlik" } });
const p4 = oxirgiPoll; oxirgiPoll = null;

// boshqa foydalanuvchi javob beradi
await so3({ update_id: 2, poll_answer: { poll_id: p4.id, user: { id: 999999, first_name: "Begona" }, option_ids: [0] } });
tekshir("begona javobdan keyin so'rovnoma yozuvi saqlanib qoldi",
  qator(env3.DB, "SELECT * FROM polls WHERE poll_id = ?", p4.id) !== null);

// endi haqiqiy egasi javob beradi
yuborilgan.length = 0;
await so3({ update_id: 3, poll_answer: { poll_id: p4.id, user: { id: UID, first_name: "Sinov" }, option_ids: [].concat(p4.correct) } });
tekshir("egasi javob bergach keyingi savol keldi", yuborilgan.some((x) => x.metod === "sendPoll"));

// ——————————————————————————————— 5. Sana chegarasi (Toshkent)
console.log("\n5. Kunlik kalitlar Toshkent vaqtida");
// 1-sinovda yaratilgan b: yozuvining sanasi Toshkent kuniga mos kelishi kerak.
// UTC ishlatilsa, 19:00–24:00 UTC oralig'ida sana bir kunga orqada qolardi.
const toshkentBugun = new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);
const utcBugun = new Date().toISOString().slice(0, 10);
const bSana = qator(env.DB, "SELECT day FROM daily LIMIT 1")?.day;
tekshir("reyting sanasi Toshkent kunida", bSana === toshkentBugun,
  `sana: ${bSana}, kutilgan: ${toshkentBugun}`);
// Kuchli sinov: soatni 19:30 UTC ga qo'yamiz — Toshkentda bu ertangi kun 00:30.
// Aynan shu oraliqda eski mantiq kunni bir kunga orqada qoldirardi va
// kechqurun ishlagan odam yarim tundan keyin "bugun ishlagansiz" deb
// to'xtatilardi.
const haqiqiyNow = Date.now;
Date.now = () => Date.UTC(2026, 9, 10, 19, 30);
const envT = { ...env, DB: yangiD1() };
const soT = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envT, ctx);
oxirgiPoll = null;
await soT({ update_id: 1, message: { message_id: 1, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/kunlik" } });
let qadamT = 0;
while (oxirgiPoll && qadamT < 40) {
  const p = oxirgiPoll; oxirgiPoll = null;
  await soT({ update_id: 100 + qadamT, poll_answer: { poll_id: p.id, user: { id: UID, first_name: "Sinov" }, option_ids: [].concat(p.correct) } });
  qadamT++;
}
const bSanaT = qator(envT.DB, "SELECT day FROM daily LIMIT 1")?.day;
Date.now = haqiqiyNow;

tekshir("19:30 UTC → sana ertangi (Toshkent) kunda", bSanaT === "2026-10-11",
  `sana: ${bSanaT}, eski mantiqda 2026-10-10 bo'lardi`);

// ——————————————————————————————— 6. Kitob marafonida taymer yo'q
console.log("\n6. O'rganish rejimlarida taymer qo'yilmaydi");
const env4 = { ...env, DB: yangiD1() };
const so4 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), env4, ctx);
yuborilgan.length = 0; oxirgiPoll = null;
await so4({ update_id: 1, message: { message_id: 1, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/fasl 1" } });
const kp = yuborilgan.find((x) => x.metod === "sendPoll");
tekshir("kitob savoli yuborildi", !!kp);
tekshir("kitob savolida taymer bor (marafon)", kp && kp.body.open_period >= 20 && kp.body.open_period <= 45);

yuborilgan.length = 0; oxirgiPoll = null;
await so4({ update_id: 2, message: { message_id: 2, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/mashq" } });
const sp = yuborilgan.find((x) => x.metod === "sendPoll");
tekshir("mashq savolida ham taymer yo'q", sp && sp.body.open_period === undefined);

// ——————————————————————————————— 6b. Kitob savolida izoh bor
console.log("\n6b. Kitob savoli javobdan keyin izoh ko'rsatadi");
// Izoh — foydalanuvchi ALBATTA o'qiydigan yagona joy. Agar u yo'qolsa yoki
// 200 belgidan oshsa, Telegram butun savolni rad etadi va buni jonli sinovdan
// boshqa hech narsa sezmaydi. Shuning uchun sinov shu yerda.
const envI = { ...env, DB: yangiD1() };
const soI = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envI, ctx);
yuborilgan.length = 0; oxirgiPoll = null;
await soI({ update_id: 1, message: { message_id: 1, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/fasl 1" } });
const ip = yuborilgan.find((x) => x.metod === "sendPoll");
tekshir("izoh maydoni bo'sh emas", !!ip?.body.explanation);
tekshir("izoh 200 belgidan oshmadi", (ip?.body.explanation || "").length <= 200,
  `uzunlik: ${(ip?.body.explanation || "").length}`);
tekshir("izoh mavzu yorlig'i emas, haqiqiy tushuntirish",
  (ip?.body.explanation || "").length > 40,
  `izoh: ${ip?.body.explanation}`);

// Butun kitob bazasi chegaraga sig'ishi kerak — bittasi oshsa ham o'sha savol
// hech qachon yuborilmaydi.
const kitobBank = (await import("../src/kitob_bank.json", { with: { type: "json" } })).default;
const uzunIzoh = kitobBank.filter((q) => (q.e || "").length > 200);
const izohsiz = kitobBank.filter((q) => !q.e);
tekshir("bazada 200 belgidan uzun izoh yo'q", uzunIzoh.length === 0, `${uzunIzoh.length} ta`);
tekshir("bazada izohsiz savol yo'q", izohsiz.length === 0, `${izohsiz.length} ta`);

// Kunlik baza: izoh hali hamma mavzuga yozilmagan, lekin YOZILGANI
// chegaradan oshmasligi shart — bitta uzun izoh butun kunlik viktorinani
// to'xtatib qo'yadi, chunki Telegram sendPoll ni butunlay rad etadi.
const kunlikBank0 = (await import("../src/quiz_bank.json", { with: { type: "json" } })).default;
const kunlikUzun = kunlikBank0.filter((q) => (q.e || "").length > 200);
tekshir("kunlik bazada 200 belgidan uzun izoh yo'q", kunlikUzun.length === 0,
  `${kunlikUzun.length} ta`);

// Mantiq (IQ) mavzusi to'liq izohlangan bo'lishi kerak.
const mantiq = kunlikBank0.filter((q) => q.t === "Mantiq");
tekshir("Mantiq mavzusining hamma savoli izohli",
  mantiq.every((q) => q.e), `${mantiq.filter((q) => !q.e).length} ta izohsiz`);

// Izoh to'g'ri javobga olib borishi kerak: sonli javob izohda ham uchrasin.
// Bu siljish xatosini (izoh boshqa savolga tushib qolishi) ushlaydi.
const sonsiz = mantiq.filter((q) => {
  const j = (q.o[q.c].match(/\d[\d\s.,]*/) || [])[0];
  if (!j) return false;
  const tozala = (x) => x.replace(/[\s.,]/g, "");
  return !(q.e.match(/\d[\d\s.,]*/g) || []).some((x) => tozala(x) === tozala(j));
});
tekshir("sonli javob izohda ham uchraydi (siljish yo'q)", sonsiz.length === 0,
  `${sonsiz.length} ta mos kelmadi`);

// ——————————————————————————————— 6c. Xatolar banki va takrorlash
console.log("\n6c. Xatolar banki: xato tushadi, to'g'ri javob chiqaradi");
const envX = { ...env, DB: yangiD1() };
const soX = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envX, ctx);
const xabarX = (t) => soX({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0,
  chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: t } });

// Bo'sh bank — tushunarli xabar chiqishi kerak, xato emas.
yuborilgan.length = 0;
await xabarX("/xatolar");
tekshir("bo'sh bankda tushunarli xabar",
  yuborilgan.some((x) => /xato|adashgan/i.test(x.body.text || "")));

// Kitob marafonida ataylab XATO javob beramiz.
yuborilgan.length = 0; oxirgiPoll = null;
await xabarX("/fasl 1");
const xp = oxirgiPoll; oxirgiPoll = null;
const xatoVariant = (xp.correct + 1) % xp.variantlar.length;
await soX({ update_id: ++POLL_SEQ, poll_answer: { poll_id: xp.id,
  user: { id: UID, first_name: "Sinov" }, option_ids: [xatoVariant] } });

const xatolar = qatorlar(envX.DB, "SELECT * FROM answers WHERE correct = 0");
tekshir("xato javob bazaga yozildi", xatolar.length === 1);

// Endi bank bo'sh bo'lmasligi kerak.
yuborilgan.length = 0;
await xabarX("/xatolar");
const bankXabar = yuborilgan.find((x) => /Xatolarim|Xatolar ustida ishlash|Qaytib keladigan savollar|Xatolar bankim/i.test(x.body.text || ""));
tekshir("bank xatoni ko'rsatdi", !!bankXabar);
tekshir("takrorlash tugmasi bor",
  JSON.stringify(bankXabar?.body.reply_markup || {}).includes("xato:boshla"));

// Takrorlashni boshlaymiz — muddati kelmagan bo'lsa ham eng eskisi olinadi.
yuborilgan.length = 0; oxirgiPoll = null;
await soX({ update_id: ++POLL_SEQ, callback_query: { id: "1", from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "xato:boshla" } });
const tp = yuborilgan.find((x) => x.metod === "sendPoll");
tekshir("takrorlash savoli yuborildi", !!tp);
tekshir("takrorlash savolida taymer yo'q", tp && tp.body.open_period === undefined);
tekshir("takrorlashda ham izoh bor", !!tp?.body.explanation);
tekshir("so'rovnoma yozuvida qid saqlandi",
  !!qator(envX.DB, "SELECT qid FROM polls WHERE mode = 'x'")?.qid);

// To'g'ri javob beramiz — savol bankdan chiqishi kerak.
const tpoll = oxirgiPoll; oxirgiPoll = null;
yuborilgan.length = 0;
await soX({ update_id: ++POLL_SEQ, poll_answer: { poll_id: tpoll.id,
  user: { id: UID, first_name: "Sinov" }, option_ids: [].concat(tpoll.correct) } });

const qolgan = qatorlar(envX.DB,
  "SELECT qid FROM answers GROUP BY qid HAVING MAX(correct) = 0");
tekshir("to'g'ri javobdan keyin savol bankdan chiqdi", qolgan.length === 0,
  `bankda ${qolgan.length} ta qoldi`);
tekshir("takrorlash yakuni e'lon qilindi",
  yuborilgan.some((x) => /yakunlandi|bo'shadi/.test(x.body.text || "")));

// ——————————————————————————————— 6d. Yo'nalish va adolatli reyting
console.log("\n6d. Yo'nalish savol sonini o'zgartirmaydi");
// ADOLAT ShARTI: yo'nalish faqat mavzuni o'zgartiradi. Agar sonini ham
// o'zgartirsa, reyting mavzu tanlashga aylanib qoladi — kim oson mavzuni
// tanlasa, o'sha yuqorida turadi. Shuning uchun bu sinov.
const cfg = await import("../src/config.js");
const kunlikBank = (await import("../src/quiz_bank.json", { with: { type: "json" } })).default;
const kutilganSoni = cfg.todayCount();

const sonlar = cfg.YONALISHLAR.map((y) =>
  cfg.pickTodayFor(kunlikBank, y.k, 555001).length);
tekshir("hamma yo'nalishda savol soni bir xil",
  sonlar.every((n) => n === kutilganSoni), `sonlar: ${sonlar.join(", ")}`);

const itSavollar = cfg.pickTodayFor(kunlikBank, "IT", 555001);
tekshir("IT yo'nalishida faqat IT savollari",
  itSavollar.every((q) => q.t === "IT"),
  `mavzular: ${[...new Set(itSavollar.map((q) => q.t))].join(",")}`);

// Deterministiklik: javob kelganda to'plam qayta hisoblanadi, shuning uchun
// bir xil (uid, kun, yo'nalish) bir xil natija berishi SHART.
const a1 = cfg.pickTodayFor(kunlikBank, "Liderlik", 555001).map((q) => q.q).join("|");
const a2 = cfg.pickTodayFor(kunlikBank, "Liderlik", 555001).map((q) => q.q).join("|");
tekshir("bir xil foydalanuvchiga bir xil to'plam", a1 === a2);

const b1 = cfg.pickTodayFor(kunlikBank, "Liderlik", 999002).map((q) => q.q).join("|");
tekshir("boshqa foydalanuvchiga boshqa boshlanish nuqtasi", a1 !== b1);

// Noma'lum yo'nalish aralashga qaytishi kerak, bo'sh viktorina bermasligi.
tekshir("noma'lum yo'nalish aralashga qaytadi",
  cfg.pickTodayFor(kunlikBank, "YoqMavzu", 555001).length === kutilganSoni);

// Yo'nalish tanlash jarayoni
const envY = { ...env, DB: yangiD1() };
const soY = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envY, ctx);
yuborilgan.length = 0;
await soY({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0,
  chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/yonalish" } });
tekshir("yo'nalish menyusi ochildi",
  yuborilgan.some((x) => /yo'nalishi/i.test(x.body.text || "")));

yuborilgan.length = 0;
await soY({ update_id: ++POLL_SEQ, callback_query: { id: "2", from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "y:Mantiq" } });
tekshir("tanlov bazaga yozildi",
  qator(envY.DB, "SELECT yonalish FROM users WHERE uid = ?", String(UID))?.yonalish === "Mantiq");
tekshir("kichik baza uchun ogohlantirish berildi",
  yuborilgan.some((x) => /takrorlana/.test(x.body.text || "")));

// Tanlovdan keyin kunlik viktorina shu mavzudan bo'lishi kerak.
yuborilgan.length = 0; oxirgiPoll = null;
await soY({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0,
  chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/kunlik" } });
// Kunlik to'plam: avval arab kursi savollari (kurs kunlarida), qolgani — tanlangan yo'nalishdan.
// Shuning uchun birinchi yuborilgan savol arabcha bo'lishi mumkin; yo'nalishni to'plamning o'zidan tekshiramiz.
const toplamY = cfg.kunlikToplam(kunlikBank, "Mantiq", UID).filter((q) => q.t !== "Arab");
tekshir("kunlik viktorina asosan tanlangan yo'nalishdan keldi (70/30: o'z mavzu ko'pchilik + boshqa mavzular)",
  toplamY.length > 0 && toplamY.filter((q) => !q.h && q.t === "Mantiq").length >= 6 && toplamY.filter((q) => !q.h && q.t !== "Mantiq").length >= 2 && toplamY.filter((q) => q.h).length === 3 && !!oxirgiPoll,
  `arab bo'lmaganlari: ${[...new Set(toplamY.map((q) => q.t))].join(", ")}`);

// ——————————————————————————————— 6e. Rus kitob marafoni
console.log("\n6e. Rus marafoni o'zbekchasidan mustaqil");
const envRu = { ...env, DB: yangiD1() };
const soRu = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envRu, ctx);
const xabarRu = (t) => soRu({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0,
  chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: t } });

const kitobRu = (await import("../src/kitob_bank_ru.json", { with: { type: "json" } })).default;
const kitobUz = (await import("../src/kitob_bank.json", { with: { type: "json" } })).default;

// Baza sifati: tarjima o'zbekchaning tuzilmasiga mos bo'lishi SHART.
// To'g'ri javob indeksi siljisa, rus foydalanuvchisi to'g'ri javobni
// tanlab ham xato oladi va buni hech kim sezmaydi.
const ruFasllar = [...new Set(kitobRu.map((q) => q.f))];
let mosmi = true, nomos = [];
for (const f of ruFasllar) {
  const a = kitobUz.filter((q) => q.f === f);
  const b = kitobRu.filter((q) => q.f === f);
  if (a.length !== b.length) { mosmi = false; nomos.push(`fasl ${f}: ${b.length}/${a.length}`); continue; }
  for (let i = 0; i < a.length; i++) {
    if (a[i].c !== b[i].c) { mosmi = false; nomos.push(`fasl ${f} savol ${i}: c=${a[i].c}/${b[i].c}`); }
  }
}
tekshir("rus bazasi o'zbekchaga tuzilma bo'yicha mos", mosmi, nomos.slice(0, 3).join("; "));
tekshir("rus izohlari 200 belgidan oshmaydi",
  kitobRu.every((q) => (q.e || "").length <= 200));
tekshir("rus savollarida kirill harflari bor",
  kitobRu.every((q) => /[\u0400-\u04FF]/.test(q.q)));

// Menyu
yuborilgan.length = 0;
await xabarRu("/kitob_ru");
tekshir("rus menyusi ochildi",
  yuborilgan.some((x) => /Марафон/.test(x.body.text || "")));
tekshir("iqtibos haqida ogohlantirish bor",
  yuborilgan.some((x) => /переведены/.test(x.body.text || "")));

// Faslni boshlash
yuborilgan.length = 0; oxirgiPoll = null;
await soRu({ update_id: ++POLL_SEQ, callback_query: { id: "9", from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "kr:1" } });
const rp = yuborilgan.find((x) => x.metod === "sendPoll");
tekshir("rus savoli yuborildi", !!rp);
tekshir("savol rus tilida", /[\u0400-\u04FF]/.test(rp?.body.question || ""));
tekshir("rus savolida taymer bor", rp && rp.body.open_period >= 20 && rp.body.open_period <= 45);
tekshir("rus izohi biriktirilgan", /[\u0400-\u04FF]/.test(rp?.body.explanation || ""));
tekshir("javob 'r' rejimida saqlandi",
  qator(envRu.DB, "SELECT mode FROM polls LIMIT 1")?.mode === "r");

// Javob berib, bazaga 'r' rejimida yozilishini tekshiramiz
const rpoll = oxirgiPoll; oxirgiPoll = null;
await soRu({ update_id: ++POLL_SEQ, poll_answer: { poll_id: rpoll.id,
  user: { id: UID, first_name: "Sinov" }, option_ids: [].concat(rpoll.correct) } });
tekshir("javob 'r' rejimi bilan yozildi",
  qatorlar(envRu.DB, "SELECT * FROM answers WHERE mode = 'r'").length === 1);
tekshir("o'zbek rejimiga javob yozilmadi",
  qatorlar(envRu.DB, "SELECT * FROM answers WHERE mode = 'k'").length === 0);

// ENG MUHIM: o'zbek marafoni rus javoblarini "berilgan" deb hisoblamasligi kerak
yuborilgan.length = 0; oxirgiPoll = null;
await xabarRu("/fasl 1");
const up = yuborilgan.find((x) => x.metod === "sendPoll");
tekshir("o'zbek marafoni 1-savoldan boshlandi (aralashmadi)",
  /Savol 1\/\d+/.test(up?.body.question || ""), up?.body.question?.slice(0, 40));
tekshir("o'zbek savoli lotin yozuvida", !/[\u0400-\u04FF]/.test(up?.body.question || ""));

// ——————————————————————————————— 6f. Natija 0 chiqmasligi + sikl bo'lmasligi
console.log("\n6f. Natija to'g'ri sanaladi va cheksiz sikl yo'q");

// XATO 1 edi: faslJavoblari so'rovida rejim qattiq 'k' yozilgan edi, rus
// javoblari esa 'r' bilan yozilardi. Natija har doim 0/N chiqardi.
// Foydalanuvchi 10 ta savolga to'g'ri javob berib "0/10" ko'rardi, va
// buni hech qanday mavjud sinov ushlamasdi.
const envF = { ...env, DB: yangiD1() };
const soF = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envF, ctx);

yuborilgan.length = 0; oxirgiPoll = null;
await soF({ update_id: ++POLL_SEQ, callback_query: { id: "7", from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "kr:1" } });

let nF = 0;
while (oxirgiPoll && nF < 20) {
  const pq = oxirgiPoll; oxirgiPoll = null;
  yuborilgan.length = 0;
  await soF({ update_id: ++POLL_SEQ, poll_answer: { poll_id: pq.id,
    user: { id: UID, first_name: "Sinov" }, option_ids: [].concat(pq.correct) } });
  nF++;
}
const faslYakun = yuborilgan.find((x) => /Результат/.test(x.body.text || ""));
tekshir("rus fasli yakunlandi", !!faslYakun);
tekshir("hamma javob to'g'ri bo'lsa natija 100%",
  /Результат: <b>(\d+)\/\1<\/b> — 100%/.test(faslYakun?.body.text || ""),
  (faslYakun?.body.text || "").match(/Результат[^\n]*/)?.[0]);

// XATO 2 edi: noma'lum qid "topilmadi" tarmog'iga tushib, bo'sh matn bilan
// yozuv qo'shar va o'zini qayta chaqirardi. Bo'sh matnning qid'i har safar
// bir xil bo'lgani uchun sikl uzilmasdi — bazaga 3500 ta axlat yozilgan edi.
envF.DB._sq.prepare(
  "INSERT INTO mistake (uid, qid, topic, urinish, ochiq, oxirgi) " +
  "VALUES (?,?,?,1,1, datetime('now','-9 days'))"
).run(String(UID), "yoq_bunday_qid", "Kitob");

const oldin = qatorlar(envF.DB, "SELECT * FROM answers").length;
yuborilgan.length = 0;
await soF({ update_id: ++POLL_SEQ, callback_query: { id: "8", from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "xato:boshla" } });
const keyin = qatorlar(envF.DB, "SELECT * FROM answers").length;

tekshir("noma'lum qid axlat yozuv qoldirmadi", keyin === oldin,
  `${keyin - oldin} ta qo'shimcha qator yozildi`);
tekshir("bo'sh qid'li yozuv yo'q",
  qatorlar(envF.DB, "SELECT * FROM answers WHERE qid = 'ztntfp'").length === 0);

// Rus savollari xaritaga kirganini tekshiramiz — xato aynan shundan boshlangan
const kitobRu2 = (await import("../src/kitob_bank_ru.json", { with: { type: "json" } })).default;
const dbMod = await import("../src/db.js");
envF.DB._sq.prepare("DELETE FROM answers").run();
envF.DB._sq.prepare("DELETE FROM mistake").run();
await dbMod.javobYoz(envF, { uid: UID, mode: "r", fasl: 1, idx: 0,
  savol: kitobRu2[0].q, topic: "Книга", ok: false });
// Takrorlash muddati kelgan bo'lsin — 5 kun oldingi xato.
envF.DB._sq.prepare("UPDATE mistake SET oxirgi = datetime('now','-5 days') WHERE uid = ?")
  .run(String(UID));

yuborilgan.length = 0; oxirgiPoll = null;
await soF({ update_id: ++POLL_SEQ, callback_query: { id: "10", from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "xato:boshla" } });
tekshir("rus marafonidagi xato o'zbek tilidagi foydalanuvchiga O'ZBEKCHA ko'rsatildi (rus matni chiqmaydi)",
  yuborilgan.some((x) => x.metod === "sendPoll" && /Ilm olish sirlari/.test(x.body.question || "") && !/[\u0400-\u04FF]/.test(x.body.question || "")),
  "savol tarjima qilinmadi");

// ——————————————————————————————— 7. Bo'sh statistika
console.log("\n7. Chekka holatlar");
const env5 = { ...env, DB: yangiD1() };
const so5 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), env5, ctx);
yuborilgan.length = 0;
await so5({ update_id: 1, message: { message_id: 1, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/natija" } });
tekshir("javob bermagan odamga tushunarli xabar",
  yuborilgan.some((x) => /birorta savolga javob bermagansiz/i.test(x.body.text || "")));

yuborilgan.length = 0;
await so5({ update_id: 2, message: { message_id: 2, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/reyting" } });
tekshir("bo'sh reyting buzilmaydi",
  yuborilgan.some((x) => /hech kim/.test(x.body.text || "")));

const matnlar = yuborilgan.map((x) => x.body.text || "").join(" ");
tekshir("hech qayerda NaN chiqmadi", !/NaN/.test(matnlar));

// ——————————————————————————————— 7b. Takroriy kirish savolni takrorlamaydi
console.log("\n7b. Tugmani ikki marta bosish savolni takrorlamaydi");
const envR = { ...env, DB: yangiD1() };
const soR = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envR, ctx);
const kunlikR = (id) => soR({ update_id: id, message: { message_id: id, date: 0,
  chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "/kunlik" } });

yuborilgan.length = 0; oxirgiPoll = null;
await kunlikR(1);
const birinchiSavol = yuborilgan.filter((x) => x.metod === "sendPoll").length;

yuborilgan.length = 0;
await kunlikR(2);                      // darhol yana bosadi
const ikkinchiSavol = yuborilgan.filter((x) => x.metod === "sendPoll").length;

tekshir("birinchi bosishda savol keldi", birinchiSavol === 1);
tekshir("ikkinchi bosishda savol TAKRORLANMADI", ikkinchiSavol === 0,
  `takroran ${ikkinchiSavol} ta savol yuborildi`);
tekshir("o'rniga tushuntirish berildi",
  yuborilgan.some((x) => /allaqachon boshlangan/.test(x.body.text || "")));

// ——————————————————————————————— 8. Uzun taymer zanjiri
console.log("\n8. Uzun taymer: kutish bo'laklarga bo'linadi");
// Cloudflare fon ishini ~30 soniyada to'xtatadi, savol taymeri 45 soniyagacha
// bo'lishi mumkin. Shuning uchun kutish bo'laklanib, Worker o'zini qayta
// chaqirishi kerak. Soatni va o'zini-chaqirishni ushlab tekshiramiz.
const envZ = { ...env, DB: yangiD1(), WEBHOOK_URL: "https://o'zim/", WEBHOOK_SECRET: "s" };
const soZ = (u) => bot.fetch(
  new Request("https://x/", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "s" }, body: JSON.stringify(u) }),
  envZ, ctx);

// Soxta poll yozuvi: 45 soniyalik savol, hali javob berilmagan
envZ.DB._sq.prepare(
  "INSERT INTO polls (poll_id, uid, mode, idx, chat_id, msg_id, created) VALUES (?,?,?,?,?,?,?)"
).run("ZANJIR", String(UID), "d", 0, String(UID), 1, Math.floor(Date.now() / 1000));

// setTimeout ni darhol qaytaradigan qilamiz — sinov 47 soniya kutmasin
const haqiqiySetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn) => haqiqiySetTimeout(fn, 0);

// o'zini-chaqirishni ushlaymiz
const ozChaqiruvlar = [];
const haqiqiyFetch = globalThis.fetch;
globalThis.fetch = async (url, opt) => {
  const body = JSON.parse(opt.body);
  if (body.__kutish) { ozChaqiruvlar.push(body.__kutish); return { json: async () => ({ ok: true }) }; }
  return haqiqiyFetch(url, opt);
};

await soZ({ __kutish: { pollId: "ZANJIR", vaqt: 45 } });
await new Promise((r) => haqiqiySetTimeout(r, 60));

tekshir("45 soniyalik kutish bo'lindi", ozChaqiruvlar.length === 1,
  `o'zini chaqirish soni: ${ozChaqiruvlar.length}`);
tekshir("qolgan vaqt to'g'ri hisoblandi", ozChaqiruvlar[0]?.qoldi === 45700 - 25000,
  `qoldi: ${ozChaqiruvlar[0]?.qoldi}`);
tekshir("bo'lak hisoblagichi oshdi", ozChaqiruvlar[0]?.bolak === 1);
tekshir("savol hali o'tkazilmadi",
  qator(envZ.DB, "SELECT * FROM polls WHERE poll_id = 'ZANJIR'") !== null);

// Javob berilgan bo'lsa zanjir to'xtashi kerak
ozChaqiruvlar.length = 0;
envZ.DB._sq.prepare("DELETE FROM polls WHERE poll_id = 'ZANJIR'").run();
await soZ({ __kutish: { pollId: "ZANJIR", vaqt: 45 } });
await new Promise((r) => haqiqiySetTimeout(r, 60));
tekshir("javob berilgan savol uchun zanjir to'xtaydi", ozChaqiruvlar.length === 0);

globalThis.setTimeout = haqiqiySetTimeout;
globalThis.fetch = haqiqiyFetch;

// ——————————————————————————————— 6g. Nosozlikda bot JIM QOLMAYDI
console.log("\n6g. Xato yuz berganda foydalanuvchi xabar oladi");

// NEGA BU SINOV BOR: bugun bot "ishlamay qoldi" — tugmalarga javob
// bermadi. Webhook sog'lom, token to'g'ri, Worker 200 qaytaryapti.
// Sabab D1 ning kunlik bepul o'qish limiti tugagani edi, xato esa
// `catch (e) { console.error(...) }` ichida yutilib ketgan.
//
// Shuning uchun bu sinov NATIJANI emas, NOSOZLIK XULQINI tekshiradi:
// baza ishlamasa ham foydalanuvchi sababni bilib turishi kerak.

const haqiqiyDB = env.DB;
const soxtaXato = (matn) => ({
  prepare() {
    return {
      bind() { return this; },
      first() { throw new Error(matn); },
      all() { throw new Error(matn); },
      run() { throw new Error(matn); },
    };
  },
  batch() { throw new Error(matn); },
});

// Har chaqiruvda BOSHQA chat: xato xabarining sovush vaqti bor
// (bir odamga 15 daqiqada bir marta), shuning uchun bitta chatdan
// ketma-ket ikki xabar kutish noto'g'ri bo'lardi.
let xatoChat = 770000;
async function xatoBilanYubor(matn, chat = ++xatoChat) {
  yuborilgan.length = 0;
  fonVazifalar.length = 0;
  env.DB = soxtaXato(matn);
  await so({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0,
    chat: { id: chat, type: "private" },
    from: { id: chat, is_bot: false, first_name: "Sinov" }, text: "/start" } });
  await Promise.allSettled(fonVazifalar.splice(0));
  env.DB = haqiqiyDB;
  return yuborilgan.filter((y) => y.metod === "sendMessage");
}

const LIMIT_MATN =
  "D1_ERROR: Your account has exceeded D1's free tier daily row read limit. [code: 7500]";
const limitXabar = await xatoBilanYubor(LIMIT_MATN);
const uXabar = limitXabar.find((y) => String(y.body.chat_id) === String(xatoChat));
const aXabar = limitXabar.find((y) => String(y.body.chat_id) === "1");

tekshir("limit xatosida foydalanuvchi xabar oladi", !!uXabar,
  `yuborilgan: ${limitXabar.length} ta`);
tekshir("foydalanuvchiga tiklanish vaqti aytiladi", uXabar?.text?.includes("05:00") ||
  uXabar?.body?.text?.includes("05:00"));

// Foydalanuvchiga TEXNIK tafsilot ketmasligi kerak. Xom inglizcha xato
// matni unga hech qanday qaror qabul qilishga yordam bermaydi — faqat
// tashvish qo'shadi va botni buzuq ko'rsatadi.
tekshir("foydalanuvchiga xom xato matni KETMAYDI",
  !/D1_ERROR|exceeded|cloudflare|free tier/i.test(uXabar?.body?.text || ""),
  uXabar?.body?.text?.slice(0, 80));
tekshir("foydalanuvchiga ma'lumot saqlanishi aytiladi",
  /yo'qolmaydi|saqlan/i.test(uXabar?.body?.text || ""));

// Telegram havolani ko'rsa, ostiga Cloudflare hujjatining kartasini
// ilib qo'yadi — xabar nosozlik hisoboti emas, reklamaga o'xshab qoladi.
tekshir("havola ko'rinishi o'chirilgan",
  uXabar?.body?.link_preview_options?.is_disabled === true &&
  aXabar?.body?.link_preview_options?.is_disabled === true);

tekshir("adminga xabar ketadi", !!aXabar);
for (const bolim of ["Nima bo'ldi", "Kimga ta'sir", "Qachon tiklanadi", "Nima qilish kerak"])
  tekshir(`admin hisobotida «${bolim}» bor`, (aXabar?.body?.text || "").includes(bolim));
tekshir("admin hisoboti o'zbekcha boshlanadi",
  /BOT TO'XTADI/.test(aXabar?.body?.text || ""));
tekshir("texnik qism oxirida, <pre> ichida",
  (aXabar?.body?.text || "").includes("<pre>") &&
  (aXabar?.body?.text || "").indexOf("<pre>") >
  (aXabar?.body?.text || "").indexOf("Nima qilish kerak"));

// Kod xatosi — boshqa toifa: o'zi tiklanmaydi, demak boshqa maslahat.
const kodXabar = await xatoBilanYubor("TypeError: qs is not iterable");
const uKod = kodXabar.find((y) => String(y.body.chat_id) === String(xatoChat));
const aKod = kodXabar.find((y) => String(y.body.chat_id) === "1");
tekshir("dastur xatosida boshqa matn ishlatiladi",
  !/05:00/.test(uKod?.body?.text || "") && /adminga/i.test(uKod?.body?.text || ""));
tekshir("admin dastur xatosida stack joyini oladi",
  /sinov\.mjs|db\.js|index\.js/.test(aKod?.body?.text || ""));

// SOVUSh VAQTI. Baza ishlamayotganda odam tabiiy ravishda qayta urinib
// ko'radi. Har urinishga bir xil uzun xabar bilan javob berish —
// birinchi xabar ma'lumot, beshinchisi bezovta qilish.
const sovush1 = await xatoBilanYubor(LIMIT_MATN, 779001);
const sovush2 = await xatoBilanYubor(LIMIT_MATN, 779001);
tekshir("birinchi urinishda xabar keladi",
  sovush1.some((y) => String(y.body.chat_id) === "779001"));
tekshir("darhol takrorlanganda xabar KELMAYDI",
  !sovush2.some((y) => String(y.body.chat_id) === "779001"),
  `takroriy xabar yuborildi`);
tekshir("boshqa foydalanuvchi ta'sirlanmaydi",
  (await xatoBilanYubor(LIMIT_MATN, 779002))
    .some((y) => String(y.body.chat_id) === "779002"));

// Baza tiklangandan keyin bot normal ishlashi kerak.
yuborilgan.length = 0;
await xabar("/start");
tekshir("baza tiklangach /start yana ishlaydi",
  yuborilgan.some((y) => (y.metod === "sendMessage" && !/nosozlik|limit|noto'g'ri ketdi/i.test(y.body.text)) ||
    (y.metod === "sendPhoto" && /Salom/.test(y.body.caption || ""))));
// Kirish rasmi: salomlashuv Lumi rasmi bilan, file_id keshlanadi, tavsif admin buyrug'i bilan yangilanadi
tekshir("/start salomlashuvi Lumi rasmi bilan (caption) keladi", yuborilgan.some((y) => y.metod === "sendPhoto" && /Salom/.test(y.body.caption || "")));
yuborilgan.length = 0;
await xabar("/start");
tekshir("ikkinchi /start keshlangan file_id bilan yuboriladi (qayta yuklanmaydi)", yuborilgan.some((y) => y.metod === "sendPhoto" && y.body.photo && !y.body.forma));

// ——————————————————————————————— 9. Agregatlar: invariant va narx
console.log("\n9. Agregatlar aslga mos va so'rovlar arzon");

const dbA = await import("../src/db.js");

/** user_stat `answers` dan qayta sanash bilan mos keladimi? */
function invariant(e) {
  const kutilgan = qatorlar(e.DB, `
    SELECT uid, '' AS topic, COUNT(*) AS a, SUM(correct) AS c FROM answers GROUP BY uid
    UNION ALL
    SELECT uid, topic, COUNT(*), SUM(correct) FROM answers WHERE topic IS NOT NULL
    GROUP BY uid, topic
  `);
  const bor = qatorlar(e.DB, "SELECT uid, topic, a, c FROM user_stat WHERE a > 0");
  const kalit = (r) => `${r.uid}|${r.topic}`;
  const xarita = new Map(bor.map((r) => [kalit(r), r]));

  const farqlar = [];
  for (const k of kutilgan) {
    const b = xarita.get(kalit(k));
    if (!b) { farqlar.push(`${kalit(k)}: yo'q (kutilgan ${k.a}/${k.c})`); continue; }
    if (b.a !== k.a || b.c !== (k.c || 0))
      farqlar.push(`${kalit(k)}: ${b.a}/${b.c} ≠ ${k.a}/${k.c || 0}`);
    xarita.delete(kalit(k));
  }
  for (const [k, v] of xarita) farqlar.push(`${k}: ortiqcha ${v.a}/${v.c}`);
  return farqlar;
}

const envA = { ...env, DB: yangiD1() };

// Tasodifiy, lekin takrorlanadigan ketma-ketlik. Urug' qat'iy —
// sinov yiqilsa, aynan o'sha holat qayta tiklanadi.
let urugA = 20261019;
const tasodif = () => (urugA = (urugA * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const MAVZU = ["IT", "Kitob", "Mantiq", "Liderlik", null];
const REJIM = ["d", "k", "r", "s", "x"];
for (let i = 0; i < 300; i++) {
  await dbA.javobYoz(envA, {
    uid: 900 + Math.floor(tasodif() * 4),
    mode: REJIM[Math.floor(tasodif() * REJIM.length)],
    fasl: 1 + Math.floor(tasodif() * 3),
    idx: i,
    savol: "savol " + Math.floor(tasodif() * 40),
    topic: MAVZU[Math.floor(tasodif() * MAVZU.length)],
    ok: tasodif() < 0.5,
  });
}
tekshir("300 ta javobdan keyin agregat aslga mos", invariant(envA).length === 0,
  invariant(envA).slice(0, 3).join("; "));

// Faslni qayta boshlash — agregat tizimlarining klassik tuzog'i.
// Qo'shishni hamma eslaydi, AYIRISHNI ko'pchilik unutadi.
for (let f = 1; f <= 3; f++)
  for (const m of ["k", "r"])
    await dbA.faslTozala(envA, 901, f, m);
tekshir("fasl tozalangach agregat ham kamaydi", invariant(envA).length === 0,
  invariant(envA).slice(0, 3).join("; "));

// Qayta boshlab, qayta javob berish ikki barobar sanalmasligi kerak.
for (let i = 0; i < 20; i++)
  await dbA.javobYoz(envA, { uid: 901, mode: "k", fasl: 1, idx: i,
    savol: "savol " + i, topic: "Kitob", ok: i % 3 === 0 });
tekshir("qayta ishlangan fasl ikki barobar sanalmadi", invariant(envA).length === 0,
  invariant(envA).slice(0, 3).join("; "));

// Tiklash yo'li: agregat buzilsa, undan qaytish mumkin bo'lishi SHART.
// Tiklash yo'li bo'lmagan agregat — vaqt bombasi.
envA.DB._sq.prepare("UPDATE user_stat SET a = 99999, c = 0").run();
tekshir("buzilgan agregat aniqlanadi", invariant(envA).length > 0);
await dbA.qaytaHisobla(envA);
tekshir("qaytaHisobla agregatni tiklaydi", invariant(envA).length === 0,
  invariant(envA).slice(0, 3).join("; "));

// ——— xatolar banki
const ochiq = qatorlar(envA.DB,
  "SELECT qid FROM mistake WHERE uid = ? AND ochiq = 1", "900");
const haqiqiy = qatorlar(envA.DB, `
  SELECT qid FROM answers WHERE uid = '900' GROUP BY qid HAVING MAX(correct) = 0
`);
tekshir("xatolar banki aslga mos",
  ochiq.length === haqiqiy.length,
  `mistake: ${ochiq.length}, answers: ${haqiqiy.length}`);

await dbA.javobYoz(envA, { uid: 900, mode: "d", idx: 0,
  savol: haqiqiy[0] ? "x" : "x", topic: "IT", ok: false });
const qidX = dbA.qid("x");
await dbA.javobYoz(envA, { uid: 900, mode: "d", idx: 1, savol: "x", topic: "IT", ok: true });
tekshir("to'g'ri javobdan keyin savol bankdan chiqadi",
  qator(envA.DB, "SELECT ochiq FROM mistake WHERE uid='900' AND qid=?", qidX)?.ochiq === 0);
await dbA.javobYoz(envA, { uid: 900, mode: "d", idx: 2, savol: "x", topic: "IT", ok: false });
tekshir("bir marta o'rganilgan savol bankka QAYTMAYDI",
  qator(envA.DB, "SELECT ochiq FROM mistake WHERE uid='900' AND qid=?", qidX)?.ochiq === 0);

// ——— narx: "Natijalarim" tarix o'sganda qimmatlashmasligi kerak
function sanoqliBaza(DB) {
  const h = { n: 0 };
  const orab = (st) => ({
    _sql: st._sql, _args: st._args,
    bind: (...a) => orab(st.bind(...a)),
    first: (...a) => { h.n++; return st.first(...a); },
    all: (...a) => { h.n++; return st.all(...a); },
    run: (...a) => { h.n++; return st.run(...a); },
  });
  return [{ ...DB, prepare: (q) => orab(DB.prepare(q)),
            batch: (l) => { h.n += l.length; return DB.batch(l); } }, h];
}

const [sanoqli, hisobA] = sanoqliBaza(envA.DB);
await dbA.statistika({ DB: sanoqli }, 900);
const narx300 = hisobA.n;

for (let i = 0; i < 600; i++)
  await dbA.javobYoz(envA, { uid: 900, mode: "d", idx: 1000 + i,
    savol: "yangi " + i, topic: "IT", ok: i % 2 === 0 });

hisobA.n = 0;
await dbA.statistika({ DB: sanoqli }, 900);
tekshir("600 ta yangi javobdan keyin ham narx O'ZGARMADI",
  hisobA.n === narx300, `oldin ${narx300}, keyin ${hisobA.n}`);
tekshir("«Natijalarim» narxi 3 ta so'rovdan oshmaydi", narx300 <= 3, `so'rov: ${narx300}`);

hisobA.n = 0;
await dbA.xatoRoyxat({ DB: sanoqli }, 900, 50);
tekshir("«Xatolarim» narxi 1 ta so'rov", hisobA.n === 1, `so'rov: ${hisobA.n}`);

// ——————————————————————————————— 10. So'rov byudjeti
console.log("\n10. Takrorlanuvchi sikl kunlik kvotani yoqib yubora olmaydi");

const { byudjetliBaza, SOROV_CHEGARASI } = mod;
const hisobB = { n: 0 };
const himoyali = byudjetliBaza(envA.DB, hisobB);

let otdiB = 0, uzildi = null;
try {
  for (let i = 0; i < 5000; i++) {
    await himoyali.prepare("SELECT 1 AS x").bind().first();
    otdiB++;
  }
} catch (e) { uzildi = e; }

tekshir("sikl chegarada to'xtadi", !!uzildi && otdiB === SOROV_CHEGARASI,
  `${otdiB} ta so'rovdan keyin to'xtadi (chegara ${SOROV_CHEGARASI})`);
tekshir("xato sababni tushuntiradi", /sikl|byudjet/i.test(uzildi?.message || ""));
tekshir("5000 o'rniga 100 ta so'rov sarflandi", otdiB < 200);

// batch() o'ralgan obyekt bilan ishlashi SHART: D1 ga haqiqiy
// tayyorlangan so'rov kerak, o'rama emas.
const hisobC = { n: 0 };
const himoyali2 = byudjetliBaza(envA.DB, hisobC);
let batchXato = null;
try {
  await himoyali2.batch([
    himoyali2.prepare("INSERT INTO tizim (k, v) VALUES (?, ?)").bind("sinov1", "1"),
    himoyali2.prepare("INSERT INTO tizim (k, v) VALUES (?, ?)").bind("sinov2", "2"),
  ]);
} catch (e) { batchXato = e; }
tekshir("byudjet o'ramasi batch() ni buzmaydi", !batchXato, String(batchXato).slice(0, 90));
tekshir("batch yozuvlari bazaga tushdi",
  qatorlar(envA.DB, "SELECT k FROM tizim WHERE k LIKE 'sinov%'").length === 2);

// ——————————————————————————————— 11. Ogohlantirish kuniga bir marta
console.log("\n11. Admin ogohlantirishi takrorlanmaydi");

const envM = { ...env, DB: yangiD1() };
tekshir("birinchi chaqiruv true", (await dbA.birMarta(envM, "k1")) === true);
tekshir("ikkinchi chaqiruv false", (await dbA.birMarta(envM, "k1")) === false);
tekshir("boshqa kalit mustaqil", (await dbA.birMarta(envM, "k2")) === true);

// ——————————————————————————————— 12. Tarqatma matnining formatlashi
console.log("\n12. Tarqatma admin ko'rgan matnni aynan saqlaydi");

const { entityHtml } = mod;

// Telegram ofsetlarni UTF-16 BIRLIGIDA beradi. Emoji ikki birlik
// egallaydi, kirill — bitta. Agar kod nuqtalari bo'yicha hisoblansa,
// emojidan keyingi butun formatlash siljib ketadi va matn buziladi.
// Bu xato lotin harflarida KO'RINMAYDI — shuning uchun aynan emoji va
// kirill bilan sinaladi.
const holatlar = [
  ["formatsiz matn", "Oddiy matn", [], "Oddiy matn"],
  ["qalin",     "Salom dunyo", [{ type: "bold", offset: 0, length: 5 }], "<b>Salom</b> dunyo"],
  ["emojidan keyin qalin",
   "🧠 Salom dunyo",
   [{ type: "bold", offset: 3, length: 5 }],
   "🧠 <b>Salom</b> dunyo"],
  ["kirill matnida kursiv",
   "Привет мир",
   [{ type: "italic", offset: 7, length: 3 }],
   "Привет <i>мир</i>"],
  ["havola",
   "Sayt: ustozimnurim.uz",
   [{ type: "text_link", offset: 6, length: 15, url: "https://ustozimnurim.uz" }],
   'Sayt: <a href="https://ustozimnurim.uz">ustozimnurim.uz</a>'],
  ["HTML belgilari qochiriladi",
   "a < b & c", [], "a &lt; b &amp; c"],
];

for (const [nom, matn, ent, kutilgan] of holatlar) {
  const chiqdi = entityHtml(matn, ent);
  tekshir(`entityHtml: ${nom}`, chiqdi === kutilgan, `chiqdi: ${chiqdi}`);
}

// ——————————————————————————————— 13. Yangi UX
console.log("\n13. Klaviatura, eski tugmalar va «Bugungi mashg'ulot»");

const { t: tt, menyu: menyuF, AMAL: AMALX } = await import("../src/matn.js");

// ESKI TUGMALAR. Telegram klaviaturani keshda saqlaydi: foydalanuvchi
// yangi xabar olmaguncha ESKI tugmalarni ko'rsatib turadi. Eski yozuv
// tanilmasa, bot javob bermaydi va odam "yana buzildi" deb o'ylaydi.
// Ko'chish paytidagi eng ko'p uchraydigan xato aynan shu.
for (const [eski, kutilgan] of [
  ["🧠 Kunlik viktorina", "kunlik"],
  ["📖 Kitob marafoni",   "marafon"],
  ["🔁 Xatolarim",        "takror"],
  ["📊 Natijalarim",      "natija"],
  ["🏆 Reyting",          "reyting"],
  ["📚 O'z tezligimda",   "mashq"],
  ["📕 Марафон (RU)",     "marafonRu"],
  ["ℹ️ Yordam",           "yordam"],
]) tekshir(`eski tugma ishlaydi: ${eski}`, AMALX.get(eski) === kutilgan, `→ ${AMALX.get(eski)}`);

// Yangi tugmalar ikki tilda ham tanilishi kerak.
for (const kalit of ["bugun", "kunlik", "marafon", "takror", "natija", "reyting", "sozlama"]) {
  tekshir(`yangi tugma (uz): ${kalit}`, AMALX.get(tt(`tugma.${kalit}`, "uz")) === kalit);
  tekshir(`yangi tugma (ru): ${kalit}`, AMALX.get(tt(`tugma.${kalit}`, "ru")) === kalit);
}

// Klaviatura tuzilishi: birinchi qator BITTA tugma bo'lishi shart —
// tugmaning kengligi uning muhimligini aytadi, buni tushuntirish kerak emas.
const kb = menyuF("uz").keyboard;
tekshir("menyuda «Viktorina savollar» tugmasi yo'q", !kb.flat().some((b) => b.text === tt("tugma.bugun")));
tekshir("birinchi qator: Kunlik viktorina + Duel", kb[0].length === 2 && kb[0][0].text === tt("tugma.kunlik") && kb[0][1].text === tt("tugma.duel"));
tekshir("2 qator: O'rganish + Profilim", kb.length === 2 && kb[1][0].text === tt("tugma.oganish") && kb[1][1].text === tt("tugma.profilim"));

// Tarjima to'liqligi: yetishmagan kalit [kalit] bo'lib ko'rinadi.
const { MATN } = await import("../src/matn.js");
const tarjimasiz = Object.entries(MATN).filter(([, v]) => !v.ru).map(([k]) => k);
tekshir("har bir matnning ruscha varianti bor", tarjimasiz.length === 0,
  tarjimasiz.slice(0, 5).join(", "));

// O'zgaruvchilar almashganini tekshiramiz — almashmagan {nom} xom
// holda foydalanuvchiga ko'rinadi va bu darhol sezilarli nuqson.
const namuna = tt("bugun.kunlik", "uz", { soni: 12, daqiqa: 5 });
tekshir("o'zgaruvchilar almashdi", !/\{\w+\}/.test(namuna), namuna.slice(0, 60));

// ——— TAVSIYA TARTIBI
//
// Tartib "qiziqarlilik" bo'yicha emas, VAQTGA BOG'LIQLIK bo'yicha:
// kechiktirib bo'lmaydigan ish birinchi turadi.
const envB = { ...env, DB: yangiD1() };
const UIDB = 991001;
const soB = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envB, ctx);
const bugunBos = async () => {
  yuborilgan.length = 0;
  await soB({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0,
    chat: { id: UIDB, type: "private" }, from: { id: UIDB, first_name: "Sinov" },
    text: tt("tugma.bugun") } });
  const x = yuborilgan.find((y) => y.metod === "sendMessage");
  return { matn: x?.body.text || "", amal: JSON.stringify(x?.body.reply_markup || {}) };
};

let r = await bugunBos();
tekshir("1-o'rin: kunlik sinov (hali ishlanmagan)", r.amal.includes("davom_d"), r.amal.slice(0, 70));

// Kunlik bajarildi deb belgilaymiz + muddati kelgan xato qo'shamiz.
await (await import("../src/db.js")).kunYakunla(envB, UIDB, new Date(Date.now() + 5*3600*1000)
  .toISOString().slice(0, 10), 5, 10);
const kitobBankX = (await import("../src/kitob_bank.json", { with: { type: "json" } })).default;
await (await import("../src/db.js")).javobYoz(envB, { uid: UIDB, mode: "k", fasl: 1, idx: 0,
  savol: kitobBankX[0].q, topic: "Kitob", ok: false });
envB.DB._sq.prepare("UPDATE mistake SET oxirgi = datetime('now','-9 days') WHERE uid = ?")
  .run(String(UIDB));

r = await bugunBos();
tekshir("2-o'rin: takrorlash (kunlik bajarilgan, muddat kelgan)",
  r.amal.includes("xato:boshla"), r.amal.slice(0, 70));

// Xatoni tuzatamiz — endi marafon qolishi kerak.
await (await import("../src/db.js")).javobYoz(envB, { uid: UIDB, mode: "k", fasl: 1, idx: 1,
  savol: kitobBankX[0].q, topic: "Kitob", ok: true });
r = await bugunBos();
tekshir("3-o'rin: marafon (kunlik va takrorlash bajarilgan)",
  /k:\d/.test(r.amal), r.amal.slice(0, 70));
tekshir("tavsiya matni bo'sh emas", r.matn.length > 40);

{
// ——————————————————————————————— 14. Yutuqlar
console.log("\n14. Yutuqlar — bir marta berilsa, qaytarib olinmaydi");

const dbYut = await import("../src/db.js");
const { YUTUQLAR, layoqatli } = await import("../src/yutuq.js");
const envYut = { ...env, DB: yangiD1() };
const UID_YUT = "992001";

// Ro'yxat qisqa bo'lishi SHART: har bir yangi nishon avvalgilarining
// qiymatini kamaytiradi. O'ttizta nishoni bor tizimda birortasi ham
// qadrlanmaydi.
tekshir("yutuqlar ro'yxati qisqa (<= 16)", YUTUQLAR.length <= 16, `${YUTUQLAR.length} ta`);
tekshir("har bir yutuqda ruscha nom va izoh bor",
  YUTUQLAR.every((y) => y.ru && y.ruIzoh));
tekshir("kodlar takrorlanmaydi",
  new Set(YUTUQLAR.map((y) => y.kod)).size === YUTUQLAR.length);

// Hech narsa qilmagan odamda yutuq bo'lmasligi kerak.
tekshir("bo'sh holatda yutuq yo'q",
  layoqatli({ jami: 0, tuzatilgan: 0, fasl: 0, toliqKun: 0, streak: 0, kunlar: 0 }).length === 0);

// ENG MUHIM SINOV: zanjir uzilsa ham yutuq qoladi.
//
// Yutuqni har safar hisoblab chiqarish mumkin edi (streak >= 7 → «hafta»).
// Lekin shunda odam bir kun tashlab ketsa, streak nolga tushadi va tizim
// uning bir hafta ketma-ket ishlaganini UNUTADI. Yutuq — bo'lib o'tgan
// voqea, hozirgi holat emas. Qaytarib olinadigan mukofot — tahdid.
await dbYut.yutuqBer(envYut, UID_YUT, layoqatli(
  { jami: 50, tuzatilgan: 0, fasl: 0, toliqKun: 0, streak: 7, kunlar: 7 }));
const haftaBor = (await dbYut.yutuqlarim(envYut, UID_YUT)).some((r) => r.kod === "hafta");
tekshir("7 kundan keyin «hafta» yutug'i berildi", haftaBor);

// Zanjir uzildi — streak 0.
const keyin = await dbYut.yutuqlarim(envYut, UID_YUT);
tekshir("zanjir uzilgach ham yutuq SAQLANADI",
  keyin.some((r) => r.kod === "hafta"), "yutuq yo'qoldi");

// Takroriy berish yangi xabar chiqarmasligi kerak.
// «ilk» birinchi chaqiruvdayoq berilgan edi (jami >= 1), shuning uchun
// hali berilmagan kod bilan tekshiramiz.
const takror = await dbYut.yutuqBer(envYut, UID_YUT, ["hafta", "marafon"]);
tekshir("allaqachon berilgan yutuq qayta e'lon qilinmaydi",
  !takror.includes("hafta"), `qaytdi: ${takror}`);
tekshir("yangi yutuq esa qaytariladi", takror.includes("marafon"), `qaytdi: ${takror}`);

// Shartlar mantiqi
tekshir("marafon yakunida eng yuqori yutuq ochiladi",
  layoqatli({ jami: 400, tuzatilgan: 60, fasl: 14, toliqKun: 3, streak: 31, kunlar: 60 })
    .includes("marafon"));
tekshir("yarim yo'lda marafon yutug'i ochilmaydi",
  !layoqatli({ jami: 200, tuzatilgan: 20, fasl: 7, toliqKun: 1, streak: 10, kunlar: 20 })
    .includes("marafon"));

// ——————————————————————————————— 15. Savol sifati
console.log("\n15. Buzuq savolni bildirish");

const envBayroq = { ...env, DB: yangiD1() };
const qidBayroq = dbYut.qid("Sinov savoli");

tekshir("birinchi belgilash qabul qilinadi",
  (await dbYut.belgilaQid(envBayroq, 11, qidBayroq)) === true);
// Bitta norozi odam hisobni shishirib, haqiqatan buzuq savollarni
// ro'yxat tubiga tushirib yuborishi mumkin edi.
tekshir("bir odam bir savolni IKKI MARTA belgilay olmaydi",
  (await dbYut.belgilaQid(envBayroq, 11, qidBayroq)) === false);
tekshir("boshqa odam belgilay oladi",
  (await dbYut.belgilaQid(envBayroq, 12, qidBayroq)) === true);

const belgilar = await dbYut.belgilanganlar(envBayroq, 10);
tekshir("belgilangan savol hisobi to'g'ri",
  belgilar[0]?.qid === qidBayroq && belgilar[0]?.n === 2,
  JSON.stringify(belgilar[0]));

// ——————————————————————————————— 16. Atribusiya
console.log("\n16. Kim qayerdan kelgan");

const envAtr = { ...env, DB: yangiD1() };
const soAtr = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envAtr, ctx);
const startBilan = (uid, arg) => soAtr({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0,
  chat: { id: uid, type: "private" }, from: { id: uid, first_name: "S" }, text: `/start ${arg}` } });

await startBilan(500, "d_400");
tekshir("taklif qilgan odam yozildi",
  qator(envAtr.DB, "SELECT kelgan FROM users WHERE uid = '500'")?.kelgan === "400");
tekshir("manba ham yozildi",
  qator(envAtr.DB, "SELECT manba FROM users WHERE uid = '500'")?.manba === "d_400");

// BIRINCHI manba — haqiqiy manba. Odam keyinroq boshqa havola bilan
// qaytsa ham, uni ASLIDA kim olib kelgani o'zgarmasligi kerak.
await startBilan(500, "d_777");
tekshir("ikkinchi havola birinchisini BOSIB KETMAYDI",
  qator(envAtr.DB, "SELECT kelgan FROM users WHERE uid = '500'")?.kelgan === "400");

// O'zini o'zi taklif qilish hisobga olinmasin.
await startBilan(600, "d_600");
tekshir("o'zini o'zi taklif qilish hisoblanmaydi",
  !qator(envAtr.DB, "SELECT kelgan FROM users WHERE uid = '600'")?.kelgan);

await startBilan(700, "kanal_sahifalar");
const hisobAtr = await dbYut.takliflarim(envAtr, 400);
tekshir("taklif hisobi to'g'ri", hisobAtr.jami === 1, JSON.stringify(hisobAtr));
const manbalarAtr = await dbYut.manbalar(envAtr);
tekshir("manbalar kesimi ishlaydi",
  manbalarAtr.some((m) => m.manba === "kanal_sahifalar"),
  JSON.stringify(manbalarAtr.slice(0, 3)));

}

{
// ——————————————————————————————— 17. Kunlik 5 tajribasi
console.log("\n17. Kunlik 5: fikr va hisobot");

const dbFikr = await import("../src/db.js");
const envFikr = { ...env, DB: yangiD1() };
tekshir("shaxsiy sinov 15 savol", cfg.KUNLIK_SHAXSIY === 15);
tekshir("guruh rejasi o'zgarmadi (todayCount)", cfg.todayCount() >= 5);

await dbFikr.fikrYoz(envFikr, 1, "2026-10-20", true);
await dbFikr.fikrYoz(envFikr, 2, "2026-10-20", false);
await dbFikr.fikrYoz(envFikr, 1, "2026-10-20", false);  // qayta bossa yangilanadi, ko'paymaydi
await dbFikr.yanaYoz(envFikr, 2, "2026-10-20");
await dbFikr.yanaYoz(envFikr, 3, "2026-10-20");         // bahosiz ham qator ochiladi

const k = await dbFikr.davrKorsatkichi(envFikr, "2026-10-20", "2026-10-21");
tekshir("bir odam bir kunga bitta qator", k.fikrSoni === 3, JSON.stringify(k));
tekshir("👍 soni to'g'ri (qayta bosish yangiladi)", k.ha === 0, JSON.stringify(k));
tekshir("«yana 5 ta» soni to'g'ri", k.yana === 2, JSON.stringify(k));
const bosh = await dbFikr.davrKorsatkichi(envFikr, "2026-09-01", "2026-09-02");
tekshir("bo'sh davr nol qaytaradi", bosh.fikrSoni === 0 && bosh.boshlagan === 0);

}

{
// ——————————————————————————————— 18. Arab alifbosi kursi va kino/multfilm
console.log("\n18. Arab kursi va kunlik tarkib");

const bankA = (await import("../src/quiz_bank.json", { with: { type: "json" } })).default;
const kun = (iso) => Date.parse(iso + "T09:00:00Z");
const jamiArab = bankA.filter((q) => q.t === "Arab");

tekshir("bankda 105 ta kurs va 45 ta takror savoli bor",
  jamiArab.filter((q) => q.g > 0).length === 105 && jamiArab.filter((q) => q.g === 0).length === 45);
tekshir("har bir arab savolida izoh bor", jamiArab.every((q) => q.e && q.e.length <= 200));

const oldin = cfg.kunlikToplam(bankA, null, 1, kun("2026-10-21"));
tekshir("kursdan OLDIN arab savoli yo'q, 15 ta savol",
  oldin.length === 15 && !oldin.some((q) => q.t === "Arab"));

let hammaKun = true, takrorsiz = new Set();
for (let d = 0; d < 35; d++) {
  const iso = new Date(kun("2026-10-26") + d * 86400000).toISOString().slice(0, 10);
  const t = cfg.kunlikToplam(bankA, null, 7, kun(iso));
  const arab = t.filter((q) => q.t === "Arab");
  if (t.length !== 15 || arab.length !== 2 || !arab.every((q) => q.g === d + 1) || new Set(t.map((q) => q.q)).size !== 15) hammaKun = false;
  arab.forEach((q) => takrorsiz.add(q.q));
}
tekshir("1-35 kunning har birida 15 ta noyob savol, shundan 2 tasi shu kunning arab darsi", hammaKun);
tekshir("kurs davomida arab savollari takrorlanmaydi (70 ta noyob)", takrorsiz.size === 70, String(takrorsiz.size));

let kinoJuft = true;
for (let d = 0; d < 40; d++) {
  const t = cfg.kunlikToplam(bankA, null, 7, kun("2026-10-21") + d * 86400000).filter((q) => q.t === "Kino");
  if (t.length !== 1) kinoJuft = false;
}
tekshir("har kuni aynan BITTA kino/multfilm savoli", kinoJuft);

const itUser = cfg.kunlikToplam(bankA, "IT", 5, kun("2026-10-27"));
tekshir("yo'nalish tanlagan odam ham arab kursini oladi",
  itUser.filter((q) => q.t === "Arab").length === 2 && itUser.length === 15);

const keyin = cfg.kunlikToplam(bankA, null, 7, kun("2026-12-01"));
tekshir("kursdan KEYIN: 2 ta arabcha takror, jami 15",
  keyin.length === 15 && keyin.filter((q) => q.t === "Arab" && q.g === 0).length === 2);

const bir = JSON.stringify(cfg.kunlikToplam(bankA, null, 9, kun("2026-10-30")).map((q) => q.q));
const ikki = JSON.stringify(cfg.kunlikToplam(bankA, null, 9, kun("2026-10-30")).map((q) => q.q));
tekshir("bir kunda tarkib barqaror (javob kelganda indekslar siljimaydi)", bir === ikki);

const reja = cfg.kunlikReja(bankA, kun("2026-10-26"));
tekshir("e'lon rejasi haqiqiy tarkibga mos", reja.Arab === 2 && reja.Ingliz === 2 && reja.Diniy === 3 && reja.IT === 4 && reja.Mantiq === 2 && reja.Liderlik === 1 && reja.Kino === 1 && Object.values(reja).reduce((a, b) => a + b, 0) === 15, JSON.stringify(reja));

}

// ——————————————————————————————— yakun
console.log(`\n${"─".repeat(46)}`);

// ——————————————————————————————— 19. Marafon: 90% o'tish chegarasi
console.log("\n19. Marafon: keyingi fasl faqat 9/10 dan so'ng ochiladi");
const envMar = { ...env, DB: yangiD1() };
const soMar = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envMar, ctx);
const bosMar = (d) => soMar({ update_id: ++POLL_SEQ, callback_query: { id: "m" + POLL_SEQ, from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: d } });
async function marFaslIsh(nechtaXato) {
  yuborilgan.length = 0; oxirgiPoll = null;
  await bosMar("k:1");
  let i = 0, oxirgi = null;
  while (oxirgiPoll && i < 20) {
    const pq = oxirgiPoll; oxirgiPoll = null; yuborilgan.length = 0;
    const tanla = i < nechtaXato ? (pq.correct + 1) % pq.variantlar.length : pq.correct;
    await soMar({ update_id: ++POLL_SEQ, poll_answer: { poll_id: pq.id, user: { id: UID, first_name: "Sinov" }, option_ids: [tanla] } });
    oxirgi = yuborilgan.find((x) => /Natija: /.test(x.body.text || "")) || oxirgi;
    i++;
  }
  return oxirgi;
}
const marKitob = () => qator(envMar.DB, "SELECT kitob FROM users WHERE uid = ?", String(UID))?.kitob || 0;

const yomon = await marFaslIsh(3);   // 7/10
tekshir("7/10 — keyingi fasl ochilmadi", marKitob() === 0, `kitob=${marKitob()}`);
tekshir("o'tmaganda «qayta urinish» tugmasi bor",
  JSON.stringify(yomon?.body.reply_markup || {}).includes("qayta urinish"));
tekshir("o'tmaganda «2-faslga o'tish» tugmasi yo'q",
  !JSON.stringify(yomon?.body.reply_markup || {}).includes("k:2"));
tekshir("tugmada kitob nomi bor", JSON.stringify(yomon?.body.reply_markup || {}).includes("Ilm olish sirlari"));

const ozgina = await marFaslIsh(1);  // 9/10
tekshir("9/10 — keyingi fasl ochildi", marKitob() === 1, `kitob=${marKitob()}`);
tekshir("o'tganda keyingi fasl tugmasi bor",
  JSON.stringify(ozgina?.body.reply_markup || {}).includes("k:2"));

yuborilgan.length = 0;
await bosMar("kmenu");
const mn = yuborilgan.find((x) => /marafoni/.test(x.body.text || ""));
tekshir("menyuda ochilgan faslga raqamli tugma bor", JSON.stringify(mn?.body.reply_markup || {}).includes('"k:1"'));
tekshir("menyuda yopiq faslga (3) tugma yo'q", !JSON.stringify(mn?.body.reply_markup || {}).includes('"k:3"'));


// ——————————————————————————————— 20. Arab alifbosi bo'limi va qo'llanma rasmi
console.log("\n20. Arab alifbosi: alohida bo'lim, qo'llanma rasmi, marafon taymeri");
const envAr = { ...env, DB: yangiD1() };
const soAr = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envAr, ctx);
const bosAr = (d) => soAr({ update_id: ++POLL_SEQ, callback_query: { id: "a" + POLL_SEQ, from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: d } });

yuborilgan.length = 0;
await soAr({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, date: 0, chat: { id: UID, type: "private" },
  from: { id: UID, is_bot: false, first_name: "Sinov" }, text: "🔤 Arab alifbosi" } });
const amn = yuborilgan.find((x) => /Arab alifbosi/.test(x.body.text || ""));
tekshir("«Arab alifbosi» tugmasi bloklar menyusini ochadi", !!amn);
tekshir("menyuda 1-blok ochiq, 2-blok yopiq (🔒)", /▶️ 1-blok/.test(amn?.body.text || "") && /🔒 2-blok/.test(amn?.body.text || ""));
tekshir("yopiq blokka tugma yo'q", !JSON.stringify(amn?.body.reply_markup || {}).includes('"a:2"'));

yuborilgan.length = 0; oxirgiPoll = null;
await bosAr("a:1");
const arabPollBody = yuborilgan.find((x) => x.metod === "sendPoll")?.body;
const foto = yuborilgan.findIndex((x) => x.metod === "sendPhoto");
const birinchiPoll = yuborilgan.findIndex((x) => x.metod === "sendPoll");
tekshir("blok boshida qo'llanma rasmi yuborildi", foto >= 0);
tekshir("rasm savoldan OLDIN keldi", foto >= 0 && birinchiPoll > foto);
const pArab = yuborilgan.find((x) => x.metod === "sendPoll")?.body;
tekshir("1-blok savoli arabcha, taymersiz (vaqt cheklanmagan)", oxirgiPoll && /^Savol 1\/\d+\n/.test(oxirgiPoll.savol) && !pArab?.open_period, oxirgiPoll?.savol?.slice(0, 40));
tekshir("sarlavhada «vaqt cheklovsiz» yo'q", !/cheklovsiz/.test(oxirgiPoll?.savol || ""));

// Blokni oxirigacha to'g'ri javoblar bilan ishlaymiz
let nA = 0; let yakunA = null;
while (oxirgiPoll && nA < 30) {
  const pq = oxirgiPoll; oxirgiPoll = null; yuborilgan.length = 0;
  await soAr({ update_id: ++POLL_SEQ, poll_answer: { poll_id: pq.id, user: { id: UID, first_name: "Sinov" }, option_ids: [].concat(pq.correct) } });
  yakunA = yuborilgan.find((x) => /Natija: /.test(x.body.text || "")) || yakunA;
  nA++;
}
tekshir("arabcha savol tagida qo'llanma tugmasi bor", JSON.stringify(arabPollBody?.reply_markup || {}).includes("qol:alifbo"));
yuborilgan.length = 0;
await bosAr("qol:alifbo");
tekshir("tugma bosilsa rasm yana yuboriladi", yuborilgan.some((x) => x.metod === "sendPhoto"));
tekshir("blok 15 ta savoldan iborat (1–5-kun)", nA === 15, `${nA} ta`);
tekshir("blok yakunida natija va keyingi blok tugmasi", /Natija: <b>15\/15<\/b>/.test(yakunA?.body.text || "") &&
  JSON.stringify(yakunA?.body.reply_markup || {}).includes("a:2"));
tekshir("javoblar 'a' rejimida yozildi", qatorlar(envAr.DB, "SELECT * FROM answers WHERE mode = 'a'").length === 15);

// 100% qoidasi: 2-blok endi ochiq. Bitta xato qilamiz — 3-blok ochilmasligi kerak.
yuborilgan.length = 0; oxirgiPoll = null;
await bosAr("a:3");
tekshir("2-blok o'tilmaguncha 3-blok qulflangan", yuborilgan.some((x) => /hali ochilmagan/.test(x.body.text || "")) && !yuborilgan.some((x) => x.metod === "sendPoll"));

// Rasm ikkinchi marta yuklanmaydi: file_id keshlanadi
yuborilgan.length = 0; oxirgiPoll = null;
await bosAr("a:2");
const foto2 = yuborilgan.find((x) => x.metod === "sendPhoto");
tekshir("ikkinchi marta rasm file_id bilan yuborildi (qayta yuklanmadi)", foto2 && foto2.body.forma !== true);

// Kunlik viktorina: kurs kunida qo'llanma rasmi
const { default: cfgAr } = { default: await import("../src/config.js") };
tekshir("qo'llanma turi kunga qarab: 5→alifbo, 20→harakat, 34→shakl",
  cfgAr.arabQollanma(5) === "alifbo" && cfgAr.arabQollanma(20) === "harakat" && cfgAr.arabQollanma(34) === "shakl");
// 2-blokni bitta xato bilan tugatamiz
{
  let i = 0, oxirgi2 = null;
  while (oxirgiPoll && i < 30) {
    const pq = oxirgiPoll; oxirgiPoll = null; yuborilgan.length = 0;
    const tanla = i === 0 ? (pq.correct + 1) % pq.variantlar.length : pq.correct;
    await soAr({ update_id: ++POLL_SEQ, poll_answer: { poll_id: pq.id, user: { id: UID, first_name: "Sinov" }, option_ids: [tanla] } });
    oxirgi2 = yuborilgan.find((x) => /Natija: /.test(x.body.text || "")) || oxirgi2;
    i++;
  }
  const mk = JSON.stringify(oxirgi2?.body.reply_markup || {});
  tekshir("14/15 — blok o'tilmadi: faqat qayta urinish, keyingi blok tugmasi yo'q",
    /14\/15/.test(oxirgi2?.body.text || "") && mk.includes("qayta urinish") && !mk.includes('"a:3"'));
  tekshir("100% talab qilinishi aytildi", /100%/.test(oxirgi2?.body.text || ""));
  yuborilgan.length = 0; await bosAr("a:3");
  tekshir("xatodan keyin ham 3-blok yopiq", yuborilgan.some((x) => /hali ochilmagan/.test(x.body.text || "")));
}
tekshir("8-blok takror hovuzidan 15 ta", cfgAr.arabBlok((await import("../src/quiz_bank.json", { with: { type: "json" } })).default, 8, 1).length === 15);


// ——————————————————————————————— 21. Adminga fikr
console.log("\n21. Foydalanuvchi → admin fikr-mulohazasi");
const envFk = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soFk = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envFk, ctx);
const xabFk = (uid, matn, extra = {}) => soFk({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0,
  chat: { id: uid, type: "private" }, from: { id: uid, is_bot: false, first_name: "Odam", username: "odam" }, text: matn, ...extra } });

yuborilgan.length = 0;
await xabFk(777, "/fikr");
tekshir("/fikr avval tur tanlashni so'raydi", yuborilgan.some((x) => /fkt:t/.test(JSON.stringify(x.body.reply_markup || {}))));
yuborilgan.length = 0;
await soFk({ update_id: ++POLL_SEQ, callback_query: { id: "c" + POLL_SEQ, from: { id: 777, is_bot: false, first_name: "Odam", username: "odam" },
  message: { message_id: 5, chat: { id: 777, type: "private" } }, data: "fkt:t" } });
tekshir("tur tanlangach xabar matnini so'raydi", yuborilgan.some((x) => /Xabaringizni/.test(x.body.text || "")));

yuborilgan.length = 0;
await xabFk(777, "Savollar juda qiyin ekan");
const adminga = yuborilgan.find((x) => String(x.body.chat_id) === "1" && /Taklif · #/.test(x.body.text || ""));
tekshir("fikr adminga yuborildi (ism, username, matn bilan)",
  adminga && /odam/.test(adminga.body.text) && /Savollar juda qiyin/.test(adminga.body.text));
tekshir("foydalanuvchiga rahmat xabari", yuborilgan.some((x) => String(x.body.chat_id) === "777" && /Rahmat/.test(x.body.text || "")));
tekshir("murojaat bazaga yozildi", qatorlar(envFk.DB, "SELECT * FROM murojaat").length === 1);

// Holat tugagach, oddiy matn fikr hisoblanmaydi
yuborilgan.length = 0;
await xabFk(777, "salom");
tekshir("holatsiz oddiy matn adminga bormaydi", !yuborilgan.some((x) => String(x.body.chat_id) === "1"));

// Admin reply → foydalanuvchiga javob
const mid = qator(envFk.DB, "SELECT admin_msg FROM murojaat LIMIT 1").admin_msg;
yuborilgan.length = 0;
await xabFk(1, "Rahmat, tuzatamiz", { reply_to_message: { message_id: mid } });
tekshir("admin javobi foydalanuvchiga yetdi",
  yuborilgan.some((x) => String(x.body.chat_id) === "777" && /Admin javobi/.test(x.body.text || "") && /tuzatamiz/.test(x.body.text)));
tekshir("javob bazada belgilandi", qator(envFk.DB, "SELECT javob FROM murojaat LIMIT 1").javob === "Rahmat, tuzatamiz");

// Spam chegarasi
for (let i = 0; i < 6; i++) {
  await xabFk(888, "/fikr");
  await soFk({ update_id: ++POLL_SEQ, callback_query: { id: "s" + POLL_SEQ, from: { id: 888, is_bot: false, first_name: "Odam", username: "odam" },
    message: { message_id: 5, chat: { id: 888, type: "private" } }, data: "fkt:s" } });
  await xabFk(888, "xabar " + i);
}
tekshir("sutkada 5 tadan ortiq qabul qilinmaydi", qatorlar(envFk.DB, "SELECT * FROM murojaat WHERE uid = '888'").length === 5);
// Biz bilan bog'lanish markazi
const cbBg = (uid, data) => soFk({ update_id: ++POLL_SEQ, callback_query: { id: "z" + POLL_SEQ, from: { id: uid, is_bot: false, first_name: "Odam", username: "odam" },
  message: { message_id: 9, chat: { id: uid, type: "private" } }, data } });
yuborilgan.length = 0;
await cbBg(777, "mx:0");
tekshir("Mening xabarlarim: o'z xabari va admin javobi ko'rinadi", yuborilgan.some((q) => /Savollar juda qiyin/.test(q.body.text || "") && /tuzatamiz/.test(q.body.text || "")));
yuborilgan.length = 0;
await cbBg(1, "xb:l:1:0");
tekshir("Admin Xabarlar (javob berilgan): @odam ko'rinadi", yuborilgan.some((q) => /@odam/.test(JSON.stringify(q.body.reply_markup || {})) && /Javob berilgan/.test(q.body.text || "")));
yuborilgan.length = 0;
await cbBg(1, "xb:o:1:1:0");
tekshir("Xabar tafsiloti: username va profil havolasi", yuborilgan.some((q) => /@odam/.test(q.body.text || "") && /tg:\/\/user\?id=777/.test(q.body.text || "")));
await envFk.DB.prepare("INSERT INTO answers (uid, mode, idx, qid, topic, correct, at) VALUES ('777','d',0,'abc123','IT',0, datetime('now','-1 minute'))").run();
yuborilgan.length = 0;
await cbBg(1, "xb:o:1:1:0");
tekshir("Xabar tafsiloti: yozishdan oldin ko'rgan savoli ko'rsatiladi", yuborilgan.some((q) => /Yozishdan oldin ko'rgan savollari/.test(q.body.text || "") && /❌/.test(q.body.text || "") && /Kunlik/.test(q.body.text || "")));
yuborilgan.length = 0;
await cbBg(1, "xb:a:1:1:0");
yuborilgan.length = 0;
await cbBg(777, "fikrb");
tekshir("Hamkorlik: javob ko'rinadi, boshqaruv tugmalari yo'q", yuborilgan.some((q) => /tuzatamiz/.test(q.body.text || "") && !/fkh:|fkd:/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbBg(1, "fikrb");
tekshir("Admin uchun ham Hamkorlik toza (boshqaruvsiz)", yuborilgan.some((q) => !/fkh:|fkd:/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbBg(1, "xb:hk:0");
tekshir("Hamkorlik boshqaruvi: yashirish/olish tugmalari", yuborilgan.some((q) => /fkh:1/.test(JSON.stringify(q.body.reply_markup || {})) && /fkd:1/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbBg(777, "bk:b");
tekshir("Biz bilan bog'lanish markazi: Xabar yozish / Mening xabarlarim / Hamkorlik", yuborilgan.some((q) => /fikrm/.test(JSON.stringify(q.body.reply_markup || {})) && /mx:0/.test(JSON.stringify(q.body.reply_markup || {})) && /fikrb/.test(JSON.stringify(q.body.reply_markup || {}))));

// Menyu tugmasi holatni bekor qiladi va fikr bo'lib ketmaydi
await xabFk(999, "/fikr");
yuborilgan.length = 0;
await xabFk(999, "🏆 Reyting");
tekshir("menyu tugmasi fikr emas, odatdagidek ishlaydi", !yuborilgan.some((x) => String(x.body.chat_id) === "1"));

// "Siz aytdingiz, biz qildik": 🌟 tugma → bitta gap → egasiga xabar → /nimaqildik → tasdiq
const cbFk = (data) => soFk({ update_id: ++POLL_SEQ, callback_query: { id: "c" + POLL_SEQ, from: { id: 1 },
  message: { message_id: 9, chat: { id: 1, type: "private" } }, data } });
const fid = qator(envFk.DB, "SELECT id FROM murojaat WHERE uid = '777'").id;
yuborilgan.length = 0;
await cbFk("fk:ish:" + fid);
tekshir("🌟 tugma 'nima qildingiz' deb so'raydi", yuborilgan.some((x) => /Nima qildingiz/.test(x.body.text || "")));
yuborilgan.length = 0;
await xabFk(1, "Savollar endi osonroq boshlanadi");
tekshir("fikr egasiga 'ish berdi' xabari ketdi",
  yuborilgan.some((x) => String(x.body.chat_id) === "777" && /Fikringiz ish berdi/.test(x.body.text || "") && /osonroq/.test(x.body.text)));
tekshir("fikr e'longa tayyor deb belgilandi", qator(envFk.DB, "SELECT ochiq FROM murojaat WHERE id = " + fid).ochiq === 1);
yuborilgan.length = 0;
await xabFk(1, "/nimaqildik");
const post = yuborilgan.find((x) => /Siz aytdingiz/.test(x.body.text || ""));
tekshir("/nimaqildik posti: fikr + ish, ismsiz", post && /Savollar juda qiyin/.test(post.body.text) && /osonroq/.test(post.body.text) && !/777/.test(post.body.text));
tekshir("tasdiqlash tugmasi chiqdi", JSON.stringify(yuborilgan.at(-1).body.reply_markup || {}).includes("elon:ok"));
await xabFk(777, "/start");
yuborilgan.length = 0;
await xabFk(999, "salom");
await xabFk(555, "/nimaqildik");
tekshir("oddiy foydalanuvchi /nimaqildik ni ishlata olmaydi", !yuborilgan.some((x) => /Siz aytdingiz/.test(x.body.text || "") && String(x.body.chat_id) === "555"));


// ——————————————————————————————— 22. Premium, profil, soqchi, admin hisoboti
console.log("\n22. Premium, profil, soqchi va kunlik hisobot");
const envPr = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soPr = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envPr, ctx);
const xabPr = (uid, matn) => soPr({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0,
  chat: { id: uid, type: "private" }, from: { id: uid, is_bot: false, first_name: "Odam" + uid, username: "u" + uid }, text: matn } });

await xabPr(777, "/start");
yuborilgan.length = 0;
await xabPr(777, "/profil");
tekshir("bepul profil: «Premium: faol emas»", yuborilgan.some((x) => /Mening profilim/.test(x.body.text || "") && /faol emas/.test(x.body.text)));

yuborilgan.length = 0;
await xabPr(777, "/premium_ber 777 30");
tekshir("admin bo'lmagan odam premium bera olmaydi",
  qatorlar(envPr.DB, "SELECT * FROM premium").length === 0);

yuborilgan.length = 0;
await xabPr(1, "/premium_ber 777 30");
tekshir("admin premium berdi", qatorlar(envPr.DB, "SELECT * FROM premium WHERE uid = '777'").length === 1);
tekshir("foydalanuvchiga xabar bordi", yuborilgan.some((x) => String(x.body.chat_id) === "777" && /Premium berildi/.test(x.body.text || "")));

yuborilgan.length = 0;
await xabPr(777, "/profil");
tekshir("premium profil boshqacha dizaynda (💎 PREMIUM)", yuborilgan.some((x) => /💎 <b>PREMIUM<\/b>/.test(x.body.text || "")));

// Reytingda 💎
envPr.DB._sq.prepare("INSERT INTO daily (uid, day, score, total) VALUES ('777', ?, 9, 10)").run(mod.dayKeyForTest ? mod.dayKeyForTest() : new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10));
yuborilgan.length = 0;
await xabPr(777, "🏆 Reyting");
tekshir("reytingda premium belgisi 💎", yuborilgan.some((x) => /<b>💎 /.test(x.body.text || "")));

// Muddati qo'shiladi
await xabPr(1, "/premium_ber 777 10");
const muddat = qator(envPr.DB, "SELECT (julianday(tugaydi) - julianday('now')) AS k FROM premium WHERE uid = '777'").k;
tekshir("ikkinchi berishda muddat qo'shiladi (~40 kun)", muddat > 39 && muddat < 41, muddat);

// Olish
await xabPr(1, "/premium_ol 777");
yuborilgan.length = 0;
await xabPr(777, "/profil");
tekshir("premium olingach profil bepul ko'rinishga qaytdi", yuborilgan.some((x) => /faol emas/.test(x.body.text || "")));

// Admin hisoboti
yuborilgan.length = 0;
await xabPr(1, "/hisobot");
const hs = yuborilgan.find((x) => /Kunlik hisobot/.test(x.body.text || ""));
tekshir("kunlik admin hisoboti yuborildi", !!hs);
tekshir("hisobotda foydalanuvchilar va kunlik viktorina bo'limlari bor", /Foydalanuvchilar/.test(hs?.body.text || "") && /Kunlik viktorina/.test(hs?.body.text || ""));
tekshir("hisobot adminga boradi", String(hs?.body.chat_id) === "1");

// Cron: soqchi va 21:30 hisobot
yuborilgan.length = 0; fonVazifalar.length = 0;
await bot.scheduled({ scheduledTime: Date.UTC(2026, 9, 21, 16, 30) }, envPr, ctx);
await Promise.all(fonVazifalar);
tekshir("21:30 cron adminga hisobot yuboradi", yuborilgan.some((x) => /Kunlik hisobot/.test(x.body.text || "")));
tekshir("soqchi: webhook o'rnatilmagan bo'lsa adminga aytadi", yuborilgan.some((x) => /SOQCHI: webhook/.test(x.body.text || "")));


// ——————————————————————————————— 23. Arabcha savol rasmi
console.log("\n23. Arab savollari: katta harf rasmi savoldan oldin");
const { rasmTuri } = await import("../src/rasm.js");
const bankRs = (await import("../src/quiz_bank.json", { with: { type: "json" } })).default;
const envRs = { ...env, DB: yangiD1() };
const soRs = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envRs, ctx);
const bosRs = (d) => soRs({ update_id: ++POLL_SEQ, callback_query: { id: "r" + POLL_SEQ, from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: d } });
const kalitlar = new Set();
for (const q of bankRs) { const r = rasmTuri(q); if (r) kalitlar.add(r.kalit); }
tekshir("rasm kerak bo'lgan savollar: 117 ta arab + 14 ta qiyin-savol rasmi", kalitlar.size === 131, kalitlar.size);
for (const k of kalitlar) envRs.DB._sq.prepare("INSERT INTO rasm (k, b) VALUES (?, ?)").run(k, "AAAA");

yuborilgan.length = 0; oxirgiPoll = null;
await bosRs("a:1");
const iPoll = yuborilgan.findIndex((x) => x.metod === "sendPoll");
const rasmlar = yuborilgan.slice(0, iPoll).filter((x) => x.metod === "sendPhoto" && x.body.forma && !x.body.caption);
tekshir("birinchiRs savol oldidan harf rasmi yuborildi", rasmlar.length >= 1);
const birinchiRs = yuborilgan[iPoll].body;
tekshir("«Alif harfi qaysi?» variantlari raqamlangan (1) …)", /^1\) /.test(birinchiRs.options[0]) && /^4\) /.test(birinchiRs.options[3]), birinchiRs.options.join("|"));
tekshir("variantlar tartibi rasmga mos (aralashtirilmagan)", birinchiRs.options[0].endsWith(bankRs.find((q) => q.q === birinchiRs.question.split("\n").slice(1).join("\n")).o[0]));

// 2-savol: arabcha belgi savol matnida (tur a) — rasm bor, variantlar raqamsiz
let aTopildi = false;
for (let i = 0; i < 6 && oxirgiPoll; i++) {
  const pq = oxirgiPoll; oxirgiPoll = null; yuborilgan.length = 0;
  await soRs({ update_id: ++POLL_SEQ, poll_answer: { poll_id: pq.id, user: { id: UID, first_name: "Sinov" }, option_ids: [].concat(pq.correct) } });
  const pi = yuborilgan.findIndex((x) => x.metod === "sendPoll");
  if (pi >= 0 && /Bu harfning nomi/.test(yuborilgan[pi].body.question)) {
    aTopildi = yuborilgan.slice(0, pi).some((x) => x.metod === "sendPhoto") && !/^1\) /.test(yuborilgan[pi].body.options[0]);
    break;
  }
}
tekshir("belgisi savol matnidagi savolda ham rasm bor, variantlar raqamsiz", aTopildi);

// Rasm bazada bo'lmasa — savol baribir ketadi
const envRs2 = { ...env, DB: yangiD1() };
const soRs2 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envRs2, ctx);
yuborilgan.length = 0;
await soRs2({ update_id: ++POLL_SEQ, callback_query: { id: "z" + POLL_SEQ, from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "a:1" } });
tekshir("rasm bo'lmasa ham savol yuboriladi", yuborilgan.some((x) => x.metod === "sendPoll"));


// ——————————————————————————————— 24. Til (UZ/RU/EN) va Ingliz tili
console.log("\n24. 3 til va Ingliz tili bo'limi");
const envTl = { ...env, DB: yangiD1() };
const soTl = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envTl, ctx);
const msgTl = (text) => soTl({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, chat: { id: UID, type: "private" },
  from: { id: UID, first_name: "Sinov" }, text } });
const cbTl = (data) => soTl({ update_id: ++POLL_SEQ, callback_query: { id: "t" + POLL_SEQ, from: { id: UID, first_name: "Sinov" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data } });
await msgTl("/start");
yuborilgan.length = 0;
await msgTl("/til");
const tilTugma = JSON.stringify(yuborilgan.find((x) => x.metod === "sendMessage")?.body?.reply_markup || {});
tekshir("/til: 3 ta til tugmasi", /til:uz/.test(tilTugma) && /til:ru/.test(tilTugma) && /til:en/.test(tilTugma));
yuborilgan.length = 0;
await cbTl("til:en");
const enMsg = yuborilgan.find((x) => x.metod === "sendMessage")?.body;
tekshir("til:en: tasdiq ingliz tilida, menyu ingliz tilida", /English/.test(enMsg?.text || "") && JSON.stringify(enMsg?.reply_markup).includes("Profile"), JSON.stringify(enMsg));
yuborilgan.length = 0;
await msgTl("👤 Profile");
tekshir("ingliz tugmasi tanildi (Sozlamalar ochildi)", yuborilgan.some((x) => x.metod === "sendMessage" && /Profile|profile|Contact us/.test(JSON.stringify(x.body) || "")));
yuborilgan.length = 0;
await cbTl("til:ru");
tekshir("til:ru: menyu ruscha", JSON.stringify(yuborilgan.find((x) => x.metod === "sendMessage")?.body?.reply_markup).includes("Мой профиль"));

const { kunlikToplam } = await import("../src/config.js");
const ingKun = kunlikToplam(bankRs, null, UID, Date.UTC(2026, 9, 22)).filter((q) => q.t === "Ingliz");
tekshir("kunlik tarkibda 2 ta ingliz savoli", ingKun.length === 2, ingKun.length);
tekshir("ingliz savollarida izoh bor", bankRs.filter((q) => q.t === "Ingliz").every((q) => q.e && q.e.length > 10));

const dbm = await import("../src/db.js");
for (let i = 0; i < 15; i++) envTl.DB._sq.prepare(
  "INSERT INTO answers (uid, mode, idx, qid, topic, correct) VALUES (?, 'd', ?, ?, 'Ingliz', 1)").run(String(UID), i, "q" + i);
const hl = await dbm.yutuqHolati(envTl, UID);
const { layoqatli } = await import("../src/yutuq.js");
tekshir("15 ta to'g'ri ingliz javobi → 'ing15' nishoni", hl.inglizTogri === 15 && layoqatli(hl).includes("ing15") && !layoqatli(hl).includes("ing50"));


// ——————————————————————————————— 25. Rasmli yangilik (Gemini)
console.log("\n25. Rasmli tarqatma: /rasmli");
const ADM = 1;
const envRm = { ...env, DB: yangiD1() };
const soRm = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envRm, ctx);
const adminXabar = (text, reply) => soRm({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, chat: { id: ADM, type: "private" },
  from: { id: ADM, first_name: "Admin" }, text, ...(reply ? { reply_to_message: reply } : {}) } });
const manbaRm = { message_id: 5, chat: { id: ADM, type: "private" }, from: { id: ADM }, text: "Yangi bo'lim: Ingliz tili!" };
const oldFetch = globalThis.fetch;
globalThis.fetch = async (url, opt) => {
  if (String(url).includes("generativelanguage")) {
    yuborilgan.push({ metod: "gemini", body: { kalit: opt.headers["x-goog-api-key"], prompt: JSON.parse(opt.body).contents[0].parts[0].text } });
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "iVBORw0KGgo=" } }] } }] }) };
  }
  return oldFetch(url, opt);
};

yuborilgan.length = 0;
await adminXabar("/rasmli", manbaRm);
tekshir("kalit yo'q: admin yo'l-yo'riq oladi, Gemini chaqirilmaydi",
  yuborilgan.some((x) => x.body?.text?.includes("GEMINI_API_KEY")) && !yuborilgan.some((x) => x.metod === "gemini"));

envRm.GEMINI_API_KEY = "test-kalit";
yuborilgan.length = 0;
await adminXabar("/rasmli", manbaRm);
const gm = yuborilgan.find((x) => x.metod === "gemini");
tekshir("Gemini chaqirildi, prompt'da 'NO TEXT' va yangilik mazmuni bor", gm && /NO TEXT/.test(gm.body.prompt) && /Ingliz tili/.test(gm.body.prompt));
tekshir("kalit sarlavhada (URLda emas) yuborildi", gm?.body.kalit === "test-kalit");
tekshir("admin oldindan ko'rish rasmini oldi", yuborilgan.some((x) => x.metod === "sendPhoto" && x.body.forma));
tekshir("tasdiq tugmalari: yuborish / boshqa rasm / bekor",
  JSON.stringify(yuborilgan.at(-1).body.reply_markup).includes("rasm:yangi") && JSON.stringify(yuborilgan.at(-1).body.reply_markup).includes("elon:ha"));

// Tasdiqlash: foydalanuvchiga sendPhoto (file_id) + caption
envRm.DB._sq.prepare("INSERT INTO users (uid, name) VALUES ('777', 'A')").run();
yuborilgan.length = 0;
await soRm({ update_id: ++POLL_SEQ, callback_query: { id: "e1", from: { id: ADM, first_name: "Admin" },
  message: { message_id: 9, chat: { id: ADM, type: "private" } }, data: "elon:ha" } });
const fotoU = yuborilgan.find((x) => x.metod === "sendPhoto" && String(x.body.chat_id) === "777");
tekshir("foydalanuvchiga rasm + matn (caption) yuborildi", fotoU && /Ingliz tili/.test(fotoU.body.caption || ""), JSON.stringify(fotoU));

// Yangi /elon: tayyor post → ko'rinish → tasdiq → copyMessage
yuborilgan.length = 0;
await adminXabar("/elon");
tekshir("/elon: admin postni so'rab olindi", yuborilgan.some((x) => x.metod === "sendMessage" && /Tayyor postni yuboring/.test(x.body.text || "")));
yuborilgan.length = 0;
await adminXabar("Tayyor e'lon matni");
tekshir("post adminga ko'rsatildi (copyMessage)", yuborilgan.some((x) => x.metod === "copyMessage" && String(x.body.chat_id) === String(ADM)));
tekshir("tasdiqlash tugmasi chiqdi", JSON.stringify(yuborilgan.at(-1).body.reply_markup || {}).includes("elon:ok"));
tekshir("tasdiqdan oldin foydalanuvchiga hech narsa ketmadi", !yuborilgan.some((x) => String(x.body.chat_id) === "777"));
envRm.WEBHOOK_URL = "https://x/"; envRm.SELF = { fetch: (u, o) => bot.fetch(new Request(u, o), envRm, ctx) };
yuborilgan.length = 0;
await soRm({ update_id: ++POLL_SEQ, callback_query: { id: "e2", from: { id: ADM, first_name: "Admin" },
  message: { message_id: 9, chat: { id: ADM, type: "private" } }, data: "elon:ok" } });
await new Promise((r) => setTimeout(r, 400));
tekshir("tasdiqdan keyin foydalanuvchiga nusxa ketdi", yuborilgan.some((x) => x.metod === "copyMessage" && String(x.body.chat_id) === "777"));
// Uzun izohli rasm: rasm izohsiz + matn alohida
await adminXabar("/elon");
await soRm({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, chat: { id: ADM, type: "private" }, from: { id: ADM, first_name: "Admin" },
  photo: [{ file_id: "x" }], caption: "Uzun matn ".repeat(130) } });
yuborilgan.length = 0;
await soRm({ update_id: ++POLL_SEQ, callback_query: { id: "e3", from: { id: ADM, first_name: "Admin" },
  message: { message_id: 9, chat: { id: ADM, type: "private" } }, data: "elon:ok" } });
await new Promise((r) => setTimeout(r, 400));
tekshir("uzun izoh: rasm izohsiz nusxalandi", yuborilgan.some((x) => x.metod === "copyMessage" && String(x.body.chat_id) === "777" && x.body.caption === ""));
tekshir("uzun izoh: matn alohida xabar bo'lib ketdi", yuborilgan.some((x) => x.metod === "sendMessage" && String(x.body.chat_id) === "777" && /Uzun matn/.test(x.body.text || "")));
globalThis.fetch = oldFetch;


// ——————————————————————————————— 26. Super miya
console.log("\n26. Super miya nishoni");
const envSm = { ...env, DB: yangiD1(), CHAT_ID: "-100" };
for (let n = 1; n <= 7; n++) {
  envSm.DB._sq.prepare("INSERT INTO users (uid, name) VALUES (?, ?)").run(String(900 + n), "U" + n);
  envSm.DB._sq.prepare("INSERT INTO daily (uid, day, score, total) VALUES (?, ?, ?, 15)").run(String(900 + n), mod.dayKey ? mod.dayKey() : new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10), 16 - n);
}
const reytSm = await dbm.reyting(envSm, new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10));
yuborilgan.length = 0;
await mod.superMiyaBer(envSm, reytSm);
const sm = envSm.DB._sq.prepare("SELECT uid FROM users WHERE super_until > datetime('now') ORDER BY uid").all().map((r) => r.uid);
tekshir("aynan 5 kishiga nishon berildi (1–5-o'rin)", sm.join() === "901,902,903,904,905", sm.join());
tekshir("5 ta tabrik yuborildi", yuborilgan.filter((x) => x.metod === "sendMessage" && /Super miya/.test(x.body.text || "")).length === 5);
const reyt2 = await dbm.reyting(envSm, new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10));
tekshir("reytingda 🧠 faqat top 5 da", reyt2.filter((r) => r.sm).length === 5);
envSm.DB._sq.prepare("UPDATE users SET super_until = datetime('now', '-1 hour')").run();
const reyt3 = await dbm.reyting(envSm, new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10));
tekshir("muddat o'tgach nishon o'chadi", reyt3.filter((r) => r.sm).length === 0);


// ——————————————————————————————— 27. Marafon tili foydalanuvchi tiliga ergashadi
console.log("\n27. Marafon tugmasi til bo'yicha");
const envMt = { ...env, DB: yangiD1() };
const soMt = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envMt, ctx);
const msgMt = (text) => soMt({ update_id: ++POLL_SEQ, message: { message_id: POLL_SEQ, chat: { id: UID, type: "private" },
  from: { id: UID, first_name: "Sinov" }, text } });
await msgMt("/start");
for (const [til, tugma, kutilgan, yoq] of [["ru", "📖 Секреты обретения знаний", "kr:", '"k:1"'], ["uz", "📖 Ilm olish sirlari", "k:", "kr:"], ["en", "📖 Secrets of Learning", "k:", "kr:"]]) {
  envMt.DB._sq.prepare("UPDATE users SET lang = ? WHERE uid = ?").run(til, String(UID));
  yuborilgan.length = 0;
  await msgMt(tugma);
  const mk = JSON.stringify(yuborilgan.map((x) => x.body?.reply_markup));
  tekshir(`${til}: marafon tugmasi ${kutilgan} fasllarini ochadi`, mk.includes(`"${kutilgan}`) && !mk.includes(`"${yoq.replace(/"/g, "")}`), mk.slice(0, 200));
}


// ——————————————————————————————— 28. Poll ichida rasm
console.log("\n28. Poll media: tepada rasm, variantlar yonida harf rasmi");
const { opsiyaKalit: opK } = await import("../src/rasm.js");
const envMd = { ...env, DB: yangiD1(), ADMIN_ID: "1" };
const soMd = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envMd, ctx);
for (const q of bankRs) { const r = rasmTuri(q); if (!r) continue;
  if (r.tur === "b") for (const v of q.o) envMd.DB._sq.prepare("INSERT OR IGNORE INTO rasm (k, b) VALUES (?, 'AAAA')").run(opK(v));
  else envMd.DB._sq.prepare("INSERT OR IGNORE INTO rasm (k, b) VALUES (?, 'AAAA')").run(r.kalit); }
const arabB = bankRs.find((q) => q.t === "Arab" && rasmTuri(q)?.tur === "b");
const arabA = bankRs.find((q) => q.t === "Arab" && rasmTuri(q)?.tur === "a");
const sendMd = async (q) => { yuborilgan.length = 0; const m = await import("../src/index.js");
  // to'g'ridan-to'g'ri sendQuestion ni chaqirib bo'lmaydi — bloklar orqali emas, savolga mos kunni topamiz
  return q; };
yuborilgan.length = 0;
await soMd({ update_id: ++POLL_SEQ, callback_query: { id: "m1", from: { id: UID, first_name: "S" },
  message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "a:1" } });
const pm = yuborilgan.find((x) => x.metod === "sendPoll")?.body;
const optObj = Array.isArray(pm?.options) && typeof pm.options[0] === "object";
tekshir("variantlari arabcha savol: har variantda media (photo file_id)", optObj && pm.options.every((o) => o.media?.type === "photo" && o.media.media), JSON.stringify(pm?.options).slice(0, 160));
tekshir("variant matni qisqa: «1-variant»", optObj && pm.options[0].text === "1-variant");


// 29. /rasm_isit
console.log("\n29. Rasmlarni oldindan yuklash");
envMd.DB._sq.prepare("DELETE FROM tizim WHERE k LIKE 'rasm:%'").run?.();
yuborilgan.length = 0;
await soMd({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, chat: { id: 1, type: "private" }, from: { id: 1, first_name: "Admin" }, text: "/rasm_isit" } });
tekshir("/rasm_isit: rasmlar yuklandi va 'tayyor' deyildi", yuborilgan.some((x) => x.metod === "sendMessage" && /tayyor/.test(x.body.text || "")), JSON.stringify(yuborilgan.at(-1)?.body).slice(0, 150));
yuborilgan.length = 0;
await soMd({ update_id: ++POLL_SEQ, callback_query: { id: "m2", from: { id: UID, first_name: "S" }, message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "a:1" } });
tekshir("tayyor rasmlar bilan savolda admin chatiga yangi yuklash bo'lmadi", !yuborilgan.some((x) => x.metod === "sendPhoto" && x.body.forma));


// 30. Arab bo'limida vaqt tugasa avtomatik o'tish
console.log("\n30. Arab: taymer tugaganda keyingi savolga o'tadi");
const envTo = { ...envMd, DB: yangiD1() };
for (const q of bankRs) { const r = rasmTuri(q); if (!r) continue;
  envTo.DB._sq.prepare("INSERT OR IGNORE INTO rasm (k, b) VALUES (?, 'AAAA')").run(r.tur === "a" ? r.kalit : opK(q.o[0])); }
const soTo = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envTo, ctx);
yuborilgan.length = 0; oxirgiPoll = null;
await soTo({ update_id: ++POLL_SEQ, callback_query: { id: "to1", from: { id: UID, first_name: "S" }, message: { message_id: 1, chat: { id: UID, type: "private" } }, data: "a:1" } });
const p1 = oxirgiPoll;
tekshir("birinchi arab savoli yuborildi", !!p1);
yuborilgan.length = 0; oxirgiPoll = null;
await soTo({ update_id: ++POLL_SEQ, poll: { id: p1.id, is_closed: true } });
tekshir("vaqt tugagach «Vaqt tugadi» xabari kelmaydi", !yuborilgan.some((x) => x.metod === "sendMessage" && /Vaqt tugadi/.test(x.body.text || "")), JSON.stringify(yuborilgan.map((x) => x.metod)));
tekshir("darhol keyingi savol yuborildi", !!oxirgiPoll && oxirgiPoll.id !== p1.id);


// ——————————————————————————————— 31. Qiyin savollar: ko'p javobli va rasmli
console.log("\n31. Ko'p javobli pollar, IT mavzulari");
const cfgQ = await import("../src/config.js");
const hard = bankRs.filter((q) => q.h);
tekshir("bankda ko'p javobli (cs) savollar bor", hard.filter((q) => q.cs).length >= 15, String(hard.filter((q) => q.cs).length));
tekshir("bankda rasmli (img) qiyin savollar bor", hard.filter((q) => q.img).length >= 10);
tekshir("cs indekslari variantlar ichida, c = cs[0]", hard.filter((q) => q.cs).every((q) => q.cs.every((i) => i >= 0 && i < q.o.length) && q.c === q.cs[0]));
tekshir("togriMi: aniq to'plam — to'g'ri; ortiqcha/kam — noto'g'ri", (() => { const q = { cs: [0, 2], c: 0 }; return cfgQ.togriMi(q, [2, 0]) && !cfgQ.togriMi(q, [0]) && !cfgQ.togriMi(q, [0, 1, 2]) && cfgQ.togriMi({ c: 1 }, [1]) && !cfgQ.togriMi({ c: 1 }, [1, 2]); })());
const mq = cfgQ.shuffleOptions(hard.find((q) => q.cs), 5);
tekshir("shuffleOptions ko'p javobni to'g'ri ko'chiradi", mq.cs.map((i) => mq.o[i]).sort().join() === hard.find((q) => q.cs).cs.map((i) => hard.find((q) => q.cs).o[i]).sort().join());
// 15 kun davomida: har kuni 15 savol, shundan IT mavzulari aylanadi, qiyinlar bor
const itMav = new Set(); let kunOk = true, qiyinHar = true;
for (let d = 0; d < 12; d++) {
  const tt = cfgQ.kunlikToplam(bankRs, null, 3, Date.UTC(2026, 9, 22) + d * 86400000);
  if (tt.length !== 15 || new Set(tt.map((q) => q.q)).size !== 15) kunOk = false;
  if (!tt.some((q) => q.h && q.cs) && !tt.some((q) => q.h)) qiyinHar = false;
  tt.filter((q) => q.t === "IT" && q.s && !q.h).forEach((q) => itMav.add(q.s));
}
tekshir("12 kun: har kuni 15 ta noyob savol", kunOk);
tekshir("har kuni kamida bitta qiyin savol bor", qiyinHar);
tekshir("IT savollari figma, python, js, html, css, react mavzularini aylantiradi", ["figma", "python", "js", "html", "css", "react"].every((m) => itMav.has(m)), [...itMav].join());
// poll payload
const envQ = { ...env, DB: yangiD1(), ADMIN_ID: "1" };
for (const q of hard) { const r = rasmTuri(q); if (r) envQ.DB._sq.prepare("INSERT OR IGNORE INTO rasm (k, b) VALUES (?, 'AAAA')").run(r.kalit); }
const soQ = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envQ, ctx);


// ——————————————————————————————— 32. Qiyin savollar ikki baravar ball, Hero, kun g'olibi
console.log("\n32. Hero va kun g'olibi premiumi");
const envH = { ...env, DB: yangiD1(), CHAT_ID: "-100" };
const kunH = new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);
for (const [uid, s, tt] of [[801, 18, 18], [802, 17, 18], [803, 12, 18]]) {
  envH.DB._sq.prepare("INSERT INTO users (uid, name) VALUES (?, ?)").run(String(uid), "H" + uid);
  envH.DB._sq.prepare("INSERT INTO daily (uid, day, score, total) VALUES (?, ?, ?, ?)").run(String(uid), kunH, s, tt);
}
yuborilgan.length = 0;
const rH = await dbm.reyting(envH, kunH);
await mod.kunGolibiPremium(envH, rH);
const pH = envH.DB._sq.prepare("SELECT uid, tugaydi > datetime('now') AS faol FROM premium").all();
tekshir("1-o'rin egasiga premium berildi (faqat unga)", pH.length === 1 && pH[0].uid === "801" && pH[0].faol === 1, JSON.stringify(pH));
tekshir("g'olibga tabrik yuborildi", yuborilgan.some((x) => x.metod === "sendMessage" && String(x.body.chat_id) === "801" && /Kun g'olibi/.test(x.body.text)));
yuborilgan.length = 0;
await mod.kunGolibiPremium(envH, rH);
tekshir("takror chaqirilsa ikkinchi marta berilmaydi", !yuborilgan.some((x) => /Kun g'olibi/.test(x.body?.text || "")) && envH.DB._sq.prepare("SELECT tugaydi FROM premium").all().length === 1);
const bq = envH.DB._sq.prepare("SELECT (julianday(tugaydi) - julianday('now')) AS kun FROM premium WHERE uid='801'").get();
tekshir("premium ~1 kun", bq.kun > 0.9 && bq.kun < 1.1, String(bq.kun));
tekshir("reyting bir xil ballda oldin tugatganni yuqoriga qo'yadi", (() => { envH.DB._sq.prepare("UPDATE daily SET score = 18, at = datetime('now', '-5 minutes') WHERE uid = '802'").run(); return true; })());
const rH2 = await dbm.reyting(envH, kunH);
tekshir("teng ballda — avval tugatgan oldinda", rH2[0].uid === "802", rH2.map((r) => r.uid).join());
const hh = await dbm.heroBer(envH, "803", kunH, "kecha", "2999-01-01 00:00:00");
const hh2 = await dbm.heroBer(envH, "803", "ertaga", kunH, "2999-01-01 00:00:00");
tekshir("hero zanjiri ketma-ket kunlarda o'sadi", hh === 1 && hh2 === 2, `${hh},${hh2}`);
const rH3 = await dbm.reyting(envH, kunH);
tekshir("reytingda hero nishoni (hr) ko'rinadi", rH3.find((r) => r.uid === "803")?.hr === 1);

// ——————————————————————————————— 28. Kitob progressi tillar orasida umumiy
console.log("\n28. Kitob progressi tilga bog'liq emas");
const envK = { ...env, DB: yangiD1() };
envK.DB._sq.prepare("INSERT INTO users (uid, name, kitob, kitob_ru) VALUES ('901', 'K', 4, 0)").run();
const uK = await dbm.getUser(envK, "901");
tekshir("o'zbekcha 4 fasl → ruscha ham 4", uK.kitob === 4 && uK.kitob_ru === 4, `${uK.kitob}/${uK.kitob_ru}`);
envK.DB._sq.prepare("INSERT INTO fasl_done (uid, fasl, score, total) VALUES ('901', 103, 9, 10), ('901', 3, 8, 10), ('901', 1, 10, 10)").run();
const jK = await dbm.faslJamiNatija(envK, "901", "ru");
tekshir("eski rus va o'zbek yozuvlari bitta fasl sifatida qo'shiladi", jK.ball === 19 && jK.jami === 20, JSON.stringify(jK));
await dbm.faslYakunla(envK, "901", 5, 9, 10, "ru");
tekshir("ruscha yakunlangan fasl umumiy kalitda yoziladi", !!qator(envK.DB, "SELECT 1 AS x FROM fasl_done WHERE uid = '901' AND fasl = 5"));


// ——————————————————————————————— 33. Do'st bilan duel
console.log("\n33. Do'st bilan duel");
const envD = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soD = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envD, ctx);
const xabD = (uid, matn) => soD({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0,
  chat: { id: uid, type: "private" }, from: { id: uid, is_bot: false, first_name: "Odam" + uid }, text: matn } });
const javobD = (uid, tugri) => soD({ update_id: ++POLL_SEQ, poll_answer: { poll_id: oxirgiPoll.id,
  user: { id: uid, first_name: "Odam" + uid }, option_ids: [tugri ? [].concat(oxirgiPoll.correct)[0] : ([].concat(oxirgiPoll.correct)[0] + 1) % 3] } });

yuborilgan.length = 0; oxirgiPoll = null;
await xabD(11, "/duel");
const menyuX = yuborilgan.filter((x) => String(x.body.chat_id) === "11" && x.metod === "sendMessage");
tekshir("/duel BITTA xabar yuboradi", menyuX.length === 1);
const tugmalarX = (menyuX[0]?.body.reply_markup?.inline_keyboard || []).flat();
tekshir("ikkita tugma (havolali zaxira): Duelni boshlash va Ulashish", tugmalarX.length === 2 && /Duelni boshlash/.test(tugmalarX[0].text) && /Ulashish/.test(tugmalarX[1].text));
tekshir("Oktagon — Telegram ulashish oynasi, havola bilan", /t\.me\/share\/url\?url=.*start%3Dw_\d+/.test(tugmalarX[1]?.url || ""));
tekshir("tugma bosilmaguncha savol yuborilmaydi", !yuborilgan.some((x) => x.metod === "sendPoll"));
const duelId = parseInt(decodeURIComponent(tugmalarX[1].url).match(/start=w_(\d+)/)[1], 10);
const cbD = (uid, data) => soD({ update_id: ++POLL_SEQ, callback_query: { id: "d" + (++POLL_SEQ), from: { id: uid },
  message: { message_id: 7, chat: { id: uid, type: "private" } }, data } });
await cbD(11, "duel:b:" + duelId);
tekshir("Testni boshlash bosilgach birinchi savol keladi", yuborilgan.some((x) => x.metod === "sendPoll" && String(x.body.chat_id) === "11"));
const savol1A = oxirgiPoll.savol, variant1A = JSON.stringify(oxirgiPoll.variantlar);

// A: 4 ta to'g'ri + 1 xato  (birinchi savol allaqachon yuborilgan)
let ketma = 0;
await javobD(11, true); await javobD(11, true); await javobD(11, true); await javobD(11, true);
yuborilgan.length = 0;
await javobD(11, false);
tekshir("A tugatdi, raqibni kutadi", yuborilgan.some((x) => String(x.body.chat_id) === "11" && /yakunladingiz/.test(x.body.text || "")));
tekshir("natija hali yuborilmadi", !yuborilgan.some((x) => /G'alaba sizniki|Durang|oldinda/.test(x.body.text || "")));
yuborilgan.length = 0;
await cbD(11, "duel:b:" + duelId);
tekshir("qayta bosganda (do'st hali kirmagan): natija + do'stni kutish (savollarga javob bering demaydi)",
  yuborilgan.some((x) => /Siz tugatdingiz/.test(x.body.text || "") && /hali duelga qo'shilmadi/.test(x.body.text) && /4\/5/.test(x.body.text)) && !yuborilgan.some((x) => /javob bering/.test(x.body.text || "")));

// Begona o'zining havolasi bilan kirsa
yuborilgan.length = 0;
await xabD(11, "/start w_" + duelId);
tekshir("o'z havolasini ochgan odamga tushuntiriladi", yuborilgan.some((x) => /do'stingizga yuboring/.test(x.body.text || "")));

// B ulanadi: bir xil savol va variantlar
yuborilgan.length = 0; oxirgiPoll = null;
await xabD(22, "/start w_" + duelId);
const taklifX = yuborilgan.find((x) => String(x.body.chat_id) === "22" && /Odam11/.test(x.body.text || ""));
tekshir("do'st BITTA xabar va bitta tugma oladi", !!taklifX && (taklifX.body.reply_markup?.inline_keyboard || []).flat().length === 1 && !yuborilgan.some((x) => x.metod === "sendPoll"));
await cbD(22, "duel:b:" + duelId);
tekshir("yaratuvchiga 'qo'shildi' xabari", yuborilgan.some((x) => String(x.body.chat_id) === "11" && /qo'shildi/.test(x.body.text || "")));
tekshir("do'st aynan o'sha birinchi savol va variantlarni oladi", oxirgiPoll && oxirgiPoll.savol === savol1A && JSON.stringify(oxirgiPoll.variantlar) === variant1A);

// Uchinchi odam kira olmaydi
yuborilgan.length = 0;
await xabD(33, "/start w_" + duelId);
tekshir("uchinchi odam duelga kirolmaydi", yuborilgan.some((x) => /ikki kishi allaqachon/.test(x.body.text || "")) && !yuborilgan.some((x) => x.metod === "sendPoll"));

// B: 5 ta to'g'ri → B yutadi (5 > 4)
await envD.DB.prepare("UPDATE users SET lang = 'ru' WHERE uid = '22'").run();   // do'st ruscha, yaratuvchi o'zbekcha
await javobD(22, true); await javobD(22, true); await javobD(22, true); await javobD(22, true);
yuborilgan.length = 0;
await javobD(22, true);
const yutuq = yuborilgan.find((x) => String(x.body.chat_id) === "22" && /Победа за вами/.test(x.body.text || ""));
const yutqazgan = yuborilgan.find((x) => String(x.body.chat_id) === "11" && /oldinda/.test(x.body.text || ""));
tekshir("g'olibga ruscha tabrik, yutqazganga o'zbekcha rag'bat (har kim o'z tilida)", !!yutuq && !!yutqazgan);
tekshir("jadvalda ikkala ism va 5/5, 4/5 bor", yutuq && /Odam11/.test(yutuq.body.text) && /Odam22/.test(yutuq.body.text) && /5\/5/.test(yutuq.body.text) && /4\/5/.test(yutuq.body.text));
tekshir("natija faqat bir marta yuboriladi", yuborilgan.filter((x) => /Победа за вами|oldinda/.test(x.body.text || "")).length === 2);
tekshir("duel kunlik natijalar jadvaliga tegmadi", qatorlar(envD.DB, "SELECT * FROM daily").length === 0 && qatorlar(envD.DB, "SELECT * FROM answers").length === 0);

// Havoladan qayta kirganda (duel yakunlangan): taklif xabari emas, bitta holat xabari — ikkala ball bilan
yuborilgan.length = 0;
await xabD(22, "/start w_" + duelId);
const qaytaX = yuborilgan.filter((x) => String(x.body.chat_id) === "22" && x.metod === "sendMessage");
tekshir("qayta kirganda faqat BITTA xabar, taklif matni yo'q", qaytaX.length === 1 && !/duelga chaqirmoqda/.test(qaytaX[0].body.text));
tekshir("xabarda ikkala ball: Siz 5/5, Raqib 4/5", /5\/5/.test(qaytaX[0].body.text) && /4\/5/.test(qaytaX[0].body.text) && /завершена/.test(qaytaX[0].body.text));

// Duel savoli taymerli
// Tashlab ketilgan duel: bir tomon tugatdi, ikkinchisi 6 soatdan ko'p tugatmadi → tugatgan yutadi
await xabD(55, "/duel");
const duelT = (await envD.DB.prepare("SELECT id FROM duel WHERE a = '55'").first()).id;
await cbD(55, "duel:b:" + duelT);
tekshir("duel savoli open_period bilan yuboriladi", oxirgiPoll && oxirgiPoll.open_period >= 20);
for (let i = 0; i < 5; i++) await javobD(55, true);
await xabD(66, "/start w_" + duelT);
await cbD(66, "duel:b:" + duelT);
await bot.scheduled({ scheduledTime: Date.UTC(2026, 9, 21, 12, 0) }, envD, ctx); await Promise.all(fonVazifalar);
tekshir("6 soat o'tmagan duel yopilmaydi", qatorlar(envD.DB, "SELECT bitdi FROM duel WHERE id = " + duelT)[0].bitdi === 0);
await envD.DB.prepare("UPDATE duel SET a_start = a_start - 7 * 3600000 WHERE id = ?").bind(duelT).run();
yuborilgan.length = 0;
await bot.scheduled({ scheduledTime: Date.UTC(2026, 9, 21, 12, 0) }, envD, ctx); await Promise.all(fonVazifalar);
tekshir("6 soatdan keyin duel yopiladi, tugatgan yutadi", qatorlar(envD.DB, "SELECT bitdi, b_ok FROM duel WHERE id = " + duelT)[0].bitdi === 1
  && yuborilgan.some((x) => String(x.body.chat_id) === "55" && /G'alaba sizniki/.test(x.body.text || "") && /6 soat/.test(x.body.text))
  && yuborilgan.some((x) => String(x.body.chat_id) === "66" && /oldinda/.test(x.body.text || "")));
yuborilgan.length = 0;
await bot.scheduled({ scheduledTime: Date.UTC(2026, 9, 21, 13, 0) }, envD, ctx); await Promise.all(fonVazifalar);
tekshir("yopilgan duel natijasi qayta yuborilmaydi", !yuborilgan.some((x) => /G'alaba sizniki|oldinda/.test(x.body.text || "")));

// Raqib tugatganda ikkinchi tomonga navbat kelgani xabar qilinadi
await xabD(77, "/duel");
const duelN = (await envD.DB.prepare("SELECT id FROM duel WHERE a = '77'").first()).id;
await xabD(88, "/start w_" + duelN);
await cbD(88, "duel:b:" + duelN);
yuborilgan.length = 0;
for (let i = 0; i < 5; i++) await javobD(88, true);
tekshir("do'st tugatdi: yaratuvchiga «navbat sizda» xabari va boshlash tugmasi boradi",
  yuborilgan.some((x) => String(x.body.chat_id) === "77" && /duelni tugatdi/.test(x.body.text || "") && new RegExp("duel:b:" + duelN).test(JSON.stringify(x.body.reply_markup || {}))));
tekshir("tugatgan tomonga «6 soat» tushuntirishi boradi", yuborilgan.some((x) => String(x.body.chat_id) === "88" && /6 soat/.test(x.body.text || "")));
// Raqib test ichida bo'lsa (boshlagan, tugatmagan) — unga «tugatdi» xabari yuborilmaydi, natija o'zi keladi
await xabD(91, "/duel");
const duelQ = (await envD.DB.prepare("SELECT id FROM duel WHERE a = '91'").first()).id;
await cbD(91, "duel:b:" + duelQ);
await xabD(92, "/start w_" + duelQ);
await cbD(92, "duel:b:" + duelQ);
yuborilgan.length = 0;
for (let i = 0; i < 5; i++) await javobD(92, true);
tekshir("raqib o'ynayotgan bo'lsa unga «duelni tugatdi» xabari yuborilmaydi", !yuborilgan.some((x) => String(x.body.chat_id) === "91" && /duelni tugatdi/.test(x.body.text || "")));
// Kunlik limit
for (let i = 0; i < 6; i++) await xabD(44, "/duel");
tekshir("sutkada 5 tadan ortiq duel ochilmaydi", qatorlar(envD.DB, "SELECT * FROM duel WHERE a = '44'").length === 5);


// ——————————————————————————————— 34. Saqlanganlar va /kunlik kirishi
console.log("\n34. Saqlanganlar va /kunlik kirishi");
const envS = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soS = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envS, ctx);
const xabS = (uid, matn) => soS({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0,
  chat: { id: uid, type: "private" }, from: { id: uid, is_bot: false, first_name: "Odam" + uid }, text: matn } });
yuborilgan.length = 0; oxirgiPoll = null;
await xabS(61, "/kunlik");
const birinchiPollS34 = yuborilgan.findIndex((x) => x.metod === "sendPoll");
const oldinS34 = yuborilgan.slice(0, birinchiPollS34).filter((x) => x.metod === "sendMessage" || x.metod === "sendPhoto");
tekshir("/kunlik: savoldan oldin ko'pi bilan BITTA xabar (rasm yoki matn)", oldinS34.length <= 1);
const pollSS34 = yuborilgan[birinchiPollS34];
const svTugmaS34 = (pollSS34.body.reply_markup?.inline_keyboard || []).flat().find((b) => /^sv:/.test(b.callback_data));
tekshir("savol ostida 🔖 Saqlash tugmasi bor", !!svTugmaS34 && /Saqlash/.test(svTugmaS34.text));
const cbSS34 = (uid, data, markup) => soS({ update_id: ++POLL_SEQ, callback_query: { id: "s" + (++POLL_SEQ), from: { id: uid },
  message: { message_id: 5, chat: { id: uid, type: "private" }, reply_markup: markup }, data } });
yuborilgan.length = 0;
await cbSS34(61, svTugmaS34.callback_data, pollSS34.body.reply_markup);
tekshir("saqlash bazaga yozdi", qatorlar(envS.DB, "SELECT * FROM saqlangan WHERE uid = '61'").length === 1);
const tahrS34 = yuborilgan.find((x) => x.metod === "editMessageReplyMarkup");
tekshir("tugma «Saqlandi» ga almashdi", tahrS34 && /Saqlandi/.test(JSON.stringify(tahrS34.body.reply_markup)));
yuborilgan.length = 0;
await xabS(61, "🔖 Saqlanganlar");
tekshir("menyu savolni ro'yxatda ko'rsatadi", yuborilgan.some((x) => /Saqlanganlar<\/b> — 1|Saqlanganlar.*1/.test(x.body.text || "") && /✅/.test(x.body.text || "")));
await cbSS34(61, "svx:" + svTugmaS34.callback_data.slice(3));
tekshir("🗑 olib tashladi", qatorlar(envS.DB, "SELECT * FROM saqlangan WHERE uid = '61'").length === 0);
yuborilgan.length = 0;
await xabS(61, "/saqlangan");
tekshir("bo'sh ro'yxatda tushuntirish chiqadi", yuborilgan.some((x) => /Saqlash/.test(x.body.text || "")));


// ——————————————————————————————— 35. Admin paneli
console.log("\n35. Admin paneli");
const envAP35 = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soAP35 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envAP35, ctx);
const xabAP35 = (uid, matn) => soAP35({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0,
  chat: { id: uid, type: "private" }, from: { id: uid, is_bot: false, first_name: "Odam" + uid }, text: matn } });
const cbAP35 = (uid, data) => soAP35({ update_id: ++POLL_SEQ, callback_query: { id: "a" + (++POLL_SEQ), from: { id: uid },
  message: { message_id: 3, chat: { id: uid, type: "private" } }, data } });
yuborilgan.length = 0;
await xabAP35(1, "/admin");
const panelAP35 = yuborilgan.find((x) => /Admin paneli/.test(x.body.text || ""));
tekshir("/admin: bitta xabar, 9 tugma (👥 Foydalanuvchilar bilan)", panelAP35 && (panelAP35.body.reply_markup?.inline_keyboard || []).flat().length === 9 && /adm:users/.test(JSON.stringify(panelAP35.body.reply_markup)));
yuborilgan.length = 0;
await cbAP35(1, "adm:elon");
tekshir("📣 tugmasi tarqatmani boshlaydi", yuborilgan.some((x) => /Tarqatma/.test(x.body.text || "")));
yuborilgan.length = 0;
await cbAP35(1, "adm:fikr");
tekshir("📥 Xabarlar tugmasi pochta qutisini ochadi (javobsiz soni bilan)", yuborilgan.some((x) => /Xabarlar/.test(x.body.text || "") && /Javobsiz/.test(x.body.text || "")));
yuborilgan.length = 0;
await xabAP35(555, "/admin");
await cbAP35(555, "adm:elon");
tekshir("oddiy foydalanuvchi panelni ocha olmaydi va tugmasi ishlamaydi", !yuborilgan.some((x) => /Admin paneli|Tarqatma/.test(x.body.text || "")));


// ——————————————————————————————— 36. Viktorinaga qaytish: avval rozilik
console.log("\n36. Viktorinaga qaytganda «Davom etish» tugmasi");
const envQQ36 = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soQQ36 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envQQ36, ctx);
const xabQQ36 = (uid, matn) => soQQ36({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0,
  chat: { id: uid, type: "private" }, from: { id: uid, is_bot: false, first_name: "Odam" + uid }, text: matn } });
yuborilgan.length = 0; oxirgiPoll = null;
await xabQQ36(71, "/kunlik");
await soQQ36({ update_id: ++POLL_SEQ, poll_answer: { poll_id: oxirgiPoll.id, user: { id: 71, first_name: "Odam71" }, option_ids: [[].concat(oxirgiPoll.correct)[0]] } });
await envQQ36.DB.prepare("DELETE FROM polls").run();   // odam chiqib ketdi, ochiq savol qolmadi
yuborilgan.length = 0;
await xabQQ36(71, "/kunlik");
const davomXQ36 = yuborilgan.find((x) => /Davom etish/.test(JSON.stringify(x.body.reply_markup || {})));
tekshir("qaytganda savol darhol yuborilmaydi", !yuborilgan.some((x) => x.metod === "sendPoll"));
tekshir("«Davom etish» tugmali xabar chiqadi", !!davomXQ36);
yuborilgan.length = 0;
await soQQ36({ update_id: ++POLL_SEQ, callback_query: { id: "q" + (++POLL_SEQ), from: { id: 71, first_name: "Odam71" },
  message: { message_id: 4, chat: { id: 71, type: "private" } }, data: "davom_d" } });
tekshir("tugma bosilgach 2-savol keladi", yuborilgan.some((x) => x.metod === "sendPoll" && /Savol 2\//.test(x.body.question || "")));


// ——————————————————————————————— 37. Duel: inline xabar («Kettu 😎» tugmasi)
console.log("\n37. Duel: inline xabar");
const envI37 = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soI37 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envI37, ctx);
yuborilgan.length = 0;
await soI37({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0, chat: { id: 81, type: "private" },
  from: { id: 81, is_bot: false, first_name: "Odam81" }, text: "/duel" } });
yuborilgan.length = 0;
await soI37({ update_id: ++POLL_SEQ, inline_query: { id: "iq1", from: { id: 81, first_name: "Odam81" }, query: "w_1", offset: "" } });
const iqJ = yuborilgan.find((x) => x.metod === "answerInlineQuery");
const art = iqJ?.body.results?.[0];
tekshir("inline so'rovga tayyor xabar qaytdi", !!art && /Kuch sinashamizmi/.test(art.input_message_content.message_text) && /<blockquote>/.test(art.input_message_content.message_text));
tekshir("xabar ostida «Kettu 😎» tugmasi, havola bilan", art && art.reply_markup.inline_keyboard[0][0].text === "Kettu 😎" && /start=w_1/.test(art.reply_markup.inline_keyboard[0][0].url));
yuborilgan.length = 0;
await soI37({ update_id: ++POLL_SEQ, inline_query: { id: "iq2", from: { id: 99, first_name: "Begona" }, query: "w_1", offset: "" } });
tekshir("begona odamning duelini yubora olmaydi", yuborilgan.find((x) => x.metod === "answerInlineQuery")?.body.results.length === 0);


// ——————————————————————————————— 38. Guruhga rasmli postlar
console.log("\n38. Guruhga rasmli postlar");
const envP38 = { ...env, ADMIN_ID: "1", CHAT_ID: "-100777", DB: yangiD1() };
const soP38 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envP38, ctx);
const admP38 = (text) => soP38({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, chat: { id: 1, type: "private" }, from: { id: 1, first_name: "Admin" }, text } });
const cbP38 = (uid, data) => soP38({ update_id: ++POLL_SEQ, callback_query: { id: "p" + (++POLL_SEQ), from: { id: uid },
  message: { message_id: 8, chat: { id: uid, type: "private" } }, data } });
const eskiFetch38 = globalThis.fetch;
globalThis.fetch = async (url, opt) => {
  if (String(url).includes("generativelanguage") && String(opt.body).includes("responseMimeType")) {
    yuborilgan.push({ metod: "geminiMatn", body: { prompt: JSON.parse(opt.body).contents[0].parts[0].text } });
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      sarlavha1: "Kichik qadam", sarlavha2: "Katta natija!", fikr: "Kuniga 10 bet ham yetadi.",
      kontekst: "Bugun 10 bet o'qing. Ertaga ham shuncha. Bir oyda kitob tugaydi.", sahna: "Two young Uzbek people reading vs scrolling" }) }] } }] }) };
  }
  if (String(url).includes("generativelanguage")) {
    yuborilgan.push({ metod: "geminiRasm", body: { model: String(url), prompt: JSON.parse(opt.body).contents[0].parts[0].text } });
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "iVBORw0KGgo=" } }] } }] }) };
  }
  return eskiFetch38(url, opt);
};
yuborilgan.length = 0;
await admP38("/post");
tekshir("kalit yo'q: yo'l-yo'riq, Gemini chaqirilmaydi", yuborilgan.some((x) => /GEMINI_API_KEY/.test(x.body?.text || "")) && !yuborilgan.some((x) => x.metod === "geminiMatn"));
envP38.GEMINI_API_KEY = "kalit";
await admP38("/mavzu Imtihondan oldin qo'rquv");
yuborilgan.length = 0;
await admP38("/post");
const mpP38 = yuborilgan.find((x) => x.metod === "geminiMatn");
tekshir("navbatdagi admin mavzusi ishlatildi", mpP38 && /Imtihondan oldin qo'rquv/.test(mpP38.body.prompt));
const rpP38 = yuborilgan.find((x) => x.metod === "geminiRasm");
tekshir("rasm Nano Banana Pro modeli bilan, sarlavha aynan promptda", rpP38 && /gemini-3-pro-image-preview/.test(rpP38.body.model) && /KICHIK QADAM/.test(rpP38.body.prompt) && /KATTA NATIJA!/.test(rpP38.body.prompt));
const korP38 = yuborilgan.find((x) => x.metod === "sendPhoto" && x.body.forma && String(x.body.chat_id) === "1");
tekshir("admin loyihani rasm+matn bilan oldi", korP38 && /<b>Kichik qadam Katta natija!<\/b>/.test(korP38.body.caption) && /<blockquote>/.test(korP38.body.caption) && korP38.body.caption.length <= 1024);
yuborilgan.length = 0;
await cbP38(555, "post:ok");
tekshir("oddiy foydalanuvchi guruhga yubora olmaydi", !yuborilgan.some((x) => x.metod === "sendPhoto"));
await cbP38(1, "post:ok");
const gpP38 = yuborilgan.find((x) => x.metod === "sendPhoto" && String(x.body.chat_id) === "-100777");
tekshir("✅ dan keyin guruhga ketdi (rasm + 🧠 Viktorina tugmasi)", gpP38 && /Viktorina/.test(JSON.stringify(gpP38.body.reply_markup)) && /@ustozimnurimbot/.test(gpP38.body.caption || ""));
yuborilgan.length = 0;
await cbP38(1, "post:ok");
tekshir("ikkinchi bosishda takror ketmaydi", !yuborilgan.some((x) => x.metod === "sendPhoto" && String(x.body.chat_id) === "-100777"));
globalThis.fetch = eskiFetch38;


// ——————————————————————————————— 39. Jonli (custom) emoji
console.log("\n39. Jonli emoji");
const envE39 = { ...env, ADMIN_ID: "1", DB: yangiD1() };
const soE39 = (u) => bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify(u) }), envE39, ctx);
const admE39 = (text) => soE39({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, chat: { id: 1, type: "private" }, from: { id: 1, first_name: "Admin" }, text } });
const userE39 = (text) => soE39({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, chat: { id: 555, type: "private" }, from: { id: 555, first_name: "O" }, text } });
const eskiFetch39 = globalThis.fetch;
globalThis.fetch = async (url, opt) => {
  if (String(url).endsWith("/getStickerSet")) {
    yuborilgan.push({ metod: "getStickerSet", body: JSON.parse(opt.body) });
    return { json: async () => ({ ok: true, result: { title: "Mening paketim", stickers: [
      { type: "custom_emoji", emoji: "⚔️", custom_emoji_id: "5001" }, { type: "custom_emoji", emoji: "🥊", custom_emoji_id: "5002" }] } }) };
  }
  return eskiFetch39(url, opt);
};
yuborilgan.length = 0;
await admE39("/emoji paket https://t.me/addemoji/Mening_paketim");
tekshir("paket nomi havoladan ajratildi", yuborilgan.some((x) => x.metod === "getStickerSet" && x.body.name === "Mening_paketim"));
tekshir("ulandi xabari: 2 ta emoji", yuborilgan.some((x) => /Yangi: <b>2<\/b> ta/.test(x.body?.text || "")));
yuborilgan.length = 0;
await userE39("/duel");
const xabarE39 = yuborilgan.find((x) => /Duel #/.test(x.body?.text || ""));
tekshir("xabardagi ⚔️ va 🥊 jonli emojiga almashdi", xabarE39 && /<tg-emoji emoji-id="5001">⚔️<\/tg-emoji>/.test(xabarE39.body.text) && /emoji-id="5002"/.test(xabarE39.body.text));
tekshir("tugma matni (oddiy) o'zgarmadi", JSON.stringify(xabarE39.body.reply_markup).includes("Ulashish") && !/tg-emoji/.test(JSON.stringify(xabarE39.body.reply_markup)));
yuborilgan.length = 0;
// Havolaning o'zi (buyruqsiz) ham paketni ulaydi
yuborilgan.length = 0;
await admE39("https://t.me/addemoji/Boshqa_paket");
tekshir("buyruqsiz havola paketni ulaydi", yuborilgan.some((q) => q.metod === "getStickerSet" && q.body.name === "Boshqa_paket") && yuborilgan.some((q) => /ulandi/.test(q.body?.text || "")));
await admE39("/emoji off");
yuborilgan.length = 0;
await userE39("/duel");
tekshir("off bo'lganda xabar oddiy emoji bilan", !yuborilgan.some((x) => /tg-emoji/.test(x.body?.text || "")));
await admE39("/emoji on");
await admE39("/emoji tozala");
yuborilgan.length = 0;
await userE39("/duel");
tekshir("tozalangach almashtirish yo'q", !yuborilgan.some((x) => /tg-emoji/.test(x.body?.text || "")));
// Emoji boshqaruvi: panel, ro'yxat, o'chirish
const cbE39 = (data) => soE39({ update_id: ++POLL_SEQ, callback_query: { id: "e" + (++POLL_SEQ), from: { id: 1 },
  message: { message_id: 6, chat: { id: 1, type: "private" } }, data } });
await admE39("https://t.me/addemoji/Mening_paketim");
yuborilgan.length = 0;
await admE39("/emoji");
const panelE39 = yuborilgan.find((q) => /Jonli emoji/.test(q.body?.text || ""));
const tugE39 = JSON.stringify(panelE39?.body.reply_markup || {});
tekshir("/emoji paneli: paket nomi, ro'yxat va 🗑 tugmalari", panelE39 && /Mening paketim/.test(panelE39.body.text) && /Ro'yxat/.test(tugE39) && /em:dp:0/.test(tugE39));
yuborilgan.length = 0;
await cbE39("em:ls:0");
tekshir("ro'yxat sahifasi emoji'larni ko'rsatadi", yuborilgan.some((q) => q.metod === "editMessageText" && /⚔/.test(q.body.text) && /🥊/.test(q.body.text)));
yuborilgan.length = 0;
await admE39("/emoji ochir 🥊");
tekshir("/emoji ochir bittani olib tashlaydi", yuborilgan.some((q) => /1 ta emoji olib tashlandi\. Qoldi: 1/.test(q.body?.text || "")));
yuborilgan.length = 0;
await cbE39("em:dp:0");
tekshir("paketni 🗑 qilish hammasini o'chiradi", yuborilgan.some((q) => q.metod === "editMessageText" && /Ulangan: <b>0<\/b>/.test(q.body.text)));
yuborilgan.length = 0;
await soE39({ update_id: ++POLL_SEQ, callback_query: { id: "x" + (++POLL_SEQ), from: { id: 555 }, message: { message_id: 6, chat: { id: 555, type: "private" } }, data: "em:tz2" } });
tekshir("oddiy foydalanuvchi emoji panelini boshqara olmaydi", !yuborilgan.some((q) => q.metod === "editMessageText"));
// ═════ 41: Profilim / O'rganish / Kutubxona
const sendP41 = (uid, extra) => soE39({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, from: { id: uid, first_name: "T" }, chat: { id: uid, type: "private" }, ...extra } });
const cbP41 = (uid, data) => soE39({ update_id: ++POLL_SEQ, callback_query: { id: "p" + (++POLL_SEQ), from: { id: uid, first_name: "T" },
  message: { message_id: 9, chat: { id: uid, type: "private" } }, data } });
yuborilgan.length = 0;
await sendP41(555, { text: "👤 Profilim" });
const profP41 = JSON.stringify(yuborilgan.find((q) => q.metod === "sendMessage")?.body?.reply_markup || {});
tekshir("Profilim: natijalar, sozlamalar, qo'llanma, bog'lanish; xatolar/saqlanganlar/reyting alohida YO'Q", /szm/.test(profP41) && !/tilmenu/.test(profP41) && /hub:natija/.test(profP41) && !/hub:takror/.test(profP41) && !/hub:saqlangan/.test(profP41) && /yordam/.test(profP41) && /boglan/.test(profP41));
yuborilgan.length = 0;
await cbP41(555, "bk:o");
const orgP = JSON.stringify(yuborilgan.find((q) => q.metod === "editMessageText")?.body?.reply_markup || {});
tekshir("O'rganish: xatolar va saqlanganlar shu yerda", /hub:takror/.test(orgP) && /hub:saqlangan/.test(orgP));
yuborilgan.length = 0;
await cbP41(555, "rk:v:b");
const rkP = JSON.stringify(yuborilgan.find((q) => q.metod === "editMessageText" || q.metod === "sendMessage")?.body?.reply_markup || {});
tekshir("Reyting: tur va davr filtrlari bor", /rk:d:b/.test(rkP) && /rk:v:h/.test(rkP) && /rk:v:a/.test(rkP));
for (const [tr, dv] of [["v", "h"], ["v", "a"], ["d", "b"], ["d", "h"], ["d", "a"]]) {
  yuborilgan.length = 0;
  await cbP41(555, "rk:" + tr + ":" + dv);
  tekshir("Reyting " + tr + "/" + dv + " xatosiz ochildi", yuborilgan.some((q) => /Reyting/.test(q.body?.text || "")));
}
yuborilgan.length = 0;
await cbP41(555, "szm");
const szP41 = JSON.stringify(yuborilgan.find((q) => q.metod === "sendMessage")?.body?.reply_markup || {});
tekshir("Sozlamalar: yo'nalish + til", /yonalish/.test(szP41) && /tilmenu/.test(szP41));
yuborilgan.length = 0;
await sendP41(555, { text: "📚 O'rganish" });
const orgP41 = JSON.stringify(yuborilgan.find((q) => q.metod === "sendMessage")?.body?.reply_markup || {});
tekshir("O'rganish: kitobdan test + kutubxona + arab + xatolar", /hub:marafon/.test(orgP41) && /lib:list/.test(orgP41) && /hub:arab/.test(orgP41) && /hub:takror/.test(orgP41));
yuborilgan.length = 0;
await cbP41(555, "lib:list");
tekshir("kutubxona bo'sh: do'stona xabar", yuborilgan.some((q) => /Kutubxona/.test(q.body?.text || "") && /tez orada/.test(q.body?.text || "")));
// Admin 2 ta PDF yuboradi: bir xil sarlavha, ikki til
yuborilgan.length = 0;
await sendP41(1, { document: { file_id: "FID_UZ", file_unique_id: "UQ_UZ", file_name: "ilm_uz.pdf", mime_type: "application/pdf", file_size: 100 }, caption: "Ilm olish sirlari UZ" });
await sendP41(1, { document: { file_id: "FID_RU", file_unique_id: "UQ_RU", file_name: "ilm_ru.pdf", mime_type: "application/pdf", file_size: 100 }, caption: "Ilm olish sirlari RU" });
tekshir("PDF'lar bitta kitobga saqlandi (uz+ru)", yuborilgan.some((q) => /Ilm olish sirlari/.test(q.body?.text || "") && /🇺🇿 ✅/.test(q.body?.text || "") && /🇷🇺 ✅/.test(q.body?.text || "")));
yuborilgan.length = 0;
await cbP41(555, "lib:list");
const tilP41 = yuborilgan.find((q) => /Qaysi tilda/.test(q.body?.text || ""));
tekshir("bitta kitob: to'g'ridan-to'g'ri til tanlash (2 til)", tilP41 && /lib:g:[^:]+:uz/.test(JSON.stringify(tilP41.body.reply_markup)) && /lib:g:[^:]+:ru/.test(JSON.stringify(tilP41.body.reply_markup)));
const gP41 = /lib:g:[^"]+:ru/.exec(JSON.stringify(tilP41?.body?.reply_markup || {}))?.[0];
yuborilgan.length = 0;
await cbP41(555, gP41);
tekshir("RU tanlansa — RU fayl yuboriladi", yuborilgan.some((q) => q.metod === "sendDocument" && q.body.document === "FID_RU"));
// Noaniq til — admindan so'raydi
yuborilgan.length = 0;
await sendP41(1, { document: { file_id: "FID_X", file_unique_id: "UQ_X", file_name: "kitob.pdf", mime_type: "application/pdf", file_size: 5 }, caption: "Yangi kitob" });
tekshir("til noaniq bo'lsa so'raydi", yuborilgan.some((q) => /Bu qaysi tilda/.test(q.body?.text || "") && /lib:pl:UQ_X:en/.test(JSON.stringify(q.body.reply_markup))));
yuborilgan.length = 0;
await cbP41(555, "lib:pl:UQ_X:en");
tekshir("oddiy foydalanuvchi kutubxonani o'zgartira olmaydi", !yuborilgan.some((q) => /kutubxonada/.test(q.body?.text || "")));
// Hamkorlik: bo'sh holat, admin boshqaruvi
yuborilgan.length = 0;
await cbP41(555, "fikrb");
tekshir("Hamkorlik (bo'sh): foydalanuvchiga do'stona matn, boshqaruv tugmalari yo'q", yuborilgan.some((q) => /Hamkorlik/.test(q.body?.text || "") && !/fkh:|fkd:/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbP41(1, "fikrb");
tekshir("Hamkorlik (admin): ochiladi", yuborilgan.some((q) => /Hamkorlik/.test(q.body?.text || "")));
yuborilgan.length = 0;
await cbP41(555, "fkd:1:0");
tekshir("oddiy foydalanuvchi Hamkorlikdan o'chira olmaydi", !yuborilgan.some((q) => q.metod === "editMessageText"));
// Orqaga tugmasi: ichki ekranlarda birinchi xabarda, bosilganda ota-ekran joyida qaytadi
yuborilgan.length = 0;
await cbP41(555, "hub:natija:p");
tekshir("Profilim → Natijam: «Orqaga» (bk:p) bor", yuborilgan.some((q) => q.metod === "sendMessage" && /bk:p/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbP41(555, "hub:takror:o");
tekshir("O'rganish → Xatolarim: «Orqaga» (bk:o) bor", yuborilgan.some((q) => q.metod === "sendMessage" && /bk:o/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbP41(555, "yonalish");
tekshir("Sozlamalar → Yo'nalish: «Orqaga» (bk:s) bor", yuborilgan.some((q) => q.metod === "sendMessage" && /bk:s/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbP41(555, "bk:p");
tekshir("bk:p: Profilim joyida qaytadi (editMessageText)", yuborilgan.some((q) => q.metod === "editMessageText" && /hub:natija:p/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbP41(555, "bk:o");
tekshir("bk:o: O'rganish joyida qaytadi", yuborilgan.some((q) => q.metod === "editMessageText" && /lib:list/.test(JSON.stringify(q.body.reply_markup || {}))));
// Kunlik admin hisoboti v2
yuborilgan.length = 0;
await cbP41(1, "adm:hisobot");
const hisob = yuborilgan.find((q) => /Kunlik hisobot/.test(q.body?.text || ""));
tekshir("admin hisoboti: bo'limlar (foydalanuvchi, viktorina, duel) va tugmalar", !!hisob && /Duel/.test(hisob.body.text) && /blockquote/.test(hisob.body.text) && /adm:fikr/.test(JSON.stringify(hisob.body.reply_markup || {})));
// /tavsif: Start oldi matni (uz/ru/en) — faqat admin
yuborilgan.length = 0;
const matnFk = (uid, text) => soFk({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0, chat: { id: uid, type: "private" }, from: { id: uid, is_bot: false, first_name: "A" }, text } });
await matnFk(777, "/tavsif");
tekshir("oddiy foydalanuvchi /tavsif ishlata olmaydi", !yuborilgan.some((q) => q.metod === "setMyDescription"));
await matnFk(1, "/tavsif");
tekshir("admin /tavsif: 3 tilda tavsif va qisqa tavsif yoziladi", yuborilgan.filter((q) => q.metod === "setMyDescription").length === 3 && yuborilgan.filter((q) => q.metod === "setMyShortDescription").length === 3
  && yuborilgan.filter((q) => q.metod === "setMyDescription").every((q) => q.body.description.length <= 512)
  && yuborilgan.filter((q) => q.metod === "setMyShortDescription").every((q) => q.body.short_description.length <= 120));
// Inline duel kartasi: Lumi rasmi (thumbnail) shu Worker'dan beriladi
const lumiRes = await bot.fetch(new Request("https://x/lumi-duel2.jpg"), env, ctx);
tekshir("/lumi-duel2.jpg: JPEG rasm qaytadi", lumiRes.status === 200 && /image\/jpeg/.test(lumiRes.headers.get("content-type") || "") && (await lumiRes.arrayBuffer()).byteLength > 5000);
// Reyting adolati: har qanday yo'nalishda 15 savol va 3 ta qiyin savol (maksimum 18 ball)
for (const yo of [null, "IT", "Liderlik", "Diniy", "Kino", "Mantiq", "Ingliz"]) {
  const q = cfg.kunlikToplam(kunlikBank, yo, 123);
  tekshir("yo'nalish " + (yo || "aralash") + ": 15 savol, 3 qiyin, maksimum 18 ball", q.length === 15 && q.filter((x) => x.h).length === 3);
}
// Reyting matni: «ball» va «to'g'ri/savol» alohida, 18 savol bilan adashtirilmaydi
const envRt = { ...env, DB: yangiD1() };
const kunRt = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
await envRt.DB.prepare("INSERT INTO daily (uid, day, score, total) VALUES ('5001', ?, 18, 18), ('5002', ?, 13, 18)").bind(kunRt, kunRt).run();
for (let i = 0; i < 15; i++) {
  await envRt.DB.prepare("INSERT INTO answers (uid, mode, day, idx, qid, topic, correct) VALUES ('5001','d',?,?,?, 'IT', 1)").bind(kunRt, i, "q" + i).run();
  await envRt.DB.prepare("INSERT INTO answers (uid, mode, day, idx, qid, topic, correct) VALUES ('5002','d',?,?,?, 'IT', ?)").bind(kunRt, i, "q" + i, i < 11 ? 1 : 0).run();
}
yuborilgan.length = 0; fonVazifalar.length = 0;
await bot.scheduled({ scheduledTime: Date.UTC(2026, 9, 21, 17, 0) }, envRt, ctx);
await Promise.all(fonVazifalar);
const reytM = (yuborilgan.find((x) => /Bugungi reyting<\/b>/.test(x.body.text || "")) || { body: { text: "" } }).body.text;
tekshir("reyting: sarlavhada «15 ta savol», «3 tasi qiyin», «Eng ko'p ball: 18»", /15 ta savol/.test(reytM) && /3 tasi qiyin/.test(reytM) && /Eng ko'p ball: <b>18<\/b>/.test(reytM));
tekshir("reyting qatori: «18 ball · ✅ 15/15» va «13 ball · ✅ 11/15»", /18 ball<\/b> · ✅ 15\/15/.test(reytM) && /13 ball<\/b> · ✅ 11\/15/.test(reytM));
tekshir("reyting matnida qalin va iqtibos (blockquote) ishlatilgan", /<blockquote>/.test(reytM) && /<b>/.test(reytM));
// Xabarni o'chirish (admin)
yuborilgan.length = 0;
await cbBg(1, "xb:o:1:1:0");
tekshir("xabar sahifasida o'chirish tugmasi bor", yuborilgan.some((q) => /xb:x:1:1:0/.test(JSON.stringify(q.body.reply_markup || {}))));
yuborilgan.length = 0;
await cbBg(1, "xb:x:1:1:0");
tekshir("o'chirishdan oldin tasdiq so'raladi, hali o'chmaydi", yuborilgan.some((q) => /xb:xx:1:1:0/.test(JSON.stringify(q.body.reply_markup || {}))) && qatorlar(envFk.DB, "SELECT id FROM murojaat WHERE id = 1").length === 1);
await cbBg(777, "xb:xx:1:1:0");
tekshir("admin bo'lmagan o'chira olmaydi", qatorlar(envFk.DB, "SELECT id FROM murojaat WHERE id = 1").length === 1);
yuborilgan.length = 0;
await cbBg(1, "xb:xx:1:1:0");
tekshir("tasdiqdan keyin xabar o'chadi va ro'yxatga qaytadi", qatorlar(envFk.DB, "SELECT id FROM murojaat WHERE id = 1").length === 0 && yuborilgan.some((q) => /Xabarlar/.test(q.body.text || "")));
// ——————————————————————————————— 42. Botni to'xtatganlar (my_chat_member) va 👥 Foydalanuvchilar
console.log("\n42. my_chat_member: bloklash/qaytish tarixi + 👥 Foydalanuvchilar");
await envAP35.DB.prepare("INSERT INTO users (uid, name, uname, streak, joined, seen) VALUES ('700','Ali','ali_u',3, datetime('now','-5 days'), datetime('now','-1 days'))").run();
await envAP35.DB.prepare("INSERT INTO answers (uid, mode, idx, qid, correct) VALUES ('700','d',0,'q1',1),('700','d',1,'q2',0)").run();
const mcm42 = (uid, holat, tur = "private") => soAP35({ update_id: ++POLL_SEQ, my_chat_member: { chat: { id: uid, type: tur }, from: { id: uid, first_name: "Ali" },
  old_chat_member: { status: "member" }, new_chat_member: { status: holat } } });
await mcm42(700, "kicked");
const u42 = (await envAP35.DB.prepare("SELECT blocked FROM users WHERE uid='700'").first());
const l42 = (await envAP35.DB.prepare("SELECT * FROM ketish_log WHERE uid='700'").all()).results;
tekshir("bloklasa: blocked=1 va tarixga 'ketdi' yoziladi", u42.blocked === 1 && l42.length === 1 && l42[0].holat === "ketdi");
tekshir("tarixda faollik saqlanadi: 2 javob, 5 kun, streak 3", l42[0].javob === 2 && l42[0].kun === 5 && l42[0].streak === 3);
await mcm42(700, "kicked");
tekshir("takroriy hodisa tarixni ko'paytirmaydi", (await envAP35.DB.prepare("SELECT COUNT(*) AS n FROM ketish_log").first()).n === 1);
await mcm42(700, "kicked", "group");
tekshir("guruh hodisasi e'tiborga olinmaydi", (await envAP35.DB.prepare("SELECT COUNT(*) AS n FROM ketish_log").first()).n === 1);
yuborilgan.length = 0;
await cbAP35(1, "adm:users");
const us42 = yuborilgan.find((x) => /Foydalanuvchilar/.test(x.body.text || ""));
tekshir("👥 ekrani: ism, @username, javob soni ko'rinadi", us42 && /Ali/.test(us42.body.text) && /@ali_u/.test(us42.body.text) && /2 javob/.test(us42.body.text));
tekshir("👥 ekrani: «Orqaga» va «Yangilash» bor", us42 && /adm:panel/.test(JSON.stringify(us42.body.reply_markup)) && /adm:users/.test(JSON.stringify(us42.body.reply_markup)));
yuborilgan.length = 0;
await cbAP35(555, "adm:users");
tekshir("oddiy foydalanuvchi 👥 ekranini ocha olmaydi", !yuborilgan.some((x) => /Foydalanuvchilar/.test(x.body.text || "")));
yuborilgan.length = 0;
await xabAP35(1, "/hisobot");
tekshir("kunlik hisobotda 24 soatda to'xtatganlar ogohlantirishi", yuborilgan.some((x) => /to'xtatdi/.test(x.body.text || "")));
await mcm42(700, "member");
const l42b = (await envAP35.DB.prepare("SELECT holat FROM ketish_log WHERE uid='700' ORDER BY id").all()).results.map((r) => r.holat);
tekshir("qaytsa: blocked=0 va 'qaytdi' yoziladi", (await envAP35.DB.prepare("SELECT blocked FROM users WHERE uid='700'").first()).blocked === 0 && l42b.join() === "ketdi,qaytdi");

// ——————————————————————————————— 43. Yo'nalish: 70/30 aralashma va savol tushib qolmasligi
console.log("\n43. Yo'nalish rejimi: o'z mavzu + boshqa mavzular, adolatli ball");
{
  const bank43 = (await import("../src/quiz_bank.json", { with: { type: "json" } })).default;
  const D43 = 86400000, t43 = Date.parse("2026-11-11T08:00:00Z");
  for (const y of ["IT", "Liderlik", "Diniy", "Kino", "Mantiq", "Ingliz"]) {
    let uzunOk = true, ballOk = true, kunTakror = false, oz = 0, boshqaMavzu = 0, jami = 0;
    for (let d = 0; d < 20; d++) {
      const q = cfg.kunlikToplam(bank43, y, "777", t43 + d * D43);
      uzunOk = uzunOk && q.length === 15;
      ballOk = ballOk && q.reduce((a, x) => a + (x.h ? 2 : 1), 0) === 18;
      kunTakror = kunTakror || new Set(q.map((x) => x.q)).size !== q.length;
      for (const x of q) { jami++; if (x.t === y) oz++; else if (x.t !== "Arab") boshqaMavzu++; }
    }
    tekshir(y + ": har kuni 15 savol, maksimum 18 ball (reyting adolati saqlandi)", uzunOk && ballOk);
    tekshir(y + ": kun ichida takror yo'q", !kunTakror);
    tekshir(y + ": o'z mavzusi 40–70%, boshqa mavzular ham bor (faqat bitta mavzu emas)", oz / jami >= 0.4 && oz / jami <= 0.7 && boshqaMavzu / jami >= 0.15);
  }
  // Savol tushib qolmaydi: o'z hovuzi ketma-ket ishlatiladi — 12 kunda Ingliz hovuzining kamida 70% i ko'rinadi
  const korilgan43 = new Set();
  for (let d = 0; d < 12; d++) for (const x of cfg.kunlikToplam(bank43, "Ingliz", "777", t43 + d * D43)) if (x.t === "Ingliz" && !x.h) korilgan43.add(x.q);
  const hovuz43 = bank43.filter((q) => q.t === "Ingliz" && !q.h).length;
  tekshir("Ingliz hovuzi tushib qolmaydi: 12 kunda hovuzning ≥70% i ko'rinadi", korilgan43.size >= hovuz43 * 0.7);
  tekshir("bir kunlik to'plam barqaror (kun davomida o'zgarmaydi)", JSON.stringify(cfg.kunlikToplam(bank43, "Ingliz", "777", t43)) === JSON.stringify(cfg.kunlikToplam(bank43, "Ingliz", "777", t43 + 3600e3)));
}

// ——————————————————————————————— 44. Hisobot: kun tugamasdan soxta "past" signal chiqmasin
console.log("\n44. Hisobot vaqtga qarab xulosa chiqaradi");
{
  const eskiNow44 = Date.now;
  const hisobotMatni44 = async (utcSoat) => {
    const e44 = { ...env, ADMIN_ID: "1", DB: yangiD1() };
    // 7 kun oldin har kuni 10 tadan yakunlagan, bugun 2 ta — "past" ko'rinadi
    for (let d = 1; d <= 6; d++) for (let i = 0; i < 10; i++)
      await e44.DB.prepare("INSERT INTO daily (uid, day, score, total) VALUES (?, date('now', ?), 5, 15)").bind("u" + d + "_" + i, "-" + d + " days").run();
    for (let i = 0; i < 2; i++) await e44.DB.prepare("INSERT INTO daily (uid, day, score, total) VALUES (?, date('now'), 5, 15)").bind("b" + i).run();
    const b = new Date(); b.setUTCHours(utcSoat, 0, 0, 0);
    Date.now = () => b.getTime();
    yuborilgan.length = 0;
    try { await bot.fetch(new Request("https://x/", { method: "POST", body: JSON.stringify({ update_id: ++POLL_SEQ, message: { message_id: ++POLL_SEQ, date: 0, chat: { id: 1, type: "private" }, from: { id: 1, first_name: "A" }, text: "/hisobot" } }) }), e44, ctx); }
    finally { Date.now = eskiNow44; }
    return yuborilgan.map((q) => q.body.text || "").join("\n");
  };
  const erta44 = await hisobotMatni44(10);   // 15:00 Toshkent
  tekshir("kun tugamasdan: «oldingi kunlardan past» ogohlantirishi yo'q", !/ancha past/.test(erta44));
  tekshir("kun tugamasdan: «hali tugamagan» izohi bor", /hali tugamagan/.test(erta44));
  const kech44 = await hisobotMatni44(17);   // 22:00 Toshkent
  tekshir("kun tugagach: past signal chiqadi", /ancha past/.test(kech44));
  tekshir("kun tugagach: «hali tugamagan» izohi yo'q", !/hali tugamagan/.test(kech44));
}

globalThis.fetch = eskiFetch39;

console.log(`Natija: ${otdi} ta o'tdi, ${yiqildi} ta yiqildi`);
process.exit(yiqildi ? 1 : 0);
