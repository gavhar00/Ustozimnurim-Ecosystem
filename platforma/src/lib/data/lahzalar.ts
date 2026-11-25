import { supabaseServer } from "@/lib/supabase/server";

export type Lahza = {
  id: string;
  rasm_url: string | null;
  izoh: string | null;
  matn: string;
  asl_id: string | null;
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
  rasm_url: string | null;
  izoh: string | null;
  matn: string;
  asl_id: string | null;
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
    matn: q.matn,
    asl_id: q.asl_id,
    holat: q.holat,
    yaratilgan: q.yaratilgan,
    tadbir_nomi: t?.nom ?? null,
    tadbir_slug: t?.slug ?? null,
    muallif: birinchi(q.profillar)?.toliq_ism,
  };
}

const USTUN = "id, rasm_url, izoh, matn, asl_id, holat, yaratilgan, tadbirlar(nom, slug)";

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
