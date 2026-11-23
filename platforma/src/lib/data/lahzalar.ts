import { supabaseServer } from "@/lib/supabase/server";

export type Lahza = {
  id: string;
  rasm_url: string;
  izoh: string | null;
  holat: "kutilmoqda" | "tasdiqlangan" | "rad";
  yaratilgan: string;
  tadbir_nomi?: string | null;
  tadbir_slug?: string | null;
  muallif?: string;
};

export const LAHZA_HOLATI = {
  kutilmoqda: "Tekshirilmoqda",
  tasdiqlangan: "Tasdiqlangan",
  rad: "Rad etilgan",
} as const;

type Qator = {
  id: string;
  rasm_url: string;
  izoh: string | null;
  holat: Lahza["holat"];
  yaratilgan: string;
  tadbirlar?: { nom: string; slug: string } | { nom: string; slug: string }[] | null;
  profillar?: { toliq_ism: string } | { toliq_ism: string }[] | null;
};

function birinchi<T>(v: T | T[] | null | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : (v ?? undefined);
}

function aylantir(q: Qator): Lahza {
  const t = birinchi(q.tadbirlar);
  return {
    id: q.id,
    rasm_url: q.rasm_url,
    izoh: q.izoh,
    holat: q.holat,
    yaratilgan: q.yaratilgan,
    tadbir_nomi: t?.nom ?? null,
    tadbir_slug: t?.slug ?? null,
    muallif: birinchi(q.profillar)?.toliq_ism,
  };
}

const USTUN = "id, rasm_url, izoh, holat, yaratilgan, tadbirlar(nom, slug)";

/** Ommaviy galereya — faqat tasdiqlanganlar. */
export async function tasdiqlanganLahzalar(tadbirSlug?: string): Promise<Lahza[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  let sorov = supabase.from("lahzalar").select(USTUN).eq("holat", "tasdiqlangan");
  if (tadbirSlug) {
    const { data: t } = await supabase.from("tadbirlar").select("id").eq("slug", tadbirSlug).maybeSingle();
    if (!t) return [];
    sorov = sorov.eq("tadbir_id", t.id);
  }
  const { data, error } = await sorov.order("yaratilgan", { ascending: false }).limit(60);
  if (error) {
    console.error("Lahzalarni olishda xato:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as Qator[]).map(aylantir);
}

export async function menimLahzalarim(profilId: string): Promise<Lahza[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lahzalar")
    .select(USTUN)
    .eq("profil_id", profilId)
    .order("yaratilgan", { ascending: false });
  if (error) {
    console.error("Lahzalarni olishda xato:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as Qator[]).map(aylantir);
}

/** Admin: tekshiruvdagilar birinchi. */
export async function adminLahzalari(): Promise<Lahza[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lahzalar")
    .select(`${USTUN}, profillar(toliq_ism)`)
    .order("yaratilgan", { ascending: false })
    .limit(200);
  if (error) {
    console.error("Lahzalarni olishda xato:", error.message);
    return [];
  }
  const royxat = ((data ?? []) as unknown as Qator[]).map(aylantir);
  return [
    ...royxat.filter((l) => l.holat === "kutilmoqda"),
    ...royxat.filter((l) => l.holat !== "kutilmoqda"),
  ];
}
