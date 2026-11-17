import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { Rol } from "@/lib/rollar";
import {
  PROFIL_TOLDIRISH_CHEGARASI,
  profilToldirishFoizi,
  xavfsizIchkiManzil,
} from "@/lib/profil-toldirish";

export { ROL_NOMI, type Rol } from "@/lib/rollar";

export type Profil = {
  id: string;
  email: string | null;
  toliq_ism: string;
  rol: Rol;
  avatar_url: string | null;
  toldirishFoizi: number;
};

/**
 * Joriy foydalanuvchi profili. Kirilmagan bo‘lsa yoki baza ulanmagan bo‘lsa — null.
 * Server komponentlarida ishlatiladi.
 */
export const joriyProfil = cache(async function joriyProfil(): Promise<Profil | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profillar")
    .select("id, toliq_ism, rol, avatar_url, talim, sinf_kurs, joylashuv, qiziqishlar, organish_yonalishlari, organmoqchi_konikmalar, mavjud_konikmalar, maqsad, bio")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profilni olishda xato:", error.message);
    return null;
  }

  const { data: shaxsiy, error: shaxsiyXatosi } = await supabase
    .from("profil_shaxsiy")
    .select("tugilgan_sana")
    .eq("profil_id", user.id)
    .maybeSingle();

  const toldirishFoizi = shaxsiyXatosi
    ? 0
    : profilToldirishFoizi({
        ...data,
        tugilgan_sana: shaxsiy?.tugilgan_sana,
      });

  return {
    id: user.id,
    email: user.email ?? null,
    toliq_ism: data?.toliq_ism?.trim() || (user.email ?? "Foydalanuvchi"),
    rol: (data?.rol as Rol) ?? "oquvchi",
    avatar_url: (data?.avatar_url as string | null) ?? null,
    toldirishFoizi,
  };
});

/** Kirishni talab qiladi — aks holda kirish sahifasiga yuboradi. */
export async function profilTalabQil(keyin = "/panel"): Promise<Profil> {
  const profil = await joriyProfil();
  if (!profil) {
    redirect(`/kirish?keyin=${encodeURIComponent(keyin)}`);
  }
  const protectedLearnerRoute =
    keyin.startsWith("/panel") ||
    keyin.startsWith("/admin") ||
    /^\/kurslar\/[^/]+\/dars\/[^/]+/.test(keyin);
  if (
    protectedLearnerRoute &&
    profil.toldirishFoizi < PROFIL_TOLDIRISH_CHEGARASI
  ) {
    redirect(`/profil/toldirish?keyin=${encodeURIComponent(xavfsizIchkiManzil(keyin))}`);
  }
  return profil;
}

/**
 * Berilgan rollardan birini talab qiladi.
 * Rol mos kelmasa — 403 o‘rniga bosh panelga qaytaradi.
 */
export async function rolTalabQil(
  ruxsatEtilgan: Rol[],
  keyin = "/panel",
): Promise<Profil> {
  const profil = await profilTalabQil(keyin);
  if (!ruxsatEtilgan.includes(profil.rol)) {
    redirect("/panel");
  }
  return profil;
}
