"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { AdminHolati } from "@/app/admin/amallar";

export async function lahzaHolati(id: string, holat: "tasdiqlangan" | "rad" | "kutilmoqda"): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { error } = await supabase.from("lahzalar").update({ holat }).eq("id", id);
  if (error) return { xato: "O‘zgartirib bo‘lmadi." };
  revalidatePath("/admin/lahzalar");
  revalidatePath("/lahzalar");
  revalidatePath("/panel/lahzalarim");
  return { muvaffaqiyat: "Saqlandi." };
}
