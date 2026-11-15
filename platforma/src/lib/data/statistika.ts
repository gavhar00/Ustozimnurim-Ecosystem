import { supabaseServer } from "@/lib/supabase/server";

export type PlatformaStatistikasi = {
  oquvchilar: number;
  kurslar: number;
  darslar: number;
  sertifikatlar: number;
};

/**
 * Platforma statistikasi — FAQAT bazadan.
 *
 * Hech qanday raqam o‘ylab topilmaydi: baza ulanmagan yoki so‘rov muvaffaqiyatsiz
 * bo‘lsa, null qaytadi va statistika bloki umuman ko‘rsatilmaydi.
 */
export async function platformaStatistikasi(): Promise<PlatformaStatistikasi | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const sanoq = { count: "exact" as const, head: true };

  const [oquvchilar, kurslar, darslar, sertifikatlar] = await Promise.all([
    supabase.from("profillar").select("*", sanoq).eq("rol", "oquvchi"),
    supabase.from("kurslar").select("*", sanoq).eq("holat", "chop_etilgan"),
    supabase.from("darslar").select("*", sanoq).eq("holat", "chop_etilgan"),
    supabase.from("sertifikatlar").select("*", sanoq),
  ]);

  const xato =
    oquvchilar.error ?? kurslar.error ?? darslar.error ?? sertifikatlar.error;
  if (xato) {
    console.error("Statistikani olishda xato:", xato.message);
    return null;
  }

  return {
    oquvchilar: oquvchilar.count ?? 0,
    kurslar: kurslar.count ?? 0,
    darslar: darslar.count ?? 0,
    sertifikatlar: sertifikatlar.count ?? 0,
  };
}
