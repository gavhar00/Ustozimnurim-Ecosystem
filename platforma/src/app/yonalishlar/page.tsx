import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { PaydoElement, PaydoRoyxat } from "@/components/ui/harakat";
import { Container } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { yonalishlarRoyxati } from "@/lib/data/yonalishlar";
import { YonalishIkona } from "@/lib/yonalish-ikonalari";

export const metadata: Metadata = {
  title: "Yo‘nalishlar",
  description:
    "Frontend, backend, data science va UI/UX dizayn — o‘zingizga mos kasbiy yo‘nalishni tanlang.",
};

export default async function YonalishlarSahifasi() {
  const yonalishlar = await yonalishlarRoyxati();

  return (
    <>
      <PageHeader
        yorliq="Yo‘nalishlar"
        yorliqIkona={<Compass className="size-4" />}
        sarlavha="O‘zingizga mos yo‘nalishni tanlang va"
        oltinQism="rivojlaning"
        tavsif="Har bir yo‘nalish — bir nechta kursdan iborat yo‘l. Noldan boshlab, bosqichma-bosqich kasb darajasiga chiqasiz."
      />

      <Container className="pb-16">
        <PaydoRoyxat as="ul" className="grid gap-5 sm:grid-cols-2">
          {yonalishlar.map(({ slug, nom, tavsif, ikona }) => (
            <PaydoElement as="li" key={slug}>
              <Link
                href={`/yonalishlar/${slug}`}
                className="group flex h-full flex-col rounded-card border border-border-subtle bg-bg-card p-7 transition-all duration-250 hover:-translate-y-1 hover:border-border-strong"
              >
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300 transition-colors group-hover:bg-gold-400/20">
                  <YonalishIkona kalit={ikona} className="size-7" />
                </span>

                <h2 className="mt-5 text-xl font-extrabold text-fg">{nom}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-fg-muted">
                  {tavsif}
                </p>

                <span className="mt-5 inline-flex items-center gap-1.5 font-bold text-gold-300">
                  Batafsil
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </PaydoElement>
          ))}
        </PaydoRoyxat>
      </Container>
    </>
  );
}
