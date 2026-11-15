"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type BildirishnomaHolati = { xato?: string };

/** Bitta bildirishnomani o'qilgan deb belgilaydi. */
export async function oqilganDebBelgila(
  id: string,
): Promise<BildirishnomaHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { error } = await supabase
    .from("bildirishnomalar")
    .update({ oqilgan: true })
    .eq("id", id);

  if (error) {
    console.error("Belgilashda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/panel", "layout");
  return {};
}

/** Barchasini o'qilgan deb belgilaydi. */
export async function barchasiniOqilganDebBelgila(): Promise<BildirishnomaHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan." };

  const { error } = await supabase
    .from("bildirishnomalar")
    .update({ oqilgan: true })
    .eq("qabul_qiluvchi_id", user.id)
    .eq("oqilgan", false);

  if (error) {
    console.error("Belgilashda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/panel", "layout");
  return {};
}
