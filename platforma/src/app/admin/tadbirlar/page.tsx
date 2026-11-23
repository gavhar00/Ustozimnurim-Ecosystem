import type { Metadata } from "next";
import { CalendarDays, Plus } from "lucide-react";
import { TadbirAmallari, TadbirFormasi } from "@/components/admin/tadbir-formasi";
import { EmptyState } from "@/components/ui/empty-state";
import { adminTadbirlari } from "@/lib/data/tadbirlar";
import { tadbirSanasi } from "@/lib/sana";

export const metadata: Metadata = { title: "Tadbirlar", robots: { index: false, follow: false } };

export default async function AdminTadbirlar() {
  const royxat = await adminTadbirlari();
  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">Tadbirlar</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Tadbir yarating, tayyor bo‘lgach chop eting. Chop etilgan tadbirga o‘quvchilar yozila oladi.
        </p>
      </header>

      <section className="mt-7">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-extrabold">
          <Plus className="size-5 text-gold-300" aria-hidden="true" />
          Yangi tadbir
        </h2>
        <div className="surface-card p-6">
          <TadbirFormasi />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Barcha tadbirlar</h2>
        {royxat.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              ikona={<CalendarDays className="size-7" aria-hidden="true" />}
              sarlavha="Tadbir yo‘q"
              izoh="Yuqoridagi formadan birinchi tadbirni yarating."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {royxat.map((t) => (
              <li key={t.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold text-fg">{t.nom}</p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {tadbirSanasi(t.boshlanish)} · {t.royxatdan} kishi yozilgan
                      {t.sigim ? ` / ${t.sigim}` : ""}
                    </p>
                  </div>
                  <span
                    className={
                      t.holat === "chop_etilgan"
                        ? "rounded-pill border border-border-strong bg-gold-400/12 px-3 py-1 text-xs font-extrabold text-gold-300"
                        : "rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-fg-muted"
                    }
                  >
                    {t.holat === "chop_etilgan" ? "Chop etilgan" : "Qoralama"}
                  </span>
                </div>
                <div className="mt-4">
                  <TadbirAmallari id={t.id} holat={t.holat} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
