export const PROFIL_TOLDIRISH_CHEGARASI = 60;

export type ProfilToldirishMaydonlari = {
  toliq_ism?: string | null;
  avatar_url?: string | null;
  tugilgan_sana?: string | null;
  talim?: string | null;
  sinf_kurs?: string | null;
  joylashuv?: string | null;
  qiziqishlar?: string[] | null;
  organish_yonalishlari?: string[] | null;
  organmoqchi_konikmalar?: string[] | null;
  mavjud_konikmalar?: string[] | null;
  maqsad?: string | null;
  bio?: string | null;
};

export function profilToldirishFoizi(
  profil: ProfilToldirishMaydonlari | null | undefined,
): number {
  if (!profil) return 0;
  const ismQismlari = (profil.toliq_ism ?? "").trim().split(/\s+/).filter(Boolean);
  const bajarilgan = [
    Boolean(ismQismlari[0]),
    Boolean(ismQismlari.length > 1),
    Boolean(profil.avatar_url?.trim()),
    Boolean(profil.tugilgan_sana),
    Boolean(profil.talim?.trim()),
    Boolean(profil.sinf_kurs?.trim()),
    Boolean(profil.joylashuv?.trim()),
    Boolean(profil.qiziqishlar?.length),
    Boolean(profil.organish_yonalishlari?.length),
    Boolean(profil.organmoqchi_konikmalar?.length),
    Boolean(profil.mavjud_konikmalar?.length),
    Boolean(profil.maqsad?.trim()),
    Boolean(profil.bio?.trim()),
  ].filter(Boolean).length;

  return Math.floor((bajarilgan / 13) * 100);
}

export function xavfsizIchkiManzil(manzil: string | null | undefined): string {
  if (
    !manzil ||
    !manzil.startsWith("/") ||
    manzil.startsWith("//") ||
    manzil.includes("\\") ||
    /[\u0000-\u001f]/.test(manzil)
  ) return "/lenta";
  if (manzil.startsWith("/profil/toldirish")) return "/lenta";
  const parsed = new URL(manzil, "https://internal.invalid");
  return parsed.origin === "https://internal.invalid"
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : "/lenta";
}

/* ------------------------------------------------------------------ */
/* Onboarding (bir martalik profil to‘ldirish)                        */
/* ------------------------------------------------------------------ */

export const USERNAME_SHAKLI = /^[a-z0-9_]{3,20}$/;
export const ONBOARDING_KASBLAR = [
  "O‘quvchi",
  "Dasturchi",
  "Dizayner",
  "Ustoz",
  "Tadbirkor",
  "Boshqa",
] as const;
export const TAJRIBA_DARAJALARI = ["boshlangich", "orta", "yuqori"] as const;

/** Forma qiymatlari — brauzer ham, server ham shu shaklda ishlaydi. */
export type ToldirishQiymatlari = {
  ism: string;
  familiya: string;
  username: string;
  bio: string;
  kasb: string;
  talim: string;
  qiziqishlar: string[];
  tajriba: string;
  maqsad: string;
  maqsad_turi: string;
  tanlangan_yonalish: string;
  konikmalar: string;
  github: string;
  portfolio: string;
};

export type ToldirishXatolari = Partial<Record<keyof ToldirishQiymatlari, string>>;

/** Havolani tekshiradi: bo‘sh (ixtiyoriy) yoki to‘g‘ri http(s) manzil. */
export function havolaniTozala(xom: string): string | null | undefined {
  const qiymat = xom.trim();
  if (!qiymat) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(qiymat) ? qiymat : `https://${qiymat}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return undefined;
    return url.toString().slice(0, 200);
  } catch {
    return undefined;
  }
}

/** Majburiy maydonlarning xatolari. Bo‘sh obyekt — hammasi joyida. */
export function toldirishXatolari(q: ToldirishQiymatlari): ToldirishXatolari {
  const x: ToldirishXatolari = {};
  if (q.ism.trim().length < 2) x.ism = "Ismingizni kiriting (kamida 2 ta belgi).";
  if (q.familiya.trim().length < 2) x.familiya = "Familiyangizni kiriting (kamida 2 ta belgi).";
  if (!q.username) x.username = "Foydalanuvchi nomini tanlang.";
  else if (!USERNAME_SHAKLI.test(q.username))
    x.username = "3–20 ta belgi: faqat kichik lotin harflari, raqamlar va pastki chiziq.";
  if (q.bio.trim().length < 10) x.bio = "O‘zingiz haqingizda kamida 10 ta belgi yozing.";
  if (!(ONBOARDING_KASBLAR as readonly string[]).includes(q.kasb))
    x.kasb = "Hozirgi kasb yoki mashg‘ulotingizni tanlang.";
  if (q.qiziqishlar.length === 0) x.qiziqishlar = "Kamida bitta IT qiziqishini belgilang.";
  if (!(TAJRIBA_DARAJALARI as readonly string[]).includes(q.tajriba))
    x.tajriba = "Tajriba darajangizni tanlang.";
  if (q.maqsad.trim().length < 5) x.maqsad = "O‘qish maqsadingizni qisqacha yozing.";
  if (havolaniTozala(q.github) === undefined) x.github = "To‘g‘ri havola kiriting.";
  if (havolaniTozala(q.portfolio) === undefined) x.portfolio = "To‘g‘ri havola kiriting.";
  return x;
}

/** Majburiy bosqichlar bo‘yicha progress (0–100) va ro‘yxat. */
export function toldirishProgressi(q: ToldirishQiymatlari) {
  const x = toldirishXatolari(q);
  const bosqichlar = [
    { kalit: "ism", nom: "Ism va familiya", bajarilgan: !x.ism && !x.familiya },
    { kalit: "username", nom: "Foydalanuvchi nomi", bajarilgan: !x.username },
    { kalit: "bio", nom: "Qisqacha bio", bajarilgan: !x.bio },
    { kalit: "kasb", nom: "Kasb yoki ta’lim", bajarilgan: !x.kasb },
    { kalit: "qiziqishlar", nom: "IT qiziqishlari", bajarilgan: !x.qiziqishlar },
    { kalit: "tajriba", nom: "Tajriba darajasi", bajarilgan: !x.tajriba },
    { kalit: "maqsad", nom: "O‘qish maqsadi", bajarilgan: !x.maqsad },
  ];
  const bajarilgan = bosqichlar.filter((b) => b.bajarilgan).length;
  return { bosqichlar, foiz: Math.round((bajarilgan / bosqichlar.length) * 100) };
}
