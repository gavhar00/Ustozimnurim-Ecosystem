/**
 * YUTUQLAR — real progressga bog'langan bosqichlar.
 *
 * NEGA EHTIYOTKORLIK BILAN: gamifikatsiya oson buziladi. Agar yutuq
 * SON yig'ishga bog'lansa («100 ta javob!»), odam mazmunni emas, sonni
 * quvlaydi — tez-tez, e'tiborsiz javob beradi va o'rganish buziladi.
 * Shuning uchun har bir yutuq SIFAT yoki QAT'IYAT ni belgilaydi:
 * zanjirni uzmaslik, xatoni tuzatish, faslni yakunlash.
 *
 * BIR MARTA BERILSA — QAYTARIB OLINMAYDI. Zanjir uzilsa ham «7 kun
 * ketma-ket» yutug'i qoladi, chunki u bo'lib o'tgan voqea. Mukofotni
 * qaytarib olish mukofot emas, tahdiddir.
 *
 * RO'YXAT QISQA: o'nta. Har bir yangi nishon avvalgilarining qiymatini
 * kamaytiradi — o'ttizta nishoni bor tizimda birortasi ham qadrlanmaydi.
 */

export const YUTUQLAR = [
  // ——— ilk qadamlar: boshlashni nishonlash
  { kod: "ilk",       emoji: "🌱", nom: "Ilk qadam",       ru: "Первый шаг",
    izoh: "Birinchi savolga javob berdingiz",
    ruIzoh: "Вы ответили на первый вопрос",
    shart: (h) => h.jami >= 1 },

  { kod: "fasl1",     emoji: "📖", nom: "Kitob ochildi",   ru: "Книга открыта",
    izoh: "Marafonning birinchi bosqichini yakunladingiz",
    ruIzoh: "Вы завершили первый этап марафона",
    shart: (h) => h.fasl >= 1 },

  // ——— qat'iyat: eng qiyin va eng qimmatli narsa
  { kod: "hafta",     emoji: "🔥", nom: "Bir hafta",       ru: "Неделя",
    izoh: "7 kun ketma-ket ishladingiz",
    ruIzoh: "Вы занимались 7 дней подряд",
    shart: (h) => h.streak >= 7 },

  { kod: "oy",        emoji: "💎", nom: "Bir oy",          ru: "Месяц",
    izoh: "30 kun ketma-ket — bu oddiy odam qila olmaydigan ish",
    ruIzoh: "30 дней подряд — это по силам не каждому",
    shart: (h) => h.streak >= 30 },

  { kod: "qatiyat",   emoji: "🧗", nom: "Qat'iyat",        ru: "Упорство",
    izoh: "50 kun davomida shu yerda bo'ldingiz",
    ruIzoh: "Вы были здесь на протяжении 50 дней",
    shart: (h) => h.kunlar >= 50 },

  // ——— sifat: to'g'ri javob emas, XATONI TUZATISH nishonlanadi
  { kod: "xato10",    emoji: "🔁", nom: "Xato ustida ish", ru: "Работа над ошибками",
    izoh: "10 ta xatoyingizni tuzatib chiqdingiz",
    ruIzoh: "Вы исправили 10 своих ошибок",
    shart: (h) => h.tuzatilgan >= 10 },

  { kod: "xato50",    emoji: "🛠", nom: "Usta",            ru: "Мастер",
    izoh: "50 ta xato tuzatildi — aynan shu yerda o'rganish bo'ladi",
    ruIzoh: "Исправлено 50 ошибок — именно здесь и происходит учение",
    shart: (h) => h.tuzatilgan >= 50 },

  { kod: "toliq",     emoji: "🎯", nom: "Benuqson kun",    ru: "Безупречный день",
    izoh: "Kunlik viktorinada bitta ham xato qilmadingiz",
    ruIzoh: "В тесте дня вы не допустили ни одной ошибки",
    shart: (h) => h.toliqKun >= 1 },

  // ——— ingliz tili: aniq savollarga to'g'ri javob (har xil savol hisoblanadi)
  { kod: "ing15",     emoji: "🇬🇧", nom: "Grammatika boshlovchisi", ru: "Начинающий грамматист", en: "Grammar Starter",
    izoh: "15 ta ingliz tili savoliga to'g'ri javob berdingiz",
    ruIzoh: "Вы правильно ответили на 15 вопросов по английскому",
    enIzoh: "You answered 15 English questions correctly",
    shart: (h) => h.inglizTogri >= 15 },

  { kod: "ing50",     emoji: "🎓", nom: "Zamonlar ustasi", ru: "Мастер времён", en: "Tenses Master",
    izoh: "50 ta ingliz tili savoliga to'g'ri javob berdingiz — zamonlar va qoidalar sizga yoqdi",
    ruIzoh: "50 правильных ответов по английскому — времена и правила вам по силам",
    enIzoh: "50 correct English answers — tenses and rules are yours",
    shart: (h) => h.inglizTogri >= 50 },

  // ——— qiyin savollar
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

  // ——— yakun: marafonning o'zi
  { kod: "yarim",     emoji: "⛰", nom: "Yarim yo'l",      ru: "Половина пути",
    izoh: "Marafonning yarmidan oshdingiz",
    ruIzoh: "Вы прошли больше половины марафона",
    shart: (h) => h.fasl >= 7 },

  { kod: "marafon",   emoji: "🏆", nom: "Marafonchi",      ru: "Марафонец",
    izoh: "«Ilm olish sirlari» kitobini to'liq o'tdingiz",
    ruIzoh: "Вы полностью прошли книгу «Секреты обретения знаний»",
    shart: (h) => h.fasl >= 14 },
];

const EN = {
  ilk: ["First Step", "You answered your first question"],
  fasl1: ["Book Opened", "You completed the first stage of the marathon"],
  hafta: ["One Week", "You studied 7 days in a row"],
  oy: ["One Month", "30 days in a row — not everyone can do that"],
  qatiyat: ["Perseverance", "You've been here for 50 days"],
  xato10: ["Working on Mistakes", "You corrected 10 of your mistakes"],
  xato50: ["Craftsman", "50 mistakes corrected — this is where learning happens"],
  toliq: ["Flawless Day", "No mistakes in the daily quiz"],
  yarim: ["Halfway", "You're past the middle of the marathon"],
  marafon: ["Marathoner", "You completed the whole book “Secrets of Learning”"],
};
for (const y of YUTUQLAR) { if (EN[y.kod]) { y.en = EN[y.kod][0]; y.enIzoh = EN[y.kod][1]; } }
export const yNom = (y, l) => (l === "ru" ? y.ru : l === "en" ? (y.en || y.nom) : y.nom);
export const yIzoh = (y, l) => (l === "ru" ? y.ruIzoh : l === "en" ? (y.enIzoh || y.izoh) : y.izoh);

export const yutuqTop = (kod) => YUTUQLAR.find((y) => y.kod === kod) || null;

/**
 * Holatga qarab qaysi yutuqlar berilishi kerakligini aniqlaydi.
 * Bergan yutuqlarni bilmaydi — uni chaqiruvchi tomon filtrlaydi.
 */
export function layoqatli(holat) {
  return YUTUQLAR.filter((y) => {
    try { return y.shart(holat); } catch { return false; }
  }).map((y) => y.kod);
}
