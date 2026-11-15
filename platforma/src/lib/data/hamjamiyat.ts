import { supabaseServer } from "@/lib/supabase/server";
import type { Munozara, Not } from "@/lib/turlar";

/** Hamjamiyat munozaralari — faqat bazadan. */
export async function munozaralar(): Promise<Munozara[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("munozaralar")
    .select("id, sarlavha, muallif_ismi, javoblar_soni, yaratilgan, turkum")
    .order("yaratilgan", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Munozaralarni olishda xato:", error.message);
    return [];
  }

  return (data ?? []) as Munozara[];
}

/** Notlar (foydali manbalar) — faqat bazadan. */
export async function notlar(): Promise<Not[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("notlar")
    .select("id, slug, nom, qisqa_tavsif, turkum")
    .eq("holat", "chop_etilgan")
    .order("yaratilgan", { ascending: false });

  if (error) {
    console.error("Notlarni olishda xato:", error.message);
    return [];
  }

  return (data ?? []) as Not[];
}

export type Javob = {
  id: string;
  matn: string;
  yaratilgan: string;
  muallif_id: string;
  muallif_ismi: string;
};

export type MunozaraToliq = Munozara & { matn: string; muallif_id: string };

/** Bitta munozara. Topilmasa null. */
export async function munozaraTopish(
  id: string,
): Promise<MunozaraToliq | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("munozaralar")
    .select(
      "id, sarlavha, matn, muallif_id, muallif_ismi, javoblar_soni, yaratilgan, turkum",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Munozarani olishda xato:", error.message);
    return null;
  }
  return (data as MunozaraToliq | null) ?? null;
}

/** Munozaraga yozilgan javoblar — eskidan yangiga. */
export async function munozaraJavoblari(
  munozaraId: string,
): Promise<Javob[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("javoblar")
    .select("id, matn, yaratilgan, muallif_id, profillar(toliq_ism)")
    .eq("munozara_id", munozaraId)
    .order("yaratilgan", { ascending: true });

  if (error) {
    console.error("Javoblarni olishda xato:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Array<{
    id: string;
    matn: string;
    yaratilgan: string;
    muallif_id: string;
    profillar: { toliq_ism: string } | null;
  }>).map((j) => ({
    id: j.id,
    matn: j.matn,
    yaratilgan: j.yaratilgan,
    muallif_id: j.muallif_id,
    muallif_ismi: j.profillar?.toliq_ism?.trim() || "Foydalanuvchi",
  }));
}
