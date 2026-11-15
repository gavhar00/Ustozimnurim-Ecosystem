"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import type { OmmaviyLoyiha } from "@/lib/data/ijtimoiy";
import { LOYIHA_HOLATI_NOMI, type LoyihaHolati } from "@/lib/turlar";
import { cn } from "@/lib/utils";

const chipUslub = (faol: boolean) =>
  cn(
    "rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors",
    faol
      ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
      : "border-border-subtle text-fg-muted hover:border-border-strong hover:text-fg",
  );

export function LoyihalarRoyxati({
  loyihalar,
}: {
  loyihalar: OmmaviyLoyiha[];
}) {
  const [qidiruv, setQidiruv] = useState("");
  const [turkum, setTurkum] = useState<string | null>(null);
  const [texnologiya, setTexnologiya] = useState<string | null>(null);
  const [holat, setHolat] = useState<string | null>(null);

  const { turkumlar, texnologiyalar } = useMemo(() => {
    const t = new Set<string>();
    const x = new Set<string>();
    for (const l of loyihalar) {
      if (l.turkum?.trim()) t.add(l.turkum.trim());
      l.texnologiyalar.forEach((v) => x.add(v));
    }
    return {
      turkumlar: [...t].sort(),
      texnologiyalar: [...x].sort().slice(0, 20),
    };
  }, [loyihalar]);

  const natija = useMemo(() => {
    const matn = qidiruv.trim().toLowerCase();
    return loyihalar.filter((l) => {
      if (turkum && l.turkum?.trim() !== turkum) return false;
      if (texnologiya && !l.texnologiyalar.includes(texnologiya)) return false;
      if (holat && l.holat !== holat) return false;
      if (!matn) return true;
      return (
        l.nom.toLowerCase().includes(matn) ||
        l.tavsif.toLowerCase().includes(matn) ||
        l.texnologiyalar.some((v) => v.toLowerCase().includes(matn))
      );
    });
  }, [loyihalar, qidiruv, turkum, texnologiya, holat]);

  if (loyihalar.length === 0) {
    return (
      <EmptyState
        sarlavha="Hali loyiha ulashilmagan"
        izoh="O‘quvchilar portfolioga loyiha qo‘shishi bilan ular shu yerda ko‘rinadi."
      />
    );
  }

  return (
    <div>
      <div className="surface-card space-y-5 p-5 sm:p-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-soft"
            aria-hidden="true"
          />
          <label htmlFor="loyiha-qidiruv" className="sr-only">
            Loyihalarni qidirish
          </label>
          <Input
            id="loyiha-qidiruv"
            type="search"
            value={qidiruv}
            onChange={(e) => setQidiruv(e.target.value)}
            placeholder="Nom, tavsif yoki texnologiya bo‘yicha…"
            className="pl-11"
          />
        </div>

        {turkumlar.length > 0 ? (
          <Filtr
            sarlavha="Turkum"
            qiymatlar={turkumlar}
            tanlangan={turkum}
            tanla={setTurkum}
          />
        ) : null}

        {texnologiyalar.length > 0 ? (
          <Filtr
            sarlavha="Texnologiya"
            qiymatlar={texnologiyalar}
            tanlangan={texnologiya}
            tanla={setTexnologiya}
          />
        ) : null}

        <fieldset>
          <legend className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-fg-muted">
            Holat
          </legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHolat(null)}
              aria-pressed={holat === null}
              className={chipUslub(holat === null)}
            >
              Barchasi
            </button>
            {(Object.keys(LOYIHA_HOLATI_NOMI) as LoyihaHolati[]).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHolat(h)}
                aria-pressed={holat === h}
                className={chipUslub(holat === h)}
              >
                {LOYIHA_HOLATI_NOMI[h]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-6 text-sm text-fg-muted" role="status" aria-live="polite">
        {natija.length} ta loyiha topildi
      </p>

      {natija.length === 0 ? (
        <EmptyState
          className="mt-4"
          ikona={<Search className="size-7" aria-hidden="true" />}
          sarlavha="Mos loyiha topilmadi"
          izoh="Filtrlarni tozalab yoki boshqa so‘z bilan qidirib ko‘ring."
        />
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {natija.map((loyiha) => (
            <li key={loyiha.id}>
              <Link
                href={`/hamjamiyat/loyihalar/${loyiha.id}`}
                className="group flex h-full flex-col rounded-card border border-border-subtle bg-bg-card p-5 transition-all duration-250 hover:-translate-y-1 hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-extrabold leading-snug text-fg">
                    {loyiha.nom}
                  </h2>
                  <span className="shrink-0 rounded-pill border border-border-strong px-3 py-1 text-xs font-bold text-gold-300">
                    {LOYIHA_HOLATI_NOMI[loyiha.holat as LoyihaHolati] ??
                      loyiha.holat}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-fg-muted">
                  {loyiha.tavsif}
                </p>

                {loyiha.texnologiyalar.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {loyiha.texnologiyalar.slice(0, 4).map((t) => (
                      <li
                        key={t}
                        className="rounded-md bg-ink-700/70 px-2 py-1 font-mono text-xs text-champagne"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {loyiha.muallif ? (
                  <p className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-3 text-xs text-fg-muted">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-6 items-center justify-center rounded-full bg-gold-400/15 text-[0.65rem] font-black text-gold-300"
                    >
                      {loyiha.muallif.toliq_ism.trim().charAt(0).toUpperCase()}
                    </span>
                    {loyiha.muallif.toliq_ism}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filtr({
  sarlavha,
  qiymatlar,
  tanlangan,
  tanla,
}: {
  sarlavha: string;
  qiymatlar: string[];
  tanlangan: string | null;
  tanla: (q: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-fg-muted">
        {sarlavha}
      </legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => tanla(null)}
          aria-pressed={tanlangan === null}
          className={chipUslub(tanlangan === null)}
        >
          Barchasi
        </button>
        {qiymatlar.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => tanla(q)}
            aria-pressed={tanlangan === q}
            className={chipUslub(tanlangan === q)}
          >
            {q}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
