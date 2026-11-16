import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LoyihaFormasi } from "@/components/panel/loyiha-formasi";
import { Container } from "@/components/ui/primitives";
import { profilTalabQil } from "@/lib/auth";
import { profilLoyihalari } from "@/lib/data/profil";

export const metadata: Metadata = {
  title: "Loyihani tahrirlash",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function LoyihaTahrirlashSahifasi({ params }: Props) {
  const { id } = await params;
  const profil = await profilTalabQil(`/panel/loyihalarim/${id}`);
  const loyiha = (await profilLoyihalari(profil.id)).find((qator) => qator.id === id);
  if (!loyiha) notFound();

  return (
    <Container className="max-w-5xl py-8 sm:py-12">
      <Link href="/panel/loyihalarim" className="mb-5 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-gold-300">
        <ChevronLeft className="size-4" aria-hidden="true" /> Loyihalarim
      </Link>
      <LoyihaFormasi loyiha={loyiha} foydalanuvchiId={profil.id} />
    </Container>
  );
}
