import { supabaseServer } from "@/lib/supabase/server";
import { mualliflarXaritasi } from "@/lib/data/lenta";
import type { LentaMuallif } from "@/lib/lenta-turlari";
import {
  LAHZA_SAHIFA_HAJMI,
  type LahzaAsos,
  type LahzaIzoh,
  type LahzaLaykchi,
  type LahzaPost,
} from "@/lib/lahza-turlari";

const USTUNLAR =
  "id, profil_id, matn, rasmlar, asl_id, layklar_soni, izohlar_soni, repostlar_soni, yaratilgan, yangilangan";

type Mijoz = NonNullable<Awaited<ReturnType<typeof supabaseServer>>>;
type Qator = Omit<LahzaPost, "muallif" | "asl" | "ozim_layk" | "ozim_repost">;
type AslQator = Omit<LahzaAsos, "muallif" | "ozim_layk" | "ozim_repost">;

const NOMALUM: Omit<LentaMuallif, "id"> = {
  toliq_ism: "Noma’lum foydalanuvchi",
  username: null,
  avatar_url: null,
  kasb: null,
};

/** Qatorlarni muallif, asl lahza (repost) va ko‘ruvchining layk/repostlari bilan to‘ldiradi. */
export async function lahzalarniTayyorla(
  supabase: Mijoz,
  qatorlar: Qator[],
  koruvchiId: string | null,
): Promise<LahzaPost[]> {
  if (qatorlar.length === 0) return [];

  const aslIdlar = [...new Set(qatorlar.map((q) => q.asl_id).filter((x): x is string => !!x))];
  const aslQatorlar = aslIdlar.length
    ? (((await supabase
        .from("lahzalar")
        .select("id, profil_id, matn, rasmlar, layklar_soni, izohlar_soni, repostlar_soni, yaratilgan, yangilangan")
        .eq("holat", "tasdiqlangan")
        .in("id", aslIdlar)).data ?? []) as AslQator[])
    : [];

  const mualliflar = await mualliflarXaritasi(supabase, [
    ...qatorlar.map((q) => q.profil_id),
    ...aslQatorlar.map((a) => a.profil_id),
  ]);
  const muallifOl = (id: string): LentaMuallif => mualliflar.get(id) ?? { id, ...NOMALUM };

  // Ko‘ruvchi layk va repost qilganlari (repostlar uchun asl lahza bo‘yicha).
  const korilgan = [...new Set([...qatorlar.map((q) => q.id), ...aslIdlar])];
  let layk = new Set<string>();
  let repost = new Set<string>();
  if (koruvchiId) {
    const [l, r] = await Promise.all([
      supabase.from("lahza_layklari").select("lahza_id").eq("profil_id", koruvchiId).in("lahza_id", korilgan),
      supabase.from("lahzalar").select("asl_id").eq("profil_id", koruvchiId).in("asl_id", korilgan),
    ]);
    layk = new Set(((l.data ?? []) as { lahza_id: string }[]).map((x) => x.lahza_id));
    repost = new Set(((r.data ?? []) as { asl_id: string }[]).map((x) => x.asl_id));
  }

  const aslXarita = new Map<string, LahzaAsos>(
    aslQatorlar.map((a) => [
      a.id,
      {
        ...a,
        rasmlar: a.rasmlar ?? [],
        ozim_layk: layk.has(a.id),
        ozim_repost: repost.has(a.id),
        muallif: muallifOl(a.profil_id),
      },
    ]),
  );

  return qatorlar.map((q) => ({
    ...q,
    rasmlar: q.rasmlar ?? [],
    asl: q.asl_id ? (aslXarita.get(q.asl_id) ?? null) : null,
    ozim_layk: layk.has(q.id),
    ozim_repost: repost.has(q.id),
    muallif: muallifOl(q.profil_id),
  }));
}

/** Ommaviy lenta: yangilaridan eskisiga. `keyin` — oxirgi ko‘rilgan lahza vaqti. */
export async function lahzalarLentasi(
  koruvchiId: string | null,
  keyin?: string | null,
  tadbirSlug?: string | null,
): Promise<{ lahzalar: LahzaPost[]; davomi: string | null; xato: boolean }> {
  const supabase = await supabaseServer();
  if (!supabase) return { lahzalar: [], davomi: null, xato: true };

  let so = supabase
    .from("lahzalar")
    .select(USTUNLAR)
    .eq("holat", "tasdiqlangan")
    .order("yaratilgan", { ascending: false })
    .limit(LAHZA_SAHIFA_HAJMI + 1);
  if (tadbirSlug) {
    const { data: t } = await supabase.from("tadbirlar").select("id").eq("slug", tadbirSlug).maybeSingle();
    if (!t) return { lahzalar: [], davomi: null, xato: false };
    so = so.eq("tadbir_id", t.id);
  }
  if (keyin && !Number.isNaN(new Date(keyin).getTime())) so = so.lt("yaratilgan", keyin);

  const { data, error } = await so;
  if (error) {
    console.error("Lahzalarni olishda xato:", error.message);
    return { lahzalar: [], davomi: null, xato: true };
  }
  const qatorlar = (data ?? []) as Qator[];
  const keyingiBor = qatorlar.length > LAHZA_SAHIFA_HAJMI;
  const sahifa = qatorlar.slice(0, LAHZA_SAHIFA_HAJMI);
  return {
    lahzalar: await lahzalarniTayyorla(supabase, sahifa, koruvchiId),
    davomi: keyingiBor ? sahifa[sahifa.length - 1].yaratilgan : null,
    xato: false,
  };
}

export async function lahzaIzohlari(lahzaId: string): Promise<LahzaIzoh[] | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("lahza_izohlari")
    .select("id, lahza_id, muallif_id, matn, yaratilgan")
    .eq("lahza_id", lahzaId)
    .order("yaratilgan", { ascending: true })
    .limit(200);
  if (error) {
    console.error("Lahza izohlarini olishda xato:", error.message);
    return null;
  }
  const qatorlar = (data ?? []) as Omit<LahzaIzoh, "muallif">[];
  const mualliflar = await mualliflarXaritasi(supabase, qatorlar.map((i) => i.muallif_id));
  return qatorlar.map((i) => ({
    ...i,
    muallif: mualliflar.get(i.muallif_id) ?? { id: i.muallif_id, ...NOMALUM },
  }));
}

/** Kim layk bosgani (hamma ko‘ra oladi). */
export async function lahzaLaykchilari(lahzaId: string): Promise<LahzaLaykchi[] | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("lahza_layklari")
    .select("profil_id, yaratilgan")
    .eq("lahza_id", lahzaId)
    .order("yaratilgan", { ascending: false })
    .limit(200);
  if (error) {
    console.error("Laykchilarni olishda xato:", error.message);
    return null;
  }
  const qatorlar = (data ?? []) as { profil_id: string; yaratilgan: string }[];
  const mualliflar = await mualliflarXaritasi(supabase, qatorlar.map((q) => q.profil_id));
  return qatorlar.map((q) => ({
    yaratilgan: q.yaratilgan,
    profil: mualliflar.get(q.profil_id) ?? { id: q.profil_id, ...NOMALUM },
  }));
}
