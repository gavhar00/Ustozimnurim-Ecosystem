import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, SectionLabel, SectionTitle } from "@/components/ui/primitives";
import { YONALISHLAR } from "@/lib/data/yonalishlar";

export function YonalishlarBolimi() {
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

          <ul className="grid gap-4 sm:grid-cols-2">
            {YONALISHLAR.map(({ slug, nom, tavsif, ikona: Ikona }) => (
              <li key={slug}>
                <Link
                  href={`/yonalishlar/${slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border-subtle bg-ink-850/70 p-5 transition-all duration-250 hover:-translate-y-1 hover:border-border-strong hover:bg-ink-800"
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gold-400/12 text-gold-300 transition-colors group-hover:bg-gold-400/20">
                    <Ikona className="size-6" aria-hidden="true" />
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
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
