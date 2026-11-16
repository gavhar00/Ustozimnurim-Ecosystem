import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfilToldirishFormasi } from "@/components/profil/profil-toldirish-formasi";
import { supabaseServer } from "@/lib/supabase/server";
import { toliqProfil } from "@/lib/data/profil";
import { xavfsizIchkiManzil } from "@/lib/profil-toldirish";

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
    .select("id, toliq_ism, username, bio, kasb, talim, sinf_kurs, joylashuv, maqsad, tillar, qiziqishlar, organish_yonalishlari, organmoqchi_konikmalar, mavjud_konikmalar, hamkorlikka_ochiq, avatar_url, muqova_url, havolalar, yaratilgan")
    .eq("id", user.id)
    .maybeSingle();
  if (!row) {
    return (
      <Container className="py-12">
        <EmptyState sarlavha="Profil hali yaratilmagan" izoh="Hisobingizni qayta oching yoki yordamga murojaat qiling." />
      </Container>
    );
  }

  const { data: privateRow } = await supabase
    .from("profil_shaxsiy")
    .select("tugilgan_sana")
    .eq("profil_id", user.id)
    .maybeSingle();
  const profile = await toliqProfil(user.id);
  if (!profile) {
    return (
      <Container className="py-12">
        <EmptyState sarlavha="Profilni yuklab bo‘lmadi" izoh="Birozdan so‘ng qayta urinib ko‘ring." />
      </Container>
    );
  }

  const { keyin } = await searchParams;
  return (
    <Container className="max-w-5xl py-8 sm:py-12">
      <ProfilToldirishFormasi
        profil={profile}
        tugilganSana={privateRow?.tugilgan_sana ?? ""}
        nextManzil={xavfsizIchkiManzil(keyin)}
      />
    </Container>
  );
}
