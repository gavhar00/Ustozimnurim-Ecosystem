"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type HamjamiyatHolati = { xato?: string };

const TURKUMLAR = [
  "Umumiy",
  "Frontend",
  "Backend",
  "Data Science",
  "UI/UX",
  "Karyera",
];

export async function turkumlar(): Promise<string[]> {
  return TURKUMLAR;
}

/** Yangi munozara ochadi va uning sahifasiga yo'naltiradi. */
export async function munozaraYarat(
  _oldingi: HamjamiyatHolati,
  formData: FormData,
): Promise<HamjamiyatHolati> {
  const sarlavha = String(formData.get("sarlavha") ?? "").trim();
  const matn = String(formData.get("matn") ?? "").trim();
  const turkum = String(formData.get("turkum") ?? "Umumiy").trim();

  if (sarlavha.length < 8) {
    return { xato: "Sarlavha kamida 8 ta belgidan iborat bo‘lsin." };
  }
  if (matn.length < 15) {
    return { xato: "Savol matni kamida 15 ta belgidan iborat bo‘lsin." };
  }
  if (!TURKUMLAR.includes(turkum)) {
    return { xato: "Noto‘g‘ri turkum tanlandi." };
  }

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Avval hisobingizga kiring." };

  const { data: profil } = await supabase
    .from("profillar")
    .select("toliq_ism")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("munozaralar")
    .insert({
      muallif_id: user.id,
      muallif_ismi:
        (profil?.toliq_ism as string | undefined)?.trim() || "Foydalanuvchi",
      sarlavha: sarlavha.slice(0, 200),
      matn: matn.slice(0, 8000),
      turkum,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Munozara yaratishda xato:", error?.message);
    return { xato: "Munozara ochishda xatolik yuz berdi." };
  }

  revalidatePath("/hamjamiyat");
  redirect(`/hamjamiyat/${data.id}`);
}

/** Munozaraga javob yozadi. */
export async function javobYoz(
  munozaraId: string,
  _oldingi: HamjamiyatHolati,
  formData: FormData,
): Promise<HamjamiyatHolati> {
  const matn = String(formData.get("matn") ?? "").trim();

  if (matn.length < 2) return { xato: "Javob juda qisqa." };

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase.from("javoblar").insert({
    munozara_id: munozaraId,
    muallif_id: user.id,
    matn: matn.slice(0, 8000),
  });

  if (error) {
    console.error("Javob yozishda xato:", error.message);
    return { xato: "Javob yuborishda xatolik yuz berdi." };
  }

  revalidatePath(`/hamjamiyat/${munozaraId}`);
  revalidatePath("/hamjamiyat");
  return {};
}
