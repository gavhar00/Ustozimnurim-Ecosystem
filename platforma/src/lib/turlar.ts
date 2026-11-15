/** Platformaning asosiy ma’lumot tiplari. Baza sxemasi shu nomlar bilan quriladi. */

export type Daraja = "boshlangich" | "orta" | "yuqori";

export const DARAJA_NOMI: Record<Daraja, string> = {
  boshlangich: "Boshlang‘ich",
  orta: "O‘rta",
  yuqori: "Yuqori",
};

export type Kurs = {
  id: string;
  slug: string;
  nom: string;
  qisqa_tavsif: string;
  tavsif: string | null;
  daraja: Daraja;
  yonalish_slug: string;
  davomiylik_daqiqa: number;
  darslar_soni: number;
  ustoz_ismi: string | null;
  pro: boolean;
};

export type DarsTuri = "video" | "amaliyot" | "test";

export const DARS_TURI_NOMI: Record<DarsTuri, string> = {
  video: "Video dars",
  amaliyot: "Amaliyot",
  test: "Test",
};

export type Dars = {
  id: string;
  kurs_id: string;
  slug: string;
  nom: string;
  tartib: number;
  turi: DarsTuri;
  davomiylik_daqiqa: number;
};

export type Modul = {
  id: string;
  nom: string;
  darslar: Dars[];
};

export type Not = {
  id: string;
  slug: string;
  nom: string;
  qisqa_tavsif: string;
  turkum: string;
};

export type Munozara = {
  id: string;
  sarlavha: string;
  muallif_ismi: string;
  javoblar_soni: number;
  yaratilgan: string;
  turkum: string;
};

// --- Profil, ko'nikmalar va loyihalar ---

export type KonikmaTurkumi = "til" | "texnologiya" | "dizayn" | "yumshoq";

export const KONIKMA_TURKUMI_NOMI: Record<KonikmaTurkumi, string> = {
  til: "Dasturlash tili",
  texnologiya: "Texnologiya / framework",
  dizayn: "Dizayn",
  yumshoq: "Yumshoq ko‘nikma",
};

export type Konikma = {
  id: string;
  profil_id: string;
  nom: string;
  turkum: KonikmaTurkumi;
  daraja: Daraja;
};

export type LoyihaHolati = "goya" | "jarayonda" | "tugallangan";

export const LOYIHA_HOLATI_NOMI: Record<LoyihaHolati, string> = {
  goya: "G‘oya",
  jarayonda: "Jarayonda",
  tugallangan: "Tugallangan",
};

export type Loyiha = {
  id: string;
  muallif_id: string;
  nom: string;
  tavsif: string;
  texnologiyalar: string[];
  turkum: string;
  holat: LoyihaHolati;
  github_url: string | null;
  demo_url: string | null;
  muqova_url: string | null;
  yaratilgan: string;
};

export type Havolalar = {
  github?: string;
  telegram?: string;
  linkedin?: string;
  portfolio?: string;
};

export type ToliqProfil = {
  id: string;
  toliq_ism: string;
  username: string | null;
  bio: string | null;
  kasb: string | null;
  talim: string | null;
  joylashuv: string | null;
  maqsad: string | null;
  tillar: string[];
  qiziqishlar: string[];
  hamkorlikka_ochiq: boolean;
  avatar_url: string | null;
  muqova_url: string | null;
  havolalar: Havolalar;
  yaratilgan: string;
};

/** Profilda tanlash mumkin bo'lgan qiziqishlar. */
export const QIZIQISHLAR = [
  "Dasturlash",
  "Startaplar",
  "Sun’iy intellekt",
  "Dizayn",
  "Tadbirkorlik",
  "Fan",
  "Texnologiya",
  "Ta’lim",
  "O‘yin dasturlash",
  "Kiberxavfsizlik",
] as const;

/** Profilda tanlash mumkin bo'lgan kasblar. */
export const KASBLAR = [
  "O‘quvchi",
  "Dasturchi",
  "Dizayner",
  "Ustoz",
  "Tadbirkor",
  "Boshqa",
] as const;
