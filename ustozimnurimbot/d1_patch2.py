#!/usr/bin/env python3
"""index.js — D1 ko'chishining ikkinchi bosqichi: statistika, reyting, eslatma, admin."""
import sys, pathlib

p = pathlib.Path.home() / "ustozim-quiz-bot" / "src" / "index.js"
s = p.read_text(encoding="utf-8")
xato = []

def swap(old, new, nom):
    global s
    if old not in s: xato.append(nom); return
    s = s.replace(old, new, 1)

def kes(boshi, oxiri, nom):
    """boshi..oxiri oralig'ini new bilan almashtirish uchun indeks topadi."""
    global s
    try:
        i = s.index(boshi); j = s.index(oxiri, i)
    except ValueError:
        xato.append(nom); return None, None
    return i, j

# ——— 1. kitob kunlik reytingi (kb:) — endi fasl_done jadvalida
swap('''  if (yangi) {
    await env.SESSIONS.put(
      `kb:${dayKey()}:${uid}`,
      JSON.stringify({ n: u.name || "Ishtirokchi", un: u.uname || "", s: ball, t: total, f: faslNo }),
      { expirationTtl: TTL_DAY }
    );
  }

''', "", "kb yozuvi")

# ——— 2. showStats — to'liq qayta yozamiz
i, j = kes("async function showStats(env, chatId, uid) {", "\n\n/** Reyting satrlari", "showStats")
if i is not None:
    s = s[:i] + '''async function showStats(env, chatId, uid) {
  const [u, st, bugun, xato] = await Promise.all([
    getUser(env, uid),
    db.statistika(env, uid),
    db.kunYakunlandiMi(env, uid, dayKey()),
    db.xatolar(env, uid, 1000),
  ]);

  if (!st.jami) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Siz hali birorta savolga javob bermadingiz. «🧠 Kunlik viktorina» dan boshlang!",
      reply_markup: MENU,
    });
    return;
  }

  const pct = Math.round((st.togri / st.jami) * 100);
  const rows = st.mavzular
    .filter((m) => m.a > 0)
    .map((m) => `${topicLabel(m.topic)}\\n   ${m.c}/${m.a} — ${Math.round((m.c / m.a) * 100)}%`)
    .join("\\n");

  const todayLine = bugun
    ? `\\n📅 Bugun: <b>${bugun.score}/${bugun.total}</b>`
    : `\\n📅 Bugun: hali ishlanmagan`;

  const kd = u.kitob || 0;
  const kitobLine =
    `\\n\\n📖 <b>Kitob marafoni</b>\\n${progressBar(kd)}  ${kd}/${KITOB_JAMI} fasl`;

  // Xatolar banki — tuzatilmagan savollar soni
  const xatoLine = xato.length
    ? `\\n\\n🔁 <b>Tuzatilmagan xatolar:</b> ${xato.length} ta`
    : ``;

  await tg(env, "sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `📊 <b>Natijalaringiz</b>\\n\\n` +
      `Jami javob: <b>${st.jami}</b> ta\\n` +
      `To'g'ri: <b>${st.togri}</b> ta (${pct}%)\\n` +
      `🔥 Ketma-ket kunlar: <b>${u.streak || 0}</b>\\n` +
      `🗓 Ishlagan kunlar: <b>${u.days || 0}</b>` +
      todayLine + kitobLine + xatoLine +
      `\\n\\n<b>Mavzular kesimida:</b>\\n${rows}`,
    reply_markup: MENU,
  });
}
''' + s[j:]

# ——— 3. collectBoard — bitta SQL so'rov
i, j = kes("async function collectBoard(env, date, prefix = \"b\") {", "\n\nasync function showRank", "collectBoard")
if i is not None:
    s = s[:i] + '''async function collectBoard(env, date) {
  // KV da bu 500 ta alohida o'qish edi; endi bitta so'rov.
  return db.reyting(env, date);
}
''' + s[j:]

# ——— 4. sendReminders
i, j = kes("async function sendReminders(env) {", "\n\nasync function postLeaderboard", "sendReminders")
if i is not None:
    s = s[:i] + '''async function sendReminders(env) {
  const boshlandi = Date.now();
  const royxat = await db.eslatmaRoyxati(env, dayKey());
  let sent = 0, bloklangan = 0;

  for (const bolak of chunk(royxat, REMINDER_BATCH)) {
    if (Date.now() - boshlandi > REMINDER_BUDGET_MS) {
      console.warn("sendReminders: vaqt byudjeti tugadi");
      break;
    }

    await Promise.all(bolak.map(async (u) => {
      const streakLine = u.streak > 1
        ? `🔥 <b>${u.streak} kunlik zanjiringiz</b> uzilib qolmasin!\\n\\n`
        : "";
      const r = await tg(env, "sendMessage", {
        chat_id: u.uid,
        parse_mode: "HTML",
        text:
          `⏰ <b>Bugungi viktorina hali ishlanmadi.</b>\\n\\n${streakLine}` +
          `Atigi bir necha daqiqa oladi 👇`,
        reply_markup: MENU,
      });
      if (r.ok) { sent++; return; }
      // 403 = bot bloklangan. Yozuvni o'chirmaymiz, faqat belgilaymiz.
      if (r.error_code === 403) { await db.setBlocked(env, u.uid, true); bloklangan++; }
    }));

    await new Promise((r2) => setTimeout(r2, 1100));   // Telegram rate-limit
  }

  console.log(`reminders: yuborildi ${sent}, bloklangan ${bloklangan}, nomzod ${royxat.length}`);
}
''' + s[j:]

# ——— 5. /reset
swap('''    await env.SESSIONS.delete(doneKey(target));
    await env.SESSIONS.delete(`b:${dayKey()}:${target}`);
    for (let i = 0; i < 30; i++) await env.SESSIONS.delete(aKey(target, i));
    if (full) await env.SESSIONS.delete(`u:${target}`);''',
'''    await env.DB.prepare("DELETE FROM daily WHERE uid = ? AND day = ?")
      .bind(String(target), dayKey()).run();
    await env.DB.prepare("DELETE FROM answers WHERE uid = ? AND day = ?")
      .bind(String(target), dayKey()).run();
    if (full) {
      await env.DB.prepare("DELETE FROM answers  WHERE uid = ?").bind(String(target)).run();
      await env.DB.prepare("DELETE FROM daily    WHERE uid = ?").bind(String(target)).run();
      await env.DB.prepare("DELETE FROM fasl_done WHERE uid = ?").bind(String(target)).run();
      await env.DB.prepare("DELETE FROM users    WHERE uid = ?").bind(String(target)).run();
    }''', "/reset")

# ——— 6. /stats — endi haqiqiy hisobot
i, j = kes('  if (text.startsWith("/stats") && String(uid) === String(env.ADMIN_ID)) {',
           '  await tg(env, "sendMessage", {\n    chat_id: chatId,\n    text: "Menyudan tanlang', "/stats")
if i is not None:
    s = s[:i] + '''  if (text.startsWith("/stats") && String(uid) === String(env.ADMIN_ID)) {
    const h = await db.kunlikHisobot(env, dayKey());
    const aniqlik = h.javob ? Math.round((h.togri / h.javob) * 100) : 0;
    const tushish = h.boshlagan ? Math.round((1 - h.yakunlagan / h.boshlagan) * 100) : 0;

    const mavzuSatr = h.mavzular
      .map((m) => `   ${topicLabel(m.topic)} — ${Math.round((m.c / m.a) * 100)}%`)
      .join("\\n") || "   —";

    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `🔧 <b>Kunlik hisobot</b> · ${sanaUz()}\\n━━━━━━━━━━━━━━\\n\\n` +
        `👥 Jami foydalanuvchi: <b>${h.jamiFoydalanuvchi}</b>\\n` +
        `▶️ Bugun boshlagan: <b>${h.boshlagan}</b>\\n` +
        `✅ Yakunlagan: <b>${h.yakunlagan}</b>` +
        (tushish ? `  (${tushish}% tashlab ketgan)` : ``) + `\\n` +
        `📈 Aniqlik: <b>${aniqlik}%</b>  (${h.togri}/${h.javob})\\n\\n` +
        `<b>Mavzular — eng qiyinidan:</b>\\n${mavzuSatr}\\n\\n` +
        `/shubha — shubhali savollar ro'yxati`,
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
      return `${i + 1}. <b>${foiz}%</b> (${r.n} javob)\\n   ${esc(clip(q ? q.q : r.qid, 90))}`;
    }).join("\\n\\n");
    await tg(env, "sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `⚠️ <b>Shubhali savollar</b>\\n<i>Kamida 5 kishi javob bergan, aniqlik 30% dan past</i>\\n\\n${satr}`,
    });
    return;
  }

''' + s[j:]

p.write_text(s, encoding="utf-8")
print(f"2-bosqich qo'llandi. Topilmagan: {xato if xato else 'yo‘q'}")
