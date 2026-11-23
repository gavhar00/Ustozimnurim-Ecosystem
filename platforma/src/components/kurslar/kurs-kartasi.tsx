import Link from "next/link";
import { PaydoElement } from "@/components/ui/harakat";
import { Clock, PlayCircle, User } from "lucide-react";
import { DARAJA_NOMI, type Kurs } from "@/lib/turlar";
import { YonalishIkona } from "@/lib/yonalish-ikonalari";

function davomiylikMatni(daqiqa: number) {
  if (daqiqa < 60) return `${daqiqa} daqiqa`;
  const soat = Math.floor(daqiqa / 60);
  const qoldiq = daqiqa % 60;
  return qoldiq ? `${soat} soat ${qoldiq} daqiqa` : `${soat} soat`;
}

export function KursKartasi({
  kurs,
  ikona,
}: {
  kurs: Kurs;
  /** Yo‘nalish ikonasining kaliti (bazadan). */
  ikona?: string;
}) {

  return (
    <PaydoElement as="li" className="h-full">
      <Link
        href={`/kurslar/${kurs.slug}`}
        className="group flex h-full flex-col rounded-card border border-border-subtle bg-bg-card p-6 transition-all duration-250 hover:-translate-y-1 hover:border-border-strong"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gold-400/12 text-gold-300">
            {ikona ? (
              <YonalishIkona kalit={ikona} className="size-6" />
            ) : (
              <PlayCircle className="size-6" aria-hidden="true" />
            )}
          </span>

          {kurs.pro ? (
            <span className="rounded-pill border border-border-strong bg-gold-400/12 px-3 py-1 text-xs font-extrabold text-gold-300">
              Pro
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-lg font-extrabold leading-snug text-fg">
          {kurs.nom}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
          {kurs.qisqa_tavsif}
        </p>

        <dl className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-4 text-xs text-fg-muted">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Daraja</dt>
            <dd className="font-bold text-champagne">
              {DARAJA_NOMI[kurs.daraja]}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            <dt className="sr-only">Davomiyligi</dt>
            <dd>{davomiylikMatni(kurs.davomiylik_daqiqa)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <PlayCircle className="size-3.5" aria-hidden="true" />
            <dt className="sr-only">Darslar soni</dt>
            <dd>{kurs.darslar_soni} dars</dd>
          </div>
          {kurs.ustoz_ismi ? (
            <div className="flex items-center gap-1.5">
              <User className="size-3.5" aria-hidden="true" />
              <dt className="sr-only">Ustoz</dt>
              <dd>{kurs.ustoz_ismi}</dd>
            </div>
          ) : null}
        </dl>
      </Link>
    </PaydoElement>
  );
}
