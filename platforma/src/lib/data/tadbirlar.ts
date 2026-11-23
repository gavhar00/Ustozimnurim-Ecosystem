import { supabaseServer } from "@/lib/supabase/server";

export type Tadbir = {
  id: string;
  slug: string;
  nom: string;
  tavsif: string;
  joy: string | null;
  boshlanish: string;
  sigim: number | null;
  holat: "qoralama" | "chop_etilgan";
};

const USTUNLAR = "id, slug, nom, tavsif, joy, boshlanish, sigim, holat";

/** Chop etilgan tadbirlar (RLS faqat shularni ko‘rsatadi). */
export async function tadbirlarRoyxati(): Promise<Tadbir[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tadbirlar")
    .select(USTUNLAR)
    .eq("holat", "chop_etilgan")
    .order("boshlanish", { ascending: true });
  if (error) {
    console.error("Tadbirlarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as Tadbir[];
}

/** Admin uchun — qoralamalari bilan, yangisi birinchi. */
export async function adminTadbirlari(): Promise<(Tadbir & { royxatdan: number })[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tadbirlar")
    .select(USTUNLAR)
    .order("boshlanish", { ascending: false });
  if (error) {
    console.error("Tadbirlarni olishda xato:", error.message);
    return [];
  }
  const royxat = (data ?? []) as Tadbir[];
  const sonlar = await Promise.all(royxat.map((t) => qatnashchilarSoni(t.id)));
  return royxat.map((t, i) => ({ ...t, royxatdan: sonlar[i] }));
}

export async function tadbirTopish(slug: string): Promise<Tadbir | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tadbirlar")
    .select(USTUNLAR)
    .eq("slug", slug)
    .eq("holat", "chop_etilgan")
    .maybeSingle();
  if (error) {
    console.error("Tadbirni olishda xato:", error.message);
    return null;
  }
  return (data as Tadbir | null) ?? null;
}

export async function qatnashchilarSoni(tadbirId: string): Promise<number> {
  const supabase = await supabaseServer();
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("tadbir_qatnashchilari", { p_tadbir: tadbirId });
  if (error) {
    console.error("Qatnashchilar sonini olishda xato:", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

/** Joriy foydalanuvchi shu tadbirga yozilganmi (kirmagan bo‘lsa — null). */
export async function menYozilganmi(tadbirId: string): Promise<boolean | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("tadbir_royxati")
    .select("id")
    .eq("tadbir_id", tadbirId)
    .eq("profil_id", user.id)
    .maybeSingle();
  return Boolean(data);
}
