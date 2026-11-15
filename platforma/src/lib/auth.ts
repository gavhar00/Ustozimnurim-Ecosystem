import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { Rol } from "@/lib/rollar";

export { ROL_NOMI, type Rol } from "@/lib/rollar";

export type Profil = {
  id: string;
  email: string | null;
  toliq_ism: string;
  rol: Rol;
  avatar_url: string | null;
};

/**
 * Joriy foydalanuvchi profili. Kirilmagan bo‘lsa yoki baza ulanmagan bo‘lsa — null.
 * Server komponentlarida ishlatiladi.
 */
export async function joriyProfil(): Promise<Profil | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profillar")
    .select("id, toliq_ism, rol, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profilni olishda xato:", error.message);
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    toliq_ism: data?.toliq_ism?.trim() || (user.email ?? "Foydalanuvchi"),
    rol: (data?.rol as Rol) ?? "oquvchi",
    avatar_url: (data?.avatar_url as string | null) ?? null,
  };
}

/** Kirishni talab qiladi — aks holda kirish sahifasiga yuboradi. */
export async function profilTalabQil(keyin = "/panel"): Promise<Profil> {
  const profil = await joriyProfil();
  if (!profil) {
    redirect(`/kirish?keyin=${encodeURIComponent(keyin)}`);
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
