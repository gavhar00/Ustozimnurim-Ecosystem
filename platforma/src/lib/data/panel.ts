import { supabaseServer } from "@/lib/supabase/server";
import type { Kurs } from "@/lib/turlar";

export type YozilganKurs = Kurs & {
  tugatilgan_darslar: number;
  yozilgan_sana: string;
};

export type PanelHisobi = {
  kurslar: number;
  tugatilgan_darslar: number;
  sertifikatlar: number;
};

/**
 * O‘quvchi yozilgan kurslar — faqat bazadan va faqat o‘zinikilar (RLS).
 * Baza ulanmagan bo‘lsa bo‘sh ro‘yxat; soxta kurs yaratilmaydi.
 */
export async function yozilganKurslar(
  foydalanuvchiId: string,
): Promise<YozilganKurs[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("yozilishlar")
    .select(
      "yaratilgan, kurslar(id, slug, nom, qisqa_tavsif, tavsif, daraja, yonalish_slug, davomiylik_daqiqa, darslar_soni, ustoz_ismi, pro)",
    )
    .eq("foydalanuvchi_id", foydalanuvchiId)
    .order("yaratilgan", { ascending: false });

  if (error) {
    console.error("Yozilgan kurslarni olishda xato:", error.message);
    return [];
  }

  const qatorlar = (data ?? []) as unknown as Array<{
    yaratilgan: string;
    kurslar: Kurs | null;
  }>;

  const kurslar = qatorlar.filter((q) => q.kurslar !== null);
  if (kurslar.length === 0) return [];

  // Har bir kurs bo‘yicha tugatilgan darslar soni
  const { data: jarayon, error: jarayonXato } = await supabase
    .from("dars_jarayoni")
    .select("dars_id, tugatilgan, darslar(kurs_id)")
    .eq("foydalanuvchi_id", foydalanuvchiId)
    .eq("tugatilgan", true);

  if (jarayonXato) {
    console.error("Jarayonni olishda xato:", jarayonXato.message);
  }

  const sanoq = new Map<string, number>();
  for (const q of (jarayon ?? []) as unknown as Array<{
    darslar: { kurs_id: string } | null;
  }>) {
    const kursId = q.darslar?.kurs_id;
    if (kursId) sanoq.set(kursId, (sanoq.get(kursId) ?? 0) + 1);
  }

  return kurslar.map((q) => ({
    ...(q.kurslar as Kurs),
    yozilgan_sana: q.yaratilgan,
    tugatilgan_darslar: sanoq.get((q.kurslar as Kurs).id) ?? 0,
  }));
}

/** Panel yuqorisidagi uchta son — barchasi bazadan hisoblanadi. */
export async function panelHisobi(
  foydalanuvchiId: string,
): Promise<PanelHisobi | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const sanoq = { count: "exact" as const, head: true };

  const [kurslar, darslar, sertifikatlar] = await Promise.all([
    supabase
      .from("yozilishlar")
      .select("*", sanoq)
      .eq("foydalanuvchi_id", foydalanuvchiId),
    supabase
      .from("dars_jarayoni")
      .select("*", sanoq)
      .eq("foydalanuvchi_id", foydalanuvchiId)
      .eq("tugatilgan", true),
    supabase
      .from("sertifikatlar")
      .select("*", sanoq)
      .eq("foydalanuvchi_id", foydalanuvchiId),
  ]);

  const xato = kurslar.error ?? darslar.error ?? sertifikatlar.error;
  if (xato) {
    console.error("Panel hisobini olishda xato:", xato.message);
    return null;
  }

  return {
    kurslar: kurslar.count ?? 0,
    tugatilgan_darslar: darslar.count ?? 0,
    sertifikatlar: sertifikatlar.count ?? 0,
  };
}

export type Sertifikat = {
  id: string;
  kod: string;
  berilgan: string;
  kurs_nomi: string;
  kurs_slug: string;
};

/** O‘quvchi sertifikatlari. */
export async function sertifikatlar(
  foydalanuvchiId: string,
): Promise<Sertifikat[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sertifikatlar")
    .select("id, kod, berilgan, kurslar(nom, slug)")
    .eq("foydalanuvchi_id", foydalanuvchiId)
    .order("berilgan", { ascending: false });

  if (error) {
    console.error("Sertifikatlarni olishda xato:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Array<{
    id: string;
    kod: string;
    berilgan: string;
    kurslar: { nom: string; slug: string } | null;
  }>)
    .filter((q) => q.kurslar !== null)
    .map((q) => ({
      id: q.id,
      kod: q.kod,
      berilgan: q.berilgan,
      kurs_nomi: q.kurslar!.nom,
      kurs_slug: q.kurslar!.slug,
    }));
}
