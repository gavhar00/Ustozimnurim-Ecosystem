import { supabaseServer } from "@/lib/supabase/server";
import type {
  Havolalar,
  Konikma,
  Loyiha,
  ToliqProfil,
} from "@/lib/turlar";

const PROFIL_MAYDONLARI =
  "id, toliq_ism, username, bio, kasb, talim, sinf_kurs, joylashuv, maqsad, tillar, qiziqishlar, organish_yonalishlari, organmoqchi_konikmalar, mavjud_konikmalar, hamkorlikka_ochiq, avatar_url, muqova_url, havolalar, yaratilgan, tajriba_darajasi, maqsad_turi, tanlangan_yonalish";

function profilgaAylantir(qator: Record<string, unknown>): ToliqProfil {
  return {
    id: qator.id as string,
    toliq_ism: (qator.toliq_ism as string) ?? "",
    username: (qator.username as string | null) ?? null,
    bio: (qator.bio as string | null) ?? null,
    kasb: (qator.kasb as string | null) ?? null,
    talim: (qator.talim as string | null) ?? null,
    sinf_kurs: (qator.sinf_kurs as string | null) ?? null,
    joylashuv: (qator.joylashuv as string | null) ?? null,
    maqsad: (qator.maqsad as string | null) ?? null,
    tillar: (qator.tillar as string[]) ?? [],
    qiziqishlar: (qator.qiziqishlar as string[]) ?? [],
    organish_yonalishlari: (qator.organish_yonalishlari as string[]) ?? [],
    organmoqchi_konikmalar: (qator.organmoqchi_konikmalar as string[]) ?? [],
    mavjud_konikmalar: (qator.mavjud_konikmalar as string[]) ?? [],
    hamkorlikka_ochiq: Boolean(qator.hamkorlikka_ochiq),
    avatar_url: (qator.avatar_url as string | null) ?? null,
    muqova_url: (qator.muqova_url as string | null) ?? null,
    havolalar: (qator.havolalar as Havolalar) ?? {},
    yaratilgan: (qator.yaratilgan as string) ?? new Date().toISOString(),
    tajriba_darajasi: (qator.tajriba_darajasi as ToliqProfil["tajriba_darajasi"]) ?? null,
    maqsad_turi: (qator.maqsad_turi as ToliqProfil["maqsad_turi"]) ?? null,
    tanlangan_yonalish: (qator.tanlangan_yonalish as string | null) ?? null,
  };
}

/** Foydalanuvchi id bo'yicha to'liq profil. */
export async function toliqProfil(id: string): Promise<ToliqProfil | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profillar")
    .select(PROFIL_MAYDONLARI)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Profilni olishda xato:", error.message);
    return null;
  }
  return data ? profilgaAylantir(data as Record<string, unknown>) : null;
}

/** Username bo'yicha ommaviy profil. */
export async function profilUsernameBoyicha(
  username: string,
): Promise<ToliqProfil | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profillar")
    .select(PROFIL_MAYDONLARI)
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Profilni olishda xato:", error.message);
    return null;
  }
  return data ? profilgaAylantir(data as Record<string, unknown>) : null;
}

/** Profilning ko'nikmalari. */
export async function profilKonikmalari(
  profilId: string,
): Promise<Konikma[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("konikmalar")
    .select("id, profil_id, nom, turkum, daraja")
    .eq("profil_id", profilId)
    .order("yaratilgan", { ascending: true });

  if (error) {
    console.error("Ko‘nikmalarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as Konikma[];
}

/** Profilning loyihalari. */
export async function profilLoyihalari(profilId: string): Promise<Loyiha[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("loyihalar")
    .select(
      "id, muallif_id, nom, tavsif, texnologiyalar, turkum, holat, github_url, demo_url, muqova_url, logo_url, egalik_rol, yaratilgan",
    )
    .eq("muallif_id", profilId)
    .order("yaratilgan", { ascending: false });

  if (error) {
    console.error("Loyihalarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as Loyiha[];
}

export type ToldirishBandi = {
  nom: string;
  bajarilgan: boolean;
  havola: string;
};

/**
 * Profil to'ldirilganlik darajasi.
 * Hech qanday maydon majburiy emas — bu faqat ko'rsatkich.
 */
export function toldirilganlik(
  profil: ToliqProfil,
  konikmalarSoni: number,
  tugilganSana: string | null = null,
): { foiz: number; bandlar: ToldirishBandi[] } {
  const ismQismlari = profil.toliq_ism.trim().split(/\s+/).filter(Boolean);
  const umumiyHavola = "/profil/toldirish";
  const bandlar: ToldirishBandi[] = [
    { nom: "Ism", bajarilgan: Boolean(ismQismlari[0]), havola: umumiyHavola },
    { nom: "Familiya", bajarilgan: ismQismlari.length > 1, havola: umumiyHavola },
    { nom: "Avatar", bajarilgan: Boolean(profil.avatar_url), havola: umumiyHavola },
    { nom: "Tug‘ilgan sana", bajarilgan: Boolean(tugilganSana), havola: umumiyHavola },
    { nom: "Ta’lim muassasasi", bajarilgan: Boolean(profil.talim?.trim()), havola: umumiyHavola },
    { nom: "Sinf yoki kurs", bajarilgan: Boolean(profil.sinf_kurs?.trim()), havola: umumiyHavola },
    { nom: "Hudud", bajarilgan: Boolean(profil.joylashuv?.trim()), havola: umumiyHavola },
    { nom: "Qiziqishlar", bajarilgan: profil.qiziqishlar.length > 0, havola: umumiyHavola },
    { nom: "O‘rganish yo‘nalishlari", bajarilgan: profil.organish_yonalishlari.length > 0, havola: umumiyHavola },
    { nom: "O‘rganmoqchi bo‘lgan ko‘nikmalar", bajarilgan: profil.organmoqchi_konikmalar.length > 0, havola: umumiyHavola },
    { nom: "Mavjud ko‘nikmalar", bajarilgan: profil.mavjud_konikmalar.length > 0 || konikmalarSoni > 0, havola: umumiyHavola },
    { nom: "Ta’lim maqsadi", bajarilgan: Boolean(profil.maqsad?.trim()), havola: umumiyHavola },
    { nom: "Qisqacha tanishtiruv", bajarilgan: Boolean(profil.bio?.trim()), havola: umumiyHavola },
  ];

  const bajarilgan = bandlar.filter((b) => b.bajarilgan).length;
  return {
    foiz: Math.floor((bajarilgan / 13) * 100),
    bandlar,
  };
}
