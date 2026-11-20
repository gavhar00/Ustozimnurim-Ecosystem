import { Award, GraduationCap, PlayCircle, Users } from "lucide-react";
import { KorinibRoyxat, PaydoElement } from "@/components/ui/harakat";
import { Container } from "@/components/ui/primitives";
import { platformaStatistikasi } from "@/lib/data/statistika";
import { formatSon } from "@/lib/utils";

/**
 * Statistika bloki — raqamlar faqat bazadan keladi.
 * Baza ulanmagan bo‘lsa yoki hali ma’lumot bo‘lmasa, blok umuman chizilmaydi.
 */
export async function StatistikaBolimi() {
  const statistika = await platformaStatistikasi();
  if (!statistika) return null;

  const kartalar = [
    { Ikona: Users, son: statistika.oquvchilar, izoh: "O‘quvchilar" },
    { Ikona: PlayCircle, son: statistika.kurslar, izoh: "Kurslar" },
    { Ikona: GraduationCap, son: statistika.darslar, izoh: "Darslar" },
    { Ikona: Award, son: statistika.sertifikatlar, izoh: "Sertifikatlar" },
  ].filter((k) => k.son > 0);

  if (kartalar.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <KorinibRoyxat as="dl" className="surface-card grid grid-cols-2 gap-6 p-7 sm:p-9 lg:grid-cols-4">
          {kartalar.map(({ Ikona, son, izoh }) => (
            <PaydoElement key={izoh} className="flex items-center gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
                <Ikona className="size-6" aria-hidden="true" />
              </span>
              <div>
                <dt className="sr-only">{izoh}</dt>
                <dd>
                  <span className="block text-2xl font-black leading-tight text-fg sm:text-3xl">
                    {formatSon(son)}
                  </span>
                  <span className="text-sm text-fg-muted">{izoh}</span>
                </dd>
              </div>
            </PaydoElement>
          ))}
        </KorinibRoyxat>
      </Container>
    </section>
  );
}
