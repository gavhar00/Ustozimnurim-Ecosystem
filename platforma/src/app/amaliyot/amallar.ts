"use server";

import { revalidatePath } from "next/cache";
import { joriyProfil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { AmalNatijasi } from "@/lib/lenta-turlari";
import { KOD_MAKS_BELGI, KOD_MAKS_SONI } from "@/lib/amaliyot-turlari";
import type { AmaliyotTili } from "@/lib/amaliyot-turlari";

const matn = (q: unknown, limit: number) => (typeof q === "string" ? q.slice(0, limit) : "");

export async function kodniSaqla(
  id: string | null,
  nom: string,
  til: AmaliyotTili,
  html: string,
  css: string,
  js: string,
  python: string,
): Promise<AmalNatijasi<{ id: string }>> {
  const profil = await joriyProfil();
  const supabase = await supabaseServer();
  if (!profil || !supabase) return { ok: false, xato: "Avval tizimga kiring." };
  const sarlavha = matn(nom, 80).trim();
  if (!sarlavha) return { ok: false, xato: "Kodga nom bering." };
  if (til !== "web" && til !== "python") return { ok: false, xato: "Noto‘g‘ri til." };
  const qiymat = {
    nom: sarlavha,
    til,
    html: matn(html, KOD_MAKS_BELGI),
    css: matn(css, KOD_MAKS_BELGI),
    js: matn(js, KOD_MAKS_BELGI),
    python: matn(python, KOD_MAKS_BELGI),
  };
  if (id) {
    const { data, error } = await supabase
      .from("amaliyot_kodlari")
      .update({ ...qiymat, yangilangan: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error || !data) return { ok: false, xato: "Kodni yangilab bo‘lmadi." };
    revalidatePath("/amaliyot");
    return { ok: true, malumot: { id: data.id } };
  }
  const { data, error } = await supabase
    .from("amaliyot_kodlari")
    .insert({ ...qiymat, profil_id: profil.id })
    .select("id")
    .single();
  if (error || !data) {
    return {
      ok: false,
      xato: `Kodni saqlab bo‘lmadi. Eng ko‘pi bilan ${KOD_MAKS_SONI} ta kod saqlash mumkin.`,
    };
  }
  revalidatePath("/amaliyot");
  return { ok: true, malumot: { id: data.id } };
}

export async function kodniOchir(id: string): Promise<AmalNatijasi> {
  const profil = await joriyProfil();
  const supabase = await supabaseServer();
  if (!profil || !supabase) return { ok: false, xato: "Avval tizimga kiring." };
  const { error } = await supabase.from("amaliyot_kodlari").delete().eq("id", id);
  if (error) return { ok: false, xato: "O‘chirib bo‘lmadi." };
  revalidatePath("/amaliyot");
  return { ok: true, malumot: undefined };
}
