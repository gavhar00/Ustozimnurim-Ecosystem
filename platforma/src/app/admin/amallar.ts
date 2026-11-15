"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { Rol } from "@/lib/rollar";

export type AdminHolati = { xato?: string; muvaffaqiyat?: string };

/** Matndan xavfsiz slug yasaydi. */
function slugla(matn: string): string {
  return matn
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/** Yangi kurs yaratadi (qoralama holatida). */
export async function kursYarat(
  _oldingi: AdminHolati,
  formData: FormData,
): Promise<AdminHolati> {
  const nom = String(formData.get("nom") ?? "").trim();
  const qisqaTavsif = String(formData.get("qisqa_tavsif") ?? "").trim();
  const tavsif = String(formData.get("tavsif") ?? "").trim();
  const daraja = String(formData.get("daraja") ?? "boshlangich");
  const yonalish = String(formData.get("yonalish_slug") ?? "").trim();
  const ustozIsmi = String(formData.get("ustoz_ismi") ?? "").trim();

  if (nom.length < 3) return { xato: "Kurs nomi kamida 3 ta belgi bo‘lsin." };
  if (qisqaTavsif.length < 10) {
    return { xato: "Qisqa tavsif kamida 10 ta belgi bo‘lsin." };
  }

  const slug = slugla(nom);
  if (!slug) return { xato: "Nomdan slug yasab bo‘lmadi — lotin harflarini qo‘shing." };

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { error } = await supabase.from("kurslar").insert({
    slug,
    nom,
    qisqa_tavsif: qisqaTavsif,
    tavsif: tavsif || null,
    daraja,
    yonalish_slug: yonalish || null,
    ustoz_ismi: ustozIsmi || null,
    holat: "qoralama",
  });

  if (error) {
    console.error("Kurs yaratishda xato:", error.message);
    return {
      xato: error.message.includes("duplicate")
        ? "Bu nomdagi kurs allaqachon mavjud."
        : "Kurs yaratishda xatolik yuz berdi.",
    };
  }

  revalidatePath("/admin/kurslar");
  revalidatePath("/kurslar");
  return { muvaffaqiyat: `“${nom}” yaratildi (qoralama).` };
}

/** Kurs holatini o‘zgartiradi: qoralama ↔ chop etilgan. */
export async function kursHolatini(
  kursId: string,
  holat: "qoralama" | "chop_etilgan" | "arxiv",
): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { error } = await supabase
    .from("kurslar")
    .update({ holat })
    .eq("id", kursId);

  if (error) {
    console.error("Holatni o‘zgartirishda xato:", error.message);
    return { xato: "Holatni o‘zgartirib bo‘lmadi." };
  }

  revalidatePath("/admin/kurslar");
  revalidatePath("/kurslar");
  return { muvaffaqiyat: "Holat yangilandi." };
}

/** Kursga yangi dars qo‘shadi. */
export async function darsYarat(
  kursId: string,
  _oldingi: AdminHolati,
  formData: FormData,
): Promise<AdminHolati> {
  const nom = String(formData.get("nom") ?? "").trim();
  const turi = String(formData.get("turi") ?? "video");
  const davomiylik = Number(formData.get("davomiylik_daqiqa") ?? 0);
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const yoriqnoma = String(formData.get("yoriqnoma") ?? "").trim();
  const boshlangichKod = String(formData.get("boshlangich_kod") ?? "");

  if (nom.length < 3) return { xato: "Dars nomi kamida 3 ta belgi bo‘lsin." };

  const slug = slugla(nom);
  if (!slug) return { xato: "Nomdan slug yasab bo‘lmadi — lotin harflarini qo‘shing." };

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  // Tartibni oxirgi darsdan keyin qo‘yamiz
  const { data: oxirgi } = await supabase
    .from("darslar")
    .select("tartib")
    .eq("kurs_id", kursId)
    .order("tartib", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tartib = ((oxirgi?.tartib as number | undefined) ?? 0) + 1;

  const { error } = await supabase.from("darslar").insert({
    kurs_id: kursId,
    slug,
    nom,
    tartib,
    turi,
    davomiylik_daqiqa: Number.isFinite(davomiylik) ? Math.max(davomiylik, 0) : 0,
    video_url: videoUrl || null,
    yoriqnoma: yoriqnoma || null,
    boshlangich_kod: boshlangichKod || null,
    holat: "chop_etilgan",
  });

  if (error) {
    console.error("Dars yaratishda xato:", error.message);
    return {
      xato: error.message.includes("duplicate")
        ? "Bu nomdagi dars shu kursda allaqachon bor."
        : "Dars yaratishda xatolik yuz berdi.",
    };
  }

  // Kursdagi darslar sonini va davomiyligini yangilaymiz
  const { count } = await supabase
    .from("darslar")
    .select("*", { count: "exact", head: true })
    .eq("kurs_id", kursId);

  const { data: barchasi } = await supabase
    .from("darslar")
    .select("davomiylik_daqiqa")
    .eq("kurs_id", kursId);

  const jami = (barchasi ?? []).reduce(
    (yigindi, d) => yigindi + ((d.davomiylik_daqiqa as number) ?? 0),
    0,
  );

  await supabase
    .from("kurslar")
    .update({ darslar_soni: count ?? 0, davomiylik_daqiqa: jami })
    .eq("id", kursId);

  revalidatePath(`/admin/kurslar/${kursId}`);
  revalidatePath("/kurslar");
  return { muvaffaqiyat: `“${nom}” darsi qo‘shildi.` };
}

/** Foydalanuvchi rolini o‘zgartiradi. Bazada ham trigger bilan qo‘riqlangan. */
export async function rolniOzgartir(
  foydalanuvchiId: string,
  rol: Rol,
): Promise<AdminHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { error } = await supabase
    .from("profillar")
    .update({ rol })
    .eq("id", foydalanuvchiId);

  if (error) {
    console.error("Rolni o‘zgartirishda xato:", error.message);
    return { xato: "Rolni o‘zgartirib bo‘lmadi." };
  }

  revalidatePath("/admin/foydalanuvchilar");
  return { muvaffaqiyat: "Rol yangilandi." };
}
