/** Lahzalar lentasi uchun umumiy turlar (brauzer ham, server ham ishlatadi). */
import type { LentaMuallif } from "@/lib/lenta-turlari";

export const LAHZA_MAKS_SOZ = 5000;
export const LAHZA_SAHIFA_HAJMI = 10;

/** Bo'shliqlar bo'yicha so'zlar soni (bazadagi cheklov bilan bir xil usul). */
export function sozlarSoni(matn: string): number {
  const t = matn.trim();
  return t ? t.split(/\s+/).length : 0;
}

export type LahzaAsos = {
  id: string;
  profil_id: string;
  matn: string;
  rasmlar: string[];
  layklar_soni: number;
  izohlar_soni: number;
  repostlar_soni: number;
  yaratilgan: string;
  yangilangan: string | null;
  ozim_layk: boolean;
  ozim_repost: boolean;
  muallif: LentaMuallif;
};

/** Repost bo‘lsa `asl` — asl lahza; layk/izoh/repost shu asl lahzaga tegishli. */
export type LahzaPost = LahzaAsos & {
  asl_id: string | null;
  asl: LahzaAsos | null;
};

export type LahzaIzoh = {
  id: string;
  lahza_id: string;
  muallif_id: string;
  matn: string;
  yaratilgan: string;
  muallif: LentaMuallif;
};

export type LahzaLaykchi = {
  yaratilgan: string;
  profil: LentaMuallif;
};
