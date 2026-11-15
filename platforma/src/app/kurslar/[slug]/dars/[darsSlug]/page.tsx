import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { InteraktivDars } from "@/components/dars/interaktiv-dars";
import { Container } from "@/components/ui/primitives";
import { joriyProfil } from "@/lib/auth";
import { darsHolati, darsTopish, kursDarslari } from "@/lib/data/darslar";

type Props = { params: Promise<{ slug: string; darsSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, darsSlug } = await params;
  const dars = await darsTopish(slug, darsSlug);
  return {
    title: dars ? dars.nom : "Dars topilmadi",
    robots: { index: false, follow: false },
  };
}

export default async function DarsSahifasi({ params }: Props) {
  const { slug, darsSlug } = await params;

  const profil = await joriyProfil();
  if (!profil) {
    redirect(`/kirish?keyin=${encodeURIComponent(`/kurslar/${slug}/dars/${darsSlug}`)}`);
  }

  const dars = await darsTopish(slug, darsSlug);
  if (!dars) notFound();

  const [holat, barchaDarslar] = await Promise.all([
    darsHolati(profil.id, dars.id),
    kursDarslari(dars.kurs_id),
  ]);

  const joriyIndeks = barchaDarslar.findIndex((d) => d.id === dars.id);
  const keyingi =
    joriyIndeks >= 0 && joriyIndeks < barchaDarslar.length - 1
      ? barchaDarslar[joriyIndeks + 1]
      : null;

  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Yo&#8216;l" className="mb-5 flex items-center gap-2 text-sm">
        <Link
          href={`/kurslar/${dars.kurs_slug}`}
          className="inline-flex items-center gap-1 text-fg-muted hover:text-gold-300"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {dars.kurs_nomi}
        </Link>
      </nav>

      <header className="mb-7">
        <p className="text-sm font-bold text-gold-300">
          {joriyIndeks >= 0 ? `${joriyIndeks + 1}-dars` : "Dars"} &middot;{" "}
          {barchaDarslar.length} tadan
        </p>
        <h1 className="mt-2 text-balance text-2xl font-black leading-tight sm:text-3xl">
          {dars.nom}
        </h1>
      </header>

      <InteraktivDars
        darsId={dars.id}
        yoriqnoma={dars.yoriqnoma}
        videoUrl={dars.video_url}
        boshlangichKod={dars.boshlangich_kod}
        saqlanganKod={holat?.saqlangan_kod ?? null}
        tugatilgan={holat?.tugatilgan ?? false}
        keyingiHref={
          keyingi ? `/kurslar/${dars.kurs_slug}/dars/${keyingi.slug}` : null
        }
      />
    </Container>
  );
}
