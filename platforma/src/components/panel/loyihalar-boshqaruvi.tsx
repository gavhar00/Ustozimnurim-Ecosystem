"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Code2 as Github, ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  loyihaOchir,
} from "@/app/panel/loyihalar-amallari";
import { LoyihaFormasi } from "@/components/panel/loyiha-formasi";
import { LoyihaSorovlari } from "@/components/panel/loyiha-sorovlari";
import type { LoyihaAzosi, LoyihaSorovi } from "@/lib/data/ijtimoiy";
import { LOYIHA_HOLATI_NOMI, type Loyiha } from "@/lib/turlar";

export function LoyihalarBoshqaruvi({
  loyihalar,
  azolar = {},
  sorovlar = [],
  foydalanuvchiId,
}: {
  loyihalar: Loyiha[];
  azolar?: Record<string, LoyihaAzosi[]>;
  sorovlar?: LoyihaSorovi[];
  foydalanuvchiId: string;
}) {
  const [ochirilayotgan, setOchirilayotgan] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();
  const [xato, setXato] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {loyihalar.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {loyihalar.map((loyiha) => (
            <li key={loyiha.id} className="surface-card flex flex-col p-5">
              {loyiha.muqova_url ? (
                <div className="relative -mx-5 -mt-5 mb-4 h-32 overflow-hidden rounded-t-card">
                  <Image src={loyiha.muqova_url} alt="" fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover" unoptimized />
                  {loyiha.logo_url ? <Image src={loyiha.logo_url} alt="" width={52} height={52} className="absolute bottom-3 left-3 size-12 rounded-xl border-2 border-bg-card bg-bg-card object-contain p-1" unoptimized /> : null}
                </div>
              ) : null}
              {!loyiha.muqova_url && loyiha.logo_url ? (
                <div className="mb-4">
                  <Image src={loyiha.logo_url} alt={`${loyiha.nom} logosi`} width={52} height={52} className="size-12 rounded-xl border border-border-subtle bg-bg-card object-contain p-1" unoptimized />
                </div>
              ) : null}
              <p className="mb-2 inline-flex w-fit rounded-md bg-ink-700/70 px-2.5 py-1 text-xs font-bold text-champagne">
                {loyiha.turkum?.trim() || "Umumiy"}
              </p>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-extrabold text-fg">{loyiha.nom}</h3>
                <span className="shrink-0 rounded-pill border border-border-strong px-3 py-1 text-xs font-bold text-gold-300">
                  {LOYIHA_HOLATI_NOMI[loyiha.holat]}
                </span>
              </div>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
                {loyiha.tavsif}
              </p>

              {(azolar[loyiha.id] ?? []).length > 0 ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-fg-muted">Jamoa:</span>
                  <ul className="flex -space-x-2">
                    {(azolar[loyiha.id] ?? []).slice(0, 5).map((azo) => (
                      <li
                        key={azo.id}
                        title={azo.toliq_ism}
                        className="inline-flex size-7 items-center justify-center rounded-full bg-gold-400/20 text-[0.65rem] font-black text-gold-200 ring-2 ring-bg-card"
                      >
                        {azo.toliq_ism.trim().charAt(0).toUpperCase()}
                      </li>
                    ))}
                  </ul>
                  <span className="text-xs text-fg-muted">
                    {(azolar[loyiha.id] ?? []).length} kishi
                  </span>
                </div>
              ) : null}

              {loyiha.texnologiyalar.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {loyiha.texnologiyalar.map((t) => (
                    <li
                      key={t}
                      className="rounded-md bg-ink-700/70 px-2 py-1 font-mono text-xs text-champagne"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 flex items-center gap-3 border-t border-border-subtle pt-3">
                <Link
                  href={`/panel/loyihalarim/${loyiha.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-gold-300"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Tahrirlash
                </Link>
                <Link
                  href={`/hamjamiyat/loyihalar/${loyiha.id}`}
                  className="text-xs font-bold text-fg-muted hover:text-gold-300"
                >
                  Ko‘rish
                </Link>
                {loyiha.github_url ? (
                  <a
                    href={loyiha.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-gold-300"
                  >
                    <Github className="size-3.5" aria-hidden="true" />
                    Kod
                  </a>
                ) : null}
                {loyiha.demo_url ? (
                  <a
                    href={loyiha.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-gold-300"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    Demo
                  </a>
                ) : null}

                <button
                  type="button"
                  disabled={kutilmoqda}
                  onClick={() => {
                    if (ochirilayotgan === loyiha.id) {
                      startTransition(async () => {
                        const natija = await loyihaOchir(loyiha.id);
                        setXato(natija.xato ?? null);
                        setOchirilayotgan(null);
                      });
                    } else {
                      setOchirilayotgan(loyiha.id);
                    }
                  }}
                  onBlur={() => setOchirilayotgan(null)}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted transition-colors hover:text-[#ffb3ad]"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  {ochirilayotgan === loyiha.id ? "Tasdiqlang" : "O‘chirish"}
                </button>
              </div>

              <LoyihaSorovlari
                sorovlar={sorovlar.filter((s) => s.loyiha_id === loyiha.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {xato ? <p className="text-sm text-[#ffb3ad]" role="alert">{xato}</p> : null}
      <LoyihaFormasi foydalanuvchiId={foydalanuvchiId} />
    </div>
  );
}
