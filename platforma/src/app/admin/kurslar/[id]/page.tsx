import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, GraduationCap, Plus } from "lucide-react";
import { DarsFormasi } from "@/components/admin/dars-formasi";
import { HolatTugmasi } from "@/components/admin/holat-tugmasi";
import { EmptyState } from "@/components/ui/empty-state";
import { adminDarslari, adminKursTopish } from "@/lib/data/admin";
import { DARS_TURI_NOMI, type DarsTuri } from "@/lib/turlar";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Kurs darslari",
  robots: { index: false, follow: false },
};

export default async function AdminKursSahifasi({ params }: Props) {
  const { id } = await params;
  const kurs = await adminKursTopish(id);
  if (!kurs) notFound();

  const darslar = await adminDarslari(kurs.id);

  return (
    <>
      <nav aria-label="Yo‘l" className="mb-5">
        <Link
          href="/admin/kurslar"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-gold-300"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Kurslar
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">
            {kurs.nom}
          </h1>
          <p className="mt-2 text-fg-muted">
            {darslar.length} ta dars · {kurs.qisqa_tavsif}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/kurslar/${kurs.slug}`}
            className="rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-fg transition-colors hover:border-gold-400/60"
          >
            Saytda ko‘rish
          </Link>
          <HolatTugmasi kursId={kurs.id} joriyHolat={kurs.holat} />
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold">Darslar</h2>

        {darslar.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              ikona={<GraduationCap className="size-7" aria-hidden="true" />}
              sarlavha="Hali dars yo‘q"
              izoh="Quyidagi formadan birinchi darsni qo‘shing."
            />
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {darslar.map((dars, i) => (
              <li
                key={dars.id}
                className="surface-card flex items-center justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold-400/12 text-xs font-black text-gold-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-fg">{dars.nom}</p>
                    <p className="text-xs text-fg-muted">
                      {DARS_TURI_NOMI[dars.turi as DarsTuri]} ·{" "}
                      {dars.davomiylik_daqiqa} daq.
                    </p>
                  </div>
                </div>

                <Link
                  href={`/kurslar/${kurs.slug}/dars/${dars.slug}`}
                  className="shrink-0 text-sm font-bold text-gold-300 hover:text-gold-200"
                >
                  Ochish
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-extrabold">
          <Plus className="size-5 text-gold-300" aria-hidden="true" />
          Yangi dars
        </h2>
        <DarsFormasi kursId={kurs.id} />
      </section>
    </>
  );
}
