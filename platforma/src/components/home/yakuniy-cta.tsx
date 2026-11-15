import { ArrowRight, Rocket } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export function YakuniyCta() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-card border border-border-strong bg-linear-[100deg,var(--color-ink-800),var(--color-ink-700)_55%,var(--color-ink-850)] p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-gold-400/15 blur-[90px]"
          />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-gold-400/15 text-gold-300 sm:inline-flex">
                <Rocket className="size-7" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-balance text-2xl font-black leading-tight sm:text-3xl">
                  Kelajak kasbingizni{" "}
                  <span className="text-gold-gradient">bugundan boshlang!</span>
                </h2>
                <p className="mt-3 max-w-lg text-pretty leading-relaxed text-fg-muted">
                  Bir necha daqiqada ro‘yxatdan o‘ting va birinchi interaktiv
                  darsingizni oching.
                </p>
              </div>
            </div>

            <ButtonLink href="/royxatdan-otish" size="lg" className="shrink-0">
              Ro‘yxatdan o‘tish
              <ArrowRight className="size-4.5" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
