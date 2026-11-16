"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LoyihaHolatiNatija = { xato?: string; muvaffaqiyat?: string };
const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function matn(formData: FormData, kalit: string, maks = 300): string {
  return String(formData.get(kalit) ?? "").trim().slice(0, maks);
}

function havolaTozala(qiymat: string): string | null {
  const t = qiymat.trim();
  if (!t) return null;
  const manzil = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const url = new URL(manzil);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function loyihaRasmYoli(url: string | null, foydalanuvchiId: string): string | null {
  if (!url || !STORAGE_URL) return null;
  try {
    const rasm = new URL(url);
    const loyihaStorage = new URL(STORAGE_URL);
    const prefix = "/storage/v1/object/public/loyiha-rasmlari/";
    if (rasm.origin !== loyihaStorage.origin || !rasm.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(rasm.pathname.slice(prefix.length));
    return path.startsWith(`${foydalanuvchiId}/`) ? path : null;
  } catch {
    return null;
  }
}

async function rasmlarniOchir(
  supabase: NonNullable<Awaited<ReturnType<typeof supabaseServer>>>,
  urls: Array<string | null>,
  foydalanuvchiId: string,
) {
  const paths = [...new Set(urls.map((url) => loyihaRasmYoli(url, foydalanuvchiId)).filter((path): path is string => Boolean(path)))];
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from("loyiha-rasmlari").remove(paths);
  if (error) console.error("Loyiha rasmlarini o‘chirishda xato:", error.message);
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
  const muqovaUrl = havolaTozala(matn(formData, "muqova_url", 500));
  const logoUrl = havolaTozala(matn(formData, "logo_url", 500));
  const egalikRol = matn(formData, "egalik_rol", 80);

  if (nom.length < 3) return { xato: "Loyiha nomi kamida 3 ta belgi bo‘lsin." };
  if (tavsif.length < 10) {
    return { xato: "Tavsif kamida 10 ta belgidan iborat bo‘lsin." };
  }
  if (!["goya", "jarayonda", "tugallangan"].includes(holat)) {
    return { xato: "Loyiha holatini to‘g‘ri tanlang." };
  }
  if ((matn(formData, "github_url", 200) && !github) || (matn(formData, "demo_url", 200) && !demo)) {
    return { xato: "Havolani http yoki https manzili sifatida kiriting." };
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
    muqova_url: muqovaUrl,
    logo_url: logoUrl,
    egalik_rol: egalikRol || null,
  });

  if (error) {
    console.error("Loyiha qo‘shishda xato:", error.message);
    return { xato: "Loyiha qo‘shishda xatolik yuz berdi." };
  }

  revalidatePath("/panel/loyihalarim");
  revalidatePath("/hamjamiyat/loyihalar");
  return { muvaffaqiyat: `“${nom}” portfolioga qo‘shildi.` };
}

/** Egasi bo'lgan loyiha tafsilotlarini yangilaydi. */
export async function loyihaTahrirla(
  id: string,
  _oldingi: LoyihaHolatiNatija,
  formData: FormData,
): Promise<LoyihaHolatiNatija> {
  const nom = matn(formData, "nom", 80);
  const tavsif = matn(formData, "tavsif", 1000);
  const githubKiritildi = matn(formData, "github_url", 200);
  const demoKiritildi = matn(formData, "demo_url", 200);
  const github = havolaTozala(githubKiritildi);
  const demo = havolaTozala(demoKiritildi);
  const holat = matn(formData, "holat", 20) as "goya" | "jarayonda" | "tugallangan";
  const texnologiyalar = matn(formData, "texnologiyalar", 200)
    .split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12);

  if (nom.length < 3) return { xato: "Loyiha nomi kamida 3 ta belgi bo‘lsin." };
  if (tavsif.length < 10) return { xato: "Tavsif kamida 10 ta belgidan iborat bo‘lsin." };
  if (!["goya", "jarayonda", "tugallangan"].includes(holat)) {
    return { xato: "Loyiha holatini to‘g‘ri tanlang." };
  }
  if ((githubKiritildi && !github) || (demoKiritildi && !demo)) {
    return { xato: "Havolani http yoki https manzili sifatida kiriting." };
  }

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const { data: oldingi, error: olishXatosi } = await supabase
    .from("loyihalar")
    .select("muqova_url, logo_url")
    .eq("id", id)
    .eq("muallif_id", user.id)
    .maybeSingle();
  if (olishXatosi || !oldingi) {
    return { xato: "Loyiha topilmadi yoki uni tahrirlash huquqingiz yo‘q." };
  }

  const yangiMuqova = havolaTozala(matn(formData, "muqova_url", 500));
  const yangiLogo = havolaTozala(matn(formData, "logo_url", 500));
  const { data, error } = await supabase
    .from("loyihalar")
    .update({
      nom,
      tavsif,
      turkum: matn(formData, "turkum", 40) || "Umumiy",
      holat,
      texnologiyalar,
      github_url: github,
      demo_url: demo,
      muqova_url: yangiMuqova,
      logo_url: yangiLogo,
      egalik_rol: matn(formData, "egalik_rol", 80) || null,
    })
    .eq("id", id)
    .eq("muallif_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Loyihani yangilashda xato:", error.message);
    return { xato: "Loyiha topilmadi yoki uni tahrirlash huquqingiz yo‘q." };
  }
  await rasmlarniOchir(
    supabase,
    [
      oldingi.muqova_url !== yangiMuqova ? oldingi.muqova_url : null,
      oldingi.logo_url !== yangiLogo ? oldingi.logo_url : null,
    ],
    user.id,
  );
  revalidatePath("/panel/loyihalarim");
  revalidatePath(`/hamjamiyat/loyihalar/${id}`);
  revalidatePath("/hamjamiyat/loyihalar");
  return { muvaffaqiyat: "O‘zgarishlar saqlandi." };
}

/** Loyihani o'chiradi. */
export async function loyihaOchir(id: string): Promise<LoyihaHolatiNatija> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const { data: loyiha, error: olishXatosi } = await supabase
    .from("loyihalar")
    .select("muqova_url, logo_url")
    .eq("id", id)
    .eq("muallif_id", user.id)
    .maybeSingle();
  if (olishXatosi || !loyiha) {
    return { xato: "Loyiha topilmadi yoki uni o‘chirish huquqingiz yo‘q." };
  }

  const { data, error } = await supabase
    .from("loyihalar")
    .delete()
    .eq("id", id)
    .eq("muallif_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Loyihani o‘chirishda xato:", error.message);
    return { xato: "Loyiha o‘chirilmadi yoki uni boshqarish huquqingiz yo‘q." };
  }

  await rasmlarniOchir(supabase, [loyiha.muqova_url, loyiha.logo_url], user.id);
  revalidatePath("/panel/loyihalarim");
  return {};
}
