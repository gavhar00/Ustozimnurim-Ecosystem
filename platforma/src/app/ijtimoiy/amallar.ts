"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type IjtimoiyHolati = { xato?: string; muvaffaqiyat?: string };

async function joriyFoydalanuvchi() {
  const supabase = await supabaseServer();
  if (!supabase) return { supabase: null, id: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, id: user?.id ?? null };
}

/** Yangi post yozadi. */
export async function postYoz(
  _oldingi: IjtimoiyHolati,
  formData: FormData,
): Promise<IjtimoiyHolati> {
  const matn = String(formData.get("matn") ?? "").trim().slice(0, 2000);
  if (matn.length < 3) return { xato: "Post juda qisqa." };

  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase
    .from("postlar")
    .insert({ muallif_id: id, matn });

  if (error) {
    console.error("Post yozishda xato:", error.message);
    return { xato: "Postni yuborishda xatolik yuz berdi." };
  }

  revalidatePath("/profil", "layout");
  return {};
}

/** Postni o'chiradi. */
export async function postOchir(postId: string): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase.from("postlar").delete().eq("id", postId);
  if (error) {
    console.error("Postni o‘chirishda xato:", error.message);
    return { xato: "O‘chirishda xatolik yuz berdi." };
  }

  revalidatePath("/profil", "layout");
  return {};
}

/** Postni yoqtirish yoki yoqtirishni bekor qilish. */
export async function yoqtirishniAlmashtir(
  postId: string,
  hozirYoqtirilgan: boolean,
): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = hozirYoqtirilgan
    ? await supabase
        .from("post_yoqtirishlari")
        .delete()
        .eq("post_id", postId)
        .eq("foydalanuvchi_id", id)
    : await supabase
        .from("post_yoqtirishlari")
        .insert({ post_id: postId, foydalanuvchi_id: id });

  if (error && !error.message.includes("duplicate")) {
    console.error("Yoqtirishda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/profil", "layout");
  return {};
}

/** Kuzatish yoki kuzatishni bekor qilish. */
export async function kuzatishniAlmashtir(
  profilId: string,
  hozirKuzatyapman: boolean,
): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };
  if (id === profilId) return { xato: "O‘zingizni kuzata olmaysiz." };

  const { error } = hozirKuzatyapman
    ? await supabase
        .from("obunalar")
        .delete()
        .eq("kuzatuvchi_id", id)
        .eq("kuzatilgan_id", profilId)
    : await supabase
        .from("obunalar")
        .insert({ kuzatuvchi_id: id, kuzatilgan_id: profilId });

  if (error && !error.message.includes("duplicate")) {
    console.error("Kuzatishda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/profil", "layout");
  return {};
}

/** Bog'lanish so'rovini yuboradi. */
export async function sorovYubor(profilId: string): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };
  if (id === profilId) return { xato: "O‘zingizga so‘rov yubora olmaysiz." };

  const { error } = await supabase
    .from("boglanishlar")
    .insert({ yuboruvchi_id: id, qabul_qiluvchi_id: profilId });

  if (error) {
    console.error("So‘rov yuborishda xato:", error.message);
    return {
      xato: error.message.includes("duplicate")
        ? "So‘rov allaqachon yuborilgan."
        : "So‘rov yuborishda xatolik yuz berdi.",
    };
  }

  revalidatePath("/profil", "layout");
  revalidatePath("/panel/boglanishlar");
  return { muvaffaqiyat: "So‘rov yuborildi." };
}

/** Kelgan so'rovga javob beradi. */
export async function sorovgaJavob(
  sorovId: string,
  javob: "qabul" | "rad",
): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase
    .from("boglanishlar")
    .update({ holat: javob, yangilangan: new Date().toISOString() })
    .eq("id", sorovId);

  if (error) {
    console.error("So‘rovga javob berishda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/panel/boglanishlar");
  revalidatePath("/profil", "layout");
  return {};
}

/** So'rovni bekor qiladi yoki bog'lanishni uzadi. */
export async function boglanishniOchir(
  sorovId: string,
): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase
    .from("boglanishlar")
    .delete()
    .eq("id", sorovId);

  if (error) {
    console.error("Bog‘lanishni o‘chirishda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/panel/boglanishlar");
  revalidatePath("/profil", "layout");
  return {};
}

/** Loyihaga qo'shilish so'rovini yuboradi. */
export async function loyihagaSorovYubor(
  loyihaId: string,
  xabar: string,
): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase.from("loyiha_sorovlari").insert({
    loyiha_id: loyihaId,
    foydalanuvchi_id: id,
    xabar: xabar.trim().slice(0, 500),
  });

  if (error) {
    console.error("Loyiha so‘rovida xato:", error.message);
    return {
      xato: error.message.includes("duplicate")
        ? "So‘rov allaqachon yuborilgan."
        : "So‘rov yuborishda xatolik yuz berdi.",
    };
  }

  revalidatePath(`/hamjamiyat/loyihalar/${loyihaId}`);
  revalidatePath("/panel/loyihalarim");
  return { muvaffaqiyat: "So‘rov yuborildi." };
}

/** Loyiha egasi so'rovga javob beradi. */
export async function loyihaSoroviganJavob(
  sorovId: string,
  javob: "qabul" | "rad",
): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase
    .from("loyiha_sorovlari")
    .update({ holat: javob })
    .eq("id", sorovId);

  if (error) {
    console.error("So‘rovga javobda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/panel/loyihalarim");
  revalidatePath("/hamjamiyat/loyihalar", "layout");
  return {};
}

/** Jamoadan a'zoni chiqaradi (yoki o'zi chiqadi). */
export async function azoniChiqar(
  loyihaId: string,
  foydalanuvchiId: string,
): Promise<IjtimoiyHolati> {
  const { supabase, id } = await joriyFoydalanuvchi();
  if (!supabase) return { xato: "Baza ulanmagan." };
  if (!id) return { xato: "Avval hisobingizga kiring." };

  const { error } = await supabase
    .from("loyiha_azolari")
    .delete()
    .eq("loyiha_id", loyihaId)
    .eq("foydalanuvchi_id", foydalanuvchiId);

  if (error) {
    console.error("A‘zoni chiqarishda xato:", error.message);
    return { xato: "Amalni bajarib bo‘lmadi." };
  }

  revalidatePath("/panel/loyihalarim");
  revalidatePath(`/hamjamiyat/loyihalar/${loyihaId}`);
  return {};
}
