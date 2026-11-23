import type { Metadata } from "next";
import { Compass, Plus } from "lucide-react";
import {
  YonalishFormasi,
  YonalishOchirish,
} from "@/components/admin/yonalish-formasi";
import { EmptyState } from "@/components/ui/empty-state";
import { adminYonalishlari } from "@/lib/data/yonalishlar";
import { YonalishIkona } from "@/lib/yonalish-ikonalari";

export const metadata: Metadata = {
  title: "Yo‘nalishlar",
  robots: { index: false, follow: false },
};

export default async function AdminYonalishlar() {
  const royxat = await adminYonalishlari();

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">Yo‘nalishlar</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Saytdagi kasbiy yo‘nalishlarni shu yerdan boshqaring. Yashirin yo‘nalish
          saytda ko‘rinmaydi — kurs qo‘shib bo‘lgach yoqing.
        </p>
      </header>

      <section className="mt-7">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-extrabold">
          <Plus className="size-5 text-gold-300" aria-hidden="true" />
          Yangi yo‘nalish
        </h2>
        <div className="surface-card p-6">
          <YonalishFormasi />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Mavjud yo‘nalishlar</h2>
        {royxat.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              ikona={<Compass className="size-7" aria-hidden="true" />}
              sarlavha="Yo‘nalish yo‘q"
              izoh="Yuqoridagi formadan birinchi yo‘nalishni yarating."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {royxat.map((y) => (
                <li key={y.slug} className="surface-card p-5">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center gap-4">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/12 text-gold-300">
                        <YonalishIkona kalit={y.ikona} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-extrabold text-fg">{y.nom}</span>
                        <span className="block text-xs text-fg-muted">
                          /{y.slug} · tartib {y.tartib}
                        </span>
                      </span>
                      <span
                        className={
                          y.faol
                            ? "rounded-pill border border-border-strong bg-gold-400/12 px-3 py-1 text-xs font-extrabold text-gold-300"
                            : "rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-fg-muted"
                        }
                      >
                        {y.faol ? "Ko‘rinadi" : "Yashirin"}
                      </span>
                    </summary>

                    <div className="mt-5 border-t border-border-subtle pt-5">
                      <YonalishFormasi yonalish={y} />
                      <div className="mt-5">
                        <YonalishOchirish slug={y.slug} nom={y.nom} />
                      </div>
                    </div>
                  </details>
                </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
