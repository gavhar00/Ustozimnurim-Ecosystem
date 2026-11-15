# HANDOFF — @ustozimnurimbot (yangi chatda davom ettirish uchun)

Sana: 2026-11-01. Bu fayl eski chatdagi hamma muhim narsaning jamlanmasi.
Yangi chatni shu Project ichida oching va birinchi xabarda shu faylni (yoki `ARCHITECTURE.md` bilan birga) ko'rsating.

---

## 1. Loyiha qisqacha

**Egasi:** Habibulloh ("Ustozim Nurim", ustozimnurim.uz). Murojaat: "Ustozim Nurim".
**Maqsad:** @ustozimnurimbot — o'zbek tilidagi AI shaxsiy o'qish va o'sish mentori (Telegram bot). 4 kanalli ekotizimning markaziy AI qatlami:
- @ustozimnurim (personal brand)
- @sahifalarustozimnurim (strukturalangan o'qish: kitob, challenge, quiz)
- @ustozimnurimco (community)
- @quranoy (Qur'on / ruhiy kontent, eng ehtiyotkor kanal)

**Ish uslubi (Project instruction'dan):** o'zbek tilida, aniq, qaror birinchi; noto'g'ri/ortiqcha g'oyani ochiq rad et; MVP intizomi; fake analytics yo'q; maxfiylik birinchi o'rinda.

---

## 2. QULFLANGAN arxitektura (qayta ochilmaydi)

| Qatlam | Tanlov |
|---|---|
| Backend | NestJS + TypeScript (strict) |
| Bot | grammY, webhook rejimi (long-polling faqat lokal dev) |
| DB | PostgreSQL (Neon) |
| ORM | Prisma **7.9.1** (datasource URL `prisma.config.ts` orqali) |
| Queue/Scheduler | BullMQ + Redis (Upstash), repeatable job'lar |
| Cache/rate-limit | Redis |
| Log | Pino (nestjs-pino), redaction bilan |
| Xato monitoring | Sentry (request body/PII yo'q) |
| Deploy | Railway, 2 servis: Bot Service + Worker Service |
| Env | Zod bilan validatsiya (fail-fast) |
| Admin | Telegram ichida (web dashboard yo'q), admin allow-list |
| Analytics | O'z `Event` jadvali (3rd-party SaaS yo'q) |
| Endpoint'lar | faqat `POST /telegram/webhook`, `GET /health` |
| R2 | faqat audio/rasm kerak bo'lsa |

**AI Gateway (router-first):** barcha AI chaqiruvlar faqat `AiGateway.route()` orqali.
1. Deterministik/template (AI yo'q)
2. Haiku — intent tag, fon vazifalar (memory xulosa, xato klassifikatsiya, report insight, qisqa oddiy Q&A)
3. Sonnet — murakkab mentor chat (oxirgi 5 quiz natijasi, top-3 zaif mavzu, streak, MemoryNotes)

**@quranoy qoidasi:** `allowFreeformAiContent = false as const` — kodda majburlangan, faqat tasdiqlangan manbali shablon kontent. Production'da oxirgi yoqiladigan kanal.

**Deep-link:** `ch_<code>_<postId>`, kodlar: `un` / `sf` / `co` / `qr`. Regex: `^ch_([a-z]{2,10})_([A-Za-z0-9-]{1,64})$`. Noto'g'ri payload hech qachon xato otmaydi.

**Hisobotlar:** Daily Executive Report (P0; DATA→ANALYSIS→INSIGHT→ALERT→RECOMMENDATION→ACTION; Toshkent kechqurun; `DAILY_REPORT_TIME` HH:mm; faqat `DailyMetric` o'qiydi) + Weekly chuqurroq report. Xom `Event` va shaxsiy suhbat matni reportga kirmaydi.

**Kanal analytics halolligi:** Bot ishonchli o'lchaydi: deep-link attribution, bot orqali kelgan user, activation, faollik, bot interaksiyalari. Bot API BERMAYDI: to'liq reach, obunachi o'sishi, post ko'rishlari, reaction tafsiloti.

**Self-improvement:** OBSERVE→ANALYZE→PROPOSE→ADMIN APPROVAL→IMPLEMENT→TEST→MEASURE. Production kodni o'zi o'zgartirmaydi.

**Scope:**
- P0: onboarding, profil, AI mentor chat, memory, quiz engine, Mistake Bank, progress, recommendation, daily learning loop, 4 kanal arxitekturasi, kanal data yig'ish, daily admin report, qiymatga asoslangan notification, privacy/security, asosiy admin boshqaruv.
- P1/P2: ilg'or gamification, A/B test, ilg'or adaptive learning, Teacher Copilot, visual learner profiling, semantic content intelligence.
- n8n: faqat keyinroq ixtiyoriy qatlam (report/notification pipeline). Kodning o'rnini bosmaydi.

To'liq matn: Project knowledge'dagi **`claude/ARCHITECTURE.md`** (17 bo'lim).

---

## 3. Hozirgi holat

### Phase 1 — YOZILDI (sandbox'da tekshirilgan)
- Fayl: `ustozim-nurim-bot-phase1.zip` (node_modules va .env siz). **Chatni o'chirishdan oldin yuklab oling — kod faqat shu zip ichida!**
- Ichida: config (Zod env), Prisma (11 model), Redis, BullMQ, Pino, Sentry, 4 ta ChannelAdapter + registry, attribution (deep-link), users, onboarding (NOT_STARTED→WELCOMED), grammY `/start`, `/health`, webhook (secret token), set/delete-webhook va dev-polling skriptlar, 5 test fayli (23 test o'tgan).
- Prisma 7.9.1 moslik tuzatildi: `validate` ✅, `generate` ✅. Eslatma: har bir `prisma` CLI buyrug'i (hatto `--version`) `.env` dagi `DATABASE_URL` siz ishlamaydi.
- Phase 1'da faqat User / Channel / ChannelPost / Event mantiqi bor. Quiz, AI mentor, daily report, kengaytirilgan analytics HALI YO'Q (ataylab).

### Haqiqiy muhitda tekshiruv — HALI QILINMAGAN
16 qadamlik checklist (tartib):
1. Neon Postgres yaratish → `DATABASE_URL`
2. Upstash Redis → `REDIS_URL`
3. `.env` to'ldirish (`.env.example` asosida)
4. `npx prisma migrate dev`
5. BotFather'dan token → `TELEGRAM_BOT_TOKEN`
6. Kanal chat ID'lari (4 ta `CHANNEL_*_CHAT_ID`)
7. Admin Telegram ID (`ADMIN_TELEGRAM_IDS`)
8. Lokal polling (`bot:poll-dev`)
9. `/start` ishlashini tekshirish
10. DB'da user yozilganini tekshirish
11. Deep-link testi (`ch_un_test1` va h.k.)
12. 4 adapter tekshiruvi
13. Event yozilishi
14. `/health`
15. Sentry test xatosi
16. BullMQ ulanishi

**Keyingi qadam:** 1-qadam (Neon) → keyin `npx prisma migrate dev` natijasini ko'rsatish.

**Xavfsizlik chegarasi:** Claude sizning akkauntlaringizga kirmaydi va parol/connection string/token bilan ishlamaydi. Siz bajarasiz, Claude qadamlarni aytadi va CLI natijasini tekshiradi. Secretlarni chatga yubormang.

### Alohida: Cloudflare viktorina boti (`ustozim-quiz-bot`)
Bu NestJS botdan ALOHIDA tizim. Ishdan chiqqan edi; foydalanuvchi boshqa chatda davom ettirib hal qilgan — **hozir ishlayapti** (2026-11-01).

---

## 4. Ochiq qarorlar (siz tasdiqlashingiz kerak)
1. Admin Telegram ID'lari
2. Anthropic API oylik budjeti
3. @quranoy kontent manbasi (tasdiqlangan)
4. Ma'lumot saqlash muddati (data retention)
5. Daily report aniq vaqti
6. Kanallarni production'ga yoqish tartibi (tavsiya: un → sf → co → qr oxirida)

---

## 5. Keyingi bosqich (Phase 1 tasdiqlangandan keyin)
**Phase 2:** Quiz engine, Mistake Bank, progress, AI Gateway + Router, memory, analytics asosi.
Phase 2'ga o'tishdan oldin Phase 1 real muhitda tasdiqlanishi shart.

---

## 6. Yangi chat uchun tayyor birinchi xabar (nusxa oling)

> Men Habibulloh (Ustozim Nurim). @ustozimnurimbot loyihasining davomi. Project knowledge'dagi ARCHITECTURE.md va HANDOFF.md ni o'qi. Arxitektura QULFLANGAN, qayta ochma. Phase 1 kodi yozilgan (zip menda). Hozir 16 qadamlik haqiqiy muhit tekshiruvidan 1-qadam (Neon) dan boshlaymiz. Secretlarni yubormayman, sen qadamlarni ayt va natijani tekshir.

---

## 7. Chatni o'chirishdan oldin tekshiring
- [ ] `ustozim-nurim-bot-phase1.zip` yuklab olingan
- [ ] `ARCHITECTURE.md` yuklab olingan (Project knowledge'da ham bor)
- [ ] `HANDOFF.md` (shu fayl) Project knowledge'ga qo'shilgan yoki saqlangan
