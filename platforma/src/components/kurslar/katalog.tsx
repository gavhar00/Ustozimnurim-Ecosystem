"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { KursKartasi } from "@/components/kurslar/kurs-kartasi";
import { PaydoRoyxat } from "@/components/ui/harakat";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import { YONALISHLAR } from "@/lib/data/yonalishlar";
import { DARAJA_NOMI, type Daraja, type Kurs } from "@/lib/turlar";
import { cn } from "@/lib/utils";

const DARAJALAR: Daraja[] = ["boshlangich", "orta", "yuqori"];

const chipUslub = (faol: boolean) =>
  cn(
    "rounded-pill border px-4 py-2 text-sm font-bold transition-colors",
    faol
      ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
      : "border-border-subtle text-fg-muted hover:border-border-strong hover:text-fg",
  );

export function Katalog({ kurslar }: { kurslar: Kurs[] }) {
  const [qidiruv, setQidiruv] = useState("");
  const [yonalish, setYonalish] = useState<string | null>(null);
  const [daraja, setDaraja] = useState<Daraja | null>(null);

  const natija = useMemo(() => {
    const matn = qidiruv.trim().toLowerCase();
    return kurslar.filter((kurs) => {
      if (yonalish && kurs.yonalish_slug !== yonalish) return false;
      if (daraja && kurs.daraja !== daraja) return false;
      if (!matn) return true;
      return (
        kurs.nom.toLowerCase().includes(matn) ||
        kurs.qisqa_tavsif.toLowerCase().includes(matn)
      );
    });
  }, [kurslar, qidiruv, yonalish, daraja]);

  // Baza hali ulanmagan yoki kurs qo‘shilmagan
  if (kurslar.length === 0) {
    return (
      <EmptyState
        sarlavha="Hozircha kurslar qo‘shilmagan"
        izoh="Birinchi kurslar tayyor bo‘lishi bilan shu yerda paydo bo‘ladi. Yangiliklardan xabardor bo‘lish uchun Telegram kanalimizga obuna bo‘ling."
      />
    );
  }

  return (
    <div>
      <div className="surface-card p-5 sm:p-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-soft"
            aria-hidden="true"
          />
          <label htmlFor="kurs-qidiruv" className="sr-only">
            Kurslarni qidirish
          </label>
          <Input
            id="kurs-qidiruv"
            type="search"
            value={qidiruv}
            onChange={(e) => setQidiruv(e.target.value)}
            placeholder="Kurs nomi bo‘yicha qidiring…"
            className="pl-11"
          />
        </div>

        <div className="mt-5 space-y-4">
          <fieldset>
            <legend className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-fg-muted">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              Yo‘nalish
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setYonalish(null)}
                aria-pressed={yonalish === null}
                className={chipUslub(yonalish === null)}
              >
                Barchasi
              </button>
              {YONALISHLAR.map((y) => (
                <button
                  key={y.slug}
                  type="button"
                  onClick={() => setYonalish(y.slug)}
                  aria-pressed={yonalish === y.slug}
                  className={chipUslub(yonalish === y.slug)}
                >
                  {y.nom}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-fg-muted">
              Daraja
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDaraja(null)}
                aria-pressed={daraja === null}
                className={chipUslub(daraja === null)}
              >
                Barchasi
              </button>
              {DARAJALAR.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaraja(d)}
                  aria-pressed={daraja === d}
                  className={chipUslub(daraja === d)}
                >
                  {DARAJA_NOMI[d]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <p className="mt-6 text-sm text-fg-muted" role="status" aria-live="polite">
        {natija.length} ta kurs topildi
      </p>

      {natija.length === 0 ? (
        <EmptyState
          className="mt-4"
          ikona={<Search className="size-7" aria-hidden="true" />}
          sarlavha="Mos kurs topilmadi"
          izoh="Qidiruv so‘zini qisqartiring yoki filtrlarni tozalab ko‘ring."
        />
      ) : (
        <PaydoRoyxat
          key={`${yonalish ?? "h"}-${daraja ?? "h"}`}
          as="ul"
          className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {natija.map((kurs) => (
            <KursKartasi key={kurs.id} kurs={kurs} />
          ))}
        </PaydoRoyxat>
      )}
    </div>
  );
}
