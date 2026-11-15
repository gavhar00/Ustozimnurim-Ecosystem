-- Ustozim Nurim viktorina boti — D1 sxemasi
--
-- KV dan ko'chishdagi asosiy g'oya: har bir javob ALOHIDA qator bo'lib yoziladi.
-- KV da javoblar kalit nomiga ko'milgan edi ("a:uid:sana:indeks" → "1"), shuning
-- uchun ulardan hech qanday hisobot chiqarib bo'lmasdi. Endi xatolar banki,
-- har savolning aniqligi va o'qituvchi hisoboti oddiy SQL so'rovga aylanadi.

CREATE TABLE IF NOT EXISTS users (
  uid         TEXT PRIMARY KEY,
  name        TEXT,
  uname       TEXT,
  streak      INTEGER NOT NULL DEFAULT 0,
  last_daily  TEXT,                       -- YYYY-MM-DD (Toshkent)
  days        INTEGER NOT NULL DEFAULT 0, -- nechta kun ishlagan
  seq         INTEGER NOT NULL DEFAULT 0, -- "o'z tezligimda" kursori
  kitob       INTEGER NOT NULL DEFAULT 0, -- tugatilgan oxirgi fasl
  blocked     INTEGER NOT NULL DEFAULT 0, -- botni bloklaganmi
  joined      TEXT    NOT NULL DEFAULT (datetime('now')),
  seen        TEXT                        -- oxirgi faollik
);

-- Har bir javob. Tizimning yagona haqiqat manbai.
CREATE TABLE IF NOT EXISTS answers (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  uid      TEXT    NOT NULL,
  mode     TEXT    NOT NULL,              -- d = kunlik, k = kitob, s = mashq
  day      TEXT,                          -- kunlik rejim uchun
  fasl     INTEGER,                       -- kitob rejimi uchun
  idx      INTEGER NOT NULL,              -- savolning seansdagi tartibi
  qid      TEXT    NOT NULL,              -- savol identifikatori (matn xeshi)
  topic    TEXT,
  correct  INTEGER NOT NULL,              -- 1 = to'g'ri
  skipped  INTEGER NOT NULL DEFAULT 0,    -- vaqt tugab o'tkazilganmi
  at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Yuborilgan, javob kutilayotgan so'rovnoma.
-- Qatorni o'chira olgan tomon savolni oldinga suradi — KV dagi "navbatni ol"
-- mexanizmining aynan o'zi, lekin atomar.
CREATE TABLE IF NOT EXISTS polls (
  poll_id  TEXT PRIMARY KEY,
  uid      TEXT    NOT NULL,
  mode     TEXT    NOT NULL,
  idx      INTEGER NOT NULL,
  fasl     INTEGER,
  chat_id  TEXT    NOT NULL,
  msg_id   INTEGER,
  created  INTEGER NOT NULL               -- unix soniya (tozalash uchun)
);

-- Kunlik viktorina yakuni — reyting shundan quriladi.
CREATE TABLE IF NOT EXISTS daily (
  uid    TEXT    NOT NULL,
  day    TEXT    NOT NULL,
  score  INTEGER NOT NULL,
  total  INTEGER NOT NULL,
  at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, day)
);

-- Kitob marafonida tugatilgan fasllar.
CREATE TABLE IF NOT EXISTS fasl_done (
  uid    TEXT    NOT NULL,
  fasl   INTEGER NOT NULL,
  score  INTEGER NOT NULL,
  total  INTEGER NOT NULL,
  at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, fasl)
);

-- Foydalanuvchi "bu savol noto'g'ri" deb belgilaganlar.
CREATE TABLE IF NOT EXISTS flags (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  uid     TEXT NOT NULL,
  qid     TEXT NOT NULL,
  at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ——— indekslar ———
-- Kunlik reyting: WHERE day = ? ORDER BY score DESC
CREATE INDEX IF NOT EXISTS idx_daily_day      ON daily(day, score DESC);
-- Xatolar banki: WHERE uid = ? AND correct = 0
CREATE INDEX IF NOT EXISTS idx_ans_uid_wrong  ON answers(uid, correct);
-- Savol sifati: GROUP BY qid
CREATE INDEX IF NOT EXISTS idx_ans_qid        ON answers(qid);
-- Kunlik kesim va mavzu tahlili
CREATE INDEX IF NOT EXISTS idx_ans_day        ON answers(day);
CREATE INDEX IF NOT EXISTS idx_ans_uid_day    ON answers(uid, day);
-- Eski so'rovnomalarni tozalash
CREATE INDEX IF NOT EXISTS idx_polls_created  ON polls(created);
-- Nofaol foydalanuvchilarni topish
CREATE INDEX IF NOT EXISTS idx_users_seen     ON users(seen);

-- ——— KV dan ko'chirish izi ———
-- KV da faqat yig'indi saqlangan edi ("195 javob, 140 to'g'ri"), javoblarning
-- o'zi emas. Ularni answers jadvaliga sun'iy qator qilib yozish — hisobotni
-- yolg'on ma'lumot bilan to'ldirish bo'lardi. Shuning uchun eski yig'indi
-- alohida ustunda turadi va faqat umumiy natijaga qo'shiladi.
ALTER TABLE users ADD COLUMN legacy_answered INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN legacy_correct  INTEGER NOT NULL DEFAULT 0;

-- Xatolar bankini qurish uchun: so'rovnoma qaysi SAVOLGA tegishli ekanini
-- bilish kerak. Kunlik va kitob rejimida savolni (rejim, indeks) juftligidan
-- tiklash mumkin edi, chunki tanlov deterministik. Takrorlash rejimida esa
-- ro'yxat har javobdan keyin qisqaradi, shuning uchun indeks ishonchsiz —
-- savol identifikatori to'g'ridan-to'g'ri yozib qo'yiladi.
ALTER TABLE polls ADD COLUMN qid TEXT;

-- Kunlik viktorina yo'nalishi (NULL = aralash). Savol SONIGA ta'sir qilmaydi,
-- shuning uchun reyting taqqoslanadigan bo'lib qoladi.
ALTER TABLE users ADD COLUMN yonalish TEXT;

-- Rus kitob marafoni — mustaqil bosqich.
-- Nega alohida ustun: rus tilida o'qiydigan odam boshqa odam. O'zbekcha
-- 7-faslda turgan foydalanuvchi rus bo'limiga kirganda 7-fasldan
-- boshlanishi mantiqsiz bo'lardi.
ALTER TABLE users ADD COLUMN kitob_ru INTEGER NOT NULL DEFAULT 0;

-- Xatolar banki uchun. GROUP BY qid ni indeks tartibida bajarishga imkon
-- beradi: aks holda SQLite vaqtinchalik B-tree quradi va har bir satrni
-- qayta o'qiydi. D1 da bu to'g'ridan-to'g'ri pul/limit masalasi.
CREATE INDEX IF NOT EXISTS idx_ans_uid_qid ON answers(uid, qid);


-- ═══════════════════════════════════════════════════════════════════
-- AGREGATLAR — hisoblash o'qishda emas, yozishda bajariladi
-- ═══════════════════════════════════════════════════════════════════

-- Umumiy kalit-qiymat saqlagich.
--
-- NEGA ALOHIDA JADVAL: ilgari shu maqsadda `flags` ishlatishga urinilgan
-- edi, lekin `flags` da (uid, qid) ustunlari bor — k/v emas. So'rov
-- jimgina yiqilar, xato esa try/catch ichida yutilardi. Natijada
-- "kuniga bir marta ogohlantir" qoidasi hech qachon ishlamasdi.
CREATE TABLE IF NOT EXISTS tizim (
  k   TEXT PRIMARY KEY,
  v   TEXT,
  at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Foydalanuvchi bo'yicha yig'indi.
--
-- topic = ''  → umumiy jami (barcha mavzular bo'yicha)
-- topic = 'IT' → faqat shu mavzu
--
-- Bitta so'rov bilan ikkalasi ham olinadi: WHERE uid = ?.
-- Bu "Natijalarim" sahifasining butun narxi — ~6 satr, foydalanuvchining
-- tarixi qanchalik uzun bo'lishidan qat'i nazar.
CREATE TABLE IF NOT EXISTS user_stat (
  uid    TEXT    NOT NULL,
  topic  TEXT    NOT NULL,            -- '' = umumiy
  a      INTEGER NOT NULL DEFAULT 0,  -- javob soni
  c      INTEGER NOT NULL DEFAULT 0,  -- to'g'ri javob soni
  PRIMARY KEY (uid, topic)
);

-- Xatolar banki.
--
-- NEGA ALOHIDA JADVAL: ilgari bu ro'yxat `answers` dan GROUP BY bilan
-- olinardi — ya'ni foydalanuvchining butun tarixi har safar qayta
-- skanerlanardi. Endi holat bevosita saqlanadi.
--
-- MA'NO O'ZGARIShI (ataylab): faslni qayta boshlash `answers` dagi
-- javoblarni o'chiradi, lekin xatolar bankidagi yozuvni O'ChIRMAYDI.
-- Ilgari qayta boshlash xatolar tarixini ham yo'q qilardi — ya'ni
-- "qiynalgan savollaringiz" ro'yxati tozalanib ketardi. Pedagogik
-- jihatdan bu noto'g'ri: xato qilgan savol esda qolishi kerak.
--
-- ochiq = 1 → hali to'g'ri javob berilmagan
-- ochiq = 0 → keyin to'g'ri javob berilgan, ro'yxatdan chiqqan
CREATE TABLE IF NOT EXISTS mistake (
  uid     TEXT    NOT NULL,
  qid     TEXT    NOT NULL,
  topic   TEXT,
  urinish INTEGER NOT NULL DEFAULT 0,
  ochiq   INTEGER NOT NULL DEFAULT 1,
  oxirgi  TEXT    NOT NULL,
  PRIMARY KEY (uid, qid)
);

-- Ro'yxat aynan shu tartibda so'raladi: ochiq xatolar, eng eskisi
-- birinchi. Indeks so'rovni to'liq qoplaydi — saralash uchun
-- vaqtinchalik B-tree qurilmaydi.
CREATE INDEX IF NOT EXISTS idx_mistake_ochiq ON mistake(uid, ochiq, oxirgi);


-- ═══════════════════════════════════════════════════════════════════
-- YUTUQLAR va ATRIBUSIYA
-- ═══════════════════════════════════════════════════════════════════

-- Yutuq — BO'LIB O'TGAN VOQEA, hozirgi holat emas.
--
-- Uni har safar hisoblab chiqarish mumkin edi (streak >= 7 → «hafta»),
-- lekin shunda zanjir uzilganda yutuq ham yo'qolardi. Odam bir hafta
-- ketma-ket ishlagani — fakt, va uni keyingi bir kunlik tanaffus
-- bekor qila olmaydi. Saqlanmagan yutuq mukofot emas, tahdid bo'ladi.
CREATE TABLE IF NOT EXISTS yutuq (
  uid  TEXT NOT NULL,
  kod  TEXT NOT NULL,
  at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, kod)
);

CREATE INDEX IF NOT EXISTS idx_yutuq_uid ON yutuq(uid, at);

-- Kim taklif qilgan va qaysi manbadan kelgan.
-- Bu ustunlarsiz «qaysi kanal ishlayapti?» degan savolga faqat taxmin
-- bilan javob berish mumkin — taxmin esa qaror uchun yaroqsiz.
ALTER TABLE users ADD COLUMN kelgan TEXT;
ALTER TABLE users ADD COLUMN manba  TEXT;


-- Kunlik 5 tajribasi: javobdan keyingi 👍/👎 va «yana 5 ta» bosilishi.
CREATE TABLE IF NOT EXISTS fikr (
  uid  TEXT NOT NULL,
  kun  TEXT NOT NULL,
  baho INTEGER,
  yana INTEGER NOT NULL DEFAULT 0,
  at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, kun)
);
CREATE INDEX IF NOT EXISTS idx_fikr_kun ON fikr(kun);


-- Foydalanuvchi → admin fikr-mulohazalari. admin_msg — adminga yuborilgan xabar
-- identifikatori: admin shu xabarga javob qilsa, javob foydalanuvchiga boradi.
CREATE TABLE IF NOT EXISTS murojaat (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  uid       TEXT NOT NULL,
  ism       TEXT,
  uname     TEXT,
  matn      TEXT NOT NULL,
  admin_msg INTEGER,
  javob     TEXT,
  at        TEXT NOT NULL DEFAULT (datetime('now')),
  javob_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_murojaat_uid ON murojaat(uid, at);
CREATE INDEX IF NOT EXISTS idx_murojaat_msg ON murojaat(admin_msg);


-- Premium obuna. tugaydi — UTC, 'YYYY-MM-DD HH:MM:SS'. Faol: tugaydi > datetime('now').
-- manba: admin | stars | qolda (to'lov usuli keyin qo'shiladi, ustun tayyor).
CREATE TABLE IF NOT EXISTS premium (
  uid       TEXT PRIMARY KEY,
  tarif     TEXT NOT NULL DEFAULT 'premium',
  boshlandi TEXT NOT NULL DEFAULT (datetime('now')),
  tugaydi   TEXT NOT NULL,
  manba     TEXT NOT NULL DEFAULT 'admin',
  izoh      TEXT
);
CREATE INDEX IF NOT EXISTS idx_premium_tugaydi ON premium(tugaydi);


-- Arabcha savollar uchun rasmlar (JPEG, base64). Kalit — src/rasm.js dagi rasmTuri().kalit.
-- Bot rasmni birinchi marta Telegram'ga yuklaydi va file_id ni tizim jadvalida saqlaydi.
CREATE TABLE IF NOT EXISTS rasm (
  k TEXT PRIMARY KEY,
  b TEXT NOT NULL
);

-- Interfeys tili: uz | ru | en (NULL = uz)
ALTER TABLE users ADD COLUMN lang TEXT;

-- «Super miya» nishoni muddati (UTC), NULL = yo'q
ALTER TABLE users ADD COLUMN super_until TEXT;

-- «Hero»: qiyin savollar hammasi to'g'ri (nishon muddati, oxirgi kun, zanjir, jami)
ALTER TABLE users ADD COLUMN hero_until TEXT;
ALTER TABLE users ADD COLUMN hero_last TEXT;
ALTER TABLE users ADD COLUMN hero_n INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN hero_jami INTEGER NOT NULL DEFAULT 0;

-- "Siz aytdingiz, biz qildik": ochiq 0 = oddiy, 1 = e'longa tayyor, 2 = e'lon qilingan.
-- ish: admin yozgan bitta gap (nima qilindi). E'londa ism ko'rsatilmaydi.
ALTER TABLE murojaat ADD COLUMN ochiq INTEGER NOT NULL DEFAULT 0;
ALTER TABLE murojaat ADD COLUMN ish TEXT;

-- Do'st bilan duel: ikki kishi bir xil 5 savolga javob beradi.
-- a/b — ikki ishtirokchi (b — do'st havola orqali kirgach to'ladi).
-- *_ok — to'g'ri javoblar, *_ms — butun duelga ketgan vaqt, *_done — tugatganmi.
-- bitdi — natija ikkala tomonga yuborilgani (takror yuborilmasligi uchun).
CREATE TABLE IF NOT EXISTS duel (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  a        TEXT NOT NULL,
  b        TEXT,
  at       TEXT NOT NULL DEFAULT (datetime('now')),
  a_start  INTEGER, a_ok INTEGER NOT NULL DEFAULT 0, a_ms INTEGER, a_done INTEGER NOT NULL DEFAULT 0,
  b_start  INTEGER, b_ok INTEGER NOT NULL DEFAULT 0, b_ms INTEGER, b_done INTEGER NOT NULL DEFAULT 0,
  bitdi    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_duel_a ON duel(a, at);

-- Saqlangan savollar (🔖). Bir foydalanuvchi bir savolni bir marta saqlaydi.
CREATE TABLE IF NOT EXISTS saqlangan (
  uid  TEXT NOT NULL,
  qid  TEXT NOT NULL,
  at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, qid)
);

-- kun = ro'yxatdan necha kun o'tgan, javob = shu paytgacha nechta savolga javob bergan.
CREATE TABLE IF NOT EXISTS ketish_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  uid    TEXT NOT NULL,
  holat  TEXT NOT NULL,                      -- ketdi | qaytdi
  at     TEXT NOT NULL DEFAULT (datetime('now')),
  kun    INTEGER,
  javob  INTEGER,
  streak INTEGER
);
CREATE INDEX IF NOT EXISTS idx_ketish_at ON ketish_log(at);
