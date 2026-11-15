/**
 * Ustozim Nurim — universal viktorina boti (Cloudflare Worker).
 *
 * REJIMLAR
 *  1) Kunlik viktorina — hamma bir kunda bir xil savollarni oladi (musobaqa).
 *     Faqat shu rejimda savolga vaqt chegarasi bor.
 *  2) Kitob marafoni  — «Ilm olish sirlari» bo'yicha 14 bosqich, vaqt cheklovsiz.
 *  3) O'z tezligimda  — bazadan 5 tadan mashq, vaqt cheklovsiz.
 *
 * IMKONIYATLAR
 *  - Menyu (doimiy klaviatura)
 *  - Natijalarim: umumiy ball, foiz, streak, mavzular kesimida
 *  - Reyting: to'liq ro'yxat, har kimning o'rni ko'rinadi
 *  - Streak (ketma-ket kunlar)
 *  - Cron: 20:00 guruhga e'lon, 21:00 eslatma, 22:00 guruhga reyting
 *  - Admin: /stats /sozla /sinov /reset
 *
 * VAQT MINTAQASI
 *  Barcha kunlik kalitlar Toshkent vaqti (UTC+5) bo'yicha hisoblanadi.
 *
 * ARXITEKTURA IZOHI
 *  Cloudflare KV "eventually consistent" — yozilgan qiymat darhol o'qilmasligi mumkin.
 *  Shuning uchun "nechanchi savoldaman" degan holat hisoblagichdan EMAS,
 *  poll_id → savol indeksi bog'lanishidan olinadi. Bu viktorinaning
 *  yarim yo'lda qotib qolishini oldini oladi.
 */

import bankXom from "./quiz_bank.json";

/**
 * Ko'p javobli (checkbox) savollar o'chirilgan: ba'zi Telegram mijozlarida
 * variant belgilangach «Ovoz berish» tugmasi ko'rinmaydi va javob hech qachon yuborilmaydi.
 * Shuning uchun bunday savol bitta to'g'ri javobli ko'rinishga keltiriladi:
 * to'g'ri variantlardan faqat birinchisi qoladi, qolganlari olib tashlanadi.
 * Qayta yoqish uchun KOP_JAVOB = true.
 */
const KOP_JAVOB = false;
function birJavobli(q) {
  if (KOP_JAVOB || !Array.isArray(q.cs) || q.cs.length < 2) return q;
  const asosiy = q.cs[0];
  const qoladi = q.o.map((v, i) => ({ v, i })).filter((x) => x.i === asosiy || !q.cs.includes(x.i));
  const { cs, ...qolgan } = q;
  const matn = q.q.replace(/\s*\(hammasini belgilang\)/i, "").trim()
    .replace(/^Qaysi gaplarda\b/, "Qaysi gapda").replace(/^Qaysi gaplar\b/, "Qaysi gap")
    .replace(/^Qaysi so'zlar\b/, "Qaysi so'z").replace(/^Qaysi fe'llarning\b/, "Qaysi fe'lning")
    .replace(/^Qaysilari\b/, "Qaysi biri");
  return { ...qolgan, q: matn + "\n(bitta to'g'ri javobni tanlang)",
    o: qoladi.map((x) => x.v), c: qoladi.findIndex((x) => x.i === asosiy) };
}
const bank = bankXom.map(birJavobli);
import { togriMi, pickToday, pickTodayFor, todayCount, dayIndex, shuffleOptions, planFor, YONALISHLAR, KUNLIK_SHAXSIY, kunlikToplam, kunlikReja, arabDars, ARAB_KUNLAR, ARAB_BLOKLAR, arabBlok, arabQollanma } from "./config.js";
import { QOLLANMA } from "./qollanma.js";
import { rasmTuri, opsiyaKalit } from "./rasm.js";
import {
  KITOB_JAMI, KITOB_BATCH, faslQuestions, faslLabel, faslMeta,
  faslSavolSoni, kitobJamiSavol, turLabel, progressBar, kitobBankRoyxat,
  faslSarlavha, faslTayyorRu,
} from "./kitob.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { t, menyu, AMAL } from "./matn.js";
import { tilBilan, joriyTil, TILLAR, TIL_NOMI } from "./lang.js";
import { YUTUQLAR, yutuqTop, layoqatli, yNom, yIzoh } from "./yutuq.js";

/**
 * Telegram buyruqlar ro'yxati.
 *
 * NEGA KONSTANTA: bu ro'yxat ikki joyda — /sozla buyrug'ida va
 * /setup marshrutida — nusxalangan edi. Birini yangilab ikkinchisini
 * unutish muqarrar: ular bir-biridan uzoqda turadi va farq faqat
 * foydalanuvchi eski buyruqni ko'rganda sezildi.
 *
 * Tartib ham ma'noli: "bugun" birinchi, chunki buyruqlar ro'yxati —
 * bu ham interfeys, va u ham bitta asosiy harakatdan boshlanishi kerak.
 */
const BUYRUQLAR = [
  { command: "yordam", description: "Bot qanday ishlaydi" },
];
import * as db from "./db.js";
import { INTRO_JPG } from "./intro.js";
import { LUMI_THUMB_JPG } from "./lumi_thumb.js";

/**
 * Yuborilgan, lekin hali muddati tugamagan savollar navbati.
 *
 * NEGA KERAK: jonli sinovda (2026-08) Telegram'ga 6 soniyalik so'rovnoma
 * yuborilib, u yopilgunicha kuzatildi — bot'ga BIRORTA ham "poll" yangilanishi
 * kelmadi. Ya'ni so'rovnoma open_period tugab o'z-o'zidan yopilganda Telegram
 * hech kimni ogohlantirmaydi. Faqat shu xabarga tayansak, ulgurmagan odamning
 * viktorinasi o'sha yerda qotib qoladi.
 *
 * Shuning uchun vaqtni o'zimiz ham sanaymiz: fetch() so'rov oxirida bu navbatni
 * ctx.waitUntil ga topshiradi.
 */
const KUTAYOTGAN = [];

/**
 * Kutishni necha soniyalik bo'laklarga bo'lamiz.
 *
 * Cloudflare fon ishini (waitUntil) ~30 soniyadan keyin to'xtatadi, savol
 * taymeri esa 45 soniyagacha bo'lishi mumkin. Jonli sinovda aynan shu sabab
 * zaxira taymer umuman ishlamagan: 47 soniya kutmoqchi bo'lgan ish yarim
 * yo'lda uzilgan.
 *
 * Yechim: har bo'lakdan keyin Worker o'zini qayta chaqiradi va yangi byudjet
 * oladi. Shunda taymer uzunligiga cheklov qolmaydi.
 */
// Jonli o'lchov (2026-10-10): 18 soniyalik fon ishi bajarildi, 28 soniyalik
// bajarilmadi. Demak chegara ~20–25 soniya. 12 soniya — xavfsiz oraliq:
// bo'lak tugab, o'zini chaqirishga ham vaqt qoladi.
const BOLAK_MS = 25000;   // Workers fon ishi ~30 s: 25 s gacha bitta qadamda kutamiz
const MAX_BOLAK = 10;           // cheksiz zanjirdan himoya (12s × 10 = 2 daqiqa)

// Bir xil savolni qayta yubormaslik oynasi. Savol taymeri eng ko'pi bilan
// 45 soniya, shuning uchun 3 daqiqa — xavfsiz oraliq: bu vaqt ichida savol
// yo javob oladi, yo avtomatik o'tkaziladi.
const TAKROR_OYNA = 3 * 60 * 1000;

const SEQ_BATCH = 5;          // "O'z tezligimda" rejimida bir seansda nechta savol
const TTL_POLL = 60 * 60 * 12;
const TTL_DAY = 60 * 60 * 24 * 3;
const TTL_USER = 60 * 60 * 24 * 400;

// ——————————————————————————————————————————————— yordamchi

// ═══════════════════════════════════════════════════════════════════
// JONLI (custom) EMOJI
//
// Bot API 9.4 dan: bot egasida Telegram Premium bo'lsa, bot xabarlarida custom emoji
// ishlatish mumkin (private, guruh). Admin /emoji paket <nom> bilan o'z emoji
// paketini ulaydi: paketdagi har bir emoji o'zining oddiy belgisiga bog'lanadi
// (🔥 → jonli 🔥), keyin BARCHA HTML xabarlardagi shu belgilar avtomatik almashadi.
// Matnlarni qo'lda o'zgartirish shart emas. Premium bo'lmasa Telegram oddiy emoji ko'rsatadi.
// ═══════════════════════════════════════════════════════════════════

const EMOJI = { t: 0, on: false, xarita: {}, re: null };

async function emojiYukla(env) {
  if (Date.now() - EMOJI.t < 60000) return;
  EMOJI.t = Date.now();
  try {
    const o = JSON.parse((await db.tizimOqi(env, "emoji:map")) || "{}");
    EMOJI.on = !!o.on;
    EMOJI.xarita = o.map || {};
    const kalitlar = Object.keys(EMOJI.xarita).sort((a, b) => b.length - a.length);
    EMOJI.re = kalitlar.length ? new RegExp(`(${kalitlar.join("|")})(?!\\uFE0F?\\u2060)\\uFE0F?`, "gu") : null;
  } catch { EMOJI.on = false; EMOJI.re = null; }
}

/** Emoji'dan keyin U+2060 (ko'rinmas belgi) qo'yilsa, u jonli emoji'ga almashtirilmaydi: matn ichida `🌐\u2060`. */
function emojiAlmashtir(html) {
  if (!EMOJI.on || !EMOJI.re) return html.replace(/\u2060/g, "");
  let ichida = false;
  return html.split(/(<[^>]*>)/).map((p, i) => {
    if (i % 2) {            // teg
      if (/^<tg-emoji/i.test(p)) ichida = true;
      else if (/^<\/tg-emoji/i.test(p)) ichida = false;
      return p;
    }
    if (ichida) return p;   // allaqachon custom emoji
    return p.replace(EMOJI.re, (m, e) => `<tg-emoji emoji-id="${EMOJI.xarita[e]}">${m}</tg-emoji>`);
  }).join("").replace(/\u2060/g, "");
}

async function emojiTayyor(env, payload) {
  if (!payload || payload.parse_mode !== "HTML") return payload;
  if (typeof payload.text !== "string" && typeof payload.caption !== "string") return payload;
  await emojiYukla(env);
  if (!EMOJI.on || !EMOJI.re) return payload;
  const yangi = { ...payload };
  if (typeof yangi.text === "string") yangi.text = emojiAlmashtir(yangi.text);
  if (typeof yangi.caption === "string") yangi.caption = emojiAlmashtir(yangi.caption);
  return yangi;
}

const emojiKey = (e) => e.replace(/️/g, "");

async function emojiOl(env) {
  let o = {};
  try { o = JSON.parse((await db.tizimOqi(env, "emoji:map")) || "{}"); } catch { /* bo'sh */ }
  o.map = o.map || {};
  o.packs = o.packs || {};
  return o;
}
async function emojiSaqla(env, o) { await db.tizimYoz(env, "emoji:map", JSON.stringify(o)); EMOJI.t = 0; }

/** /emoji panel: holat, paketlar (har biri 🗑), ro'yxat, yoqish/o'chirish, tozalash. */
async function emojiPanel(env, chatId, tahrir = null) {
  const o = await emojiOl(env);
  const nomlar = Object.keys(o.packs);
  const text =
    `🎞 <b>Jonli emoji</b>: ${o.on ? "✅ yoqilgan" : "⏸ o'chiq"}\n` +
    `Ulangan: <b>${Object.keys(o.map).length}</b> ta emoji\n\n` +
    (nomlar.length
      ? "<b>Paketlar</b>\n" + nomlar.map((n) => `• ${esc(o.packs[n].title || n)} — ${o.packs[n].emojis.length} ta`).join("\n") + "\n\n"
      : Object.keys(o.map).length ? "<i>Paketlar nomi saqlanmagan (eski ulanish). Paket havolasini qayta yuboring — ro'yxatda ko'rinadi.</i>\n\n" : "") +
    `<i>Yangi paket: havolasini (t.me/addemoji/…) shu yerga yuboring.</i>\n` +
    `<i>Bittalab olib tashlash: /emoji ochir 🔥 ⏳</i>`;
  const qatorlar = [
    [{ text: "📋 Ro'yxat", callback_data: "em:ls:0" }, { text: o.on ? "⏸ O'chirish" : "▶️ Yoqish", callback_data: "em:tg" }],
    ...nomlar.map((n, i) => [{ text: `🗑 ${(o.packs[n].title || n).slice(0, 24)}`, callback_data: `em:dp:${i}` }]),
    ...(Object.keys(o.map).length ? [[{ text: "🧹 Hammasini tozalash", callback_data: "em:tz" }]] : []),
    [{ text: "↩️ Orqaga", callback_data: "adm:panel" }],
  ];
  const p = { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: qatorlar } };
  return tahrir ? tg(env, "editMessageText", { ...p, message_id: tahrir }) : tg(env, "sendMessage", p);
}

/** Ulangan emoji'lar ro'yxati, 48 tadan sahifalab. */
async function emojiRoyxat(env, chatId, sahifa, tahrir = null) {
  const o = await emojiOl(env);
  const hamma = Object.keys(o.map);
  const BOY = 48;
  const jami = Math.max(1, Math.ceil(hamma.length / BOY));
  const n = Math.min(Math.max(0, sahifa), jami - 1);
  const qism = hamma.slice(n * BOY, n * BOY + BOY);
  const text = hamma.length
    ? `📋 <b>Emoji ro'yxati</b> · ${n + 1}/${jami} (jami ${hamma.length})\n\n${qism.join(" ")}\n\n<i>Olib tashlash: /emoji ochir ${qism[0] || "🔥"}</i>`
    : "Ro'yxat bo'sh. Paket havolasini yuboring.";
  const nav = [];
  if (n > 0) nav.push({ text: "◀️", callback_data: `em:ls:${n - 1}` });
  nav.push({ text: "↩️ Orqaga", callback_data: "em:pn" });
  if (n < jami - 1) nav.push({ text: "▶️", callback_data: `em:ls:${n + 1}` });
  const p = { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: [nav] } };
  return tahrir ? tg(env, "editMessageText", { ...p, message_id: tahrir }) : tg(env, "sendMessage", p);
}

/** /emoji — admin: paket ulash, ro'yxat, o'chirish. */
async function emojiBuyruq(env, chatId, matn) {
  const o = await emojiOl(env);
  const [amal, ...qolgan] = matn.trim().split(/\s+/).filter(Boolean);
  const arg = qolgan.join(" ");

  if (amal === "paket" && arg) {
    const nom = arg.replace(/^https?:\/\/t\.me\/(addemoji|addstickers)\//, "").replace(/[^\w]/g, "");
    const r = await tg(env, "getStickerSet", { name: nom });
    if (!r.ok) return tg(env, "sendMessage", { chat_id: chatId, text: `⚠️ Paket topilmadi: ${nom}\nHavola ko'rinishi: t.me/addemoji/PAKET_NOMI` });
    const yangi = [];
    for (const st of r.result.stickers || []) {
      const k = st.emoji && emojiKey(st.emoji);
      if (st.custom_emoji_id && k && !o.map[k]) {
        o.map[k] = st.custom_emoji_id;
        yangi.push(st.emoji);
      }
    }
    if (!yangi.length && !(r.result.stickers || []).some((st) => st.custom_emoji_id)) {
      return tg(env, "sendMessage", { chat_id: chatId, text: "⚠️ Bu oddiy stiker paketi, jonli emoji paketi emas. Havola t.me/addemoji/… ko'rinishida bo'lishi kerak." });
    }
    o.on = true;
    // Paket ro'yxati: avvaldan ulangan emoji'lar ham kiradi (havolani qayta yuborsangiz paket ko'rinadi)
    const hammasi = (r.result.stickers || []).filter((st) => st.custom_emoji_id && st.emoji).map((st) => emojiKey(st.emoji));
    o.packs[nom] = { title: r.result.title || nom, emojis: [...new Set([...(o.packs[nom]?.emojis || []), ...hammasi])] };
    await emojiSaqla(env, o);
    const korinadi = yangi.slice(0, 30).join(" ");
    return tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: `✅ <b>${esc(r.result.title || nom)}</b> ulandi\n\n` +
            `Yangi: <b>${yangi.length}</b> ta · jami: <b>${Object.keys(o.map).length}</b> ta emoji\n` +
            (korinadi ? `${korinadi}${yangi.length > 30 ? " …" : ""}\n\n` : "\n") +
            `Endi botdagi shu belgilar jonli ko'rinadi.\n<i>Jonli bo'lmasa — bot egasida Premium kerak.</i>`,
      reply_markup: { inline_keyboard: [[{ text: "🎞 Panel", callback_data: "em:pn" }, { text: "📋 Ro'yxat", callback_data: "em:ls:0" }]] } });
  }
  if (amal === "ochir" && arg) {
    const kalitlar = [...new Set(Array.from(arg).filter((c) => c.trim() && c !== "️").map(emojiKey))];
    let n = 0;
    for (const k of kalitlar) if (o.map[k]) { delete o.map[k]; n++; }
    for (const p of Object.values(o.packs)) p.emojis = p.emojis.filter((e) => o.map[e]);
    await emojiSaqla(env, o);
    return tg(env, "sendMessage", { chat_id: chatId, text: n ? `🗑 ${n} ta emoji olib tashlandi. Qoldi: ${Object.keys(o.map).length}` : "Bunday emoji ro'yxatda yo'q." });
  }
  if (amal === "on" || amal === "off") {
    o.on = amal === "on";
    await emojiSaqla(env, o);
    return tg(env, "sendMessage", { chat_id: chatId, text: o.on ? "✅ Jonli emoji yoqildi." : "⏸ Jonli emoji o'chirildi (oddiy emoji)." });
  }
  if (amal === "tozala") {
    await emojiSaqla(env, { on: false, map: {}, packs: {} });
    return tg(env, "sendMessage", { chat_id: chatId, text: "🗑 Ulangan emoji'lar tozalandi." });
  }
  if (amal === "royxat") return emojiRoyxat(env, chatId, 0);
  return emojiPanel(env, chatId);
}

/** Panel va ro'yxat tugmalari (em:...). */
async function emojiCallback(env, cb, chatId, data) {
  const mid = cb.message.message_id;
  const o = await emojiOl(env);
  if (data === "em:pn") return emojiPanel(env, chatId, mid);
  if (data.startsWith("em:ls:")) return emojiRoyxat(env, chatId, parseInt(data.slice(6), 10) || 0, mid);
  if (data === "em:tg") { o.on = !o.on; await emojiSaqla(env, o); return emojiPanel(env, chatId, mid); }
  if (data.startsWith("em:dp:")) {
    const nom = Object.keys(o.packs)[parseInt(data.slice(6), 10)];
    if (nom) {
      for (const e of o.packs[nom].emojis) delete o.map[e];
      delete o.packs[nom];
      await emojiSaqla(env, o);
    }
    return emojiPanel(env, chatId, mid);
  }
  if (data === "em:tz") {
    return tg(env, "editMessageText", { chat_id: chatId, message_id: mid, parse_mode: "HTML",
      text: "🧹 <b>Hamma ulangan emoji tozalansinmi?</b>\nKeyin paketlarni qayta ulashingiz kerak bo'ladi.",
      reply_markup: { inline_keyboard: [[{ text: "✅ Ha, tozalash", callback_data: "em:tz2" }, { text: "↩️ Orqaga", callback_data: "em:pn" }]] } });
  }
  if (data === "em:tz2") { await emojiSaqla(env, { on: false, map: {}, packs: {} }); return emojiPanel(env, chatId, mid); }
}

/** So'z-emoji: bir necha jonli emoji bo'lagi birlashib so'z hosil qiladi (DIQQAT, E'LON, TEZKOR...). */
const SOZ = { t: 0, map: {} };
const SOZ_MATN = { diqqat: "DIQQAT", elon: "E'LON", tezkor: "TEZKOR", ajoyib: "AJOYIB!", yangilik: "YANGILIK", maxsus: "MAXSUS" };
async function sozYukla(env) {
  if (Date.now() - SOZ.t < 60_000) return;
  try { SOZ.map = JSON.parse((await db.tizimOqi(env, "soz:map")) || "{}"); } catch { SOZ.map = {}; }
  SOZ.t = Date.now();
}
async function sozTayyor(env, payload) {
  if (!payload) return payload;
  const bor = (v) => typeof v === "string" && v.includes("{{");
  if (!bor(payload.text) && !bor(payload.caption)) return payload;
  await sozYukla(env);
  const almash = (v) => v.replace(/\{\{(\w+)\}\}/g, (_, nom) => {
    const k = nom.toLowerCase(), bolak = SOZ.map[k];
    if (bolak?.length) return bolak.map((b) => '<tg-emoji emoji-id="' + b.id + '">' + (b.e || "⭐") + "</tg-emoji>").join("");
    return "<b>" + (SOZ_MATN[k] || nom.toUpperCase()) + "</b>";
  });
  const yangi = { ...payload, parse_mode: "HTML" };
  if (bor(yangi.text)) yangi.text = almash(yangi.text);
  if (bor(yangi.caption)) yangi.caption = almash(yangi.caption);
  return yangi;
}

/** /soz — admin: so'z-emoji ulash. Buyruq + emoji bo'laklari bitta xabarda: /soz diqqat 🟥🟥🟥 */
async function sozBuyruq(env, chatId, msg, text) {
  const m = /^\/soz(@\w+)?(?:\s+([\s\S]+))?$/.exec(text);
  if (!m) return false;
  const arg = (m[2] || "").trim();
  let o = {};
  try { o = JSON.parse((await db.tizimOqi(env, "soz:map")) || "{}"); } catch { /* bo'sh */ }
  const saqla = async () => { await db.tizimYoz(env, "soz:map", JSON.stringify(o)); SOZ.t = 0; };
  const jonli = (nom) => (o[nom] || []).map((b) => '<tg-emoji emoji-id="' + b.id + '">' + (b.e || "⭐") + "</tg-emoji>").join("");
  const ents = (msg.entities || []).filter((e) => e.type === "custom_emoji" && e.custom_emoji_id);
  const nom = (arg.match(/^[\w']+/) || [""])[0].toLowerCase().replace(/'/g, "");
  const ochir = /^(ochir|o'chir)\s+(\w+)/i.exec(arg);
  if (ochir) {
    const k = ochir[2].toLowerCase();
    if (!o[k]) { await tg(env, "sendMessage", { chat_id: chatId, text: "Bunday so'z yo'q: " + k }); return true; }
    delete o[k]; await saqla();
    await tg(env, "sendMessage", { chat_id: chatId, text: "🗑 " + k + " olib tashlandi." });
    return true;
  }
  if (nom && ents.length) {
    o[nom] = ents.map((e) => ({ id: e.custom_emoji_id, e: Array.from((msg.text || "").slice(e.offset, e.offset + e.length))[0] || "⭐" }));
    await saqla();
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "✅ <b>" + nom + "</b> ulandi (" + ents.length + " bo'lak): " + jonli(nom) + "\n\nMatnda <code>{{" + nom + "}}</code> deb yoziladi." });
    return true;
  }
  const royxat = Object.keys(o);
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: "🔤 <b>So'z-emoji</b>\n\n" + (royxat.length ? royxat.map((k) => "• <code>{{" + k + "}}</code> " + jonli(k)).join("\n") : "<i>Hali ulanmagan.</i>") +
      "\n\n<b>Ulash:</b> bitta xabarda yozing:\n<code>/soz diqqat</code> + so'zni tashkil qilgan emoji bo'laklari (emoji panelidan tanlang).\n" +
      "<b>O'chirish:</b> <code>/soz ochir diqqat</code>\n<i>Hozir ishlatiladi: diqqat (xato/limit xabarlari), tezkor (zanjir eslatmasi), elon (e'lon).</i>" });
  return true;
}

/**
 * «Orqaga» konteksti: bo'limdan ochilgan ekranning BIRINCHI xabariga avtomatik «↩️ Orqaga» qatori qo'shiladi.
 * kod: o = O'rganish, p = Profilim, s = Sozlamalar. Bir so'rov doirasida ishlaydi (AsyncLocalStorage).
 */
const orqaALS = new AsyncLocalStorage();
const ORQA_KOD = { yordam: "p", taklif: "p", yutuq: "p", yonalish: "s", tilmenu: "s", "lib:list": "o" };

/** Xabarni joyida almashtiradi (tahrir berilsa); bo'lmasa yangi xabar yuboradi. */
async function ozgartir(env, tahrir, payload) {
  if (tahrir) {
    const r = await tg(env, "editMessageText", { ...payload, message_id: tahrir });
    if (r?.ok || /not modified/i.test(r?.description || "")) return r;
  }
  return tg(env, "sendMessage", payload);
}

async function tg(env, method, payload) {
  const orqa = orqaALS.getStore();
  if (orqa && !orqa.done && (method === "sendMessage" || method === "editMessageText") &&
      typeof payload.text === "string" && String(payload.chat_id) === String(orqa.chatId)) {
    orqa.done = true;
    const bk = [{ text: t("sz.orqaga"), callback_data: "bk:" + orqa.kod }];
    const rm = payload.reply_markup;
    payload = { ...payload, reply_markup: rm?.inline_keyboard ? { ...rm, inline_keyboard: [...rm.inline_keyboard, bk] } : { inline_keyboard: [bk] } };
  }
  // HTML teglari bor matn parse_mode'siz ketib qolsa, xom teg ko'rinmasin
  if ((method === "sendMessage" || method === "editMessageText") && !payload.parse_mode && /<\/?(b|i|u|s|code|blockquote|tg-spoiler|a)[\s>]/.test(payload.text || "")) payload = { ...payload, parse_mode: "HTML" };
  payload = await emojiTayyor(env, await sozTayyor(env, payload));
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

/**
 * Arab alifbosi qo'llanma rasmi (alifbo / harakat / shakl).
 *
 * Rasm kod ichida (src/qollanma.js). Birinchi marta Telegram'ga yuklanadi,
 * qaytgan file_id esa D1 da saqlanadi — keyingi safar rasm qayta yuklanmaydi.
 * Rasm yuborilmasa ham test to'xtamaydi: qo'llanma — yordam, shart emas.
 */
const QOL_MATN = {
  alifbo: "🔤 Qo'llanma: 29 ta arab harfi va ularning o'qilishi",
  harakat: "🔤 Qo'llanma: harakatlar, mad, tashdid va tanvin",
  shakl: "🔤 Qo'llanma: harf shakllari (boshida, o'rtada, oxirida)",
};
const QOL_YORLIQ = { alifbo: "📖 Harflar", harakat: "📖 Harakatlar", shakl: "📖 Harf shakllari" };
function arabQolTugma(q) {
  const g = q.g || 0;
  const turlar = g >= 1 && g <= 14 ? ["alifbo"] : g >= 15 && g <= 32 ? ["harakat"] : g >= 33 ? ["shakl"] : ["alifbo", "harakat"];
  return turlar.map((x) => ({ text: turlar.length === 1 ? "📖 Qo'llanma rasmi" : QOL_YORLIQ[x], callback_data: `qol:${x}` }));
}

/**
 * Kirish rasmi (Lumi personajlari) + salomlashuv matni bitta xabarda.
 * Rasm kod ichida; birinchi marta yuklanadi, file_id D1 da saqlanadi.
 * Rasm yuborilmasa — salomlashuv oddiy matn bo'lib ketadi (rasm bezak, shart emas).
 */
async function introYubor(env, chatId, matn, replyMarkup) {
  const caption = String(matn).slice(0, 1024);
  try {
    const kesh = await db.tizimOqi(env, "intro:fid4");
    if (kesh) {
      const r = await tg(env, "sendPhoto", { chat_id: chatId, photo: kesh, caption, parse_mode: "HTML", reply_markup: replyMarkup });
      if (r.ok) return true;
    }
    const bin = Uint8Array.from(atob(INTRO_JPG), (ch) => ch.charCodeAt(0));
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("caption", (await emojiTayyor(env, { text: caption })).text);
    fd.append("parse_mode", "HTML");
    fd.append("reply_markup", JSON.stringify(replyMarkup));
    fd.append("photo", new Blob([bin], { type: "image/jpeg" }), "ustozim-nurim.jpg");
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
    const j = await res.json();
    const fid = j?.result?.photo?.at(-1)?.file_id;
    if (j.ok && fid) await db.tizimYoz(env, "intro:fid4", fid);
    return !!j.ok;
  } catch (e) {
    console.warn("introYubor", String(e).slice(0, 120));
    return false;
  }
}

async function qollanmaYubor(env, chatId, nom, bosh = "") {
  try {
    if (!QOLLANMA[nom]) return;
    const sarlavha = bosh ? `${bosh}\n\n${QOL_MATN[nom]}` : QOL_MATN[nom];
    const html = bosh ? { parse_mode: "HTML" } : {};
    const kesh = await db.tizimOqi(env, `qol:${nom}`);
    if (kesh) {
      const r = await tg(env, "sendPhoto", { chat_id: chatId, photo: kesh, caption: sarlavha, ...html });
      if (r.ok) return;
    }
    const bin = Uint8Array.from(atob(QOLLANMA[nom]), (ch) => ch.charCodeAt(0));
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("caption", sarlavha);
    if (bosh) fd.append("parse_mode", "HTML");
    fd.append("photo", new Blob([bin], { type: "image/png" }), `${nom}.png`);
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
    const j = await res.json();
    const fid = j?.result?.photo?.at(-1)?.file_id;
    if (j.ok && fid) await db.tizimYoz(env, `qol:${nom}`, fid);
  } catch (e) {
    console.warn("qollanmaYubor", e);
  }
}

/**
 * Arabcha savol uchun katta harf rasmi (savoldan oldin) va variantlar matni.
 * Rasm bazadan (rasm jadvali) olinadi, Telegram'ga bir marta yuklanadi va file_id keshlanadi.
 * Rasm bo'lmasa yoki yuborilmasa — savol baribir matn bilan ketadi.
 */
const RASM_FID = new Map();
async function rasmYubor(env, chatId, kalit) {
  try {
    const fid = RASM_FID.get(kalit) || await db.tizimOqi(env, `rasm:${kalit}`);
    if (fid) {
      const r = await tg(env, "sendPhoto", { chat_id: chatId, photo: fid });
      if (r.ok) { RASM_FID.set(kalit, fid); return; }
    }
    const b64 = await db.rasmOl(env, kalit);
    if (!b64) return;
    const bin = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("photo", new Blob([bin], { type: "image/jpeg" }), "harf.jpg");
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
    const j = await res.json();
    const nid = j?.result?.photo?.at(-1)?.file_id;
    if (j.ok && nid) { RASM_FID.set(kalit, nid); await db.tizimYoz(env, `rasm:${kalit}`, nid); }
  } catch (e) {
    console.warn("rasmYubor", e);
  }
}

/**
 * Rasmning Telegram file_id si. Poll variantiga rasm biriktirish uchun file_id kerak.
 * Rasm birinchi marta kerak bo'lganda admin chatiga jim yuklanadi, file_id olinadi,
 * xabar o'chiriladi va file_id doimiy saqlanadi (keyingi safar yuklash shart emas).
 */
async function fotoFid(env, kalit, bilibTekshirilgan = false) {
  if (RASM_FID.has(kalit)) return RASM_FID.get(kalit);
  const saqlangan = bilibTekshirilgan ? null : await db.tizimOqi(env, `rasm:${kalit}`);
  if (saqlangan) { RASM_FID.set(kalit, saqlangan); return saqlangan; }
  const b64 = await db.rasmOl(env, kalit);
  if (!b64) return null;
  const bin = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  const fd = new FormData();
  fd.append("chat_id", String(env.ADMIN_ID));
  fd.append("disable_notification", "true");
  fd.append("photo", new Blob([bin], { type: "image/jpeg" }), "harf.jpg");
  const j = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd })).json();
  const fid = j?.result?.photo?.at(-1)?.file_id;
  if (!j.ok || !fid) return null;
  RASM_FID.set(kalit, fid);
  await db.tizimYoz(env, `rasm:${kalit}`, fid);
  tg(env, "deleteMessage", { chat_id: env.ADMIN_ID, message_id: j.result.message_id }).catch(() => {});
  return fid;
}

/**
 * Barcha harf rasmlarini oldindan Telegram'ga yuklab, file_id larini saqlaydi
 * (bir martalik, admin buyrug'i /rasm_isit). Shundan keyin savol yuborilganda
 * hech qanday vaqtinchalik rasm ko'rinmaydi.
 */
async function rasmIsit(env, chatId) {
  const kalitlar = new Set();
  for (const q of bank) {
    const r = rasmTuri(q);
    if (!r) continue;
    if (r.tur === "a") kalitlar.add(r.kalit);
    else q.o.forEach((o) => kalitlar.add(opsiyaKalit(o)));
  }
  // Bitta so'rovda qaysilari saqlanganini bilamiz (so'rov byudjeti 100 ta: har rasmga 2 ta so'rov)
  const { results } = await env.DB.prepare("SELECT k FROM tizim WHERE k LIKE 'rasm:%'").all();
  const bor = new Set(results.map((r) => r.k.slice(5)));
  const kerak = [...kalitlar].filter((k) => !RASM_FID.has(k) && !bor.has(k));
  const boshlandi = Date.now();
  let bajarildi = 0, ishlandi = 0;
  while (kerak.length && ishlandi < 40 && Date.now() - boshlandi < 20000) {
    const qism = kerak.splice(0, 10);
    ishlandi += qism.length;
    const n = await Promise.all(qism.map((k) => fotoFid(env, k, true).catch(() => null)));
    bajarildi += n.filter(Boolean).length;
  }
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: kerak.length
      ? `🖼 Rasmlar tayyorlanmoqda: yuklandi <b>${bajarildi}</b>, qoldi <b>${kerak.length}</b>.`
      : `✅ Hamma harf rasmlari tayyor${bajarildi ? ` (yangi: ${bajarildi})` : ""}. Endi savollarda vaqtinchalik rasm ko'rinmaydi.`,
    ...(kerak.length ? { reply_markup: { inline_keyboard: [[{ text: "▶️ Davom etish", callback_data: "rasm:isit" }]] } } : {}) });
}

/**
 * Savol variantlari va (bo'lsa) rasm. Natija: { options, media? }
 *   a-turi: katta harf rasmi poll TEPASIDA (poll media).
 *   b-turi: har bir variant o'ng tomonida o'z harf rasmi bilan.
 * Media ishlamasa (rasm yo'q / Telegram qabul qilmasa) — eski usul: rasm
 * savoldan oldin alohida xabar, variantlar raqamlangan matn.
 */
async function savolVariantlari(env, chatId, q, eski = false) {
  let v = q.o.map((o) => clip(o, 100));
  const r = rasmTuri(q);
  if (!r) return { options: v };
  if (!eski) {
    try {
      if (r.tur === "a") {
        const fid = await fotoFid(env, r.kalit);
        if (fid) return { options: v, media: { type: "photo", media: fid } };
      } else {
        const fids = await Promise.all(q.o.map((o) => fotoFid(env, opsiyaKalit(o))));
        if (fids.every(Boolean)) {
          return { options: q.o.map((o, i) => ({ text: `${i + 1}-variant`, media: { type: "photo", media: fids[i] } })), media: null, variantMedia: true };
        }
      }
    } catch (e) { console.warn("savolVariantlari media", e); }
  }
  await rasmYubor(env, chatId, r.kalit);
  if (r.tur === "b") v = q.o.map((o, i) => clip(`${i + 1}) ${o}`, 100));
  return { options: v };
}

/**
 * Telegram nomalum `media` maydonini jim e'tiborsiz qoldirishi mumkin: savol
 * ketadi, lekin rasm yo'q. Javobdagi poll'da media ko'rinmasa — xabarni
 * o'chirib, eski usulda qayta yuboramiz.
 */
const mediaYetmadi = (res, sv) => {
  const p = res?.result?.poll;
  if (!res?.ok || !p || !Array.isArray(p.options)) return false;   // javobda variantlar bo'lmasa tekshirib bo'lmaydi
  if (sv.variantMedia) return !p.options.every((o) => o.media);
  if (sv.media) return !p.media;
  return false;
};

/** Ro'yxatni to'plamlarga bo'lib beradi — parallel ishlov berish uchun. */
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Kun kaliti — TOSHKENT vaqti bo'yicha (UTC+5).
 *
 * Ilgari UTC ishlatilardi va kun Toshkentda soat 05:00 da almashardi. Oqibati:
 * kechqurun viktorinani ishlagan odam yarim tundan keyin qayta kirsa, bot uni
 * hali ham "bugun ishlagansiz" deb to'xtatardi — go'yo yangi kun boshlanmagan.
 * Sarlavhadagi sana esa (sanaUz) Toshkent vaqtini ko'rsatib, ma'lumot bilan
 * zid bo'lib qolardi. Endi ikkalasi bitta vaqt mintaqasida.
 */
const TOSHKENT_OFFSET = 5 * 3600000;

const dayKey = (offset = 0) =>
  new Date(Date.now() + TOSHKENT_OFFSET + offset * 86400000).toISOString().slice(0, 10);

const esc = (s) =>
  String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const clip = (s, n) => (String(s).length <= n ? String(s) : String(s).slice(0, n - 1) + "…");

// Klaviatura endi matn katalogidan quriladi (src/matn.js).
// MENU nomi saqlanib qoldi: u kod bo'ylab o'nlab joyda ishlatiladi va
// hammasini birdan almashtirish — foydasiz xavf.
// (MENU o'rniga menyu() — joriy til bo'yicha)

// Takrorlash seansida bir martada nechta savol
const XATO_BATCH = 5;

/**
 * qid → savol xaritasi.
 *
 * Xatolar banki javoblar jadvalida faqat qid (savol matnining xeshi) saqlaydi,
 * savolning o'zini emas — aks holda baza savol matnlarining nusxasi bilan
 * to'lib ketardi va savol tahrirlangach eski nusxa qolib ketardi.
 * Takrorlash vaqtida savolni qaytarib topish uchun shu xarita kerak.
 *
 * Bir marta quriladi va izolyatsiya umri davomida xotirada turadi: 798 ta
 * savol uchun bu arzon, har so'rovda qayta qurish esa behuda ish bo'lardi.
 */
let SAVOL_XARITA = null;
function savolTop(qid) {
  if (!SAVOL_XARITA) {
    SAVOL_XARITA = new Map();
    // Uchala baza ham kiritiladi. Rus bazasi tushib qolgani uchun rus
    // marafonidagi har bir xato "savol topilmadi" tarmog'iga tushib,
    // cheksiz siklni yoqib yuborardi.
    for (const q of kitobBankRoyxat("uz")) SAVOL_XARITA.set(db.qid(q.q), q);
    for (const q of kitobBankRoyxat("ru")) SAVOL_XARITA.set(db.qid(q.q), q);
    for (const q of bank) SAVOL_XARITA.set(db.qid(q.q), q);
  }
  return SAVOL_XARITA.get(qid) || null;
}

/**
 * Kitob savollarining ikki tildagi juftligi (uz va ru bazalar indeks bo'yicha mos).
 * Xatolar bankida savol qaysi tilda ishlangan bo'lsa, o'sha tilning qid'i turadi;
 * foydalanuvchi esa hozirgi tilida takrorlashi kerak.
 */
let QID_JUFT = null;
function savolTilda(q, lang) {
  if (!QID_JUFT) {
    QID_JUFT = new Map();
    const uz = kitobBankRoyxat("uz"), ru = kitobBankRoyxat("ru");
    for (let i = 0; i < Math.min(uz.length, ru.length); i++) {
      QID_JUFT.set(db.qid(uz[i].q), { uz: uz[i], ru: ru[i] });
      QID_JUFT.set(db.qid(ru[i].q), { uz: uz[i], ru: ru[i] });
    }
  }
  const j = QID_JUFT.get(db.qid(q.q));
  return j ? (lang === "ru" ? j.ru : j.uz) : q;
}

// Butun bazaning barqaror tartibi ("o'z tezligimda" rejimi uchun)
let SEQ = null;
function seqOrder() {
  if (SEQ) return SEQ;
  // Arab kursi kalendar bo'yicha o'tadi; "O'z tezligimda" ga aralashmaydi.
  const arr = bank.filter((q) => q.t !== "Arab");
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

const getUser = (env, uid) => db.getUser(env, uid);
const saveUser = (env, uid, u) => db.saveUser(env, uid, u);

// ——————————————————————————————————————————————— savol yuborish

// ——— Savol taymeri (Telegram "Limit Duration" = open_period) ———
//
// Taymer kunlik viktorinada va kitob marafonida (admin qarori, 2026-10-20).
// Marafonda keyingi fasl 90% bilan ochiladi, shuning uchun savolga vaqt
// beriladi. «O'z tezligimda», «Arab alifbosi» va «Xatolarim» — taymersiz:
// ular o'rganish rejimlari, odamni vaqtga qisish ularning maqsadiga zid.
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
  if (mode !== "d" && mode !== "k" && mode !== "r" && mode !== "w") return null;   // kunlik va marafon: taymerli. Arab alifbosi — o'rganish rejimi, taymersiz
  const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
  const total = words(q.q) + (q.o || []).reduce((n, o) => n + words(o), 0);
  let value = OP_BASE + total * OP_PER_WORD + OP_BUFFER;
  if (q.t === "Mantiq") value += OP_THINK_BONUS;
  if (Array.isArray(q.cs)) value += 10;   // bir nechta javob: har variantni alohida o'ylash kerak
  if (q.img) value += 8;                  // rasmni o'rganish vaqti
  return Math.max(OP_MIN, Math.min(OP_MAX, Math.round(value)));
}

/** To'g'ri javob parametri: bitta yoki bir nechta (yangi Bot API: correct_option_ids). */
const togriParam = (q) => (Array.isArray(q.cs)
  ? { correct_option_ids: q.cs, allows_multiple_answers: true }
  : { correct_option_id: q.c });

async function sendQuestion(env, chatId, uid, mode, index, questions, extra = {}) {
  const q = questions[index];
  const vaqt = openPeriodFor(q, mode);

  /**
   * Javobdan keyin chiqadigan izoh.
   *
   * Telegram quiz so'rovnomasida bu maydon javob berilgan zahoti ekranda
   * ko'rinadi — ya'ni bu foydalanuvchi ALBATTA o'qiydigan yagona joy.
   * Ilgari u shunchaki mavzu yorlig'i edi ("📖 Faktik savol"), ya'ni bekor
   * ketardi: odam xato qilsa, faqat to'g'ri javobni ko'rardi, NEGA to'g'ri
   * ekanini bilmasdi. Endi savolning o'z izohi (q.e) qo'yiladi — kitob
   * matnidan olingan tushuntirish va iqtibos bilan. Shunda test ishlash
   * jarayonining o'zi o'qishga aylanadi.
   *
   * Telegram chegarasi — 200 belgi. Chegaradan oshsa, Telegram butun
   * sendPoll chaqiruvini rad etadi, ya'ni savol umuman yuborilmaydi.
   * Shuning uchun clip() majburiy: bitta uzun izoh viktorinani to'xtatib
   * qo'ymasligi kerak.
   */
  const yorliq = mode === "r" ? turLabel(q.k, RU)
    : mode === "k" ? turLabel(q.k) : topicLabel(q.t);
  const izoh = q.e ? clip(q.e, 200) : clip(yorliq, 200);

  // Sarlavhada taymer borligini oldindan aytamiz. Telegramning o'z
  // hisoblagichi kichkina va kech ko'zga tashlanadi — odam savolni o'qiy
  // boshlaganda vaqt ketayotganini bilishi kerak.
  // Kitob rejimida savol qaysi manbadan olinganini sarlavhada ko'rsatamiz:
  // baza bir nechta kitobdan iborat bo'lgani uchun foydalanuvchi nimani
  // o'qiyotganini bilib turishi kerak.
  const ruR = mode === "r";
  const kitobBelgi = ruR ? `📕 ${q.m || ""}`.trimEnd()
    : mode === "k" && q.m ? `📖 ${q.m}`
    : "";
  // Taymerni Telegramning o'zi poll tepasida teskari sanab ko'rsatadi (results in 00:14),
  // shuning uchun sarlavhada qotib qolgan «21 s» yozilmaydi — u chalg'itardi.
  const sarlavha = [
    `${ruR ? "Вопрос" : "Savol"} ${index + 1}/${questions.length}`,
    kitobBelgi, (q.h && mode === "d") ? "⭐ 2 ball" : "",
  ].filter(Boolean).join(" · ");
  const kopHint = (q.cs && q.cs.length > 1)
    ? `\n☑️ ${q.cs.length} ta javob · ${ruR ? "нажмите «Голосовать» внизу" : "pastdagi «Ovoz berish» ni bosing"}`
    : "";

  const sv = await savolVariantlari(env, chatId, q);
  const payload = {
    chat_id: chatId,
    question: clip(`${sarlavha}${kopHint}\n${q.q}`, 300),
    options: sv.options,
    type: "quiz",
    ...togriParam(q),
    is_anonymous: false,
    explanation: izoh,
  };
  if (vaqt) payload.open_period = vaqt;
  // Arabcha savol tagida qo'llanma tugmasi: rasm chatda yuqoriga surilib ketadi,
  // tugma esa uni kerak paytda savol tagiga qaytaradi.
  const qatorlar = [];
  if (q.t === "Arab") qatorlar.push(arabQolTugma(q));
  // 🔖 Saqlash: faqat o'rganish rejimlarida (duelda emas — u raqobat)
  if (mode === "d" || mode === "k" || mode === "r" || mode === "a")
    qatorlar.push([{ text: t("sv.saqlash", ruR ? "ru" : undefined), callback_data: `sv:${db.qid(q.q)}` }]);
  if (qatorlar.length) payload.reply_markup = { inline_keyboard: qatorlar };

  if (sv.media) payload.media = sv.media;
  let res = await tg(env, "sendPoll", payload);
  if ((!res.ok || mediaYetmadi(res, sv)) && (sv.media || sv.variantMedia)) {
    // Telegram media qabul qilmadi yoki e'tiborsiz qoldirdi — eski usul (savol baribir ketsin)
    console.warn("sendPoll media", JSON.stringify(res).slice(0, 300));
    if (res.ok) await tg(env, "deleteMessage", { chat_id: chatId, message_id: res.result.message_id }).catch(() => {});
    delete payload.media;
    payload.options = (await savolVariantlari(env, chatId, q, true)).options;
    res = await tg(env, "sendPoll", payload);
  }
  if (res.ok && res.result?.poll?.id) {
    await db.pollSaqla(env, res.result.poll.id,
      { u: uid, i: index, m: mode, c: chatId, msg: res.result.message_id, ...extra });
    // Taymerli savol bo'lsa, vaqt tugashini o'zimiz ham kuzatamiz —
    // Telegram avtomatik yopilish haqida xabar yubormaydi.
    if (vaqt) KUTAYOTGAN.push({ pollId: res.result.poll.id, vaqt });
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
const navbatniOl = (env, pollId, tekshir) => db.navbatniOl(env, pollId, tekshir);

function topicLabel(t) {
  return {
    IT: "💻 IT va dasturlash",
    Liderlik: "🌟 Fazilatli liderlik",
    Diniy: "🕌 Diniy savodxonlik",
    Kino: "🎬 Kino va multfilm",
    Arab: "🔤 Arab alifbosi",
    Mantiq: "🧩 Mantiq va zakovat",
    Kitob: "📖 Ilm olish sirlari",
    Ingliz: "🇬🇧 Ingliz tili",
    "Книга": "📕 Ilm olish sirlari (RU)",   // rus marafoni — eski yozuvlarda shunday saqlangan
  }[t] || t;
}

// Rejimga qarab bugungi savollar to'plami
function questionsFor(mode, uid, u) {
  if (mode === "d") return kunlikToplam(bank, u?.yonalish, uid);
  const order = seqOrder();
  const start = (u.seq || 0) % order.length;
  const day = dayIndex();
  const out = [];
  for (let i = 0; i < SEQ_BATCH; i++) out.push(order[(start + i) % order.length]);
  return out.map((q, i) => shuffleOptions(q, day + start + i));
}

// ——————————————————————————————————————————————— kunlik rejim

const firstUnanswered = (env, uid, total) => db.birinchiJavobsiz(env, uid, dayKey(), total);

/** Matn «tugmani bosing» desa, tugma shu xabarning o'zida turishi kerak. kalitlar: kunlik|marafon|takror|natija|arab */
function keyingiTugmalar(...juftlar) {
  return { inline_keyboard: juftlar.map((qator) => qator.map((k) => ({ text: t("tugma." + k), callback_data: "hub:" + k }))) };
}

async function startDaily(env, chatId, uid, name, tasdiq = false) {
  // Yo'nalish foydalanuvchi yozuvidan olinadi. Savollar (uid, kun, yo'nalish)
  // bo'yicha deterministik, shuning uchun javob kelganda ayni shu to'plam
  // qayta hisoblanadi — indekslar siljib ketmaydi.
  const u00 = await getUser(env, uid);
  const questions = questionsFor("d", uid, u00);
  const total = questions.length;

  const d = await db.kunYakunlandiMi(env, uid, dayKey());
  if (d) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: t("kun.tugadi", undefined, { ball: d.score, jami: d.total }),
      reply_markup: keyingiTugmalar(["takror", "marafon"]),
    });
    return;
  }

  const next = await firstUnanswered(env, uid, total);
  if (next >= total) { await finishDaily(env, chatId, uid, total, name); return; }

  /**
   * Takroriy kirishdan himoya.
   *
   * Guruhdagi "HOZIR BOSHLASH" tugmasini ikki marta bosgan yoki viktorina
   * o'rtasida menyuga qaytgan odam shu funksiyaga qayta kiradi. Ilgari bu
   * o'sha savolni YANA yuborardi: foydalanuvchida bir xil savol bir necha
   * marta paydo bo'lardi ("1 ta savolni 5 marta yechdim" — jamoadan kelgan
   * shikoyat). KV darhol yangilanmagani uchun firstUnanswered ham eski
   * indeksni qaytarishi mumkin, bu takrorni yanada kuchaytirardi.
   *
   * Yechim: shu savol bo'yicha ochiq (javobsiz) so'rovnoma bor-yo'qligini
   * bazadan so'raymiz. Javob kelganda yozuv o'chadi, demak "ochiq" holat
   * aynan "hali javob berilmagan" degani.
   */
  const u0 = await getUser(env, uid);
  if (await db.ochiqSavol(env, uid, "d", next, TAKROR_OYNA)) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `⏳ <b>Viktorina allaqachon boshlangan.</b>\n\n` +
        `Yuqoridagi <b>${next + 1}/${total}-savolga</b> javob bering — ` +
        `keyingisi o'zi keladi.`,
    });
    return;
  }
  if (name && u0.name !== name) await db.touchUser(env, uid, name, null);

  if (next === 0) {
    // BITTA kirish xabari. Arab kunida u qo'llanma rasmining sarlavhasiga
    // qo'shiladi: ilgari rasm + alohida matn + savol — uch xabar edi.
    const kirish = `🧠 <b>${total} ta savol</b> · ~${Math.max(2, Math.round(total * 0.6))} daqiqa` +
      (arabDars() ? `\n🔤 Arab alifbosi: <b>${arabDars()}-dars</b> (${ARAB_KUNLAR} dan)` : "");
    if (arabDars()) await qollanmaYubor(env, chatId, arabQollanma(arabDars()), kirish);
    else await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: kirish });
  } else if (!tasdiq) {
    // Taymerli savol yuborilgach vaqt darhol ketadi. Qaytgan odam tayyor
    // bo'lmasdan savolga duch kelmasin: avval rozilik, keyin savol.
    await tg(env, "sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: t("davom.matn", undefined, { n: next + 1, jami: total }),
      reply_markup: { inline_keyboard: [[{ text: t("davom.tugma"), callback_data: "davom_d" }]] },
    });
    return;
  }
  await sendQuestion(env, chatId, uid, "d", next, questions);
}

async function finishDaily(env, chatId, uid, total, name, known = {}) {
  if (await db.kunYakunlandiMi(env, uid, dayKey())) return;

  const ball = await db.kunlikBall(env, uid, dayKey());
  // QIYIN savollar IKKI BARAVAR ball beradi: oddiy savol 1, qiyin (ko'p javobli/rasmli) 2.
  const u0 = await getUser(env, uid);
  const qiyinlar = questionsFor("d", uid, u0).filter((q) => q.h);
  const qiyinTogri = await db.qiyinTogri(env, uid, dayKey(), qiyinlar.map((q) => db.qid(q.q)));
  const totalV = total + qiyinlar.length;                         // maksimal ball
  const score = Math.min(ball.togri + qiyinTogri, totalV);       // 15→5 o'tish kunida ortiqcha javoblar chegaralanadi
  total = totalV;
  const pct = Math.round((score / total) * 100);
  await db.kunYakunla(env, uid, dayKey(), score, total);
  const hero = qiyinlar.length > 0 && qiyinTogri === qiyinlar.length;
  let heroZanjir = 0;
  if (hero) {
    const dd = new Date(); dd.setUTCDate(dd.getUTCDate() + 1); dd.setUTCHours(15, 0, 0, 0);
    heroZanjir = await db.heroBer(env, uid, dayKey(), dayKey(-1), dd.toISOString().slice(0, 19).replace("T", " "));
  }

  // streak va hisoblagichlar
  const u = await getUser(env, uid);
  u.streak = u.last_daily === dayKey(-1) ? (u.streak || 0) + 1 : 1;
  u.last_daily = dayKey();
  u.days = (u.days || 0) + 1;
  if (name) u.name = name;
  await saveUser(env, uid, u);



  const verdict = t(pct === 100 ? "baho.100" : pct >= 80 ? "baho.80" : pct >= 60 ? "baho.60" : pct >= 40 ? "baho.40" : "baho.0");

  const filled = Math.round(pct / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  const streakLine = u.streak > 1 ? `\n🔥 <b>${u.streak} kun ketma-ket!</b> Zanjirni uzmang.\n` : "\n";

  // XABARNING OXIRGI JUMLASI — eng esda qoladigan joy.
  //
  // Ilgari u yerda "reyting 22:00 da chiqadi" turardi, ya'ni eng
  // qimmatli o'rin e'longa ketgan edi. Endi u yerda KEYINGI QADAM
  // turadi: xato qilingan savollar qayerga tushgani va qachon
  // qaytishi. Bu botning asosiy va'dasi — reyting esa ikkinchi
  // darajali, shuning uchun kursivda va oxirida.
  const qiyinQator = qiyinlar.length
    ? `\n⭐ Qiyin savollar: <b>${qiyinTogri}/${qiyinlar.length}</b> (ikki baravar ball)` +
      (hero ? `\n🦸 <b>Hero!</b> Hamma qiyin savol to'g'ri` + (heroZanjir > 1 ? ` — <b>${heroZanjir} kun ketma-ket</b>!` : `.`) : ``) + `\n`
    : ``;
  const xatoSoni = total - score;
  const keyingiQadam = xatoSoni
    ? t("kunlik.xatolar", "uz", { soni: xatoSoni })
    : t("kunlik.toliq");

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      t("kunlik.yakun", "uz", {
        ball: score, jami: total, foiz: pct, chiziq: bar,
        ketma: streakLine + qiyinQator, baho: verdict,
      }) + keyingiQadam + t("kunlik.reyting"),
    reply_markup: { inline_keyboard: [
      [{ text: t("fikr.ha"), callback_data: "fikr:1" }, { text: t("fikr.yoq"), callback_data: "fikr:0" }],
      [{ text: t("fikr.yana"), callback_data: "yana" }],
      [{ text: t("xabar.tugma"), callback_data: `xabar:d:${dayKey()}` }],
    ] },
  });

  // Yutuq tabrigi natijadan KEYIN keladi — oldin kelsa, nima uchun
  // berilgani tushunarsiz bo'ladi.
  await yutuqTekshir(env, chatId, uid);
}


// ═══════════════════════════════════════════════════════════════════
// DO'ST BILAN DUEL (rejim "w")
//
// Bir xil 5 savol, ikkala tomonga bir xil variant tartibida. Har savolga taymer bor
// (kunlik viktorinadagidek): javobni qidirib topib bo'lmasin.
// Raqib 6 soat ichida tugatmasa, tugatgan tomon yutadi (duelMuddatTekshir).
// Tezlik faqat TENGLIK buzuvchi: avval to'g'ri javoblar soni hisoblanadi.
// Duel kunlik reyting, ball, xatolar banki va yutuqlarga TEGMAYDI.
// ═══════════════════════════════════════════════════════════════════

const DUEL_SAVOL = 5;
const DUEL_KUNLIK = 5;

/** Duel raqamidan deterministik 5 savol: ikkala tomonda aynan bir xil. */
function duelSavollari(id) {
  const havza = bank.filter((q) => !q.h && !q.img && !Array.isArray(q.cs) && q.t !== "Arab");
  let s = (Math.imul(id + 1, 2654435761) ^ 0x9e3779b9) >>> 0;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  const idx = havza.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, DUEL_SAVOL).map((i) => shuffleOptions(havza[i], id));
}

/** Boshqa foydalanuvchining tili (duel natijasi ikkala tomonga o'z tilida borishi uchun). */
async function tilOl(env, uid) {
  try { return (await env.DB.prepare("SELECT lang FROM users WHERE uid = ?").bind(String(uid)).first())?.lang || "uz"; }
  catch { return "uz"; }
}

const duelTomon = (d, uid) => (String(d.a) === String(uid) ? "a" : String(d.b) === String(uid) ? "b" : null);

async function duelBoshla(env, chatId, uid, id) {
  const d = await db.duelOl(env, id);
  const x = d && duelTomon(d, uid);
  if (!x) return false;
  if (!(await db.duelBosh(env, id, x))) {
    // Allaqachon boshlangan: holatga qarab aniq javob (savol tugagan bo'lsa "javob bering" demaymiz)
    const ok = x === "a" ? d.a_ok : d.b_ok;
    const tugatgan = x === "a" ? d.a_done : d.b_done;
    let kalit = "duel.davom";
    if (tugatgan) kalit = d.bitdi ? "duel.yakunlangan" : !d.b ? "duel.dostKutilmoqda" : "duel.raqibKutilmoqda";
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: t(kalit, undefined, { ok, n: DUEL_SAVOL, raqib: x === "a" ? d.b_ok : d.a_ok }),
      ...(d.bitdi ? { reply_markup: { inline_keyboard: [[{ text: t("duel.yangi"), callback_data: "duel:yangi" }]] } } : {}) });
    return false;
  }
  await sendQuestion(env, chatId, uid, "w", 0, duelSavollari(id), { f: id });
  return true;
}

const INLINE_KESH = { t: 0, v: false };
/** Ulashish tugmasi: Telegramning o'z "yuborish" oynasi ochiladi (inline rejim kerak emas). */
async function duelOktagonTugma(env, id) {
  // getMe "supports_inline_queries" ni aytadi: BotFather da inline rejim yoqilmagan bo'lsa,
  // tugma jim qolmasligi uchun eski (havolali) usulga qaytamiz.
  let inlineBor = INLINE_KESH.v;
  if (Date.now() - INLINE_KESH.t > 600000) {
    try { inlineBor = !!(await tg(env, "getMe", {}))?.result?.supports_inline_queries; INLINE_KESH.v = inlineBor; INLINE_KESH.t = Date.now(); } catch { /* eski usul */ }
  }
  return inlineBor
    ? { text: t("duel.btnOktagon"), switch_inline_query: `w_${id}` }
    : { text: t("duel.btnOktagon"), url: duelUlashUrl(env, id) };
}

/** Inline so'rov: do'stga yuboriladigan tayyor xabar, tagida «Kettu 😎» tugmasi. */
async function handleInline(env, iq) {
  const m = /^w_(\d+)$/.exec((iq.query || "").trim());
  const javob = (results) => tg(env, "answerInlineQuery", { inline_query_id: iq.id, results, cache_time: 0, is_personal: true });
  if (!m) return javob([]);
  const id = parseInt(m[1], 10);
  const d = await db.duelOl(env, id).catch(() => null);
  if (!d || String(d.a) !== String(iq.from.id)) return javob([]);
  const havola = `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=w_${id}`;
  const natija = await javob([{
    type: "article", id: `w${id}`,
    title: t("duel.inlineSarlavha"), description: t("duel.inlineIzoh"),
    thumbnail_url: String(env.WEBHOOK_URL || "").replace(/\/?$/, "/") + "lumi-duel2.jpg", thumbnail_width: 256, thumbnail_height: 256,
    input_message_content: { message_text: t("duel.xabar"), parse_mode: "HTML" },
    reply_markup: { inline_keyboard: [[{ text: t("duel.btnKettu"), url: havola }]] },
  }]);
  // Signal: ulashish oynasi ochilib, do'st tanlandi. Chosen-inline-feedback ga TAYANMAYMIZ: Telegram uni
  // har doim yubormaydi (BotFather: inline feedback %), tugma esa hech qachon chiqmay qolardi (Duel #85).
  await duelUlashBoshlandi(env, id, d);
  return natija;
}

/** Ulashish boshlandi/bajarildi: asosiy xabarga «Testni boshlash» tugmasini qo'shamiz (bir marta). */
async function duelUlashBoshlandi(env, id, d = null) {
  try {
    const mp = await db.tizimOqi(env, "duel:m:" + id);
    if (!mp) return;
    if (!d) d = await db.duelOl(env, id);
    if (d?.a_start) return;
    const [cid, mid] = mp.split(":");
    await db.tizimYoz(env, "duel:m:" + id, "");
    await tg(env, "editMessageReplyMarkup", { chat_id: cid, message_id: Number(mid), reply_markup: { inline_keyboard: [
      [{ text: t("duel.btnBosh"), callback_data: `duel:b:${id}` }],
      [await duelOktagonTugma(env, id)],
    ] } });
  } catch { /* tugma qo'shilmasa ham ulashish ishlaydi */ }
}

/** Foydalanuvchi inline natijani haqiqatan yubordi (BotFather: inline feedback yoqilgan bo'lsa). */
async function handleInlineTanlandi(env, cir) {
  const m = /^w(\d+)$/.exec(cir.result_id || "");
  if (!m) return;
  await db.tizimYoz(env, "duel:fb", "1").catch(() => {});
  await duelUlashBoshlandi(env, parseInt(m[1], 10));
}

function duelUlashUrl(env, id) {
  const havola = `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=w_${id}`;
  return `https://t.me/share/url?url=${encodeURIComponent(havola)}&text=${encodeURIComponent(t("duel.share"))}`;
}

/** /duel — BITTA xabar, ikkita tugma: testni boshlash va do'stni chaqirish (Oktagon). */
async function duelYarat(env, chatId, uid) {
  let ochiq = 0;
  try { ochiq = await db.duelSoni(env, uid); }
  catch (e) {
    console.error("duel", String(e).slice(0, 200));
    await tg(env, "sendMessage", { chat_id: chatId, text: t("duel.tezOrada") });
    return;
  }
  // Cheklov faqat do'st qo'shilmagan (ochiq) duellarga: o'ynalgan duellar sanalmaydi. Admin cheklanmaydi.
  if (String(uid) !== String(env.ADMIN_ID) && ochiq >= DUEL_KUNLIK) {
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: t("duel.limit") });
    return;
  }
  const id = await db.duelYarat(env, uid);
  const oktagon = await duelOktagonTugma(env, id);
  const inlineRejim = !!oktagon.switch_inline_query;
  const bosh = [{ text: t("duel.btnBosh"), callback_data: `duel:b:${id}` }];
  const r = await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: t("duel.menyu", undefined, { id, n: DUEL_SAVOL }),
    // Inline rejimda «Duelni boshlash» ulashish oynasi ochilgach chiqadi (handleInline); havolali (zaxira) usulda
    // ulashish bilinmaydi — ikkalasi ham ko'rinadi.
    reply_markup: { inline_keyboard: inlineRejim ? [[oktagon]] : [bosh, [oktagon]] } });
  if (inlineRejim && r?.ok) await db.tizimYoz(env, "duel:m:" + id, chatId + ":" + r.result.message_id).catch(() => {});
}

/** "🚀 Testni boshlash" bosildi. */
async function duelBoshlaTugma(env, cb, uid, id) {
  const chatId = cb.message.chat.id;
  const d = await db.duelOl(env, id);
  if (!d || !duelTomon(d, uid)) return;
  // Tugma bir marta ishlaydi: boshlash tugmasi olib tashlanadi, Oktagon qoladi (yaratuvchida)
  const oktagon = String(d.a) === String(uid)
    ? { inline_keyboard: [[await duelOktagonTugma(env, id)]] }
    : { inline_keyboard: [] };
  await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: oktagon }).catch(() => {});
  await duelBoshla(env, chatId, uid, id);
}

/** Do'st havola orqali kirdi: /start w_<id> */
async function duelQoshil(env, chatId, uid, id) {
  const d = await db.duelOl(env, id);
  if (!d) { await tg(env, "sendMessage", { chat_id: chatId, text: t("duel.topilmadi"), reply_markup: menyu() }); return; }
  if (String(d.a) === String(uid)) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t("duel.ozHavola") });
    return;
  }
  const yangiQoshildi = !d.b;
  if (yangiQoshildi && !(await db.duelQosh(env, id, uid))) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t("duel.boshqaQoshildi"), reply_markup: menyu() });
    return;
  }
  if (d.b && String(d.b) !== String(uid)) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t("duel.band"), reply_markup: menyu() });
    return;
  }
  // Bu odam duelni allaqachon boshlagan (qayta kirdi): taklif xabarini takrorlamaymiz,
  // to'g'ridan-to'g'ri holatini (davom etmoqda / natija) ko'rsatamiz — BITTA xabar.
  const xt = duelTomon({ ...d, b: yangiQoshildi ? String(uid) : d.b }, uid);
  if (!yangiQoshildi && xt && d[`${xt}_start`]) return duelBoshla(env, chatId, uid, id);
  const men = await getUser(env, uid);
  if (yangiQoshildi) {
    const tilA = await tilOl(env, d.a);
    await tilBilan(tilA, () => tg(env, "sendMessage", { chat_id: d.a, parse_mode: "HTML",
      text: t("duel.qoshildi", tilA, { ism: esc(men.name || t("duel.dost", tilA)) }) })).catch(() => {});
  }
  const ega = await getUser(env, d.a);
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: t("duel.chaqirdi", undefined, { ism: esc(ega.name || t("duel.dost")), n: DUEL_SAVOL }),
    reply_markup: { inline_keyboard: [[{ text: t("duel.btnBosh"), callback_data: `duel:b:${id}` }]] } });
}

/** Javob keldi (rejim "w"). */
async function duelJavobi(env, chatId, uid, index, faslNo, pa) {
  const d = await db.duelOl(env, faslNo);
  const x = d && duelTomon(d, uid);
  if (!x) return;
  const qs = duelSavollari(faslNo);
  if (index >= qs.length) return;
  return duelOldinga(env, chatId, uid, index, faslNo, togriMi(qs[index], pa.option_ids));
}

/** Duelda javob (yoki vaqt tugashi) hisobga olinib, keyingi savolga / yakunga o'tiladi. */
async function duelOldinga(env, chatId, uid, index, faslNo, ok0) {
  const d = await db.duelOl(env, faslNo);
  const x = d && duelTomon(d, uid);
  if (!x) return;
  const qs = duelSavollari(faslNo);
  await db.duelJavob(env, faslNo, x, ok0);
  if (index + 1 < qs.length) {
    await sendQuestion(env, chatId, uid, "w", index + 1, qs, { f: faslNo });
    return;
  }
  await db.duelTugat(env, faslNo, x);
  const yangi = await db.duelOl(env, faslNo);
  if (await db.duelYakunla(env, faslNo)) return duelNatija(env, yangi);
  const ok = x === "a" ? yangi.a_ok : yangi.b_ok;
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: t("duel.tugatdi", undefined, { ok, n: DUEL_SAVOL }) });
  // Raqib qo'shilgan, lekin hali tugatmagan: unga navbat kelganini bildiramiz (natija ikkalasi tugatgach chiqadi).
  const raqib = x === "a" ? yangi.b : yangi.a;
  const raqibBoshlagan = x === "a" ? yangi.b_start : yangi.a_start;
  // Faqat raqib HALI BOSHLAMAGAN bo'lsa eslatamiz. U test ichida bo'lsa — xabar uni chalg'itadi va tugma foydasiz
  // (natija o'zi keladi); tashlab ketsa 6 soatlik qoida ishlaydi.
  if (raqib && !raqibBoshlagan) {
    try {
      const [men, til] = await Promise.all([getUser(env, uid), tilOl(env, raqib)]);
      await tilBilan(til, () => tg(env, "sendMessage", { chat_id: raqib, parse_mode: "HTML",
        text: t("duel.raqibTugatdi", til, { ism: esc(men.name || t("duel.dost", til)) }),
        reply_markup: { inline_keyboard: [[{ text: t("duel.btnBosh", til), callback_data: `duel:b:${faslNo}` }]] } }));
    } catch (e) { console.warn("duelRaqibTugatdi", String(e).slice(0, 100)); }
  }
}

/** Raqib 6 soat ichida tugatmagan duellar: tugatgan tomon yutadi, ikkalasiga natija boradi. */
async function duelMuddatTekshir(env) {
  try {
    for (const d of await db.duelMuddat(env, 6)) await duelNatija(env, d);
  } catch (e) { console.error("duelMuddat", String(e).slice(0, 200)); }
}

async function duelNatija(env, d) {
  const [ua, ub, tilA, tilB] = await Promise.all([
    getUser(env, d.a), getUser(env, d.b), tilOl(env, d.a), tilOl(env, d.b),
  ]);
  let g = null;   // g'olib tomoni
  if (d.a_ok !== d.b_ok) g = d.a_ok > d.b_ok ? "a" : "b";
  else if (Math.abs(d.a_ms - d.b_ms) >= 1000) g = d.a_ms < d.b_ms ? "a" : "b";   // 1 soniyadan kam farq — durang

  // Har bir tomonga o'z tilida
  const yubor = (men, chat, til) => tilBilan(til, async () => {
    const nom = (u, id) => esc(u.name || `${t("duel.ishtirokchi", til)} ${String(id).slice(-3)}`);
    const qator = (u, id, ok, ms, belgi) => ok < 0
      ? `${belgi} <b>${nom(u, id)}</b> — ⏰ ${t("duel.tugatmadi", til)}`
      : `${belgi} <b>${nom(u, id)}</b> — ${ok}/${DUEL_SAVOL} · ${t("duel.soniya", til, { x: (ms / 1000).toFixed(1) })}`;
    // G'olib doim birinchi qatorda (kim yaratganidan qat'i nazar); durangda yaratuvchi birinchi
    const A = qator(ua, d.a, d.a_ok, d.a_ms, g === null ? "🤝" : g === "a" ? "🥇" : "🥈");
    const B = qator(ub, d.b, d.b_ok, d.b_ms, g === null ? "🤝" : g === "b" ? "🥇" : "🥈");
    const tark = d.a_ok < 0 || d.b_ok < 0;
    const jadval = (g === "b" ? B + "\n" + A : A + "\n" + B) + (tark ? "\n<i>⏰ " + t("duel.tarkNota", til) + "</i>" : "");
    const kalit = g === null ? "duel.durang" : g === men ? "duel.yutdi" : "duel.yutqazdi";
    await tg(env, "sendMessage", { chat_id: chat, parse_mode: "HTML", text: t(kalit, til, { jadval }),
      reply_markup: { inline_keyboard: [[{ text: t("duel.yangi", til), callback_data: "duel:yangi" }]] } }).catch(() => {});
  });
  await yubor("a", d.a, tilA);
  await yubor("b", d.b, tilB);
}

// ——————————————————————————————————————————————— o'z tezligida rejim

async function startSeq(env, chatId, uid) {
  const u = await getUser(env, uid);
  const qs = questionsFor("s", uid, u);
  await sendQuestion(env, chatId, uid, "s", 0, qs);
}

// ——————————————————————————————————————————————— kitob marafoni

function joriyFasl(u) {
  return Math.min((u.kitob || 0) + 1, KITOB_JAMI);
}

/**
 * Kitob marafonining tildan qat'i nazar umumiy yordamchilari.
 *
 * Ikki til uchun funksiyalar NUSXALANMADI: rus bo'limi aynan shu
 * funksiyalarning `lang` parametri bilan ishlaydi. Nusxalash ikki
 * barobar kod va ikki barobar xato manbai bo'lardi — tuzatish bir
 * joyda qilinib, ikkinchisida unutilishi muqarrar.
 */
const RU = "ru";
const kitobRejim = (lang) => (lang === RU ? "r" : "k");
// Kitob progressi tilga bog'liq emas (bitta kitob): ikkala ustun doim teng saqlanadi.
const kitobBosqich = (u, _lang) => Math.max(u.kitob || 0, u.kitob_ru || 0);

function kitobBosqichYoz(u, _lang, qiymat) {
  u.kitob = qiymat;
  u.kitob_ru = qiymat;
}

/** Shu tilda savollari bor eng oxirgi fasl. Tarjima to'liq bo'lmasa chegaralaydi. */
function kitobOxirgi(lang) {
  if (lang !== RU) return KITOB_JAMI;
  const bor = faslTayyorRu();
  return bor.length ? Math.max(...bor) : 0;
}

// Marafon tili foydalanuvchi tiliga ergashadi: rus tili → rus kitobi, qolgani → o'zbek kitobi.
const kitobTil = () => (joriyTil() === "ru" ? RU : "uz");
async function kitobMenyu(env, chatId, uid, lang = kitobTil()) {
  return kitobMenyuUmumiy(env, chatId, uid, lang);
}

/**
 * Rus bo'limi menyusi.
 *
 * Iqtiboslar haqidagi ogohlantirish ataylab shu yerda: o'zbekcha
 * izohlardagi iqtiboslar kitob matniga harfma-harf tekshirilgan, ruscha
 * iqtiboslar esa tarjima. Foydalanuvchi ularni rasmiy rus nashridan
 * olingan ko'chirma deb o'ylamasligi kerak.
 */
/** Keyingi faslga o'tish uchun kerak bo'lgan to'g'ri javoblar ulushi (90%). */
const O_TISH_FOIZ = 0.9;
const otishBali = (jami) => Math.ceil(jami * O_TISH_FOIZ - 1e-9);
const KITOB_NOMI = { uz: "Ilm olish sirlari", ru: "Секреты обретения знаний" };

/** Raqamli tugmalar: ochilgan har bir faslga to'g'ridan-to'g'ri kirish. */
function faslTugmalari(pref, ochiq) {
  const ru = pref === "kr";
  const qatorlar = [];
  for (let i = 1; i <= ochiq; i += 3) {
    const qator = [];
    for (let f = i; f < i + 3 && f <= ochiq; f++)
      qator.push({ text: ru ? `${f}-глава` : `${f}-fasl`, callback_data: `${pref}:${f}` });
    qatorlar.push(qator);
  }
  return qatorlar;
}

/**
 * Marafon menyusi (ikkala til uchun bitta funksiya).
 *
 * Fasllar ketma-ket ochiladi: keyingisi faqat joriy faslda kamida 90%
 * (10 savolda 9 ta) to'g'ri javob bergandan keyin. Ochilgan har qanday
 * faslga esa istalgan vaqt qaytish mumkin — raqamli tugmalar shu uchun.
 * Rus bo'limi tarjima: iqtiboslar o'zbekcha nashrdan tarjima qilingan.
 */
async function kitobMenyuUmumiy(env, chatId, uid, lang) {
  const ru = lang === RU;
  const u = await getUser(env, uid);
  const oxirgi = kitobOxirgi(lang);
  const done = Math.min(kitobBosqich(u, lang), oxirgi);
  const joriy = Math.min(done + 1, oxirgi);
  const tugagan = done >= oxirgi;
  const nom = KITOB_NOMI[ru ? "ru" : "uz"];
  const pref = ru ? "kr" : "k";
  const soni = faslSavolSoni(joriy, lang);

  const satrlar = [];
  for (let f = 1; f <= oxirgi; f++) {
    const belgi = f <= done ? "✅" : f === joriy ? "▶️" : "🔒";
    satrlar.push(`${belgi} ${ru ? faslSarlavha(f, RU) : faslLabel(f)}`);
  }

  const tugma = [
    tugagan
      ? [{ text: ru ? "🔁 Пройти заново" : "🔁 Boshidan takrorlash", callback_data: `${pref}:1` }]
      : [{ text: ru ? `▶️ ${nom} · глава ${joriy}` : `▶️ ${nom} · ${joriy}-fasl`, callback_data: `${pref}:${joriy}` }],
    ...faslTugmalari(pref, done),
  ];

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: ru
      ? `📕 <b>Марафон «${nom}»</b>\n<i>Имам аз-Зарнуджи — Та'лим аль-мута'аллим</i>\n\n` +
        `${progressBar(done, oxirgi)}  <b>${done}/${oxirgi}</b> глав\n\n${satrlar.join("\n")}\n\n` +
        (tugagan
          ? `🎓 <b>Поздравляем! Вы прошли весь марафон.</b>`
          : `В главе <b>${soni}</b> вопросов. Чтобы открыть следующую главу, нужно ответить правильно ` +
            `минимум на <b>${otishBali(soni)} из ${soni}</b> (90%). На каждый вопрос даётся время (⏱). ` +
            `Пройденные главы можно открыть в любой момент — кнопки ниже.`) +
        `\n\n<i>Цитаты переведены с узбекского издания.</i>`
      : `📖 <b>«${nom}» marafoni</b>\n<i>Imom Zarnujiy — Ta'limul muta'allim</i>\n\n` +
        `${progressBar(done)}  <b>${done}/${KITOB_JAMI}</b> fasl\n\n${satrlar.join("\n")}\n\n` +
        (tugagan
          ? `🎓 <b>Tabriklaymiz! Kitobni to'liq yakunladingiz.</b>`
          : `Faslda <b>${soni}</b> ta savol. Keyingi faslni ochish uchun kamida ` +
            `<b>${otishBali(soni)}/${soni}</b> (90%) to'g'ri javob kerak. ` +
            `Har savolga vaqt beriladi (⏱). Ochilgan fasllarga istalgan payt qaytishingiz mumkin — pastdagi tugmalar.`),
    reply_markup: { inline_keyboard: tugma },
  });
}

// ——————————————————————————————————————————————— Arab alifbosi (alohida bo'lim)

const arabSavollari = (uid, n) => arabBlok(bank, n, uid);

async function arabMenyu(env, chatId, uid) {
  const jami = ARAB_BLOKLAR.length;
  const done = Math.min(await db.arabBosqich(env, uid), jami);
  const joriy = Math.min(done + 1, jami);
  const tugagan = done >= jami;
  const satrlar = ARAB_BLOKLAR.map((b) => {
    const belgi = b.n <= done ? "✅" : b.n === joriy ? "▶️" : "🔒";
    return `${belgi} ${b.n}-blok · ${b.ad}`;
  });
  const tugma = [
    tugagan
      ? [{ text: "🔁 Boshidan takrorlash", callback_data: "a:1" }]
      : [{ text: `▶️ Arab alifbosi · ${joriy}-blok`, callback_data: `a:${joriy}` }],
  ];
  for (let i = 1; i <= done; i += 3) {
    const q = [];
    for (let n = i; n < i + 3 && n <= done; n++) q.push({ text: `${n}-blok`, callback_data: `a:${n}` });
    tugma.push(q);
  }
  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `🔤 <b>Arab alifbosi</b>\n<i>«Muallim soniy» kitobi asosida</i>\n\n` +
      `${progressBar(done, jami)}  <b>${done}/${jami}</b> blok\n\n` +
      `${satrlar.join("\n")}\n\n` +
      (tugagan
        ? `🎓 <b>Tabriklaymiz! Barcha bloklarni o'zlashtirdingiz.</b>`
        : `Keyingi blokni ochish uchun joriy blokda <b>100%</b> (barcha savollarga to'g'ri javob) kerak. ` +
          `Har blokdan oldin <b>qo'llanma rasmi</b> yuboriladi. Vaqt cheklanmagan — shoshilmang. ` +
          `O'tilgan bloklarga istalgan payt qaytishingiz mumkin — pastdagi tugmalar.`),
    reply_markup: { inline_keyboard: tugma },
  });
}

async function startArab(env, chatId, uid, n) {
  const blok = ARAB_BLOKLAR.find((b) => b.n === n);
  const qs = blok ? arabSavollari(uid, n) : [];
  if (!qs.length) return arabMenyu(env, chatId, uid);

  const done = await db.arabBosqich(env, uid);
  if (n > done + 1) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `🔒 <b>${n}-blok hali ochilmagan.</b>\n\nAvval ${done + 1}-blokni 100% bilan yakunlang.`,
    });
    return arabMenyu(env, chatId, uid);
  }

  const berilgan = await db.faslJavoblari(env, uid, n, "a");
  const bor = new Set(berilgan.map((r) => r.idx));
  let keyingi = 0;
  while (keyingi < qs.length && bor.has(keyingi)) keyingi++;
  if (keyingi >= qs.length) {
    await db.faslTozala(env, uid, n, "a");
    keyingi = 0;
  }

  if (keyingi === 0) {
    await qollanmaYubor(env, chatId, blok.qol);
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `🔤 <b>${n}-blok · ${blok.ad}</b>\n\nSavollar: <b>${qs.length}</b> ta · vaqt cheklanmagan, shoshilmang\n` +
            `Qo'llanma rasmiga qarab javob bering. Omad! 🍀`,
    });
  } else {
    await tg(env, "sendMessage", { chat_id: chatId, text: `▶️ Davom etamiz — ${keyingi + 1}/${qs.length}-savol:` });
  }
  await sendQuestion(env, chatId, uid, "a", keyingi, qs, { f: n });
}

async function finishArab(env, chatId, uid, n, jami) {
  const blok = ARAB_BLOKLAR.find((b) => b.n === n);
  const berilgan = await db.faslJavoblari(env, uid, n, "a");
  const ball = new Set(berilgan.filter((r) => r.correct).map((r) => r.idx)).size;   // har savol bir marta
  const foiz = Math.round((ball / jami) * 100);
  const otdi = ball >= jami;                         // 100% — hammasi to'g'ri
  const oldingi = await db.arabBosqich(env, uid);
  if (otdi) await db.arabYakunla(env, uid, n, ball, jami);
  const done = Math.max(oldingi, otdi && n <= oldingi + 1 ? n : 0);
  const jamiBlok = ARAB_BLOKLAR.length;
  const menyuTugma = [{ text: "🔤 Arab alifbosi — menyu", callback_data: "amenu" }];

  let tugma, izoh;
  if (!otdi) {
    izoh = `📖 Qo'llanma rasmiga qarab yana urinib ko'ring.\n\n` +
           `🔒 Keyingi blokni ochish uchun <b>100%</b> (${jami}/${jami}) kerak.`;
    tugma = [[{ text: `🔁 Arab alifbosi · ${n}-blok: qayta urinish`, callback_data: `a:${n}` }], menyuTugma];
  } else if (done >= jamiBlok) {
    izoh = `🏆 Mukammal! \n\n🎓 <b>Barcha bloklar o'zlashtirildi!</b>`;
    tugma = [menyuTugma];
  } else {
    izoh = `🏆 Mukammal! Blok to'liq o'zlashtirildi.`;
    tugma = [[{ text: `▶️ Arab alifbosi · ${done + 1}-blok`, callback_data: `a:${done + 1}` }], menyuTugma];
  }
  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `🔤 <b>${n}-blok · ${blok?.ad || ""}</b>\n\n` +
      `Natija: <b>${ball}/${jami}</b> — ${foiz}%\n${izoh}\n\n` +
      `${progressBar(done, jamiBlok)}  <b>${done}/${jamiBlok}</b> blok`,
    reply_markup: { inline_keyboard: tugma },
  });
}

async function startFasl(env, chatId, uid, faslNo, lang = "uz") {
  const u = await getUser(env, uid);
  const ru = lang === RU;
  const done = kitobBosqich(u, lang);
  const joriy = ru ? Math.min(done + 1, kitobOxirgi(RU)) : joriyFasl(u);

  if (faslNo > joriy) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: ru
        ? `🔒 <b>Глава ${faslNo} ещё не открыта.</b>\n\nСначала завершите главу ${joriy}.`
        : `🔒 <b>${faslNo}-fasl hali ochilmagan.</b>\n\nAvval ${joriy}-faslni yakunlashingiz kerak.`,
    });
    return kitobMenyu(env, chatId, uid, lang);
  }

  const qs = faslQuestions(faslNo, uid, faslNo <= done ? 1 : 0, lang);
  if (!qs.length) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: ru ? "Вопросы для этой главы пока не добавлены."
               : "Bu faslga savollar hali qo'shilmagan.",
    });
    return;
  }

  // Yarim yo'lda to'xtab qolgan bo'lsa — o'sha yerdan davom etamiz,
  // boshidan qayta boshlamaymiz.
  const rejim = kitobRejim(lang);
  const berilgan = await db.faslJavoblari(env, uid, faslNo, rejim);
  const bor = new Set(berilgan.map((r) => r.idx));
  let keyingi = 0;
  while (keyingi < qs.length && bor.has(keyingi)) keyingi++;
  if (keyingi >= qs.length) {
    await db.faslTozala(env, uid, faslNo, rejim);
    keyingi = 0;
  }

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      keyingi === 0
        ? ru
          ? `${faslSarlavha(faslNo, RU)}\n\n` +
            `Вопросов: <b>${qs.length}</b>\n` +
            `Этап: <b>${faslNo}/${kitobOxirgi(RU)}</b>\n\nУдачи! 🍀`
          : `${faslLabel(faslNo)}\n\n` +
            `Savollar soni: <b>${qs.length}</b> ta\n` +
            `Bosqich: <b>${faslNo}/${KITOB_JAMI}</b>\n\nOmad! 🍀`
        : ru
          ? `▶️ Продолжаем — вопрос ${keyingi + 1}/${qs.length}:`
          : `▶️ Davom etamiz — ${keyingi + 1}/${qs.length}-savol:`,
  });
  await sendQuestion(env, chatId, uid, rejim, keyingi, qs, { f: faslNo });
}

async function finishFasl(env, chatId, uid, faslNo, total, oxirgi, lang = "uz") {
  const ru = lang === RU;
  const rejim = kitobRejim(lang);
  const oxirgiFasl = kitobOxirgi(lang);

  const berilgan = await db.faslJavoblari(env, uid, faslNo, rejim);
  const ball = new Set(berilgan.filter((r) => r.correct).map((r) => r.idx)).size;   // har savol bir marta
  const foiz = Math.round((ball / total) * 100);

  const u = await getUser(env, uid);
  const oldingi = kitobBosqich(u, lang);
  const otdi = ball >= otishBali(total);              // 10 savolda kamida 9 ta
  const ochiqEdi = faslNo <= oldingi;                  // oldin o'tilgan fasl — takrorlash
  if (otdi && faslNo > oldingi) {
    kitobBosqichYoz(u, lang, faslNo);
    await saveUser(env, uid, u);
  }
  if (otdi || ochiqEdi) await db.faslYakunla(env, uid, faslNo, ball, total, lang);

  const baho = ru
    ? (foiz === 100 ? "🏆 Отлично! Глава усвоена полностью."
      : otdi ? "👏 Очень хорошо. Содержание главы усвоено."
      : "📖 Перечитайте главу и попробуйте ещё раз — материал пока не закрепился.")
    : (foiz === 100 ? "🏆 Mukammal! Faslni to'liq o'zlashtirdingiz."
      : otdi ? "👏 Juda yaxshi. Fasl mazmuni o'zlashtirilgan."
      : "📖 Faslni qayta o'qib chiqib, yana urinib ko'ring — mazmuni hali mustahkamlanmagan.");

  const done = Math.max(oldingi, otdi ? faslNo : 0);
  const tugadi = done >= oxirgiFasl;
  const pref = ru ? "kr" : "k";
  const nom = KITOB_NOMI[ru ? "ru" : "uz"];
  const menyuTugma = [{ text: ru ? `📕 ${nom} — меню` : `📖 ${nom} — menyu`,
                        callback_data: ru ? "kmenu_ru" : "kmenu" }];

  let tugma;
  let otishMatni = "";
  if (!otdi && !ochiqEdi) {
    // O'tmadi: keyingi fasl yopiq qoladi, faqat qayta urinish
    otishMatni = ru
      ? `\n\n🔒 Чтобы открыть главу ${faslNo + 1}, нужно минимум <b>${otishBali(total)}/${total}</b>.`
      : `\n\n🔒 Keyingi faslni ochish uchun kamida <b>${otishBali(total)}/${total}</b> to'g'ri javob kerak.`;
    tugma = [[{ text: ru ? `🔁 ${nom} · глава ${faslNo}: ещё раз` : `🔁 ${nom} · ${faslNo}-fasl: qayta urinish`,
                callback_data: `${pref}:${faslNo}` }], menyuTugma];
  } else if (tugadi) {
    tugma = [[{ text: ru ? "📊 Мои результаты" : "📊 Natijalarim", callback_data: "stats" }], menyuTugma];
  } else {
    tugma = [[{ text: ru ? `▶️ ${nom} · глава ${done + 1}` : `▶️ ${nom} · ${done + 1}-fasl`,
                callback_data: `${pref}:${done + 1}` }], menyuTugma];
  }

  // Marafon yakuni uchun umumiy natija. Ilgari bu yerda u.kitobBall va
  // u.kitobJavob ishlatilardi — ular KV davrining maydonlari edi va D1 ga
  // ko'chgandan keyin mavjud emas. Natijada marafonni tugatgan odam
  // "undefined/undefined" degan yozuvni ko'rardi. Endi jami bazadan olinadi.
  let yakun = otishMatni;
  if (tugadi && (otdi || ochiqEdi)) {
    const j = await db.faslJamiNatija(env, uid, lang);
    yakun = ru
      ? `\n\n🎓 <b>МАРАФОН ЗАВЕРШЁН!</b>\n\n` +
        `Вы прошли все ${oxirgiFasl} этапов книги «Секреты обретения знаний».\n` +
        `Общий результат: <b>${j.ball}/${j.jami}</b> ` +
        `(${j.jami ? Math.round((j.ball / j.jami) * 100) : 0}%)\n\n` +
        `<i>«Обретай знание всякий час — оно украшение и достоинство для людей знания.»</i>`
      : `\n\n🎓 <b>MARAFON YAKUNLANDI!</b>\n\n` +
        `Siz «Ilm olish sirlari» kitobining barcha ${oxirgiFasl} bosqichini o'tdingiz.\n` +
        `Umumiy natija: <b>${j.ball}/${j.jami}</b> ` +
        `(${j.jami ? Math.round((j.ball / j.jami) * 100) : 0}%)\n\n` +
        `<i>«Ilm o'rgan har on, ilm ahliga ziynatu fazilat.»</i>`;
  }

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `${faslSarlavha(faslNo, lang)}\n\n` +
      (ru ? `Результат: <b>${ball}/${total}</b> — ${foiz}%\n${baho}\n\n`
          : `Natija: <b>${ball}/${total}</b> — ${foiz}%\n${baho}\n\n`) +
      `${progressBar(done, oxirgiFasl)}  <b>${done}/${oxirgiFasl}</b> ` +
      (ru ? "глав" : "fasl") + yakun,
    reply_markup: { inline_keyboard: tugma },
  });
}

// ——————————————————————————————————————————————— javob qabul qilish

/**
 * «🔁 Xatolarim» — xatolar banki.
 *
 * Bu botdagi eng kuchli ta'sirli bo'lim bo'lishi mumkin, va shu paytgacha
 * mavjud emas edi: javoblar bazaga yozilardi, lekin foydalanuvchi o'z
 * xatolarini ko'ra olmasdi. Yangi savol berish oson, ilgari xato qilgan
 * savolni aynan kerakli paytda qaytarish esa qiyin — lekin xotirada
 * qoladigani shunisi.
 */
async function xatolarMenyu(env, chatId, uid) {
  // Matni topilmaydigan yozuvlar sanalmaydi: foydalanuvchiga "12 ta xato"
  // deb aytib, keyin faqat 9 tasini ko'rsatish — ishonchni buzadi.
  const xomRoyxat = await db.xatoRoyxat(env, uid, 200);
  const royxat = xomRoyxat.filter((r) => savolTop(r.qid));

  if (!royxat.length) {
    const st = await db.statistika(env, uid);
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: st.jami
        ? t("takror.bosh")
        : t("takror.yangi", undefined, { kunlik: t("tugma.kunlik"), marafon: t("tugma.marafon") }),
      reply_markup: st.jami ? menyu() : keyingiTugmalar(["kunlik", "marafon"]),
    });
    return;
  }

  const tayyor = royxat.filter((r) => r.tayyor);
  // Mavzular kesimi — qayerda zaiflik borligini ko'rsatadi.
  const mavzular = {};
  for (const r of royxat) mavzular[r.topic || "Boshqa"] = (mavzular[r.topic || "Boshqa"] || 0) + 1;
  const mavzuSatr = Object.entries(mavzular)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([t, n]) => `   ${topicLabel(t)} — ${n} ta`).join("\n");

  // Fokus — hozir qilinadigan savollarda; umumiy son faqat kichik izoh sifatida.
  const keyingi = tayyor.length ? null : Math.min(...royxat.map((r) => r.kutish - (r.kun || 0)));
  const yaqin = keyingi !== null && isFinite(keyingi)
    ? t("takror.yaqin", undefined, { kun: Math.max(1, Math.ceil(keyingi)) }) : "";
  const fokus = tayyor.length
    ? t("takror.fokus", undefined, { soni: tayyor.length, jami: royxat.length })
    : t("takror.fokusYoq", undefined, { yaqin, jami: royxat.length });

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `${t("takror.sarlavha")}\n\n${fokus}\n\n` +
      `${t("takror.mavzu")}\n${mavzuSatr}\n\n` +
      t("takror.pastki"),
    reply_markup: {
      inline_keyboard: [[{
        text: tayyor.length ? t("takror.tugmaHozir", undefined, { soni: tayyor.length }) : t("takror.tugmaBaribir"),
        callback_data: "xato:boshla",
      }]],
    },
  });
}

/**
 * Takrorlash seansining keyingi savolini yuboradi.
 *
 * Seans holati hech qayerda saqlanmaydi va saqlanishi ham kerak emas:
 * ro'yxat har javobdan keyin o'z-o'zidan qisqaradi. To'g'ri javob bergan
 * savol bankdan chiqadi, xato javob bergani esa "oxirgi urinish — hozir"
 * bo'lib muddatini orqaga suradi. Shuning uchun "navbatdagi savol" har
 * safar qaytadan hisoblansa ham, bir savol ikki marta kelmaydi.
 */
async function xatoSavol(env, chatId, uid, index) {
  const xom = await db.xatoRoyxat(env, uid, 50);

  // Matni topilmaydigan qid'lar BU YERDA chiqarib tashlanadi.
  // Ilgari ular pastda alohida tarmoqda "hal qilinardi": bo'sh matn bilan
  // yozuv qo'shilib, funksiya o'zini qayta chaqirardi. Bo'sh matnning qid'i
  // har safar bir xil bo'lgani uchun noma'lum qid ro'yxatdan chiqmasdi va
  // sikl uzilmasdi — bazaga 3500 ta keraksiz qator yozilgan edi.
  // Filtrlash siklni ham, yozuvni ham keraksiz qiladi.
  const royxat = xom.filter((r) => savolTop(r.qid));
  const nomzod = royxat.find((r) => r.tayyor) || royxat[0];

  if (!nomzod || index >= XATO_BATCH) {
    const qolgan = royxat.length;
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: index === 0
        ? `Takrorlash uchun savol topilmadi.`
        : `✅ <b>Takrorlash yakunlandi — ${index} ta savol.</b>\n\n` +
          (qolgan
            ? `Bankda yana <b>${qolgan} ta</b> tuzatilmagan savol bor.`
            : `Bank bo'shadi. Barakalla! 🎉`),
      reply_markup: menyu(),
    });
    return;
  }

  // Foydalanuvchi hozirgi tilida ko'radi; xato esa asl qid bo'yicha tuzatiladi.
  const q = savolTilda(savolTop(nomzod.qid), joriyTil());

  if (index === 0) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `🔁 <b>Xatolarni takrorlash</b>\n\n` +
        `Ilgari xato qilgan savollaringiz. Taymer yo'q — shoshilmang, ` +
        `javobdan keyin izohni o'qing.`,
    });
  }

  await sendQuestionXato(env, chatId, uid, index, q, nomzod.qid);
}

/** Takrorlash savolini yuborish — qid bilan birga saqlanadi. */
async function sendQuestionXato(env, chatId, uid, index, q, asl = null) {
  const izoh = q.e ? clip(q.e, 200) : clip(q.t ? topicLabel(q.t) : turLabel(q.k), 200);
  const sv = await savolVariantlari(env, chatId, q);
  const payload = {
    chat_id: chatId,
    question: clip(`🔁 Takror ${index + 1} / ${XATO_BATCH}\n${q.q}`, 300),
    options: sv.options,
    type: "quiz",
    ...togriParam(q),
    is_anonymous: false,
    explanation: izoh,
  };
  if (sv.media) payload.media = sv.media;
  let res = await tg(env, "sendPoll", payload);
  if ((!res.ok || mediaYetmadi(res, sv)) && (sv.media || sv.variantMedia)) {
    if (res.ok) await tg(env, "deleteMessage", { chat_id: chatId, message_id: res.result.message_id }).catch(() => {});
    delete payload.media;
    payload.options = (await savolVariantlari(env, chatId, q, true)).options;
    res = await tg(env, "sendPoll", payload);
  }
  if (res.ok && res.result?.poll?.id) {
    await db.pollSaqla(env, res.result.poll.id,
      { u: uid, i: index, m: "x", c: chatId, msg: res.result.message_id, qid: asl || db.qid(q.q) });
    return true;
  }
  console.error("sendPoll (xato)", JSON.stringify(res));
  return false;
}

/**
 * «🎯 Yo'nalishim» — kunlik viktorina mavzusini tanlash.
 *
 * Savol SONI o'zgarmaydi, faqat mavzu o'zgaradi. Shuning uchun reyting
 * adolatli qoladi: hamma bir xil sonda savol ishlaydi.
 */
async function yonalishMenyu(env, chatId, uid) {
  const u = await getUser(env, uid);
  const hozir = u.yonalish || "aralash";
  const soni = KUNLIK_SHAXSIY;

  const tugmalar = YONALISHLAR.map((y) => {
    const n = y.k === "aralash" ? bank.length : bank.filter((q) => q.t === y.k).length;
    return [{ text: `${y.k === hozir ? "✅" : y.ok} ${y.ad} · ${n}`, callback_data: `y:${y.k}` }];
  });

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `🎯 <b>Kunlik viktorina yo'nalishi</b>\n\n` +
      `<blockquote>Hozirgi tanlov: <b>${YONALISHLAR.find((y) => y.k === hozir)?.ad || hozir}</b></blockquote>\n\n` +
      `Yo'nalish faqat <b>mavzuni</b> o'zgartiradi. Savol soni hammada bir xil — bugun <b>${soni} ta</b>, ` +
      `shuning uchun reyting adolatli qoladi: kim qaysi yo'nalishni tanlasa ham, maksimal ball bitta.\n\n` +
      `<i>Tugma oxiridagi raqam — o'sha mavzudagi savollar soni.</i>`,
    reply_markup: { inline_keyboard: tugmalar },
  });
}

async function yonalishTanla(env, chatId, uid, kalit) {
  const y = YONALISHLAR.find((x) => x.k === kalit);
  if (!y) return;

  const u = await getUser(env, uid);
  u.yonalish = kalit === "aralash" ? null : kalit;
  await saveUser(env, uid, u);

  const soni = KUNLIK_SHAXSIY;
  const pool = kalit === "aralash" ? bank.length : bank.filter((q) => q.t === kalit).length;
  // Takror xavfini ochiq aytamiz — "baza tugadi" degan hisni kutilmagan
  // qilib qoldirgandan ko'ra, oldindan bilgani yaxshi.
  const ogoh = kalit !== "aralash" && pool < soni * 20
    ? `\n\n⚠️ Bu mavzuda ${pool} ta savol bor. Kuniga ${soni} ta berilsa, ` +
      `taxminan ${Math.floor(pool / soni)} kundan keyin savollar takrorlana boshlaydi. ` +
      `Baza to'ldirilib boriladi.`
    : ``;

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `✅ Yo'nalish o'zgardi: <b>${y.ok} ${y.ad}</b>\n\n` +
      `Ertangi kunlik viktorina shu mavzudan bo'ladi. Savol soni o'zgarmaydi.` +
      ogoh,
    reply_markup: menyu(),
  });
}

async function handleAnswer(env, pa) {
  // Kalitni olamiz — shu savolni oldinga surish huquqi bittada bo'ladi.
  // Javob bergan odam savolning egasi ekanini kalitni olishdan oldin tekshiramiz.
  const rec = await navbatniOl(env, pa.poll_id, (r) => !!pa.user && pa.user.id === r.u);
  if (!rec) return;
  const { u: uid, i: index, m: mode, c: chatId, f: faslNo } = rec;

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

  if (mode === "x") {
    // Takrorlash rejimi: savol qid bo'yicha aniqlanadi, indeks bo'yicha emas —
    // ro'yxat javobdan keyin qisqaradi, shuning uchun indeks ishonchsiz.
    const q = savolTop(rec.qid);
    if (!q) return;
    const ok = togriMi(q, pa.option_ids);
    await db.javobYoz(env, { uid, mode: "x", idx: index, savol: q.q,
      topic: q.t || "Kitob", ok });
    await xatoSavol(env, chatId, uid, index + 1);
    return;
  }

  if (mode === "w") return duelJavobi(env, chatId, uid, index, faslNo, pa);

  if (mode === "a") {
    const qs = arabSavollari(uid, faslNo);
    if (index >= qs.length) return;
    const q = qs[index];
    const ok = togriMi(q, pa.option_ids);
    await db.javobYoz(env, { uid, mode: "a", fasl: faslNo, idx: index, savol: q.q, topic: "Arab", ok });
    if (index + 1 >= qs.length) await finishArab(env, chatId, uid, faslNo, qs.length);
    else await sendQuestion(env, chatId, uid, "a", index + 1, qs, { f: faslNo });
    return;
  }

  if (mode === "k" || mode === "r") {
    const lang = mode === "r" ? RU : "uz";
    const u0 = await getUser(env, uid);
    const qs = faslQuestions(faslNo, uid, faslNo <= kitobBosqich(u0, lang) ? 1 : 0, lang);
    if (index >= qs.length) return;

    const q = qs[index];
    const ok = togriMi(q, pa.option_ids);
    await db.javobYoz(env, { uid, mode, fasl: faslNo, idx: index,
      savol: q.q, topic: mode === "r" ? "Книга" : "Kitob", ok });

    if (index + 1 >= qs.length) await finishFasl(env, chatId, uid, faslNo, qs.length, ok, lang);
    else await sendQuestion(env, chatId, uid, mode, index + 1, qs, { f: faslNo });
    return;
  }


  if (mode === "d") {
    const questions = questionsFor("d", uid, await getUser(env, uid));
    const total = questions.length;
    if (index >= total) return;

    const q = questions[index];
    const ok = togriMi(q, pa.option_ids);
    await db.javobYoz(env, { uid, mode: "d", day: dayKey(), idx: index,
      savol: q.q, topic: q.t, ok });

    if (index + 1 >= total) await finishDaily(env, chatId, uid, total, name, { [index]: ok ? "1" : "0" });
    else await sendQuestion(env, chatId, uid, "d", index + 1, questions);
    return;
  }

  // "o'z tezligimda"
  const u = await getUser(env, uid);
  const qs = questionsFor("s", uid, u);
  if (index >= qs.length) return;
  const q = qs[index];
  const ok = togriMi(q, pa.option_ids);
  await db.javobYoz(env, { uid, mode: "s", idx: index, savol: q.q, topic: q.t, ok });

  if (index + 1 < SEQ_BATCH) {
    await sendQuestion(env, chatId, uid, "s", index + 1, qs);
  } else {
    const u2 = await getUser(env, uid);
    u2.seq = ((u2.seq || 0) + SEQ_BATCH) % seqOrder().length;
    await saveUser(env, uid, u2);
    const st2 = await db.statistika(env, uid);
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `✅ <b>${SEQ_BATCH} ta savol yakunlandi.</b>\n\n` +
        `Umumiy natijangiz: <b>${st2.togri}/${st2.jami}</b> ` +
        `(${st2.jami ? Math.round((st2.togri / st2.jami) * 100) : 0}%)\n\n` +
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
/**
 * Ketma-ket 3 ta savol vaqt tugab javobsiz qolsa, viktorina to'xtatiladi
 * (Telegram'ning @QuizBot'idagi kabi): foydalanuvchi yo'q bo'lsa, bot savol yuborishda davom etmaydi.
 * To'xtatilgan bo'lsa true qaytaradi.
 */
async function uchOtkazibYuborildi(env, chatId, uid, mode, { day, fasl } = {}) {
  const n = await db.ketmaKetOtkazilgan(env, uid, mode, day, fasl);
  if (n < 3) return false;
  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: t("otkazish.toxtadi"),
    reply_markup: mode === "d"
      ? { inline_keyboard: [[{ text: t("otkazish.davom"), callback_data: "davom_d" }]] }
      : menyu(),
  });
  return true;
}

async function savolniOtkaz(env, pollId) {
  // Kalitni olamiz. Ololmasak — bu savolni allaqachon boshqa yo'l
  // (javob berish yoki tugma) oldinga surgan, biz aralashmaymiz.
  const rec = await navbatniOl(env, pollId);
  if (!rec) return;
  const { u: uid, i: index, m: mode, c: chatId, f: faslNo, msg: msgId } = rec;

  const javobniOchib = async (q) => {
    if (msgId) {
      const r = await tg(env, "stopPoll", { chat_id: chatId, message_id: msgId }).catch((e) => ({ ok: false, description: String(e) }));
      // Yopilgan pollning o'zi to'g'ri javobni ko'rsatadi — alohida matn yubormaymiz.
      if (!r.ok && !/closed|already/i.test(r.description || "")) console.error("stopPoll", JSON.stringify(r).slice(0, 200));
    }
    // Alohida «Vaqt tugadi» xabari yo'q: yopilgan pollning o'zi to'g'ri javobni ko'rsatadi.
  };

  if (mode === "d") {
    const questions = questionsFor("d", uid, await getUser(env, uid));
    if (index >= questions.length) return;
    await db.javobYoz(env, { uid, mode: "d", day: dayKey(), idx: index,
      savol: questions[index].q, topic: questions[index].t, ok: false, skipped: true });
    await javobniOchib(questions[index]);
    if (await uchOtkazibYuborildi(env, chatId, uid, "d", { day: dayKey() })) return;
    // Hozirgina yozilgan javobni finishDaily ga qo'lma-qo'l uzatamiz: KV
    // darhol yangilanmaydi va u eski qiymatni o'qib, ballni noto'g'ri sanashi mumkin.
    if (index + 1 >= questions.length) await finishDaily(env, chatId, uid, questions.length, "", { [index]: "0" });
    else await sendQuestion(env, chatId, uid, "d", index + 1, questions);
    return;
  }

  if (mode === "a") {
    const qs = arabSavollari(uid, faslNo);
    if (index >= qs.length) return;
    await db.javobYoz(env, { uid, mode: "a", fasl: faslNo, idx: index, savol: qs[index].q, topic: "Arab", ok: false, skipped: true });
    await javobniOchib(qs[index]);
    if (await uchOtkazibYuborildi(env, chatId, uid, "a", { fasl: faslNo })) return;
    if (index + 1 >= qs.length) await finishArab(env, chatId, uid, faslNo, qs.length);
    else await sendQuestion(env, chatId, uid, "a", index + 1, qs, { f: faslNo });
    return;
  }

  // Marafon (k/r) taymerli: vaqt tugaganda ham, "Davom etish" bosilganda ham shu yerga keladi.
  if (mode === "k" || mode === "r") {
    const lang = mode === "r" ? RU : "uz";
    const u0 = await getUser(env, uid);
    const qs = faslQuestions(faslNo, uid, faslNo <= kitobBosqich(u0, lang) ? 1 : 0, lang);
    if (index >= qs.length) return;
    await db.javobYoz(env, { uid, mode, fasl: faslNo, idx: index,
      savol: qs[index].q, topic: mode === "r" ? "Книга" : "Kitob",
      ok: false, skipped: true });
    await javobniOchib(qs[index]);
    if (await uchOtkazibYuborildi(env, chatId, uid, mode, { fasl: faslNo })) return;
    if (index + 1 >= qs.length) await finishFasl(env, chatId, uid, faslNo, qs.length, false, lang);
    else await sendQuestion(env, chatId, uid, mode, index + 1, qs, { f: faslNo });
    return;
  }

  if (mode === "w") {
    const qs = duelSavollari(faslNo);
    if (index >= qs.length) return;
    await javobniOchib(qs[index]);
    return duelOldinga(env, chatId, uid, index, faslNo, false);
  }

  if (mode === "s") {
    const u = await getUser(env, uid);
    const qs = questionsFor("s", uid, u);
    if (index >= qs.length) return;
    await javobniOchib(qs[index]);
    if (index + 1 < SEQ_BATCH) await sendQuestion(env, chatId, uid, "s", index + 1, qs);
  }
}

/**
 * Ichki zaxira taymer — Telegram'ning xabariga bog'liq emas.
 *
 * Bitta savolni avtomatik o'tkazadi, so'ng byudjet tugasa foydalanuvchiga
 * "Davom etish" tugmasini beradi. Workers fon ishini ~30 soniyada to'xtatgani
 * uchun zanjirni cho'zib bo'lmaydi — lekin bitta qadam "bir zumga chalg'idim"
 * holatini qoplaydi, tugma esa qolganini.
 */
async function kechikkanTekshiruv(env, ish) {
  const qolgan = ish.qoldi ?? ish.vaqt * 1000 + 700;
  const bolak = ish.bolak ?? 0;
  const uyqu = Math.min(qolgan, BOLAK_MS);

  await new Promise((r) => setTimeout(r, uyqu));

  try {
    // Savol allaqachon oldinga surilgan bo'lsa (javob berildi yoki
    // "Davom etish" bosildi) — aralashmaymiz.
    if (!(await db.pollKor(env, ish.pollId))) return;

    if (qolgan > uyqu && bolak + 1 < MAX_BOLAK) {
      return ozimizniChaqir(env, {
        pollId: ish.pollId,
        qoldi: qolgan - uyqu,
        bolak: bolak + 1,
      });
    }

    await savolniOtkaz(env, ish.pollId);
    // Avtomatik o'tkazish keyingi taymerli savol yuborgan bo'lsa, uning kuzatuvini
    // YANGI so'rov sifatida boshlaymiz (har so'rov o'z fon byudjetini oladi) — aks holda
    // zanjir ikkinchi savolda uzilib qolardi.
    while (KUTAYOTGAN.length) await ozimizniChaqir(env, KUTAYOTGAN.shift());
  } catch (e) {
    console.error("kechikkanTekshiruv", e && e.stack ? e.stack : e);
  }
}

/**
 * Worker o'zini qayta chaqiradi — kutishni davom ettirish uchun.
 * Har yangi so'rov o'zining fon byudjetini oladi, shuning uchun
 * kutish uzunligiga platformadan kelgan cheklov qolmaydi.
 */
async function ozimizniChaqir(env, ish) {
  // O'z workers.dev manzilimizga fetch qilish Cloudflare'da rad etiladi (1042),
  // shuning uchun avvalo SELF service binding orqali chaqiramiz.
  const url = env.WEBHOOK_URL;
  const yuboruvchi = env.SELF ? (u, o) => env.SELF.fetch(u, o) : fetch;
  if (!url) return console.warn("WEBHOOK_URL yo'q — zanjir davom etmaydi");
  await yuboruvchi(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.WEBHOOK_SECRET ? { "X-Telegram-Bot-Api-Secret-Token": env.WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({ __kutish: ish }),
  }).catch((e) => console.error("ozimizniChaqir", e));
}

// ——————————————————————————————————————————————— natijalar / reyting

/**
 * BUGUNGI MASHG'ULOT — botdagi markaziy ekran.
 *
 * Foydalanuvchi "nima qilay?" degan savol bilan keladi. Unga TANLOV
 * berish — mas'uliyatni qaytarish; u esa aynan tanlashdan charchagani
 * uchun bu tugmani bosgan. Shuning uchun bot bitta tavsiya beradi.
 *
 * TARTIB ataylab shunday:
 *   1. Kunlik sinov — kun bo'yicha yagona, hamma uchun bir xil,
 *      reytingga ta'sir qiladi. Kechikilsa qaytarib bo'lmaydi.
 *   2. Takrorlash — muddati kelgan savol bugun eslansa foyda beradi,
 *      ertaga esa oraliq buzilib, takrorlash samarasi pasayadi.
 *   3. Marafon — vaqtga bog'liq emas, shuning uchun oxirida.
 *
 * Ya'ni ro'yxat "qiziqarlilik" bo'yicha emas, VAQTGA BOG'LIQLIK
 * bo'yicha tuzilgan: kechiktirib bo'lmaydigani birinchi.
 */
/**
 * Yordam.
 *
 * ILGARI bu matn BO'LIMLARNI sanab chiqardi. Yangi foydalanuvchi uchun
 * bu foydasiz: u bo'lim nomlarini emas, "men bu yerda nima qilaman"
 * degan savolga javob izlaydi. Shuning uchun endi matn botning
 * O'RGANISh SIKLIdan boshlanadi — bo'limlar esa shu siklda qayerda
 * turishi bilan tushuntiriladi.
 */
/**
 * Yangi yutuqlarni tekshiradi va e'lon qiladi.
 *
 * NEGA waitUntil ICHIDA EMAS: tabrik javobdan KEYIN kelishi kerak.
 * Agar u fon vazifasiga tushsa, tartib kafolatlanmaydi va odam
 * «Yangi yutuq» xabarini natijadan oldin ko'rishi mumkin — bu esa
 * nima uchun berilganini tushunarsiz qiladi.
 *
 * Bir vaqtda bir nechta yutuq ochilsa, hammasi bitta xabarda beriladi:
 * uchta alohida tabrik ketma-ket kelsa, uchalasining ham qiymati
 * tushadi.
 */
async function yutuqTekshir(env, chatId, uid, lang = joriyTil()) {
  let yangi;
  try {
    const [holat, borlar] = await Promise.all([
      db.yutuqHolati(env, uid),
      db.yutuqlarim(env, uid),
    ]);
    const bor = new Set(borlar.map((r) => r.kod));
    const kerak = layoqatli(holat).filter((k) => !bor.has(k));
    yangi = await db.yutuqBer(env, uid, kerak);
  } catch (e) {
    // Yutuq — qo'shimcha qiymat, asosiy oqim emas. U yiqilsa,
    // foydalanuvchi natijasini baribir olishi kerak.
    console.warn("yutuqTekshir", e);
    return;
  }
  // «Ilk qadam» jimgina beriladi: birinchi savoldan keyin ortiqcha xabar chiqmasin.
  const korinadi = yangi.filter((k) => k !== "ilk");
  if (!korinadi.length) return;
  yangi = korinadi;

  const satrlar = yangi.map((kod) => {
    const y = yutuqTop(kod);
    return `${y.emoji} <b>${yNom(y, lang)}</b>\n${yIzoh(y, lang)}`;
  });

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: (yangi.length === 1 ? "🏅 <b>Yangi yutuq</b>" : `🏅 <b>${yangi.length} ta yangi yutuq</b>`) +
      "\n\n" + satrlar.join("\n\n"),
    reply_markup: { inline_keyboard: [[{ text: t("yutuq.tugma", lang), callback_data: "yutuq" }]] },
  });
}

/** Yutuqlar ro'yxati — olinganlar va keyingisi. */
async function yutuqlarKorsat(env, chatId, uid, lang = joriyTil()) {
  const [borlar, holat] = await Promise.all([
    db.yutuqlarim(env, uid),
    db.yutuqHolati(env, uid),
  ]);
  const bor = new Set(borlar.map((r) => r.kod));

  if (!bor.size) {
    await tg(env, "sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: `${t("yutuq.sarlavha", lang)}\n\n${t("yutuq.bosh", lang)}`,
      reply_markup: menyu(),
    });
    return;
  }

  const satrlar = YUTUQLAR.filter((y) => bor.has(y.kod))
    .map((y) => `${y.emoji} <b>${yNom(y, lang)}</b>\n   <i>${yIzoh(y, lang)}</i>`);

  // Keyingi maqsad — bittasi. Qulf ostidagi hamma nishonni ko'rsatish
  // «qancha ko'p narsani qo'lga kiritmaganim» hissini beradi.
  const keyingi = YUTUQLAR.find((y) => !bor.has(y.kod));

  await tg(env, "sendMessage", {
    chat_id: chatId, parse_mode: "HTML",
    text:
      `${t("yutuq.sarlavha", lang)}\n` +
      `${t("yutuq.hisob", lang, { bor: bor.size, jami: YUTUQLAR.length })}\n\n` +
      satrlar.join("\n\n") +
      (keyingi ? t("yutuq.keyingi", lang, {
        emoji: keyingi.emoji,
        nom: yNom(keyingi, lang),
        izoh: yIzoh(keyingi, lang),
      }) : ""),
    reply_markup: menyu(),
  });
}

// ——————————————————————————————————————————————— 🔖 Saqlanganlar

const togriMatn = (q) => (Array.isArray(q.cs) ? q.cs : [q.c]).map((i) => q.o[i]).join(", ");

async function saqlanganMenyu(env, chatId, uid, tahrir = null) {
  let ids, jami;
  try { [ids, jami] = [await db.saqlanganlar(env, uid, 10), await db.saqlanganSoni(env, uid)]; }
  catch (e) {
    console.error("saqlangan", String(e).slice(0, 200));
    await tg(env, "sendMessage", { chat_id: chatId, text: "🔖 …" });
    return;
  }
  const savollar = ids.map((id) => [id, savolTop(id)]).filter(([, q]) => q);
  const yubor = (p) => tahrir
    ? tg(env, "editMessageText", { chat_id: chatId, message_id: tahrir, ...p })
    : tg(env, "sendMessage", { chat_id: chatId, ...p });
  if (!savollar.length) { await yubor({ parse_mode: "HTML", text: t("sv.bosh"), ...(tahrir ? {} : { reply_markup: menyu() }) }); return; }

  const qator = savollar.map(([, q], i) =>
    `<b>${i + 1}.</b> ${esc(clip(q.q, 160))}\n✅ <b>${esc(clip(togriMatn(q), 80))}</b>` +
    (q.e ? `\n<i>${esc(clip(q.e, 160))}</i>` : "")).join("\n\n");
  const text = `${t("sv.sarlavha", undefined, { soni: jami })}\n\n${qator}` +
    (jami > savollar.length ? `\n\n${t("sv.oxirgi", undefined, { n: savollar.length })}` : "");
  await yubor({ parse_mode: "HTML", text: clip(text, 4000),
    reply_markup: { inline_keyboard: [savollar.map(([id], i) => ({ text: `🗑 ${i + 1}`, callback_data: `svx:${id}` }))] } });
}

/** Poll ostidagi 🔖 tugmasini almashtiradi: Saqlash ↔ Saqlandi. */
async function saqlashTugma(env, cb, uid, qidV) {
  const q = savolTop(qidV);
  if (!q) return;
  let saqlandi;
  try { saqlandi = await db.saqlashToggle(env, uid, qidV); } catch (e) { console.error("saqlash", String(e).slice(0, 200)); return; }
  const eski = cb.message?.reply_markup?.inline_keyboard || [];
  const qatorlar = eski.map((r) => r.map((b) =>
    b.callback_data === `sv:${qidV}` ? { text: t(saqlandi ? "sv.saqlandi" : "sv.saqlash"), callback_data: b.callback_data } : b));
  await tg(env, "editMessageReplyMarkup", { chat_id: cb.message.chat.id, message_id: cb.message.message_id,
    reply_markup: { inline_keyboard: qatorlar } }).catch(() => {});
}

/** Taklif havolasi va hisob. */
async function taklifKorsat(env, chatId, uid, lang = joriyTil()) {
  const havola = `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=d_${uid}`;
  const hisob = await db.takliflarim(env, uid);

  await tg(env, "sendMessage", {
    chat_id: chatId, parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    text: `${t("taklif.sarlavha", lang)}\n\n${t("taklif.izoh", lang)}` +
      t("taklif.hisob", lang, hisob),
  });

  // Ikkinchi xabar — NUSXA OLISH uchun. Foydalanuvchi uni butunligicha
  // uzatadi, shuning uchun unda tushuntirish ham, hisob ham bo'lmasligi
  // kerak: faqat do'stga ketadigan matn.
  await tg(env, "sendMessage", {
    chat_id: chatId, parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    text: t("taklif.matn", lang, { havola }),
  });
}

/**
 * Seansdagi savollarni xato bildirish uchun ro'yxatlaydi.
 *
 * Savol matni QISQARTIRIB ko'rsatiladi: inline tugma matni Telegram'da
 * bir qatorga sig'ishi kerak, aks holda tugmalar o'qib bo'lmas holga
 * keladi.
 */
async function xabarRoyxat(env, chatId, uid, mode, qoshimcha, lang = joriyTil()) {
  const royxat = await db.seansSavollari(env, uid, mode, qoshimcha);
  const qatorlar = [], tugmalar = [];
  for (const r of royxat.slice(0, 20)) {
    const q = savolTop(r.qid);
    if (!q) continue;
    const matn = q.q.length > 80 ? q.q.slice(0, 78) + "…" : q.q;
    qatorlar.push((r.idx + 1) + ". " + esc(matn));
    tugmalar.push({ text: String(r.idx + 1), callback_data: "bayroq:" + r.qid });
  }

  if (!tugmalar.length) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t("xabar.yoq", lang) });
    return;
  }

  // Raqamli to'r: 5 tadan qatorda — qisqartirilgan uzun tugmalar o'rniga
  const qator = [];
  for (let i = 0; i < tugmalar.length; i += 5) qator.push(tugmalar.slice(i, i + 5));
  await tg(env, "sendMessage", {
    chat_id: chatId, parse_mode: "HTML",
    text: t("xabar.tanla", lang) + "\n\n<blockquote expandable>" + qatorlar.join("\n") + "</blockquote>\n\n" + t("xabar.raqam", lang),
    reply_markup: { inline_keyboard: qator },
  });
}

/** O'rganish bo'limi: bitta xabar, mavzu bo'yicha tugmalar. */
async function hubKorsat(env, chatId, turi, tahrir = null) {
  if (turi !== "organ") return profilKorsat(env, chatId, null, tahrir);
  await ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: t("hub.organ"),
    reply_markup: { inline_keyboard: [
      [{ text: t("tugma.kitobTest"), callback_data: "hub:marafon:o" }, { text: t("tugma.kutubxona"), callback_data: "lib:list" }],
      [{ text: t("tugma.arab"), callback_data: "hub:arab:o" }, { text: t("tugma.takror"), callback_data: "hub:takror:o" }],
      [{ text: t("tugma.saqlangan"), callback_data: "hub:saqlangan:o" }],
    ] } });
}

/** Profilim: profil kartochkasi ostida barcha shaxsiy bo'limlar. */
function profilTugmalari() {
  return { inline_keyboard: [
    [{ text: t("tugma.natija"), callback_data: "hub:natija:p" }],
    [{ text: t("sz.yordam"), callback_data: "yordam" }, { text: t("tugma.sozlama"), callback_data: "szm" }],
    [{ text: t("sz.boglan"), callback_data: "boglan" }],
  ] };
}
async function boglanKorsat(env, chatId, uid = null, tahrir = null) {
  let n = 0;
  if (uid != null) n = (await env.DB.prepare("SELECT COUNT(*) AS n FROM murojaat WHERE uid = ?").bind(String(uid)).first().catch(() => null))?.n || 0;
  await ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: t("hub.boglan"),
    reply_markup: { inline_keyboard: [
      [{ text: t("boglan.yozBtn"), callback_data: "fikrm" }, { text: t("boglan.meningBtn") + (n ? " (" + n + ")" : ""), callback_data: "mx:0" }],
      [{ text: t("sz.fikrlar"), callback_data: "fikrb" }],
      [{ text: t("sz.orqaga"), callback_data: "bk:p" }],
    ] } });
}

// ——————————————————————————————————————————————— Kutubxona (PDF kitoblar, 3 tilda)

const LIB_TIL = [["uz", "🇺🇿 O'zbekcha"], ["ru", "🇷🇺 Русский"], ["en", "🇬🇧 English"]];
const libBayroq = (k) => ({ uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" }[k] || "");
const libNorm = (x) => String(x || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
async function libOl(env) { try { return JSON.parse((await db.tizimOqi(env, "lib:books")) || "[]"); } catch { return []; } }
async function libSaqla(env, b) { await db.tizimYoz(env, "lib:books", JSON.stringify(b)); }
async function libJson(env, kalit, def) { try { return JSON.parse((await db.tizimOqi(env, kalit)) || "null") ?? def; } catch { return def; } }

function libTilTop(caption, fayl) {
  const x = (String(caption || "") + " " + String(fayl || "")).toLowerCase();
  if (/[а-яё]/.test(x)) return "ru";
  const ayri = (re) => new RegExp("(^|[\\s_\\-.(\\[])(" + re + ")([\\s_\\-.)\\]]|$)").test(x);
  if (ayri("uz|uzb|uzbek|o'zbek|ozbek|lotin")) return "uz";
  if (ayri("ru|rus|russian")) return "ru";
  if (ayri("en|eng|english|ingliz")) return "en";
  return "";
}
function libSarlavha(caption, fayl) {
  const tozala = (x) => String(x || "").replace(/\.pdf$/i, "").replace(/[_\-]+/g, " ")
    .replace(/(^|\s)(uz|uzb|uzbek|o'zbek|ozbek|lotin|ru|rus|russian|en|eng|english|ingliz)(?=\s|$)/gi, " ").replace(/\s+/g, " ").trim();
  const c = tozala(String(caption || "").split("\n")[0]);
  if (c.length >= 3) return c.slice(0, 60);
  return "";
}
const libFayldanSarlavha = (fayl) => String(fayl || "Kitob").replace(/\.pdf$/i, "").replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Kitob";

/** Admin PDF yubordi: til va kitobni aniqlaymiz; noaniq bo'lsa bitta tugmali savol beramiz. */
async function libQoshish(env, chatId, msg) {
  const d = msg.document;
  if (!/pdf/i.test(d.mime_type || "") && !/\.pdf$/i.test(d.file_name || "")) return false;
  const kalit = d.file_unique_id;
  const books = await libOl(env);
  const sarl = libSarlavha(msg.caption, d.file_name);
  let bookId = "";
  if (sarl) {
    const b = books.find((x) => libNorm(x.title) === libNorm(sarl));
    if (b) bookId = b.id;
  } else {
    const last = await libJson(env, "lib:last", null);
    if (last && Date.now() - last.t < 15 * 60e3 && books.find((x) => x.id === last.id)) bookId = last.id;
  }
  const pend = { f: d.file_id, u: d.file_unique_id, n: d.file_name || "kitob.pdf", z: d.file_size || 0,
    til: libTilTop(msg.caption, d.file_name), title: sarl, bookId };
  await db.tizimYoz(env, "lib:p:" + kalit, JSON.stringify(pend));
  await libDavom(env, chatId, kalit);
  return true;
}

/** Kutilayotgan faylning keyingi qadami: til → kitob → saqlash. */
async function libDavom(env, chatId, kalit, tahrir = null) {
  const p = await libJson(env, "lib:p:" + kalit, null);
  if (!p) return;
  const books = await libOl(env);
  const yoz = (text, kb) => {
    const x = { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: kb } };
    return tahrir ? tg(env, "editMessageText", { ...x, message_id: tahrir }) : tg(env, "sendMessage", x);
  };
  if (!p.til) {
    return yoz("📥 <b>" + esc(p.n) + "</b>\n\n<blockquote>Bu qaysi tilda?</blockquote>",
      [LIB_TIL.map(([k, nom]) => ({ text: nom, callback_data: "lib:pl:" + kalit + ":" + k }))]);
  }
  if (!p.bookId && !p.title) {
    return yoz("📥 <b>" + esc(p.n) + "</b> · " + libBayroq(p.til) + "\n\n<blockquote>Qaysi kitobga qo'shamiz?</blockquote>",
      [...books.map((b) => [{ text: "📘 " + b.title, callback_data: "lib:pb:" + kalit + ":" + b.id }]),
       [{ text: "➕ Yangi kitob", callback_data: "lib:pb:" + kalit + ":new" }]]);
  }
  // saqlash
  let book = books.find((x) => x.id === p.bookId) || books.find((x) => libNorm(x.title) === libNorm(p.title));
  if (!book) { book = { id: "b" + Date.now().toString(36), title: p.title || libFayldanSarlavha(p.n), files: {} }; books.push(book); }
  const almashdi = !!book.files[p.til];
  book.files[p.til] = { f: p.f, u: p.u, n: p.n, z: p.z };
  await libSaqla(env, books);
  await db.tizimYoz(env, "lib:p:" + kalit, "");
  await db.tizimYoz(env, "lib:last", JSON.stringify({ id: book.id, t: Date.now() }));
  const holat = LIB_TIL.map(([k]) => libBayroq(k) + (book.files[k] ? " ✅" : " ➖")).join("  ");
  const text = "✅ <b>" + esc(book.title) + "</b> kutubxonada\n\n" + holat + "\n\n<i>" + libBayroq(p.til) + " " + (almashdi ? "almashtirildi" : "qo'shildi") + ": " + esc(p.n) + "</i>";
  const kb = [[{ text: "📚 Kutubxonani boshqarish", callback_data: "lib:adm" }]];
  const sum = await libJson(env, "lib:sum", null);
  if (!tahrir && sum && sum.id === book.id && Date.now() - sum.t < 120e3) {
    const r = await tg(env, "editMessageText", { chat_id: chatId, message_id: sum.mid, parse_mode: "HTML", text, reply_markup: { inline_keyboard: kb } });
    if (r?.ok) { await db.tizimYoz(env, "lib:sum", JSON.stringify({ id: book.id, mid: sum.mid, t: Date.now() })); return; }
  }
  const r = await yoz(text, kb);
  if (r?.ok) await db.tizimYoz(env, "lib:sum", JSON.stringify({ id: book.id, mid: r.result.message_id, t: Date.now() }));
}

/** Foydalanuvchi: kitoblar ro'yxati (bitta kitob bo'lsa — to'g'ridan-to'g'ri til tanlash). */
async function kutubxonaKorsat(env, chatId, uid, tahrir = null) {
  const books = (await libOl(env)).filter((b) => Object.keys(b.files || {}).length);
  const yoz = (text, kb) => {
    const x = { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: kb } };
    return tahrir ? tg(env, "editMessageText", { ...x, message_id: tahrir }) : tg(env, "sendMessage", x);
  };
  if (!books.length) return yoz(t("lib.bosh"), [[{ text: t("tugma.kitobTest"), callback_data: "hub:marafon" }]]);
  if (books.length === 1) return libTilTanla(env, chatId, uid, books[0].id, tahrir);
  return yoz(t("lib.sarlavha"), books.map((b) => [{ text: "📘 " + b.title, callback_data: "lib:b:" + b.id }]));
}
async function libTilTanla(env, chatId, uid, id, tahrir = null, orqaCb = "") {
  const b = (await libOl(env)).find((x) => x.id === id);
  if (!b) return;
  const bor = LIB_TIL.filter(([k]) => b.files[k]);
  if (bor.length === 1) return libYubor(env, chatId, uid, id, bor[0][0]);
  const oz = joriyTil();
  bor.sort((x, y) => (x[0] === oz ? -1 : 0) - (y[0] === oz ? -1 : 0));
  const x = { chat_id: chatId, parse_mode: "HTML", text: t("lib.til", undefined, { nom: esc(b.title) }),
    reply_markup: { inline_keyboard: [...bor.map(([k, nom]) => [{ text: nom, callback_data: "lib:g:" + id + ":" + k }]), ...(orqaCb ? [[{ text: t("sz.orqaga"), callback_data: orqaCb }]] : [])] } };
  return tahrir ? tg(env, "editMessageText", { ...x, message_id: tahrir }) : tg(env, "sendMessage", x);
}
async function libYubor(env, chatId, uid, id, til) {
  const b = (await libOl(env)).find((x) => x.id === id);
  const fayl = b?.files?.[til];
  if (!fayl) { await tg(env, "sendMessage", { chat_id: chatId, text: t("lib.yoq") }); return; }
  const nom = LIB_TIL.find(([k]) => k === til)?.[1] || til;
  await tg(env, "sendDocument", { chat_id: chatId, document: fayl.f, parse_mode: "HTML",
    caption: t("lib.caption", undefined, { nom: esc(b.title), til: nom }),
    reply_markup: { inline_keyboard: [[{ text: t("tugma.kitobTest"), callback_data: "hub:marafon" }]] } });
  try {
    const sh = await libJson(env, "lib:dl", {});
    sh[id] = sh[id] || {}; sh[id][til] = (sh[id][til] || 0) + 1;
    await db.tizimYoz(env, "lib:dl", JSON.stringify(sh));
  } catch { /* hisob xato bersa ham fayl yetkazilgan */ }
}

/** Admin: kutubxonani boshqarish. */
async function libAdmin(env, chatId, tahrir = null) {
  const books = await libOl(env);
  const sh = await libJson(env, "lib:dl", {});
  const text = "📚 <b>Kutubxona</b>\n\n" + (books.length
    ? books.map((b) => "📘 <b>" + esc(b.title) + "</b>\n" + LIB_TIL.map(([k]) => libBayroq(k) + (b.files[k] ? " ✅ ⬇️" + ((sh[b.id] || {})[k] || 0) : " ➖")).join("   ")).join("\n\n")
    : "<i>Hali kitob yo'q.</i>") +
    "\n\n<blockquote>Qo'shish: PDF yuboring. Sarlavha — izohda (caption), til — izohda yoki fayl nomida: UZ / RU / EN. Bir xil sarlavhali fayllar bitta kitobga birlashadi.</blockquote>";
  const x = { chat_id: chatId, parse_mode: "HTML", text,
    reply_markup: { inline_keyboard: [...books.map((b) => [{ text: "🗑 " + b.title, callback_data: "lib:dx:" + b.id }]), [{ text: "↩️ Orqaga", callback_data: "adm:panel" }]] } };
  return tahrir ? tg(env, "editMessageText", { ...x, message_id: tahrir }) : tg(env, "sendMessage", x);
}

async function libCallback(env, cb, chatId, uid, data) {
  const mid = cb.message.message_id;
  const admin = String(uid) === String(env.ADMIN_ID);
  const [, amal, a, b] = data.split(":");
  if (amal === "list") return kutubxonaKorsat(env, chatId, uid);
  if (amal === "b") return libTilTanla(env, chatId, uid, a, mid, "lib:list");
  if (amal === "g") return libYubor(env, chatId, uid, a, b);
  if (!admin) return;
  if (amal === "adm") return libAdmin(env, chatId);
  if (amal === "pl") {
    const p = await libJson(env, "lib:p:" + a, null);
    if (!p) return;
    p.til = b;
    await db.tizimYoz(env, "lib:p:" + a, JSON.stringify(p));
    return libDavom(env, chatId, a, mid);
  }
  if (amal === "pb") {
    const p = await libJson(env, "lib:p:" + a, null);
    if (!p) return;
    if (b === "new") p.title = libFayldanSarlavha(p.n); else p.bookId = b;
    await db.tizimYoz(env, "lib:p:" + a, JSON.stringify(p));
    return libDavom(env, chatId, a, mid);
  }
  if (amal === "dx") {
    const bk = (await libOl(env)).find((x) => x.id === a);
    if (!bk) return;
    return tg(env, "editMessageText", { chat_id: chatId, message_id: mid, parse_mode: "HTML",
      text: "🗑 <b>" + esc(bk.title) + "</b> kutubxonadan o'chirilsinmi?\n<i>Fayllar Telegram'da qoladi, faqat botdan olib tashlanadi.</i>",
      reply_markup: { inline_keyboard: [[{ text: "✅ Ha, o'chirish", callback_data: "lib:dy:" + a }, { text: "↩️ Orqaga", callback_data: "lib:adm2" }]] } });
  }
  if (amal === "dy") {
    await libSaqla(env, (await libOl(env)).filter((x) => x.id !== a));
    return libAdmin(env, chatId, mid);
  }
  if (amal === "adm2") return libAdmin(env, chatId, mid);
}

async function yordamKorsat(env, chatId) {
  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    text: t("yordam.matn", undefined, {
      kunlik: t("tugma.kunlik"), marafon: t("tugma.marafon"), arab: t("tugma.arab"),
      takror: t("tugma.takror"), natija: t("tugma.natija"), fasl: KITOB_JAMI,
    }),
    reply_markup: menyu(),
  });
}

async function bugungiMashgulot(env, chatId, uid, name) {
  const kun = dayKey();
  const [bugun, xato, u] = await Promise.all([
    db.kunYakunlandiMi(env, uid, kun),
    db.xatoRoyxat(env, uid, 50),
    getUser(env, uid),
  ]);

  const soni = KUNLIK_SHAXSIY;

  if (!bugun) {
    return bugunKorsat(env, chatId,
      t("bugun.kunlik", "uz", { soni, daqiqa: Math.max(2, Math.round(soni * 0.4)) }),
      "davom_d");
  }

  const tayyor = xato.filter((r) => r.tayyor && savolTop(r.qid));
  if (tayyor.length) {
    return bugunKorsat(env, chatId,
      t("bugun.takror", "uz", { soni: tayyor.length }), "xato:boshla");
  }

  const done = u.kitob || 0;
  if (done < KITOB_JAMI) {
    const keyingi = done + 1;
    return bugunKorsat(env, chatId,
      t("bugun.marafon", "uz", { fasl: keyingi, soni: faslSavolSoni(keyingi) }),
      `k:${keyingi}`);
  }

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `${t("bugun.sarlavha")}\n\n` +
      t("bugun.hammasi", "uz", { mashq: t("sozlama.mashq") }),
    reply_markup: { inline_keyboard: [[{ text: t("sozlama.mashq"), callback_data: "seq" }]] },
  });
}

/** Tavsiyani bitta tugma bilan ko'rsatadi. */
async function bugunKorsat(env, chatId, matn, amal) {
  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `${t("bugun.sarlavha")}\n\n${matn}`,
    reply_markup: { inline_keyboard: [[{ text: t("bugun.boshla"), callback_data: amal }]] },
  });
}

/**
 * Sozlamalar — kundalik bo'lmagan hamma narsa shu yerda.
 *
 * Asosiy klaviaturadan uchta tugma shu yerga ko'chdi: til, o'z
 * tezligida mashq va yordam. Ularning har biri kerakli, lekin
 * KUNDALIK emas — asosiy klaviaturadagi o'rin esa kundalik
 * harakatlar uchun.
 */
async function sozlamaMenyu(env, chatId, uid, tahrir = null) {
  await ozgartir(env, tahrir, {
    chat_id: chatId,
    parse_mode: "HTML",
    text: t("sz.matn"),
    reply_markup: { inline_keyboard: [
      [{ text: t("sz.yonalish"), callback_data: "yonalish" }, { text: t("sz.til"), callback_data: "tilmenu" }],
      [{ text: t("sz.orqaga"), callback_data: "bk:p" }],
    ] },
  });
}

async function tilMenyu(env, chatId) {
  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: t("til.tanla"),
    reply_markup: { inline_keyboard: [TILLAR.map((k) => ({ text: TIL_NOMI[k], callback_data: "til:" + k }))] },
  });
}

async function tilTanla(env, chatId, uid, k) {
  if (!TILLAR.includes(k)) return;
  await env.DB.prepare("UPDATE users SET lang = ? WHERE uid = ?").bind(k, String(uid)).run();
  await tilBilan(k, () => tg(env, "sendMessage", {
    chat_id: chatId, parse_mode: "HTML", text: t("til.tayyor"), reply_markup: menyu(),
  }));
}

async function showStats(env, chatId, uid) {
  const [u, st, bugun, xato] = await Promise.all([
    getUser(env, uid),
    db.statistika(env, uid),
    db.kunYakunlandiMi(env, uid, dayKey()),
    db.xatolar(env, uid, 1000),
  ]);

  if (!st.jami) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: t("statistika.bosh", undefined, { kunlik: t("tugma.kunlik") }),
      reply_markup: keyingiTugmalar(["kunlik", "marafon"]),
    });
    return;
  }

  const pct = Math.round((st.togri / st.jami) * 100);

  // Mavzular: bir qatorda, foiz oldinda, eng yaxshisidan boshlab.
  const medal = ["🥇", "🥈", "🥉"];
  const tartib = st.mavzular
    .filter((m) => m.a > 0)
    .map((m) => ({ ...m, f: Math.round((m.c / m.a) * 100) }))
    .sort((x, y) => y.f - x.f || y.a - x.a);
  const rows = tartib.map((m, k) => {
    const belgi = k < 3 ? medal[k] : (k === tartib.length - 1 && tartib.length > 3 && m.f < 50 ? "🔻" : "▫️");
    return `${belgi} <b>${m.f}%</b> — ${topicLabel(m.topic)} (${m.c}/${m.a})`;
  }).join("\n");

  const yutBor = new Set((await db.yutuqlarim(env, uid)).map((r) => r.kod));
  const yutLang = joriyTil();
  const yutKeyingi = YUTUQLAR.find((y) => !yutBor.has(y.kod));
  const yutuqBlok = "\n\n🏅 <b>Yutuqlar</b> " + yutBor.size + "/" + YUTUQLAR.length + (yutBor.size
    ? "\n" + YUTUQLAR.filter((y) => yutBor.has(y.kod)).map((y) => y.emoji + " " + yNom(y, yutLang)).join(" · ") : "") +
    (yutKeyingi ? "\n<i>Keyingisi: " + yutKeyingi.emoji + " " + yNom(yutKeyingi, yutLang) + " — " + yIzoh(yutKeyingi, yutLang) + "</i>" : "");
  const kd = u.kitob || 0;
  const xatoSoni = xato.length;
  const bugunQator = bugun
    ? `✅ Bugun: <b>${bugun.score} ball</b> (maks. ${bugun.total})`
    : `⏳ Bugun: hali mashq bajarilmadi`;

  const matn =
    `📊 <b>Shaxsiy ko'rsatkichlaringiz</b>\n\n` +
    `Jami <b>${st.jami}</b> ta savoldan <b>${st.togri}</b> tasiga (<b>${pct}%</b>) to'g'ri javob berdingiz.\n\n` +
    `🔥 Ketma-ket: <b>${u.streak || 0}</b> kun` + ((u.streak || 0) > 0 && !bugun ? ` — seriyani uzmang!` : ``) + `\n` +
    `🗓 Jami faol kunlar: <b>${u.days || 0}</b>\n` +
    `${bugunQator}\n\n` +
    `📖 Kitob marafoni: ${progressBar(kd)} <b>${kd}/${KITOB_JAMI}</b> fasl` +
    (xatoSoni ? `\n\n🔁 Ustida ishlanmagan xatolar: <b>${xatoSoni}</b> ta. Tuzating — natijangiz tezda o'sadi.` : ``) +
    yutuqBlok +
    `\n\n<b>Mavzular bo'yicha</b> (eng yaxshisidan):\n${rows}`;

  const tugmalar = [];
  tugmalar.push([{ text: t("tugma.reyting"), callback_data: "rk:v:b" }]);
  if (!bugun) tugmalar.push([{ text: "🚀 Bugungi mashqni boshlash", callback_data: "davom_d" }]);
  if (xatoSoni) tugmalar.push([{ text: `🔁 Xatolarni tuzatish (${xatoSoni})`, callback_data: "xato:boshla" }]);

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: matn,
    reply_markup: tugmalar.length ? { inline_keyboard: tugmalar } : menyu(),
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
  const nom = r.un ? `@${esc(r.un)}` : esc(r.n || "Ishtirokchi");
  return (r.hr ? "🦸 " : "") + (r.sm ? "🧠 " : "") + (r.p ? `💎 ${nom}` : nom);
}

/** "8-avgust" ko'rinishidagi sana — sarlavhada qaysi kun ekani ko'rinsin. */
function sanaUz(d = new Date(Date.now() + 5 * 3600000)) {
  const oylar = ["yanvar","fevral","mart","aprel","may","iyun",
                 "iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  return `${d.getUTCDate()}-${oylar[d.getUTCMonth()]}`;
}

/** Reyting sarlavhasi: sana, savollar soni va ishtirokchilar bir joyda. */
function reytingSarlavha(rows) {
  const maks = Math.max(...rows.map((r) => r.t || 0));
  const savol = Math.max(...rows.map((r) => r.sn || 0));
  const qiyin = savol && maks > savol ? maks - savol : 0;
  const sharh = savol
    ? `🧩 <b>${savol} ta savol</b>${qiyin ? ` · ⭐ ${qiyin} tasi qiyin (2 ball)` : ""}\n🎯 Eng ko'p ball: <b>${maks}</b>\n📊 Qator: <b>ball</b> · ✅ to'g'ri javob/savol`
    : `🎯 Eng ko'p ball: <b>${maks}</b>`;
  return `🏆 <b>Bugungi reyting</b> · ${sanaUz()}\n` +
         `<blockquote>${sharh}</blockquote>\n` +
         `👥 <b>${rows.length}</b> ta ishtirokchi\n\n`;
}

function reytingSatrlari(rows, meniUid = null) {
  const medal = ["🥇", "🥈", "🥉"];
  const maks = Math.max(...rows.map((r) => r.t || 0));
  return rows.map((r, i) => {
    const orin = medal[i] || `<b>${i + 1}.</b>`;
    const men = meniUid && String(r.uid) === String(meniUid);
    const ism = men ? `<b>${korinadiganNom(r)}</b> (siz)` : korinadiganNom(r);
    // «18/18» savol soni bilan adashtirilardi: endi aniq «ball» va alohida «to'g'ri/savol»
    const ball = `<b>${r.s} ball</b>` + (r.t && r.t !== maks ? ` <i>(maks. ${r.t})</i>` : "") + (r.sn ? ` · ✅ ${r.sok}/${r.sn}` : "");
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

async function collectBoard(env, date) {
  // KV da bu 500 ta alohida o'qish edi; endi bitta so'rov.
  return db.reyting(env, date);
}


/** 🏆 Reyting markazi: tur (Viktorina | Duel) × davr (Bugun | Hafta | Hammasi). Natija 2 daqiqa keshlanadi (D1 limiti uchun). */
const RK_TUR = { v: "🧠 Viktorina", d: "⚔️ Duel" };
const RK_DAVR = { b: "Bugun", h: "Hafta", a: "Hammasi" };
async function rkQatorlar(env, tur, davr) {
  const kesh = "rk:" + tur + davr;
  try {
    const k = JSON.parse((await db.tizimOqi(env, kesh)) || "null");
    if (k && Date.now() - k.t < 120000) return k.r;
  } catch {}
  const dan = davr === "b" ? dayKey() : davr === "h" ? dayKey(-6) : "0000-00-00";
  let r;
  if (tur === "v") r = davr === "b" ? await collectBoard(env, dan) : await db.reytingDavr(env, dan);
  else r = await db.duelReyting(env, dan);
  r = r.slice(0, 100);
  await db.tizimYoz(env, kesh, JSON.stringify({ t: Date.now(), r })).catch(() => {});
  return r;
}

async function reytingEkran(env, chatId, uid, tur = "v", davr = "b", tahrir = null) {
  if (!RK_TUR[tur]) tur = "v";
  if (!RK_DAVR[davr]) davr = "b";
  const rows = await rkQatorlar(env, tur, davr);
  const medal = ["🥇", "🥈", "🥉"];
  const satr = (r, i) => {
    const orin = medal[i] || "<b>" + (i + 1) + ".</b>";
    const ism = String(r.uid) === String(uid) ? "<b>" + korinadiganNom(r) + "</b> (siz)" : korinadiganNom(r);
    if (tur === "d") return orin + " " + ism + " — <b>" + r.g + "</b> g'alaba · " + r.o + " duel";
    return orin + " " + ism + " — " + (davr === "b" ? "<b>" + r.s + " ball</b>" + (r.sn ? " · ✅ " + r.sok + "/" + r.sn : "") : "<b>" + r.s + "</b> ball · " + r.k + " kun");
  };
  const mening = rows.findIndex((r) => String(r.uid) === String(uid));
  let matn = "🏆 <b>Reyting</b>\n<i>" + RK_TUR[tur] + " · " + RK_DAVR[davr] + (rows.length ? " · " + rows.length + " ishtirokchi" : "") + "</i>\n" +
    (tur === "v" && davr === "b" && rows.length ? "<i>Qator: ball · ✅ to'g'ri javob/savol</i>\n" : "") + "\n";
  if (!rows.length) {
    matn += "<blockquote>" + (tur === "d" ? "Bu davrda hali tugagan duel yo'q. Do'stingizni duelga chaqiring!" : "Bu davrda hali hech kim viktorinani yakunlamagan. Birinchi bo'ling!") + " 🚀</blockquote>";
  } else {
    matn += "<blockquote>" + rows.slice(0, 10).map(satr).join("\n") + "</blockquote>\n\n" +
      (mening < 0 ? "📍 Siz bu ro'yxatda hali yo'qsiz — qo'shiling! 🚀"
        : mening === 0 ? "🎉 Siz <b>birinchi o'rindasiz</b>. Ushlab turing!"
        : mening < 10 ? "📍 Sizning o'rningiz: <b>" + (mening + 1) + "</b>"
        : "📍 Sizning o'rningiz: <b>" + (mening + 1) + "</b> — " + satr(rows[mening], mening).replace(/^<b>\d+\.<\/b> /, ""));
  }
  const kb = [
    Object.entries(RK_TUR).map(([k, nom]) => ({ text: (k === tur ? "✅ " : "") + nom, callback_data: "rk:" + k + ":" + davr })),
    Object.entries(RK_DAVR).map(([k, nom]) => ({ text: (k === davr ? "✅ " : "") + nom, callback_data: "rk:" + tur + ":" + k })),
    [{ text: t("sz.orqaga"), callback_data: "hub:natija" }],
  ];
  return ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: matn, reply_markup: { inline_keyboard: kb } });
}

async function showRank(env, chatId, uid) {
  const rows = await collectBoard(env, dayKey());
  if (!rows.length) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Bugun hali hech kim viktorinani yakunlamagan. Birinchi bo'ling! 🚀",
      reply_markup: menyu(),
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
      ...(oxirgi ? { reply_markup: menyu() } : {}),
    });
  }
}


// ——————————————————————————————————————————————— cron vazifalari

/**
 * Kunlik eslatma.
 *
 * Uchta narsaga e'tibor berilgan:
 *  1) Nomzodlar ro'yxati bitta SQL so'rov bilan olinadi (D1).
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
  const royxat = await db.eslatmaRoyxati(env, dayKey());
  let sent = 0, bloklangan = 0;

  for (const bolak of chunk(royxat, REMINDER_BATCH)) {
    if (Date.now() - boshlandi > REMINDER_BUDGET_MS) {
      console.warn("sendReminders: vaqt byudjeti tugadi");
      break;
    }

    await Promise.all(bolak.map(async (u) => {
      const L = u.lang || "uz";
      const streakLine = u.streak > 1 ? t("eslatma.zanjir", L, { n: u.streak }) : "";
      const r = await tg(env, "sendMessage", {
        chat_id: u.uid,
        parse_mode: "HTML",
        text: t("eslatma.matn", L, { streak: streakLine }),
        reply_markup: menyu(),
      });
      if (r.ok) { sent++; return; }
      // 403 = bot bloklangan. Yozuvni o'chirmaymiz, faqat belgilaymiz.
      if (r.error_code === 403) { await db.setBlocked(env, u.uid, true); bloklangan++; }
    }));

    await new Promise((r2) => setTimeout(r2, 1100));   // Telegram rate-limit
  }

  console.log(`reminders: yuborildi ${sent}, bloklangan ${bloklangan}, nomzod ${royxat.length}`);
}


/**
 * «Super miya» — kunlik reytingda birinchi 5 o'rinni olganlarga nishon.
 * Keyingi kunlik viktorina e'loniga (20:00 Toshkent) qadar amal qiladi,
 * so'ng o'zi o'chadi. Har kuni qayta tuziladi: nishon doimiy mukofot emas,
 * o'sha kunning natijasi.
 */
const SUPER_SONI = 5;
async function superMiyaBer(env, rows) {
  const top = rows.filter((r) => r.t > 0 && r.s > 0).slice(0, SUPER_SONI);
  const d = new Date(); d.setUTCDate(d.getUTCDate() + 1); d.setUTCHours(15, 0, 0, 0);   // ertaga 20:00 Toshkent
  const gacha = d.toISOString().slice(0, 19).replace("T", " ");
  await env.DB.prepare("UPDATE users SET super_until = NULL WHERE super_until IS NOT NULL").run();
  for (const r of top) await env.DB.prepare("UPDATE users SET super_until = ? WHERE uid = ?").bind(gacha, String(r.uid)).run();
  for (const [k, r] of top.entries()) {
    await tg(env, "sendMessage", { chat_id: r.uid, parse_mode: "HTML",
      text: `🧠 <b>Super miya!</b>\n\nBugungi reytingda <b>${k + 1}-o'rin</b> — siz kuchli beshlikdasiz. ` +
            `Ismingiz yonida 🧠 nishoni ertangi viktorina e'loniga qadar turadi.\n\nErtaga ham saqlab qolasizmi? 😉`,
      reply_markup: menyu() }).catch(() => {});
  }
  return top.length;
}

/** Kun g'olibi (1-o'rin) — 1 kun BEPUL premium. Bir kunda bir marta (takror ishga tushsa ham). */
async function kunGolibiPremium(env, rows) {
  const g = rows.find((r) => r.t > 0 && r.s > 0);
  if (!g) return null;
  const kalit = `p1:${dayKey()}`;
  if (await db.tizimOqi(env, kalit)) return null;
  await db.tizimYoz(env, kalit, String(g.uid));
  await db.premiumBer(env, g.uid, 1, "reyting", `kun g'olibi ${dayKey()}`);
  await tg(env, "sendMessage", { chat_id: g.uid, parse_mode: "HTML",
    text: `🥇 <b>Kun g'olibi!</b>\n\nBugungi reytingda <b>1-o'rin</b> sizniki. Sovg'a: <b>1 kun 💎 premium</b> — profilingiz va qo'shimcha statistikangiz ochildi.\n\nErtaga ham birinchi bo'la olasizmi?`,
    reply_markup: menyu() }).catch(() => {});
  return g;
}

async function postLeaderboard(env) {
  let rows = await collectBoard(env, dayKey());
  if (!rows.length) return;
  try { if (await superMiyaBer(env, rows)) rows = await collectBoard(env, dayKey()); }
  catch (e) { console.warn("superMiyaBer", e); }
  try { if (await kunGolibiPremium(env, rows)) rows = await collectBoard(env, dayKey()); }
  catch (e) { console.warn("kunGolibiPremium", e); }
  await reytingYubor(env, env.CHAT_ID, rows, "🧠 Super miya: kuchli beshlik · 🦸 Hero: qiyin savollar hammasi to'g'ri\n🥇 Kun g'olibi 1 kun 💎 premium oladi\nErtaga soat 20:00 da yangi savollar 🌙");
}




/** Reytingni to'liq ro'yxat bilan yuborish — barcha ishtirokchilar ko'rinadi. */
async function reytingYubor(env, chatId, rows, izoh, opt = {}) {
  // r.t nolga teng bo'lishi mumkin emas, lekin buzilgan yozuv butun reytingni
  // NaN qilib qo'ymasligi uchun himoya qo'yamiz.
  const avg = Math.round(rows.reduce((s, r) => s + (r.t ? r.s / r.t : 0), 0) / rows.length * 100);
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
  const reja = kunlikReja(bank);
  const jami = Object.values(reja).reduce((a, b) => a + b, 0);

  const satrlar = Object.entries(reja)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${topicLabel(t)} — <b>${n} ta</b>`)
    .join("\n");

  await tg(env, "sendMessage", {
    chat_id: env.CHAT_ID,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    text:
      `🧠 <b>Bugungi viktorina tayyor!</b> · <i>Kun ${kun + 1}</i>\n\n` +
      `<b>${jami} ta savol</b> · taxminan <b>${Math.max(3, Math.round(jami * 0.5))} daqiqa</b>:\n\n` +
      `${satrlar}\n\n` +
      `⏱ Har savolga vaqt cheklangan — o'ylab, lekin tez!\n` +
      `🏆 Natijalar soat 22:00 da shu yerda e'lon qilinadi.\n\n` +
      `Qani, kim birinchi bo'ladi? 🚀`,
    reply_markup: {
      inline_keyboard: [[{
        text: "🚀 Viktorinani boshlash",
        url: `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=quiz`,
      }]],
    },
  });
  console.log(`kunlik e'lon yuborildi: kun ${kun + 1}, ${jami} ta savol`);
}


// ——————————————————————————————————————————————— xabarlarni qayta ishlash

// ——————————————————————————————————————————————— fikr-mulohazalar

const FIKR_MAX = 1000;          // belgi
const FIKR_KUNLIK = 5;          // bir foydalanuvchidan sutkada
const FIKR_KUTISH_MS = 30 * 60 * 1000;

/** Xabar turlari: t = taklif, s = shikoyat, q = savol, x = boshqa. Tur tizim kalitida saqlanadi (sxema o'zgarmaydi). */
const TUR_KALITLAR = ["t", "s", "q"];
async function turOl(env) { try { return JSON.parse((await db.tizimOqi(env, "fk:turlar")) || "{}"); } catch { return {}; } }
async function turYoz(env, id, k) {
  const m = await turOl(env);
  m[id] = k;
  const ids = Object.keys(m).map(Number).sort((a, b) => a - b);
  for (const eski of ids.slice(0, Math.max(0, ids.length - 400))) delete m[eski];
  await db.tizimYoz(env, "fk:turlar", JSON.stringify(m));
}
const turNom = (k) => t("tur." + (["t", "s", "q"].includes(k) ? k : "x"));

async function fikrBoshla(env, chatId, uid, tahrir = null) {
  await ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: t("boglan.tanla"),
    reply_markup: { inline_keyboard: [
      TUR_KALITLAR.map((k) => ({ text: t("tur." + k), callback_data: "fkt:" + k })),
      [{ text: t("sz.orqaga"), callback_data: "bk:b" }],
    ] } });
}
async function fikrTurTanla(env, chatId, uid, k, tahrir) {
  if (!TUR_KALITLAR.includes(k)) return;
  await db.tizimYoz(env, "fikr_kut:" + uid, String(Date.now()));
  await db.tizimYoz(env, "fikr_tur:" + uid, k);
  await ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: t("boglan.yoz", undefined, { tur: t("tur." + k) }) });
}

/** Foydalanuvchi fikr yozayotgan holatdami va xabarni qabul qiladimi. true — xabar ishlandi. */
async function fikrQabul(env, msg, uid, chatId, text) {
  const kut = await db.tizimOqi(env, `fikr_kut:${uid}`);
  if (!kut || Date.now() - Number(kut) > FIKR_KUTISH_MS) return false;

  // Buyruq yoki menyu tugmasi — fikr emas, holat bekor bo'ladi va xabar odatdagidek ishlanadi
  if (text.startsWith("/") || AMAL.has(text)) {
    await db.tizimYoz(env, `fikr_kut:${uid}`, "");
    if (text.startsWith("/bekor")) {
      await tg(env, "sendMessage", { chat_id: chatId, text: "Bekor qilindi.", reply_markup: menyu() });
      return true;
    }
    return false;
  }
  if (!text) {
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "✍️ <b>Faqat matn qabul qilinadi.</b>\n\n<blockquote>Xabaringizni matn ko'rinishida yozib yuboring.</blockquote>\n<i>Bekor qilish: /bekor</i>" });
    return true;
  }
  if (await db.murojaatSoni(env, uid) >= FIKR_KUNLIK) {
    await db.tizimYoz(env, `fikr_kut:${uid}`, "");
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "⏳ <b>Bugungi limit tugadi.</b>\n\n<blockquote>Bir kunda ko'pi bilan 5 ta xabar yuborish mumkin. Ertaga yana yozishingiz mumkin.</blockquote>", reply_markup: menyu() });
    return true;
  }

  const matn = text.slice(0, FIKR_MAX);
  const ism = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ");
  const uname = msg.from.username || "";
  const id = await db.murojaatYoz(env, { uid, ism, uname, matn });
  const tur = (await db.tizimOqi(env, "fikr_tur:" + uid).catch(() => "")) || "x";
  await db.tizimYoz(env, `fikr_kut:${uid}`, "");
  await db.tizimYoz(env, "fikr_tur:" + uid, "");
  await turYoz(env, id, tur).catch(() => {});

  if (env.ADMIN_ID) {
    const r = await tg(env, "sendMessage", {
      chat_id: env.ADMIN_ID,
      parse_mode: "HTML",
      text:
        "<b>" + t("tur." + (TUR_KALITLAR.includes(tur) ? tur : "x"), "uz") + " · #" + id + "</b>\n" +
        "👤 <a href=\"tg://user?id=" + uid + "\">" + esc(ism || "Ism yo'q") + "</a>" + (uname ? " · @" + esc(uname) : "") + " · <code>" + uid + "</code>\n\n" +
        "<blockquote>" + esc(matn) + "</blockquote>",
      reply_markup: { inline_keyboard: [[
        { text: "✉️ Javob yozish", callback_data: "fk:jv:" + id },
        { text: "📂 Ochish", callback_data: "xb:o:" + id + ":0:0" },
      ]] },
    });
    if (r?.ok) await db.murojaatAdminMsg(env, id, r.result.message_id);
  }
  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: t("boglan.yuborildi"),
    reply_markup: menyu(),
  });
  return true;
}

/** "🌟 Qildik" tugmasidan keyin admin yozgan bitta gapni saqlaydi. */
/** «✉️ Javob yozish» bosilgach admin yozgan keyingi matn FAQAT shu fikr egasiga ketadi. */
async function fikrJavobYoz(env, chatId, text, entities = []) {
  const id = await db.tizimOqi(env, "fk:jv");
  if (!id || !text) return false;
  await db.tizimYoz(env, "fk:jv", "");
  if (text.startsWith("/")) {
    if (text.startsWith("/bekor")) await tg(env, "sendMessage", { chat_id: chatId, text: "Bekor qilindi." });
    return text.startsWith("/bekor");
  }
  const m = await env.DB.prepare("SELECT * FROM murojaat WHERE id = ?").bind(Number(id)).first();
  if (!m) { await tg(env, "sendMessage", { chat_id: chatId, text: "Fikr topilmadi." }); return true; }
  const javobHtml = entityHtml(text, entities);
  const r = await tg(env, "sendMessage", { chat_id: m.uid, parse_mode: "HTML", text: "📩 <b>Admin javobi</b>\n\n" + javobHtml });
  await db.murojaatJavob(env, m.id, text);
  await db.tizimYoz(env, "fk:jh:" + m.id, javobHtml.slice(0, 700)).catch(() => {});
  await tg(env, "sendMessage", { chat_id: chatId,
    text: r?.ok ? "✅ #" + m.id + " egasiga yuborildi (boshqa hech kimga ko'rinmaydi)." : "⚠️ #" + m.id + ": foydalanuvchi botni bloklagan bo'lishi mumkin — javob yetmadi.",
    reply_markup: { inline_keyboard: [[{ text: "📂 Xabarga qaytish", callback_data: "xb:o:" + m.id + ":0:0" }]] } });
  return true;
}

/** Hamkorlik (tizim kaliti fk:pub): admin «🤝 Hamkorlikka qo'shish» bosganda taklif/shikoyat + admin javobi hammaga ko'rinadi. */
async function fikrBolimOl(env) {
  try { return JSON.parse((await db.tizimOqi(env, "fk:pub")) || "[]"); } catch { return []; }
}
async function fikrBolimToggle(env, id) {
  const r = await fikrBolimOl(env);
  const i = r.findIndex((x) => x.id === id);
  if (i >= 0) { r.splice(i, 1); await db.tizimYoz(env, "fk:pub", JSON.stringify(r)); return false; }
  const m = await env.DB.prepare("SELECT matn, javob, ish, ism, uname FROM murojaat WHERE id = ?").bind(id).first();
  if (!m) return null;
  const jh = await db.tizimOqi(env, "fk:jh:" + id).catch(() => "");
  const tur = (await turOl(env))[id] || "x";
  r.unshift({ id, k: tur, u: m.uname ? "@" + m.uname : (m.ism || ""), m: String(m.matn).slice(0, 300),
    j: jh || (m.javob ? esc(String(m.javob).slice(0, 500)) : ""),
    i: m.ish ? String(m.ish).replace(/^[^\p{L}\p{N}«"]+/u, "").slice(0, 200) : "", d: new Date().toISOString().slice(0, 10) });
  await db.tizimYoz(env, "fk:pub", JSON.stringify(r.slice(0, 40)));
  return true;
}

/** Eski yozuvlarda javob matni saqlanmagan bo'lishi mumkin: bazadan bir marta to'ldiramiz. */
async function fikrBolimToldir(env, hammasi) {
  let ozgardi = false;
  for (const x of hammasi) {
    if (x.j || x.i || x.t) continue;
    const m = await env.DB.prepare("SELECT javob, ish FROM murojaat WHERE id = ?").bind(x.id).first().catch(() => null);
    x.t = 1;
    if (m?.javob) x.j = (await db.tizimOqi(env, "fk:jh:" + x.id).catch(() => "")) || esc(String(m.javob).slice(0, 500));
    else if (m?.ish) x.i = String(m.ish).replace(/^[^\p{L}\p{N}«"]+/u, "").slice(0, 200);
    ozgardi = true;
  }
  if (ozgardi) await db.tizimYoz(env, "fk:pub", JSON.stringify(hammasi)).catch(() => {});
}
const javobBlok = (x) => (x.j ? "<blockquote>" + x.j + "</blockquote>" : x.i ? "<blockquote>✅ " + esc(x.i) + "</blockquote>" : "<blockquote>✅ " + t("fikrb.qabul") + "</blockquote>");

/** 🤝 Hamkorlik — hamma ko'radigan toza ro'yxat (boshqaruv tugmalari YO'Q; ular adminning «Xabarlar» bo'limida). */
async function fikrBolimiKorsat(env, chatId, sahifa = 0, tahrir = null) {
  let hammasi = await fikrBolimOl(env);
  await fikrBolimToldir(env, hammasi);
  hammasi = hammasi.filter((x) => !x.h);
  const BOY = 3;
  const jami = Math.max(1, Math.ceil(hammasi.length / BOY));
  const n = Math.min(Math.max(0, sahifa), jami - 1);
  const r = hammasi.slice(n * BOY, n * BOY + BOY);
  const juft = (x) => "<b>" + turNom(x.k) + "</b>\n<blockquote>«" + esc(x.m.slice(0, 220)) + "»</blockquote>\n<b>" + t("fikrb.javob") + "</b>\n" + javobBlok(x);
  const matn = r.length ? t("fikrb.sarlavha") + "\n\n" + r.map(juft).join("\n\n") + "\n\n" + t("fikrb.past") : t("fikrb.bosh");
  const nav = [];
  if (n > 0) nav.push({ text: "◀️", callback_data: "fikrb:" + (n - 1) });
  if (jami > 1) nav.push({ text: (n + 1) + "/" + jami, callback_data: "fikrb:" + n });
  if (n < jami - 1) nav.push({ text: "▶️", callback_data: "fikrb:" + (n + 1) });
  const kb = [...(nav.length ? [nav] : []), [{ text: t("boglan.yozBtn"), callback_data: "fikrm" }], [{ text: t("sz.orqaga"), callback_data: "bk:b" }]];
  return ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: matn, reply_markup: { inline_keyboard: kb } });
}

/** 📬 Mening xabarlarim — foydalanuvchining o'z xabarlari va admin javoblari. */
async function meningXabarlar(env, chatId, uid, sah = 0, tahrir = null) {
  const BOY = 3;
  const jami = (await env.DB.prepare("SELECT COUNT(*) AS n FROM murojaat WHERE uid = ?").bind(String(uid)).first())?.n || 0;
  const sahJami = Math.max(1, Math.ceil(jami / BOY));
  const n = Math.min(Math.max(0, sah), sahJami - 1);
  const rows = (await env.DB.prepare("SELECT id, matn, javob, ish, at FROM murojaat WHERE uid = ? ORDER BY id DESC LIMIT ? OFFSET ?").bind(String(uid), BOY, n * BOY).all()).results || [];
  const turlar = await turOl(env);
  let matn;
  if (!rows.length) matn = t("mx.bosh");
  else {
    const bloklar = [];
    for (const m of rows) {
      const jh = m.javob ? ((await db.tizimOqi(env, "fk:jh:" + m.id).catch(() => "")) || esc(String(m.javob))) : "";
      bloklar.push("<b>" + turNom(turlar[m.id]) + "</b> · <i>" + sanaQisqa(m.at) + "</i>\n<blockquote>" + esc(String(m.matn).slice(0, 200)) + "</blockquote>\n" +
        (jh ? "<b>" + t("mx.javob") + "</b>\n<blockquote>" + jh + "</blockquote>\n" : "") +
        (m.ish ? "<b>" + t("mx.yechim") + "</b>\n<blockquote>" + esc(m.ish) + "</blockquote>\n" : "") +
        (!jh && !m.ish ? t("mx.kutish") + "\n" : ""));
    }
    matn = t("mx.sarlavha") + "\n\n" + bloklar.join("\n");
  }
  const nav = [];
  if (n > 0) nav.push({ text: "◀️", callback_data: "mx:" + (n - 1) });
  if (sahJami > 1) nav.push({ text: (n + 1) + "/" + sahJami, callback_data: "mx:" + n });
  if (n < sahJami - 1) nav.push({ text: "▶️", callback_data: "mx:" + (n + 1) });
  const kb = [...(nav.length ? [nav] : []), [{ text: t("boglan.yozBtn"), callback_data: "fikrm" }], [{ text: t("sz.orqaga"), callback_data: "bk:b" }]];
  return ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: matn, reply_markup: { inline_keyboard: kb } });
}

// ——————————————————————————————————————————————— Xabarlar (admin pochta qutisi)

const XB_JAVOBSIZ = "javob IS NULL AND ish IS NULL";
const TUR_BELGI = { t: "💡", s: "⚠️", q: "❓", x: "💬" };
const turBelgi = (k) => TUR_BELGI[TUR_BELGI[k] ? k : "x"];
function xbVaqt(utc) {
  const d = new Date(String(utc).replace(" ", "T") + "Z");
  d.setUTCHours(d.getUTCHours() + 5);
  return d.getUTCDate() + "-" + OY[d.getUTCMonth()] + " " + d.toISOString().slice(11, 16);
}
const xbKim = (m) => (m.uname ? "@" + m.uname : (m.ism || "Ism yo'q"));

async function xabarlarRoyxat(env, chatId, f = 0, sah = 0, tahrir = null) {
  const BOY = 6;
  const javobsiz = (await env.DB.prepare("SELECT COUNT(*) AS n FROM murojaat WHERE " + XB_JAVOBSIZ).first())?.n || 0;
  const javoblangan = (await env.DB.prepare("SELECT COUNT(*) AS n FROM murojaat WHERE NOT (" + XB_JAVOBSIZ + ")").first())?.n || 0;
  const jami = f ? javoblangan : javobsiz;
  const sahJami = Math.max(1, Math.ceil(jami / BOY));
  const n = Math.min(Math.max(0, sah), sahJami - 1);
  const rows = (await env.DB.prepare("SELECT id, ism, uname, matn FROM murojaat WHERE " + (f ? "NOT (" + XB_JAVOBSIZ + ")" : XB_JAVOBSIZ) +
    " ORDER BY id DESC LIMIT ? OFFSET ?").bind(BOY, n * BOY).all()).results || [];
  const turlar = await turOl(env);
  const text = "📥 <b>Xabarlar</b>\n\n" + (f ? "✅ Javob berilgan" : "🕓 Javobsiz") + ": <b>" + jami + "</b> ta" +
    (!rows.length ? "\n\n<blockquote>" + (f ? "Hali javob berilgan xabar yo'q." : "Hammasiga javob berilgan 🎉") + "</blockquote>" : "\n\n<i>Ochish uchun xabarni tanlang.</i>");
  const kb = rows.map((r) => [{ text: (turBelgi(turlar[r.id]) + " " + xbKim(r) + " · " + String(r.matn).replace(/\s+/g, " ")).slice(0, 56), callback_data: "xb:o:" + r.id + ":" + f + ":" + n }]);
  const nav = [];
  if (n > 0) nav.push({ text: "◀️", callback_data: "xb:l:" + f + ":" + (n - 1) });
  if (sahJami > 1) nav.push({ text: (n + 1) + "/" + sahJami, callback_data: "xb:l:" + f + ":" + n });
  if (n < sahJami - 1) nav.push({ text: "▶️", callback_data: "xb:l:" + f + ":" + (n + 1) });
  if (nav.length) kb.push(nav);
  kb.push([{ text: (f ? "" : "• ") + "🕓 Javobsiz (" + javobsiz + ")", callback_data: "xb:l:0:0" }, { text: (f ? "• " : "") + "✅ Javob berilgan (" + javoblangan + ")", callback_data: "xb:l:1:0" }]);
  kb.push([{ text: "🤝 Hamkorlik boshqaruvi", callback_data: "xb:hk:0" }]);
  kb.push([{ text: "↩️ Orqaga", callback_data: "adm:panel" }]);
  return ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: kb } });
}

async function xabarOch(env, chatId, id, f = 0, sah = 0, tahrir = null) {
  const m = await env.DB.prepare("SELECT * FROM murojaat WHERE id = ?").bind(id).first();
  if (!m) return ozgartir(env, tahrir, { chat_id: chatId, text: "Xabar topilmadi." });
  const pub = (await fikrBolimOl(env)).find((x) => x.id === id);
  const tur = (await turOl(env))[id];
  const jh = m.javob ? ((await db.tizimOqi(env, "fk:jh:" + id).catch(() => "")) || esc(String(m.javob))) : "";
  // Foydalanuvchi xabar yozishdan oldin nima ko'rayotgan edi: oxirgi 30 daqiqadagi javoblari (savol matni bazadan topiladi)
  let oxirgi = "";
  try {
    const javoblar = (await env.DB.prepare(
      "SELECT qid, correct, skipped, mode, at FROM answers WHERE uid = ? AND at <= ? AND at >= datetime(?, '-30 minutes') ORDER BY id DESC LIMIT 3"
    ).bind(String(m.uid), m.at, m.at).all()).results || [];
    const MODE_NOM = { d: "Kunlik", k: "Kitob", r: "Kitob (ru)", s: "Mashq", a: "Arab", x: "Xatolarim" };
    const qatorlar = javoblar.map((r) => {
      const q = savolTop(r.qid);
      return "• " + (r.skipped ? "⏰" : r.correct ? "✅" : "❌") + " <i>" + (MODE_NOM[r.mode] || r.mode) + "</i> · " +
        (q ? esc(String(q.q).replace(/\s+/g, " ").slice(0, 160)) : "savol topilmadi (<code>" + esc(r.qid) + "</code>)");
    });
    if (qatorlar.length) oxirgi = "🧩 <b>Yozishdan oldin ko'rgan savollari</b>\n<blockquote>" + qatorlar.join("\n") + "</blockquote>\n\n";
  } catch (e) { console.error("xabarSavol", String(e).slice(0, 120)); }
  const holat = !pub ? "Hamkorlikda yo'q" : pub.h ? "🙈 Hamkorlikda yashirin" : "👁 Hamkorlikda ko'rinadi";
  const text = "<b>" + t("tur." + (TUR_KALITLAR.includes(tur) ? tur : "x"), "uz") + " · #" + m.id + "</b>\n" +
    "👤 <a href=\"tg://user?id=" + esc(m.uid) + "\">" + esc(m.ism || "Ism yo'q") + "</a>" + (m.uname ? " · @" + esc(m.uname) : "") + " · <code>" + esc(m.uid) + "</code>\n" +
    "<i>" + xbVaqt(m.at) + "</i>\n\n<blockquote>" + esc(String(m.matn).slice(0, 1500)) + "</blockquote>\n\n" + oxirgi +
    (jh ? "↳ <b>Javobingiz</b>\n<blockquote>" + jh + "</blockquote>\n" : "") +
    (m.ish ? "✅ <b>Yechim</b>\n<blockquote>" + esc(m.ish) + "</blockquote>\n" : "") +
    (!jh && !m.ish ? "🕓 <i>Hali javob berilmagan</i>\n" : "") + "\n🤝 " + holat;
  const sfx = ":" + f + ":" + sah;
  const kb = [
    [{ text: "✉️ Javob yozish", callback_data: "fk:jv:" + id }, { text: "✅ Yechim yozish", callback_data: "fk:ish:" + id }],
    pub
      ? [{ text: pub.h ? "👁 Ko'rsatish" : "🙈 Yashirish", callback_data: "xb:h:" + id + sfx }, { text: "🗑 Hamkorlikdan olish", callback_data: "xb:d:" + id + sfx }]
      : [{ text: "🤝 Hamkorlikka chiqarish", callback_data: "xb:a:" + id + sfx }],
    ...(/^\d+$/.test(String(m.uid)) ? [[{ text: "👤 Profilni ochish", url: "tg://user?id=" + m.uid }]] : []),
    [{ text: "🗑 Xabarni o'chirish", callback_data: "xb:x:" + id + sfx }],
    [{ text: "↩️ Orqaga", callback_data: "xb:l:" + f + ":" + sah }],
  ];
  return ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: kb } });
}

/** Admin: Hamkorlikda e'lon qilingan yozuvlarni boshqarish (ko'rsatish / yashirish / olib tashlash). */
async function hamkorlikAdmin(env, chatId, sah = 0, tahrir = null) {
  const hammasi = await fikrBolimOl(env);
  await fikrBolimToldir(env, hammasi);
  const BOY = 3;
  const jami = Math.max(1, Math.ceil(hammasi.length / BOY));
  const n = Math.min(Math.max(0, sah), jami - 1);
  const r = hammasi.slice(n * BOY, n * BOY + BOY);
  const korinadi = hammasi.filter((x) => !x.h).length;
  const juft = (x) => "<b>" + turNom(x.k) + " · #" + x.id + "</b>" + (x.u ? " · " + esc(x.u) : "") + " · " + (x.h ? "🙈 yashirin" : "👁 ko'rinadi") +
    "\n<blockquote>«" + esc(x.m.slice(0, 160)) + "»</blockquote>\n" + javobBlok(x);
  const text = "🤝 <b>Hamkorlik boshqaruvi</b>\n\nE'lon qilingan: <b>" + hammasi.length + "</b> · foydalanuvchilarga ko'rinadi: <b>" + korinadi + "</b>" +
    (r.length ? "\n\n" + r.map(juft).join("\n\n") : "\n\n<blockquote>Hali hech narsa e'lon qilinmagan. Xabarni ochib «🤝 Hamkorlikka chiqarish» ni bosing.</blockquote>");
  const boshqaruv = r.map((x) => [
    { text: (x.h ? "👁 Ko'rsatish #" : "🙈 Yashirish #") + x.id, callback_data: "fkh:" + x.id + ":" + n },
    { text: "🗑 Olish #" + x.id, callback_data: "fkd:" + x.id + ":" + n },
  ]);
  const nav = [];
  if (n > 0) nav.push({ text: "◀️", callback_data: "xb:hk:" + (n - 1) });
  if (jami > 1) nav.push({ text: (n + 1) + "/" + jami, callback_data: "xb:hk:" + n });
  if (n < jami - 1) nav.push({ text: "▶️", callback_data: "xb:hk:" + (n + 1) });
  const kb = [...boshqaruv, ...(nav.length ? [nav] : []), [{ text: "👀 Foydalanuvchi ko'rinishi", callback_data: "fikrb" }], [{ text: "↩️ Orqaga", callback_data: "xb:l:0:0" }]];
  return ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: kb } });
}

async function fikrIshYoz(env, chatId, text) {
  const id = await db.tizimOqi(env, "fk:kut");
  if (!id || !text) return false;
  await db.tizimYoz(env, "fk:kut", "");
  if (text.startsWith("/")) {
    if (text.startsWith("/bekor")) await tg(env, "sendMessage", { chat_id: chatId, text: "Bekor qilindi." });
    return text.startsWith("/bekor");
  }
  const ish = text.slice(0, 200);
  const m = await db.murojaatIsh(env, Number(id), ish);
  if (!m) { await tg(env, "sendMessage", { chat_id: chatId, text: "Fikr topilmadi." }); return true; }
  // Fikr egasiga ham bildiramiz: "eshitildi" hissi eng kuchli sovg'a
  const tilM = await tilOl(env, m.uid);
  await tg(env, "sendMessage", { chat_id: m.uid, parse_mode: "HTML",
    text: t("fikr.ishBerdi", tilM, { fikr: esc(m.matn.slice(0, 120)), ish: esc(ish) }) });
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: `✅ #${m.id} saqlandi. Hafta oxirida <b>/nimaqildik</b> — tayyor post chiqaraman.`,
    reply_markup: { inline_keyboard: [[{ text: "📂 Xabarga qaytish", callback_data: "xb:o:" + m.id + ":0:0" }]] } });
  return true;
}

/** /nimaqildik — "Siz aytdingiz, biz qildik" postini yig'adi va /elon tasdiqlash oqimiga uzatadi. */
async function nimaQildik(env, chatId) {
  const q = await db.murojaatOchiq(env, 8);
  if (!q.length) {
    await tg(env, "sendMessage", { chat_id: chatId,
      text: "Hozircha e'lon qilinadigan ish yo'q. /fikrlar dan fikrni tanlab, 🌟 tugmasini bosing." });
    return;
  }
  const matn =
    "{{elon}}\n\n🛠 <b>Siz aytdingiz — biz qildik</b>\n\n" +
    q.map((r) => `💬 «${esc(r.matn.slice(0, 100))}»\n✅ ${esc(String(r.ish).replace(/^[^\p{L}\p{N}«"]+/u, ""))}`).join("\n\n") +
    "\n\n<blockquote>Fikringiz bizga muhim — botda <b>Profilim → 💬 Biz bilan bog'lanish</b> orqali yozing.</blockquote> 🤝";
  const r = await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: matn });
  if (!r?.ok) return;
  await db.tizimYoz(env, "elon:src", `${chatId}:${r.result.message_id}`);
  await db.tizimYoz(env, "fk:ids", q.map((x) => x.id).join(","));
  const soni = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE blocked = 0").first();
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: `Ism ko'rsatilmaydi (anonim). Qabul qiluvchilar: <b>${soni?.n ?? 0}</b> ta.`,
    reply_markup: { inline_keyboard: [
      [{ text: "✅ Tasdiqlash va yuborish", callback_data: "elon:ok" }],
      [{ text: "✖️ Bekor qilish", callback_data: "elon:yoq" }],
    ] } });
}

/** Admin foydalanuvchining fikriga reply qilsa — javob foydalanuvchiga boradi. */
async function fikrJavob(env, msg, text) {
  const rep = msg.reply_to_message;
  if (!rep || !text || text.startsWith("/")) return false;
  const m = await db.murojaatTop(env, rep.message_id);
  if (!m) return false;
  const r = await tg(env, "sendMessage", {
    chat_id: m.uid,
    parse_mode: "HTML",
    text: `📩 <b>Admin javobi</b>\n\n${entityHtml(text, msg.entities || [])}`,
  });
  await db.murojaatJavob(env, m.id, text);
  await db.tizimYoz(env, "fk:jh:" + m.id, entityHtml(text, msg.entities || []).slice(0, 700)).catch(() => {});
  await tg(env, "sendMessage", {
    chat_id: msg.chat.id,
    text: r?.ok ? `✅ #${m.id} ga javob yuborildi.` : `⚠️ #${m.id}: foydalanuvchi botni bloklagan bo'lishi mumkin — javob yetmadi.`,
  });
  return true;
}

// ——————————————————————————————————————————————— profil va premium

const PREMIUM_FOYDA = "Kun g'olibi (reytingda 1-o'rin) 1 kunlik premium oladi: 💎 belgi va mavzular bo'yicha kengaytirilgan statistika. Bugun siz bo'lishingiz mumkin!";

function sanaQisqa(utc) {
  const d = new Date(String(utc).replace(" ", "T") + "Z");
  return `${d.getUTCDate()}-${OY[d.getUTCMonth()]}`;
}

async function profilKorsat(env, chatId, uid, tahrir = null) {
  if (uid == null) uid = chatId;
  const [u, st, prem, yutuq, arab] = await Promise.all([
    getUser(env, uid), db.statistika(env, uid), db.premiumHolat(env, uid),
    db.yutuqlarim(env, uid), db.arabBosqich(env, uid),
  ]);
  const pct = st.jami ? Math.round((st.togri / st.jami) * 100) : 0;
  const superFaol = u.super_until && u.super_until > new Date().toISOString().slice(0, 19).replace("T", " ");
  const nom = (superFaol ? "🧠 " : "") + esc(u.name || "Foydalanuvchi") + (u.uname ? ` · @${esc(u.uname)}` : "");
  const asos =
    `🔥 Zanjir: <b>${u.streak || 0}</b> kun · Ishlagan kunlar: <b>${u.days || 0}</b>\n` +
    `📖 Ilm olish sirlari: ${progressBar(u.kitob || 0)} <b>${u.kitob || 0}/${KITOB_JAMI}</b>\n` +
    `🔤 Arab alifbosi: ${progressBar(arab, ARAB_BLOKLAR.length)} <b>${arab}/${ARAB_BLOKLAR.length}</b>\n` +
    `🎯 Aniqlik: <b>${pct}%</b> (${st.jami} ta javob)\n` +
    `🏅 Yutuqlar: <b>${yutuq.length}</b>`;

  let matn;
  if (prem) {
    // Premium: kengaytirilgan statistika — mavzular kesimi (kuchli va zaif tomonlar)
    const m = st.mavzular.filter((x) => x.a >= 5)
      .map((x) => ({ ...x, f: Math.round((x.c / x.a) * 100) })).sort((a, b) => b.f - a.f);
    const kuchli = m.slice(0, 2).map((x) => `${topicLabel(x.topic)} — ${x.f}%`).join("\n   ");
    const zaif = m.length > 2 ? m.slice(-2).reverse().map((x) => `${topicLabel(x.topic)} — ${x.f}%`).join("\n   ") : "";
    matn =
      `💎 <b>PREMIUM</b>\n━━━━━━━━━━━━━━━\n` +
      `<b>${nom}</b>\n━━━━━━━━━━━━━━━\n\n${asos}\n\n` +
      (kuchli ? `💪 <b>Kuchli tomonlar</b>\n   ${kuchli}\n\n` : "") +
      (zaif ? `🎯 <b>Mustahkamlash kerak</b>\n   ${zaif}\n\n` : "") +
      `━━━━━━━━━━━━━━━\n💎 Premium: <b>${sanaQisqa(prem.tugaydi)}</b> gacha`;
  } else {
    matn = `👤 <b>Mening profilim</b>\n\n<b>${nom}</b>\n\n${asos}\n\n💎 <i>Premium: faol emas. ${PREMIUM_FOYDA}</i>`;
  }
  await ozgartir(env, tahrir, { chat_id: chatId, parse_mode: "HTML", text: matn, reply_markup: profilTugmalari() });
}

/** Admin: /premium_ber <uid> [kun], /premium_ol <uid>, /premium */
async function premiumAdmin(env, chatId, text) {
  const [buyruq, id, kunS] = text.split(/\s+/);
  const yoz = (t) => tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: t });
  if (buyruq === "/premium_ber") {
    const kun = Math.min(Math.max(parseInt(kunS || "30", 10) || 30, 1), 3650);
    if (!/^\d+$/.test(id || "")) return yoz("Foydalanish: <code>/premium_ber &lt;uid&gt; [kun]</code>");
    const p = await db.premiumBer(env, id, kun, "admin");
    await tg(env, "sendMessage", { chat_id: id, parse_mode: "HTML",
      text: `💎 <b>Sizga Premium berildi!</b>\n\n${sanaQisqa(p.tugaydi)} gacha faol. ` +
            `Profilingiz va reytingdagi nomingiz endi 💎 belgisi bilan ko'rinadi.` }).catch(() => {});
    return yoz(`✅ ${id} ga ${kun} kun Premium berildi (${sanaQisqa(p.tugaydi)} gacha).`);
  }
  if (buyruq === "/premium_ol") {
    if (!/^\d+$/.test(id || "")) return yoz("Foydalanish: <code>/premium_ol &lt;uid&gt;</code>");
    await db.premiumOl(env, id);
    return yoz(`✅ ${id} dan Premium olindi.`);
  }
  const r = await db.premiumRoyxat(env);
  return yoz(r.length
    ? `💎 <b>Faol premium: ${r.length}</b>\n\n` + r.map((x) =>
        `${esc(x.name || x.uid)}${x.uname ? " @" + esc(x.uname) : ""} · <code>${x.uid}</code> · ${sanaQisqa(x.tugaydi)} gacha (${x.manba})`).join("\n")
    : "Hozircha premium foydalanuvchi yo'q.\n\n<code>/premium_ber &lt;uid&gt; [kun]</code>");
}

// ——————————————————————————————————————————————— admin hisoboti va soqchi

/** Kunlik hisobot (DATA → TAHLIL → HARAKAT). Faqat bazadan: o'ylab topilgan raqam yo'q. */
async function adminHisobotYubor(env) {
  if (!env.ADMIN_ID) return;
  const kun = dayKey();
  const r = await db.adminHisobot(env, kun);
  const h = r.h;
  const foizYakun = h.boshlagan ? Math.round((h.yakunlagan / h.boshlagan) * 100) : 0;
  const aniqlik = h.javob ? Math.round((h.togri / h.javob) * 100) : null;

  // 7 kunlik trend: kunlar bo'yicha yakunlaganlar (bugun — oxirgisi)
  const tr = r.trend.map((x) => x.n);
  const oldingi = r.trend.filter((x) => x.day !== kun).map((x) => x.n);
  const ortacha = oldingi.length ? oldingi.reduce((a, b) => a + b, 0) / oldingi.length : null;

  // Kun tugamagan bo'lsa (Toshkent 21:00 gacha) "bugun past" degan xulosa chiqarmaymiz — yarim kunni to'liq kunga solishtirish soxta signal.
  const kunTugadi = new Date(Date.now() + 5 * 3600e3).getUTCHours() >= 21;
  const ogoh = [], harakat = [];
  if (kunTugadi && ortacha !== null && ortacha >= 5 && h.yakunlagan < ortacha * 0.5)
    ogoh.push(`🚨 Bugun yakunlaganlar (${h.yakunlagan}) oldingi kunlar o'rtachasidan (${ortacha.toFixed(0)}) ancha past.`);
  if (r.fikr > 0) {
    ogoh.push(`💬 Javobsiz xabarlar: <b>${r.fikr}</b> ta.`);
    harakat.push(`Xabarlarga javob bering (pastdagi 📥 tugma) — javob olgan foydalanuvchi qaytishi ehtimoli yuqori (taxmin).`);
  }
  if (r.xavf > 0)
    harakat.push(`So'nggi 3–14 kunda ko'rinmagan ${r.xavf} ta faol foydalanuvchi bor — shaxsiy eslatma yoki yangi funksiya e'lonini yuboring.`);
  const qiyin = r.qiyin.map((x) => ({ ...x, f: Math.round((x.c / x.a) * 100) })).sort((a, b) => a.f - b.f)[0];
  if (qiyin && qiyin.f < 60)
    harakat.push(`7 kunda eng past aniqlik: ${topicLabel(qiyin.topic)} — ${qiyin.f}%. Shu mavzuga izoh yoki savol qo'shing.`);
  if (kunTugadi && h.boshlagan && foizYakun < 70)
    harakat.push(`Boshlaganlarning faqat ${foizYakun}% i yakunlayapti — savollar soni/qiyinligini ko'rib chiqing (taxmin).`);
  if (!harakat.length) harakat.push("Bugun alohida chora talab qilinadigan signal yo'q.");

  const MANBA_NOM = { un: "@ustozimnurim", sf: "@sahifalarustozimnurim", co: "@ustozimnurimco", qr: "@quranoy" };
  const manbaNom = (m) => { const k = String(m || "").replace(/^ch_/, "").split("_")[0]; return MANBA_NOM[k] || (m ? esc(m) : "to'g'ridan-to'g'ri"); };
  const manbaQator = r.manbaBugun.length ? r.manbaBugun.map((x) => manbaNom(x.m) + " " + x.n).join(" · ") : "—";
  const farq = ortacha === null ? "" : h.yakunlagan >= ortacha ? " ↑" : " ↓";
  const kt = await db.ketganlar(env, 1, 0).catch(() => ({ jami: 0, qaytdi: 0 }));
  if (kt.jami > 0) ogoh.push(`⛔ Oxirgi 24 soatda ${kt.jami} kishi botni to'xtatdi — ro'yxat: Admin paneli → 👥 Foydalanuvchilar.`);
  const text =
    "📊 <b>Kunlik hisobot</b> · " + sanaUz() + "\n\n" +
    "👥 <b>Foydalanuvchilar</b>\n<blockquote>" +
    "Jami: <b>" + r.jami + "</b> · bloklagan: " + r.bloklagan + "\n" +
    "Yangi bugun: <b>" + r.yangi + "</b>" + (r.yangi ? " (" + manbaQator + ")" : "") + (kt.jami || kt.qaytdi ? " · ⛔ to'xtatgan: <b>" + kt.jami + "</b> · ↩️ qaytgan: <b>" + kt.qaytdi + "</b>" : "") + "\n" +
    "Faol: bugun <b>" + r.dau + "</b> · 7 kun <b>" + r.wau + "</b> · 30 kun <b>" + r.mau + "</b>\n" +
    "💎 Premium: <b>" + r.prem + "</b></blockquote>\n\n" +
    "🧠 <b>Kunlik viktorina</b>\n<blockquote>" +
    "Boshlagan: <b>" + h.boshlagan + "</b> · yakunlagan: <b>" + h.yakunlagan + "</b>" + (h.boshlagan ? " (" + foizYakun + "%)" : "") + farq + "\n" +
    "Aniqlik: <b>" + (aniqlik === null ? "data mavjud emas" : aniqlik + "%") + "</b>\n" +
    "7 kun: " + (tr.length ? tr.join(" · ") : "data mavjud emas") + (kunTugadi ? "" : "\n<i>Bugun hali tugamagan — oxirgi son to'liq emas.</i>") + "</blockquote>\n\n" +
    "⚔️ <b>Duel</b>\n<blockquote>Ochilgan: <b>" + r.duelOchildi + "</b> · yakunlangan: <b>" + r.duelTugadi + "</b></blockquote>\n\n" +
    (ogoh.length ? "🚨 <b>Diqqat</b>\n<blockquote>" + ogoh.join("\n") + "</blockquote>\n\n" : "") +
    "🎯 <b>Ertaga uchun</b>\n" + harakat.slice(0, 4).map((x, i) => (i + 1) + ". " + x).join("\n") +
    "\n\n<i>Taxmin deb belgilanganlar — fakt emas, kuzatuv.</i>";
  const kb = [[{ text: "📥 Xabarlar" + (r.fikr ? " (" + r.fikr + ")" : ""), callback_data: "adm:fikr" }, { text: "🏆 Reyting", callback_data: "rk:v:b" }],
    [{ text: "🛠 Admin panel", callback_data: "adm:panel" }]];
  await tg(env, "sendMessage", { chat_id: env.ADMIN_ID, parse_mode: "HTML", text, reply_markup: { inline_keyboard: kb } });

}

const SOQCHI_OXIRGI = new Map();     // toifa → oxirgi yuborilgan vaqt (xotirada: baza ishlamasa ham ishlaydi)
const SOQCHI_SOVUSH_MS = 3 * 3600 * 1000;

async function soqchiXabar(env, toifa, matn) {
  const hozir = Date.now();
  if (hozir - (SOQCHI_OXIRGI.get(toifa) || 0) < SOQCHI_SOVUSH_MS) return;
  SOQCHI_OXIRGI.set(toifa, hozir);
  if (env.ADMIN_ID) await tg(env, "sendMessage", { chat_id: env.ADMIN_ID, parse_mode: "HTML", text: matn }).catch(() => {});
}

/**
 * Soqchi — har 30 daqiqada: baza ishlayaptimi, webhook sog'lommi.
 * Foydalanuvchi shikoyat qilishini kutmasdan admin bilib olishi uchun.
 */
async function soqchi(env) {
  let bazaOk = true;
  try {
    await env.DB.prepare("SELECT 1 AS n").first();
  } catch (e) {
    bazaOk = false;
    const toifa = xatoToifasi(String((e && e.message) || e));
    if (toifa === "limit") await env.SESSIONS?.put("d1:limit", String(Date.now()), { expirationTtl: 86400 }).catch(() => {});
    await soqchiXabar(env, "baza",
      `🚨 <b>SOQCHI: baza javob bermayapti</b>\nToifa: <code>${toifa}</code>\n${esc(String((e && e.message) || e).slice(0, 200))}\n\n` +
      (toifa === "limit" ? "Kunlik limit tugagan: Workers Paid tarifiga o'tish kerak." : "Cloudflare holatini tekshiring."));
  }

  try {
    const w = (await tg(env, "getWebhookInfo", {})).result || {};
    if (!w.url) await soqchiXabar(env, "webhook", "🚨 <b>SOQCHI: webhook o'rnatilmagan</b> — bot xabar olmayapti.");
    else if (w.last_error_date && Date.now() / 1000 - w.last_error_date < 35 * 60 &&
             // «Connection reset by peer», timeout kabi bir martalik tarmoq uzilishlari
             // Telegram tomonidan o'zi qayta uriniladi: kutayotgan yangilanish yo'q bo'lsa — bezovta qilmaymiz.
             !(/reset by peer|timed? ?out|temporar|try again/i.test(String(w.last_error_message || "")) &&
               (w.pending_update_count || 0) < 5))
      await soqchiXabar(env, "webhook-xato",
        `⚠️ <b>SOQCHI: Telegram webhook xatosi</b>\n${esc(String(w.last_error_message || "").slice(0, 200))}`);
    else if ((w.pending_update_count || 0) > 100)
      await soqchiXabar(env, "navbat", `⚠️ <b>SOQCHI: kutayotgan yangilanishlar ${w.pending_update_count} ta</b> — bot ortda qolmoqda.`);
  } catch (e) {
    console.warn("soqchi/webhook", e);
  }

  // Tiklanish haqida xabar: avval xato bo'lgan, endi hammasi joyida
  if (bazaOk) {
    try {
      if ((await db.tizimOqi(env, "soqchi:holat")) === "xato") {
        await db.tizimYoz(env, "soqchi:holat", "ok");
        if (env.ADMIN_ID) await tg(env, "sendMessage", { chat_id: env.ADMIN_ID, text: "✅ Soqchi: baza qayta ishlayapti." }).catch(() => {});
      }
    } catch {}
  } else {
    try { await db.tizimYoz(env, "soqchi:holat", "xato"); } catch {}
  }
}

async function handleMessage(env, msg) {
  if (msg.chat.type !== "private") return;
  const uid = msg.from.id;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const name = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ");

  if (msg.document && String(uid) === String(env.ADMIN_ID) && !(await db.tizimOqi(env, "elon:kutish"))) {
    if (await libQoshish(env, chatId, msg)) return;
  }
  if (String(uid) === String(env.ADMIN_ID) && /^\/kutubxona(@\w+)?$/.test(text)) return libAdmin(env, chatId);

  // ——— Premium va profil
  if (String(uid) === String(env.ADMIN_ID) && /^\/premium(_ber|_ol)?(\s|$)/.test(text)) return premiumAdmin(env, chatId, text);
  if (text.startsWith("/profil") || text.startsWith("/premium")) return profilKorsat(env, chatId, uid);
  if (String(uid) === String(env.ADMIN_ID) && text.startsWith("/hisobot")) return adminHisobotYubor(env);
  if (String(uid) === String(env.ADMIN_ID) && /^\/tavsif(@\w+)?$/.test(text)) return tavsifYoz(env, chatId);
  if (String(uid) === String(env.ADMIN_ID) && /^\/users(@\w+)?$/.test(text)) return adminUsers(env, chatId);

  // ——— Fikr-mulohazalar: admin javobi va foydalanuvchi xabari
  if (String(uid) === String(env.ADMIN_ID) && await fikrJavobYoz(env, chatId, text, msg.entities || [])) return;
  if (String(uid) === String(env.ADMIN_ID) && await fikrIshYoz(env, chatId, text)) return;
  if (String(uid) === String(env.ADMIN_ID) && /^\/nimaqildik(@\w+)?(\s|$)/.test(text)) return nimaQildik(env, chatId);
  if (String(uid) === String(env.ADMIN_ID) && await fikrJavob(env, msg, text)) return;
  if (await fikrQabul(env, msg, uid, chatId, text)) return;
  if ((text.startsWith("/fikrlar") || /^\/xabarlar(@\w+)?$/.test(text)) && String(uid) === String(env.ADMIN_ID)) return xabarlarRoyxat(env, chatId);
  if (String(uid) === String(env.ADMIN_ID) && /^\/admin(@\w+)?(\s|$)/.test(text)) return adminPanel(env, chatId);
  if (String(uid) === String(env.ADMIN_ID)) {
    if (/^\/limit(@\w+)?$/.test(text)) return d1Holat(env, chatId);
    if (/^\/soz(@\w+)?(\s|$)/.test(text) && await sozBuyruq(env, chatId, msg, text)) return;
    const em = /^\/emoji(@\w+)?(?:\s+([\s\S]+))?$/.exec(text);
    if (em) return emojiBuyruq(env, chatId, em[2] || "");
    // Qulaylik: emoji paketi havolasini shunchaki yuborsa ham ulanadi (buyruq yozish shart emas)
    const hv = !text.startsWith("/") && /t\.me\/addemoji\/(\w+)/.exec(text);
    if (hv) return emojiBuyruq(env, chatId, `paket ${hv[1]}`);
    const pm = /^\/post(@\w+)?(?:\s+([\s\S]+))?$/.exec(text);
    if (pm) return postLoyiha(env, chatId, (pm[2] || "").trim() || undefined);
    const mm = /^\/mavzu(@\w+)?(?:\s+([\s\S]+))?$/.exec(text);
    if (mm) return postMavzuBuyruq(env, chatId, (mm[2] || "").trim());
  }

  if (text.startsWith("/fikr") && !text.startsWith("/fikrlar")) return fikrBoshla(env, chatId, uid);

  // Admin sinovi: bugungi kunlik viktorinani tozalab, noldan qayta boshlaydi.
  if (text.startsWith("/qayta")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    const U = String(uid), kun = dayKey();
    await env.DB.prepare("DELETE FROM answers WHERE uid = ? AND mode = 'd' AND day = ?").bind(U, kun).run();
    await env.DB.prepare("DELETE FROM daily WHERE uid = ? AND day = ?").bind(U, kun).run();
    await env.DB.prepare("DELETE FROM polls WHERE uid = ? AND mode = 'd'").bind(U).run();
    await tg(env, "sendMessage", { chat_id: chatId, text: "🔄 Bugungi viktorina tozalandi — noldan boshlaymiz." });
    return startDaily(env, chatId, uid, msg.from?.first_name || "");
  }

  if (text.startsWith("/rasm_isit")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    return rasmIsit(env, chatId);
  }

  // ——— Rasmli yangilik: Gemini brend rasmini yaratadi, admin ko'rib tasdiqlaydi.
  if (text.startsWith("/rasmli")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    const manba = msg.reply_to_message;
    if (!manba || !(manba.text || manba.caption)) {
      await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
        text: "🎨 <b>Rasmli yangilik</b>\n\nYangilik matnini yozing, so'ng <b>o'sha xabarga javob qilib</b> /rasmli deb yuboring. " +
              "Bot brend uslubida rasm yaratadi va tarqatishdan oldin sizga ko'rsatadi." });
      return;
    }
    await db.tizimYoz(env, "elon:matn", entityHtml(manba.text || manba.caption, manba.entities || manba.caption_entities));
    return rasmliKorik(env, chatId);
  }

  // ——— Tarqatma (faqat admin): /elon → tayyor postni yuboring → ko'rib chiqing → tasdiqlang.
  if (String(uid) === String(env.ADMIN_ID)) {
    if (/^\/elon(@\w+)?(\s|$)/.test(text)) return elonBoshla(env, chatId);
    if (await db.tizimOqi(env, "elon:kutish") === "1") {
      if (/^\/bekor/.test(text)) {
        await db.tizimYoz(env, "elon:kutish", "");
        await tg(env, "sendMessage", { chat_id: chatId, text: "✖️ Tarqatma bekor qilindi." });
        return;
      }
      if (!text.startsWith("/")) {
        await db.tizimYoz(env, "elon:kutish", "");
        const uzun = (msg.caption || "").length > 1000;
        if (uzun) await db.tizimYoz(env, "elon:matn", entityHtml(msg.caption, msg.caption_entities));
        const srcKalit = `${chatId}:${msg.message_id}${uzun ? ":u" : ""}`;
        await db.tizimYoz(env, "elon:src", srcKalit);
        const soni = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE blocked = 0").first();
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "👀 <b>Foydalanuvchi shunday ko'radi:</b>" });
        await postYubor(env, chatId, srcKalit);
        await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
          text: `Qabul qiluvchilar: <b>${soni?.n ?? 0}</b> ta\n<i>Yuborilgan xabarni qaytarib olib bo'lmaydi.</i>`,
          reply_markup: { inline_keyboard: [
            [{ text: "✅ Tasdiqlash va yuborish", callback_data: "elon:ok" }],
            [{ text: "✖️ Bekor qilish", callback_data: "elon:yoq" }],
          ] } });
        return;
      }
    }
  }

  if (text.startsWith("/start")) {
    const u = await getUser(env, uid);
    await saveUser(env, uid, u); // ro'yxatga olish

    const arg = (text.split(/\s+/)[1] || "").trim();

    // ATRIBUSIYA. Birinchi manba — haqiqiy manba: odam keyinroq
    // boshqa havola bilan qaytsa ham, uni ASLIDA kim olib kelgani
    // o'zgarmaydi (db.manbaYoz COALESCE bilan yozadi).
    if (arg) {
      const kelgan = arg.startsWith("d_") ? arg.slice(2) : null;
      // O'zini o'zi taklif qilish hisobga olinmaydi.
      await db.manbaYoz(env, uid, kelgan && kelgan !== String(uid) ? kelgan : null, arg);
    }
    if (/^w_\d+$/.test(arg)) return duelQoshil(env, chatId, uid, parseInt(arg.slice(2), 10));
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
    const salom = t("start.salom", undefined, { ism: esc(msg.from.first_name || "do'stim") });
    if (await introYubor(env, chatId, salom, menyu())) return;
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: salom, reply_markup: menyu() });
    return;
  }

  // Tugma yozuvi → amal. Xarita ikki tilni ham, eski yozuvlarni ham
  // bitta joyda ushlaydi (src/matn.js dagi AMAL).
  const amal = AMAL.get(text);
  if (amal === "bugun")     return bugungiMashgulot(env, chatId, uid, name);
  if (amal === "sozlama" || amal === "hubYol" || amal === "profil") return profilKorsat(env, chatId, uid);
  if (amal === "hubOrgan")  return hubKorsat(env, chatId, "organ");
  if (amal === "duel")      return duelYarat(env, chatId, uid);
  if (amal === "marafonRu") return kitobMenyu(env, chatId, uid, RU);
  if (amal === "arab" || text.startsWith("/arab")) return arabMenyu(env, chatId, uid);
  if (amal === "mashq")     return startSeq(env, chatId, uid);
  if (amal === "saqlangan" || text.startsWith("/saqlangan")) return saqlanganMenyu(env, chatId, uid);
  // DIQQAT, TARTIB MUHIM: "/kitob_ru" ham "/kitob" bilan boshlanadi.
  // Qisqaroq prefiks oldin tekshirilsa, rus marafoni hech qachon
  // ochilmaydi — o'zbekcha menyu uni yutib yuboradi. Shuning uchun
  // aniqroq buyruqlar har doim yuqorida turadi.
  if (text.startsWith("/kitob_ru")) return kitobMenyu(env, chatId, uid, RU);
  if (amal === "kunlik"  || text.startsWith("/kunlik"))  return startDaily(env, chatId, uid, name);
  if (amal === "marafon" || text.startsWith("/kitob"))   return kitobMenyu(env, chatId, uid);
  if (amal === "takror"  || text.startsWith("/xatolar") || text.startsWith("/takror"))
    return xatolarMenyu(env, chatId, uid);
  if (/^\/duel(@\w+)?(\s|$)/.test(text)) return duelYarat(env, chatId, uid);
  if (text.startsWith("/bugun"))   return bugungiMashgulot(env, chatId, uid, name);
  if (text.startsWith("/mashq"))   return startSeq(env, chatId, uid);
  if (text.startsWith("/sozlama")) return sozlamaMenyu(env, chatId, uid);
  if (text.startsWith("/yonalish")) return yonalishMenyu(env, chatId, uid);
  if (text.startsWith("/til") || text.startsWith("/lang")) return tilMenyu(env, chatId);

  if (text.startsWith("/fasl")) {
    const n = parseInt(text.split(/\s+/)[1], 10);
    if (n >= 1 && n <= KITOB_JAMI) return startFasl(env, chatId, uid, n);
    return kitobMenyu(env, chatId, uid);
  }
  if (amal === "natija"  || text.startsWith("/natija"))  return showStats(env, chatId, uid);
  if (amal === "reyting" || text.startsWith("/reyting")) return reytingEkran(env, chatId, uid);

  if (amal === "yordam" || text.startsWith("/yordam") || text.startsWith("/help")) {
    return yordamKorsat(env, chatId);
  }

  if (text.startsWith("/reset") && String(uid) === String(env.ADMIN_ID)) {
    const target = text.split(/\s+/)[1] || uid;          // /reset [user_id]
    const full = text.includes("--full");
    await env.DB.prepare("DELETE FROM daily WHERE uid = ? AND day = ?")
      .bind(String(target), dayKey()).run();
    await env.DB.prepare("DELETE FROM answers WHERE uid = ? AND day = ?")
      .bind(String(target), dayKey()).run();
    if (full) {
      await env.DB.prepare("DELETE FROM answers  WHERE uid = ?").bind(String(target)).run();
      await env.DB.prepare("DELETE FROM daily    WHERE uid = ?").bind(String(target)).run();
      await env.DB.prepare("DELETE FROM fasl_done WHERE uid = ?").bind(String(target)).run();
      await env.DB.prepare("DELETE FROM users    WHERE uid = ?").bind(String(target)).run();
    }
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `🔄 <code>${target}</code> uchun bugungi holat tozalandi` +
            (full ? " (statistika ham)" : "") + ".",
      reply_markup: menyu(),
    });
    return;
  }

  if (text.startsWith("/sozla") && String(uid) === String(env.ADMIN_ID)) {
    const natija = [];

    // Webhook "poll" yangilanishlarini ham qabul qilsin —
    // vaqt tugaganini shu orqali bilamiz.
    // Telegram setWebhook ni tez-tez chaqirishga ruxsat bermaydi,
    // shuning uchun 429 kelsa bir necha bor qayta urinamiz.
    const KERAK = ["message", "callback_query", "poll_answer", "poll", "my_chat_member", "inline_query", "chosen_inline_result"];
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
    natija.push(`Inline (Oktagon): ${ruxsat.includes("inline_query") ? "✅ yoqilgan" : "❌ yoqilmagan — /sozla ni qayta bosing"}`);
    if (info.result?.last_error_message) {
      // Telegram oxirgi xatoni o'chirmaydi: u eski bo'lishi mumkin. Qachonligini ko'rsatamiz.
      const min = info.result.last_error_date ? Math.round((Date.now() / 1000 - info.result.last_error_date) / 60) : null;
      const eski = min !== null && min > 60;
      natija.push(`So'nggi xato: ${esc(info.result.last_error_message)}` +
        (min !== null ? ` (${min < 120 ? min + " daqiqa" : Math.round(min / 60) + " soat"} oldin${eski ? " — eski, xavfsiz" : " — yaqinda!"})` : ""));
    }
    natija.push(`Kutayotgan xabarlar: ${info.result?.pending_update_count ?? "?"}`);

    const cmd = await tg(env, "setMyCommands", {
      commands: BUYRUQLAR,
    });
    await adminBuyruqlarYoz(env);
    natija.push(`Buyruqlar: ${cmd.ok ? "✅" : "❌"}`);

    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `🔧 <b>Sozlash natijasi</b>\n\n${natija.join("\n")}`,
    });
    return;
  }

  if (text.startsWith("/sinov") && String(uid) === String(env.ADMIN_ID)) {
    await postKunlikElon(env);
    await tg(env, "sendMessage", { chat_id: chatId, text: "Kunlik e'lon guruhga yuborildi ✅" });
    return;
  }


  if (text.startsWith("/stats") && String(uid) === String(env.ADMIN_ID)) {
    const h = await db.kunlikHisobot(env, dayKey());
    const aniqlik = h.javob ? Math.round((h.togri / h.javob) * 100) : 0;
    const tushish = h.boshlagan ? Math.round((1 - h.yakunlagan / h.boshlagan) * 100) : 0;

    const mavzuSatr = h.mavzular
      .map((m) => `   ${topicLabel(m.topic)} — ${Math.round((m.c / m.a) * 100)}%`)
      .join("\n") || "   —";

    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `🔧 <b>Kunlik hisobot</b> · ${sanaUz()}\n━━━━━━━━━━━━━━\n\n` +
        `👥 Jami foydalanuvchi: <b>${h.jamiFoydalanuvchi}</b>\n` +
        `▶️ Bugun boshlagan: <b>${h.boshlagan}</b>\n` +
        `✅ Yakunlagan: <b>${h.yakunlagan}</b>` +
        (tushish ? `  (${tushish}% tashlab ketgan)` : ``) + `\n` +
        `📈 Aniqlik: <b>${aniqlik}%</b>  (${h.togri}/${h.javob})\n\n` +
        `<b>Mavzular — eng qiyinidan:</b>\n${mavzuSatr}\n\n` +
        `/shubha — shubhali savollar ro'yxati`,
    });
    return;
  }

  if (text.startsWith("/tajriba") && String(uid) === String(env.ADMIN_ID)) {
    const bosh = (await db.tizimOqi(env, "tajriba:kunlik5")) || dayKey();
    const sana = (k, n) => new Date(Date.parse(k) + n * 86400000).toISOString().slice(0, 10);
    const bugun_ = dayKey(1);
    const eski = await db.davrKorsatkichi(env, sana(bosh, -7), bosh);
    const yangi = await db.davrKorsatkichi(env, bosh, bugun_);
    const foiz = (a, b) => (b ? Math.round((a / b) * 100) + "%" : "data yo'q");
    const qator = (nom, x) =>
      `<b>${nom}</b>\n` +
      `  boshlagan: ${x.boshlagan}, tugatgan: ${x.tugatgan} (${foiz(x.tugatgan, x.boshlagan)})\n` +
      `  sinov uzunligi: ${x.uzunlik || "data yo'q"}\n` +
      `  fikr: ${x.fikrSoni} ta, shundan 👍 ${x.ha} (${foiz(x.ha, x.fikrSoni)})\n` +
      `  «yana 5 ta»: ${x.yana}`;
    await tg(env, "sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: `🧪 <b>Kunlik 5 tajribasi</b> (boshlandi: ${bosh})\n\n` +
        qator("Oldingi 7 kun (15 savol)", eski) + "\n\n" +
        qator("Tajriba davri (5 savol)", yangi) + "\n\n" +
        `<i>Qaror: ${sana(bosh, 7)} dan keyin. Asosiy ko'rsatkich — tugatish ulushi va ` +
        `ertasi kuni qaytganlar; 👍 faqat yo'nalishni ko'rsatadi.</i>`,
    });
    return;
  }

  if (text.startsWith("/shubha") && String(uid) === String(env.ADMIN_ID)) {
    // Hamma xato qiladigan savol — ehtimol savolning o'zi buzuq.
    const royxat = await db.shubhaliSavollar(env, 5, 0.3);
    if (!royxat.length) {
      await tg(env, "sendMessage", { chat_id: chatId, text: "Shubhali savol topilmadi ✅" });
      return;
    }
    const xaritaK = new Map(kitobBankRoyxat().map((q) => [db.qid(q.q), q]));
    const xaritaB = new Map(bank.map((q) => [db.qid(q.q), q]));
    const satr = royxat.map((r, i) => {
      const q = xaritaK.get(r.qid) || xaritaB.get(r.qid);
      const foiz = Math.round(r.aniqlik * 100);
      return `${i + 1}. <b>${foiz}%</b> (${r.n} javob)\n   ${esc(clip(q ? q.q : r.qid, 90))}`;
    }).join("\n\n");
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `⚠️ <b>Shubhali savollar</b>\n<i>Kamida 5 kishi javob bergan, aniqlik 30% dan past</i>\n\n${satr}`,
    });
    return;
  }

  await tg(env, "sendMessage", {
    chat_id: chatId,
    text: "Menyudan tanlang 👇",
    reply_markup: menyu(),
  });
}

async function handleCallback(env, cb) {
  {
    const d0 = cb.data || "";
    const kod = d0.startsWith("hub:") ? (d0.split(":")[2] || "") : (ORQA_KOD[d0] || "");
    if (kod && !orqaALS.getStore()) {
      return orqaALS.run({ chatId: cb.message.chat.id, kod, done: false }, () => handleCallback(env, cb));
    }
  }
  await tg(env, "answerCallbackQuery", { callback_query_id: cb.id });
  const chatId = cb.message.chat.id;
  const uid = cb.from.id;
  const data = cb.data || "";

  if (data.startsWith("hub:")) {
    const amalH = data.split(":")[1];
    const kalit = { kunlik: 1, marafon: 1, arab: 1, takror: 1, natija: 1, reyting: 1, saqlangan: 1 }[amalH];
    if (!kalit) return;
    return handleMessage(env, { chat: { id: chatId, type: "private" }, from: cb.from, text: t("tugma." + amalH) });
  }
  if (data === "bk:b") return boglanKorsat(env, chatId, uid, cb.message.message_id);
  if (data === "bk:o") return hubKorsat(env, chatId, "organ", cb.message.message_id);
  if (data === "bk:p") return profilKorsat(env, chatId, uid, cb.message.message_id);
  if (data === "bk:s") return sozlamaMenyu(env, chatId, uid, cb.message.message_id);
  if (data === "seq") return startSeq(env, chatId, uid);
  if (data === "kru") return kitobMenyu(env, chatId, uid, RU);
  if (data === "amenu") return arabMenyu(env, chatId, uid);
  if (data === "fikrm") return fikrBoshla(env, chatId, uid);
  if (data === "profil") return profilKorsat(env, chatId, uid);
  if (data.startsWith("qol:")) return qollanmaYubor(env, chatId, data.slice(4));
  if (data.startsWith("a:")) return startArab(env, chatId, uid, parseInt(data.slice(2), 10));
  if (data.startsWith("otkaz:")) return savolniOtkaz(env, data.slice(6));
  if (data === "xato:boshla") return xatoSavol(env, cb.message.chat.id, cb.from.id, 0);
  if (data.startsWith("y:")) return yonalishTanla(env, chatId, uid, data.slice(2));
  if (data === "davom_d") {
    const nom = [cb.from.first_name, cb.from.last_name].filter(Boolean).join(" ");
    // Tugma bir marta ishlaydi: ikki marta bosilsa savol takrorlanmasin
    await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id,
      reply_markup: { inline_keyboard: [] } }).catch(() => {});
    return startDaily(env, chatId, uid, nom, true);
  }
  if (data.startsWith("adm:")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    if (data === "adm:hisobot") return adminHisobotYubor(env);
    if (data === "adm:users") return adminUsers(env, chatId, cb.message.message_id).catch(() => adminUsers(env, chatId));
    if (data === "adm:fikr") return xabarlarRoyxat(env, chatId);
    if (data === "adm:elon") return elonBoshla(env, chatId);
    if (data === "adm:nima") return nimaQildik(env, chatId);
    if (data === "adm:post") return postLoyiha(env, chatId);
    if (data === "adm:emoji") return emojiPanel(env, chatId);
    if (data === "adm:panel") return adminPanel(env, chatId);
    if (data === "adm:d1") return d1Holat(env, chatId, cb.message.message_id).catch(() => d1Holat(env, chatId));
    return;
  }
  if (data.startsWith("em:")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    return emojiCallback(env, cb, chatId, data);
  }
  if (data.startsWith("post:")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    return postCallback(env, cb, chatId, data);
  }
  if (data.startsWith("xb:")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    const [, amal, a1, a2, a3] = data.split(":");
    const mid = cb.message.message_id;
    if (amal === "l") return xabarlarRoyxat(env, chatId, Number(a1) || 0, Number(a2) || 0, mid);
    if (amal === "hk") return hamkorlikAdmin(env, chatId, Number(a1) || 0, mid);
    const id = Number(a1), f = Number(a2) || 0, sah = Number(a3) || 0;
    if (amal === "x") {
      return ozgartir(env, mid, { chat_id: chatId, parse_mode: "HTML",
        text: "🗑 <b>#" + id + " xabarni o'chirasizmi?</b>\n\n<blockquote>Xabar butunlay o'chadi: Hamkorlikdan ham, egasining «Xabarlarim» ro'yxatidan ham. Qaytarib bo'lmaydi.</blockquote>",
        reply_markup: { inline_keyboard: [
          [{ text: "🗑 Ha, o'chirish", callback_data: "xb:xx:" + id + ":" + f + ":" + sah }],
          [{ text: "↩️ Bekor qilish", callback_data: "xb:o:" + id + ":" + f + ":" + sah }],
        ] } });
    }
    if (amal === "xx") {
      await env.DB.prepare("DELETE FROM murojaat WHERE id = ?").bind(id).run();
      await db.tizimYoz(env, "fk:pub", JSON.stringify((await fikrBolimOl(env)).filter((y) => y.id !== id)));
      await db.tizimYoz(env, "fk:jh:" + id, "").catch(() => {});
      return xabarlarRoyxat(env, chatId, f, sah, mid);
    }
    if (amal === "a") { if (!(await fikrBolimOl(env)).some((x) => x.id === id)) await fikrBolimToggle(env, id); }
    if (amal === "h") {
      const r = await fikrBolimOl(env);
      const x = r.find((y) => y.id === id);
      if (x) { x.h = x.h ? 0 : 1; await db.tizimYoz(env, "fk:pub", JSON.stringify(r)); }
    }
    if (amal === "d") await db.tizimYoz(env, "fk:pub", JSON.stringify((await fikrBolimOl(env)).filter((y) => y.id !== id)));
    return xabarOch(env, chatId, id, f, sah, mid);
  }
  if (data.startsWith("fk:jv:")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    await db.tizimYoz(env, "fk:jv", data.slice(6));
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "✉️ <b>#" + data.slice(6) + "</b> egasiga javob yozing — <b>faqat unga</b> boradi.\n<i>Bekor: /bekor</i>" });
    return;
  }
  if (data.startsWith("fk:pub:")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    const id = Number(data.slice(7));
    const qoshildi = await fikrBolimToggle(env, id);
    if (qoshildi === null) return;
    const kb = cb.message?.reply_markup?.inline_keyboard;
    if (kb) {
      const yangi = kb.map((q) => q.map((b) => (b.callback_data === data ? { ...b, text: qoshildi ? "✅ Hamkorlikda" : "🤝 Hamkorlikka qo'shish" } : b)));
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: yangi } }).catch(() => {});
    }
    return;
  }
  const fikrAdmin = String(uid) === String(env.ADMIN_ID);
  if (data === "fikrb") return fikrBolimiKorsat(env, chatId, 0, null);
  if (data.startsWith("fikrb:")) return fikrBolimiKorsat(env, chatId, parseInt(data.slice(6), 10) || 0, cb.message.message_id);
  if (data.startsWith("rk:")) { const [, tr, dv] = data.split(":"); return reytingEkran(env, chatId, uid, tr, dv, cb.message.message_id); }
  if (data.startsWith("mx:")) return meningXabarlar(env, chatId, uid, parseInt(data.slice(3), 10) || 0, cb.message.message_id);
  if (data.startsWith("fkt:")) return fikrTurTanla(env, chatId, uid, data.slice(4), cb.message.message_id);
  if (fikrAdmin && (data.startsWith("fkh:") || data.startsWith("fkd:"))) {
    const [amal, idS, sahS] = data.split(":");
    const id = Number(idS);
    const r = await fikrBolimOl(env);
    const i = r.findIndex((x) => x.id === id);
    if (i >= 0) {
      if (amal === "fkh") r[i].h = r[i].h ? 0 : 1; else r.splice(i, 1);
      await db.tizimYoz(env, "fk:pub", JSON.stringify(r));
    }
    return hamkorlikAdmin(env, chatId, parseInt(sahS, 10) || 0, cb.message.message_id);
  }
  if (data.startsWith("fk:ish:")) {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    await db.tizimYoz(env, "fk:kut", data.slice(7));
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "✍️ Nima qildingiz? <b>Bitta gap</b> yozing (masalan: «Vaqt endi kompyuterda ham ko'rinadi»).\n<i>Bekor: /bekor</i>" });
    return;
  }
  if (data === "elon:ok") {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    const src = await db.tizimOqi(env, "elon:src");
    const fkIds = await db.tizimOqi(env, "fk:ids");
    if (src && fkIds) { await db.murojaatChiqdi(env, fkIds.split(",").map(Number)); await db.tizimYoz(env, "fk:ids", ""); }
    if (!src) { await tg(env, "sendMessage", { chat_id: chatId, text: "Post topilmadi. /elon ni qaytadan yuboring." }); return; }
    await db.tizimYoz(env, "elon:src", "");   // ikki marta bosilsa takror ketmasin
    await tg(env, "editMessageText", { chat_id: chatId, message_id: cb.message.message_id, text: "📤 Tarqatilmoqda…" });
    return ozimizniChaqir(env, { elon: { chatId, src, dan: 0, yetdi: 0, bloklangan: 0 } });
  }

  if (data === "elon:yoq") {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    await db.tizimYoz(env, "fk:ids", "");
    await tg(env, "editMessageText", {
      chat_id: chatId, message_id: cb.message.message_id,
      text: "✖️ Tarqatma bekor qilindi.",
    });
    return;
  }

  if (data === "rasm:isit") {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    return rasmIsit(env, chatId);
  }

  if (data === "rasm:yangi") {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    return rasmliKorik(env, chatId);
  }

  if (data === "elon:ha") {
    if (String(uid) !== String(env.ADMIN_ID)) return;
    const matn = await db.tizimOqi(env, "elon:matn");
    if (!matn) {
      await tg(env, "sendMessage", { chat_id: chatId, text: "Matn topilmadi. /elon ni qaytadan yuboring." });
      return;
    }
    await tg(env, "editMessageText", {
      chat_id: chatId, message_id: cb.message.message_id,
      text: "📤 Tarqatilmoqda…",
    });
    // Worker vaqt byudjeti cheklangani uchun tarqatma bo'laklarga
    // bo'linadi. Har bo'lak tugaganda keyingisi chaqiriladi.
    await elonBolagi(env, chatId, 0, { yetdi: 0, bloklangan: 0 });
    return;
  }

  if (data === "yana") {
    await db.yanaYoz(env, uid, dayKey());
    return startSeq(env, chatId, uid);
  }

  if (data === "fikr:1" || data === "fikr:0") {
    await db.fikrYoz(env, uid, dayKey(), data === "fikr:1");
    // Baho tugmalari olinadi, qolgani qoladi — ikkinchi marta bosish shart emas.
    const qolgan = (cb.message?.reply_markup?.inline_keyboard || [])
      .filter((q) => !q.some((b) => String(b.callback_data).startsWith("fikr:")));
    await tg(env, "editMessageReplyMarkup", {
      chat_id: chatId, message_id: cb.message.message_id,
      reply_markup: { inline_keyboard: qolgan },
    });
    await tg(env, "sendMessage", { chat_id: chatId, text: t("fikr.rahmat") });
    return;
  }

  if (data === "yutuq")  return showStats(env, chatId, uid);
  if (data.startsWith("lib:")) return libCallback(env, cb, chatId, uid, data);
  if (data === "boglan") return boglanKorsat(env, chatId, uid);
  if (data === "szm") return sozlamaMenyu(env, chatId, uid);
  if (data === "taklif") return taklifKorsat(env, chatId, uid);
  if (data.startsWith("sv:")) return saqlashTugma(env, cb, uid, data.slice(3));
  if (data.startsWith("svx:")) {
    await db.saqlanganOchir(env, uid, data.slice(4));
    return saqlanganMenyu(env, chatId, uid, cb.message.message_id);
  }
  if (data === "duel:yangi") return duelYarat(env, chatId, uid);
  if (/^duel:b:\d+$/.test(data)) return duelBoshlaTugma(env, cb, uid, parseInt(data.slice(7), 10));

  if (data.startsWith("xabar:")) {
    // "xabar:d:2026-10-19" yoki "xabar:k:3"
    const [, mode, kalit] = data.split(":");
    const qoshimcha = mode === "d" ? { kun: kalit } : { fasl: Number(kalit) };
    return xabarRoyxat(env, chatId, uid, mode, qoshimcha);
  }

  if (data.startsWith("bayroq:")) {
    const qid_ = data.slice(7);
    const yangi = await db.belgilaQid(env, uid, qid_);
    await tg(env, "answerCallbackQuery", {
      callback_query_id: cb.id,
      text: yangi ? t("xabar.rahmat") : t("xabar.bor"),
      show_alert: true,
    });
    const kb = cb.message?.reply_markup?.inline_keyboard;
    if (kb) {
      const yangiKb = kb.map((q) => q.map((b) => (b.callback_data === data && !b.text.startsWith("✅") ? { ...b, text: "✅" + b.text } : b)));
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: yangiKb } }).catch(() => {});
    }
    return;
  }

  if (data === "yonalish") return yonalishMenyu(env, chatId, uid);
  if (data === "tilmenu") return tilMenyu(env, chatId);
  if (data.startsWith("til:")) return tilTanla(env, chatId, uid, data.slice(4));
  if (data === "yordam")   return yordamKorsat(env, chatId);
  if (data === "bugun")    return bugungiMashgulot(env, chatId, uid, cb.from.first_name || "");
  if (data === "kmenu") return kitobMenyu(env, chatId, uid);
  if (data === "kmenu_ru") return kitobMenyu(env, chatId, uid, RU);
  if (data.startsWith("kr:")) {
    const n = Number(data.slice(3));
    if (n >= 1 && n <= kitobOxirgi(RU)) return startFasl(env, chatId, uid, n, RU);
    return kitobMenyu(env, chatId, uid, RU);
  }
  if (data === "stats") return showStats(env, chatId, uid);
  if (data.startsWith("k:")) {
    const n = parseInt(data.slice(2), 10);
    if (n >= 1 && n <= KITOB_JAMI) return startFasl(env, chatId, uid, n);
  }
}

// ——————————————————————————————————————————————— kirish nuqtalari

/**
 * Handler xato berganda foydalanuvchiga (va kerak bo'lsa adminga) xabar beradi.
 *
 * Ikki xil xato — ikki xil matn. Bu ataylab:
 *   · D1 limiti — bu nosozlik emas, tarif cheklovi. Foydalanuvchi
 *     "ertaga qayta urinib ko'raman" deb bilsin, bot buzilgan deb
 *     o'ylamasin. Limit UTC yarim kechada yangilanadi (Toshkentda 05:00).
 *   · qolgan hammasi — haqiqiy nosozlik, umumiy matn.
 *
 * Adminga xabar kuniga BIR marta yuboriladi. Har bir xato uchun yuborilsa,
 * aynan nosozlik paytida yuzlab xabar kelib, muhim signal ko'milib ketadi.
 */
/**
 * Nosozlikni toifaga ajratadi.
 *
 * Toifa javobni belgilaydi: limitni kutish kerak, baza nosozligi odatda
 * o'tkinchi, dastur xatosi esa o'zi tuzalmaydi. Bitta umumiy "xatolik
 * yuz berdi" xabari uchalasini ham bir xil ko'rsatadi va shu bilan
 * adminning eng muhim savolini javobsiz qoldiradi: aralashish kerakmi?
 */
function xatoToifasi(matn) {
  if (/daily (row )?(read|write)|exceeded .*limit|code: 7500|too many requests/i.test(matn))
    return "limit";
  if (/D1_ERROR|database|SQLITE|no such (table|column)/i.test(matn)) return "baza";
  return "dastur";
}

/** Stack'dan birinchi foydali satr: qaysi funksiyani ochish kerakligini aytadi. */
function xatoJoyi(e) {
  const qator = String((e && e.stack) || "").split("\n").find((r) => r.includes("at "));
  // Papka yo'li olib tashlanadi: faqat "funksiya (fayl.js:qator:ustun)" — uzun yo'l fayl nomini kesib yubormasin.
  return qator ? qator.trim().replace(/^at\s+/, "").replace(/(?:file:\/\/)?\/[^\s()]*\//g, "").slice(0, 120) : "";
}

const OY = ["yanvar", "fevral", "mart", "aprel", "may", "iyun",
            "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

/** Toshkent vaqti (UTC+5) — "19-oktabr, 12:30" ko'rinishida. */
function vaqtMatni(ts = Date.now()) {
  const d = new Date(ts + 5 * 3600 * 1000);
  const ikki = (n) => String(n).padStart(2, "0");
  return `${d.getUTCDate()}-${OY[d.getUTCMonth()]}, ${ikki(d.getUTCHours())}:${ikki(d.getUTCMinutes())}`;
}

/**
 * Nosozlik yuz berganda foydalanuvchiga va adminga xabar beradi.
 *
 * Adminga xabar har TOIFA uchun kuniga bir marta ketadi. Har xato uchun
 * yuborilsa, aynan nosozlik paytida yuzlab bir xil xabar kelib, signal
 * shovqinga ko'milib ketadi — ya'ni ogohlantirish tizimi o'zini o'zi
 * ishlamaydigan qilib qo'yadi.
 */
/**
 * Kimga qachon aytilgani. Kalit — chat, qiymat — vaqt.
 *
 * Xotirada, chunki cheklovni bazada saqlash aynan baza ishlamayotganda
 * ishlamaydi — mantiqiy halqa hosil bo'ladi.
 */
const AYTILDI = new Map();
const SOVUSH_MS = 15 * 60 * 1000;

function aytsaBoladimi(chatId) {
  const hozir = Date.now();

  // Xarita cheksiz o'smasligi uchun eski yozuvlar tozalanadi. Bu kichik
  // tafsilot, lekin uzoq ishlaydigan izolyatsiyada xotira sizishining
  // eng keng tarqalgan sababi aynan shunday "vaqtincha" xaritalar.
  if (AYTILDI.size > 500) {
    for (const [k, v] of AYTILDI) if (hozir - v > SOVUSH_MS) AYTILDI.delete(k);
  }

  const oxirgi = AYTILDI.get(chatId);
  if (oxirgi && hozir - oxirgi < SOVUSH_MS) return false;
  AYTILDI.set(chatId, hozir);
  return true;
}

async function xatoniAyt(env, update, e) {
  const chatId =
    update.message?.chat?.id ??
    update.callback_query?.message?.chat?.id ??
    null;
  const matn = String((e && e.message) || e || "");
  const toifa = xatoToifasi(matn);
  if (toifa === "limit") await env.SESSIONS?.put("d1:limit", String(Date.now()), { expirationTtl: 86400 }).catch(() => {});

  // ——————————————————————————— foydalanuvchiga
  //
  // Faqat o'ziga tegishlisi. Texnik tafsilot bermaymiz: u foydalanuvchiga
  // hech qanday qaror qabul qilishga yordam bermaydi, faqat tashvish
  // qo'shadi. Lekin "qachon?" degan savolga javob beramiz — javobsiz
  // kutish eng charchatadigan narsa.
  const FOYDALANUVCHI = {
    limit:
      "⏳ <b>Bot vaqtincha dam olyapti</b>\n\n" +
      "Bugungi so'rovlar chegarasiga yetdik — bu nosozlik emas, texnik cheklov.\n\n" +
      "🕔 <b>Ertalab soat 05:00 dan keyin</b> hammasi avvalgidek ishlaydi. " +
      "Natijalaringiz, ketma-ket kunlaringiz va marafon bosqichingiz saqlanib turibdi — " +
      "hech narsa yo'qolmaydi.\n\n" +
      "Noqulaylik uchun uzr. 🤍",
    baza:
      "⚠️ <b>Vaqtinchalik nosozlik</b>\n\n" +
      "Hozir so'rovingizni bajara olmadim. Bu odatda bir necha daqiqada o'tib ketadi — " +
      "biroz kutib, qaytadan urinib ko'ring.\n\n" +
      "Natijalaringiz saqlangan, yo'qolmaydi.",
    dastur:
      "⚠️ <b>Nimadir noto'g'ri ketdi</b>\n\n" +
      "Bu so'rovni bajara olmadim. Xabar adminga yuborildi — tez orada tuzatiladi.\n\n" +
      "Shu orada boshqa bo'limlardan foydalanishingiz mumkin.",
  };

  // Bir odamga 15 daqiqada bir marta. Birinchi xabar — ma'lumot,
  // beshinchisi — bezovta qilish.
  if (chatId && aytsaBoladimi(chatId)) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: FOYDALANUVCHI[toifa],
      link_preview_options: { is_disabled: true },
      reply_markup: menyu(),
    }).catch(() => {});
  }

  // ——————————————————————————— adminga
  if (!env.ADMIN_ID) return;

  // Kuniga bir marta. Ilgari bu yerda `flags` jadvali ishlatilgan edi,
  // lekin unda k/v ustunlari yo'q — so'rov jimgina yiqilar, xato esa
  // shu catch ichida yutilardi. Ya'ni cheklov mexanizmi mavjud ko'rinib,
  // amalda hech qachon ishlamagan. Endi `tizim` jadvali ishlatiladi.
  let birinchimi = true;
  try {
    birinchimi = await db.birMarta(env, `xato:${toifa}:${dayKey()}`);
  } catch {
    // Baza o'zi ishlamayotgan bo'lsa takrorni to'xtata olmaymiz. Shunda ham
    // xabar yuboramiz: ogohlantirmaslik takroriy xabardan yomonroq.
  }
  if (!birinchimi) return;

  const HISOBOT = {
    limit: {
      sarlavha: "⏳ BOT TO'XTADI — kunlik limit",
      nima: "Cloudflare D1 bazasining bepul tarifdagi kunlik o'qish chegarasi tugadi.",
      tasir: "Foydalanuvchilar tugmalarga javob ola olmaydi. Viktorina, marafon va " +
             "natijalar ishlamaydi. Ma'lumot yo'qolmadi — faqat o'qib bo'lmayapti.",
      qachon: "Bugun soat 05:00 da (Toshkent) o'z-o'zidan tiklanadi.",
      nima_qilish: "Hozir hech narsa qilish shart emas.\n" +
                   "Agar hafta ichida yana takrorlansa — Workers Paid tarifiga " +
                   "o'tish kerak ($5/oy, limit 5 mln → 25 mlrd).",
    },
    baza: {
      sarlavha: "🚨 BOT TO'XTADI — baza nosozligi",
      nima: "Bazaga so'rov yuborib bo'lmayapti.",
      tasir: "Foydalanuvchilar javob ola olmaydi.",
      qachon: "Noma'lum. Odatda Cloudflare tomonidagi o'tkinchi nosozlik.",
      nima_qilish: "10-15 daqiqa kutib ko'ring. Saqlanib qolsa — " +
                   "Cloudflare holat sahifasini tekshiring.",
    },
    dastur: {
      sarlavha: "🚨 BOT TO'XTADI — dastur xatosi",
      nima: "Kodda kutilmagan xato yuz berdi.",
      tasir: "Shu amalni bajargan har bir foydalanuvchi javob ola olmaydi.",
      qachon: "O'z-o'zidan tiklanmaydi — tuzatish kerak.",
      nima_qilish: "Quyidagi texnik qismni dasturchiga yuboring.",
    },
  }[toifa];

  const joy = toifa === "dastur" ? xatoJoyi(e) : "";

  await tg(env, "sendMessage", {
    chat_id: env.ADMIN_ID,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    text:
      `<b>${HISOBOT.sarlavha}</b>\n` +
      `<i>${vaqtMatni()}</i>\n\n` +
      `<b>Nima bo'ldi</b>\n${HISOBOT.nima}\n\n` +
      `<b>Kimga ta'sir qilyapti</b>\n${HISOBOT.tasir}\n\n` +
      `<b>Qachon tiklanadi</b>\n${HISOBOT.qachon}\n\n` +
      `<b>Nima qilish kerak</b>\n${HISOBOT.nima_qilish}\n\n` +
      `<b>Texnik qism</b>\n<pre>${esc(matn.slice(0, 350))}` +
      (joy ? `\n\n${esc(joy)}` : "") + `</pre>\n\n` +
      `<i>Bu xabar kuniga bir marta yuboriladi.</i>`,
  }).catch(() => {});
}

/**
 * Bitta so'rov uchun baza byudjeti.
 *
 * NEGA SON AYNAN 100: eng og'ir yo'l — kunlik viktorinani boshlash —
 * 20-25 ta so'rov qiladi. 100 ta to'rt barobar zaxira beradi, ya'ni
 * normal ishga umuman tegmaydi. Takrorlanuvchi sikl uchun esa bu devor.
 *
 * "Fail fast, fail small": bir foydalanuvchining bitta amali ishlamaydi —
 * hamma uchun butun kun ishlamagandan ko'ra yaxshi.
 */
const SOROV_CHEGARASI = 100;

/**
 * Tayyorlangan so'rovni o'raydi.
 *
 * `_asl` SAQLANADI, chunki D1 ning batch() usuliga haqiqiy so'rov
 * obyekti kerak — o'rama emas. Busiz har bir batch chaqiruvi
 * ishlamay qolardi.
 */
function orab(st, sana) {
  const orash = (nom) => (...a) => { sana(); return st[nom](...a); };
  return {
    _asl: st,
    bind: (...a) => orab(st.bind(...a), sana),
    first: orash("first"),
    all: orash("all"),
    run: orash("run"),
    raw: orash("raw"),
  };
}

function byudjetliBaza(DB, hisob) {
  if (!DB || typeof DB.prepare !== "function") return DB;

  const sana = (sql) => {
    if (++hisob.n > SOROV_CHEGARASI) {
      throw new Error(
        `So'rov byudjeti tugadi (${SOROV_CHEGARASI} ta). Takrorlanuvchi ` +
        `sikl bo'lishi mumkin. Oxirgi so'rov: ${String(sql).trim().slice(0, 120)}`
      );
    }
  };

  return {
    prepare: (sql) => orab(DB.prepare(sql), () => sana(sql)),
    batch: (lar) => {
      hisob.n += lar.length;
      sana("batch");
      return DB.batch(lar.map((x) => (x && x._asl) || x));
    },
    exec: (q) => { sana(q); return DB.exec(q); },
    dump: (...a) => DB.dump(...a),
  };
}

/**
 * Barcha foydalanuvchilarga xabar tarqatish.
 *
 * UCH QOIDA, har biri achchiq tajribadan:
 *
 *  1) TEZLIK CHEKLOVI. Telegram sekundiga ~30 xabarga ruxsat beradi.
 *     Tezroq yuborilsa 429 keladi va bir qismi umuman yetib bormaydi.
 *     Shuning uchun har xabardan keyin kichik pauza.
 *
 *  2) BLOKLAGANLARNI BELGILASh. Botni bloklagan odamga yuborilgan
 *     xabar 403 qaytaradi. Uni belgilab qo'ymasak, har tarqatmada
 *     o'sha odamlarga urinib, bekorga vaqt va limit sarflaymiz.
 *
 *  3) VAQT BYUDJETI. Worker cheksiz ishlamaydi. Shuning uchun
 *     tarqatma bo'laklarga bo'linadi va qayerda to'xtaganini
 *     qaytaradi — keyingi chaqiruv o'sha joydan davom etadi.
 */
async function tarqat(env, matn, { dan = 0, soni = 150, vaqtMs = 15000, rasm = "" } = {}) {
  const { results } = await env.DB.prepare(
    "SELECT uid FROM users WHERE blocked = 0 ORDER BY uid LIMIT ? OFFSET ?"
  ).bind(soni, dan).all();

  const boshlandi = Date.now();
  let yetdi = 0, bloklangan = 0, i = 0;

  for (const r of results) {
    if (Date.now() - boshlandi > vaqtMs) break;
    i++;
    let javob;
    if (rasm) {
      // Caption 1024 belgigacha. Uzun matn — rasm alohida, matn alohida.
      const qisqa = matn.length <= 1000;
      javob = await tg(env, "sendPhoto", { chat_id: r.uid, photo: rasm, parse_mode: "HTML",
        ...(qisqa ? { caption: matn, reply_markup: menyu() } : {}) });
      if (javob?.ok && !qisqa) {
        javob = await tg(env, "sendMessage", { chat_id: r.uid, parse_mode: "HTML", text: matn,
          link_preview_options: { is_disabled: true }, reply_markup: menyu() });
      }
    } else {
      javob = await tg(env, "sendMessage", {
        chat_id: r.uid,
        parse_mode: "HTML",
        text: matn,
        link_preview_options: { is_disabled: true },
        reply_markup: menyu(),
      });
    }

    if (javob?.ok) yetdi++;
    else if (javob?.error_code === 403) {
      bloklangan++;
      await db.setBlocked(env, r.uid, 1).catch(() => {});
    }
    await new Promise((r2) => setTimeout(r2, 40));   // ~25 xabar/sekund
  }

  return { korildi: i, yetdi, bloklangan, keyingi: dan + i, tugadi: results.length < soni };
}

/**
 * BREND USLUBI (Dribbble/Behance'dagi premium mahsulot e'lonlari tahlilidan).
 * Aniq ishlarni nusxalamaymiz — faqat umumiy tamoyillar: bitta markaziy
 * ob'ekt, chuqur qora fon, iliq oltin yorug'lik, ko'p bo'sh joy, silliq
 * 3D/shisha shakllar. MATN RASMGA YOZILMAYDI: sun'iy intellekt o'zbekcha
 * harflarni xato chizadi, shuning uchun matn Telegram sarlavhasida turadi.
 */
const BREND_PROMPT =
  "Premium editorial announcement artwork for an education brand. Dark near-black warm background (#0a0908) " +
  "with a soft radial golden glow (#E2B93B, #F3D77A). One single hero object in the center, rendered as a polished " +
  "3D / glassmorphism icon with fine gold edge light, subtle film grain, generous negative space, a few small gold sparkles " +
  "for a gently celebratory mood. Style of top Dribbble and Behance product-launch visuals: minimal, elegant, high contrast. " +
  "Square 4:5 composition. ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO LOGOS, NO WATERMARKS anywhere in the image. " +
  "The hero object must symbolize this announcement: ";

const taglessMatn = (h) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 400);

/**
 * Gemini chaqiruvi zaxira modellar bilan. Google modelni o'chirsa ("no longer available", 404),
 * ro'yxatdagi keyingisiga o'tadi — post va rasm to'xtab qolmaydi. Birinchi bo'lib env'dagi model.
 */
const MODEL_ESKIRDI = /no longer available|not found|not supported|deprecated|does not exist/i;
async function geminiChaqir(env, modellar, body) {
  let oxirgi = { xato: "model topilmadi" };
  for (const model of [...new Set(modellar.filter(Boolean))]) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) return { j, model };
    oxirgi = { xato: j?.error?.message || `HTTP ${res.status}`, model };
    if (!(res.status === 404 || MODEL_ESKIRDI.test(oxirgi.xato))) return oxirgi;
    console.warn("gemini model eskirgan, keyingisi:", model);
  }
  return oxirgi;
}
const MATN_MODELLAR = (env) => [env.GEMINI_TEXT_MODEL, "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"];
const RASM_MODELLAR = (env) => [env.GEMINI_MODEL, "gemini-2.5-flash-image", "gemini-3-pro-image-preview"];
const POST_MODELLAR = (env) => [env.POST_MODEL, "gemini-3-pro-image-preview", "gemini-2.5-flash-image"];

/** Gemini bilan rasm. Natija: Uint8Array yoki null. Kalit faqat Worker secret'ida. */
async function geminiRasm(env, matn) {
  if (!env.GEMINI_API_KEY) return { xato: "kalit" };
  const r = await geminiChaqir(env, RASM_MODELLAR(env), { contents: [{ parts: [{ text: BREND_PROMPT + taglessMatn(matn) }] }] });
  if (r.xato) return { xato: r.xato };
  const j = r.j;
  const qism = (j?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data || p.inline_data?.data);
  const b64 = qism?.inlineData?.data || qism?.inline_data?.data;
  if (!b64) return { xato: "Gemini rasm qaytarmadi" };
  return { bin: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) };
}

/** Admin uchun oldindan ko'rish: rasm yaratadi, file_id ni saqlaydi, tasdiq so'raydi. */
async function rasmliKorik(env, chatId) {
  const matn = await db.tizimOqi(env, "elon:matn");
  if (!matn) return tg(env, "sendMessage", { chat_id: chatId, text: "Matn topilmadi. Qaytadan /rasmli yuboring." });

  const g = await geminiRasm(env, matn);
  if (g.xato === "kalit") {
    return tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "🔑 Gemini kaliti ulanmagan.\n\nTerminalda: <code>npx wrangler secret put GEMINI_API_KEY</code>\n" +
            "va kalitni o'sha yerga kiriting (chatga yozmang). Shu orada oddiy /elon ishlayveradi." });
  }
  if (g.xato) {
    return tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", link_preview_options: { is_disabled: true }, text: `⚠️ <b>Rasm yaratilmadi</b>\n\n<blockquote>${esc(String(g.xato).slice(0, 300))}</blockquote>\n\n<i>Qayta urinib ko'ring yoki oddiy /elon ishlating.</i>` });
  }

  const fd = new FormData();
  fd.append("chat_id", String(chatId));
  fd.append("photo", new Blob([g.bin], { type: "image/png" }), "yangilik.png");
  fd.append("caption", "🎨 Rasm tayyor. Matn rasm tagida shu shaklda chiqadi.");
  const r = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd })).json();
  const fid = r?.result?.photo?.at(-1)?.file_id;
  if (!r.ok || !fid) return tg(env, "sendMessage", { chat_id: chatId, text: "⚠️ Rasmni yuborib bo'lmadi. Qayta urinib ko'ring." });
  await db.tizimYoz(env, "elon:rasm", fid);

  const soni = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE blocked = 0").first();
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", link_preview_options: { is_disabled: true },
    text: `📣 <b>Rasmli tarqatma tasdiqlansinmi?</b>\n\nQabul qiluvchilar: <b>${soni?.n ?? 0}</b> ta\n\n` +
          `<b>Rasm tagidagi matn:</b>\n━━━━━━━━━━━━━━\n${matn}\n━━━━━━━━━━━━━━\n\n<i>Yuborilganini qaytarib bo'lmaydi.</i>`,
    reply_markup: { inline_keyboard: [
      [{ text: "✅ Ha, yuborilsin", callback_data: "elon:ha" }],
      [{ text: "🔄 Boshqa rasm", callback_data: "rasm:yangi" }],
      [{ text: "✖️ Bekor qilish", callback_data: "elon:yoq" }],
    ] } });
}

/**
 * Tarqatmani bo'lak-bo'lak bajaradi va yakunda hisobot beradi.
 *
 * NEGA BO'LAKLARGA BO'LINADI: Worker cheksiz ishlamaydi. Butun
 * tarqatmani bitta chaqiruvda bajarishga urinish — o'rtada uzilish
 * va "kimga yetdi, kimga yetmadi" degan javobsiz savol demak.
 */
// Post foydalanuvchiga aynan adminning ko'rinishida boradi. Rasm izohi 1024 belgidan uzun
// bo'lsa Telegram oddiy foydalanuvchiga nusxalashni rad etadi — shunda rasm va matn ikkiga bo'linadi.
async function postYubor(env, uid, src) {
  const [fromChat, mid, uzun] = src.split(":");
  const nusxa = { chat_id: uid, from_chat_id: fromChat, message_id: Number(mid) };
  if (uzun === "u") {
    const matn = await db.tizimOqi(env, "elon:matn");
    const a = await tg(env, "copyMessage", { ...nusxa, caption: "" });
    if (!a?.ok) return a;
    return tg(env, "sendMessage", { chat_id: uid, parse_mode: "HTML", text: matn,
      link_preview_options: { is_disabled: true }, reply_markup: menyu() });
  }
  return tg(env, "copyMessage", { ...nusxa, reply_markup: menyu() });
}

// Har bo'lak ALOHIDA so'rovda ishlaydi (o'zimizni SELF orqali chaqiramiz): bitta
// so'rovning subrequest/vaqt chegarasi 214+ foydalanuvchiga yetmaydi.
async function elonKopiya(env, st) {
  const { chatId, src, dan, yetdi, bloklangan } = st;
  const xatolar = st.xatolar || [];
  const { results } = await env.DB.prepare(
    "SELECT uid FROM users WHERE blocked = 0 ORDER BY uid LIMIT 30 OFFSET ?").bind(dan).all();
  let y = yetdi, b = bloklangan;
  for (const r of results) {
    let j = await postYubor(env, r.uid, src);
    if (j?.error_code === 429) {
      await new Promise((r2) => setTimeout(r2, ((j.parameters?.retry_after || 1) + 0.3) * 1000));
      j = await postYubor(env, r.uid, src);
    }
    if (j?.ok) y++;
    else if (j?.error_code !== 403 && xatolar.length < 3 && !xatolar.includes(j?.description)) xatolar.push(String(j?.description || "noma'lum"));
    if (j?.ok) { /* ok */ }
    else if (j?.error_code === 403) { b++; await db.setBlocked(env, r.uid, 1).catch(() => {}); }
    await new Promise((r2) => setTimeout(r2, 40));
  }
  if (results.length === 30) {
    // blocked=1 qilingan qatorlar keyingi OFFSETni siljitadi — shuning uchun dan ga faqat qolganlar qo'shiladi
    return ozimizniChaqir(env, { elon: { chatId, src, dan: dan + 30 - (b - bloklangan), yetdi: y, bloklangan: b, xatolar } });
  }
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: `✅ <b>Tarqatma yakunlandi</b>\n\nYetib bordi: <b>${y}</b> ta` +
          (b ? `\nBloklagan: <b>${b}</b> ta` : "") +
          (xatolar.length ? `\n\n⚠️ Telegram xatolari:\n${xatolar.map(esc).join("\n")}` : "") });
}


// ═══════════════════════════════════════════════════════════════════
// GURUHGA RASMLI POSTLAR
//
// Haftada 3 marta (Du/Chor/Juma 16:00) bot loyiha tayyorlaydi va ADMINGA
// ko'rsatadi. Guruhga faqat admin ✅ bosgandan keyin ketadi: tasdiqsiz
// hech narsa chiqmaydi. Mavzu: admin navbati (/mavzu) → bo'lmasa aylanma ro'yxat.
// Matn va rasm bitta GEMINI_API_KEY (Worker secret) bilan yaratiladi.
// ═══════════════════════════════════════════════════════════════════

const POST_MAVZULAR = [
  "Kitob o'qishni odatga aylantirishning eng kichik qadami",
  "O'qishdan oldin telefonni 10 daqiqaga chetga qo'yish",
  "Xato qilish — o'rganishning bir qismi, uyat emas",
  "Nega o'qiganimiz unutiladi va takrorlash buni qanday tuzatadi",
  "Kuniga 15 daqiqa: kichik odatlarning kuchi",
  "Katta maqsadni kichik bosqichlarga bo'lish",
  "Yozib o'rganish: qisqa konspekt nima beradi",
  "Boshqaga tushuntirib berish — eng yaxshi o'rganish usullaridan biri",
  "Kechiktirish (prokrastinatsiya) bilan kurashishning oddiy usuli",
  "Test baho emas, o'rganish quroli",
  "Ijtimoiy tarmoqda behuda vaqt va uning o'rniga nima qilish mumkin",
  "Ustoz va shogird: o'rganishda odob va ochiq savol berish",
];

const POST_RASM_PROMPT =
  "Hand-drawn watercolor and ink illustration on warm cream textured paper, soft pastel palette " +
  "(sage green, mustard yellow, dusty pink, navy), cute modern flat character style, vertical 3:4 composition. " +
  "Top of the image: a bold hand-lettered headline in two lines. Line 1 in dark brown capital letters, " +
  "line 2 in bold capital letters on a yellow highlighter brushstroke with small doodle sparkle marks around it. " +
  "Spell the headline EXACTLY as given, letter by letter, Uzbek Latin script with apostrophes. " +
  "Below the headline, the scene. No other text, no logos, no watermarks, no brand names. ";

async function geminiPostMatn(env, mavzu) {
  if (!env.GEMINI_API_KEY) return { xato: "kalit" };
  const prompt =
    "Sen \"Ustozim Nurim\" ta'lim hamjamiyati (Telegram guruh) uchun kopirayter va ustozsan. " +
    `Mavzu: ${mavzu}\n\n` +
    "O'zbek tilida (lotin yozuvi), samimiy, zamonaviy, sodda ohangda yoz. Soxta statistika, tadqiqot nomi, " +
    "tibbiy yoki diniy da'volar keltirma. Faqat JSON qaytar, maydonlar:\n" +
    "sarlavha1: rasm tepasidagi 1-satr (2-4 so'z, oddiy)\n" +
    "sarlavha2: ajratib ko'rsatiladigan 2-satr (2-4 so'z, kuchli, undov bilan tugashi mumkin)\n" +
    "fikr: bitta jumla — asosiy g'oya (110 belgidan oshmasin)\n" +
    "kontekst: 3-4 qisqa gap — amaliy foydali maslahat, oxirida bugunoq qilsa bo'ladigan bitta qadam (420 belgidan oshmasin)\n" +
    "sahna: INGLIZ tilida rasm sahnasi tavsifi: ikki yosh o'zbek yigit/qiz, yuqorida foydali odat (ijobiy), " +
    "pastda unga zid odat (salbiy), issiq, tushunarli, matnsiz.";
  const r = await geminiChaqir(env, MATN_MODELLAR(env), { contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.9 } });
  if (r.xato) return { xato: r.xato };
  const j = r.j;
  try {
    const o = JSON.parse(j?.candidates?.[0]?.content?.parts?.[0]?.text || "");
    const q = (k, n) => String(o[k] || "").trim().slice(0, n);
    const d = { s1: q("sarlavha1", 40), s2: q("sarlavha2", 40), fikr: q("fikr", 140), kontekst: q("kontekst", 460), sahna: q("sahna", 500) };
    if (!d.s1 || !d.s2 || !d.fikr || !d.kontekst || !d.sahna) return { xato: "Gemini to'liq matn qaytarmadi" };
    return { d };
  } catch { return { xato: "Gemini javobi o'qilmadi" }; }
}

async function geminiPostRasm(env, d) {
  if (!env.GEMINI_API_KEY) return { xato: "kalit" };
  const prompt = `${POST_RASM_PROMPT}Headline line 1: "${d.s1.toUpperCase()}". Headline line 2: "${d.s2.toUpperCase()}". Scene: ${d.sahna}`;
  const r = await geminiChaqir(env, POST_MODELLAR(env), { contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "3:4" } } });
  if (r.xato) return { xato: r.xato };
  const j = r.j;
  const qism = (j?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data || p.inline_data?.data);
  const b64 = qism?.inlineData?.data || qism?.inline_data?.data;
  if (!b64) return { xato: "Gemini rasm qaytarmadi" };
  return { bin: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) };
}

/** Rasm tagidagi matn: sarlavha (qalin) + asosiy fikr (iqtibos) + foydali kontekst. Telegram chegarasi 1024. */
function postCaption(d) {
  const bosh = `<b>${esc(d.s1)} ${esc(d.s2)}</b>\n\n<blockquote>${esc(d.fikr)}</blockquote>\n\n`;
  const oxir = `\n\n👉 @ustozimnurimbot`;
  const joy = 1000 - bosh.length - oxir.length;
  return bosh + esc(d.kontekst).slice(0, Math.max(0, joy)) + oxir;
}

async function postMavzuOl(env) {
  let navbat = [];
  try { navbat = JSON.parse((await db.tizimOqi(env, "post:navbat")) || "[]"); } catch { /* bo'sh */ }
  if (navbat.length) {
    const m = navbat.shift();
    await db.tizimYoz(env, "post:navbat", JSON.stringify(navbat));
    return m;
  }
  const n = Number((await db.tizimOqi(env, "post:n")) || 0);
  await db.tizimYoz(env, "post:n", String(n + 1));
  return POST_MAVZULAR[n % POST_MAVZULAR.length];
}

async function postKoriniish(env, chatId, d) {
  const g = await geminiPostRasm(env, d);
  if (g.xato) {
    await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", link_preview_options: { is_disabled: true }, text: `⚠️ <b>Rasm yaratilmadi</b>\n\n<blockquote>${esc(String(g.xato).slice(0, 300))}</blockquote>` });
    return false;
  }
  const fd = new FormData();
  fd.append("chat_id", String(chatId));
  fd.append("photo", new Blob([g.bin], { type: "image/png" }), "post.png");
  fd.append("caption", postCaption(d));
  fd.append("parse_mode", "HTML");
  fd.append("reply_markup", JSON.stringify({ inline_keyboard: [
    [{ text: "✅ Guruhga yuborish", callback_data: "post:ok" }],
    [{ text: "🔄 Boshqa rasm", callback_data: "post:rasm" }, { text: "🔁 Boshqa mavzu", callback_data: "post:matn" }],
    [{ text: "✖️ O'tkazib yuborish", callback_data: "post:yoq" }],
  ] }));
  const r = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd })).json();
  const fid = r?.result?.photo?.at(-1)?.file_id;
  if (!r.ok || !fid) {
    await tg(env, "sendMessage", { chat_id: chatId, text: "⚠️ Rasmni yuborib bo'lmadi. Qayta urinib ko'ring." });
    return false;
  }
  await db.tizimYoz(env, "post:d", JSON.stringify({ ...d, fid }));
  return true;
}

/** Yangi post loyihasi: mavzu → matn → rasm → adminga ko'rsatish. */
async function postLoyiha(env, chatId, mavzu) {
  const m = mavzu || await postMavzuOl(env);
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", text: `⏳ Post tayyorlanmoqda…\n<i>${esc(m)}</i>` });
  const t1 = await geminiPostMatn(env, m);
  if (t1.xato === "kalit") {
    return tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
      text: "🔑 Gemini kaliti ulanmagan.\n\nTerminalda: <code>npx wrangler secret put GEMINI_API_KEY</code>\nva kalitni o'sha yerga kiriting (chatga yozmang)." });
  }
  if (t1.xato) return tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML", link_preview_options: { is_disabled: true },
    text: `⚠️ <b>Matn yaratilmadi</b>\n\n<blockquote>${esc(String(t1.xato).slice(0, 300))}</blockquote>\n\n<i>Qayta urinish: /post</i>` });
  await postKoriniish(env, chatId, { ...t1.d, mavzu: m });
}

async function postCallback(env, cb, chatId, data) {
  const olib = async () => { try { return JSON.parse((await db.tizimOqi(env, "post:d")) || "null"); } catch { return null; } };
  if (data === "post:yoq") {
    await db.tizimYoz(env, "post:d", "");
    await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    return tg(env, "sendMessage", { chat_id: chatId, text: "✖️ O'tkazib yuborildi." });
  }
  if (data === "post:matn") return postLoyiha(env, chatId);
  const d = await olib();
  if (!d) return tg(env, "sendMessage", { chat_id: chatId, text: "Loyiha topilmadi. /post bilan yangisini oching." });
  if (data === "post:rasm") {
    await tg(env, "sendMessage", { chat_id: chatId, text: "⏳ Yangi rasm…" });
    return postKoriniish(env, chatId, d);
  }
  if (data === "post:ok") {
    if (!env.CHAT_ID) return tg(env, "sendMessage", { chat_id: chatId, text: "CHAT_ID sozlanmagan." });
    await db.tizimYoz(env, "post:d", "");   // ikki marta bosilsa takror ketmasin
    await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    const r = await tg(env, "sendPhoto", { chat_id: env.CHAT_ID, photo: d.fid, caption: postCaption(d), parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "🧠 Viktorina", url: `https://t.me/${env.BOT_USERNAME || "ustozimnurimbot"}?start=quiz` }]] } });
    return tg(env, "sendMessage", { chat_id: chatId, text: r?.ok ? "✅ Guruhga yuborildi." : `⚠️ Yuborilmadi: ${r?.description || "xato"}` });
  }
}

/** /mavzu — admin navbati: bot keyingi postlarni shu mavzulardan boshlaydi. */
async function postMavzuBuyruq(env, chatId, matn) {
  let navbat = [];
  try { navbat = JSON.parse((await db.tizimOqi(env, "post:navbat")) || "[]"); } catch { /* bo'sh */ }
  if (matn) {
    navbat.push(matn.slice(0, 200));
    navbat = navbat.slice(-20);
    await db.tizimYoz(env, "post:navbat", JSON.stringify(navbat));
    return tg(env, "sendMessage", { chat_id: chatId, text: `✅ Navbatga qo'shildi (${navbat.length} ta). Keyingi post shu mavzudan boshlanadi.` });
  }
  return tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: navbat.length ? "📝 <b>Mavzular navbati</b>\n\n" + navbat.map((x, i) => `${i + 1}. ${esc(x)}`).join("\n")
      : "Navbat bo'sh — bot o'zi mavzu tanlaydi.\nMavzu qo'shish: <code>/mavzu Mavzu matni</code>" });
}

async function elonBoshla(env, chatId) {
  await db.tizimYoz(env, "elon:kutish", "1");
  await db.tizimYoz(env, "fk:ids", "");
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: "📣 <b>Tarqatma</b>\n\nTayyor postni yuboring (rasm, matn yoki rasm + matn). " +
          "U foydalanuvchilarga aynan shunday ko'rinishda boradi — avval sizga ko'rsataman.\n\n<i>Bekor qilish: /bekor</i>" });
}

async function fikrlarKorsat(env, chatId) {
  const q = await db.murojaatOxirgi(env, 10);
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: q.length ? "💬 <b>Oxirgi fikrlar</b>\n\n" + q.map((r) =>
      `#${r.id} ${r.javob_bor ? "✅" : "🕓"} ${esc(r.ism || r.uid)}${r.uname ? " @" + esc(r.uname) : ""}\n${esc(r.q)}`).join("\n\n")
      : "Hozircha fikr yo'q." });
}

/** Botni bloklash/blokdan chiqarish (Telegram my_chat_member). Faqat shaxsiy chat. */
async function handleMyChatMember(env, m) {
  if (m?.chat?.type !== "private") return;
  const st = m.new_chat_member?.status;
  const uid = m.from?.id;
  if (!uid) return;
  if (st === "kicked") await db.setBlocked(env, uid, true);
  else if (st === "member") await db.setBlocked(env, uid, false);
}

/** 👥 Foydalanuvchilar: sonlar + oxirgi 7 kunda botni to'xtatganlar. */
async function adminUsers(env, chatId, tahrir = null) {
  const kun = dayKey();
  const [n, k0] = await Promise.all([db.foydalanuvchiSonlari(env, kun), db.ketganlar(env, 7, 10).catch(() => null)]);
  const jadvalYoq = !k0;   // migratsiya hali bajarilmagan bo'lsa ham ekran ochiladi
  const k = k0 || { royxat: [], jami: 0, qaytdi: 0 };
  const satr = k.royxat.map((x) => {
    const kim = esc(x.name || x.uid) + (x.uname ? " @" + esc(x.uname) : "");
    return `• ${kim} — ${x.kun} kun, ${x.javob} javob` + (x.streak ? `, 🔥${x.streak}` : "");
  });
  const text =
    `👥 <b>Foydalanuvchilar</b>\n━━━━━━━━━━━━━━\n\n` +
    `Jami: <b>${n.jami}</b> · faol (bloklamagan): <b>${n.jami - n.bloklagan}</b> · bloklagan: <b>${n.bloklagan}</b>\n` +
    `🆕 Yangi: bugun <b>${n.yangi1}</b> · 7 kun <b>${n.yangi7}</b>\n` +
    `🟢 Faol: bugun <b>${n.dau}</b> · 7 kun <b>${n.wau}</b> · 30 kun <b>${n.mau}</b>\n\n` +
    (jadvalYoq ? `⚠️ <i>Ketganlar tarixi jadvali hali yaratilmagan (migratsiya kerak).</i>\n` : `⛔ <b>Botni to'xtatganlar (7 kun): ${k.jami}</b>` + (k.qaytdi ? ` · ↩️ qaytgan: ${k.qaytdi}` : "") + `\n`) +
    (jadvalYoq ? `` : satr.length ? `<blockquote>${satr.join("\n")}</blockquote>\n` : `<i>Data mavjud emas — kuzatuv endi boshlandi, bundan oldingilar yozilmagan.</i>\n`) +
    `\n<i>Telegramdagi «monthly users» — 30 kun faollar soni; u bloklaganlar soni emas.</i>`;
  const p = { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: [[{ text: "🔄 Yangilash", callback_data: "adm:users" }, { text: "↩️ Orqaga", callback_data: "adm:panel" }]] } };
  return tahrir ? tg(env, "editMessageText", { ...p, message_id: tahrir }) : tg(env, "sendMessage", p);
}

/** /admin — barcha admin amallari bitta xabarda, tugmalar bilan. */
async function adminPanel(env, chatId) {
  let javobsiz = "—", users = "—";
  try {
    javobsiz = (await env.DB.prepare("SELECT COUNT(*) AS n FROM murojaat WHERE javob IS NULL AND ish IS NULL").first())?.n ?? "—";
    users = (await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE blocked = 0").first())?.n ?? "—";
  } catch { /* son ko'rsatilmasa ham panel ochiladi */ }
  await tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: `🛠 <b>Admin paneli</b>\n\nFaol foydalanuvchi: <b>${users}</b> · javobsiz fikr: <b>${javobsiz}</b>`,
    reply_markup: { inline_keyboard: [
      [{ text: "📊 Hisobot", callback_data: "adm:hisobot" }, { text: "👥 Odamlar", callback_data: "adm:users" }],
      [{ text: "📥 Xabarlar" + (javobsiz && javobsiz !== "—" ? " (" + javobsiz + ")" : ""), callback_data: "adm:fikr" }, { text: "📣 E'lon", callback_data: "adm:elon" }],
      [{ text: "🛠 Nima qildik", callback_data: "adm:nima" }, { text: "📰 Yangi post", callback_data: "adm:post" }],
      [{ text: "🎞 Emoji", callback_data: "adm:emoji" }, { text: "📈 D1 limit", callback_data: "adm:d1" }],
      [{ text: "📚 Kutubxona", callback_data: "lib:adm" }],
    ] } });
}

/** D1 bepul kunlik limit holati (Cloudflare GraphQL Analytics). Reset: 00:00 UTC = 05:00 Toshkent. */
async function d1Holat(env, chatId, tahrir = null) {
  const OQISH = 5_000_000, YOZISH = 100_000;
  const vergul = (x) => String(x).replace(".", ",");
  const qisqa = (n) => n >= 1e6 ? vergul((n / 1e6).toFixed(1).replace(/\.0$/, "")) + " mln" : n >= 1e3 ? vergul((n / 1e3).toFixed(1).replace(/\.0$/, "")) + " ming" : String(Math.round(n));
  const foiz = (x, j) => { const p = (x / j) * 100; return vergul(p === 0 ? "0" : p < 10 ? p.toFixed(1) : String(Math.round(p))) + "%"; };
  const bar = (x, j) => { const n = x > 0 ? Math.max(1, Math.round(Math.min(1, x / j) * 12)) : 0; return "▓".repeat(n) + "░".repeat(12 - n); };
  let text;
  const belgi = await env.SESSIONS?.get("d1:limit").catch(() => null);
  const qizil = belgi ? "\n\n⛔ <b>Limit tugagan</b> (" + new Date(Number(belgi) + 5 * 3600e3).toISOString().slice(11, 16) + " da ko'rildi). Bot 05:00 dan keyin tiklanadi." : "";
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    text = "📈 <b>D1 limit</b>\n\n<blockquote>Aniq son uchun Cloudflare tokeni kerak (bir martalik sozlash): Account Analytics: Read + D1: Read, so'ng <code>CF_API_TOKEN</code> va <code>CF_ACCOUNT_ID</code> secret'lari.</blockquote>" + qizil;
  } else {
    const kun = new Date().toISOString().slice(0, 10);
    const q = "query{viewer{accounts(filter:{accountTag:\"" + env.CF_ACCOUNT_ID + "\"}){d1AnalyticsAdaptiveGroups(limit:1,filter:{date_geq:\"" + kun + "\",date_leq:\"" + kun + "\"}){sum{rowsRead rowsWritten readQueries writeQueries}}}}}";
    try {
      const r = await fetch("https://api.cloudflare.com/client/v4/graphql", { method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.CF_API_TOKEN }, body: JSON.stringify({ query: q }) }).then((x) => x.json());
      const g = r?.data?.viewer?.accounts?.[0]?.d1AnalyticsAdaptiveGroups?.[0]?.sum;
      if (!g) throw new Error(JSON.stringify(r?.errors || r).slice(0, 150));
      const yoz = Number(g.rowsWritten) || 0, oqi = Number(g.rowsRead) || 0;
      // Kun (UTC) qancha o'tgan — hozirgi tezlik bilan kun oxirigacha taxmin
      const d = new Date();
      const otgan = Math.max(0.1, (d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()) / 86400);
      const taxYoz = yoz / otgan, taxOqi = oqi / otgan;
      const eng = Math.max(taxYoz / YOZISH, taxOqi / OQISH);
      const holat = eng < 0.5 ? "🟢 <b>Hammasi joyida</b>" : eng < 0.8 ? "🟡 <b>Kuzatib boring</b>" : "🔴 <b>Limitga yaqin</b>";
      const yozTor = yoz / YOZISH >= oqi / OQISH;
      const blok = (belgi, nom, x, j, tor) => belgi + " <b>" + nom + "</b>" + (tor ? " · tor joy" : "") + "\n<code>" + bar(x, j) + " " + foiz(x, j) + "</code>\n" + qisqa(x) + " / " + qisqa(j) + " · qoldi " + qisqa(Math.max(0, j - x));
      let sigim = "";
      try {
        const dau = (await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE date(seen, '+5 hours') = date('now', '+5 hours') AND blocked = 0").first())?.n || 0;
        if (dau >= 5 && yoz > 0) {
          const sig = Math.min(Math.floor(YOZISH / (yoz / dau)), Math.floor(OQISH / (oqi / dau)));
          sigim = "\n\n👥 Bugun <b>" + dau + "</b> faol. Bepul limit ≈ <b>" + sig + "</b> faolgacha yetadi (<b>" + (sig / dau).toFixed(1).replace(".", ",") + "x</b> zaxira).";
        }
      } catch { /* sig'im ko'rsatilmasa ham asosiy son chiqadi */ }
      const vaqt = new Date(Date.now() + 5 * 3600e3).toISOString().slice(11, 16);
      const f = (n) => Number(n).toLocaleString("en-US").replace(/,/g, " ");
      const bar10 = (x, j) => { const n = x > 0 ? Math.max(1, Math.round(Math.min(1, x / j) * 10)) : 0; return "▓".repeat(n) + "░".repeat(10 - n) + " " + foiz(x, j); };
      text = "📈 <b>D1 limit — bugun</b>\n\n<blockquote>📖 O'qish: <b>" + f(oqi) + "</b> / " + f(OQISH) + "\n<code>" + bar10(oqi, OQISH) + "</code>\n\n" +
        "✏️ Yozish: <b>" + f(yoz) + "</b> / " + f(YOZISH) + "\n<code>" + bar10(yoz, YOZISH) + "</code></blockquote>\n\n" +
        "<i>So'rovlar: " + f(g.readQueries) + " o'qish, " + f(g.writeQueries) + " yozish. Reset: 05:00 (Toshkent).</i>" + sigim + qizil;
    } catch (e) {
      text = "⚠️ <b>D1 ma'lumotini ololmadim</b>\n<code>" + esc(String(e.message || e).slice(0, 160)) + "</code>\nToken ruxsatini tekshiring." + qizil;
    }
  }
  const p = { chat_id: chatId, parse_mode: "HTML", text, reply_markup: { inline_keyboard: [[{ text: "🔄 Yangilash", callback_data: "adm:d1" }, { text: "↩️ Orqaga", callback_data: "adm:panel" }]] } };
  return tahrir ? tg(env, "editMessageText", { ...p, message_id: tahrir }) : tg(env, "sendMessage", p);
}

/** Bot ochilganda (Start bosishdan oldin) ko'rinadigan matnlar. Faqat admin `/tavsif` bilan yangilaydi. */
const TAVSIF = {
  "": {
    d: "🧠 Ustozim Nurim — bilimingizni sinab, o'sishda hamroh bo'ladigan shaxsiy mentor.\n\n🎯 Kunlik viktorina: har kuni yangi savollar va izohlar\n📚 «Ilm olish sirlari» kitobi bo'yicha marafon\n🔁 Adashgan savollar yodingizda qolguncha qaytib keladi\n⚔️ Do'st bilan duel va 🏆 reyting\n\nBoshlash uchun pastdagi Start tugmasini bosing 👇",
    q: "Kunlik viktorina, kitob marafoni va do'st bilan duel — bilimingizni mustahkamlang 🧠",
  },
  ru: {
    d: "🧠 Ustozim Nurim — личный наставник, который проверяет знания и сопровождает ваш рост.\n\n🎯 Ежедневная викторина: новые вопросы и пояснения\n📚 Марафон по книге «Секреты получения знаний»\n🔁 Ошибки возвращаются, пока не запомнятся\n⚔️ Дуэль с другом и 🏆 рейтинг\n\nЧтобы начать, нажмите Start внизу 👇",
    q: "Ежедневная викторина, книжный марафон и дуэли с друзьями — укрепляйте знания 🧠",
  },
  en: {
    d: "🧠 Ustozim Nurim — a personal mentor that tests your knowledge and grows with you.\n\n🎯 Daily quiz: fresh questions with explanations\n📚 Marathon on the book «Secrets of Learning»\n🔁 Missed questions come back until they stick\n⚔️ Duels with friends and 🏆 leaderboard\n\nTap Start below to begin 👇",
    q: "Daily quiz, book marathon and duels with friends — make your knowledge stick 🧠",
  },
};

async function tavsifYoz(env, chatId) {
  const natija = [];
  for (const [til, v] of Object.entries(TAVSIF)) {
    const a = await tg(env, "setMyDescription", { description: v.d, language_code: til });
    const b = await tg(env, "setMyShortDescription", { short_description: v.q, language_code: til });
    natija.push((til || "uz") + ": " + (a?.ok && b?.ok ? "✅" : "⚠️ " + (a?.description || b?.description || "xato")));
  }
  return tg(env, "sendMessage", { chat_id: chatId, parse_mode: "HTML",
    text: "👋 <b>Bot tavsifi yangilandi</b>\n<blockquote>" + natija.join("\n") + "</blockquote>\n<i>Rasm (640×360) BotFather → /setdescriptionpic orqali qo'yiladi.</i>" });
}

async function adminBuyruqlarYoz(env) {
  if (!env.ADMIN_ID) return;
  return tg(env, "setMyCommands", {
    commands: [{ command: "admin", description: "🛠 Admin paneli" }, ...BUYRUQLAR],
    scope: { type: "chat", chat_id: Number(env.ADMIN_ID) },
  });
}

async function elonBolagi(env, chatId, dan, jami) {
  const n = await tarqat(env, await db.tizimOqi(env, "elon:matn"),
    { dan, soni: 150, rasm: (await db.tizimOqi(env, "elon:rasm")) || "" });
  jami.yetdi += n.yetdi;
  jami.bloklangan += n.bloklangan;

  if (!n.tugadi && n.korildi > 0) return elonBolagi(env, chatId, n.keyingi, jami);

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `✅ <b>Tarqatma yakunlandi</b>\n\n` +
      `Yetib bordi: <b>${jami.yetdi}</b> ta\n` +
      (jami.bloklangan ? `Bloklagan: <b>${jami.bloklangan}</b> ta\n` : "") +
      `\n<i>Bloklaganlar belgilab qo'yildi — keyingi tarqatmada ` +
      `ularga urinilmaydi.</i>`,
  });
}

/**
 * Telegram entity'larini HTML ga o'giradi.
 *
 * NEGA KERAK: admin xabarni Telegram'da formatlab yozadi (qalin,
 * kursiv, havola). Xom `text` da bu formatlash YO'Q — u alohida
 * `entities` ro'yxatida keladi. E'tiborsiz nusxalash formatlashni
 * yo'qotadi va admin ko'rgan matn bilan foydalanuvchi oladigan matn
 * bir xil bo'lmaydi — tarqatmada bu qo'pol xato.
 *
 * UTF-16 bo'yicha ishlanadi, chunki Telegram offsetlarni aynan
 * shu birlikda beradi. Kodlar nuqtasi bo'yicha hisoblash emoji va
 * kirill matnida siljishga olib keladi.
 */
function entityHtml(matn, entities) {
  if (!entities || !entities.length) return esc(matn);

  const b = [...matn];           // kod nuqtalari
  const u16 = [];                // har bir kod nuqtasining UTF-16 uzunligi
  for (const ch of b) u16.push(ch.length);

  // UTF-16 offsetdan massiv indeksiga xarita
  const idx = new Map();
  let pos = 0;
  for (let i = 0; i < b.length; i++) { idx.set(pos, i); pos += u16[i]; }
  idx.set(pos, b.length);

  const ochish = new Map(), yopish = new Map();
  const TEG = {
    bold: ["<b>", "</b>"], italic: ["<i>", "</i>"],
    underline: ["<u>", "</u>"], strikethrough: ["<s>", "</s>"],
    code: ["<code>", "</code>"], pre: ["<pre>", "</pre>"],
    spoiler: ['<span class="tg-spoiler">', "</span>"], blockquote: ["<blockquote>", "</blockquote>"],
    expandable_blockquote: ["<blockquote expandable>", "</blockquote>"],
  };

  for (const e of entities) {
    const bosh = idx.get(e.offset), oxir = idx.get(e.offset + e.length);
    if (bosh === undefined || oxir === undefined) continue;
    let och, yop;
    if (e.type === "text_link") { och = `<a href="${esc(e.url)}">`; yop = "</a>"; }
    else if (e.type === "custom_emoji" && e.custom_emoji_id) { och = '<tg-emoji emoji-id="' + e.custom_emoji_id + '">'; yop = "</tg-emoji>"; }
    else if (TEG[e.type]) [och, yop] = TEG[e.type];
    else continue;
    ochish.set(bosh, (ochish.get(bosh) || "") + och);
    yopish.set(oxir, yop + (yopish.get(oxir) || ""));
  }

  let chiq = "";
  for (let i = 0; i <= b.length; i++) {
    if (yopish.has(i)) chiq += yopish.get(i);
    if (ochish.has(i)) chiq += ochish.get(i);
    if (i < b.length) chiq += esc(b[i]);
  }
  return chiq;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Inline duel kartasidagi Lumi rasmi (Telegram thumbnail_url ni shu manzildan oladi)
    if (request.method === "GET" && url.pathname === "/lumi-duel2.jpg") {
      const bin = Uint8Array.from(atob(LUMI_THUMB_JPG), (ch) => ch.charCodeAt(0));
      return new Response(bin, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400" } });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        `Ustozim Nurim quiz bot — ishlayapti.\n` +
        `Kun #${dayIndex() + 1}, bugun ${KUNLIK_SHAXSIY} ta savol.\nBazada ${bank.length} ta savol.`,
        { headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }

    /**
     * Webhook'ni tashqaridan qayta o'rnatish.
     *
     * NEGA KERAK: BotFather'da token bekor qilinganda Telegram webhook'ni ham
     * o'chiradi. Shundan keyin botga yozilgan xabar Worker'ga umuman
     * yetib bormaydi — ya'ni ichkaridagi /sozla buyrug'i ham ishlamaydi.
     * Tovuq va tuxum holati: webhook'ni tiklash uchun webhook kerak bo'lib
     * qoladi. Shu yo'l uni uzadi.
     *
     * Himoya: WEBHOOK_SECRET bilan. U faqat Cloudflare'da turadi, shuning
     * uchun manzilni bilgan odam ham kalitsiz hech narsa qila olmaydi.
     */
    if (request.method === "GET" && url.pathname === "/setup") {
      if (!env.WEBHOOK_SECRET || url.searchParams.get("key") !== env.WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }

      const KERAK = ["message", "callback_query", "poll_answer", "poll", "my_chat_member", "inline_query", "chosen_inline_result"];
      let wh = null;
      for (let urinish = 0; urinish < 4; urinish++) {
        wh = await tg(env, "setWebhook", {
          url: env.WEBHOOK_URL || "https://ustozim-quiz-bot.nuriddinovx2.workers.dev/",
          secret_token: env.WEBHOOK_SECRET,
          allowed_updates: KERAK,
        });
        if (wh.ok) break;
        await new Promise((r) => setTimeout(r, (wh.parameters?.retry_after || 1) * 1000 + 400));
      }

      const cmd = await tg(env, "setMyCommands", {
        commands: BUYRUQLAR,
      });

      await adminBuyruqlarYoz(env);
      const info = await tg(env, "getWebhookInfo", {});
      const men = await tg(env, "getMe", {});

      return new Response(JSON.stringify({
        setWebhook: wh?.ok ?? false,
        setMyCommands: cmd?.ok ?? false,
        bot: men?.result?.username ?? null,
        webhook: {
          url: info?.result?.url ?? null,
          pending_update_count: info?.result?.pending_update_count ?? null,
          last_error_message: info?.result?.last_error_message ?? null,
          allowed_updates: info?.result?.allowed_updates ?? null,
        },
      }, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
    }

    if (request.method !== "POST") return new Response("Not found", { status: 404 });
    if (env.WEBHOOK_SECRET &&
        request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }

    let update;
    try { update = await request.json(); } catch { return new Response("bad", { status: 400 }); }

    // Worker o'zining kutish zanjirini davom ettirmoqda — Telegram yangilanishi emas.
    if (update.__kutish?.elon) {
      ctx.waitUntil(elonKopiya(env, update.__kutish.elon));
      return new Response("ok");
    }
    if (update.__kutish) {
      ctx.waitUntil(kechikkanTekshiruv(env, update.__kutish));
      return new Response("ok");
    }

    // Byudjet HAR SO'ROV uchun alohida tug'iladi: Worker izolyatsiyasi
    // bir nechta so'rovga xizmat qiladi, shuning uchun hisoblagich
    // modul darajasida bo'lsa, u so'rovlar orasida to'planib qolardi.
    const asliy = env;
    const hisob = { n: 0 };
    env = { ...env, DB: byudjetliBaza(env.DB, hisob) };

    try {
      const _uid = update.poll_answer?.user?.id ?? update.callback_query?.from?.id ?? update.message?.from?.id ?? update.inline_query?.from?.id ?? update.chosen_inline_result?.from?.id ?? update.my_chat_member?.from?.id;
      let _til = "uz";
      if (_uid) {
        try {
          _til = (await env.DB.prepare("SELECT lang FROM users WHERE uid = ?").bind(String(_uid)).first())?.lang || "uz";
        } catch { /* til noma'lum bo'lsa — o'zbekcha */ }
      }
      await tilBilan(_til, async () => {
        if (update.poll_answer) await handleAnswer(env, update.poll_answer);
        else if (update.poll) await handlePollClosed(env, update.poll);
        else if (update.callback_query) await handleCallback(env, update.callback_query);
        else if (update.inline_query) await handleInline(env, update.inline_query);
        else if (update.chosen_inline_result) await handleInlineTanlandi(env, update.chosen_inline_result);
        else if (update.my_chat_member) await handleMyChatMember(env, update.my_chat_member);
        else if (update.message) await handleMessage(env, update.message);
      });
    } catch (e) {
      console.error("handler", e && e.stack ? e.stack : e);
      // JIM QOLMAYMIZ. Ilgari xato faqat log'ga yozilardi: Telegram 200
      // oladi, foydalanuvchi esa hech narsa ko'rmaydi va "bot buzilgan"
      // deb o'ylaydi. Eng yomon nosozlik — o'zini sog'lom ko'rsatgani.
      ctx.waitUntil(xatoniAyt(asliy, update, e));
    }

    // Shu so'rovda yuborilgan taymerli savollar uchun zaxira kuzatuvni yoqamiz
    while (KUTAYOTGAN.length) {
      // Asliy baza: taymer zanjiri alohida ish va o'z so'rovlarini
      // qiladi. Asosiy so'rov hisoblagichiga qo'shilsa, uzun seansda
      // byudjet sababsiz tugaydi.
      ctx.waitUntil(kechikkanTekshiruv(asliy, KUTAYOTGAN.shift()));
    }

    return new Response("ok");
  },

  async scheduled(event, env, ctx) {
    const vaqt = new Date(event.scheduledTime);
    const h = vaqt.getUTCHours(), m = vaqt.getUTCMinutes();
    // Toshkent vaqti = UTC+5. Cron har 30 daqiqada ishlaydi (bitta trigger).
    if (m === 0) ctx.waitUntil(duelMuddatTekshir(env));              // har soat: tashlab ketilgan duellarni yopish
    if (m === 0 && h === 15) ctx.waitUntil(postKunlikElon(env));   // 20:00 — guruhga kunlik e'lon
    if (m === 0 && h === 16) ctx.waitUntil(sendReminders(env));    // 21:00 — ishlamaganlarga eslatma
    if (m === 30 && h === 16) ctx.waitUntil(adminHisobotYubor(env)); // 21:30 — adminga kunlik hisobot
    if (m === 0 && h === 17) ctx.waitUntil(postLeaderboard(env));  // 22:00 — guruhga reyting
    if (m === 0 && h === 11 && [1, 3, 5].includes(vaqt.getUTCDay()) && env.ADMIN_ID)
      ctx.waitUntil(postLoyiha(env, env.ADMIN_ID));                 // 16:00 Du/Chor/Juma — guruh posti loyihasi (adminga)
    if (m === 30 && h === 21) ctx.waitUntil(db.pollTozala(env, 72));  // 02:30 — 3 kundan eski, javobsiz qolgan poll yozuvlari
    ctx.waitUntil(soqchi(env));                                    // har safar: baza va webhook tekshiruvi
  },
};


// Sinov uchun ochiq. Byudjet mexanizmini tashqaridan tekshirish kerak:
// uning ishlamay qolishi sezilmaydi — hech narsa buzilmaydi, shunchaki
// himoya yo'qoladi va buni faqat keyingi nosozlik ko'rsatadi.
export { byudjetliBaza, SOROV_CHEGARASI, entityHtml, tarqat, superMiyaBer, kunGolibiPremium };
