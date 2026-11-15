"use client";

import { useState, useTransition } from "react";
import { Check, Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import { loyihagaSorovYubor } from "@/app/ijtimoiy/amallar";
import type { AzolikHolati } from "@/lib/data/ijtimoiy";

/** Loyihaga qo'shilish so'rovini yuborish. */
export function QoshilishTugmasi({
  loyihaId,
  boshlangichHolat,
}: {
  loyihaId: string;
  boshlangichHolat: AzolikHolati;
}) {
  const [holat, setHolat] = useState<AzolikHolati>(boshlangichHolat);
  const [ochiq, setOchiq] = useState(false);
  const [xabar, setXabar] = useState("");
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  if (holat === "ega") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-gold-300">
        Loyiha egasi
      </span>
    );
  }

  if (holat === "azo") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-[#5fd39b]/40 bg-[#5fd39b]/10 px-4 py-2 text-sm font-bold text-[#9fe4c2]">
        <Check className="size-4" aria-hidden="true" />
        Jamoadasiz
      </span>
    );
  }

  if (holat === "sorov_yuborilgan") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-fg-muted">
        <Clock className="size-4" aria-hidden="true" />
        So‘rov yuborilgan
      </span>
    );
  }

  if (!ochiq) {
    return (
      <Button type="button" onClick={() => setOchiq(true)}>
        <UserPlus className="size-4" aria-hidden="true" />
        Jamoaga qo‘shilish
      </Button>
    );
  }

  return (
    <div className="surface-card w-full max-w-md space-y-4 p-5">
      {xato ? <FormXabar>{xato}</FormXabar> : null}

      <div>
        <label
          htmlFor="qoshilish-xabar"
          className="mb-2 block text-sm font-bold text-champagne"
        >
          Nima bilan yordam bera olasiz?
        </label>
        <textarea
          id="qoshilish-xabar"
          value={xabar}
          onChange={(e) => setXabar(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Masalan: frontend qismida yordam bera olaman"
          className="w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg placeholder:text-muted-soft"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={kutilmoqda}
          onClick={() =>
            startTransition(async () => {
              setXato(null);
              const natija = await loyihagaSorovYubor(loyihaId, xabar);
              if (natija.xato) {
                setXato(natija.xato);
                return;
              }
              setHolat("sorov_yuborilgan");
              setOchiq(false);
            })
          }
        >
          {kutilmoqda ? "Yuborilmoqda…" : "So‘rov yuborish"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOchiq(false)}
          disabled={kutilmoqda}
        >
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}
