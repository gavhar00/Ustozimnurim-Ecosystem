import { supabaseServer } from "@/lib/supabase/server";

export type Post = {
  id: string;
  muallif_id: string;
  matn: string;
  yoqtirishlar_soni: number;
  yaratilgan: string;
  ozim_yoqtirdim: boolean;
};

export type QisqaProfil = {
  id: string;
  toliq_ism: string;
  username: string | null;
  kasb: string | null;
  avatar_url: string | null;
  hamkorlikka_ochiq: boolean;
};

const QISQA_MAYDONLAR =
  "id, toliq_ism, username, kasb, avatar_url, hamkorlikka_ochiq";

/** Profilning postlari. */
export async function profilPostlari(
  profilId: string,
  koruvchiId: string | null,
): Promise<Post[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("postlar")
    .select("id, muallif_id, matn, yoqtirishlar_soni, yaratilgan")
    .eq("muallif_id", profilId)
    .order("yaratilgan", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Postlarni olishda xato:", error.message);
    return [];
  }

  const postlar = (data ?? []) as Omit<Post, "ozim_yoqtirdim">[];
  if (postlar.length === 0 || !koruvchiId) {
    return postlar.map((p) => ({ ...p, ozim_yoqtirdim: false }));
  }

  const { data: yoqtirishlar } = await supabase
    .from("post_yoqtirishlari")
    .select("post_id")
    .eq("foydalanuvchi_id", koruvchiId)
    .in(
      "post_id",
      postlar.map((p) => p.id),
    );

  const toplam = new Set(
    ((yoqtirishlar ?? []) as { post_id: string }[]).map((y) => y.post_id),
  );

  return postlar.map((p) => ({ ...p, ozim_yoqtirdim: toplam.has(p.id) }));
}

export type BoglanishHolati =
  | "ozim"
  | "yoq"
  | "men_yubordim"
  | "menga_yuborildi"
  | "boglangan";

export type AloqaHolati = {
  boglanish: BoglanishHolati;
  kuzatyapman: boolean;
  kuzatuvchilar: number;
  kuzatilganlar: number;
  boglanishlar: number;
};

/** Ikki foydalanuvchi o'rtasidagi aloqa holati va sonlar. */
export async function aloqaHolati(
  profilId: string,
  koruvchiId: string | null,
): Promise<AloqaHolati> {
  const supabase = await supabaseServer();
  const bosh: AloqaHolati = {
    boglanish: "yoq",
    kuzatyapman: false,
    kuzatuvchilar: 0,
    kuzatilganlar: 0,
    boglanishlar: 0,
  };
  if (!supabase) return bosh;

  const sanoq = { count: "exact" as const, head: true };

  const [kuzatuvchilar, kuzatilganlar, boglanishlar] = await Promise.all([
    supabase.from("obunalar").select("*", sanoq).eq("kuzatilgan_id", profilId),
    supabase.from("obunalar").select("*", sanoq).eq("kuzatuvchi_id", profilId),
    supabase
      .from("boglanishlar")
      .select("*", sanoq)
      .eq("holat", "qabul")
      .or(`yuboruvchi_id.eq.${profilId},qabul_qiluvchi_id.eq.${profilId}`),
  ]);

  const natija: AloqaHolati = {
    ...bosh,
    kuzatuvchilar: kuzatuvchilar.count ?? 0,
    kuzatilganlar: kuzatilganlar.count ?? 0,
    boglanishlar: boglanishlar.count ?? 0,
  };

  if (!koruvchiId) return natija;
  if (koruvchiId === profilId) return { ...natija, boglanish: "ozim" };

  const [obuna, sorov] = await Promise.all([
    supabase
      .from("obunalar")
      .select("kuzatuvchi_id")
      .eq("kuzatuvchi_id", koruvchiId)
      .eq("kuzatilgan_id", profilId)
      .maybeSingle(),
    supabase
      .from("boglanishlar")
      .select("yuboruvchi_id, holat")
      .or(
        `and(yuboruvchi_id.eq.${koruvchiId},qabul_qiluvchi_id.eq.${profilId}),and(yuboruvchi_id.eq.${profilId},qabul_qiluvchi_id.eq.${koruvchiId})`,
      )
      .maybeSingle(),
  ]);

  natija.kuzatyapman = Boolean(obuna.data);

  const qator = sorov.data as
    | { yuboruvchi_id: string; holat: string }
    | null;

  if (qator) {
    if (qator.holat === "qabul") natija.boglanish = "boglangan";
    else if (qator.holat === "kutilmoqda") {
      natija.boglanish =
        qator.yuboruvchi_id === koruvchiId ? "men_yubordim" : "menga_yuborildi";
    }
  }

  return natija;
}

export type SorovQatori = {
  id: string;
  profil: QisqaProfil;
};

/** Menga kelgan, men yuborgan so'rovlar va qabul qilingan bog'lanishlar. */
export async function boglanishRoyxatlari(foydalanuvchiId: string): Promise<{
  kelgan: SorovQatori[];
  yuborilgan: SorovQatori[];
  boglangan: QisqaProfil[];
}> {
  const supabase = await supabaseServer();
  const bosh = { kelgan: [], yuborilgan: [], boglangan: [] };
  if (!supabase) return bosh;

  const { data, error } = await supabase
    .from("boglanishlar")
    .select(
      `id, holat, yuboruvchi_id, qabul_qiluvchi_id,
       yuboruvchi:profillar!boglanishlar_yuboruvchi_id_fkey(${QISQA_MAYDONLAR}),
       qabul:profillar!boglanishlar_qabul_qiluvchi_id_fkey(${QISQA_MAYDONLAR})`,
    )
    .order("yaratilgan", { ascending: false });

  if (error) {
    console.error("Bog‘lanishlarni olishda xato:", error.message);
    return bosh;
  }

  type Qator = {
    id: string;
    holat: string;
    yuboruvchi_id: string;
    qabul_qiluvchi_id: string;
    yuboruvchi: QisqaProfil | null;
    qabul: QisqaProfil | null;
  };

  const qatorlar = (data ?? []) as unknown as Qator[];

  return {
    kelgan: qatorlar
      .filter(
        (q) =>
          q.holat === "kutilmoqda" &&
          q.qabul_qiluvchi_id === foydalanuvchiId &&
          q.yuboruvchi,
      )
      .map((q) => ({ id: q.id, profil: q.yuboruvchi! })),
    yuborilgan: qatorlar
      .filter(
        (q) =>
          q.holat === "kutilmoqda" &&
          q.yuboruvchi_id === foydalanuvchiId &&
          q.qabul,
      )
      .map((q) => ({ id: q.id, profil: q.qabul! })),
    boglangan: qatorlar
      .filter((q) => q.holat === "qabul")
      .map((q) =>
        q.yuboruvchi_id === foydalanuvchiId ? q.qabul : q.yuboruvchi,
      )
      .filter((p): p is QisqaProfil => p !== null),
  };
}

/** Tavsiya etiladigan odamlar — hamkorlikka ochiq va hali bog'lanmaganlar. */
export async function tavsiyaEtilganlar(
  foydalanuvchiId: string,
): Promise<QisqaProfil[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profillar")
    .select(QISQA_MAYDONLAR)
    .neq("id", foydalanuvchiId)
    .not("username", "is", null)
    .order("yaratilgan", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Tavsiyalarni olishda xato:", error.message);
    return [];
  }
  return (data ?? []) as QisqaProfil[];
}

export type OdamKartasi = QisqaProfil & {
  bio: string | null;
  joylashuv: string | null;
  maqsad: string | null;
  qiziqishlar: string[];
  konikmalar: string[];
};

/** Hamjamiyatdagi odamlar — faqat foydalanuvchi nomi bor profillar. */
export async function hamjamiyatOdamlari(): Promise<OdamKartasi[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profillar")
    .select(
      "id, toliq_ism, username, kasb, avatar_url, hamkorlikka_ochiq, bio, joylashuv, maqsad, qiziqishlar, konikmalar(nom)",
    )
    .not("username", "is", null)
    .order("yaratilgan", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Odamlarni olishda xato:", error.message);
    return [];
  }

  type Qator = Omit<OdamKartasi, "konikmalar"> & {
    konikmalar: { nom: string }[] | null;
  };

  return ((data ?? []) as unknown as Qator[]).map((q) => ({
    ...q,
    qiziqishlar: q.qiziqishlar ?? [],
    konikmalar: (q.konikmalar ?? []).map((k) => k.nom),
  }));
}

export type OmmaviyLoyiha = {
  id: string;
  nom: string;
  tavsif: string;
  texnologiyalar: string[];
  turkum: string;
  holat: string;
  github_url: string | null;
  demo_url: string | null;
  yaratilgan: string;
  muallif: QisqaProfil | null;
};

/** Barcha loyihalar — muallif profili bilan. */
export async function ommaviyLoyihalar(): Promise<OmmaviyLoyiha[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("loyihalar")
    .select(
      `id, nom, tavsif, texnologiyalar, turkum, holat, github_url, demo_url, yaratilgan,
       muallif:profillar!loyihalar_muallif_id_fkey(${QISQA_MAYDONLAR})`,
    )
    .order("yaratilgan", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Loyihalarni olishda xato:", error.message);
    return [];
  }

  return (data ?? []) as unknown as OmmaviyLoyiha[];
}

/** Bitta loyiha — muallif bilan. */
export async function ommaviyLoyiha(
  id: string,
): Promise<OmmaviyLoyiha | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("loyihalar")
    .select(
      `id, nom, tavsif, texnologiyalar, turkum, holat, github_url, demo_url, yaratilgan,
       muallif:profillar!loyihalar_muallif_id_fkey(${QISQA_MAYDONLAR})`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Loyihani olishda xato:", error.message);
    return null;
  }
  return (data as unknown as OmmaviyLoyiha | null) ?? null;
}

export type LoyihaAzosi = QisqaProfil & { rol: string };

/** Loyiha jamoasi — muallif va qabul qilingan a'zolar. */
export async function loyihaAzolari(
  loyihaId: string,
): Promise<LoyihaAzosi[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("loyiha_azolari")
    .select(`rol, profillar(${QISQA_MAYDONLAR})`)
    .eq("loyiha_id", loyihaId)
    .order("yaratilgan", { ascending: true });

  if (error) {
    console.error("Jamoani olishda xato:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Array<{
    rol: string;
    profillar: QisqaProfil | null;
  }>)
    .filter((q) => q.profillar !== null)
    .map((q) => ({ ...q.profillar!, rol: q.rol }));
}

export type LoyihaSorovi = {
  id: string;
  xabar: string;
  holat: string;
  yaratilgan: string;
  loyiha_id: string;
  profil: QisqaProfil;
};

/** Loyiha egasiga kelgan qo'shilish so'rovlari (kutilayotganlari). */
export async function loyihaSorovlari(
  loyihaIdlar: string[],
): Promise<LoyihaSorovi[]> {
  const supabase = await supabaseServer();
  if (!supabase || loyihaIdlar.length === 0) return [];

  const { data, error } = await supabase
    .from("loyiha_sorovlari")
    .select(`id, xabar, holat, yaratilgan, loyiha_id, profillar(${QISQA_MAYDONLAR})`)
    .in("loyiha_id", loyihaIdlar)
    .eq("holat", "kutilmoqda")
    .order("yaratilgan", { ascending: true });

  if (error) {
    console.error("So‘rovlarni olishda xato:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Array<
    Omit<LoyihaSorovi, "profil"> & { profillar: QisqaProfil | null }
  >)
    .filter((q) => q.profillar !== null)
    .map((q) => ({
      id: q.id,
      xabar: q.xabar,
      holat: q.holat,
      yaratilgan: q.yaratilgan,
      loyiha_id: q.loyiha_id,
      profil: q.profillar!,
    }));
}

export type AzolikHolati = "ega" | "azo" | "sorov_yuborilgan" | "yoq";

/** Ko'ruvchining shu loyihadagi holati. */
export async function azolikHolati(
  loyihaId: string,
  muallifId: string,
  koruvchiId: string | null,
): Promise<AzolikHolati> {
  if (!koruvchiId) return "yoq";
  if (koruvchiId === muallifId) return "ega";

  const supabase = await supabaseServer();
  if (!supabase) return "yoq";

  const [azo, sorov] = await Promise.all([
    supabase
      .from("loyiha_azolari")
      .select("foydalanuvchi_id")
      .eq("loyiha_id", loyihaId)
      .eq("foydalanuvchi_id", koruvchiId)
      .maybeSingle(),
    supabase
      .from("loyiha_sorovlari")
      .select("holat")
      .eq("loyiha_id", loyihaId)
      .eq("foydalanuvchi_id", koruvchiId)
      .maybeSingle(),
  ]);

  if (azo.data) return "azo";
  if ((sorov.data as { holat: string } | null)?.holat === "kutilmoqda") {
    return "sorov_yuborilgan";
  }
  return "yoq";
}
