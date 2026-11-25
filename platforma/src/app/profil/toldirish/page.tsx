import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfilToldirishFormasi } from "@/components/profil/profil-toldirish-formasi";
import { supabaseServer } from "@/lib/supabase/server";
import { yonalishlarRoyxati } from "@/lib/data/yonalishlar";
import { xavfsizIchkiManzil, type ToldirishQiymatlari } from "@/lib/profil-toldirish";

export const metadata: Metadata = {
  title: "Profilni to‘ldirish",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ keyin?: string }> };

export default async function ProfilToldirishSahifasi({ searchParams }: Props) {
  const supabase = await supabaseServer();
  if (!supabase) {
    return (
      <Container className="py-12">
        <EmptyState sarlavha="Hisob tizimi ulanmagan" izoh="Profilni saqlash uchun Supabase sozlamalarini tekshiring." />
      </Container>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/kirish?keyin=%2Fprofil%2Ftoldirish");

  const { data: row } = await supabase
    .from("profillar")
    .select("toliq_ism, username, bio, kasb, talim, qiziqishlar, tajriba_darajasi, maqsad, maqsad_turi, tanlangan_yonalish, mavjud_konikmalar, havolalar, avatar_url, profil_toldirilgan")
    .eq("id", user.id)
    .maybeSingle();

  if (!row) {
    return (
      <Container className="py-12">
        <EmptyState sarlavha="Profil hali yaratilmagan" izoh="Hisobingizni qayta oching yoki yordamga murojaat qiling." />
      </Container>
    );
  }

  // Profil bir marta to‘ldiriladi — tugallangan bo‘lsa, qaytib so‘ralmaydi.
  const { keyin } = await searchParams;
  const nextManzil = xavfsizIchkiManzil(keyin);
  if (row.profil_toldirilgan) redirect(nextManzil);

  const yonalishlar = await yonalishlarRoyxati();
  const ism = (row.toliq_ism ?? "").trim().split(/\s+/).filter(Boolean);
  const havolalar = (row.havolalar ?? {}) as { github?: string; portfolio?: string };

  const boshlangich: ToldirishQiymatlari = {
    ism: ism[0] ?? "",
    familiya: ism.slice(1).join(" "),
    username: row.username ?? "",
    bio: row.bio ?? "",
    kasb: row.kasb ?? "",
    talim: row.talim ?? "",
    qiziqishlar: row.qiziqishlar ?? [],
    tajriba: row.tajriba_darajasi ?? "",
    maqsad: row.maqsad ?? "",
    maqsad_turi: row.maqsad_turi ?? "",
    tanlangan_yonalish: row.tanlangan_yonalish ?? "",
    konikmalar: (row.mavjud_konikmalar ?? []).join(", "),
    github: havolalar.github ?? "",
    portfolio: havolalar.portfolio ?? "",
  };

  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <ProfilToldirishFormasi
        boshlangich={boshlangich}
        yonalishlar={yonalishlar.map((y) => ({ slug: y.slug, nom: y.nom }))}
        profilId={user.id}
        avatarUrl={row.avatar_url}
        nextManzil={nextManzil}
      />
    </Container>
  );
}
