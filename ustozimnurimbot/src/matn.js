/**
 * MATN KATALOGI — foydalanuvchi ko'radigan barcha so'z shu yerda.
 *
 * NEGA KOD ICHIDAN CHIQARILDI
 *
 *  1) Matnni tahrirlash uchun kod kavlash kerak edi. Vergul qo'shish
 *     uchun ham funksiya ichiga kirish — bu matn ustida ishlashni
 *     qiyinlashtiradi, qiyin ish esa qilinmaydi.
 *
 *  2) Rus tili uchun kod bo'ylab `ru ? "..." : "..."` shoxlanishi
 *     tarqalgan edi. Uchinchi til qo'shilsa bu usul yiqiladi, ikkinchi
 *     tilda ham bitta matnni yangilab, ikkinchisini unutish oson.
 *
 *  3) Bir xil fikr turli joyda turlicha aytilardi. Hammasi yonma-yon
 *     turganda ohangdagi nomuvofiqlik darrov ko'rinadi.
 *
 * ISHLATISH
 *     t("kunlik.yakun", "uz", { ball: 7, jami: 10 })
 *
 * O'ZGARUVCHILAR  {nom}  shaklida yoziladi.
 * Tarjima topilmasa o'zbekchaga tushadi — bo'sh xabar yuborishdan
 * ko'ra tushunarli tilda xabar yaxshi.
 */

import { MATN_EN } from "./matn_en.js";
import { MATN_YANGI } from "./matn_yangi.js";
import { MATN_FORMAT } from "./matn_format.js";
import { joriyTil } from "./lang.js";

export const MATN = {
  // ═══════════════════════════════════ TUGMALAR
  //
  // Tugma yozuvi — botdagi eng ko'p o'qiladigan matn. U harakatni
  // nomlashi kerak, bo'limni emas: odam "Natijalarim" ga emas,
  // "qayerda turganimni ko'rish" uchun bosadi.
  // «Bugungi mashg'ulot» juda quruq chiqdi — odam nimaga bosayotganini
  // sezmaydi. «Viktorina savollar» esa nima kutayotganini aytadi.
  "tugma.bugun":      { uz: "🧠 Viktorina savollar",   ru: "🧠 Вопросы викторины" },
  "tugma.kunlik":     { uz: "🧠 Kunlik viktorina",     ru: "🧠 Викторина дня" },
  "tugma.arab":       { uz: "🔤 Arab alifbosi",       ru: "🔤 Арабский алфавит" },
  "tugma.marafon":    { uz: "📖 Ilm olish sirlari",    ru: "📖 Секреты обретения знаний" },
  // «Xatolarim» ataylab saqlandi. Men buni «Takrorlash»ga o'zgartirgan
  // edim — mexanizm nomi sifatida u aniqroq. Lekin foydalanuvchi uchun
  // bu bo'lim MEXANIZM emas, uning O'Z narsasi: xato qilgan savollari.
  // «Takrorlash» — botning ishi, «Xatolarim» — odamning mulki.
  // Egalik qo'shimchasi qiziqishni oshiradi, nomdagi aniqlik emas.
  "tugma.takror":     { uz: "🔁 Xatolarim",            ru: "🔁 Мои ошибки" },
  "tugma.natija":     { uz: "📈 Natijam",              ru: "📈 Мой прогресс" },
  "tugma.reyting":    { uz: "🏆 Reyting",              ru: "🏆 Рейтинг" },
  "tugma.sozlama":    { uz: "⚙️ Sozlamalar",           ru: "⚙️ Настройки" },

  // ═══════════════════════════════════ BUGUNGI MASHG'ULOT
  //
  // Botdagi eng muhim ekran. Foydalanuvchi "nima qilay?" degan savol
  // bilan keladi — bot unga TANLOV emas, TAVSIYA berishi kerak.
  // Tanlov mas'uliyatni odamga qaytaradi; u esa aynan shundan
  // charchagani uchun bu tugmani bosgan.
  "bugun.sarlavha":   { uz: "🧠 <b>Viktorina savollar</b>", ru: "🧠 <b>Вопросы викторины</b>" },

  "bugun.kunlik": {
    uz: "Bugungi savollar sizni kutyapti — <b>{soni} ta</b>, taxminan <b>{daqiqa} daqiqa</b>.\n\n" +
        "Kechqurun reytingda o'rningizni ko'rasiz.",
    ru: "Вас ждут сегодняшние вопросы — <b>{soni}</b>, примерно <b>{daqiqa} мин</b>.\n\n" +
        "Вечером увидите своё место в рейтинге.",
  },
  "bugun.takror": {
    uz: "Bugungi sinovni bajardingiz. 👏\n\n" +
        "Endi eng foydali qism: <b>{soni} ta</b> savolning qaytish vaqti keldi. " +
        "Ularni eslay olsangiz — bilim uzoq muddatli xotiraga o'tadi.",
    ru: "Сегодняшний тест пройден. 👏\n\n" +
        "Теперь самое полезное: подошло время <b>{soni}</b> вопросов. " +
        "Если вспомните их — знание закрепится надолго.",
  },
  "bugun.marafon": {
    uz: "Bugungi sinov bajarildi, takrorlash ro'yxati ham bo'sh.\n\n" +
        "Marafonda <b>{fasl}-bosqich</b> sizni kutyapti — <b>{soni} ta</b> savol, vaqt cheklovsiz.",
    ru: "Тест дня пройден, список повторения пуст.\n\n" +
        "В марафоне вас ждёт <b>этап {fasl}</b> — <b>{soni}</b> вопросов, без ограничения времени.",
  },
  "bugun.hammasi": {
    uz: "Bugun hammasini bajardingiz. 🎉\n\n" +
        "Kunlik viktorina — ✅\nTakrorlash ro'yxati — bo'sh\nMarafon — yakunlangan\n\n" +
        "Ertaga yangi savollar bilan kutamiz. Istasangiz, «{mashq}» dan mashq qilib turishingiz mumkin.",
    ru: "Сегодня вы прошли всё. 🎉\n\n" +
        "Тест дня — ✅\nСписок повторения — пуст\nМарафон — завершён\n\n" +
        "Завтра ждём с новыми вопросами. При желании можно потренироваться в «{mashq}».",
  },
  "bugun.boshla":     { uz: "▶️ Boshlash",            ru: "▶️ Начать" },
  "bugun.keyinroq":   { uz: "Keyinroq",               ru: "Позже" },

  // ═══════════════════════════════════ TANISHUV
  //
  // Birinchi 60 soniyada qiymat ko'rsatilmasa, odam qaytmaydi.
  // Shuning uchun bu yerda bo'limlar TA'RIFI emas, birinchi QADAM
  // taklif qilinadi: avval ishlab ko'rsin, keyin tushuntiramiz.
  "start.salom": {
    uz: "🧠 <b>Salom, {ism}!</b>\n\n" +
        "Bu — <b>Ustozim Nurim</b> bilim sinovi boti.\n\n" +
        "Bu yerda siz shunchaki test ishlamaysiz: har bir javobdan keyin " +
        "izoh olasiz, xato qilgan savolingiz esa bir necha kundan keyin " +
        "qaytib keladi — toki u yodda mustahkam qolguncha.\n\n" +
        "Keling, gapni cho'zmay boshlaymiz.",
    ru: "🧠 <b>Здравствуйте, {ism}!</b>\n\n" +
        "Это бот проверки знаний <b>Ustozim Nurim</b>.\n\n" +
        "Здесь вы не просто решаете тесты: после каждого ответа есть " +
        "пояснение, а вопрос, в котором вы ошиблись, вернётся через " +
        "несколько дней — пока не закрепится.\n\n" +
        "Давайте начнём.",
  },
  "start.qaytdi": {
    uz: "🧠 <b>Qaytganingizdan xursandmiz, {ism}!</b>\n\n" +
        "Oxirgi marta bu yerda <b>{kun}</b> kun oldin bo'lgansiz.\n" +
        "Davom etamizmi?",
    ru: "🧠 <b>Рады вашему возвращению, {ism}!</b>\n\n" +
        "В последний раз вы были здесь <b>{kun}</b> дн. назад.\n" +
        "Продолжим?",
  },

  // ═══════════════════════════════════ KUNLIK YAKUN
  //
  // Xabarning OXIRGI jumlasi eng esda qoladigan joy. Ilgari u yerda
  // "reyting 22:00 da chiqadi" turardi — ya'ni eng qimmatli o'rin
  // e'longa ketgandi. Endi u yerda KEYINGI QADAM turadi.
  "kunlik.yakun": {
    uz: "🎯 <b>Bugungi sinov yakunlandi</b>\n\n" +
        "Natija: <b>{ball} / {jami}</b>  ({foiz}%)\n<code>{chiziq}</code>\n{ketma}\n{baho}",
    ru: "🎯 <b>Тест дня завершён</b>\n\n" +
        "Результат: <b>{ball} / {jami}</b>  ({foiz}%)\n<code>{chiziq}</code>\n{ketma}\n{baho}",
  },
  "kunlik.xatolar": {
    uz: "\n\n🔄 <b>{soni} ta</b> savolda adashdingiz. Ular takrorlash " +
        "ro'yxatingizga tushdi va bir necha kundan keyin qaytadi — " +
        "o'shanda eslab qolasiz.",
    ru: "\n\n🔄 Вы ошиблись в <b>{soni}</b> вопросах. Они попали в список " +
        "повторения и вернутся через несколько дней — тогда и запомнятся.",
  },
  "kunlik.toliq": {
    uz: "\n\n✨ Bitta ham xato yo'q. Bu — tasodif emas, tayyorgarlik.",
    ru: "\n\n✨ Ни одной ошибки. Это не случайность, а подготовка.",
  },
  "kunlik.reyting": {
    uz: "\n\n<i>Bugungi reyting soat 22:00 da guruhga chiqadi.</i>",
    ru: "\n\n<i>Сегодняшний рейтинг выйдет в группе в 22:00.</i>",
  },

  // ═══════════════════════════════════ TAKRORLASH
  //
  // Ilgari bu bo'lim "Xatolarim" va "Xatolar bankim" deb atalgan edi.
  // Ikkala nom ham odamni o'z kamchiligiga qaratadi. Aslida bu —
  // botdagi eng kuchli o'rganish vositasi: interval takrorlash.
  // Nom oldinga qarashi kerak, orqaga emas.
  "takror.sarlavha":  { uz: "🔁 <b>Xatolarim</b>", ru: "🔁 <b>Мои ошибки</b>" },
  "takror.izoh": {
    uz: "Xato qilgan savolingiz shu yerga tushadi va <b>1 → 2 → 4 → 7 → 14</b> " +
        "kun oralig'ida qaytib keladi. Har safar eslaganingizda xotira mustahkamlanadi.",
    ru: "Вопрос, в котором вы ошиблись, попадает сюда и возвращается через " +
        "<b>1 → 2 → 4 → 7 → 14</b> дней. Каждое удачное припоминание укрепляет память.",
  },
  "takror.bosh": {
    uz: "🎉 <b>Hamma savolni tuzatib chiqdingiz.</b>\n\n" +
        "Yangi savol xato ketsa, u avtomatik shu yerga tushadi.",
    ru: "🎉 <b>Вы исправили все вопросы.</b>\n\n" +
        "Если новый вопрос окажется неверным, он попадёт сюда автоматически.",
  },
  "takror.yangi": {
    uz: "Bu bo'lim xato qilgan savollaringizni yig'adi va ularni " +
        "<b>1 → 2 → 4 → 7 → 14</b> kun oralig'ida qaytarib beradi.\n\n" +
        "Hozircha bo'sh — avval «{kunlik}» yoki «{marafon}» dan boshlang.",
    ru: "Этот раздел собирает вопросы с ошибками и возвращает их через " +
        "<b>1 → 2 → 4 → 7 → 14</b> дней.\n\n" +
        "Пока пусто — начните с «{kunlik}» или «{marafon}».",
  },
  "takror.tayyor":    { uz: "⏰ Qaytish vaqti kelgan: <b>{soni} ta</b>", ru: "⏰ Время вернуться: <b>{soni}</b>" },
  "takror.kutish":    { uz: "⏰ Hammasining muddati hali kelmagan", ru: "⏰ Срок ещё не подошёл" },
  "takror.yaqin":     { uz: " (eng yaqini ~{kun} kundan keyin)", ru: " (ближайший через ~{kun} дн.)" },
  "takror.boshla":    { uz: "▶️ Takrorlashni boshlash", ru: "▶️ Начать повторение" },

  // ═══════════════════════════════════ SOZLAMALAR
  "sozlama.sarlavha": { uz: "⚙️ <b>Sozlamalar</b>", ru: "⚙️ <b>Настройки</b>" },
  "sozlama.til":      { uz: "🌐 Til / Язык / Language", ru: "🌐 Til / Язык / Language" },
  "til.tanla":        { uz: "🌐\u2060 <b>Tilni tanlang / Выберите язык / Choose a language</b>\n\nMenyu va xabarlar shu tilda bo'ladi. Viktorina savollari o'z tilida qoladi.",
                        ru: "🌐\u2060 <b>Выберите язык / Tilni tanlang / Choose a language</b>\n\nМеню и сообщения будут на этом языке. Вопросы викторины остаются на своём языке." },
  "til.tayyor":       { uz: "✅ Til o'rnatildi: O'zbekcha", ru: "✅ Язык установлен: Русский" },
  "til.marafonRu":    { uz: "📕 Rus tilida marafon", ru: "📕 Марафон на русском" },
  "sozlama.yonalish": { uz: "🎯 Viktorina yo'nalishi", ru: "🎯 Направление теста" },
  "sozlama.mashq":    { uz: "📚 O'z tezligimda mashq", ru: "📚 Тренировка в своём темпе" },
  "sozlama.yordam":   { uz: "ℹ️ Bot qanday ishlaydi",  ru: "ℹ️ Как работает бот" },


  // ═══════════════════════════════════ TAJRIBA: KUNLIK 5
  "fikr.savol":  { uz: "Bugungi savollar sizga foydali bo'ldimi?", ru: "Были ли сегодняшние вопросы полезны?" },
  "fikr.ha":     { uz: "👍 Foydali", ru: "👍 Полезно" },
  "fikr.yoq":    { uz: "👎 Unchalik", ru: "👎 Не очень" },
  "fikr.rahmat": { uz: "Rahmat! Fikringiz savollarni yaxshilashga yordam beradi.", ru: "Спасибо! Ваш отзыв поможет улучшить вопросы." },
  "fikr.yana":   { uz: "➕ Yana 5 ta savol", ru: "➕ Ещё 5 вопросов" },

  // ═══════════════════════════════════ YUTUQLAR
  //
  // Ohang ataylab vazmin. «AJOYIB!!! SIZ ZO'RSIZ!!!» turidagi tabrik
  // bir-ikki marta ishlaydi, keyin esa bo'sh yangraydi va butun
  // tizimga ishonchni tushiradi. Yutuq o'z-o'zidan qimmatli bo'lsa,
  // uni ulug'lab yuborish shart emas.
  "yutuq.yangi":      { uz: "🏅 <b>Yangi yutuq</b>\n\n{emoji} <b>{nom}</b>\n{izoh}",
                        ru: "🏅 <b>Новое достижение</b>\n\n{emoji} <b>{nom}</b>\n{izoh}" },
  "yutuq.sarlavha":   { uz: "🏅 <b>Yutuqlarim</b>", ru: "🏅 <b>Мои достижения</b>" },
  "yutuq.hisob":      { uz: "Qo'lga kiritilgan: <b>{bor}</b> / {jami}",
                        ru: "Получено: <b>{bor}</b> / {jami}" },
  "yutuq.bosh":       { uz: "Hali birorta yutuq yo'q.\n\nBirinchisi uzoq emas: " +
                            "bitta savolga javob bersangiz kifoya.",
                        ru: "Пока нет ни одного достижения.\n\nПервое совсем близко: " +
                            "достаточно ответить на один вопрос." },
  "yutuq.tugma":      { uz: "🏅 Yutuqlarim", ru: "🏅 Достижения" },
  "yutuq.keyingi":    { uz: "\n\n<i>Keyingi: {emoji} {nom} — {izoh}</i>",
                        ru: "\n\n<i>Далее: {emoji} {nom} — {izoh}</i>" },

  // ═══════════════════════════════════ SAVOL SIFATI
  //
  // Bazada 800 dan ortiq savol bor, hammasi odam qo'li bilan yozilgan.
  // Xato bo'lishi muqarrar. Admin uni topa olmaydi — har savolni qayta
  // o'qimaydi. Foydalanuvchi esa aynan o'sha paytda ko'radi.
  // Xabar berish yo'li bo'lmasa, xato abadiy qoladi va har safar
  // yangi odamni chalg'itadi.
  "xabar.tugma":      { uz: "🚩 Savolda xato bor", ru: "🚩 В вопросе ошибка" },
  "xabar.tanla":      { uz: "🚩 <b>Qaysi savolda xato bor?</b>\n\n" +
                            "Savol matni, variantlar yoki izohda xatolik bo'lsa — belgilang. " +
                            "Har bir belgi ko'rib chiqiladi.",
                        ru: "🚩 <b>В каком вопросе ошибка?</b>\n\n" +
                            "Если ошибка в тексте вопроса, вариантах или пояснении — отметьте. " +
                            "Каждая отметка будет рассмотрена." },
  "xabar.rahmat":     { uz: "✅ Belgilandi. Rahmat — shu tarzda baza yaxshilanadi.",
                        ru: "✅ Отмечено. Спасибо — так база становится лучше." },
  "xabar.bor":        { uz: "Siz bu savolni allaqachon belgilagansiz.",
                        ru: "Вы уже отмечали этот вопрос." },
  "xabar.yoq":        { uz: "Belgilash uchun savol topilmadi.",
                        ru: "Вопросов для отметки не найдено." },

  // ═══════════════════════════════════ TAKLIF
  //
  // Taklif matni MAQTANCHOQ emas, FOYDALI bo'lishi kerak: odam uni
  // do'stiga yuborganda o'zini noqulay his qilmasin. Shuning uchun
  // matn bot haqida emas, do'st oladigan narsa haqida.
  "taklif.sarlavha":  { uz: "🤝 <b>Do'stni taklif qilish</b>", ru: "🤝 <b>Пригласить друга</b>" },
  "taklif.izoh":      { uz: "Quyidagi matnni do'stingizga yuboring. " +
                            "U shu havola orqali kirsa, sizning taklifingiz hisoblanadi.",
                        ru: "Отправьте этот текст другу. Если он перейдёт по ссылке, " +
                            "приглашение засчитается вам." },
  "taklif.hisob":     { uz: "\n\nSiz taklif qilganlar: <b>{jami}</b> ta" +
                            "\nUlardan faol: <b>{faol}</b> ta",
                        ru: "\n\nВы пригласили: <b>{jami}</b>" +
                            "\nИз них активны: <b>{faol}</b>" },
  "taklif.matn":      { uz: "📚 <b>Ustozim Nurim</b> — bilim sinovi boti.\n\n" +
                            "Har kuni qisqa test, har javobdan keyin izoh. " +
                            "Xato qilgan savolingiz bir necha kundan keyin qaytib keladi — " +
                            "toki yodda mustahkam qolguncha.\n\n{havola}",
                        ru: "📚 <b>Ustozim Nurim</b> — бот проверки знаний.\n\n" +
                            "Каждый день короткий тест, после каждого ответа — пояснение. " +
                            "Вопрос, в котором вы ошиблись, вернётся через несколько дней — " +
                            "пока не закрепится.\n\n{havola}" },
  "taklif.tugma":     { uz: "🤝 Do'stni taklif qilish", ru: "🤝 Пригласить друга" },

  // ═══════════════════════════════════ NOSOZLIK
  "xato.limit": {
    uz: "⏳ <b>Bot vaqtincha dam olyapti</b>\n\n" +
        "Bugungi so'rovlar chegarasiga yetdik — bu nosozlik emas, texnik cheklov.\n\n" +
        "🕔 <b>Ertalab soat 05:00 dan keyin</b> hammasi avvalgidek ishlaydi. " +
        "Natijalaringiz, ketma-ket kunlaringiz va marafon bosqichingiz " +
        "saqlanib turibdi — hech narsa yo'qolmaydi.\n\n" +
        "Noqulaylik uchun uzr. 🤍",
    ru: "⏳ <b>Бот временно отдыхает</b>\n\n" +
        "Мы достигли сегодняшнего лимита запросов — это не поломка, а техническое ограничение.\n\n" +
        "🕔 <b>После 05:00 утра</b> всё заработает как прежде. Ваши результаты, " +
        "дни подряд и этап марафона сохранены — ничего не потеряется.\n\n" +
        "Извините за неудобство. 🤍",
  },
  "xato.baza": {
    uz: "⚠️ <b>Vaqtinchalik nosozlik</b>\n\n" +
        "Hozir so'rovingizni bajara olmadim. Bu odatda bir necha daqiqada " +
        "o'tib ketadi — biroz kutib, qaytadan urinib ko'ring.\n\n" +
        "Natijalaringiz saqlangan, yo'qolmaydi.",
    ru: "⚠️ <b>Временный сбой</b>\n\n" +
        "Сейчас не удалось выполнить запрос. Обычно это проходит за " +
        "несколько минут — подождите и попробуйте снова.\n\n" +
        "Ваши результаты сохранены.",
  },
  "xato.dastur": {
    uz: "⚠️ <b>Nimadir noto'g'ri ketdi</b>\n\n" +
        "Bu so'rovni bajara olmadim. Xabar adminga yuborildi — tez orada tuzatiladi.\n\n" +
        "Shu orada boshqa bo'limlardan foydalanishingiz mumkin.",
    ru: "⚠️ <b>Что-то пошло не так</b>\n\n" +
        "Не удалось выполнить запрос. Сообщение отправлено администратору — скоро исправим.\n\n" +
        "Пока можно пользоваться другими разделами.",
  },
};

for (const [k, v] of Object.entries(MATN_EN)) (MATN[k] ||= {}).en = v;
// Copywriting qayta yozuvi: kalit bo'yicha eski matnlar ustiga yoziladi
for (const [k, v] of Object.entries(MATN_YANGI)) Object.assign((MATN[k] ||= {}), v);
for (const [k, v] of Object.entries(MATN_FORMAT)) Object.assign((MATN[k] ||= {}), v);

/** Matnni oladi va {o'zgaruvchi} larni almashtiradi. Til berilmasa — joriy so'rov tili. */
export function t(kalit, lang = joriyTil(), ozgaruvchilar = {}) {
  const yozuv = MATN[kalit];
  if (!yozuv) return `[${kalit}]`;       // ko'rinadigan xato — jim yo'qolishdan yaxshi
  let s = yozuv[lang] || yozuv.uz;
  for (const [k, v] of Object.entries(ozgaruvchilar)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/**
 * Asosiy klaviatura.
 *
 * ILGARI: sakkizta tugma, ierarxiyasiz. Hammasi bir xil vaznda
 * ko'rinardi, ya'ni foydalanuvchi har safar sakkiztadan birini
 * tanlashi kerak edi. Yangi odam uchun esa bu sakkizta tanlov emas,
 * sakkizta NOMA'LUM.
 *
 * ENDI: bitta asosiy harakat + oltita yordamchi. "Bugungi mashg'ulot"
 * to'liq kenglikni egallaydi — tugmaning kattaligi uning muhimligini
 * aytadi, buni tushuntirish shart emas.
 *
 * Uchta "savol ishlash" rejimi (kunlik / mashq / marafon) birinchi
 * qatorda yonma-yon turgani eng katta chalkashlik edi — ular bir xil
 * narsani va'da qilardi. "O'z tezligimda" sozlamalarga ko'chdi:
 * u kechikkanlar uchun kerak, lekin kundalik ehtiyoj emas.
 */
export const menyu = (lang = joriyTil()) => ({
  keyboard: [
    [{ text: t("tugma.kunlik", lang) }, { text: t("tugma.duel", lang) }],
    [{ text: t("tugma.oganish", lang) }, { text: t("tugma.profilim", lang) }],
  ],
  resize_keyboard: true,
});

/**
 * Tugma yozuvidan amalga xarita.
 *
 * NEGA XARITA, IF-ZANJIRI EMAS: tugma yozuvlari ikki tilda, ustiga
 * eskilari ham qo'shiladi. If-zanjirida bu o'n beshta shart bo'lardi
 * va yangi til qo'shilganda yana beshtasi unutilardi.
 *
 * ESKI YOZUVLAR ATAYLAB QOLDIRILDI: foydalanuvchidagi klaviatura
 * Telegram'da keshlangan. U yangi xabar olmaguncha ESKI tugmalarni
 * ko'rsatib turadi — ya'ni "Xatolarim" ni bosadi. Agar eski yozuv
 * tanilmasa, bot javob bermaydi va odam "yana buzildi" deb o'ylaydi.
 */
export const AMAL = (() => {
  const x = new Map();
  const qosh = (amal, ...yozuvlar) => { for (const y of yozuvlar) x.set(y, amal); };

  qosh("bugun",    t("tugma.bugun", "uz"),    t("tugma.bugun", "ru"),
       "⚡️ Bugungi mashg'ulot", "⚡️ Занятие на сегодня");
  qosh("kunlik",   t("tugma.kunlik", "uz"),   t("tugma.kunlik", "ru"),   "🧠 Kunlik viktorina", "🧠 Kunlik sinov", "🧠 Тест дня");
  qosh("marafon",  t("tugma.marafon", "uz"),  t("tugma.marafon", "ru"),  "📖 Kitob marafoni", "📖 Marafon", "📖 Марафон");
  qosh("takror",   t("tugma.takror", "uz"),   t("tugma.takror", "ru"),
       "🔁 Xatolarim", "🔄 Takrorlash", "🔄 Повторение");
  qosh("natija",   t("tugma.natija", "uz"),   t("tugma.natija", "ru"),   "📊 Natijalarim");
  qosh("reyting",  t("tugma.reyting", "uz"),  t("tugma.reyting", "ru"),  "🏆 Reyting");
  qosh("sozlama",  t("tugma.sozlama", "uz"),  t("tugma.sozlama", "ru"));
  qosh("marafonRu", "📕 Марафон (RU)");
  qosh("arab", t("tugma.arab", "uz"), t("tugma.arab", "ru"));
  qosh("saqlangan", t("tugma.saqlangan", "uz"), t("tugma.saqlangan", "ru"), t("tugma.saqlangan", "en"));
  for (const [amal, kalit] of [["bugun","tugma.bugun"],["kunlik","tugma.kunlik"],["marafon","tugma.marafon"],
       ["takror","tugma.takror"],["natija","tugma.natija"],["reyting","tugma.reyting"],
       ["sozlama","tugma.sozlama"],["arab","tugma.arab"]]) qosh(amal, t(kalit, "en"));
  qosh("hubOrgan", t("tugma.oganish", "uz"), t("tugma.oganish", "ru"), t("tugma.oganish", "en"));
  qosh("duel", t("tugma.duel", "uz"), t("tugma.duel", "ru"), t("tugma.duel", "en"));
  qosh("profil", t("tugma.profilim", "uz"), t("tugma.profilim", "ru"), t("tugma.profilim", "en"));
  qosh("hubYol",   "📈 Mening yo'lim", "📈 Мой путь", "📈 My progress");
  qosh("yordam",   "ℹ️ Yordam");
  qosh("mashq",    "📚 O'z tezligimda");
  return x;
})();
