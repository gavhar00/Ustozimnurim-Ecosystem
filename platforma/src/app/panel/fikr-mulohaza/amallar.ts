"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { FIKR_TURLARI } from "@/lib/fikr-turlari";

export type FikrNatijasi = { xato?: string; muvaffaqiyat?: string };

export async function fikrYubor(_o: FikrNatijasi, formData: FormData): Promise<FikrNatijasi> {
  const turi = String(formData.get("turi") ?? "");
  const matn = String(formData.get("matn") ?? "").trim();

  if (!(turi in FIKR_TURLARI)) return { xato: "Turini tanlang." };
  if (matn.length < 10) return { xato: "Fikringiz kamida 10 ta belgi bo‘lsin." };
  if (matn.length > 1000) return { xato: "Fikr 1000 ta belgidan oshmasin." };

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const { error } = await supabase.from("fikrlar").insert({ turi, matn });
  if (error) {
    console.error("Fikr yuborishda xato:", error.message);
    return { xato: "Yuborib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring." };
  }
  revalidatePath("/panel/fikr-mulohaza");
  return { muvaffaqiyat: "Rahmat! Fikringiz jamoaga yuborildi." };
}
