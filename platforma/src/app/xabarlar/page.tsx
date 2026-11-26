import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { XabarlarOynasi } from "@/components/xabarlar/xabarlar-oynasi";
import { profilTalabQil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { Suhbat } from "@/lib/xabar-turlari";

export const metadata: Metadata = {
  title: "Xabarlar",
  robots: { index: false, follow: false },
};

export default async function XabarlarSahifasi({
  searchParams,
}: {
  searchParams: Promise<{ kim?: string }>;
}) {
  const profil = await profilTalabQil("/xabarlar");
  const { kim } = await searchParams;
  const supabase = await supabaseServer();
  const { data } = supabase ? await supabase.rpc("xabar_suhbatlar") : { data: null };
  const suhbatlar = Array.isArray(data) ? (data as Suhbat[]) : [];
  const tanlangan = kim && suhbatlar.some((s) => s.id === kim) ? kim : null;

  return (
    <Container className="max-w-5xl py-4 sm:py-6">
      <h1 className="mb-3 inline-flex items-center gap-2 text-2xl font-black">
        <MessagesSquare className="size-6 text-gold-300" aria-hidden="true" /> Xabarlar
      </h1>
      <XabarlarOynasi menId={profil.id} boshlangichSuhbatlar={suhbatlar} boshlangichTanlangan={tanlangan} />
    </Container>
  );
}
