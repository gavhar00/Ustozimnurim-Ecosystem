import { supabaseServer } from "@/lib/supabase/server";
import type { FikrHolati, FikrTuri } from "@/lib/fikr-turlari";

export type Fikr = {
  id: string;
  turi: FikrTuri;
  matn: string;
  holat: FikrHolati;
  admin_javobi: string | null;
  yaratilgan: string;
  muallif?: string;
};

/** Foydalanuvchining o‘z fikrlari (RLS shuni kafolatlaydi). */
export async function menimFikrlarim(profilId: string): Promise<Fikr[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("fikrlar")
    .select("id, turi, matn, holat, admin_javobi, yaratilgan")
    .eq("profil_id", profilId)
    .order("yaratilgan", { ascending: false });
  if (error) {
    console.error("Fikrlarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as Fikr[];
}

/** Admin uchun — hammasi, muallif ismi bilan. */
export async function adminFikrlari(): Promise<Fikr[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("fikrlar")
    .select("id, turi, matn, holat, admin_javobi, yaratilgan, profillar(toliq_ism)")
    .order("yaratilgan", { ascending: false });
  if (error) {
    console.error("Fikrlarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []).map((q) => {
    const p = q.profillar as { toliq_ism?: string } | { toliq_ism?: string }[] | null;
    const ism = Array.isArray(p) ? p[0]?.toliq_ism : p?.toliq_ism;
    return { ...(q as unknown as Fikr), muallif: ism ?? "Noma’lum" };
  });
}
