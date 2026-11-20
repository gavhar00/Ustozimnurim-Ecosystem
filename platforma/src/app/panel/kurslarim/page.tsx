import type { Metadata } from "next";
import { BookOpen, GraduationCap } from "lucide-react";
import { KursJarayoni } from "@/components/panel/kurs-jarayoni";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaydoRoyxat } from "@/components/ui/harakat";
import { profilTalabQil } from "@/lib/auth";
import { yozilganKurslar } from "@/lib/data/panel";

export const metadata: Metadata = {
  title: "Mening kurslarim",
  robots: { index: false, follow: false },
};

export default async function KurslarimSahifasi() {
  const profil = await profilTalabQil("/panel/kurslarim");
  const kurslar = await yozilganKurslar(profil.id);

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Mening kurslarim
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          {kurslar.length > 0
            ? `${kurslar.length} ta kursga yozilgansiz.`
            : "Yozilgan kurslaringiz shu yerda ko‘rinadi."}
        </p>
      </header>

      {kurslar.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            ikona={<BookOpen className="size-7" aria-hidden="true" />}
            sarlavha="Hali kurs yo‘q"
            izoh="Katalogdan kurs tanlab, unga yoziling — jarayoningiz shu yerda kuzatiladi."
            amal={
              <ButtonLink href="/kurslar">
                <GraduationCap className="size-4" aria-hidden="true" />
                Kurslarni ko‘rish
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <PaydoRoyxat as="ul" className="mt-7 grid gap-4 sm:grid-cols-2">
          {kurslar.map((kurs) => (
            <KursJarayoni key={kurs.id} kurs={kurs} />
          ))}
        </PaydoRoyxat>
      )}
    </>
  );
}
