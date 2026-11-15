import type { Metadata } from "next";
import Link from "next/link";
import { Award, GraduationCap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil } from "@/lib/auth";
import { sertifikatlar } from "@/lib/data/panel";

export const metadata: Metadata = {
  title: "Yutuqlar",
  robots: { index: false, follow: false },
};

export default async function YutuqlarSahifasi() {
  const profil = await profilTalabQil("/panel/yutuqlar");
  const royxat = await sertifikatlar(profil.id);

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Yutuqlar
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Kursni tugatganingizda sertifikat shu yerda paydo bo‘ladi.
        </p>
      </header>

      {royxat.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            ikona={<Award className="size-7" aria-hidden="true" />}
            sarlavha="Hali sertifikat yo‘q"
            izoh="Birinchi kursni tugating — sertifikat avtomatik beriladi."
            amal={
              <ButtonLink href="/kurslar">
                <GraduationCap className="size-4" aria-hidden="true" />
                Kurs tanlash
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <ul className="mt-7 grid gap-4 sm:grid-cols-2">
          {royxat.map((s) => (
            <li key={s.id} className="surface-card flex items-center gap-4 p-5">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
                <Award className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/kurslar/${s.kurs_slug}`}
                  className="truncate font-extrabold text-fg hover:text-gold-300"
                >
                  {s.kurs_nomi}
                </Link>
                <p className="mt-0.5 text-sm text-fg-muted">
                  {new Intl.DateTimeFormat("uz-UZ", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(s.berilgan))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
