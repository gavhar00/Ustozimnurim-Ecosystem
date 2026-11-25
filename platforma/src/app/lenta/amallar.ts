"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import {
  lentaPostlari,
  mualliflarXaritasi,
  postIzohlari,
  postlarniTayyorla,
} from "@/lib/data/lenta";
import {
  IZOH_MAKS_MATN,
  POST_BUCKET,
  POST_MAKS_MATN,
  POST_MAKS_RASM,
  type AmalNatijasi,
  type LentaIzoh,
  type LentaPost,
} from "@/lib/lenta-turlari";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

type Kirgan = {
  supabase: NonNullable<Awaited<ReturnType<typeof supabaseServer>>>;
  id: string;
  admin: boolean;
};

/** Faqat kirgan va profilini to‘ldirgan foydalanuvchi amal bajara oladi. */
async function kirganFoydalanuvchi(): Promise<Kirgan | { xato: string }> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  const { data } = await supabase
    .from("profillar")
    .select("rol, profil_toldirilgan")
    .eq("id", user.id)
    .maybeSingle();
  if (!data?.profil_toldirilgan) {
    return { xato: "Avval profilingizni to‘ldiring." };
  }
  return { supabase, id: user.id, admin: data.rol === "admin" };
}

const xatoMi = (x: Kirgan | { xato: string }): x is { xato: string } => "xato" in x;

function matnTozala(qiymat: unknown, limit: number): string {
  return typeof qiymat === "string" ? qiymat.replace(/\r\n/g, "\n").trim().slice(0, limit) : "";
}

function rasmPrefiksi(uid: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${POST_BUCKET}/${uid}/`;
}

/** Faqat foydalanuvchining o‘z papkasidagi rasm havolalarini qabul qiladi. */
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

async function rasmlarniOchir(kirgan: Kirgan, urllar: string[], egasiId: string) {
  const prefiks = rasmPrefiksi(egasiId);
  const yollar = urllar
    .filter((u) => u.startsWith(prefiks))
    .map((u) => `${egasiId}/${u.slice(prefiks.length)}`);
  if (yollar.length === 0) return;
  const { error } = await kirgan.supabase.storage.from(POST_BUCKET).remove(yollar);
  if (error) console.error("Rasmlarni o‘chirishda xato:", error.message);
}

const POST_USTUNLARI =
  "id, muallif_id, matn, rasmlar, yoqtirishlar_soni, izohlar_soni, yaratilgan, yangilangan";

/** Yangi post. Matn yoki kamida bitta rasm bo‘lishi shart. */
export async function postYarat(kirish: {
  matn: string;
  rasmlar: string[];
}): Promise<AmalNatijasi<LentaPost>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };

  const matn = matnTozala(kirish?.matn, POST_MAKS_MATN);
  const rasmlar = rasmlarniTekshir(kirish?.rasmlar ?? [], k.id);
  if (!rasmlar) return { ok: false, xato: "Rasmlar noto‘g‘ri yuklangan. Qayta urinib ko‘ring." };
  if (!matn && rasmlar.length === 0) {
    return { ok: false, xato: "Post bo‘sh bo‘lmasligi kerak: matn yozing yoki rasm qo‘shing." };
  }

  const { data, error } = await k.supabase
    .from("postlar")
    .insert({ muallif_id: k.id, matn, rasmlar })
    .select(POST_USTUNLARI)
    .single();
  if (error || !data) {
    console.error("Post yaratishda xato:", error?.message);
    return { ok: false, xato: "Postni joylab bo‘lmadi. Qayta urinib ko‘ring." };
  }

  const [post] = await postlarniTayyorla(k.supabase, [data as never], k.id);
  revalidatePath("/lenta");
  return { ok: true, malumot: post };
}

/** O‘z postini tahrirlaydi (RLS ham faqat muallifga ruxsat beradi). */
export async function postniTahrirla(
  postId: string,
  kirish: { matn: string; rasmlar: string[] },
): Promise<AmalNatijasi<Pick<LentaPost, "matn" | "rasmlar" | "yangilangan">>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };

  const matn = matnTozala(kirish?.matn, POST_MAKS_MATN);
  const rasmlar = rasmlarniTekshir(kirish?.rasmlar ?? [], k.id);
  if (!rasmlar) return { ok: false, xato: "Rasmlar noto‘g‘ri. Qayta urinib ko‘ring." };
  if (!matn && rasmlar.length === 0) {
    return { ok: false, xato: "Post bo‘sh bo‘lmasligi kerak." };
  }

  const { data: eski } = await k.supabase
    .from("postlar")
    .select("rasmlar")
    .eq("id", postId)
    .eq("muallif_id", k.id)
    .maybeSingle();
  if (!eski) return { ok: false, xato: "Post topilmadi yoki uni tahrirlash huquqingiz yo‘q." };

  const { data, error } = await k.supabase
    .from("postlar")
    .update({ matn, rasmlar })
    .eq("id", postId)
    .eq("muallif_id", k.id)
    .select("matn, rasmlar, yangilangan")
    .maybeSingle();
  if (error || !data) {
    console.error("Postni tahrirlashda xato:", error?.message);
    return { ok: false, xato: "O‘zgarishlarni saqlab bo‘lmadi." };
  }

  const olib = ((eski.rasmlar ?? []) as string[]).filter((u) => !rasmlar.includes(u));
  await rasmlarniOchir(k, olib, k.id);
  revalidatePath("/lenta");
  return { ok: true, malumot: data as Pick<LentaPost, "matn" | "rasmlar" | "yangilangan"> };
}

/** Postni o‘chiradi: muallif yoki admin. Rasmlari ham o‘chadi. */
export async function postniOchir(postId: string): Promise<AmalNatijasi> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };

  const { data: post } = await k.supabase
    .from("postlar")
    .select("muallif_id, rasmlar")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, xato: "Post topilmadi." };
  if (post.muallif_id !== k.id && !k.admin) {
    return { ok: false, xato: "Bu postni o‘chirishga huquqingiz yo‘q." };
  }

  const { data, error } = await k.supabase
    .from("postlar")
    .delete()
    .eq("id", postId)
    .select("id");
  if (error || !data || data.length === 0) {
    console.error("Postni o‘chirishda xato:", error?.message);
    return { ok: false, xato: "O‘chirib bo‘lmadi. Qayta urinib ko‘ring." };
  }

  await rasmlarniOchir(k, (post.rasmlar ?? []) as string[], post.muallif_id as string);
  revalidatePath("/lenta");
  return { ok: true, malumot: undefined };
}

/** Keyingi sahifa postlari ("Yana yuklash"). */
export async function lentaniYukla(
  keyin: string,
): Promise<AmalNatijasi<{ postlar: LentaPost[]; davomi: string | null }>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };
  const natija = await lentaPostlari(k.id, keyin);
  if (natija.xato) return { ok: false, xato: "Postlarni yuklab bo‘lmadi." };
  return { ok: true, malumot: { postlar: natija.postlar, davomi: natija.davomi } };
}

export async function izohlarniOl(postId: string): Promise<AmalNatijasi<LentaIzoh[]>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };
  const izohlar = await postIzohlari(postId);
  if (!izohlar) return { ok: false, xato: "Izohlarni yuklab bo‘lmadi." };
  return { ok: true, malumot: izohlar };
}

export async function izohYoz(postId: string, xomMatn: string): Promise<AmalNatijasi<LentaIzoh>> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };
  const matn = matnTozala(xomMatn, IZOH_MAKS_MATN);
  if (!matn) return { ok: false, xato: "Izoh bo‘sh bo‘lmasligi kerak." };

  const { data, error } = await k.supabase
    .from("post_izohlari")
    .insert({ post_id: postId, muallif_id: k.id, matn })
    .select("id, post_id, muallif_id, matn, yaratilgan")
    .single();
  if (error || !data) {
    console.error("Izoh yozishda xato:", error?.message);
    return { ok: false, xato: "Izohni yuborib bo‘lmadi." };
  }
  const mualliflar = await mualliflarXaritasi(k.supabase, [k.id]);
  return {
    ok: true,
    malumot: {
      ...(data as Omit<LentaIzoh, "muallif">),
      muallif: mualliflar.get(k.id) ?? {
        id: k.id,
        toliq_ism: "Siz",
        username: null,
        avatar_url: null,
        kasb: null,
      },
    },
  };
}

export async function izohniOchir(izohId: string): Promise<AmalNatijasi> {
  const k = await kirganFoydalanuvchi();
  if (xatoMi(k)) return { ok: false, xato: k.xato };
  const { data, error } = await k.supabase
    .from("post_izohlari")
    .delete()
    .eq("id", izohId)
    .select("id");
  if (error || !data || data.length === 0) {
    return { ok: false, xato: "Izohni o‘chirib bo‘lmadi." };
  }
  return { ok: true, malumot: undefined };
}
