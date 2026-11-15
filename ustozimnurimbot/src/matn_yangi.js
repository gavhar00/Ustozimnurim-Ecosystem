/**
 * COPYWRITING QAYTA YOZUVI (2026-10-22) — barcha ko'rinadigan matnlarning yangi muharriri.
 *
 * Tamoyillar:
 *  1. Aniq va'da: «15 ta savol · ~6 daqiqa» — noaniqlik tugmani bosishga to'sqinlik qiladi.
 *  2. Harakatga undovchi fe'l: «Boshlash» emas, «🚀 Boshlash» + nima kutilishi.
 *  3. Xatoni jazo emas, jarayon deb ko'rsatamiz («adashdingiz» + «qaytadi — shunda eslab qolasiz»).
 *  4. Musobaqa va ijtimoiy dalil: kechki reyting — chetda qolmaslik istagi.
 *  5. Qisqa jumla, bitta fikr, bitta keyingi qadam. Bo'sh maqtov yo'q.
 *
 * Bu fayl asosiy katalogni (matn.js, matn_en.js) kalit bo'yicha USTIGA yozadi.
 */
export const MATN_YANGI = {
  // ═════ tugmalar
  "tugma.bugun":   { uz: "🧠 Viktorina savollari", ru: "🧠 Вопросы викторины", en: "🧠 Quiz questions" },

  // ═════ bugungi mashg'ulot
  "bugun.sarlavha": { uz: "🧠 <b>Viktorina savollari</b>", ru: "🧠 <b>Вопросы викторины</b>", en: "🧠 <b>Quiz questions</b>" },
  "bugun.kunlik": {
    uz: "🧠 <b>Bugungi viktorina tayyor!</b>\n\n" +
        "<b>{soni} ta savol</b> · taxminan <b>{daqiqa} daqiqa</b>.\n" +
        "Kichik tanaffus qiling va bilimingizni charxlang.\n\n" +
        "Kechqurun reytingda o'z o'rningizni ko'rasiz. 🏆",
    ru: "🧠 <b>Викторина на сегодня готова!</b>\n\n" +
        "<b>{soni}</b> вопросов · примерно <b>{daqiqa} мин</b>.\n" +
        "Сделайте небольшой перерыв и прокачайте знания.\n\n" +
        "Вечером увидите своё место в рейтинге. 🏆",
    en: "🧠 <b>Today's quiz is ready!</b>\n\n" +
        "<b>{soni} questions</b> · about <b>{daqiqa} min</b>.\n" +
        "Take a short break and sharpen your mind.\n\n" +
        "See where you rank on tonight's leaderboard. 🏆",
  },
  "bugun.takror": {
    uz: "✅ <b>Bugungi viktorinani tugatdingiz — barakalla!</b>\n\n" +
        "Endi eng foydali qadam: <b>{soni} ta</b> savolning qaytish vaqti keldi. " +
        "Eslay olsangiz — bilim uzoq muddatga o'rnashadi. 🔁",
    ru: "✅ <b>Викторина дня пройдена — отлично!</b>\n\n" +
        "Теперь самый полезный шаг: пора вернуться к <b>{soni}</b> вопросам. " +
        "Вспомните их — и знание закрепится надолго. 🔁",
    en: "✅ <b>Today's quiz is done — well played!</b>\n\n" +
        "Now the most useful step: <b>{soni}</b> questions are due for review. " +
        "Recall them and the knowledge sticks. 🔁",
  },
  "bugun.marafon": {
    uz: "👏 Viktorina ham, takrorlash ham tayyor.\n\n" +
        "Marafonda <b>{fasl}-bosqich</b> sizni kutyapti: <b>{soni} ta</b> savol.",
    ru: "👏 Викторина и повторение готовы.\n\n" +
        "В марафоне вас ждёт <b>этап {fasl}</b>: <b>{soni}</b> вопросов.",
    en: "👏 Quiz and review are both done.\n\n" +
        "<b>Stage {fasl}</b> of the marathon is waiting: <b>{soni}</b> questions.",
  },
  "bugun.hammasi": {
    uz: "🎉 <b>Bugun hammasini bajardingiz!</b>\n\n" +
        "✅ Viktorina\n✅ Takrorlash\n✅ Marafon\n\n" +
        "Ertaga yangi savollar bilan kutamiz. Hoziroq davom etgingiz kelsa — «{mashq}» ni tanlang.",
    ru: "🎉 <b>Сегодня вы прошли всё!</b>\n\n" +
        "✅ Викторина\n✅ Повторение\n✅ Марафон\n\n" +
        "Завтра ждём с новыми вопросами. Хотите продолжить сейчас — выберите «{mashq}».",
    en: "🎉 <b>You've done everything today!</b>\n\n" +
        "✅ Quiz\n✅ Review\n✅ Marathon\n\n" +
        "New questions tomorrow. Want to keep going now? Pick “{mashq}”.",
  },
  "bugun.boshla":   { uz: "🚀 Boshlash", ru: "🚀 Начать", en: "🚀 Start" },
  "bugun.keyinroq": { uz: "Keyinroq", ru: "Позже", en: "Later" },

  // ═════ tanishuv
  "start.salom": {
    uz: "👋 <b>Salom, {ism}!</b>\n\n" +
        "Bu — <b>Ustozim Nurim</b> viktorina boti.\n\n" +
        "Bu yerda test shunchaki baho emas: har javobdan keyin <b>izoh</b> olasiz, " +
        "adashgan savolingiz esa bir necha kundan keyin <b>qaytib keladi</b> — toki yodingizda qolguncha.\n\n" +
        "Birinchi savol sizni kutyapti. 👇",
    ru: "👋 <b>Здравствуйте, {ism}!</b>\n\n" +
        "Это бот-викторина <b>Ustozim Nurim</b>.\n\n" +
        "Здесь тест — не просто оценка: после каждого ответа вы получаете <b>пояснение</b>, " +
        "а вопрос, в котором ошиблись, <b>вернётся</b> через несколько дней — пока не закрепится.\n\n" +
        "Первый вопрос уже ждёт. 👇",
    en: "👋 <b>Hello, {ism}!</b>\n\n" +
        "This is the <b>Ustozim Nurim</b> quiz bot.\n\n" +
        "Here a test isn't just a grade: after each answer you get an <b>explanation</b>, " +
        "and a question you missed <b>comes back</b> a few days later — until it sticks.\n\n" +
        "Your first question is waiting. 👇",
  },
  "start.qaytdi": {
    uz: "👋 <b>Xush kelibsiz, {ism}!</b>\n\n" +
        "Sizni <b>{kun}</b> kundan beri kutdik. Zanjirni qayta boshlash uchun bitta viktorina yetarli — davom etamizmi?",
    ru: "👋 <b>С возвращением, {ism}!</b>\n\n" +
        "Мы ждали вас <b>{kun}</b> дн. Чтобы начать цепочку заново, хватит одной викторины — продолжим?",
    en: "👋 <b>Welcome back, {ism}!</b>\n\n" +
        "We've missed you for <b>{kun}</b> days. One quiz is enough to restart your streak — shall we?",
  },

  // ═════ kunlik yakun
  "kunlik.yakun": {
    uz: "🎯 <b>Bugungi viktorina yakunlandi</b>\n\nNatija: <b>{ball} ball</b> · maksimum {jami} ({foiz}%)\n<code>{chiziq}</code>\n{ketma}\n{baho}",
    ru: "🎯 <b>Викторина дня завершена</b>\n\nРезультат: <b>{ball} балл.</b> · максимум {jami} ({foiz}%)\n<code>{chiziq}</code>\n{ketma}\n{baho}",
    en: "🎯 <b>Today's quiz is complete</b>\n\nScore: <b>{ball} pts</b> · max {jami} ({foiz}%)\n<code>{chiziq}</code>\n{ketma}\n{baho}",
  },
  "kunlik.xatolar": {
    uz: "\n\n<b>{soni} ta</b> savolda adashdingiz — bu normal. Ular «Xatolarim»ga tushdi va bir necha kundan keyin qaytadi: aynan shunda bilim mustahkamlanadi.",
    ru: "\n\n🔁 Вы ошиблись в <b>{soni}</b> вопросах — это нормально. Они попали в «Мои ошибки» и вернутся через несколько дней: именно так знание закрепляется.",
    en: "\n\n🔁 You missed <b>{soni}</b> questions — that's normal. They went to “My mistakes” and return in a few days: that's exactly how knowledge sticks.",
  },
  "kunlik.toliq": {
    uz: "\n\n✨ Bitta ham xato yo'q! Bu omad emas — tayyorgarlik natijasi.",
    ru: "\n\n✨ Ни одной ошибки! Это не удача, а результат подготовки.",
    en: "\n\n✨ Not a single mistake! That's not luck — that's preparation.",
  },
  "kunlik.reyting": {
    uz: "\n\n<i>🏆 Reyting soat 22:00 da guruhda e'lon qilinadi — o'rningizni kuzating.</i>",
    ru: "\n\n<i>🏆 Рейтинг выйдет в группе в 22:00 — следите за своим местом.</i>",
    en: "\n\n<i>🏆 The leaderboard goes live in the group at 22:00 — watch your rank.</i>",
  },

  // ═════ xatolarim (takrorlash)
  "takror.izoh": {
    uz: "Adashgan savolingiz shu yerga tushadi va <b>1 → 2 → 4 → 7 → 14</b> kunda qaytadi. Har safar eslaganingizda xotira kuchayadi.",
    ru: "Вопрос, в котором вы ошиблись, попадает сюда и возвращается через <b>1 → 2 → 4 → 7 → 14</b> дней. Каждое удачное припоминание укрепляет память.",
    en: "A question you missed lands here and returns after <b>1 → 2 → 4 → 7 → 14</b> days. Every successful recall strengthens memory.",
  },
  "takror.bosh": {
    uz: "🎉 <b>Hamma xatoni tuzatdingiz!</b>\n\nYangi savolda adashsangiz, u shu yerda paydo bo'ladi.",
    ru: "🎉 <b>Вы исправили все ошибки!</b>\n\nЕсли ошибётесь в новом вопросе — он появится здесь.",
    en: "🎉 <b>You've fixed every mistake!</b>\n\nIf you miss a new question, it will show up here.",
  },
  "takror.yangi": {
    uz: "Bu yerda adashgan savollaringiz saqlanadi va <b>1 → 2 → 4 → 7 → 14</b> kunda qaytadi.\n\nHozircha bo'sh — «{kunlik}» yoki «{marafon}» dan boshlang.",
    ru: "Здесь хранятся вопросы, в которых вы ошиблись; они возвращаются через <b>1 → 2 → 4 → 7 → 14</b> дней.\n\nПока пусто — начните с «{kunlik}» или «{marafon}».",
    en: "Questions you miss are kept here and come back after <b>1 → 2 → 4 → 7 → 14</b> days.\n\nIt's empty for now — start with “{kunlik}” or “{marafon}”.",
  },
  "takror.kutish": { uz: "⏰ Hali vaqti kelmagan", ru: "⏰ Время ещё не пришло", en: "⏰ None are due yet" },
  "takror.boshla": { uz: "🚀 Takrorlashni boshlash", ru: "🚀 Начать повторение", en: "🚀 Start review" },

  // ═════ sozlamalar
  "sozlama.savol": { uz: "Qaysi birini sozlaymiz?", ru: "Что настроим?", en: "What shall we adjust?" },

  // ═════ fikr
  "fikr.rahmat": {
    uz: "Rahmat! 🙌 Fikringiz savollarni yaxshilaydi.",
    ru: "Спасибо! 🙌 Ваш отзыв делает вопросы лучше.",
    en: "Thanks! 🙌 Your feedback makes the questions better.",
  },

  // ═════ yutuqlar
  "yutuq.yangi": {
    uz: "🏅 <b>Yangi yutuq!</b>\n\n{emoji} <b>{nom}</b>\n{izoh}",
    ru: "🏅 <b>Новое достижение!</b>\n\n{emoji} <b>{nom}</b>\n{izoh}",
    en: "🏅 <b>New achievement!</b>\n\n{emoji} <b>{nom}</b>\n{izoh}",
  },
  "yutuq.bosh": {
    uz: "Hali yutuq yo'q — birinchisi bitta savol narida. 🌱",
    ru: "Достижений пока нет — первое всего в одном вопросе. 🌱",
    en: "No achievements yet — the first is just one question away. 🌱",
  },

  // ═════ savolda xato
  "xabar.tanla": {
    uz: "🚩 <b>Qaysi savolda xato bor?</b>\n\nSavol, variantlar yoki izohdagi xatoni belgilang — har bir belgi ko'rib chiqiladi.",
    ru: "🚩 <b>В каком вопросе ошибка?</b>\n\nОтметьте ошибку в вопросе, вариантах или пояснении — каждая отметка проверяется.",
    en: "🚩 <b>Which question has an error?</b>\n\nMark a mistake in the question, options or explanation — every report is reviewed.",
  },
  "xabar.rahmat": {
    uz: "✅ Belgilandi. Rahmat — baza siz tufayli yaxshilanadi.",
    ru: "✅ Отмечено. Спасибо — база становится лучше благодаря вам.",
    en: "✅ Reported. Thank you — the question bank improves because of you.",
  },

  // ═════ taklif
  "taklif.izoh": {
    uz: "Quyidagi xabarni do'stingizga yuboring. U shu havola orqali kirsa, taklif sizga yoziladi.",
    ru: "Отправьте это сообщение другу. Если он перейдёт по ссылке, приглашение засчитается вам.",
    en: "Send the message below to a friend. If they join through the link, the invitation counts for you.",
  },
  "taklif.matn": {
    uz: "📚 <b>Ustozim Nurim</b> — kunlik bilim viktorinasi.\n\nHar kuni qisqa test, har javobdan keyin izoh. Adashgan savol bir necha kundan keyin qaytadi — toki yodda qolguncha.\n\nBirga sinab ko'ramizmi? 👇\n{havola}",
    ru: "📚 <b>Ustozim Nurim</b> — ежедневная викторина знаний.\n\nКаждый день короткий тест и пояснение после каждого ответа. Вопрос с ошибкой вернётся через несколько дней — пока не закрепится.\n\nПопробуем вместе? 👇\n{havola}",
    en: "📚 <b>Ustozim Nurim</b> — a daily knowledge quiz.\n\nA short test every day and an explanation after every answer. A missed question returns a few days later — until it sticks.\n\nShall we try it together? 👇\n{havola}",
  },

  // ═════ nosozliklar
  "xato.dastur": {
    uz: "⚠️ <b>Nimadir xato ketdi</b>\n\nSo'rovni bajara olmadim. Adminga xabar berildi — tez orada tuzatamiz. Shu orada boshqa bo'limlardan foydalanishingiz mumkin.",
    ru: "⚠️ <b>Что-то пошло не так</b>\n\nНе удалось выполнить запрос. Администратор уведомлён — скоро исправим. Пока можно пользоваться другими разделами.",
    en: "⚠️ <b>Something went wrong</b>\n\nI couldn't complete that. The admin has been notified — we'll fix it soon. Meanwhile, other sections still work.",
  },

  // ═════ yangi kalitlar (index.js dagi qattiq yozilgan matnlar)
  "yordam.matn": {
    uz: "ℹ️ <b>Bot qanday ishlaydi</b>\n\n" +
        "Test bu yerda maqsad emas, vosita. Sikl shunday:\n" +
        "<b>javob → izoh → xato qaytadi → eslaysiz → o'zlashtirasiz</b>\n\n" +
        "<b>{kunlik}</b>\n" +
        "Har kuni 20:00 da yangi, hamma uchun bir xil. Kuniga bir marta; natija reytingga tushadi. Qiyin savol — ikki baravar ball.\n\n" +
        "<b>{marafon}</b>\n" +
        "Kitob bo'yicha {fasl} fasl. Keyingisiga 90% bilan o'tasiz.\n\n" +
        "<b>{arab}</b>\n" +
        "Harflar rasm bilan. Keyingi blok 100% dan so'ng ochiladi.\n\n" +
        "<b>{takror}</b>\n" +
        "Eng foydali bo'lim: adashgan savol 1, 2, 4, 7 va 14 kundan keyin qaytadi — shunda esda qoladi.\n\n" +
        "<b>{natija}</b>\n" +
        "Ballingiz, aniqligingiz va qaysi mavzuda oqsayotganingiz.\n\n" +
        "<b>Bonuslar</b>\n" +
        "🔥 Ketma-ket kunlar — har kun zanjir uzayadi, kun o'tsa noldan boshlanadi.\n" +
        "🧠 Super miya — kunning eng kuchli beshligi.\n" +
        "🦸 Hero — hamma qiyin savol to'g'ri.\n" +
        "🥇 Kun g'olibi — 1 kunlik 💎 Premium.\n\n" +
        "Boshlash uchun pastdagi «{kunlik}» tugmasini bosing.",
    ru: "ℹ️ <b>Как работает бот</b>\n\n" +
        "Тест здесь — не цель, а инструмент. Цикл такой:\n" +
        "<b>ответ → пояснение → ошибка возвращается → вспоминаете → усваиваете</b>\n\n" +
        "<b>{kunlik}</b>\n" +
        "Новый каждый день в 20:00, одинаковый для всех. Раз в день; результат попадает в рейтинг. Сложный вопрос — двойные баллы.\n\n" +
        "<b>{marafon}</b>\n" +
        "{fasl} глав по книге. К следующей — с 90%.\n\n" +
        "<b>{arab}</b>\n" +
        "Буквы с картинками. Следующий блок открывается после 100%.\n\n" +
        "<b>{takror}</b>\n" +
        "Самый полезный раздел: ошибочный вопрос вернётся через 1, 2, 4, 7 и 14 дней — так он запоминается.\n\n" +
        "<b>{natija}</b>\n" +
        "Ваши баллы, точность и темы, где есть пробелы.\n\n" +
        "<b>Бонусы</b>\n" +
        "🔥 Дни подряд — цепочка растёт каждый день, пропуск обнуляет её.\n" +
        "🧠 Супер мозг — пятёрка лучших дня.\n" +
        "🦸 Герой — все сложные вопросы верно.\n" +
        "🥇 Победитель дня — 1 день 💎 Премиума.\n\n" +
        "Чтобы начать, нажмите «{kunlik}» внизу.",
    en: "ℹ️ <b>How the bot works</b>\n\n" +
        "A test here is a tool, not the goal. The loop:\n" +
        "<b>answer → explanation → a miss comes back → you recall it → it sticks</b>\n\n" +
        "<b>{kunlik}</b>\n" +
        "New every day at 20:00, the same for everyone. Once a day; it counts for the leaderboard. Hard questions score double.\n\n" +
        "<b>{marafon}</b>\n" +
        "{fasl} chapters of the book. Unlock the next with 90%.\n\n" +
        "<b>{arab}</b>\n" +
        "Letters with pictures. The next block opens at 100%.\n\n" +
        "<b>{takror}</b>\n" +
        "The most useful section: a missed question returns after 1, 2, 4, 7 and 14 days — that's how it sticks.\n\n" +
        "<b>{natija}</b>\n" +
        "Your score, accuracy and the topics you're shaky on.\n\n" +
        "<b>Bonuses</b>\n" +
        "🔥 Streak — the chain grows daily, a missed day resets it.\n" +
        "🧠 Super Brain — the day's top five.\n" +
        "🦸 Hero — every hard question right.\n" +
        "🥇 Day's winner — 1 day of 💎 Premium.\n\n" +
        "To start, tap “{kunlik}” below.",
  },
  "eslatma.matn": {
    uz: "⏰ <b>Bugungi viktorina sizni kutyapti</b>\n\n{streak}Bor-yo'g'i bir necha daqiqa — va kechki reytingda o'z o'rningizni olasiz. 👇",
    ru: "⏰ <b>Викторина дня ждёт вас</b>\n\n{streak}Всего несколько минут — и вы займёте место в вечернем рейтинге. 👇",
    en: "⏰ <b>Today's quiz is waiting</b>\n\n{streak}Just a few minutes — and you're on tonight's leaderboard. 👇",
  },
  "eslatma.zanjir": {
    uz: "{{tezkor}}\n🔥 <b>{n} kunlik zanjiringiz</b> uzilib qolmasin!\n\n",
    ru: "🔥 Не прерывайте цепочку из <b>{n}</b> дней!\n\n",
    en: "🔥 Don't break your <b>{n}-day</b> streak!\n\n",
  },
  "statistika.bosh": {
    uz: "Hali birorta savolga javob bermagansiz. Birinchi qadam — bitta viktorina. «{kunlik}» ni bosing! 🚀",
    ru: "Вы ещё не ответили ни на один вопрос. Первый шаг — одна викторина. Нажмите «{kunlik}»! 🚀",
    en: "You haven't answered any questions yet. The first step is one quiz — tap “{kunlik}”! 🚀",
  },
  "baho.100": { uz: "🏆 Mukammal! Hammasi to'g'ri.", ru: "🏆 Безупречно! Всё верно.", en: "🏆 Flawless! Everything correct." },
  "baho.80":  { uz: "🌟 Ajoyib natija! Shu tempda davom eting.", ru: "🌟 Отличный результат! Так держать.", en: "🌟 Great result! Keep this pace." },
  "baho.60":  { uz: "👍 Yaxshi! Yana bir oz mashq — va yuqoriga chiqasiz.", ru: "👍 Хорошо! Ещё немного практики — и вы наверху.", en: "👍 Good! A little more practice and you're up there." },
  "baho.40":  { uz: "💪 Yaxshi boshlanish. Har kun ishlasangiz, natija tez o'sadi.", ru: "💪 Хорошее начало. Занимайтесь каждый день — результат быстро растёт.", en: "💪 A solid start. Practice daily and the score climbs fast." },
  "baho.0":   { uz: "📚 Bugun qiyinroq bo'ldi — lekin urinish muhim. Xatolar ertaga qaytadi, shunda yengil bo'ladi.", ru: "📚 Сегодня было сложнее — но главное, вы попробовали. Ошибки вернутся завтра, и станет легче.", en: "📚 Tougher today — but trying is what counts. The misses return tomorrow and will feel easier." },

  // ═════ ketma-ket 3 ta o'tkazib yuborilsa
  "otkazish.toxtadi": {
    uz: "⏸ <b>Viktorina to'xtatildi</b>\n\n3 ta savol ketma-ket javobsiz qoldi. Tayyor bo'lganingizda davom eting — qolgan savollar saqlanadi.",
    ru: "⏸ <b>Викторина приостановлена</b>\n\n3 вопроса подряд остались без ответа. Продолжите, когда будете готовы — остальные вопросы сохранены.",
    en: "⏸ <b>Quiz paused</b>\n\n3 questions in a row went unanswered. Continue when you're ready — your remaining questions are saved.",
  },
  "otkazish.davom": { uz: "▶️ Davom etish", ru: "▶️ Продолжить", en: "▶️ Continue" },

  // ═════ Xatolarim ekrani
  "takror.jami": {
    uz: "Takrorni <b>{soni} ta</b> savol kutyapti.",
    ru: "Повторения ждут <b>{soni}</b> вопросов.",
    en: "<b>{soni}</b> questions are waiting for review.",
  },
  "takror.tayyor": {
    uz: "🔥 <b>{soni} tasi</b> aynan hozir qaytishga tayyor — takrorlash uchun eng yaxshi payt shu.",
    ru: "🔥 <b>{soni}</b> готовы вернуться прямо сейчас — лучшее время для повторения.",
    en: "🔥 <b>{soni}</b> are due right now — the best moment to review.",
  },
  "takror.kutish": {
    uz: "⏳ Hozircha hammasining vaqti kelmagan — xotira dam olyapti.",
    ru: "⏳ Пока срок ещё не подошёл — память отдыхает.",
    en: "⏳ Nothing is due yet — your memory is resting.",
  },
  "takror.yaqin": {
    uz: " Eng yaqini ~{kun} kundan keyin.",
    ru: " Ближайший — примерно через {kun} дн.",
    en: " The next one is in ~{kun} days.",
  },
  "takror.mavzu": { uz: "<b>Eng ko'p adashilgan mavzular:</b>", ru: "<b>Где чаще всего ошибки:</b>", en: "<b>Where you slip most:</b>" },
  "takror.pastki": {
    uz: "<i>To'g'ri javob bergan savolingiz ro'yxatdan chiqadi. Maqsad — ro'yxatni nolga tushirish. 💪</i>",
    ru: "<i>Вопрос, на который вы ответили верно, уходит из списка. Цель — довести список до нуля. 💪</i>",
    en: "<i>A question you answer correctly leaves the list. The goal: bring it down to zero. 💪</i>",
  },

  // ═════ Xatolarim: fokus «hozir qilinadigan» savollarda (umumiy son — ikkinchi darajali)
  "takror.sarlavha": { uz: "🔁 <b>Xatolar ustida ishlash</b>", ru: "🔁 <b>Работа над ошибками</b>", en: "🔁 <b>Working on mistakes</b>" },
  "takror.fokus": {
    uz: "Xotirani yangilash vaqti keldi! 🔥 <b>{soni} ta</b> savolga aynan hozir qaytsangiz, eng yaxshi esda qoladi.\n<i>Jami yig'ilgan: {jami} ta</i>",
    ru: "Пора освежить память! 🔥 Если вернуться к <b>{soni}</b> вопросам прямо сейчас, они запомнятся лучше всего.\n<i>Всего накоплено: {jami}</i>",
    en: "Time to refresh your memory! 🔥 Revisit <b>{soni}</b> questions right now and they'll stick best.\n<i>Total collected: {jami}</i>",
  },
  "takror.fokusYoq": {
    uz: "⏳ Hozircha vaqti kelgan savol yo'q — xotira dam olyapti.{yaqin}\n<i>Jami yig'ilgan: {jami} ta</i>",
    ru: "⏳ Пока нет вопросов, срок которых подошёл — память отдыхает.{yaqin}\n<i>Всего накоплено: {jami}</i>",
    en: "⏳ Nothing is due yet — your memory is resting.{yaqin}\n<i>Total collected: {jami}</i>",
  },
  "takror.tugmaHozir": { uz: "🔥 Hozirgi {soni} tasini ishlash", ru: "🔥 Пройти {soni} вопросов сейчас", en: "🔥 Work on {soni} now" },
  "takror.tugmaBaribir": { uz: "🚀 Baribir takrorlash", ru: "🚀 Всё равно повторить", en: "🚀 Review anyway" },
  "takror.pastki": {
    uz: "<i>Bitta to'g'ri javob = bitta o'chirilgan xato. 💪</i>",
    ru: "<i>Один верный ответ = одна исправленная ошибка. 💪</i>",
    en: "<i>One correct answer = one mistake cleared. 💪</i>",
  },

  // ═════ do'st bilan duel
  "duel.tezOrada": { uz: "⚔️ Duel tez orada ishga tushadi. Kuzatib turing!", ru: "⚔️ Дуэль скоро заработает. Следите за новостями!", en: "⚔️ Duels are coming soon. Stay tuned!" },
  "duel.limit": {
    uz: "{{diqqat}}\n<b>Duellar limitiga yetdingiz!</b>\n\n<blockquote>Sizda do'sti hali qo'shilmagan 5 ta duel turibdi. Yangisini ochish uchun avval ulardan birini yakunlang yoki do'stlaringiz qo'shilishini kuting. ⏳</blockquote>\n\n💡 Maslahat: avvalgi taklif xabarini do'stingizga qayta yuboring 👉🥊",
    ru: "<b>⚠️ Внимание: вы достигли лимита дуэлей!</b>\n\n<blockquote>У вас уже 5 дуэлей, к которым ещё никто не присоединился. Чтобы открыть новую, сначала завершите одну из них или дождитесь друзей. ⏳</blockquote>\n\n💡 Совет: отправьте друзьям прежнее приглашение ещё раз 👉🥊",
    en: "<b>⚠️ Heads up: you've hit the duel limit!</b>\n\n<blockquote>You already have 5 duels nobody has joined yet. To open a new one, finish one of them or wait for your friends. ⏳</blockquote>\n\n💡 Tip: send your friends the earlier invite again 👉🥊",
  },
  "duel.menyu": {
    uz: "⚔️ <b>Duel #{id}</b>\n\n{n} ta savol. Ko'proq to'g'ri javob yutadi, teng bo'lsa — tezroq tugatgan.\n\n🥊 Do'stingizni chaqirish uchun «Oktagon» ni bosing, o'zingiz esa hoziroq boshlashingiz mumkin.",
    ru: "⚔️ <b>Дуэль #{id}</b>\n\n{n} вопросов. Побеждает тот, у кого больше верных ответов; при равенстве — кто быстрее.\n\n🥊 Нажмите «Октагон», чтобы позвать друга, а сами можете начать прямо сейчас.",
    en: "⚔️ <b>Duel #{id}</b>\n\n{n} questions. Most correct answers wins; on a tie, the faster finisher.\n\n🥊 Tap “Octagon” to invite a friend — you can start right now.",
  },
  "duel.chaqirdi": {
    uz: "<b>🔥 {ism} bilan duel!</b>\n\n<blockquote>Oldinda {n} ta savol. Maqsad — ko'proq to'g'ri topish. Natijalar durang bo'lib qolsa, eng tezkor qatnashchi g'alaba qozonadi. ⏱</blockquote>\n\nQani, duelni qabul qilasizmi? ⚔️👇",
    ru: "<b>🔥 Дуэль с {ism}!</b>\n\n<blockquote>Впереди {n} вопросов. Цель — угадать как можно больше. Если результаты равны, побеждает самый быстрый участник. ⏱</blockquote>\n\nНу что, принимаете вызов? ⚔️👇",
    en: "<b>🔥 Duel with {ism}!</b>\n\n<blockquote>{n} questions ahead. The goal: get the most right. If the scores tie, the fastest player wins. ⏱</blockquote>\n\nSo, do you accept the duel? ⚔️👇",
  },
  "duel.share": { uz: "⚔️ Seni bilim duelida sinab ko'rmoqchiman! 5 ta savol, kim ko'p topadi?", ru: "⚔️ Хочу сразиться с тобой в дуэли знаний! 5 вопросов — кто больше угадает?", en: "⚔️ I challenge you to a knowledge duel! 5 questions — who gets more right?" },
  "duel.btnBosh": { uz: "⚔️ Duelni boshlash", ru: "⚔️ Начать дуэль", en: "⚔️ Start the duel" },
  "duel.btnOktagon": { uz: "🔗 Ulashish", ru: "🔗 Поделиться", en: "🔗 Share" },
  "duel.davom": {
    uz: "▶️ <b>Duel davom etmoqda</b>\n\nSavol yuqorida kutyapti — javob bering, keyingisi o'zi keladi.",
    ru: "▶️ <b>Дуэль продолжается</b>\n\nВопрос ждёт выше — ответьте, следующий придёт сам.",
    en: "▶️ <b>The duel is on</b>\n\nYour question is waiting above — answer it and the next one will follow.",
  },
  "duel.raqibKutilmoqda": {
    uz: "✅ <b>Siz allaqachon tugatgansiz:</b> {ok}/{n}\n\nRaqibingiz ham tugatishi bilan natijani darhol yuboramiz. ⏳",
    ru: "✅ <b>Вы уже закончили:</b> {ok}/{n}\n\nКак только соперник закончит, сразу пришлём результат. ⏳",
    en: "✅ <b>You've already finished:</b> {ok}/{n}\n\nThe moment your opponent finishes, we'll send the result. ⏳",
  },
  "duel.dostKutilmoqda": {
    uz: "✅ <b>Siz tugatdingiz:</b> {ok}/{n}\n\nDo'stingiz hali duelga qo'shilmadi. Taklif havolasini unga yuboring — qo'shilib, tugatishi bilan natija keladi. 🥊",
    ru: "✅ <b>Вы закончили:</b> {ok}/{n}\n\nДруг ещё не присоединился. Отправьте ему ссылку — как только он пройдёт, придёт результат. 🥊",
    en: "✅ <b>You're done:</b> {ok}/{n}\n\nYour friend hasn't joined yet. Send them the invite — the result arrives as soon as they finish. 🥊",
  },
  "duel.yakunlangan": {
    uz: "🏁 <b>Bu duel yakunlangan</b>\n\n<blockquote>Siz — {ok}/{n}\nRaqib — {raqib}/{n}</blockquote>\n\nYangi duel ochamizmi? ⚔️",
    ru: "🏁 <b>Эта дуэль завершена</b>\n\n<blockquote>Вы — {ok}/{n}\nСоперник — {raqib}/{n}</blockquote>\n\nОткроем новую? ⚔️",
    en: "🏁 <b>This duel is over</b>\n\n<blockquote>You — {ok}/{n}\nOpponent — {raqib}/{n}</blockquote>\n\nShall we open a new one? ⚔️",
  },
  "duel.allaqachon": { uz: "Siz bu duelni allaqachon boshlagansiz — savollarga javob bering.", ru: "Вы уже начали эту дуэль — отвечайте на вопросы.", en: "You've already started this duel — go on and answer the questions." },
  "duel.topilmadi": { uz: "Bu duel topilmadi.", ru: "Эта дуэль не найдена.", en: "This duel wasn't found." },
  "duel.ozHavola": { uz: "Bu sizning havolangiz — uni do'stingizga yuboring 🙂", ru: "Это ваша ссылка — отправьте её другу 🙂", en: "This is your link — send it to your friend 🙂" },
  "duel.boshqaQoshildi": { uz: "Bu duelga hozirgina boshqa odam qo'shildi.", ru: "К этой дуэли только что присоединился другой человек.", en: "Someone else just joined this duel." },
  "duel.band": { uz: "Bu duelda ikki kishi allaqachon bor. O'zingiz /duel bilan yangisini oching!", ru: "В этой дуэли уже двое. Откройте свою через /duel!", en: "This duel already has two players. Start your own with /duel!" },
  "duel.qoshildi": { uz: "🔔 <b>{ism}</b> duelga qo'shildi! Natija ikkalangiz tugatgach keladi.", ru: "🔔 <b>{ism}</b> присоединился к дуэли! Результат придёт, когда закончите оба.", en: "🔔 <b>{ism}</b> joined the duel! The result arrives when you both finish." },
  "duel.dost": { uz: "Do'stingiz", ru: "Ваш друг", en: "Your friend" },
  "duel.ishtirokchi": { uz: "Ishtirokchi", ru: "Участник", en: "Player" },
  "duel.tugatdi": {
    uz: "<b>✅ Siz duelni yakunladingiz!</b> ({ok}/{n})\n\n<blockquote>Natija raqibingiz ham tugatgach darhol keladi. Agar u 6 soat ichida tugatmasa, g'alaba sizga beriladi.</blockquote>\n\nQani ko'ramiz, u sizdan o'za olarmikan? ⏳🔥",
    ru: "<b>✅ Вы завершили дуэль!</b> ({ok}/{n})\n\n<blockquote>Результат придёт, как только соперник тоже закончит. Если он не успеет за 6 часов, победа достанется вам.</blockquote>\n\nПосмотрим, сумеет ли он вас обойти? ⏳🔥",
    en: "<b>✅ You've finished the duel!</b> ({ok}/{n})\n\n<blockquote>The result arrives as soon as your opponent finishes too. If they don't finish within 6 hours, the win is yours.</blockquote>\n\nLet's see if they can beat you. ⏳🔥",
  },
  "duel.tugatmadi": { uz: "tugatmadi", ru: "не закончил(а)", en: "didn't finish" },
  "duel.tarkNota": {
    uz: "Raqib 6 soat ichida testni tugatmadi — duel yopildi.",
    ru: "Соперник не закончил тест за 6 часов — дуэль закрыта.",
    en: "Your opponent didn't finish within 6 hours — the duel is closed.",
  },
  "duel.raqibTugatdi": {
    uz: "<b>⏳ {ism} duelni tugatdi!</b>\n\n<blockquote>Endi navbat sizda: 5 ta savolga javob bering, kim yutganini darhol bilasiz. 6 soat ichida tugatmasangiz, g'alaba {ism}ga beriladi.</blockquote>",
    ru: "<b>⏳ {ism} завершил(а) дуэль!</b>\n\n<blockquote>Теперь ваша очередь: ответьте на 5 вопросов — и сразу узнаете, кто победил. Если не закончите за 6 часов, победа достанется сопернику.</blockquote>",
    en: "<b>⏳ {ism} finished the duel!</b>\n\n<blockquote>Your turn now: answer 5 questions and find out who won right away. If you don't finish within 6 hours, the win goes to your opponent.</blockquote>",
  },
  "duel.soniya": { uz: "{x} s", ru: "{x} с", en: "{x} s" },
  "duel.durang": {
    uz: "<b>🤝 Durang — kuchlar teng!</b>\n\n<blockquote>{jadval}</blockquote>\n\nBunaqa teng raqibni kam uchratasiz. Kim kuchliroq ekanini aniqlash uchun yana bir bor sinashamizmi? 🤓",
    ru: "<b>🤝 Ничья — силы равны!</b>\n\n<blockquote>{jadval}</blockquote>\n\nТакого равного соперника встретишь нечасто. Сыграем ещё раз, чтобы выяснить, кто сильнее? 🤓",
    en: "<b>🤝 A draw — evenly matched!</b>\n\n<blockquote>{jadval}</blockquote>\n\nYou don't meet an equal like this often. One more round to find out who's stronger? 🤓",
  },
  "duel.yutdi": {
    uz: "<b>🏆 G'alaba sizniki!</b>\n\n<blockquote>{jadval}</blockquote>\n\nAjoyib o'yin! Do'stingiz revansh so'rashi mumkin — tayyor turing? 😎🔥",
    ru: "<b>🏆 Победа за вами!</b>\n\n<blockquote>{jadval}</blockquote>\n\nОтличная игра! Друг может потребовать реванш — будьте готовы? 😎🔥",
    en: "<b>🏆 The win is yours!</b>\n\n<blockquote>{jadval}</blockquote>\n\nGreat game! Your friend may ask for a rematch — be ready? 😎🔥",
  },
  "duel.yutqazdi": {
    uz: "<b>🥲 Bu safar do'stingiz oldinda!</b>\n\n<blockquote>{jadval}</blockquote>\n\nDuel tugadi, lekin kurash tugamadi. Revansh olib, hisobni tenglashtiramizmi? ⚔️🔥",
    ru: "<b>🥲 В этот раз друг впереди!</b>\n\n<blockquote>{jadval}</blockquote>\n\nДуэль окончена, но борьба — нет. Возьмём реванш и сравняем счёт? ⚔️🔥",
    en: "<b>🥲 Your friend is ahead this time!</b>\n\n<blockquote>{jadval}</blockquote>\n\nThe duel is over, but the fight isn't. Take a rematch and level the score? ⚔️🔥",
  },
  "duel.btnMenyu": { uz: "⚔️ Do'st bilan duel", ru: "⚔️ Дуэль с другом", en: "⚔️ Duel with a friend" },
  "duel.xabar": {
    uz: "<b>Kuch sinashamizmi? 😎</b>\n\n<blockquote>Seni @ustozimnurimbot'da duelga chaqiraman! ⚔️</blockquote>",
    ru: "<b>Померимся силами? 😎</b>\n\n<blockquote>Зову тебя на дуэль в @ustozimnurimbot! ⚔️</blockquote>",
    en: "<b>Shall we test our strength? 😎</b>\n\n<blockquote>I challenge you to a duel in @ustozimnurimbot! ⚔️</blockquote>",
  },
  "duel.btnKettu": { uz: "Kettu 😎", ru: "Принимаю 😎", en: "Bring it 😎" },
  "duel.inlineSarlavha": { uz: "Lumi: «Qani, tekshirib ko'ramiz — kim kuchli?» ⚔️", ru: "Луми: «Ну-ка проверим — кто сильнее?» ⚔️", en: "Lumi: “Let’s see — who’s stronger?” ⚔️" },
  "duel.inlineIzoh": { uz: "Shu yerni bosing — taklif do'stingizga yuboriladi", ru: "Нажмите здесь — приглашение уйдёт другу", en: "Tap here — the invitation goes to your friend" },
  "duel.yangi": { uz: "⚔️ Yangi duel", ru: "⚔️ Новая дуэль", en: "⚔️ New duel" },

  // ═════ fikr egasiga: "ish berdi"
  "fikr.ishBerdi": {
    uz: "💡 <b>Fikringiz ish berdi!</b>\n\nSiz yozgandingiz: «{fikr}»\n✅ {ish}\n\nRahmat — bot siz bilan birga yaxshilanadi.",
    ru: "💡 <b>Ваш отзыв сработал!</b>\n\nВы писали: «{fikr}»\n✅ {ish}\n\nСпасибо — бот становится лучше вместе с вами.",
    en: "💡 <b>Your feedback made a difference!</b>\n\nYou wrote: “{fikr}”\n✅ {ish}\n\nThank you — the bot improves together with you.",
  },

  // ═════ saqlangan savollar
  "tugma.saqlangan": { uz: "🔖 Saqlanganlar", ru: "🔖 Сохранённые", en: "🔖 Saved" },
  "sv.saqlash": { uz: "🔖 Saqlash", ru: "🔖 Сохранить", en: "🔖 Save" },
  "sv.saqlandi": { uz: "✅ Saqlandi", ru: "✅ Сохранено", en: "✅ Saved" },
  "sv.bosh": {
    uz: "🔖 <b>Saqlanganlar</b>\n\nHali hech narsa saqlanmagan. Savol tagidagi «🔖 Saqlash» tugmasini bosing — u shu yerda to'planadi va istalgan vaqt qaytib ko'rishingiz mumkin.",
    ru: "🔖 <b>Сохранённые</b>\n\nПока ничего нет. Нажмите «🔖 Сохранить» под вопросом — он появится здесь, и вы сможете вернуться к нему в любое время.",
    en: "🔖 <b>Saved</b>\n\nNothing saved yet. Tap “🔖 Save” under a question — it will collect here for you to revisit anytime.",
  },
  "sv.sarlavha": { uz: "🔖 <b>Saqlanganlar</b> — {soni} ta", ru: "🔖 <b>Сохранённые</b> — {soni}", en: "🔖 <b>Saved</b> — {soni}" },
  "sv.oxirgi": { uz: "<i>Oxirgi {n} tasi ko'rsatilgan. Olib tashlash: 🗑 raqam.</i>", ru: "<i>Показаны последние {n}. Удалить: 🗑 номер.</i>", en: "<i>Showing the latest {n}. Remove: 🗑 number.</i>" },

  // ═════ viktorinaga qaytish
  "davom.matn": {
    uz: "▶️ <b>Viktorina to'xtagan joyda kutmoqda</b>\n\n{n}/{jami}-savol. Tayyor bo'lsangiz — bosing, vaqt shundan keyin ketadi.",
    ru: "▶️ <b>Викторина ждёт там, где вы остановились</b>\n\nВопрос {n}/{jami}. Когда будете готовы — нажмите, время пойдёт после этого.",
    en: "▶️ <b>Your quiz is waiting where you left off</b>\n\nQuestion {n}/{jami}. Tap when you're ready — the timer starts after that.",
  },
  "davom.tugma": { uz: "▶️ Davom etish", ru: "▶️ Продолжить", en: "▶️ Continue" },

  // ═════ Sozlamalar tugmalari: qisqa, telefonda yonma-yon sig'adi
  "sz.yutuq":    { uz: "🥇 Yutuqlarim", ru: "🥇 Достижения", en: "🥇 Achievements" },
  "sz.profil":   { uz: "👤 Profilim", ru: "👤 Профиль", en: "👤 Profile" },
  "sz.duel":     { uz: "⚔️ Duel", ru: "⚔️ Дуэль", en: "⚔️ Duel" },
  "sz.taklif":   { uz: "🤝 Taklif", ru: "🤝 Пригласить", en: "🤝 Invite" },
  "sz.yonalish": { uz: "🎯 Yo'nalish", ru: "🎯 Тема", en: "🎯 Topic" },
  "sz.til":      { uz: "🌐 Til", ru: "🌐 Язык", en: "🌐 Language" },
  "sz.fikr":     { uz: "💬 Fikr", ru: "💬 Отзыв", en: "💬 Feedback" },
  "sz.yordam":   { uz: "ℹ️ Yordam", ru: "ℹ️ Помощь", en: "ℹ️ Help" },
};
