"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import {
  munozaraYarat,
  type HamjamiyatHolati,
} from "@/app/hamjamiyat/amallar";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Yuborilmoqda…" : "Munozarani ochish"}
    </Button>
  );
}

export function MunozaraFormasi({ turkumlar }: { turkumlar: string[] }) {
  const [holat, amal] = useActionState<HamjamiyatHolati, FormData>(
    munozaraYarat,
    {},
  );

  return (
    <form action={amal} className="surface-card space-y-5 p-6">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}

      <div>
        <Label htmlFor="sarlavha">Sarlavha</Label>
        <Input
          id="sarlavha"
          name="sarlavha"
          required
          minLength={8}
          maxLength={200}
          placeholder="Savolingizni bir jumlada yozing"
        />
      </div>

      <div>
        <Label htmlFor="turkum">Turkum</Label>
        <select
          id="turkum"
          name="turkum"
          className="h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg"
        >
          {turkumlar.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="matn">Batafsil</Label>
        <textarea
          id="matn"
          name="matn"
          required
          minLength={15}
          rows={8}
          placeholder="Nimani sinab ko‘rdingiz, qayerda to‘xtab qoldingiz? Kod bo‘lsa, shu yerga qo‘ying."
          className="w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg placeholder:text-muted-soft"
        />
      </div>

      <Tugma />
    </form>
  );
}
