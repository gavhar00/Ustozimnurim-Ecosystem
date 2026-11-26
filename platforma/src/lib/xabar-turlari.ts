export const XABAR_BUCKET = "xabar-fayllari";
export const XABAR_MAKS_MATN = 2000;
export const XABAR_MAKS_BAYT = 10 * 1024 * 1024; // 10 MB

/** Omborxona ruxsat bergan fayl turlari (kengaytma → mime). */
export const XABAR_FAYL_TURLARI: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export type Suhbat = {
  id: string;
  toliq_ism: string;
  username: string | null;
  avatar_url: string | null;
  onlayn: boolean;
  oxirgi_matn: string | null;
  oxirgi_fayl_turi: "rasm" | "fayl" | null;
  oxirgi_men: boolean | null;
  oxirgi_vaqt: string | null;
  oqilmagan: number;
};

export type Xabar = {
  id: string;
  men: boolean;
  matn: string | null;
  fayl_url: string | null;
  fayl_nomi: string | null;
  fayl_turi: "rasm" | "fayl" | null;
  fayl_hajmi: number | null;
  oqilgan: string | null;
  yaratilgan: string;
};

export type SuhbatDueli = {
  id: string;
  holat: string;
  yonalish: string;
  qiyinlik: string;
  men_chaqirdim: boolean;
  galib_id: string | null;
  yaratilgan: string;
};

export type SuhbatMalumoti = {
  boshqa: {
    id: string;
    toliq_ism: string;
    username: string | null;
    avatar_url: string | null;
    oxirgi_faollik: string | null;
    onlayn: boolean;
  };
  xabarlar: Xabar[];
  duellar: SuhbatDueli[];
};

export function hajmMatni(bayt: number | null): string {
  if (!bayt) return "";
  if (bayt < 1024 * 1024) return `${Math.max(1, Math.round(bayt / 1024))} KB`;
  return `${(bayt / 1024 / 1024).toFixed(1)} MB`;
}
