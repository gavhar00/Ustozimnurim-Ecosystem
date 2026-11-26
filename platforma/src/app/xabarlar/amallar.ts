"use server";

import { joriyProfil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { AmalNatijasi } from "@/lib/lenta-turlari";
import type { Suhbat, SuhbatMalumoti } from "@/lib/xabar-turlari";

async function klient() {
  const profil = await joriyProfil();
  const supabase = await supabaseServer();
  if (!profil || !supabase) return null;
  return { supabase, profil };
}

function xatoMatni(m: string) {
  if (m.includes("boglanmagan")) return "Faqat bog‘langan foydalanuvchilarga yozish mumkin.";
  if (m.includes("matn_uzun")) return "Xabar juda uzun.";
  if (m.includes("bosh_xabar")) return "Bo‘sh xabar yuborib bo‘lmaydi.";
  if (m.includes("fayl_notogri")) return "Fayl noto‘g‘ri yuklangan. Qayta urinib ko‘ring.";
  return "Xabarni yuborib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.";
}

export async function suhbatlarniOl(): Promise<Suhbat[]> {
  const k = await klient();
  if (!k) return [];
  await k.supabase.rpc("faollik_yangila");
  const { data } = await k.supabase.rpc("xabar_suhbatlar");
  return Array.isArray(data) ? (data as Suhbat[]) : [];
}

export async function suhbatniOl(boshqaId: string): Promise<SuhbatMalumoti | null> {
  const k = await klient();
  if (!k) return null;
  await k.supabase.rpc("faollik_yangila");
  const { data, error } = await k.supabase.rpc("xabar_suhbat", { p_boshqa: boshqaId });
  if (error || !data) return null;
  return data as SuhbatMalumoti;
}

export async function xabarYubor(
  qabulId: string,
  matn: string,
  fayl?: { url: string; nomi: string; turi: "rasm" | "fayl"; hajmi: number },
): Promise<AmalNatijasi> {
  const k = await klient();
  if (!k) return { ok: false, xato: "Avval tizimga kiring." };
  const { error } = await k.supabase.rpc("xabar_yubor", {
    p_qabul: qabulId,
    p_matn: matn,
    p_fayl_url: fayl?.url ?? null,
    p_fayl_nomi: fayl?.nomi ?? null,
    p_fayl_turi: fayl?.turi ?? null,
    p_fayl_hajmi: fayl?.hajmi ?? null,
  });
  if (error) return { ok: false, xato: xatoMatni(error.message) };
  return { ok: true, malumot: undefined };
}

/** Navigatsiya belgisi: o‘qilmagan xabarlar soni (va faollik belgisi). */
export async function xabarBelgisi(): Promise<number> {
  const k = await klient();
  if (!k) return 0;
  await k.supabase.rpc("faollik_yangila");
  const { data } = await k.supabase.rpc("xabar_oqilmaganlar");
  return typeof data === "number" ? data : 0;
}
