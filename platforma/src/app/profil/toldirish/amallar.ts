"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { yonalishlarRoyxati } from "@/lib/data/yonalishlar";
import { MAQSAD_TURLARI, QIZIQISHLAR } from "@/lib/turlar";
import {
  USERNAME_SHAKLI,
  havolaniTozala,
  toldirishXatolari,
  type ToldirishQiymatlari,
  type ToldirishXatolari,
} from "@/lib/profil-toldirish";

export type ToldirishNatija = {
  muvaffaqiyat?: boolean;
  xato?: string;
  maydonXatolari?: ToldirishXatolari;
};

function matn(qiymat: unknown, limit: number): string {
  return typeof qiymat === "string" ? qiymat.trim().slice(0, limit) : "";
}

/** Brauzerdan kelgan qiymatlarni ishonchsiz deb hisoblab, tozalaydi. */
function tozala(xom: Partial<ToldirishQiymatlari> | null | undefined): ToldirishQiymatlari {
  const q = xom ?? {};
  return {
    ism: matn(q.ism, 60),
    familiya: matn(q.familiya, 60),
    username: matn(q.username, 20).toLowerCase(),
    bio: matn(q.bio, 500),
    kasb: matn(q.kasb, 30),
    talim: matn(q.talim, 150),
    qiziqishlar: Array.isArray(q.qiziqishlar)
      ? q.qiziqishlar
          .filter((x): x is string => typeof x === "string" && (QIZIQISHLAR as readonly string[]).includes(x))
          .filter((x, i, arr) => arr.indexOf(x) === i)
          .slice(0, 10)
      : [],
    tajriba: matn(q.tajriba, 20),
    maqsad: matn(q.maqsad, 400),
    maqsad_turi: matn(q.maqsad_turi, 20),
    tanlangan_yonalish: matn(q.tanlangan_yonalish, 60),
    konikmalar: matn(q.konikmalar, 300),
    github: matn(q.github, 200),
    portfolio: matn(q.portfolio, 200),
  };
}

function konikmalarRoyxati(qator: string): string[] {
  return qator
    .split(",")
    .map((x) => x.trim().slice(0, 40))
    .filter(Boolean)
    .filter((x, i, arr) => arr.indexOf(x) === i)
    .slice(0, 15);
}

async function foydalanuvchi() {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** Foydalanuvchi nomi bo‘shmi? (O‘zining joriy nomi ham «bo‘sh» hisoblanadi.) */
export async function usernameBoshmi(
  xom: string,
): Promise<{ bosh: boolean; xato?: string }> {
  const username = matn(xom, 20).toLowerCase();
  if (!USERNAME_SHAKLI.test(username)) {
    return { bosh: false, xato: "3–20 ta belgi: kichik lotin harflari, raqamlar, pastki chiziq." };
  }
  const kirgan = await foydalanuvchi();
  if (!kirgan) return { bosh: false, xato: "Sessiya tugagan. Qaytadan kiring." };

  const { data, error } = await kirgan.supabase
    .from("profillar")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (error) return { bosh: false, xato: "Tekshirib bo‘lmadi. Birozdan so‘ng urinib ko‘ring." };
  const bosh = !data || data.id === kirgan.user.id;
  return bosh ? { bosh } : { bosh, xato: "Bu nom band. Boshqasini tanlang." };
}

/**
 * Bazaga yozadi. `yakun=false` — qoralama: faqat to‘ldirilgan qismlar saqlanadi,
 * belgi yoqilmaydi. `yakun=true` — majburiy maydonlar to‘liq bo‘lsa belgi yoqiladi.
 */
async function saqla(xom: Partial<ToldirishQiymatlari>, yakun: boolean): Promise<ToldirishNatija> {
  const kirgan = await foydalanuvchi();
  if (!kirgan) return { xato: "Sessiya tugagan. Qaytadan kiring." };
  const { supabase, user } = kirgan;
  const q = tozala(xom);

  if (yakun) {
    const xatolar = toldirishXatolari(q);
    if (Object.keys(xatolar).length > 0) {
      return { xato: "Majburiy maydonlarni to‘ldiring.", maydonXatolari: xatolar };
    }
  }

  const yangilanish: Record<string, unknown> = {};

  if (q.ism.length >= 2 && q.familiya.length >= 2) {
    yangilanish.toliq_ism = `${q.ism} ${q.familiya}`;
  }
  if (q.bio) yangilanish.bio = q.bio;
  if ((["O‘quvchi", "Dasturchi", "Dizayner", "Ustoz", "Tadbirkor", "Boshqa"] as string[]).includes(q.kasb)) {
    yangilanish.kasb = q.kasb;
  }
  yangilanish.talim = q.talim || null;
  yangilanish.qiziqishlar = q.qiziqishlar;
  if (["boshlangich", "orta", "yuqori"].includes(q.tajriba)) yangilanish.tajriba_darajasi = q.tajriba;
  if (q.maqsad) yangilanish.maqsad = q.maqsad;
  yangilanish.maqsad_turi = q.maqsad_turi in MAQSAD_TURLARI ? q.maqsad_turi : null;
  yangilanish.mavjud_konikmalar = konikmalarRoyxati(q.konikmalar);

  if (q.tanlangan_yonalish) {
    const bor = (await yonalishlarRoyxati()).some((y) => y.slug === q.tanlangan_yonalish);
    yangilanish.tanlangan_yonalish = bor ? q.tanlangan_yonalish : null;
  } else {
    yangilanish.tanlangan_yonalish = null;
  }

  if (USERNAME_SHAKLI.test(q.username)) yangilanish.username = q.username;

  // Mavjud havolalarni (telegram, linkedin…) saqlab qolib, faqat githubni almashtiramiz.
  const github = havolaniTozala(q.github);
  const portfolio = havolaniTozala(q.portfolio);
  const { data: joriy } = await supabase
    .from("profillar")
    .select("havolalar")
    .eq("id", user.id)
    .maybeSingle();
  const havolalar: Record<string, string> = {
    ...((joriy?.havolalar as Record<string, string> | null) ?? {}),
  };
  if (github === undefined || github === null) delete havolalar.github;
  else havolalar.github = github;
  if (portfolio === undefined || portfolio === null) delete havolalar.portfolio;
  else havolalar.portfolio = portfolio;
  yangilanish.havolalar = havolalar;

  if (yakun) yangilanish.profil_toldirilgan = true;

  let { error } = await supabase.from("profillar").update(yangilanish).eq("id", user.id);

  // Qoralamada band nom qolgan hamma narsani saqlashga xalaqit bermasin.
  if (error?.code === "23505" && !yakun) {
    delete yangilanish.username;
    ({ error } = await supabase.from("profillar").update(yangilanish).eq("id", user.id));
  }

  if (error) {
    if (error.code === "23505") {
      return {
        xato: "Bu foydalanuvchi nomi band.",
        maydonXatolari: { username: "Bu nom band. Boshqasini tanlang." },
      };
    }
    console.error("Profilni saqlashda xato:", error.message);
    return { xato: "Saqlab bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring." };
  }

  revalidatePath("/panel", "layout");
  revalidatePath("/lenta");
  return { muvaffaqiyat: true };
}

/** Yozilganini qoralama sifatida saqlaydi (sahifa yangilansa ham yo‘qolmaydi). */
export async function qoralamaniSaqla(q: ToldirishQiymatlari): Promise<ToldirishNatija> {
  return saqla(q, false);
}

/** Majburiy maydonlarni tekshirib, onboardingni yakunlaydi. */
export async function profilniYakunla(q: ToldirishQiymatlari): Promise<ToldirishNatija> {
  return saqla(q, true);
}
