"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { toshkentdanISO } from "@/lib/sana";
import type { AdminHolati } from "@/app/admin/amallar";

function slugla(matn: string): string {
  return matn
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function yangila() {
  revalidatePath("/admin/tadbirlar");
  revalidatePath("/tadbirlar");
}

export async function tadbirYarat(_o: AdminHolati, formData: FormData): Promise<AdminHolati> {
  const nom = String(formData.get("nom") ?? "").trim();
  const tavsif = String(formData.get("tavsif") ?? "").trim();
  const joy = String(formData.get("joy") ?? "").trim();
  const sigimXom = String(formData.get("sigim") ?? "").trim();
  const boshlanish = toshkentdanISO(String(formData.get("boshlanish") ?? ""));

  if (nom.length < 3) return { xato: "Nomi kamida 3 ta belgi bo‘lsin." };
  if (tavsif.length < 10) return { xato: "Tavsif kamida 10 ta belgi bo‘lsin." };
  if (!boshlanish) return { xato: "Boshlanish sanasi va vaqtini kiriting." };
  const sigim = sigimXom ? Number(sigimXom) : null;
  if (sigim !== null && (!Number.isInteger(sigim) || sigim < 1 || sigim > 100000)) {
    return { xato: "Sig‘im musbat butun son bo‘lsin yoki bo‘sh qoldiring." };
  }
  const slug = `${slugla(nom) || "tadbir"}-${boshlanish.slice(0, 10)}`;

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { error } = await supabase
    .from("tadbirlar")
    .insert({ slug, nom, tavsif, joy: joy || null, boshlanish, sigim });
  if (error) {
    console.error("Tadbir yaratishda xato:", error.message);
    return {
      xato: error.message.includes("duplicate")
        ? "Shu nom va sanali tadbir allaqachon bor."
        : "Yaratib bo‘lmadi. Admin huquqingizni tekshiring.",
    };
  }
  yangila();
  return { muvaffaqiyat: "Tadbir qoralama sifatida yaratildi. Chop eting." };
}

export async function tadbirHolati(id: string, holat: "qoralama" | "chop_etilgan"): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { error } = await supabase.from("tadbirlar").update({ holat }).eq("id", id);
  if (error) return { xato: "O‘zgartirib bo‘lmadi." };
  yangila();
  return { muvaffaqiyat: "Saqlandi." };
}

export async function tadbirOchir(id: string): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { error } = await supabase.from("tadbirlar").delete().eq("id", id);
  if (error) return { xato: "O‘chirib bo‘lmadi." };
  yangila();
  return { muvaffaqiyat: "O‘chirildi." };
}
