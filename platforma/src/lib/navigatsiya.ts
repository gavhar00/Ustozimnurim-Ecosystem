/** Saytning asosiy navigatsiyasi — bir joyda saqlanadi. */
export const ASOSIY_MENU = [
  { nom: "Asosiy", href: "/" },
  { nom: "Kurslar", href: "/kurslar" },
  { nom: "Yo‘nalishlar", href: "/yonalishlar" },
  { nom: "Hamjamiyat", href: "/hamjamiyat" },
  { nom: "Tadbirlar", href: "/tadbirlar" },
  { nom: "Lahzalar", href: "/lahzalar" },
  { nom: "Notlar", href: "/notlar" },
] as const;

export const FOOTER_HAVOLALAR = [
  {
    sarlavha: "Platforma",
    havolalar: [
      { nom: "Kurslar", href: "/kurslar" },
      { nom: "Yo‘nalishlar", href: "/yonalishlar" },
      { nom: "Interaktiv darslar", href: "/kurslar" },
      { nom: "Notlar", href: "/notlar" },
    ],
  },
  {
    sarlavha: "Hamjamiyat",
    havolalar: [
      { nom: "Munozaralar", href: "/hamjamiyat" },
      { nom: "Savol-javob", href: "/hamjamiyat" },
      { nom: "Loyihalar", href: "/hamjamiyat" },
      { nom: "Tadbirlar", href: "/tadbirlar" },
      { nom: "Lahzalar", href: "/lahzalar" },
    ],
  },
  {
    sarlavha: "Biz haqimizda",
    havolalar: [
      { nom: "Missiyamiz", href: "/biz-haqimizda" },
      { nom: "Jamoa", href: "/biz-haqimizda" },
      { nom: "Aloqa", href: "mailto:info@ustozimnurim.uz" },
    ],
  },
] as const;
