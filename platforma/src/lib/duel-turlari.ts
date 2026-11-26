export const DUEL_YONALISHLARI = [
  { id: "html", nom: "HTML" },
  { id: "css", nom: "CSS" },
  { id: "javascript", nom: "JavaScript" },
  { id: "python", nom: "Python" },
] as const;

export const DUEL_QIYINLIK = [
  { id: "oson", nom: "Oson" },
  { id: "orta", nom: "O‘rta" },
  { id: "qiyin", nom: "Qiyin" },
] as const;

export const DUEL_DAVOMIYLIKLARI = [
  { soniya: 60, nom: "1 daqiqa" },
  { soniya: 120, nom: "2 daqiqa" },
  { soniya: 180, nom: "3 daqiqa" },
  { soniya: 300, nom: "5 daqiqa" },
] as const;

export const DUEL_VAZIFALAR_SONI = [3, 5, 8] as const;

export const yonalishNomi = (id: string) =>
  DUEL_YONALISHLARI.find((y) => y.id === id)?.nom ?? id;
export const qiyinlikNomi = (id: string) =>
  DUEL_QIYINLIK.find((q) => q.id === id)?.nom ?? id;

export type DuelHolatiNomi =
  | "kutilmoqda"
  | "qabul_qilindi"
  | "boshlandi"
  | "tugadi"
  | "rad"
  | "bekor";

export const HOLAT_NOMI: Record<DuelHolatiNomi, string> = {
  kutilmoqda: "Javob kutilmoqda",
  qabul_qilindi: "Boshlashga tayyor",
  boshlandi: "Davom etmoqda",
  tugadi: "Tugagan",
  rad: "Rad etilgan",
  bekor: "Bekor qilingan",
};

export type DuelVazifasi = {
  tartib: number;
  savol: string;
  variantlar: string[];
  togri?: number;
};

/** `duel_holati` funksiyasi qaytaradigan holat. Raqib javoblari va to‘g‘ri javoblar faqat tugagach keladi. */
export type DuelHolati = {
  id: string;
  holat: DuelHolatiNomi;
  men_chaqiruvchi: boolean;
  chaqiruvchi_id: string;
  raqib_id: string;
  yonalish: string;
  qiyinlik: string;
  davomiylik: number;
  vazifalar_soni: number;
  chaqiruvchi_tayyor: boolean;
  raqib_tayyor: boolean;
  boshlanish: string | null;
  tugash: string | null;
  server_vaqti: string;
  galib_id: string | null;
  chaqiruvchi_ball: number | null;
  raqib_ball: number | null;
  chaqiruvchi_ozgarish: number | null;
  raqib_ozgarish: number | null;
  vazifalar?: DuelVazifasi[];
  mening_javoblarim?: { tartib: number; tanlov: number }[];
  raqib_javoblari?: { tartib: number; tanlov: number; togri: boolean }[];
  mening_togrilarim?: { tartib: number; togri: boolean }[];
};

export type DuelRaqibi = {
  id: string;
  toliq_ism: string;
  username: string | null;
  avatar_url: string | null;
  kasb: string | null;
  yonalish: string | null;
  reyting: number;
  galabalar: number;
};

export type DuelQatori = {
  id: string;
  holat: DuelHolatiNomi;
  men_chaqiruvchi: boolean;
  raqib: { id: string; toliq_ism: string; avatar_url: string | null };
  yonalish: string;
  qiyinlik: string;
  galib_id: string | null;
  mening_ballim: number | null;
  raqib_ball: number | null;
  mening_ozgarishim: number | null;
  yaratilgan: string;
};

export type TopQatori = {
  profil_id: string;
  toliq_ism: string;
  username: string | null;
  avatar_url: string | null;
  reyting: number;
  galabalar: number;
};
