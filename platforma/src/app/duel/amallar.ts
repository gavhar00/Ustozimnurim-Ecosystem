"use server";

import { revalidatePath } from "next/cache";
import { joriyProfil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { AmalNatijasi } from "@/lib/lenta-turlari";
import type { DuelHolati } from "@/lib/duel-turlari";

async function klient() {
  const profil = await joriyProfil();
  const supabase = await supabaseServer();
  if (!profil || !supabase) return null;
  return { supabase, profil };
}

/** Bazadagi xatolarning o‘zbekcha matnini foydalanuvchiga ko‘rsatamiz. */
function xatoMatni(m: string) {
  const bor = (s: string) => m.includes(s);
  if (bor("tugallanmagan duel")) return "Bu foydalanuvchi bilan tugallanmagan duel bor.";
  if (bor("juda ko‘p")) return "Javob kutilayotgan takliflaringiz juda ko‘p. Avval ba’zilarini yakunlang.";
  if (bor("savollar yetarli emas")) return "Bu yo‘nalishda savollar hali yetarli emas.";
  if (bor("vaqti tugagan")) return "Duel vaqti tugagan yoki hali boshlanmagan.";
  if (bor("Ruxsat yo")) return "Bu amalga ruxsat yo‘q.";
  if (bor("allaqachon hal")) return "Bu taklif allaqachon hal qilingan.";
  return "Amalni bajarib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.";
}

export async function duelYarat(
  raqibId: string,
  yonalish: string,
  qiyinlik: string,
  davomiylik: number,
  soni: number,
): Promise<AmalNatijasi<{ id: string }>> {
  const k = await klient();
  if (!k) return { ok: false, xato: "Avval tizimga kiring." };
  const { data, error } = await k.supabase.rpc("duel_yarat", {
    p_raqib: raqibId,
    p_yonalish: yonalish,
    p_qiyinlik: qiyinlik,
    p_davomiylik: davomiylik,
    p_soni: soni,
  });
  if (error || typeof data !== "string") return { ok: false, xato: xatoMatni(error?.message ?? "") };
  revalidatePath("/duel");
  return { ok: true, malumot: { id: data } };
}

async function oddiyAmal(nom: string, args: Record<string, unknown>): Promise<AmalNatijasi> {
  const k = await klient();
  if (!k) return { ok: false, xato: "Avval tizimga kiring." };
  const { error } = await k.supabase.rpc(nom, args);
  if (error) return { ok: false, xato: xatoMatni(error.message) };
  revalidatePath("/duel");
  return { ok: true, malumot: undefined };
}

export async function duelQabul(id: string, qabul: boolean): Promise<AmalNatijasi> {
  return oddiyAmal("duel_qabul", { p_duel: id, p_qabul: qabul });
}
export async function duelBekor(id: string): Promise<AmalNatijasi> {
  return oddiyAmal("duel_bekor", { p_duel: id });
}
export async function duelTayyor(id: string): Promise<AmalNatijasi> {
  return oddiyAmal("duel_tayyor", { p_duel: id });
}

export async function duelJavob(id: string, tartib: number, tanlov: number): Promise<AmalNatijasi> {
  const k = await klient();
  if (!k) return { ok: false, xato: "Avval tizimga kiring." };
  const { error } = await k.supabase.rpc("duel_javob_ber", { p_duel: id, p_tartib: tartib, p_tanlov: tanlov });
  if (error) return { ok: false, xato: xatoMatni(error.message) };
  return { ok: true, malumot: undefined };
}

/** Duel xonasi shu funksiyani har bir necha soniyada chaqiradi; kerak bo‘lsa duelni yakunlaydi. */
export async function duelHolatiniOl(id: string): Promise<DuelHolati | null> {
  const k = await klient();
  if (!k) return null;
  const { data, error } = await k.supabase.rpc("duel_holati", { p_duel: id });
  if (error) return null;
  return (data as DuelHolati | null) ?? null;
}
