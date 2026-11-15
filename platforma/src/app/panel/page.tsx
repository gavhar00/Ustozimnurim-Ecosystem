import type { Metadata } from "next";
import { Award, BookOpen, CheckCircle2, GraduationCap } from "lucide-react";
import { KursJarayoni } from "@/components/panel/kurs-jarayoni";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil } from "@/lib/auth";
import { panelHisobi, yozilganKurslar } from "@/lib/data/panel";

export const metadata: Metadata = {
  title: "Umumiy ko‘rinish",
  robots: { index: false, follow: false },
};

export default async function PanelSahifasi() {
  const profil = await profilTalabQil("/panel");
  const [hisob, kurslar] = await Promise.all([
    panelHisobi(profil.id),
    yozilganKurslar(profil.id),
  ]);

  const kartalar = hisob
    ? [
        { Ikona: BookOpen, son: hisob.kurslar, izoh: "Kurslarim" },
        {
          Ikona: CheckCircle2,
          son: hisob.tugatilgan_darslar,
          izoh: "Tugatilgan darslar",
        },
        { Ikona: Award, son: hisob.sertifikatlar, izoh: "Sertifikatlar" },
      ]
    : [];

  return (
    <>
      <header>
        <h1 className="text-balance text-2xl font-black leading-tight sm:text-3xl">
          Xush kelibsiz,{" "}
          <span className="text-gold-gradient">{profil.toliq_ism}</span>!
        </h1>
        <p className="mt-2 text-pretty leading-relaxed text-fg-muted">
          Kurslaringiz, jarayoningiz va yutuqlaringiz shu yerda to‘planadi.
        </p>
      </header>

      {kartalar.length > 0 ? (
        <dl className="mt-7 grid gap-4 sm:grid-cols-3">
          {kartalar.map(({ Ikona, son, izoh }) => (
            <div
              key={izoh}
              className="surface-card flex items-center gap-4 p-5"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
                <Ikona className="size-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="sr-only">{izoh}</dt>
                <dd>
                  <span className="block text-2xl font-black leading-tight text-fg">
                    {son}
                  </span>
                  <span className="text-sm text-fg-muted">{izoh}</span>
                </dd>
              </div>
            </div>
          ))}
        </dl>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">O‘qishni davom ettiring</h2>

        {kurslar.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              ikona={<BookOpen className="size-7" aria-hidden="true" />}
              sarlavha="Siz hali birorta kursga yozilmagansiz"
              izoh="Katalogdan o‘zingizga mos kursni tanlang va birinchi darsni boshlang."
              amal={
                <ButtonLink href="/kurslar">
                  <GraduationCap className="size-4" aria-hidden="true" />
                  Kurslarni ko‘rish
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {kurslar.slice(0, 4).map((kurs) => (
              <KursJarayoni key={kurs.id} kurs={kurs} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
