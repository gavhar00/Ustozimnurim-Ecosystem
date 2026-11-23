import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PaydoElement, KorinibRoyxat } from "@/components/ui/harakat";
import { Container, SectionLabel, SectionTitle } from "@/components/ui/primitives";
import { yonalishlarRoyxati } from "@/lib/data/yonalishlar";
import { YonalishIkona } from "@/lib/yonalish-ikonalari";

export async function YonalishlarBolimi() {
  const yonalishlar = await yonalishlarRoyxati();
  if (yonalishlar.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="surface-card grid gap-10 p-7 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
          <div>
            <SectionLabel icon={<Star className="size-4 fill-current" />}>
              Mashhur yo‘nalishlar
            </SectionLabel>

            <SectionTitle className="mt-5">
              O‘zingizga mos{" "}
              <span className="text-gold-gradient">yo‘nalishni</span> tanlang
            </SectionTitle>

            <p className="mt-4 max-w-sm text-pretty leading-relaxed text-fg-muted">
              Kasbingizni o‘zgartiring yoki bilimingizni yangi darajaga olib
              chiqing. Har bir yo‘nalish bosqichma-bosqich yo‘l xaritasi bilan
              keladi.
            </p>

            <ButtonLink href="/kurslar" className="mt-7">
              Barcha kurslar
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          <KorinibRoyxat as="ul" className="grid gap-4 sm:grid-cols-2">
            {yonalishlar.map(({ slug, nom, tavsif, ikona }) => (
              <PaydoElement as="li" key={slug}>
                <Link
                  href={`/yonalishlar/${slug}`}
                  className="group lift flex h-full flex-col rounded-2xl border border-border-subtle bg-ink-850/70 p-5 hover:bg-ink-800"
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gold-400/12 text-gold-300 transition-colors group-hover:bg-gold-400/20">
                    <YonalishIkona kalit={ikona} className="size-6" />
                  </span>

                  <h3 className="mt-4 text-lg font-extrabold leading-snug text-fg">
                    {nom}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
                    {tavsif}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-gold-300">
                    Boshlash
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </PaydoElement>
            ))}
          </KorinibRoyxat>
        </div>
      </Container>
    </section>
  );
}
