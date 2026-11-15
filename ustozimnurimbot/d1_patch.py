#!/usr/bin/env python3
"""index.js ni KV dan D1 ga o'tkazadi."""
import sys, pathlib, re

p = pathlib.Path.home() / "ustozim-quiz-bot" / "src" / "index.js"
s = p.read_text(encoding="utf-8")
if "from \"./db.js\"" in s:
    print("Allaqachon D1 ga o'tkazilgan."); sys.exit(0)

xato = []
def swap(old, new, nom):
    global s
    if old not in s:
        xato.append(nom); return
    s = s.replace(old, new, 1)

# ——— 1. import
swap('} from "./kitob.js";',
'''} from "./kitob.js";
import * as db from "./db.js";''', "import")

# ——— 2. getUser / saveUser / recordAnswer — db.js ga ko'chdi
eski_user = s[s.index("async function getUser(env, uid) {"):s.index("// ——————————————————————————————————————————————— savol yuborish")]
s = s.replace(eski_user, '''const getUser = (env, uid) => db.getUser(env, uid);
const saveUser = (env, uid, u) => db.saveUser(env, uid, u);

''')

# ——— 3. sendQuestion: poll yozuvi
swap('''    await env.SESSIONS.put(
      `p:${res.result.poll.id}`,
      JSON.stringify({ u: uid, i: index, m: mode, c: chatId, msg: res.result.message_id, ...extra }),
      { expirationTtl: TTL_POLL }
    );''',
'''    await db.pollSaqla(env, res.result.poll.id,
      { u: uid, i: index, m: mode, c: chatId, msg: res.result.message_id, ...extra });''',
"sendQuestion poll")

# ——— 4. navbatniOl
eski_nav = s[s.index("async function navbatniOl(env, pollId, tekshir = null) {"):s.index("function topicLabel(t) {")]
s = s.replace(eski_nav, '''const navbatniOl = (env, pollId, tekshir) => db.navbatniOl(env, pollId, tekshir);

''')

# ——— 5. kalit yasovchilar
swap('''const aKey = (uid, i) => `a:${uid}:${dayKey()}:${i}`;
const doneKey = (uid) => `done:${uid}:${dayKey()}`;

async function firstUnanswered(env, uid, total) {
  for (let i = 0; i < total; i++) {
    if ((await env.SESSIONS.get(aKey(uid, i))) === null) return i;
  }
  return total;
}''',
'''const firstUnanswered = (env, uid, total) => db.birinchiJavobsiz(env, uid, dayKey(), total);''',
"aKey/doneKey")

# ——— 6. startDaily
swap('''  const done = await env.SESSIONS.get(doneKey(uid));
  if (done !== null) {
    const d = JSON.parse(done);''',
'''  const d = await db.kunYakunlandiMi(env, uid, dayKey());
  if (d) {''', "startDaily done")

swap('''  const u0 = await getUser(env, uid);
  const hozir = Date.now();
  if (u0.oxirgi && u0.oxirgi.i === next && hozir - u0.oxirgi.t < TAKROR_OYNA) {''',
'''  const u0 = await getUser(env, uid);
  const hozir = Date.now();
  const oxirgi = OXIRGI_SAVOL.get(String(uid));
  if (oxirgi && oxirgi.i === next && hozir - oxirgi.t < TAKROR_OYNA) {''', "takror tekshiruv")

swap('''  u0.oxirgi = { i: next, t: hozir };
  if (name && u0.name !== name) u0.name = name;
  await saveUser(env, uid, u0);''',
'''  OXIRGI_SAVOL.set(String(uid), { i: next, t: hozir });
  if (name && u0.name !== name) await db.touchUser(env, uid, name, null);''', "takror yozuv")

# ——— 7. finishDaily
swap('''  if ((await env.SESSIONS.get(doneKey(uid))) !== null) return;

  let score = 0;
  for (let i = 0; i < total; i++) {
    const v = i in known ? known[i] : await env.SESSIONS.get(aKey(uid, i));
    if (v === "1") score += 1;
  }
  const pct = Math.round((score / total) * 100);
  await env.SESSIONS.put(doneKey(uid), JSON.stringify({ score, total }), { expirationTtl: TTL_DAY });''',
'''  if (await db.kunYakunlandiMi(env, uid, dayKey())) return;

  const ball = await db.kunlikBall(env, uid, dayKey());
  const score = ball.togri;
  const pct = Math.round((score / total) * 100);
  await db.kunYakunla(env, uid, dayKey(), score, total);''', "finishDaily ball")

swap('''  const u = await getUser(env, uid);
  if ((u.answered || 0) < total) {          // eski ma'lumot bilan nomuvofiqlikni tuzatish
    u.answered = total;
    u.correct = Math.max(u.correct || 0, score);
  }
  u.streak = u.lastDaily === dayKey(-1) ? (u.streak || 0) + 1 : 1;
  u.lastDaily = dayKey();
  u.days = (u.days || 0) + 1;
  await saveUser(env, uid, u);''',
'''  const u = await getUser(env, uid);
  u.streak = u.last_daily === dayKey(-1) ? (u.streak || 0) + 1 : 1;
  u.last_daily = dayKey();
  u.days = (u.days || 0) + 1;
  if (name) u.name = name;
  await saveUser(env, uid, u);''', "finishDaily streak")

swap('''  // reyting yozuvi
  await env.SESSIONS.put(
    `b:${dayKey()}:${uid}`,
    JSON.stringify({ n: name || u.name || "Ishtirokchi", un: u.uname || "", s: score, t: total }),
    { expirationTtl: TTL_DAY }
  );''', "", "reyting yozuvi")

# ——— 8. kitob kalitlari
swap('''const kKey = (uid, f, i) => `k:${uid}:${f}:${i}`;
const kDoneKey = (uid, f) => `kd:${uid}:${f}`;

''', "", "kKey")

swap('''  let keyingi = 0;
  while (keyingi < qs.length && (await env.SESSIONS.get(kKey(uid, faslNo, keyingi))) !== null) {
    keyingi++;
  }
  if (keyingi >= qs.length) {
    for (let i = 0; i < KITOB_BATCH; i++) await env.SESSIONS.delete(kKey(uid, faslNo, i));
    keyingi = 0;
  }''',
'''  const berilgan = await db.faslJavoblari(env, uid, faslNo);
  const bor = new Set(berilgan.map((r) => r.idx));
  let keyingi = 0;
  while (keyingi < qs.length && bor.has(keyingi)) keyingi++;
  if (keyingi >= qs.length) {
    await db.faslTozala(env, uid, faslNo);
    keyingi = 0;
  }''', "startFasl davom")

swap('''  let ball = oxirgi ? 1 : 0;
  for (let i = 0; i < total - 1; i++) {
    if ((await env.SESSIONS.get(kKey(uid, faslNo, i))) === "1") ball++;
  }
  const foiz = Math.round((ball / total) * 100);''',
'''  const berilgan = await db.faslJavoblari(env, uid, faslNo);
  const ball = berilgan.reduce((n, r) => n + (r.correct ? 1 : 0), 0);
  const foiz = Math.round((ball / total) * 100);''', "finishFasl ball")

swap('''  const yangi = faslNo > (u.kitob || 0);
  if (yangi) u.kitob = faslNo;
  u.kitobBall = (u.kitobBall || 0) + (yangi ? ball : 0);
  u.kitobJavob = (u.kitobJavob || 0) + (yangi ? total : 0);
  await saveUser(env, uid, u);
  await env.SESSIONS.put(kDoneKey(uid, faslNo), JSON.stringify({ ball, total }), { expirationTtl: TTL_USER });''',
'''  const yangi = faslNo > (u.kitob || 0);
  if (yangi) { u.kitob = faslNo; await saveUser(env, uid, u); }
  await db.faslYakunla(env, uid, faslNo, ball, total);''', "finishFasl saqlash")

# ——— 9. handleAnswer: kitob
swap('''    if (index >= qs.length) return;
    if ((await env.SESSIONS.get(kKey(uid, faslNo, index))) !== null) return;

    const q = qs[index];
    const ok = (pa.option_ids || [])[0] === q.c;
    await env.SESSIONS.put(kKey(uid, faslNo, index), ok ? "1" : "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, "Kitob", ok);''',
'''    if (index >= qs.length) return;

    const q = qs[index];
    const ok = (pa.option_ids || [])[0] === q.c;
    await db.javobYoz(env, { uid, mode: "k", fasl: faslNo, idx: index,
      savol: q.q, topic: "Kitob", ok });''', "handleAnswer kitob")

# ——— 10. handleAnswer: kunlik
swap('''    if (index >= total) return;
    if ((await env.SESSIONS.get(aKey(uid, index))) !== null) return; // takroriy

    const q = questions[index];
    const ok = (pa.option_ids || [])[0] === q.c;
    await env.SESSIONS.put(aKey(uid, index), ok ? "1" : "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, q.t, ok);''',
'''    if (index >= total) return;

    const q = questions[index];
    const ok = (pa.option_ids || [])[0] === q.c;
    await db.javobYoz(env, { uid, mode: "d", day: dayKey(), idx: index,
      savol: q.q, topic: q.t, ok });''', "handleAnswer kunlik")

# ——— 11. handleAnswer: mashq
swap('''  const q = qs[index];
  const ok = (pa.option_ids || [])[0] === q.c;
  await recordAnswer(env, uid, q.t, ok);

  if (index + 1 < SEQ_BATCH) {''',
'''  const q = qs[index];
  const ok = (pa.option_ids || [])[0] === q.c;
  await db.javobYoz(env, { uid, mode: "s", idx: index, savol: q.q, topic: q.t, ok });

  if (index + 1 < SEQ_BATCH) {''', "handleAnswer mashq")

swap('''    const u2 = await getUser(env, uid);
    u2.seq = ((u2.seq || 0) + SEQ_BATCH) % seqOrder().length;
    await saveUser(env, uid, u2);''',
'''    const u2 = await getUser(env, uid);
    u2.seq = ((u2.seq || 0) + SEQ_BATCH) % seqOrder().length;
    await saveUser(env, uid, u2);
    const st2 = await db.statistika(env, uid);''', "mashq seq")

swap('''        `Umumiy natijangiz: <b>${u2.correct}/${u2.answered}</b> ` +
        `(${u2.answered ? Math.round((u2.correct / u2.answered) * 100) : 0}%)\\n\\n` +''',
'''        `Umumiy natijangiz: <b>${st2.togri}/${st2.jami}</b> ` +
        `(${st2.jami ? Math.round((st2.togri / st2.jami) * 100) : 0}%)\\n\\n` +''', "mashq natija")

# ——— 12. savolniOtkaz
swap('''    await env.SESSIONS.put(aKey(uid, index), "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, questions[index].t, false);''',
'''    await db.javobYoz(env, { uid, mode: "d", day: dayKey(), idx: index,
      savol: questions[index].q, topic: questions[index].t, ok: false, skipped: true });''',
"otkaz kunlik")

swap('''    await env.SESSIONS.put(kKey(uid, faslNo, index), "0", { expirationTtl: TTL_DAY });
    await recordAnswer(env, uid, "Kitob", false);''',
'''    await db.javobYoz(env, { uid, mode: "k", fasl: faslNo, idx: index,
      savol: qs[index].q, topic: "Kitob", ok: false, skipped: true });''', "otkaz kitob")

swap('''    if (!(await env.SESSIONS.get(`p:${ish.pollId}`))) return;''',
'''    if (!(await db.pollKor(env, ish.pollId))) return;''', "zanjir tekshiruv")

swap('''  const raw = await env.SESSIONS.get(`p:${pollId}`);
  if (!raw) return;                       // savol allaqachon oldinga surilgan
  const { c: chatId } = JSON.parse(raw);''',
'''  const rec = await db.pollKor(env, pollId);
  if (!rec) return;                       // savol allaqachon oldinga surilgan
  const chatId = Number(rec.chat_id);''', "davomTugmasi")

p.write_text(s, encoding="utf-8")
print(f"1-bosqich qo'llandi. Topilmagan: {xato if xato else 'yo‘q'}")
