"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { AdminHolati } from "@/app/admin/amallar";

function yangila() {
  revalidatePath("/admin/vazifalar");
  revalidatePath("/amaliyot");
}

/** Fayl brauzerdan to‘g‘ridan-to‘g‘ri omborga yuklanadi; bu yerga faqat yo‘l keladi. */
export async function vazifaYarat(
  nom: string,
  tavsif: string,
  muddatSoat: number,
  faylYoli: string | null,
  faylNomi: string | null,
): Promise<AdminHolati> {
  const n = nom.trim();
  const t = tavsif.trim();
  if (n.length < 3) return { xato: "Nomi kamida 3 ta belgi bo‘lsin." };
  if (t.length < 10) return { xato: "Tavsif kamida 10 ta belgi bo‘lsin." };
  if (!Number.isInteger(muddatSoat) || muddatSoat < 1 || muddatSoat > 720) {
    return { xato: "Muddat 1 dan 720 soatgacha bo‘lsin." };
  }
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: oxirgi } = await supabase.from("vazifalar").select("tartib").order("tartib", { ascending: false }).limit(1);
  const tartib = (oxirgi?.[0]?.tartib ?? 0) + 1;
  const { error } = await supabase.from("vazifalar").insert({
    tartib,
    nom: n.slice(0, 150),
    tavsif: t.slice(0, 6000),
    muddat_soat: muddatSoat,
    fayl_yoli: faylYoli,
    fayl_nomi: faylNomi,
  });
  if (error) {
    console.error("Vazifa yaratishda xato:", error.message);
    return { xato: "Yaratib bo‘lmadi. Admin huquqingizni tekshiring." };
  }
  yangila();
  return { muvaffaqiyat: "Vazifa qoralama sifatida yaratildi. Tayyor bo‘lgach chop eting." };
}

export async function vazifaHolatiniOzgartir(id: string, holat: "qoralama" | "chop_etilgan"): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { error } = await supabase.from("vazifalar").update({ holat }).eq("id", id);
  if (error) return { xato: "O‘zgartirib bo‘lmadi." };
  yangila();
  return { muvaffaqiyat: "Saqlandi." };
}

export async function vazifaOchir(id: string): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: v } = await supabase.from("vazifalar").select("fayl_yoli").eq("id", id).maybeSingle();
  const { error } = await supabase.from("vazifalar").delete().eq("id", id);
  if (error) return { xato: "O‘chirib bo‘lmadi." };
  if (v?.fayl_yoli) await supabase.storage.from("vazifa-fayllari").remove([v.fayl_yoli]);
  yangila();
  return { muvaffaqiyat: "O‘chirildi." };
}

/** Mavjud vazifaga fayl biriktiradi (fayl brauzerdan yuklangan; eskisi o‘chiriladi). */
export async function vazifaFayliniBiriktir(id: string, faylYoli: string, faylNomi: string): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: eski } = await supabase.from("vazifalar").select("fayl_yoli").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("vazifalar")
    .update({ fayl_yoli: faylYoli, fayl_nomi: faylNomi.slice(0, 120) })
    .eq("id", id);
  if (error) return { xato: "Biriktirib bo‘lmadi." };
  if (eski?.fayl_yoli && eski.fayl_yoli !== faylYoli) {
    await supabase.storage.from("vazifa-fayllari").remove([eski.fayl_yoli]);
  }
  yangila();
  return { muvaffaqiyat: "Fayl biriktirildi." };
}
