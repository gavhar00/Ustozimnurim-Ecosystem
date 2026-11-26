import type { Metadata } from "next";
import { Code2 } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { AmaliyotMuharriri } from "@/components/amaliyot/amaliyot-muharriri";
import { profilTalabQil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { SaqlanganKod } from "@/lib/amaliyot-turlari";

export const metadata: Metadata = {
  title: "Amaliyot",
  robots: { index: false, follow: false },
};

export default async function AmaliyotSahifasi() {
  const profil = await profilTalabQil("/amaliyot");
  const supabase = await supabaseServer();
  const { data } = supabase
    ? await supabase
        .from("amaliyot_kodlari")
        .select("id, nom, til, html, css, js, python, yangilangan")
        .eq("profil_id", profil.id)
        .order("yangilangan", { ascending: false })
        .limit(50)
    : { data: null };

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      <h1 className="mb-1 inline-flex items-center gap-2 text-2xl font-black sm:text-3xl">
        <Code2 className="size-7 text-gold-300" aria-hidden="true" /> Amaliyot
      </h1>
      <p className="mb-5 max-w-2xl text-sm text-fg-muted">
        Kod yozing va natijani darrov ko‘ring. Barcha kod brauzeringizda, ajratilgan oynada ishlaydi — serverda emas.
      </p>
      <AmaliyotMuharriri saqlanganlar={(data ?? []) as SaqlanganKod[]} />
    </Container>
  );
}
