"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type TadbirNatijasi = { xato?: string; muvaffaqiyat?: boolean };

export async function royxatdanOtish(tadbirId: string, slug: string): Promise<TadbirNatijasi> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase.from("tadbir_royxati").insert({ tadbir_id: tadbirId });
  if (error) {
    if (error.message.includes("duplicate")) return { muvaffaqiyat: true };
    if (error.message.includes("joy qolmagan")) return { xato: "Afsuski, tadbirda joy qolmagan." };
    console.error("Tadbirga yozilishda xato:", error.message);
    return { xato: "Yozilib bo‘lmadi. Tadbir tugagan bo‘lishi mumkin." };
  }
  revalidatePath(`/tadbirlar/${slug}`);
  return { muvaffaqiyat: true };
}

export async function royxatdanChiqish(tadbirId: string, slug: string): Promise<TadbirNatijasi> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase
    .from("tadbir_royxati")
    .delete()
    .eq("tadbir_id", tadbirId)
    .eq("profil_id", user.id);
  if (error) {
    console.error("Ro‘yxatdan chiqishda xato:", error.message);
    return { xato: "Bekor qilib bo‘lmadi." };
  }
  revalidatePath(`/tadbirlar/${slug}`);
  return { muvaffaqiyat: true };
}
