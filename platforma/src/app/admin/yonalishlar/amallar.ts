"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { YONALISH_IKONALARI } from "@/lib/yonalish-ikonalari";
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
  revalidatePath("/admin/yonalishlar");
  revalidatePath("/yonalishlar");
  revalidatePath("/kurslar");
  revalidatePath("/");
}

/** Yo‘nalish yaratadi yoki (eski_slug bor bo‘lsa) yangilaydi. */
export async function yonalishSaqla(
  _oldingi: AdminHolati,
  formData: FormData,
): Promise<AdminHolati> {
  const eskiSlug = String(formData.get("eski_slug") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const tavsif = String(formData.get("tavsif") ?? "").trim();
  const ikona = String(formData.get("ikona") ?? "code");
  const tartib = Number(formData.get("tartib") ?? 0);
  const faol = formData.get("faol") === "on";

  if (nom.length < 3) return { xato: "Nomi kamida 3 ta belgi bo‘lsin." };
  if (tavsif.length < 10) return { xato: "Tavsif kamida 10 ta belgi bo‘lsin." };
  if (!(ikona in YONALISH_IKONALARI)) return { xato: "Ikonani ro‘yxatdan tanlang." };
  if (!Number.isInteger(tartib) || tartib < 0 || tartib > 99) {
    return { xato: "Tartib raqami 0 dan 99 gacha butun son bo‘lsin." };
  }

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  if (eskiSlug) {
    const { error } = await supabase
      .from("yonalishlar")
      .update({ nom, tavsif, ikona, tartib, faol })
      .eq("slug", eskiSlug);
    if (error) {
      console.error("Yo‘nalishni yangilashda xato:", error.message);
      return { xato: "Saqlab bo‘lmadi. Admin huquqingizni tekshiring." };
    }
    yangila();
    return { muvaffaqiyat: "Saqlandi." };
  }

  const slug = slugla(String(formData.get("slug") ?? "") || nom);
  if (!slug) return { xato: "Slug yasab bo‘lmadi — lotin harflaridan foydalaning." };

  const { error } = await supabase
    .from("yonalishlar")
    .insert({ slug, nom, tavsif, ikona, tartib, faol });
  if (error) {
    console.error("Yo‘nalish yaratishda xato:", error.message);
    return {
      xato: error.message.includes("duplicate")
        ? "Bu slug allaqachon mavjud."
        : "Yaratib bo‘lmadi. Admin huquqingizni tekshiring.",
    };
  }
  yangila();
  return { muvaffaqiyat: `“${nom}” yaratildi.` };
}

/** Yo‘nalishni o‘chiradi. Undagi kurslar yo‘nalishsiz qoladi (o‘chmaydi). */
export async function yonalishOchir(slug: string): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { error } = await supabase.from("yonalishlar").delete().eq("slug", slug);
  if (error) {
    console.error("Yo‘nalishni o‘chirishda xato:", error.message);
    return { xato: "O‘chirib bo‘lmadi." };
  }
  yangila();
  return { muvaffaqiyat: "O‘chirildi." };
}
