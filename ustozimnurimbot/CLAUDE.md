# @ustozimnurimbot — agent xotirasi (HAR SESSIYA BOSHIDA O'QING)

Bu fayl loyihaning "uzoq muddatli xotirasi". Maqsad: admin (Habibulloh) bir narsani IKKI MARTA aytmasin, bir xatoni IKKI MARTA qilmaylik.
Har sessiya boshida shu faylni to'liq o'qing. Sessiya oxirida (yoki yangi qoida/xato chiqqanda DARHOL) 5-bo'limga yozib boring.


## 0. DIQQAT: ikki xil "bot" bor — chalkashtirma
| | **ustozim-quiz-bot** (SHU repo) | **ustozim-nurim-bot** (NestJS, Phase 1) |
|---|---|---|
| Holat | JONLI, ~290 foydalanuvchi, @ustozimnurimbot shu yerda ishlaydi | Faqat kod (zip), real muhitda HECH QACHON ishga tushmagan |
| Stack | Cloudflare Workers + D1 + KV, JavaScript | NestJS + grammY + Prisma/Neon + BullMQ/Upstash, TypeScript |
| Hujjat | shu CLAUDE.md | HANDOFF.md + ARCHITECTURE.md (eski chat, 2026-08/11) |
- ChatGPT/eski hujjatlardagi "bot = NestJS" degan gap NestJS rejasiga tegishli, jonli botga EMAS.
- Ikkalasi bitta @ustozimnurimbot tokenini ishlata olmaydi (bitta webhook). NestJS'ga o'tish = jonli botni almashtirish; bu admin qarori, o'zboshimchalik bilan boshlanmaydi.
- Jonli botda NestJS rejasining P0 qismidan ko'pi allaqachon bor: kunlik viktorina, Xatolar banki (1-2-4-7-14), natija/reyting, duel, kitob marafoni, kutubxona, fikr-mulohaza. Yo'q: AI mentor chat, deep-link attribution, kunlik admin report, kanal adapterlari.

## 1. Loyiha
- Telegram viktorina/o'rganish boti. Cloudflare Workers + D1 (`src/index.js` asosiy, `src/db.js`, `src/matn*.js`, `schema.sql`, `migrations/`).
- Deploy: `npm run deploy` · Test: `node test/run.mjs` (hammasi o'tishi shart) · Manzil: https://ustozim-quiz-bot.nuriddinovx2.workers.dev
- Haqiqiy foydalanuvchilar bor (≈290). Ishlab turgan bot: sinmasligi birinchi o'rinda.
- Admin tili: o'zbek. Javoblar qisqa, aniq, "muhim qarorni birinchi ayt" (Master Project Instruction 45-band).

## 2. Admin qoidalari (aytilgan — takrorlatma)
**Xulq**
1. So'ramasdan yangi feature QO'SHMA. Taklif ber, fikr bildir, asosli tavsiya qil — qaror adminda. (Mavjud xatoni tuzatish va so'ralgan ish bundan mustasno.)
2. Muammo chiqsa yechimni O'ZING top: sababni tahlil qil, tuzat, tekshir. "Nima qilay?" deb qaytarma. Faqat haqiqiy tanlov (admin hal qiladigan qaror) bo'lsa so'ra.
3. Tanqidiy fikrla: admin fikri noto'g'ri/ortiqcha bo'lsa ochiq ayt, variantlarni solishtir, bitta tavsiya ber. Dizayn qarorlari ko'pincha senga topshiriladi ("qoyil qoldiradigan darajada qur").
4. Yolg'on/taxminiy da'vo yo'q: jonli sinalmagan narsani "ishlaydi" dema. Testdan o'tdi ≠ jonli tasdiqlandi — farqini ayt. Noto'g'ri bo'lsang o'zing tan ol (D1 limit ogohlantirishini noto'g'ri o'qiganing kabi).
5. Maxfiy: token/kalitni so'rama, chatga yozdirma, kodga yozma. Prod D1 ga o'zing yozma. Admin tasdig'isiz keng tarqatma (broadcast) yo'q.

**Matn va UI (eng ko'p takrorlangan talab)**
6. HAR foydalanuvchi matnida Telegram formati: `<b>` sarlavha/asosiy, `<blockquote>` izoh/iqtibos, `<i>` ikkilamchi, `<tg-spoiler>` kerakli joyda, mos emoji. Oddiy (formatsiz) matn QOLDIRMA. Yangi matn yozganda ham, tegilgan eski matnda ham tekshir.
7. Matn "tugmani bosing" desa, tugma o'sha xabarning o'zida (inline) bo'lsin. Tugmasiz ko'rsatma ≈ xato.
8. Har ichki ekranda "↩️ Orqaga" (aynan shu yozuv). Faqat Orqaga bo'lib, menyudan chiqib ketmasin. Xabarni joyida yangilash (`ozgartir`) — yangi xabar yaratma.
9. Har matn uz/ru/en (`t(key)` + `matn_format.js`). Foydalanuvchi o'z tilida ko'rsin: savol, xato takrori, e'lon — hammasi.
10. Telefonda sig'sin: tugma matni qisqa; 2×2 yoki to'liq-kenglik qatorlar; menyuni to'ldirib yuborma.
11. Qoida: "amal tugmasi" (qilinadi) → O'rganish; "ko'rinadigan natija" → Profilim/Natijalar. Bir narsa ikki joyda turmasin.
12. Jonli emoji (custom emoji) avtomatik almashadi — noto'g'ri belgi chiqsa emoji'dan keyin `⁠` qo'y (almashtirilmaydi). Yangi emoji ishlatganda paket xaritasida noto'g'ri belgi bo'lishi mumkinligini unutma.
13. Brend: ranglar/uslub bir xil; "Ustozim Nurim" ovozi — samimiy, qisqa, harakatga undaydi (memory: `matn-uslubi`). Yangi o'zbek alifbosi hali QO'LLANMAYDI.
14. Admin ekranlari ham toza: foydalanuvchi ko'radigan ekranda #id, boshqaruv tugmasi, ichki atama chiqmasin; boshqaruv admin bo'limida.

**Mahsulot**
15. Reyting adolatli: savol soni hammada bir xil. Viktorina savollarida "eng uzun variant = to'g'ri" nuqsoni YO'Q bo'lsin (ikki marta takrorlangan).
16. Foydalanuvchiga zarar/spam yo'q: notification sabab bilan; broadcast faqat tasdiqdan keyin.
17. Anonimlik: Hamkorlikda foydalanuvchi ismi chiqmaydi; admin username/ID ni ko'radi.

## 3. Texnik tuzoqlar (o'rganilgan)
- D1 bepul limit: 5M o'qish / 100k yozuv kuniga (05:00 Toshkentda yangilanadi). Yangi funksiyada so'rovlar sonini o'yla; keshla (`tizim` KV jadvali: `db.tizimOqi/tizimYoz`).
- Sxema o'zgartirmaslik uchun ko'p holat `tizim` kalit-qiymatida (masalan `fk:turlar`, `fk:pub`, `emoji:map`, `rk:*` kesh).
- Til: AsyncLocalStorage (`joriyTil`), matnlar: matn.js < matn_yangi.js < matn_format.js (keyingisi ustun). `set()` yordamchisi kalitlarni ortiqcha o'chirgan (p64) — kalitni qavs-hisobi bilan olib tashla yoki git'dan tikla.
- Callback prefikslari: hub:, bk:, lib:, xb:, fk:, fkh/fkd, fikrb, mx:, rk:, em:, adm:, duel:, sv:. Yangi prefiks qo'shsang `handleCallback`da tartibga e'tibor ber (uzun prefiks avval).
- Xatolar banki `qid` (savol matni xeshi) saqlaydi; uz/ru kitob savollari indeks bo'yicha juft (`savolTilda`) — ko'rsatish tili ≠ saqlangan qid, tuzatish asl qid bilan.
- Poll: quiz taymeri `open_period`; tugaganda Telegram xabar bermaydi — bot o'zi sanaydi (cron 30 daq + fon). Cloudflare fon ishi cheklangan.
- Telegram: HTML parse mode (`b,i,u,s,blockquote,code,a,tg-spoiler,tg-emoji`), `entityHtml` UTF-16 offset. `chosen_inline_result` uchun BotFather inline feedback + `/sozla`.
- Test harness: `test/sinov.mjs` (soxta D1 node:sqlite, soxta fetch). Yangi bo'lim testlari `globalThis.fetch = eskiFetch39;` dan OLDIN, o'zgaruvchi nomlari takrorlanmasin (`cbFk` to'qnashuvi bo'lgan) — qo'shishdan oldin `grep` bilan tekshir.
- macOS: `sed -i ''` talab qilinadi; murakkab qirqish uchun Node `.cjs` skript yoz (shell qo'shtirnoq muammosi). Patch skriptini ikki marta ishlatma (dublikat bo'ladi) — natijani `grep -c` bilan tekshir.

## 4. Ish tartibi (har vazifada)
1. Shu faylni va `memory`dagi loyiha fayllarini o'qi. 2. Talabni 1–17 qoidalar bilan solishtir (formatlash, tugma, Orqaga, 3 til). 3. Kodni o'zgartir. 4. `node --check` + `node test/run.mjs` → 0 yiqilgan. Test o'zgarsa, sababini ayt (eski test yangi dizaynga moslanadimi yoki haqiqiy xatomi?). 5. `npm run deploy` → `git commit`. 6. Qisqa o'zbekcha hisobot: nima o'zgardi, nima jonli sinalmagan, qaysi xavf bor. 7. Yangi xato/qoida bo'lsa shu faylga yoz.
- Kod o'zgargach o'zing o'ylab yana foydali takliflar ber (1 ta asosli taklif, ro'yxat emas), lekin QO'SHMA.

## 5. Xatolar va saboqlar jurnali (yangisini ENG TEPAGA qo'sh)
- Kunlik admin hisobotini "yangi funksiya" deb taklif qildim — u allaqachon bor edi (adminHisobotYubor, 21:30, /hisobot). Yangi narsa taklif qilishdan oldin `grep` bilan mavjudligini tekshir.
- Gemini modeli (gemini-2.5-flash) Google tomonidan yopildi → `geminiChaqir` zaxira modellar ro'yxati bilan ishlaydi; model nomini qattiq yozma.
- Admin reytingda qatnashadi (admin qarori) — chiqarib tashlama.
- Jonli emoji paketi 🌐 ni Instagram belgisiga almashtirgan → emoji'dan keyin `⁠`. Dizayn tuzgan har matnda emoji'larning paket xaritasini hisobga ol.
- Rus marafonida xato qilingan savol o'zbek foydalanuvchiga ruscha chiqdi → ko'rsatishda foydalanuvchi tiliga o'gir (`savolTilda`).
- "Bugungi viktorina yakunlandi" matni formatsiz, tugmasiz, faqat o'zbekcha edi → admin qoida 6–7–9 ni qayta aytdi. Yangi/eski matnni tegishdan oldin shu uch qoida bo'yicha tekshir.
- Hamkorlikda har yozuvda #id, Yashirish/O'chirish tugmasi → foydalanuvchi ekrani va admin boshqaruvi ajratildi (qoida 14).
- Xabarlar (taklif/shikoyat) adminga kim yozganini ko'rsatmadi → username/ID/profil havolasi qo'shildi; javob berilmaganlar Xabarlarda, berilganlar Hamkorlikda.
- D1 limit signalini noto'g'ri o'qidim (test simulyatsiya qatorlari) → haqiqiy `wrangler d1 insights` raqamlari bilan tekshir, taxminni fakt qilib aytma.
- `set()` yordamchisi kalitlarni ortiqcha o'chirdi (matn_format.js) → git'dan tikla, qavs-hisobi bilan o'chir.
- Admin formatlangan javob yozsa, entities yo'qolib oddiy matn borardi → `entityHtml` bilan HTML'ga o'gir.
- Duel natijasida g'olib birinchi yozilmadi → g'olib har doim yuqorida.
- Tugma nomlash: "Tuzatildi" → "Tuzatilgan xatolar"; "↩️ Panel/Admin/Ro'yxat" → hammasi "↩️ Orqaga".
- Savollarda "eng uzun variant = to'g'ri" nuqsoni ikki marta takrorlangan.
- Admin takrorlagan: har xabarda Telegram text xususiyatlari (bold/blockquote/italic/spoiler) + emoji. Bu endi 2-qoida darajasidagi majburiyat.

## 6. Ochiq masalalar (jonli sinalmagan / kutilmoqda)
- PDF Kutubxona (3 tilli yuklash) hali jonli sinalmagan. `/soz paket` importeri: admin emoji paket havolasi va skrinshot yuborishini kutadi.
- Admin-only "🛠 Admin" klaviatura tugmasi va "foydalanuvchi ko'rinishi" rejimi: admin tasdig'ini kutmoqda.
- Yo'nalish ekranida 2 ustunli tugmalar: admin roziligini kutmoqda.
- `/emoji` ro'yxatini admin tekshirib, noto'g'ri bog'langan emoji'larni bildirishi kerak.
- Boshqa o'zbekcha matnlarni (viktorina izohlari, e'lonlar) formatlash auditi — to'liq qilinmagan.
- Yangi o'zbek alifbosiga o'tish — qonun kuchga kirgach.

## 7. Bu faylni qanday boyitish
Admin tuzatish yoki takror talab aytsa: (a) bir qatorda 2-bo'limga qoida, (b) 5-bo'limga "nima xato bo'ldi → nima qilinadi" yoz, (c) kerak bo'lsa test qo'sh. Yozmasdan javob berma.

- Duel: natija ikkala tomon tugatgach keladi; "bot natija bermayapti" shikoyati — yaratuvchi testni boshlamagani. Endi: tugatgan tomon raqibga xabar yuboradi, 6 soatdan keyin duel avtomatik yopiladi (duelMuddat), savollar taymerli. Foydalanuvchi shikoyatida avval "qaysi holat kutilyapti" ni tekshir (2026-11-02).
- Duel xabari: «Testni boshlash» tugmasi ulashgandan keyin chiqadi: signal = inline_query (ulashish oynasi), chosen_inline_result ga TAYANMA; Telegram uni har doim yubormaydi (BotFather inline feedback %), yaratuvchi tugmasiz qolgan (2026-11-02, Duel #85).
- Duel eslatmasi («X duelni tugatdi») faqat raqib HALI BOSHLAMAGAN bo'lsa yuboriladi; o'ynayotganga yuborish uni chalg'itadi (2026-11-02).
- Inline karta rasmi: Telegram shaffof PNG'ni shovqinli kulrang qilib ko'rsatdi; endi tekis fon (#282828, qorong'i karta rangi) bilan JPEG. Rasm manzili o'zgarsa kesh aylanib o'tiladi (lumi-duel2.jpg) (2026-11-02).
- Reyting adolati (2026-11-02, Ruxshona 14/15 vs 18/18): qiyin (⭐2 ball) savollar faqat aralash to'plamda (max 18) va Mantiq yo'nalishida (max 20); IT/Liderlik/Diniy/Kino/Ingliz yo'nalishida max 15. Reyting xom ball bo'yicha tartiblanadi (daily.score DESC), shuning uchun 14/15 (93%) 14/18 (78%) dan pastda turadi. Qaror kutilmoqda: foiz bo'yicha tartiblash yoki hamma yo'nalishga bir xil bonus.
- Reyting adolati hal qilindi (2026-11-02): hamma yo'nalishda 15 savol + 3 ta umumiy qiyin (⭐2 ball) = maksimum 18 (config.kunlikToplam). Reyting qatori: «18 ball · ✅ 15/15» (ball va to'g'ri/savol alohida; «18/18» savol deb tushunilardi). db.reyting endi sn/sok qaytaradi.

- /start kirish: STATIK rasm (animatsiya xira ko'rindi va avtoijro o'chiq bo'lsa bosib ochish kerak — ortiqcha, 2026-11-02). Rasm manbasi tools/intro_rasm.py, kesh kaliti intro:fid3. Worker hajmi ~0.8MB gzip / 1MB: katta fayl qo'shishdan oldin `wrangler deploy --dry-run` bilan tekshir.
- Kirish rasmi endi Gemini (gemini-3-pro-image) bilan chizilgan: Lumi + logo reference sifatida berilgan, matnsiz; manba tools/assets/intro_gemini_2.png (1-variant: intro_gemini_1.png). Eski dasturiy variant tools/intro_rasm.py. Kesh kaliti intro:fid4 (2026-11-02).
## Botni to'xtatganlar (2026-11-03)
- `my_chat_member` (private) → `db.setBlocked`; holat o'zgarsagina `ketish_log`ga yoziladi (kim, necha kun, nechta javob, streak). 403 yo'llari ham shu funksiyadan o'tadi.
- Telegramdagi "monthly users" = 30 kunlik faollar, bloklaganlar emas. "Ketdi" deb faqat ketish_log'ga ishoning.
- Admin: 👥 Foydalanuvchilar (`adm:users`, `/users`), kunlik hisobotda 24 soatlik to'xtatganlar ogohlantirishi.
- Migratsiya: `migrations/2026-11-03_ketish_log.sql` (production'ga qo'lda: wrangler d1 execute --remote). Deploydan OLDIN bajarilsin.
- Testlar: 396 (bu bo'limdan oldin 387).

## Botni to'xtatganlar (2026-11-03)
- `my_chat_member` (private) → `db.setBlocked`; holat o'zgarsagina `ketish_log`ga yoziladi (kim, necha kun, nechta javob, streak). 403 yo'llari ham shu funksiyadan o'tadi.
- Telegramdagi "monthly users" = 30 kunlik faollar, bloklaganlar emas. "Ketdi" deb faqat ketish_log'ga ishoning.
- Admin: 👥 Foydalanuvchilar (`adm:users`, `/users`), kunlik hisobotda 24 soatlik to'xtatganlar ogohlantirishi.
- Migratsiya `migrations/2026-11-03_ketish_log.sql` production'ga qo'lda: deploydan OLDIN bajarilsin.
- Testlar: 396 (bu bo'limdan oldin 387).

## Yo'nalish rejimi 70/30 (2026-11-11)
- Muammo: yo'nalish tanlaganlar faqat shu mavzuni olardi; bank kichik (Mantiq 67, Diniy/Kino 60, Ingliz 94) → 5–7 kunda takror. Kunlik oyna 13 ta siljib, 10 tasi ishlatilar, qolgani tushib qolardi.
- Endi: o'z mavzusi (≈7) ketma-ket hovuz bo'ylab, ≈3 ta boshqa mavzudan, 3 ta umumiy qiyin, 2 arab. Jami 15 savol, maks 18 ball (adolat buzilmaydi). Test: 43-blok.
- Haqiqiy yechim — tarkib: Ingliz/Mantiq/Diniy/Kino/Liderlik bankini kamida 200 tagacha o'stirish (telegram-viktorina-generator).

## ⚠️ Ikki nusxa tuzog'i
- Haqiqiy repo: `~/Downloads/dasturlash/projects/Ustozimnurim-EcoSystem/ustozimnurimbot` (remote: Ustozimnurim-EcoSystem/ustozimnurimbot). `~/Downloads/untitled folder/...` — ESKI nusxa (remote ustozim-quiz-bot): u yerdan DEPLOY QILMANG, bot orqaga qaytadi.

## Savol banki kengaytirildi (2026-11-11)
- Bank 908 ta: Ingliz 124 · Mantiq 97 · Diniy 90 · Kino 90 · Liderlik 100 · IT 257 · Arab 150. Yangi partiyalar: har mavzuga muallif agent + mustaqil tekshiruvchi agent (Diniy: faqat keng kelishilgan faktlar, arabcha matn yo'q; Kino: yillar tekshirilgan).
- Format: to'g'ri javob o[0], c:0 (bot aralashtiradi), `e` izoh majburiy; Kino uchun s: m|k; ko'p javobli qiyin savollar — h:true + cs.
- Navbat: Liderlik (100) va Diniy/Kino/Mantiq ni 150+ ga yetkazish.
