import { supabaseServer } from "@/lib/supabase/server";
import type { Urinish, Vazifa } from "@/lib/vazifa-turlari";

const VAZIFA = "id, tartib, nom, tavsif, fayl_nomi, muddat_soat, holat";
const URINISH = "vazifa_id, boshlangan, muddat, topshirilgan, til, html, css, js, python";

/** O‘quvchi uchun: chop etilgan vazifalar (tartib bilan) va uning o‘z urinishlari. */
export async function meningVazifalarim(profilId: string) {
  const supabase = await supabaseServer();
  if (!supabase) return { vazifalar: [] as Vazifa[], urinishlar: [] as Urinish[], xato: true };
  const [v, u] = await Promise.all([
    supabase.from("vazifalar").select(VAZIFA).eq("holat", "chop_etilgan").order("tartib"),
    supabase.from("vazifa_urinishlari").select(URINISH).eq("profil_id", profilId),
  ]);
  if (v.error || u.error) console.error("Vazifalarni olishda xato:", v.error?.message ?? u.error?.message);
  return {
    vazifalar: (v.data ?? []) as Vazifa[],
    urinishlar: (u.data ?? []) as Urinish[],
    xato: Boolean(v.error || u.error),
  };
}

export type AdminTopshiriq = Urinish & { id: string; toliq_ism: string };

/** Admin uchun: barcha vazifalar va ularning topshiriqlari. */
export async function adminVazifalari() {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const [v, u] = await Promise.all([
    supabase.from("vazifalar").select(VAZIFA).order("tartib"),
    supabase
      .from("vazifa_urinishlari")
      .select(`id, ${URINISH}, profillar(toliq_ism)`)
      .order("boshlangan", { ascending: false }),
  ]);
  if (v.error || u.error) console.error("Admin vazifalari xatosi:", v.error?.message ?? u.error?.message);
  const urinishlar = ((u.data ?? []) as unknown as (Urinish & {
    id: string;
    profillar: { toliq_ism: string } | { toliq_ism: string }[] | null;
  })[]).map((x) => {
    const p = Array.isArray(x.profillar) ? x.profillar[0] : x.profillar;
    return { ...x, toliq_ism: p?.toliq_ism ?? "Noma’lum" } as AdminTopshiriq;
  });
  return ((v.data ?? []) as Vazifa[]).map((vz) => ({
    ...vz,
    topshiriqlar: urinishlar.filter((x) => x.vazifa_id === vz.id),
  }));
}
