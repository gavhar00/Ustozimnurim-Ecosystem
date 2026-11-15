import { supabaseServer } from "@/lib/supabase/server";
import type {
  Havolalar,
  Konikma,
  Loyiha,
  ToliqProfil,
} from "@/lib/turlar";

const PROFIL_MAYDONLARI =
  "id, toliq_ism, username, bio, kasb, talim, joylashuv, maqsad, tillar, qiziqishlar, hamkorlikka_ochiq, avatar_url, muqova_url, havolalar, yaratilgan";

function profilgaAylantir(qator: Record<string, unknown>): ToliqProfil {
  return {
    id: qator.id as string,
    toliq_ism: (qator.toliq_ism as string) ?? "",
    username: (qator.username as string | null) ?? null,
    bio: (qator.bio as string | null) ?? null,
    kasb: (qator.kasb as string | null) ?? null,
    talim: (qator.talim as string | null) ?? null,
    joylashuv: (qator.joylashuv as string | null) ?? null,
    maqsad: (qator.maqsad as string | null) ?? null,
    tillar: (qator.tillar as string[]) ?? [],
    qiziqishlar: (qator.qiziqishlar as string[]) ?? [],
    hamkorlikka_ochiq: Boolean(qator.hamkorlikka_ochiq),
    avatar_url: (qator.avatar_url as string | null) ?? null,
    muqova_url: (qator.muqova_url as string | null) ?? null,
    havolalar: (qator.havolalar as Havolalar) ?? {},
    yaratilgan: (qator.yaratilgan as string) ?? new Date().toISOString(),
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
      "id, muallif_id, nom, tavsif, texnologiyalar, turkum, holat, github_url, demo_url, muqova_url, yaratilgan",
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
): { foiz: number; bandlar: ToldirishBandi[] } {
  const havolaBor = Object.values(profil.havolalar ?? {}).some(
    (q) => typeof q === "string" && q.trim().length > 0,
  );

  const bandlar: ToldirishBandi[] = [
    { nom: "Ism va familiya", bajarilgan: profil.toliq_ism.trim().length > 1, havola: "#asosiy" },
    { nom: "Foydalanuvchi nomi", bajarilgan: Boolean(profil.username), havola: "#asosiy" },
    { nom: "Qisqa tanishtiruv", bajarilgan: Boolean(profil.bio?.trim()), havola: "#asosiy" },
    { nom: "Ta’lim", bajarilgan: Boolean(profil.talim?.trim()), havola: "#asosiy" },
    { nom: "Joylashuv", bajarilgan: Boolean(profil.joylashuv?.trim()), havola: "#asosiy" },
    { nom: "Maqsad", bajarilgan: Boolean(profil.maqsad?.trim()), havola: "#asosiy" },
    { nom: "Kamida bitta ko‘nikma", bajarilgan: konikmalarSoni > 0, havola: "#konikmalar" },
    { nom: "Kamida bitta qiziqish", bajarilgan: profil.qiziqishlar.length > 0, havola: "#asosiy" },
    { nom: "Kamida bitta havola", bajarilgan: havolaBor, havola: "#havolalar" },
  ];

  const bajarilgan = bandlar.filter((b) => b.bajarilgan).length;
  return {
    foiz: Math.round((bajarilgan / bandlar.length) * 100),
    bandlar,
  };
}
