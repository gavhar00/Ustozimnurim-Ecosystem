import { supabaseServer } from "@/lib/supabase/server";
import type { LentaIzoh, LentaMuallif, LentaPost } from "@/lib/lenta-turlari";

const POST_USTUNLARI =
  "id, muallif_id, matn, rasmlar, yoqtirishlar_soni, izohlar_soni, yaratilgan, yangilangan";
const MUALLIF_USTUNLARI = "id, toliq_ism, username, avatar_url, kasb";

type Mijoz = NonNullable<Awaited<ReturnType<typeof supabaseServer>>>;

const NOMALUM: Omit<LentaMuallif, "id"> = {
  toliq_ism: "Noma’lum foydalanuvchi",
  username: null,
  avatar_url: null,
  kasb: null,
};

/** Berilgan id'lar bo‘yicha mualliflar (id → profil). */
export async function mualliflarXaritasi(
  supabase: Mijoz,
  idlar: string[],
): Promise<Map<string, LentaMuallif>> {
  const xarita = new Map<string, LentaMuallif>();
  const noyob = [...new Set(idlar)];
  if (noyob.length === 0) return xarita;
  const { data } = await supabase
    .from("profillar")
    .select(MUALLIF_USTUNLARI)
    .in("id", noyob);
  for (const p of (data ?? []) as LentaMuallif[]) xarita.set(p.id, p);
  return xarita;
}

export async function postlarniTayyorla(
  supabase: Mijoz,
  qatorlar: Omit<LentaPost, "muallif" | "ozim_yoqtirdim">[],
  koruvchiId: string,
): Promise<LentaPost[]> {
  if (qatorlar.length === 0) return [];
  const [mualliflar, yoqtirishlar] = await Promise.all([
    mualliflarXaritasi(supabase, qatorlar.map((p) => p.muallif_id)),
    supabase
      .from("post_yoqtirishlari")
      .select("post_id")
      .eq("foydalanuvchi_id", koruvchiId)
      .in("post_id", qatorlar.map((p) => p.id)),
  ]);
  const yoqtirgan = new Set(
    ((yoqtirishlar.data ?? []) as { post_id: string }[]).map((y) => y.post_id),
  );
  return qatorlar.map((p) => ({
    ...p,
    rasmlar: p.rasmlar ?? [],
    ozim_yoqtirdim: yoqtirgan.has(p.id),
    muallif: mualliflar.get(p.muallif_id) ?? { id: p.muallif_id, ...NOMALUM },
  }));
}

export const LENTA_SAHIFA_HAJMI = 10;

/** Yangilaridan eskisiga qarab postlar. `keyin` — oxirgi ko‘rilgan post vaqti. */
export async function lentaPostlari(
  koruvchiId: string,
  keyin?: string | null,
): Promise<{ postlar: LentaPost[]; davomi: string | null; xato: boolean }> {
  const supabase = await supabaseServer();
  if (!supabase) return { postlar: [], davomi: null, xato: true };

  let so = supabase
    .from("postlar")
    .select(POST_USTUNLARI)
    .order("yaratilgan", { ascending: false })
    .limit(LENTA_SAHIFA_HAJMI + 1);
  if (keyin && !Number.isNaN(new Date(keyin).getTime())) so = so.lt("yaratilgan", keyin);

  const { data, error } = await so;
  if (error) {
    console.error("Lentani olishda xato:", error.message);
    return { postlar: [], davomi: null, xato: true };
  }

  const qatorlar = (data ?? []) as Omit<LentaPost, "muallif" | "ozim_yoqtirdim">[];
  const keyingiBor = qatorlar.length > LENTA_SAHIFA_HAJMI;
  const sahifa = qatorlar.slice(0, LENTA_SAHIFA_HAJMI);
  return {
    postlar: await postlarniTayyorla(supabase, sahifa, koruvchiId),
    davomi: keyingiBor ? sahifa[sahifa.length - 1].yaratilgan : null,
    xato: false,
  };
}

export async function postIzohlari(postId: string): Promise<LentaIzoh[] | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("post_izohlari")
    .select("id, post_id, muallif_id, matn, yaratilgan")
    .eq("post_id", postId)
    .order("yaratilgan", { ascending: true })
    .limit(200);
  if (error) {
    console.error("Izohlarni olishda xato:", error.message);
    return null;
  }
  const qatorlar = (data ?? []) as Omit<LentaIzoh, "muallif">[];
  const mualliflar = await mualliflarXaritasi(supabase, qatorlar.map((i) => i.muallif_id));
  return qatorlar.map((i) => ({
    ...i,
    muallif: mualliflar.get(i.muallif_id) ?? { id: i.muallif_id, ...NOMALUM },
  }));
}
