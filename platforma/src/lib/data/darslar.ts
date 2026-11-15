import { supabaseServer } from "@/lib/supabase/server";
import type { Dars } from "@/lib/turlar";

export type DarsToliq = Dars & {
  video_url: string | null;
  yoriqnoma: string | null;
  boshlangich_kod: string | null;
  kurs_nomi: string;
  kurs_slug: string;
};

export type DarsHolati = {
  tugatilgan: boolean;
  saqlangan_kod: string | null;
};

/** Bitta dars — kurs slug va dars slug bo'yicha. Topilmasa null. */
export async function darsTopish(
  kursSlug: string,
  darsSlug: string,
): Promise<DarsToliq | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("darslar")
    .select(
      "id, kurs_id, slug, nom, tartib, turi, davomiylik_daqiqa, video_url, yoriqnoma, boshlangich_kod, kurslar!inner(nom, slug)",
    )
    .eq("slug", darsSlug)
    .eq("kurslar.slug", kursSlug)
    .eq("holat", "chop_etilgan")
    .maybeSingle();

  if (error) {
    console.error("Darsni olishda xato:", error.message);
    return null;
  }
  if (!data) return null;

  const qator = data as unknown as Dars & {
    video_url: string | null;
    yoriqnoma: string | null;
    boshlangich_kod: string | null;
    kurslar: { nom: string; slug: string };
  };

  return {
    ...qator,
    kurs_nomi: qator.kurslar.nom,
    kurs_slug: qator.kurslar.slug,
  };
}

/** Kursning chop etilgan darslari — tartib bo'yicha. */
export async function kursDarslari(kursId: string): Promise<Dars[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("darslar")
    .select("id, kurs_id, slug, nom, tartib, turi, davomiylik_daqiqa")
    .eq("kurs_id", kursId)
    .eq("holat", "chop_etilgan")
    .order("tartib", { ascending: true });

  if (error) {
    console.error("Kurs darslarini olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as Dars[];
}

/** O'quvchining shu darsdagi holati — tugatilganmi va saqlangan kodi. */
export async function darsHolati(
  foydalanuvchiId: string,
  darsId: string,
): Promise<DarsHolati | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("dars_jarayoni")
    .select("tugatilgan, saqlangan_kod")
    .eq("foydalanuvchi_id", foydalanuvchiId)
    .eq("dars_id", darsId)
    .maybeSingle();

  if (error) {
    console.error("Dars holatini olishda xato:", error.message);
    return null;
  }
  return (data as DarsHolati | null) ?? null;
}

/** Foydalanuvchi shu kursga yozilganmi. */
export async function yozilganmi(
  foydalanuvchiId: string,
  kursId: string,
): Promise<boolean> {
  const supabase = await supabaseServer();
  if (!supabase) return false;

  const { count, error } = await supabase
    .from("yozilishlar")
    .select("*", { count: "exact", head: true })
    .eq("foydalanuvchi_id", foydalanuvchiId)
    .eq("kurs_id", kursId);

  if (error) {
    console.error("Yozilishni tekshirishda xato:", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}
