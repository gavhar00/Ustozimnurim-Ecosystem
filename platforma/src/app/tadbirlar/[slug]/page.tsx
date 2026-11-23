import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Images, MapPin, Users } from "lucide-react";
import { RoyxatTugmasi } from "@/components/tadbirlar/royxat-tugmasi";
import { Container } from "@/components/ui/primitives";
import { menYozilganmi, qatnashchilarSoni, tadbirTopish } from "@/lib/data/tadbirlar";
import { otganmi, tadbirSanasi } from "@/lib/sana";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tadbir = await tadbirTopish(slug);
  if (!tadbir) return { title: "Tadbir topilmadi" };
  return { title: tadbir.nom, description: tadbir.tavsif.slice(0, 160) };
}

export default async function TadbirSahifasi({ params }: Props) {
  const { slug } = await params;
  const tadbir = await tadbirTopish(slug);
  if (!tadbir) notFound();

  const [soni, yozilgan] = await Promise.all([
    qatnashchilarSoni(tadbir.id),
    menYozilganmi(tadbir.id),
  ]);
  const otgan = otganmi(tadbir.boshlanish);
  const joyYoq = tadbir.sigim !== null && soni >= tadbir.sigim;

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <Link href="/tadbirlar" className="text-sm font-bold text-gold-300 hover:text-gold-200">
        ← Barcha tadbirlar
      </Link>
      <h1 className="mt-4 text-balance text-3xl font-black leading-tight sm:text-4xl">
        {tadbir.nom}
      </h1>
      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
        <li className="inline-flex items-center gap-2">
          <CalendarDays className="size-4 text-gold-300" aria-hidden="true" />
          {tadbirSanasi(tadbir.boshlanish)}
        </li>
        {tadbir.joy ? (
          <li className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-gold-300" aria-hidden="true" />
            {tadbir.joy}
          </li>
        ) : null}
        <li className="inline-flex items-center gap-2">
          <Users className="size-4 text-gold-300" aria-hidden="true" />
          {soni} kishi yozilgan{tadbir.sigim ? ` (${tadbir.sigim} joydan)` : ""}
        </li>
      </ul>

      <p className="mt-8 whitespace-pre-line leading-relaxed text-fg-muted">{tadbir.tavsif}</p>

      <div className="surface-card mt-10 p-6">
        {otgan ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-bold">Bu tadbir o‘tib bo‘lgan.</p>
            <Link
              href={`/lahzalar?tadbir=${tadbir.slug}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-gold-300 hover:text-gold-200"
            >
              <Images className="size-4" aria-hidden="true" />
              Lahzalarni ko‘rish
            </Link>
          </div>
        ) : (
          <RoyxatTugmasi tadbirId={tadbir.id} slug={tadbir.slug} yozilgan={yozilgan} joyYoq={joyYoq} />
        )}
      </div>
    </Container>
  );
}
