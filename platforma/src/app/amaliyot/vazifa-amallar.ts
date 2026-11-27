"use server";

import { revalidatePath } from "next/cache";
import { joriyProfil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { AmalNatijasi } from "@/lib/lenta-turlari";
import type { AmaliyotTili } from "@/lib/amaliyot-turlari";

function xabarOl(m: string | undefined) {
  // Bazadagi o‘zbekcha xabarlarni to‘g‘ridan-to‘g‘ri ko‘rsatamiz; boshqasini umumiy xabarga almashtiramiz.
  const bilinadi = [
    "Avval tizimga kiring.",
    "Vazifa topilmadi.",
    "Bu vazifa allaqachon boshlangan.",
    "Avval joriy vazifani topshiring.",
    "Vazifalar tartib bilan bajariladi.",
    "Avval vazifani boshlang.",
    "Vazifa allaqachon topshirilgan.",
    "Muddat tugagan.",
  ];
  return m && bilinadi.some((b) => m.includes(b)) ? bilinadi.find((b) => m.includes(b))! : "Amalni bajarib bo‘lmadi. Keyinroq urinib ko‘ring.";
}

export async function vazifaniBoshla(vazifaId: string): Promise<AmalNatijasi<{ muddat: string }>> {
  const profil = await joriyProfil();
  const supabase = await supabaseServer();
  if (!profil || !supabase) return { ok: false, xato: "Avval tizimga kiring." };
  const { data, error } = await supabase.rpc("vazifa_boshlash", { p_vazifa: vazifaId });
  if (error) return { ok: false, xato: xabarOl(error.message) };
  revalidatePath("/amaliyot");
  return { ok: true, malumot: { muddat: String(data) } };
}

export async function vazifaniSaqla(
  vazifaId: string,
  til: AmaliyotTili,
  html: string,
  css: string,
  js: string,
  python: string,
  yakuniy: boolean,
): Promise<AmalNatijasi<{ topshirilgan: boolean }>> {
  const profil = await joriyProfil();
  const supabase = await supabaseServer();
  if (!profil || !supabase) return { ok: false, xato: "Avval tizimga kiring." };
  const kesib = (q: unknown) => (typeof q === "string" ? q.slice(0, 50000) : "");
  const { error } = await supabase.rpc("vazifa_saqla", {
    p_vazifa: vazifaId,
    p_til: til,
    p_html: kesib(html),
    p_css: kesib(css),
    p_js: kesib(js),
    p_python: kesib(python),
    p_yakuniy: yakuniy,
  });
  if (error) return { ok: false, xato: xabarOl(error.message) };
  revalidatePath("/amaliyot");
  return { ok: true, malumot: { topshirilgan: yakuniy } };
}
