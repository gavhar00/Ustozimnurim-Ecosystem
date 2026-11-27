import type { AmaliyotTili } from "@/lib/amaliyot-turlari";

export type Vazifa = {
  id: string;
  tartib: number;
  nom: string;
  tavsif: string;
  fayl_nomi: string | null;
  muddat_soat: number;
  holat: "qoralama" | "chop_etilgan";
};

export type Urinish = {
  vazifa_id: string;
  boshlangan: string;
  muddat: string;
  topshirilgan: string | null;
  til: AmaliyotTili;
  html: string;
  css: string;
  js: string;
  python: string;
};

/** kutmoqda — hali boshlanmagan; faol — muddat ichida; topshirilgan; otkazilgan — muddat tugagan. */
export type VazifaHolati = "kutmoqda" | "faol" | "topshirilgan" | "otkazilgan";

export function vazifaHolati(u: Urinish | undefined, hozir: number): VazifaHolati {
  if (!u) return "kutmoqda";
  if (u.topshirilgan) return "topshirilgan";
  return new Date(u.muddat).getTime() > hozir ? "faol" : "otkazilgan";
}
