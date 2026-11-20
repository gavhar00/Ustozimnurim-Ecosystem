import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JarayonChizigi, PaydoElement } from "@/components/ui/harakat";
import type { YozilganKurs } from "@/lib/data/panel";

/** Yozilgan kurs kartasi — jarayon chizig‘i bilan. */
export function KursJarayoni({ kurs }: { kurs: YozilganKurs }) {
  const jami = Math.max(kurs.darslar_soni, 0);
  const foiz =
    jami > 0 ? Math.min(Math.round((kurs.tugatilgan_darslar / jami) * 100), 100) : 0;

  return (
    <PaydoElement as="li" className="h-full">
      <Link
        href={`/kurslar/${kurs.slug}`}
        className="group block h-full rounded-card border border-border-subtle bg-bg-card p-5 transition-all duration-250 hover:-translate-y-0.5 hover:border-border-strong"
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

          <div className="mt-2">
            <JarayonChizigi foiz={foiz} etiket={`${kurs.nom} bo‘yicha jarayon`} />
          </div>
        </div>
      </Link>
    </PaydoElement>
  );
}
