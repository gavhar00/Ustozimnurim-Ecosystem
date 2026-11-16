"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { profilToldirishFoizi } from "@/lib/profil-toldirish";
import { QIZIQISHLAR } from "@/lib/turlar";

export type ProfilToldirishNatija = { xato?: string; muvaffaqiyat?: boolean; foiz?: number };

function qiymat(data: FormData, kalit: string, limit: number): string {
  return String(data.get(kalit) ?? "").trim().slice(0, limit);
}

function royxat(data: FormData, kalit: string, limit = 12): string[] {
  return String(data.get(kalit) ?? "")
    .split(",")
    .map((item) => item.trim().slice(0, 60))
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, limit);
}

export async function profilToldirishniSaqla(
  _oldingi: ProfilToldirishNatija,
  data: FormData,
): Promise<ProfilToldirishNatija> {
  const ism = qiymat(data, "ism", 60);
  const familiya = qiymat(data, "familiya", 60);
  const tugilganSana = qiymat(data, "tugilgan_sana", 10);
  const talim = qiymat(data, "talim", 150);
  const sinfKurs = qiymat(data, "sinf_kurs", 60);
  const joylashuv = qiymat(data, "joylashuv", 100);
  const bio = qiymat(data, "bio", 500);
  const maqsad = qiymat(data, "maqsad", 400);
  const qiziqishlar = data.getAll("qiziqishlar")
    .map(String)
    .filter((q) => (QIZIQISHLAR as readonly string[]).includes(q))
    .slice(0, 10);
  const organishYonalishlari = royxat(data, "organish_yonalishlari");
  const organmoqchiKonikmalar = royxat(data, "organmoqchi_konikmalar");
  const mavjudKonikmalar = royxat(data, "mavjud_konikmalar");

  if (ism.length < 2 || familiya.length < 2) {
    return { xato: "Ism va familiyani kamida 2 ta belgidan kiriting." };
  }
  const parsedBirthDate = /^\d{4}-\d{2}-\d{2}$/.test(tugilganSana)
    ? new Date(`${tugilganSana}T00:00:00Z`)
    : null;
  if (
    !parsedBirthDate ||
    Number.isNaN(parsedBirthDate.getTime()) ||
    parsedBirthDate.toISOString().slice(0, 10) !== tugilganSana ||
    parsedBirthDate > new Date()
  ) {
    return { xato: "Tug‘ilgan sanani to‘g‘ri kiriting." };
  }

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const fullName = `${ism} ${familiya}`.trim();
  const usernameStem = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 4);
  const { data: existing } = await supabase
    .from("profillar")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const username = existing?.username || `oquvchi_${usernameStem || "talaba"}_${user.id.slice(0, 4)}`;

  const { error: profilXatosi } = await supabase
    .from("profillar")
    .update({
      toliq_ism: fullName,
      username,
      talim: talim || null,
      sinf_kurs: sinfKurs || null,
      joylashuv: joylashuv || null,
      qiziqishlar,
      organish_yonalishlari: organishYonalishlari,
      organmoqchi_konikmalar: organmoqchiKonikmalar,
      mavjud_konikmalar: mavjudKonikmalar,
      maqsad: maqsad || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  if (profilXatosi) {
    console.error("Profilni saqlashda xato:", profilXatosi.message);
    if (profilXatosi.message.includes("duplicate") || profilXatosi.message.includes("unique")) {
      return { xato: "Profil nomi bilan bog‘liq xatolik yuz berdi. Qayta urinib ko‘ring." };
    }
    return { xato: "Profilni saqlab bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring." };
  }

  const { error: shaxsiyXatosi } = await supabase
    .from("profil_shaxsiy")
    .upsert(
      { profil_id: user.id, tugilgan_sana: tugilganSana, yangilangan: new Date().toISOString() },
      { onConflict: "profil_id" },
    );
  if (shaxsiyXatosi) {
    console.error("Shaxsiy profilni saqlashda xato:", shaxsiyXatosi.message);
    return { xato: "Tug‘ilgan sanani saqlab bo‘lmadi." };
  }

  revalidatePath("/profil/toldirish");
  revalidatePath("/panel", "layout");
  revalidatePath("/panel/profil");
  revalidatePath(`/profil/${username}`);
  const foiz = profilToldirishFoizi({
    toliq_ism: fullName,
    avatar_url: existing?.avatar_url,
    tugilgan_sana: tugilganSana,
    talim,
    sinf_kurs: sinfKurs,
    joylashuv,
    qiziqishlar,
    organish_yonalishlari: organishYonalishlari,
    organmoqchi_konikmalar: organmoqchiKonikmalar,
    mavjud_konikmalar: mavjudKonikmalar,
    maqsad,
    bio,
  });
  return { muvaffaqiyat: true, foiz };
}
