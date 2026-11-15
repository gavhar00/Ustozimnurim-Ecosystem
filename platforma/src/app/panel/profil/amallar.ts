"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { QIZIQISHLAR } from "@/lib/turlar";

export type ProfilHolati = {
  xato?: string;
  muvaffaqiyat?: string;
};

function matn(formData: FormData, kalit: string, maks = 300): string {
  return String(formData.get(kalit) ?? "").trim().slice(0, maks);
}

function havolaTozala(qiymat: string): string | null {
  const t = qiymat.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

/** Profil ma'lumotlarini yangilaydi. */
export async function profilniYangila(
  _oldingi: ProfilHolati,
  formData: FormData,
): Promise<ProfilHolati> {
  const toliqIsm = matn(formData, "toliq_ism", 80);
  const username = matn(formData, "username", 20).toLowerCase();
  const bio = matn(formData, "bio", 500);
  const kasb = matn(formData, "kasb", 40);
  const talim = matn(formData, "talim", 150);
  const joylashuv = matn(formData, "joylashuv", 100);
  const maqsad = matn(formData, "maqsad", 400);
  const tillar = matn(formData, "tillar", 200);
  const hamkorlik = formData.get("hamkorlikka_ochiq") === "on";
  const qiziqishlar = formData
    .getAll("qiziqishlar")
    .map(String)
    .filter((q) => (QIZIQISHLAR as readonly string[]).includes(q));

  if (toliqIsm.length < 2) {
    return { xato: "Ism kamida 2 ta belgidan iborat bo‘lishi kerak." };
  }
  if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
    return {
      xato:
        "Foydalanuvchi nomi 3–20 ta belgi: faqat kichik lotin harflari, raqam va _ .",
    };
  }

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const { error } = await supabase
    .from("profillar")
    .update({
      toliq_ism: toliqIsm,
      username: username || null,
      bio: bio || null,
      kasb: kasb || null,
      talim: talim || null,
      joylashuv: joylashuv || null,
      maqsad: maqsad || null,
      tillar: tillar
        ? tillar.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10)
        : [],
      qiziqishlar,
      hamkorlikka_ochiq: hamkorlik,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profilni yangilashda xato:", error.message);
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { xato: "Bu foydalanuvchi nomi band. Boshqasini tanlang." };
    }
    if (error.message.includes("username_shakli")) {
      return { xato: "Foydalanuvchi nomi shakli noto‘g‘ri." };
    }
    return { xato: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/panel", "layout");
  if (username) revalidatePath(`/profil/${username}`);
  return { muvaffaqiyat: "Profil saqlandi." };
}

/** Ijtimoiy va portfolio havolalarini yangilaydi. */
export async function havolalarniYangila(
  _oldingi: ProfilHolati,
  formData: FormData,
): Promise<ProfilHolati> {
  const havolalar = {
    github: havolaTozala(matn(formData, "github", 200)),
    telegram: havolaTozala(matn(formData, "telegram", 200)),
    linkedin: havolaTozala(matn(formData, "linkedin", 200)),
    portfolio: havolaTozala(matn(formData, "portfolio", 200)),
  };

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const toza = Object.fromEntries(
    Object.entries(havolalar).filter(([, q]) => q !== null),
  );

  const { error } = await supabase
    .from("profillar")
    .update({ havolalar: toza })
    .eq("id", user.id);

  if (error) {
    console.error("Havolalarni yangilashda xato:", error.message);
    return { xato: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/panel/profil");
  return { muvaffaqiyat: "Havolalar saqlandi." };
}

/** Yangi ko'nikma qo'shadi. */
export async function konikmaQosh(
  _oldingi: ProfilHolati,
  formData: FormData,
): Promise<ProfilHolati> {
  const nom = matn(formData, "nom", 40);
  const turkum = matn(formData, "turkum", 20) || "texnologiya";
  const daraja = matn(formData, "daraja", 20) || "boshlangich";

  if (nom.length < 2) return { xato: "Ko‘nikma nomi juda qisqa." };

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const { error } = await supabase
    .from("konikmalar")
    .insert({ profil_id: user.id, nom, turkum, daraja });

  if (error) {
    console.error("Ko‘nikma qo‘shishda xato:", error.message);
    return {
      xato: error.message.includes("duplicate")
        ? "Bu ko‘nikma allaqachon qo‘shilgan."
        : "Ko‘nikma qo‘shishda xatolik yuz berdi.",
    };
  }

  revalidatePath("/panel/profil");
  return { muvaffaqiyat: `“${nom}” qo‘shildi.` };
}

/** Ko'nikmani o'chiradi. */
export async function konikmaOchir(id: string): Promise<ProfilHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { error } = await supabase.from("konikmalar").delete().eq("id", id);

  if (error) {
    console.error("Ko‘nikmani o‘chirishda xato:", error.message);
    return { xato: "O‘chirishda xatolik yuz berdi." };
  }

  revalidatePath("/panel/profil");
  return {};
}

/** Yuklangan rasm manzilini profilga saqlaydi. */
export async function rasmniSaqla(
  turi: "avatar" | "muqova",
  url: string,
): Promise<ProfilHolati> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const maydon = turi === "avatar" ? "avatar_url" : "muqova_url";

  const { error } = await supabase
    .from("profillar")
    .update({ [maydon]: url || null })
    .eq("id", user.id);

  if (error) {
    console.error("Rasmni saqlashda xato:", error.message);
    return { xato: "Rasmni saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/panel", "layout");
  return { muvaffaqiyat: turi === "avatar" ? "Avatar yangilandi." : "Muqova yangilandi." };
}
