import { supabaseServer } from "@/lib/supabase/server";

export type Yonalish = {
  slug: string;
  nom: string;
  tavsif: string;
  /** Ikona kaliti — `yonalishIkonasi()` bilan komponentga aylanadi. */
  ikona: string;
  faol: boolean;
  tartib: number;
};

/**
 * Baza ulanmagan paytda saytni bo‘sh qoldirmaslik uchun zaxira ro‘yxat.
 * Asosiy manba — `yonalishlar` jadvali (admin paneldan boshqariladi).
 */
const ZAXIRA: Yonalish[] = [
  { slug: "frontend", nom: "Frontend Development", tavsif: "HTML, CSS, JavaScript va React bilan zamonaviy interfeys qurish.", ikona: "code", faol: true, tartib: 1 },
  { slug: "backend", nom: "Backend Development", tavsif: "Server, API va ma’lumotlar bazasi — ilovaning ichki qismi.", ikona: "database", faol: true, tartib: 2 },
  { slug: "data-science", nom: "Data Science", tavsif: "Ma’lumotlarni tahlil qilish, vizualizatsiya va mashinaviy o‘qitish.", ikona: "chart", faol: true, tartib: 3 },
  { slug: "ui-ux", nom: "UI/UX Design", tavsif: "Foydalanuvchi tajribasi, interfeys dizayni va prototiplash.", ikona: "palette", faol: true, tartib: 4 },
];

const USTUNLAR = "slug, nom, tavsif, ikona, faol, tartib";

async function oqi(faqatFaol: boolean): Promise<Yonalish[]> {
  const supabase = await supabaseServer();
  if (!supabase) return faqatFaol ? ZAXIRA : [];

  let sorov = supabase.from("yonalishlar").select(USTUNLAR);
  if (faqatFaol) sorov = sorov.eq("faol", true);
  const { data, error } = await sorov.order("tartib", { ascending: true });

  if (error) {
    console.error("Yo‘nalishlarni olishda xato:", error.message);
    return faqatFaol ? ZAXIRA : [];
  }
  return (data ?? []) as Yonalish[];
}

/** Saytda ko‘rinadigan (faol) yo‘nalishlar. */
export function yonalishlarRoyxati() {
  return oqi(true);
}

/** Admin uchun — yashirinlari bilan. */
export function adminYonalishlari() {
  return oqi(false);
}

/** Bitta faol yo‘nalish — topilmasa null. */
export async function yonalishTopish(slug: string): Promise<Yonalish | null> {
  const royxat = await oqi(true);
  return royxat.find((y) => y.slug === slug) ?? null;
}
