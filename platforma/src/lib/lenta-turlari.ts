/** Lenta uchun umumiy turlar va cheklovlar (brauzer ham, server ham ishlatadi). */

export const POST_BUCKET = "post-rasmlari";
export const POST_MAKS_MATN = 2000;
export const POST_MAKS_RASM = 4;
export const POST_MAKS_BAYT = 5 * 1024 * 1024; // 5 MB
export const IZOH_MAKS_MATN = 1000;

export const RASM_TURLARI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type LentaMuallif = {
  id: string;
  toliq_ism: string;
  username: string | null;
  avatar_url: string | null;
  kasb: string | null;
};

export type LentaPost = {
  id: string;
  muallif_id: string;
  matn: string;
  rasmlar: string[];
  yoqtirishlar_soni: number;
  izohlar_soni: number;
  yaratilgan: string;
  yangilangan: string | null;
  ozim_yoqtirdim: boolean;
  muallif: LentaMuallif;
};

export type LentaIzoh = {
  id: string;
  post_id: string;
  muallif_id: string;
  matn: string;
  yaratilgan: string;
  muallif: LentaMuallif;
};

export type AmalNatijasi<T = undefined> =
  | { ok: true; malumot: T }
  | { ok: false; xato: string };
