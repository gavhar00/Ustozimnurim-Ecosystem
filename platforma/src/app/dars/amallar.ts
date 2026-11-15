"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type AmalNatijasi = { xato?: string; muvaffaqiyat?: string };

/** Kursga yozilish. */
export async function kursgaYozil(kursId: string): Promise<AmalNatijasi> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase
    .from("yozilishlar")
    .insert({ foydalanuvchi_id: user.id, kurs_id: kursId });

  // Takroriy yozilish xatosi (unique) — muammo emas
  if (error && !error.message.includes("duplicate")) {
    console.error("Kursga yozilishda xato:", error.message);
    return { xato: "Yozilishda xatolik yuz berdi." };
  }

  revalidatePath("/panel");
  revalidatePath("/panel/kurslarim");
  return { muvaffaqiyat: "Kursga yozildingiz." };
}

/** Dars jarayonini saqlash: yozilgan kod va/yoki tugatilgan belgisi. */
export async function darsniSaqla(
  darsId: string,
  saqlanganKod: string,
  tugatilgan: boolean,
): Promise<AmalNatijasi> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase.from("dars_jarayoni").upsert(
    {
      foydalanuvchi_id: user.id,
      dars_id: darsId,
      saqlangan_kod: saqlanganKod.slice(0, 20000),
      tugatilgan,
      yangilangan: new Date().toISOString(),
    },
    { onConflict: "foydalanuvchi_id,dars_id" },
  );

  if (error) {
    console.error("Jarayonni saqlashda xato:", error.message);
    return { xato: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/panel");
  revalidatePath("/panel/kurslarim");
  return { muvaffaqiyat: tugatilgan ? "Dars tugatildi." : "Kod saqlandi." };
}
