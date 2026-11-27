"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Download, Play, Timer, XCircle } from "lucide-react";
import { vazifaniBoshla } from "@/app/amaliyot/vazifa-amallar";
import type { Vazifa, VazifaHolati } from "@/lib/vazifa-turlari";
import { cn } from "@/lib/utils";

function qolgan(muddatISO: string, hozir: number) {
  const ms = Math.max(0, new Date(muddatISO).getTime() - hozir);
  const s = Math.floor(ms / 1000);
  const soat = Math.floor(s / 3600);
  const daqiqa = Math.floor((s % 3600) / 60);
  const soniya = s % 60;
  const ikki = (n: number) => String(n).padStart(2, "0");
  return { ms, matn: `${ikki(soat)}:${ikki(daqiqa)}:${ikki(soniya)}` };
}

const sana = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Taymer({ muddat }: { muddat: string }) {
  const [hozir, setHozir] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setHozir(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const { ms, matn } = qolgan(muddat, hozir);
  return (
    <span
      suppressHydrationWarning
      className={cn("font-mono text-lg font-black tabular-nums", ms < 3600_000 ? "text-red-400" : "text-gold-300")}
    >
      {ms === 0 ? "Muddat tugadi" : matn}
    </span>
  );
}

export function VazifaPaneli({
  vazifa,
  holat,
  muddat,
  topshirilgan,
  keyingiBor,
}: {
  vazifa: Vazifa;
  holat: VazifaHolati;
  muddat?: string;
  topshirilgan?: string | null;
  keyingiBor?: boolean;
}) {
  const router = useRouter();
  const [kutilmoqda, startTransition] = useTransition();
  const [xato, setXato] = useState<string | null>(null);
  const boshlangan = holat === "faol" || holat === "topshirilgan";

  function boshla() {
    setXato(null);
    startTransition(async () => {
      const r = await vazifaniBoshla(vazifa.id);
      if (!r.ok) return setXato(r.xato);
      router.refresh();
    });
  }

  return (
    <section aria-label="Joriy vazifa" className="surface-card mb-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-gold-300">Vazifa №{vazifa.tartib}</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">{vazifa.nom}</h2>
        </div>
        {holat === "faol" && muddat ? (
          <div className="rounded-2xl border border-border-strong bg-gold-400/10 px-4 py-2 text-right">
            <p className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-fg-muted">
              <Timer className="size-3.5" aria-hidden="true" /> Qolgan vaqt
            </p>
            <div><Taymer muddat={muddat} /></div>
            <p className="text-[0.7rem] text-fg-muted">Muddat: <span suppressHydrationWarning>{sana(muddat)}</span></p>
          </div>
        ) : null}
        {holat === "topshirilgan" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-gold-400/12 px-3 py-1.5 text-sm font-extrabold text-gold-300">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Topshirildi
            {topshirilgan ? <span suppressHydrationWarning className="font-bold text-fg-muted">· {sana(topshirilgan)}</span> : null}
          </span>
        ) : null}
        {holat === "otkazilgan" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-3 py-1.5 text-sm font-extrabold text-red-400">
            <XCircle className="size-4" aria-hidden="true" /> Muddat tugagan
          </span>
        ) : null}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted sm:text-base">{vazifa.tavsif}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {vazifa.fayl_nomi && boshlangan ? (
          <a
            href={`/amaliyot/fayl/${vazifa.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-extrabold text-gold-300 hover:bg-gold-400/10"
          >
            <Download className="size-4" aria-hidden="true" /> Loyiha fayli: {vazifa.fayl_nomi}
          </a>
        ) : null}
        {holat === "kutmoqda" ? (
          <>
            <button
              type="button"
              onClick={boshla}
              disabled={kutilmoqda}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-400 px-5 text-sm font-black text-ink-950 hover:bg-gold-300 disabled:opacity-50"
            >
              <Play className="size-4" aria-hidden="true" />
              {kutilmoqda ? "Boshlanmoqda…" : keyingiBor ? "Keyingi vazifani boshlash" : "Vazifani boshlash"}
            </button>
            <p className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
              <Clock className="size-3.5" aria-hidden="true" />
              Boshlagan zahoti {vazifa.muddat_soat} soatlik muddat ochiladi va loyiha fayli beriladi.
            </p>
          </>
        ) : null}
      </div>
      {xato ? <p role="alert" className="mt-3 text-sm text-red-400">{xato}</p> : null}
    </section>
  );
}
