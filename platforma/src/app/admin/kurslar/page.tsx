import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { HolatTugmasi } from "@/components/admin/holat-tugmasi";
import { KursFormasi } from "@/components/admin/kurs-formasi";
import { EmptyState } from "@/components/ui/empty-state";
import { adminKurslari } from "@/lib/data/admin";
import { YONALISHLAR } from "@/lib/data/yonalishlar";
import { DARAJA_NOMI } from "@/lib/turlar";

export const metadata: Metadata = {
  title: "Kurslar",
  robots: { index: false, follow: false },
};

const HOLAT_NOMI: Record<string, string> = {
  qoralama: "Qoralama",
  chop_etilgan: "Chop etilgan",
  arxiv: "Arxiv",
};

export default async function AdminKurslar() {
  const kurslar = await adminKurslari();

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">Kurslar</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Yangi kurs yarating, darslar qo‘shing va tayyor bo‘lgach chop eting.
        </p>
      </header>

      <section className="mt-7">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-extrabold">
          <Plus className="size-5 text-gold-300" aria-hidden="true" />
          Yangi kurs
        </h2>
        <KursFormasi
          yonalishlar={YONALISHLAR.map((y) => ({ slug: y.slug, nom: y.nom }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Mavjud kurslar</h2>

        {kurslar.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              ikona={<BookOpen className="size-7" aria-hidden="true" />}
              sarlavha="Hali kurs yo‘q"
              izoh="Yuqoridagi formadan birinchi kursni yarating."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {kurslar.map((kurs) => (
              <li
                key={kurs.id}
                className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/kurslar/${kurs.id}`}
                      className="truncate font-extrabold text-fg hover:text-gold-300"
                    >
                      {kurs.nom}
                    </Link>
                    <span
                      className={
                        kurs.holat === "chop_etilgan"
                          ? "rounded-pill border border-[#5fd39b]/40 bg-[#5fd39b]/10 px-2.5 py-0.5 text-xs font-bold text-[#9fe4c2]"
                          : "rounded-pill border border-border-strong px-2.5 py-0.5 text-xs font-bold text-fg-muted"
                      }
                    >
                      {HOLAT_NOMI[kurs.holat] ?? kurs.holat}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-fg-muted">
                    {DARAJA_NOMI[kurs.daraja]} · {kurs.darslar_soni} dars ·{" "}
                    {kurs.qisqa_tavsif}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/kurslar/${kurs.id}`}
                    className="rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-fg transition-colors hover:border-gold-400/60"
                  >
                    Darslar
                  </Link>
                  <HolatTugmasi kursId={kurs.id} joriyHolat={kurs.holat} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
