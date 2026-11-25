"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { mualliflarXaritasi } from "@/lib/data/lenta";
import {
  lahzaIzohlari,
  lahzaLaykchilari,
  lahzalarLentasi,
  lahzalarniTayyorla,
} from "@/lib/data/lahzalar-lenta";
import {
  IZOH_MAKS_MATN,
  POST_BUCKET,
  POST_MAKS_RASM,
  type AmalNatijasi,
} from "@/lib/lenta-turlari";
import {
  LAHZA_MAKS_SOZ,
  sozlarSoni,
  type LahzaIzoh,
  type LahzaLaykchi,
  type LahzaPost,
} from "@/lib/lahza-turlari";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const USTUNLAR =
  "id, profil_id, matn, rasmlar, asl_id, layklar_soni, izohlar_soni, repostlar_soni, yaratilgan, yangilangan";

type Kirgan = {
  supabase: NonNullable<Awaited<ReturnType<typeof supabaseServer>>>;
  id: string;
  admin: boolean;
};

/** Yozish/layk/izoh/repost uchun: kirgan va profilini to‘ldirgan foydalanuvchi. */
async function kirganFoydalanuvchi(): Promise<Kirgan | { xato: string }> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Avval hisobingizga kiring." };
  const { data } = await supabase
    .from("profillar")
    .select("rol, profil_toldirilgan")
    .eq("id", user.id)
    .maybeSingle();
  if (!data?.profil_toldirilgan) return { xato: "Avval profilingizni to‘ldiring." };
  return { supabase, id: user.id, admin: data.rol === "admin" };
}
const xatoMi = (x: Kirgan | { xato: string }): x is { xato: string } => "xato" in x;

function matnTozala(qiymat: unknown, limit: number): string {
  return typeof qiymat === "string" ? qiymat.replace(/\r\n/g, "\n").trim().slice(0, limit) : "";
}

function rasmPrefiksi(uid: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${POST_BUCKET}/${uid}/`;
}

function rasmlarniTekshir(xom: unknown, uid: string): string[] | null {
  if (!Array.isArray(xom) || xom.length > POST_MAKS_RASM) return null;
  const prefiks = rasmPrefiksi(uid);
  const natija: string[] = [];
  for (const url of xom) {
    if (
      typeof url !== "string" ||
      !url.startsWith(prefiks) ||
      url.length > 300 ||
      url.slice(prefiks.length).includes("/") ||
      url.includes("..")
    ) {
      return null;
    }
    if (!natija.includes(url)) natija.push(url);
  }
  return natija;
}

async function rasmlarniOchir(k: Kirgan, urllar: string[], egasiId: string) {
  const prefiks = rasmPrefiksi(egasiId);
  const yollar = urllar
    .filter((u) => u.startsWith(prefiks))
    .map((u) => `${egasiId}/${u.slice(prefiks.length)}`);
  if (yollar.length === 0) return;
  const { error } = await k.supabase.storage.from(POST_BUCKET).remove(yollar);
  if (error) console.error("Lahza rasmlarini o‘chirishda xato:", error.message);
}

function revalidatsiya() {
  revalidatePath("/lahzalar");
}

/** Yangi lahza: hech qanday tasdiqsiz darhol e’lon qilinadi. */
export async function lahzaYarat(kirish: {
  matn: string;
  rasmlar: string[];
}): Promise<AmalNatijasi<LahzaPost>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };

  const matn = typeof kirish?.matn === "string" ? kirish.matn.replace(/\r\n/g, "\n").trim() : "";
  if (sozlarSoni(matn) > LAHZA_MAKS_SOZ) {
    return { ok: false, xato: `Matn ${LAHZA_MAKS_SOZ} ta so‘zdan oshmasligi kerak.` };
  }
  if (matn.length > 60000) return { ok: false, xato: "Matn juda uzun." };
  const rasmlar = rasmlarniTekshir(kirish?.rasmlar ?? [], k.id);
  if (!rasmlar) return { ok: false, xato: "Rasmlar noto‘g‘ri yuklangan. Qayta urinib ko‘ring." };
  if (!matn && rasmlar.length === 0) {
    return { ok: false, xato: "Matn yozing yoki rasm qo‘shing." };
  }

  const { data, error } = await k.supabase
    .from("lahzalar")
    .insert({
      profil_id: k.id,
      matn,
      rasmlar,
      rasm_url: rasmlar[0] ?? null,
      rozilik: true,
      holat: "tasdiqlangan",
    })
    .select(USTUNLAR)
    .single();
  if (error || !data) {
    console.error("Lahza yaratishda xato:", error?.message);
    return { ok: false, xato: "Lahzani joylab bo‘lmadi. Qayta urinib ko‘ring." };
  }
  const [lahza] = await lahzalarniTayyorla(k.supabase, [data as never], k.id);
  revalidatsiya();
  return { ok: true, malumot: lahza };
}

/** Lahza yoki repostni o‘chiradi: egasi yoki admin. */
export async function lahzaniOchir(id: string): Promise<AmalNatijasi> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };
  const { data: l } = await k.supabase
    .from("lahzalar")
    .select("profil_id, rasmlar, asl_id")
    .eq("id", id)
    .maybeSingle();
  if (!l) return { ok: false, xato: "Lahza topilmadi." };
  if (l.profil_id !== k.id && !k.admin) {
    return { ok: false, xato: "Bu lahzani o‘chirishga huquqingiz yo‘q." };
  }
  const { data, error } = await k.supabase.from("lahzalar").delete().eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    console.error("Lahzani o‘chirishda xato:", error?.message);
    return { ok: false, xato: "O‘chirib bo‘lmadi. Qayta urinib ko‘ring." };
  }
  await rasmlarniOchir(k, (l.rasmlar ?? []) as string[], l.profil_id as string);
  revalidatsiya();
  return { ok: true, malumot: undefined };
}

/** Keyingi sahifa. Mehmonlar ham ko‘ra oladi. */
export async function lahzalarniYukla(
  keyin: string,
  tadbir?: string | null,
): Promise<AmalNatijasi<{ lahzalar: LahzaPost[]; davomi: string | null }>> {
  const supabase = await supabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const natija = await lahzalarLentasi(user?.id ?? null, keyin, tadbir ?? null);
  if (natija.xato) return { ok: false, xato: "Lahzalarni yuklab bo‘lmadi." };
  return { ok: true, malumot: { lahzalar: natija.lahzalar, davomi: natija.davomi } };
}

/** Layk qo‘yish yoki olib tashlash. Yangi sonni qaytaradi. */
export async function laykniAlmashtir(
  lahzaId: string,
  hozirLayk: boolean,
): Promise<AmalNatijasi<{ layklar_soni: number; ozim_layk: boolean }>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };

  const { error } = hozirLayk
    ? await k.supabase.from("lahza_layklari").delete().eq("lahza_id", lahzaId).eq("profil_id", k.id)
    : await k.supabase.from("lahza_layklari").insert({ lahza_id: lahzaId, profil_id: k.id });
  if (error && !error.message.includes("duplicate")) {
    console.error("Layk xatosi:", error.message);
    return { ok: false, xato: "Amalni bajarib bo‘lmadi." };
  }
  const { data } = await k.supabase.from("lahzalar").select("layklar_soni").eq("id", lahzaId).maybeSingle();
  return {
    ok: true,
    malumot: { layklar_soni: (data?.layklar_soni as number | undefined) ?? 0, ozim_layk: !hozirLayk },
  };
}

export async function laykchilarniOl(lahzaId: string): Promise<AmalNatijasi<LahzaLaykchi[]>> {
  const royxat = await lahzaLaykchilari(lahzaId);
  if (!royxat) return { ok: false, xato: "Ro‘yxatni yuklab bo‘lmadi." };
  return { ok: true, malumot: royxat };
}

/** Repost qilish yoki repostni bekor qilish (asl lahza id'si beriladi). */
export async function repostniAlmashtir(
  aslId: string,
  hozirRepost: boolean,
): Promise<AmalNatijasi<{ repostlar_soni: number; ozim_repost: boolean; repost: LahzaPost | null }>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };

  let repost: LahzaPost | null = null;
  if (hozirRepost) {
    const { error } = await k.supabase
      .from("lahzalar")
      .delete()
      .eq("asl_id", aslId)
      .eq("profil_id", k.id);
    if (error) return { ok: false, xato: "Repostni bekor qilib bo‘lmadi." };
  } else {
    const { data, error } = await k.supabase
      .from("lahzalar")
      .insert({ profil_id: k.id, asl_id: aslId, matn: "", rozilik: true, holat: "tasdiqlangan" })
      .select(USTUNLAR)
      .single();
    if (error || !data) {
      const xabar = error?.message ?? "";
      if (xabar.includes("O'z lahzangizni")) return { ok: false, xato: "O‘z lahzangizni repost qilib bo‘lmaydi." };
      if (xabar.includes("duplicate")) return { ok: false, xato: "Siz bu lahzani allaqachon repost qilgansiz." };
      console.error("Repost xatosi:", xabar);
      return { ok: false, xato: "Repost qilib bo‘lmadi." };
    }
    [repost] = await lahzalarniTayyorla(k.supabase, [data as never], k.id);
  }
  const { data: son } = await k.supabase.from("lahzalar").select("repostlar_soni").eq("id", aslId).maybeSingle();
  revalidatsiya();
  return {
    ok: true,
    malumot: {
      repostlar_soni: (son?.repostlar_soni as number | undefined) ?? 0,
      ozim_repost: !hozirRepost,
      repost,
    },
  };
}

export async function izohlarniOl(lahzaId: string): Promise<AmalNatijasi<LahzaIzoh[]>> {
  const izohlar = await lahzaIzohlari(lahzaId);
  if (!izohlar) return { ok: false, xato: "Izohlarni yuklab bo‘lmadi." };
  return { ok: true, malumot: izohlar };
}

export async function izohYoz(lahzaId: string, xomMatn: string): Promise<AmalNatijasi<LahzaIzoh>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };
  const matn = matnTozala(xomMatn, IZOH_MAKS_MATN);
  if (!matn) return { ok: false, xato: "Izoh bo‘sh bo‘lmasligi kerak." };

  const { data, error } = await k.supabase
    .from("lahza_izohlari")
    .insert({ lahza_id: lahzaId, muallif_id: k.id, matn })
    .select("id, lahza_id, muallif_id, matn, yaratilgan")
    .single();
  if (error || !data) {
    console.error("Lahza izohi xatosi:", error?.message);
    return { ok: false, xato: "Izohni yuborib bo‘lmadi." };
  }
  const mualliflar = await mualliflarXaritasi(k.supabase, [k.id]);
  return {
    ok: true,
    malumot: {
      ...(data as Omit<LahzaIzoh, "muallif">),
      muallif: mualliflar.get(k.id) ?? { id: k.id, toliq_ism: "Siz", username: null, avatar_url: null, kasb: null },
    },
  };
}

export async function izohniOchir(izohId: string): Promise<AmalNatijasi> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };
  const { data, error } = await k.supabase.from("lahza_izohlari").delete().eq("id", izohId).select("id");
  if (error || !data || data.length === 0) return { ok: false, xato: "Izohni o‘chirib bo‘lmadi." };
  return { ok: true, malumot: undefined };
}
