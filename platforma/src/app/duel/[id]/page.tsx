import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/primitives";
import { DuelXonasi } from "@/components/duel/duel-xonasi";
import { profilTalabQil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { DuelHolati } from "@/lib/duel-turlari";

export const metadata: Metadata = { title: "Duel", robots: { index: false, follow: false } };

export default async function DuelSahifasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profil = await profilTalabQil(`/duel/${id}`);
  const supabase = await supabaseServer();
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await supabase.rpc("duel_holati", { p_duel: id });
  const holat = data as DuelHolati | null;
  if (!holat) notFound();

  const raqibId = holat.men_chaqiruvchi ? holat.raqib_id : holat.chaqiruvchi_id;
  const { data: r } = await supabase.from("profillar").select("id, toliq_ism, avatar_url").eq("id", raqibId).maybeSingle();
  const raqib = (r as { id: string; toliq_ism: string; avatar_url: string | null } | null) ?? {
    id: raqibId,
    toliq_ism: "Foydalanuvchi",
    avatar_url: null,
  };

  return (
    <Container className="max-w-2xl py-8 sm:py-10">
      <h1 className="mb-5 text-2xl font-black sm:text-3xl">Duel</h1>
      <DuelXonasi
        boshlangich={holat}
        men={{ id: profil.id, ism: profil.toliq_ism, avatar: profil.avatar_url }}
        raqib={{ id: raqib.id, ism: raqib.toliq_ism, avatar: raqib.avatar_url }}
      />
    </Container>
  );
}
