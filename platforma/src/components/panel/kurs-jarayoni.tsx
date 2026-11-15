import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { YozilganKurs } from "@/lib/data/panel";

/** Yozilgan kurs kartasi — jarayon chizig‘i bilan. */
export function KursJarayoni({ kurs }: { kurs: YozilganKurs }) {
  const jami = Math.max(kurs.darslar_soni, 0);
  const foiz =
    jami > 0 ? Math.min(Math.round((kurs.tugatilgan_darslar / jami) * 100), 100) : 0;

  return (
    <li>
      <Link
        href={`/kurslar/${kurs.slug}`}
        className="group block rounded-card border border-border-subtle bg-bg-card p-5 transition-all duration-250 hover:border-border-strong"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-fg">
              {kurs.nom}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-fg-muted">
              {kurs.qisqa_tavsif}
            </p>
          </div>
          <ArrowRight
            className="mt-1 size-5 shrink-0 text-gold-300 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-fg-muted">
              {kurs.tugatilgan_darslar} / {jami} dars
            </span>
            <span className="text-gold-300">{foiz}%</span>
          </div>

          <div
            className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-700/70"
            role="progressbar"
            aria-valuenow={foiz}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${kurs.nom} bo‘yicha jarayon`}
          >
            <div
              className="h-full rounded-pill bg-linear-[90deg,var(--color-gold-300),var(--color-gold-500)] transition-[width] duration-500"
              style={{ width: `${foiz}%` }}
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
