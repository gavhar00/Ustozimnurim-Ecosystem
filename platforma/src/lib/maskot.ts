/**
 * Maskot rasmlari.
 *
 * Fayllar `public/maskot/` papkasida. Yangi poza qo‘shilganda shu yerga
 * yo‘lini yozing. Qiymat `null` bo‘lsa, interfeys soxta rasm ko‘rsatmaydi,
 * faqat joy ajratadi.
 */
export const MASKOT = {
  /** Bosh sahifa hero — noutbuk oldida, qo‘l silkitgan poza. */
  hero: "/maskot/hero.webp" as string | null,
  /** Interaktiv ta'lim bloki — bitiruv shapkasida, planshet bilan. */
  interaktiv: null as string | null,
  /** Dars ichidagi kichik ko‘rinish. */
  kichik: null as string | null,
} as const;
