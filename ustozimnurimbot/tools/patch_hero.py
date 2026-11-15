import os
os.chdir(os.path.expanduser('~/ustozim-quiz-bot'))
def sub(s,a,b,n=1):
    assert s.count(a)==n,(s.count(a),a[:70]); return s.replace(a,b)
d=open('src/db.js',encoding='utf-8').read()
d=sub(d,"/** Kunlik reyting — bitta so'rov.","""/** Berilgan qiyin savollardan (qid ro'yxati) bugun nechtasiga to'g'ri javob berilgan. */
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

/** Kunlik reyting — bitta so'rov.""")
d=sub(d,"""           CASE WHEN u.super_until > datetime('now') THEN 1 ELSE 0 END AS sm""","""           CASE WHEN u.super_until > datetime('now') THEN 1 ELSE 0 END AS sm,
           CASE WHEN u.hero_until > datetime('now') THEN 1 ELSE 0 END AS hr""")
d=sub(d,'ORDER BY d.score DESC, d.total DESC\n','ORDER BY d.score DESC, d.at ASC\n')
d=sub(d,"    inglizTogri: ing?.n || 0,","    inglizTogri: ing?.n || 0,\n    heroKun: user.hero_jami || 0,\n    heroZanjir: user.hero_n || 0,")
open('src/db.js','w',encoding='utf-8').write(d)

y=open('src/yutuq.js',encoding='utf-8').read()
y=sub(y,"  // ——— yakun: marafonning o'zi","""  // ——— qiyin savollar
  { kod: "hero",      emoji: "🦸", nom: "Hero", ru: "Герой", en: "Hero",
    izoh: "Kunlik viktorinadagi qiyin savollarning hammasiga to'g'ri javob berdingiz",
    ruIzoh: "Вы правильно ответили на все сложные вопросы дня",
    enIzoh: "You answered every hard question of the day correctly",
    shart: (h) => h.heroKun >= 1 },

  { kod: "hero3",     emoji: "🛡", nom: "Qahramonlar zanjiri", ru: "Цепочка героев", en: "Hero Streak",
    izoh: "3 kun ketma-ket qiyin savollarning hammasini topdingiz",
    ruIzoh: "3 дня подряд вы решали все сложные вопросы",
    enIzoh: "3 days in a row with every hard question correct",
    shart: (h) => h.heroZanjir >= 3 },

  // ——— yakun: marafonning o'zi""")
open('src/yutuq.js','w',encoding='utf-8').write(y)

s=open('src/index.js',encoding='utf-8').read()
s=sub(s,"""  const ball = await db.kunlikBall(env, uid, dayKey());
  const score = Math.min(ball.togri, total);   // 15→5 o'tish kunida ortiqcha javoblar chegaralanadi
  const pct = Math.round((score / total) * 100);
  await db.kunYakunla(env, uid, dayKey(), score, total);
""","""  const ball = await db.kunlikBall(env, uid, dayKey());
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
""")
s=sub(s,"  const xatoSoni = total - score;","""  const qiyinQator = qiyinlar.length
    ? `\\n⭐ Qiyin savollar: <b>${qiyinTogri}/${qiyinlar.length}</b> (ikki baravar ball)` +
      (hero ? `\\n🦸 <b>Hero!</b> Hamma qiyin savol to'g'ri` + (heroZanjir > 1 ? ` — <b>${heroZanjir} kun ketma-ket</b>!` : `.`) : ``) + `\\n`
    : ``;
  const xatoSoni = total - score;""")
s=sub(s,"""        ketma: streakLine, baho: verdict,
      }) + keyingiQadam""","""        ketma: streakLine + qiyinQator, baho: verdict,
      }) + keyingiQadam""")
s=sub(s,"""  return (r.sm ? "🧠 " : "") + (r.p ? `💎 ${nom}` : nom);""","""  return (r.hr ? "🦸 " : "") + (r.sm ? "🧠 " : "") + (r.p ? `💎 ${nom}` : nom);""")
s=sub(s,"""    kitobBelgi, vaqtMatn,
  ].filter(Boolean).join(" · ");""","""    kitobBelgi, vaqtMatn, (q.h && mode === "d") ? "⭐ 2 ball" : "",
  ].filter(Boolean).join(" · ");""")
s=sub(s,"async function postLeaderboard(env) {","""/** Kun g'olibi (1-o'rin) — 1 kun BEPUL premium. Bir kunda bir marta (takror ishga tushsa ham). */
async function kunGolibiPremium(env, rows) {
  const g = rows.find((r) => r.t > 0 && r.s > 0);
  if (!g) return null;
  const kalit = `p1:${dayKey()}`;
  if (await db.tizimOqi(env, kalit)) return null;
  await db.tizimYoz(env, kalit, String(g.uid));
  await db.premiumBer(env, g.uid, 1, "reyting", `kun g'olibi ${dayKey()}`);
  await tg(env, "sendMessage", { chat_id: g.uid, parse_mode: "HTML",
    text: `🥇 <b>Kun g'olibi!</b>\\n\\nBugungi reytingda <b>1-o'rin</b> sizniki. Sovg'a: <b>1 kun 💎 premium</b> — profilingiz va qo'shimcha statistikangiz ochildi.\\n\\nErtaga ham birinchi bo'la olasizmi?`,
    reply_markup: menyu() }).catch(() => {});
  return g;
}

async function postLeaderboard(env) {""")
s=sub(s,"""  try { if (await superMiyaBer(env, rows)) rows = await collectBoard(env, dayKey()); }
  catch (e) { console.warn("superMiyaBer", e); }""","""  try { if (await superMiyaBer(env, rows)) rows = await collectBoard(env, dayKey()); }
  catch (e) { console.warn("superMiyaBer", e); }
  try { if (await kunGolibiPremium(env, rows)) rows = await collectBoard(env, dayKey()); }
  catch (e) { console.warn("kunGolibiPremium", e); }""")
s=sub(s,'"🧠 — «Super miya»: bugungi kuchli beshlik.\\nErtaga soat 20:00 da yangi savollar 🌙"','"🧠 Super miya: kuchli beshlik · 🦸 Hero: qiyin savollar hammasi to\'g\'ri\\n🥇 Kun g\'olibi 1 kun 💎 premium oladi\\nErtaga soat 20:00 da yangi savollar 🌙"')
s=sub(s,"export { byudjetliBaza, SOROV_CHEGARASI, entityHtml, tarqat, superMiyaBer };","export { byudjetliBaza, SOROV_CHEGARASI, entityHtml, tarqat, superMiyaBer, kunGolibiPremium };")
open('src/index.js','w',encoding='utf-8').write(s)
sc=open('schema.sql',encoding='utf-8').read().rstrip('\n')+"\n\n-- «Hero»: qiyin savollar hammasi to'g'ri (nishon muddati, oxirgi kun, zanjir, jami)\nALTER TABLE users ADD COLUMN hero_until TEXT;\nALTER TABLE users ADD COLUMN hero_last TEXT;\nALTER TABLE users ADD COLUMN hero_n INTEGER NOT NULL DEFAULT 0;\nALTER TABLE users ADD COLUMN hero_jami INTEGER NOT NULL DEFAULT 0;\n"
open('schema.sql','w',encoding='utf-8').write(sc)
print("ok")
