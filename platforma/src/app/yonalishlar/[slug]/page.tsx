import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Map } from "lucide-react";
import { KursKartasi } from "@/components/kurslar/kurs-kartasi";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/primitives";
import { kurslarRoyxati } from "@/lib/data/kurslar";
import { yonalishTopish } from "@/lib/data/yonalishlar";
import { YonalishIkona } from "@/lib/yonalish-ikonalari";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const yonalish = await yonalishTopish(slug);

  if (!yonalish) return { title: "Yo‘nalish topilmadi" };

  return { title: yonalish.nom, description: yonalish.tavsif };
}

export default async function YonalishSahifasi({ params }: Props) {
  const { slug } = await params;
  const yonalish = await yonalishTopish(slug);

  if (!yonalish) notFound();

  const barchaKurslar = await kurslarRoyxati();
  const kurslar = barchaKurslar.filter((k) => k.yonalish_slug === slug);

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Yo‘l" className="mb-6 text-sm text-fg-muted">
        <Link href="/yonalishlar" className="hover:text-gold-300">
          Yo‘nalishlar
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-fg">{yonalish.nom}</span>
      </nav>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
          <YonalishIkona kalit={yonalish.ikona} className="size-8" />
        </span>
        <div>
          <h1 className="text-balance text-3xl font-black leading-tight sm:text-4xl">
            {yonalish.nom}
          </h1>
          <p className="mt-2 max-w-xl text-pretty leading-relaxed text-fg-muted">
            {yonalish.tavsif}
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold">Yo‘l xaritasi</h2>
        <div className="mt-4">
          <EmptyState
            ikona={<Map className="size-7" aria-hidden="true" />}
            sarlavha="Yo‘l xaritasi tayyorlanmoqda"
            izoh="Bu yo‘nalishning bosqichlari va mezonlari hali belgilanmagan. Tayyor bo‘lishi bilan shu yerda chiqadi."
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold">Yo‘nalish kurslari</h2>
        {kurslar.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              sarlavha="Bu yo‘nalishda hali kurs yo‘q"
              izoh="Kurslar qo‘shilishi bilan shu yerda paydo bo‘ladi."
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kurslar.map((kurs) => (
              <KursKartasi key={kurs.id} kurs={kurs} ikona={yonalish.ikona} />
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
