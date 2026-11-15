import { supabaseServer } from "@/lib/supabase/server";
import type { Rol } from "@/lib/rollar";
import type { Dars, Kurs } from "@/lib/turlar";

export type AdminStatistikasi = {
  foydalanuvchilar: number;
  kurslar: number;
  chop_etilgan_kurslar: number;
  darslar: number;
  yozilishlar: number;
  sertifikatlar: number;
};

/** Admin paneli uchun umumiy sonlar — barchasi bazadan. */
export async function adminStatistikasi(): Promise<AdminStatistikasi | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const s = { count: "exact" as const, head: true };

  const [f, k, kc, d, y, sert] = await Promise.all([
    supabase.from("profillar").select("*", s),
    supabase.from("kurslar").select("*", s),
    supabase.from("kurslar").select("*", s).eq("holat", "chop_etilgan"),
    supabase.from("darslar").select("*", s),
    supabase.from("yozilishlar").select("*", s),
    supabase.from("sertifikatlar").select("*", s),
  ]);

  const xato = f.error ?? k.error ?? kc.error ?? d.error ?? y.error ?? sert.error;
  if (xato) {
    console.error("Admin statistikasida xato:", xato.message);
    return null;
  }

  return {
    foydalanuvchilar: f.count ?? 0,
    kurslar: k.count ?? 0,
    chop_etilgan_kurslar: kc.count ?? 0,
    darslar: d.count ?? 0,
    yozilishlar: y.count ?? 0,
    sertifikatlar: sert.count ?? 0,
  };
}

export type AdminKurs = Kurs & { holat: string };

/** Barcha kurslar — qoralamalar bilan birga (faqat ustoz/admin ko'radi). */
export async function adminKurslari(): Promise<AdminKurs[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("kurslar")
    .select(
      "id, slug, nom, qisqa_tavsif, tavsif, daraja, yonalish_slug, davomiylik_daqiqa, darslar_soni, ustoz_ismi, pro, holat",
    )
    .order("yaratilgan", { ascending: false });

  if (error) {
    console.error("Admin kurslarini olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as AdminKurs[];
}

export async function adminKursTopish(id: string): Promise<AdminKurs | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("kurslar")
    .select(
      "id, slug, nom, qisqa_tavsif, tavsif, daraja, yonalish_slug, davomiylik_daqiqa, darslar_soni, ustoz_ismi, pro, holat",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Kursni olishda xato:", error.message);
    return null;
  }
  return (data as AdminKurs | null) ?? null;
}

export type AdminDars = Dars & { holat: string };

/** Kursning barcha darslari — qoralamalar bilan. */
export async function adminDarslari(kursId: string): Promise<AdminDars[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("darslar")
    .select("id, kurs_id, slug, nom, tartib, turi, davomiylik_daqiqa, holat")
    .eq("kurs_id", kursId)
    .order("tartib", { ascending: true });

  if (error) {
    console.error("Darslarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as AdminDars[];
}

export type AdminFoydalanuvchi = {
  id: string;
  toliq_ism: string;
  rol: Rol;
  yaratilgan: string;
};

/** Foydalanuvchilar ro'yxati — faqat admin ko'radi (RLS). */
export async function adminFoydalanuvchilari(): Promise<AdminFoydalanuvchi[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profillar")
    .select("id, toliq_ism, rol, yaratilgan")
    .order("yaratilgan", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Foydalanuvchilarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as AdminFoydalanuvchi[];
}
