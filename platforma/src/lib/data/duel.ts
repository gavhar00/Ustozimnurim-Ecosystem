import { supabaseServer } from "@/lib/supabase/server";
import type { DuelQatori, DuelRaqibi, TopQatori, DuelHolatiNomi } from "@/lib/duel-turlari";

/** Duelga chaqirish mumkin bo‘lgan foydalanuvchilar (o‘zidan tashqari) va ularning reytingi. */
export async function duelRaqiblari(menId: string): Promise<DuelRaqibi[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const [{ data: profillar }, { data: stat }] = await Promise.all([
    supabase
      .from("profillar")
      .select("id, toliq_ism, username, avatar_url, kasb, tanlangan_yonalish")
      .neq("id", menId)
      .order("yaratilgan", { ascending: false })
      .limit(300),
    supabase.from("duel_statistikasi").select("profil_id, reyting, galabalar"),
  ]);
  const xarita = new Map(
    ((stat ?? []) as { profil_id: string; reyting: number; galabalar: number }[]).map((s) => [s.profil_id, s]),
  );
  return (
    (profillar ?? []) as {
      id: string;
      toliq_ism: string;
      username: string | null;
      avatar_url: string | null;
      kasb: string | null;
      tanlangan_yonalish: string | null;
    }[]
  ).map((p) => ({
    id: p.id,
    toliq_ism: p.toliq_ism,
    username: p.username,
    avatar_url: p.avatar_url,
    kasb: p.kasb,
    yonalish: p.tanlangan_yonalish,
    reyting: xarita.get(p.id)?.reyting ?? 1000,
    galabalar: xarita.get(p.id)?.galabalar ?? 0,
  }));
}

type DuelSatri = {
  id: string;
  chaqiruvchi_id: string;
  raqib_id: string;
  holat: DuelHolatiNomi;
  yonalish: string;
  qiyinlik: string;
  galib_id: string | null;
  chaqiruvchi_ball: number | null;
  raqib_ball: number | null;
  chaqiruvchi_reyting_ozgarishi: number | null;
  raqib_reyting_ozgarishi: number | null;
  yaratilgan: string;
};

/** Foydalanuvchining barcha duellari (RLS faqat o‘zinikini beradi). */
export async function meningDuellarim(menId: string): Promise<DuelQatori[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("duellar")
    .select(
      "id, chaqiruvchi_id, raqib_id, holat, yonalish, qiyinlik, galib_id, chaqiruvchi_ball, raqib_ball, chaqiruvchi_reyting_ozgarishi, raqib_reyting_ozgarishi, yaratilgan",
    )
    .order("yaratilgan", { ascending: false })
    .limit(60);
  if (error) {
    console.error("Duellarni olishda xato:", error.message);
    return [];
  }
  const satrlar = (data ?? []) as DuelSatri[];
  const idlar = [...new Set(satrlar.map((s) => (s.chaqiruvchi_id === menId ? s.raqib_id : s.chaqiruvchi_id)))];
  const { data: profillar } = idlar.length
    ? await supabase.from("profillar").select("id, toliq_ism, avatar_url").in("id", idlar)
    : { data: [] };
  const xarita = new Map(
    ((profillar ?? []) as { id: string; toliq_ism: string; avatar_url: string | null }[]).map((p) => [p.id, p]),
  );
  return satrlar.map((s) => {
    const men = s.chaqiruvchi_id === menId;
    const raqibId = men ? s.raqib_id : s.chaqiruvchi_id;
    return {
      id: s.id,
      holat: s.holat,
      men_chaqiruvchi: men,
      raqib: xarita.get(raqibId) ?? { id: raqibId, toliq_ism: "Foydalanuvchi", avatar_url: null },
      yonalish: s.yonalish,
      qiyinlik: s.qiyinlik,
      galib_id: s.galib_id,
      mening_ballim: men ? s.chaqiruvchi_ball : s.raqib_ball,
      raqib_ball: men ? s.raqib_ball : s.chaqiruvchi_ball,
      mening_ozgarishim: men ? s.chaqiruvchi_reyting_ozgarishi : s.raqib_reyting_ozgarishi,
      yaratilgan: s.yaratilgan,
    };
  });
}

export async function duelTop(haftalik: boolean, limit = 10): Promise<TopQatori[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("duel_top", { p_haftalik: haftalik, p_limit: limit });
  if (error) {
    console.error("TOP ni olishda xato:", error.message);
    return [];
  }
  return ((data ?? []) as TopQatori[]).map((t) => ({ ...t, galabalar: Number(t.galabalar) }));
}

export async function meningStatistikam(menId: string) {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("duel_statistikasi")
    .select("reyting, galabalar, magliubiyatlar, durranglar")
    .eq("profil_id", menId)
    .maybeSingle();
  return (data as { reyting: number; galabalar: number; magliubiyatlar: number; durranglar: number } | null) ?? {
    reyting: 1000,
    galabalar: 0,
    magliubiyatlar: 0,
    durranglar: 0,
  };
}
