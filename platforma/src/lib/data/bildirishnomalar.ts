import { supabaseServer } from "@/lib/supabase/server";

export type BildirishnomaTuri =
  | "boglanish_sorovi"
  | "sorov_qabul"
  | "yangi_kuzatuvchi"
  | "post_yoqtirildi"
  | "javob_yozildi";

export type Bildirishnoma = {
  id: string;
  turi: BildirishnomaTuri;
  matn: string;
  havola: string | null;
  oqilgan: boolean;
  yaratilgan: string;
};

/** Foydalanuvchining bildirishnomalari — eng yangisidan. */
export async function bildirishnomalar(): Promise<Bildirishnoma[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bildirishnomalar")
    .select("id, turi, matn, havola, oqilgan, yaratilgan")
    .order("yaratilgan", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Bildirishnomalarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as Bildirishnoma[];
}

/** O'qilmagan bildirishnomalar soni — navbardagi nishon uchun. */
export async function oqilmaganSoni(): Promise<number> {
  const supabase = await supabaseServer();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("bildirishnomalar")
    .select("*", { count: "exact", head: true })
    .eq("oqilgan", false);

  if (error) {
    console.error("O‘qilmaganlarni sanashda xato:", error.message);
    return 0;
  }
  return count ?? 0;
}
