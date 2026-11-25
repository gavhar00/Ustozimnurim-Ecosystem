"use client";

import Image from "next/image";
import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { rasmniTekshir } from "@/lib/lenta-rasm";
import { POST_MAKS_RASM } from "@/lib/lenta-turlari";

export type YangiRasm = { id: string; fayl: File; korinish: string };

/**
 * Post uchun rasm tanlash: mavjud (yuklangan) va yangi (hali yuklanmagan) rasmlar.
 * Fayllar tanlanganda darhol tekshiriladi (tur, hajm, haqiqiy rasm ekani).
 */
export function RasmTanlagich({
  mavjud,
  yangilar,
  mavjudniOlibTashla,
  yangiQosh,
  yanginiOlibTashla,
  xatoBerish,
  bloklangan,
}: {
  mavjud: string[];
  yangilar: YangiRasm[];
  mavjudniOlibTashla: (url: string) => void;
  yangiQosh: (r: YangiRasm[]) => void;
  yanginiOlibTashla: (id: string) => void;
  xatoBerish: (xabar: string | null) => void;
  bloklangan: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const jami = mavjud.length + yangilar.length;

  async function tanlandi(royxat: FileList | null) {
    if (!royxat || royxat.length === 0) return;
    xatoBerish(null);
    const bosh = POST_MAKS_RASM - jami;
    if (bosh <= 0) return xatoBerish(`Bitta postga ko‘pi bilan ${POST_MAKS_RASM} ta rasm qo‘shish mumkin.`);

    const qabul: YangiRasm[] = [];
    for (const fayl of Array.from(royxat).slice(0, bosh)) {
      const xato = await rasmniTekshir(fayl);
      if (xato) {
        xatoBerish(xato);
        continue;
      }
      qabul.push({ id: crypto.randomUUID(), fayl, korinish: URL.createObjectURL(fayl) });
    }
    if (royxat.length > bosh) {
      xatoBerish(`Bitta postga ko‘pi bilan ${POST_MAKS_RASM} ta rasm qo‘shish mumkin.`);
    }
    if (qabul.length) yangiQosh(qabul);
  }

  const elementlar = [
    ...mavjud.map((url) => ({ kalit: url, url, olib: () => mavjudniOlibTashla(url), blob: false })),
    ...yangilar.map((r) => ({ kalit: r.id, url: r.korinish, olib: () => yanginiOlibTashla(r.id), blob: true })),
  ];

  return (
    <div className="space-y-3">
      {elementlar.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {elementlar.map((e) => (
            <li key={e.kalit} className="relative aspect-square overflow-hidden rounded-xl border border-border-subtle bg-ink-850/60">
              {e.blob ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: ko‘rinishi uchun next/image kerak emas
                <img src={e.url} alt="Tanlangan rasm" className="size-full object-cover" />
              ) : (
                <Image src={e.url} alt="Post rasmi" fill sizes="160px" className="object-cover" unoptimized />
              )}
              <button
                type="button"
                onClick={e.olib}
                disabled={bloklangan}
                aria-label="Rasmni olib tashlash"
                className="absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full bg-ink-950/80 text-fg hover:bg-ink-950"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-fg transition-colors hover:border-gold-400/60 focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2 focus-within:ring-offset-ink-950 aria-disabled:opacity-50">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={bloklangan || jami >= POST_MAKS_RASM}
          className="sr-only"
          onChange={(e) => {
            void tanlandi(e.target.files);
            e.target.value = "";
          }}
        />
        <ImagePlus className="size-4" aria-hidden="true" />
        Rasm qo‘shish
        <span className="text-xs font-semibold text-fg-muted">{jami}/{POST_MAKS_RASM}</span>
      </label>
    </div>
  );
}
