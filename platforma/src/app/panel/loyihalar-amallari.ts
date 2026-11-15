"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LoyihaHolatiNatija = { xato?: string; muvaffaqiyat?: string };

function matn(formData: FormData, kalit: string, maks = 300): string {
  return String(formData.get(kalit) ?? "").trim().slice(0, maks);
}

function havolaTozala(qiymat: string): string | null {
  const t = qiymat.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Portfolioga yangi loyiha qo'shadi. */
export async function loyihaQosh(
  _oldingi: LoyihaHolatiNatija,
  formData: FormData,
): Promise<LoyihaHolatiNatija> {
  const nom = matn(formData, "nom", 80);
  const tavsif = matn(formData, "tavsif", 1000);
  const turkum = matn(formData, "turkum", 40) || "Umumiy";
  const holat = matn(formData, "holat", 20) || "jarayonda";
  const texnologiyalar = matn(formData, "texnologiyalar", 200);
  const github = havolaTozala(matn(formData, "github_url", 200));
  const demo = havolaTozala(matn(formData, "demo_url", 200));

  if (nom.length < 3) return { xato: "Loyiha nomi kamida 3 ta belgi bo‘lsin." };
  if (tavsif.length < 10) {
    return { xato: "Tavsif kamida 10 ta belgidan iborat bo‘lsin." };
  }

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const { error } = await supabase.from("loyihalar").insert({
    muallif_id: user.id,
    nom,
    tavsif,
    turkum,
    holat,
    texnologiyalar: texnologiyalar
      ? texnologiyalar.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12)
      : [],
    github_url: github,
    demo_url: demo,
  });

  if (error) {
    console.error("Loyiha qo‘shishda xato:", error.message);
    return { xato: "Loyiha qo‘shishda xatolik yuz berdi." };
  }

  revalidatePath("/panel/loyihalarim");
  return { muvaffaqiyat: `“${nom}” portfolioga qo‘shildi.` };
}

/** Loyihani o'chiradi. */
export async function loyihaOchir(id: string): Promise<LoyihaHolatiNatija> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { error } = await supabase.from("loyihalar").delete().eq("id", id);

  if (error) {
    console.error("Loyihani o‘chirishda xato:", error.message);
    return { xato: "O‘chirishda xatolik yuz berdi." };
  }

  revalidatePath("/panel/loyihalarim");
  return {};
}
