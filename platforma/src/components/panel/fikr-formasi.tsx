"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Label } from "@/components/ui/form";
import { fikrYubor, type FikrNatijasi } from "@/app/panel/fikr-mulohaza/amallar";
import { FIKR_TURLARI } from "@/lib/fikr-turlari";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Send className="size-4" aria-hidden="true" />
      {pending ? "Yuborilmoqda…" : "Yuborish"}
    </Button>
  );
}

export function FikrFormasi() {
  const [holat, amal] = useActionState<FikrNatijasi, FormData>(fikrYubor, {});
  const forma = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (holat.muvaffaqiyat) forma.current?.reset();
  }, [holat.muvaffaqiyat]);

  return (
    <form ref={forma} action={amal} className="surface-card space-y-5 p-6">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar> : null}
      <fieldset>
        <legend className="mb-3 text-sm font-bold">Nima haqida?</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(FIKR_TURLARI).map(([kalit, nom], i) => (
            <label
              key={kalit}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border-subtle px-3 text-sm hover:border-gold-400/60 focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2 focus-within:ring-offset-ink-950"
            >
              <input type="radio" name="turi" value={kalit} defaultChecked={i === 0} className="accent-gold-400" />
              {nom}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="fikr-matn">Fikringiz</Label>
        <textarea
          id="fikr-matn"
          name="matn"
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          className="w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-sm text-fg placeholder:text-muted-soft focus:border-gold-400"
          placeholder="Nimani yaxshilash mumkin? Nima yoqdi? Qayerda xato topdingiz?"
        />
        <p className="mt-1 text-xs text-fg-muted">Fikrni faqat jamoa ko‘radi, saytda e’lon qilinmaydi.</p>
      </div>
      <Tugma />
    </form>
  );
}
