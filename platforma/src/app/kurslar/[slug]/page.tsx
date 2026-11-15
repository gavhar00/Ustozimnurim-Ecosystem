import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  PlayCircle,
  User,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { YozilishTugmasi } from "@/components/dars/yozilish-tugmasi";
import { joriyProfil } from "@/lib/auth";
import { kursDarslari, yozilganmi } from "@/lib/data/darslar";
import { Container } from "@/components/ui/primitives";
import { kursRejasi, kursTopish } from "@/lib/data/kurslar";
import { DARAJA_NOMI, DARS_TURI_NOMI, type DarsTuri } from "@/lib/turlar";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const kurs = await kursTopish(slug);

  if (!kurs) return { title: "Kurs topilmadi" };

  return {
    title: kurs.nom,
    description: kurs.qisqa_tavsif,
    openGraph: { title: kurs.nom, description: kurs.qisqa_tavsif },
  };
}

const DARS_IKONASI: Record<DarsTuri, typeof PlayCircle> = {
  video: PlayCircle,
  amaliyot: FileText,
  test: CheckCircle2,
};

export default async function KursSahifasi({ params }: Props) {
  const { slug } = await params;
  const kurs = await kursTopish(slug);

  if (!kurs) notFound();

  const [modullar, profil, darslar] = await Promise.all([
    kursRejasi(kurs.id),
    joriyProfil(),
    kursDarslari(kurs.id),
  ]);

  const yozilgan = profil ? await yozilganmi(profil.id, kurs.id) : false;
  const birinchiDars = darslar[0]
    ? `/kurslar/${kurs.slug}/dars/${darslar[0].slug}`
    : null;
  const soat = Math.round((kurs.davomiylik_daqiqa / 60) * 10) / 10;

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Yo‘l" className="mb-6 text-sm text-fg-muted">
        <Link href="/kurslar" className="hover:text-gold-300">
          Kurslar
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-fg">{kurs.nom}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div>
          <h1 className="text-balance text-3xl font-black leading-tight sm:text-4xl">
            {kurs.nom}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-fg-muted">
            {kurs.qisqa_tavsif}
          </p>

          {kurs.tavsif ? (
            <div className="mt-8">
              <h2 className="text-xl font-extrabold">Kurs haqida</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-fg-muted">
                {kurs.tavsif}
              </p>
            </div>
          ) : null}

          <div className="mt-10">
            <h2 className="text-xl font-extrabold">O‘quv rejasi</h2>

            {modullar.length === 0 ? (
              <p className="mt-3 rounded-xl border border-border-subtle bg-ink-850/60 px-5 py-4 text-sm text-fg-muted">
                O‘quv rejasi hali to‘ldirilmagan.
              </p>
            ) : (
              <ol className="mt-4 space-y-4">
                {modullar.map((modul, i) => (
                  <li key={modul.id} className="surface-card p-5">
                    <h3 className="flex items-center gap-2.5 text-base font-extrabold text-fg">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gold-400/12 text-xs font-black text-gold-300">
                        {i + 1}
                      </span>
                      {modul.nom}
                    </h3>

                    <ul className="mt-4 space-y-2.5">
                      {modul.darslar.map((dars) => {
                        const Ikona = DARS_IKONASI[dars.turi];
                        return (
                          <li key={dars.id}>
                            <Link
                              href={`/kurslar/${kurs.slug}/dars/${dars.slug}`}
                              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-gold-400/8"
                            >
                              <Ikona
                                className="size-4 shrink-0 text-gold-400/70"
                                aria-hidden="true"
                              />
                              <span className="flex-1 text-fg">{dars.nom}</span>
                              <span className="shrink-0 text-xs">
                                {DARS_TURI_NOMI[dars.turi]} ·{" "}
                                {dars.davomiylik_daqiqa} daq.
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Yon panel */}
        <aside className="surface-card p-6 lg:sticky lg:top-24">
          <dl className="space-y-4">
            <Qator
              ikona={<Layers className="size-4" aria-hidden="true" />}
              nom="Daraja"
              qiymat={DARAJA_NOMI[kurs.daraja]}
            />
            <Qator
              ikona={<Clock className="size-4" aria-hidden="true" />}
              nom="Davomiyligi"
              qiymat={`${soat} soat`}
            />
            <Qator
              ikona={<PlayCircle className="size-4" aria-hidden="true" />}
              nom="Darslar"
              qiymat={`${kurs.darslar_soni} ta`}
            />
            {kurs.ustoz_ismi ? (
              <Qator
                ikona={<User className="size-4" aria-hidden="true" />}
                nom="Ustoz"
                qiymat={kurs.ustoz_ismi}
              />
            ) : null}
          </dl>

          <div className="mt-6">
            {profil ? (
              <YozilishTugmasi
                kursId={kurs.id}
                allaqachonYozilgan={yozilgan}
                birinchiDarsHref={birinchiDars}
              />
            ) : (
              <>
                <ButtonLink
                  href={`/kirish?keyin=${encodeURIComponent(`/kurslar/${kurs.slug}`)}`}
                  size="lg"
                  className="w-full"
                >
                  Kursga yozilish
                  <ArrowRight className="size-4.5" aria-hidden="true" />
                </ButtonLink>
                <p className="mt-3 text-center text-xs text-fg-muted">
                  Yozilish uchun avval hisobga kiring.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}

function Qator({
  ikona,
  nom,
  qiymat,
}: {
  ikona: React.ReactNode;
  nom: string;
  qiymat: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
      <dt className="flex items-center gap-2 text-sm text-fg-muted">
        <span className="text-gold-400/70">{ikona}</span>
        {nom}
      </dt>
      <dd className="text-sm font-bold text-fg">{qiymat}</dd>
    </div>
  );
}
