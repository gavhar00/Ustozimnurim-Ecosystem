import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PaydoElement, PaydoRoyxat } from "@/components/ui/harakat";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { tadbirlarRoyxati, type Tadbir } from "@/lib/data/tadbirlar";
import { otganmi, tadbirSanasi } from "@/lib/sana";

export const metadata: Metadata = {
  title: "Tadbirlar",
  description: "UstozimNurim tadbirlari: uchrashuvlar, master-klasslar va hamjamiyat yig‘inlari.",
};

function Royxat({ tadbirlar }: { tadbirlar: Tadbir[] }) {
  return (
    <PaydoRoyxat as="ul" className="grid gap-5 sm:grid-cols-2">
      {tadbirlar.map((t) => (
        <PaydoElement as="li" key={t.id} className="h-full">
          <Link
            href={`/tadbirlar/${t.slug}`}
            className="surface-card group flex h-full flex-col p-6 transition-all hover:-translate-y-1 hover:border-border-strong"
          >
            <p className="inline-flex items-center gap-2 text-sm font-bold text-gold-300">
              <CalendarDays className="size-4" aria-hidden="true" />
              {tadbirSanasi(t.boshlanish)}
            </p>
            <h3 className="mt-3 text-xl font-extrabold">{t.nom}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">{t.tavsif}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm">
              <span className="inline-flex items-center gap-1.5 text-fg-muted">
                {t.joy ? (
                  <>
                    <MapPin className="size-4" aria-hidden="true" />
                    {t.joy}
                  </>
                ) : null}
              </span>
              <ArrowRight
                className="size-4 text-gold-300 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>
        </PaydoElement>
      ))}
    </PaydoRoyxat>
  );
}

export default async function TadbirlarSahifasi() {
  const hammasi = await tadbirlarRoyxati();
  const kelayotgan = hammasi.filter((t) => !otganmi(t.boshlanish));
  const otgan = hammasi.filter((t) => otganmi(t.boshlanish)).reverse();

  return (
    <>
      <PageHeader
        yorliq="Tadbirlar"
        yorliqIkona={<CalendarDays className="size-4" />}
        sarlavha="Jonli uchrashuvlar va"
        oltinQism="hamjamiyat yig‘inlari"
        tavsif="Kelayotgan tadbirlarga yoziling, o‘tganlarining lahzalarini galereyada ko‘ring."
      />
      <Container className="space-y-12 pb-16">
        <section aria-labelledby="kelayotgan">
          <h2 id="kelayotgan" className="mb-5 text-2xl font-extrabold">Kelayotgan tadbirlar</h2>
          {kelayotgan.length === 0 ? (
            <EmptyState
              ikona={<CalendarDays className="size-7" aria-hidden="true" />}
              sarlavha="Hozircha rejalashtirilgan tadbir yo‘q"
              izoh="Yangi tadbir e’lon qilinganda shu yerda ko‘rinadi."
            />
          ) : (
            <Royxat tadbirlar={kelayotgan} />
          )}
        </section>
        {otgan.length > 0 ? (
          <section aria-labelledby="otgan">
            <h2 id="otgan" className="mb-5 text-2xl font-extrabold">O‘tgan tadbirlar</h2>
            <Royxat tadbirlar={otgan} />
          </section>
        ) : null}
      </Container>
    </>
  );
}
