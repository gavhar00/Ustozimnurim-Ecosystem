export const PROFIL_TOLDIRISH_CHEGARASI = 60;

export type ProfilToldirishMaydonlari = {
  toliq_ism?: string | null;
  avatar_url?: string | null;
  tugilgan_sana?: string | null;
  talim?: string | null;
  sinf_kurs?: string | null;
  joylashuv?: string | null;
  qiziqishlar?: string[] | null;
  organish_yonalishlari?: string[] | null;
  organmoqchi_konikmalar?: string[] | null;
  mavjud_konikmalar?: string[] | null;
  maqsad?: string | null;
  bio?: string | null;
};

export function profilToldirishFoizi(
  profil: ProfilToldirishMaydonlari | null | undefined,
): number {
  if (!profil) return 0;
  const ismQismlari = (profil.toliq_ism ?? "").trim().split(/\s+/).filter(Boolean);
  const bajarilgan = [
    Boolean(ismQismlari[0]),
    Boolean(ismQismlari.length > 1),
    Boolean(profil.avatar_url?.trim()),
    Boolean(profil.tugilgan_sana),
    Boolean(profil.talim?.trim()),
    Boolean(profil.sinf_kurs?.trim()),
    Boolean(profil.joylashuv?.trim()),
    Boolean(profil.qiziqishlar?.length),
    Boolean(profil.organish_yonalishlari?.length),
    Boolean(profil.organmoqchi_konikmalar?.length),
    Boolean(profil.mavjud_konikmalar?.length),
    Boolean(profil.maqsad?.trim()),
    Boolean(profil.bio?.trim()),
  ].filter(Boolean).length;

  return Math.floor((bajarilgan / 13) * 100);
}

export function xavfsizIchkiManzil(manzil: string | null | undefined): string {
  if (
    !manzil ||
    !manzil.startsWith("/") ||
    manzil.startsWith("//") ||
    manzil.includes("\\") ||
    /[\u0000-\u001f]/.test(manzil)
  ) return "/panel";
  if (manzil.startsWith("/profil/toldirish")) return "/panel";
  const parsed = new URL(manzil, "https://internal.invalid");
  return parsed.origin === "https://internal.invalid"
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : "/panel";
}
