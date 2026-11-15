import { supabaseServer } from "@/lib/supabase/server";
import type { Kurs, Modul } from "@/lib/turlar";

/**
 * Kurslar ro‘yxati — faqat bazadan.
 * Baza ulanmagan yoki so‘rov muvaffaqiyatsiz bo‘lsa, bo‘sh ro‘yxat qaytadi
 * va sahifa "hali kurs yo‘q" holatini ko‘rsatadi. Soxta kurs yaratilmaydi.
 */
export async function kurslarRoyxati(): Promise<Kurs[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("kurslar")
    .select(
      "id, slug, nom, qisqa_tavsif, tavsif, daraja, yonalish_slug, davomiylik_daqiqa, darslar_soni, ustoz_ismi, pro",
    )
    .eq("holat", "chop_etilgan")
    .order("yaratilgan", { ascending: false });

  if (error) {
    console.error("Kurslarni olishda xato:", error.message);
    return [];
  }

  return (data ?? []) as Kurs[];
}

/** Bitta kurs — topilmasa null. */
export async function kursTopish(slug: string): Promise<Kurs | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("kurslar")
    .select(
      "id, slug, nom, qisqa_tavsif, tavsif, daraja, yonalish_slug, davomiylik_daqiqa, darslar_soni, ustoz_ismi, pro",
    )
    .eq("slug", slug)
    .eq("holat", "chop_etilgan")
    .maybeSingle();

  if (error) {
    console.error("Kursni olishda xato:", error.message);
    return null;
  }

  return (data as Kurs | null) ?? null;
}

/** Kursning o‘quv rejasi — modullar va ulardagi darslar. */
export async function kursRejasi(kursId: string): Promise<Modul[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("modullar")
    .select(
      "id, nom, tartib, darslar(id, kurs_id, slug, nom, tartib, turi, davomiylik_daqiqa)",
    )
    .eq("kurs_id", kursId)
    .order("tartib", { ascending: true });

  if (error) {
    console.error("O‘quv rejasini olishda xato:", error.message);
    return [];
  }

  return (data ?? []).map((modul) => ({
    id: modul.id as string,
    nom: modul.nom as string,
    darslar: ((modul.darslar ?? []) as Modul["darslar"]).sort(
      (a, b) => a.tartib - b.tartib,
    ),
  }));
}
