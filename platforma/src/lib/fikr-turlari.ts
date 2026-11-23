export const FIKR_TURLARI = {
  taklif: "Taklif",
  xato: "Xato haqida",
  savol: "Savol",
  minnatdorchilik: "Minnatdorchilik",
} as const;
export type FikrTuri = keyof typeof FIKR_TURLARI;

export const FIKR_HOLATLARI = {
  yangi: "Yangi",
  korib_chiqildi: "Ko‘rib chiqildi",
  yopilgan: "Yopilgan",
} as const;
export type FikrHolati = keyof typeof FIKR_HOLATLARI;
