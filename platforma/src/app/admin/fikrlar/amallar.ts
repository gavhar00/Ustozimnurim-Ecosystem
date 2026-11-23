"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { FIKR_HOLATLARI } from "@/lib/fikr-turlari";
import type { AdminHolati } from "@/app/admin/amallar";

export async function fikrniYangila(_o: AdminHolati, formData: FormData): Promise<AdminHolati> {
  const id = String(formData.get("id") ?? "");
  const holat = String(formData.get("holat") ?? "");
  const javob = String(formData.get("javob") ?? "").trim();

  if (!id) return { xato: "Fikr topilmadi." };
  if (!(holat in FIKR_HOLATLARI)) return { xato: "Holatni tanlang." };
  if (javob.length > 1000) return { xato: "Javob 1000 ta belgidan oshmasin." };

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { error } = await supabase
    .from("fikrlar")
    .update({ holat, admin_javobi: javob || null })
    .eq("id", id);
  if (error) {
    console.error("Fikrni yangilashda xato:", error.message);
    return { xato: "Saqlab bo‘lmadi. Admin huquqingizni tekshiring." };
  }
  revalidatePath("/admin/fikrlar");
  revalidatePath("/panel/fikr-mulohaza");
  return { muvaffaqiyat: "Saqlandi." };
}
