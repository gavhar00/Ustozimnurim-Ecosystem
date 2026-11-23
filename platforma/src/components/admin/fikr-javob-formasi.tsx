"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import { fikrniYangila } from "@/app/admin/fikrlar/amallar";
import type { AdminHolati } from "@/app/admin/amallar";
import type { Fikr } from "@/lib/data/fikrlar";
import { FIKR_HOLATLARI } from "@/lib/fikr-turlari";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saqlanmoqda…" : "Saqlash"}
    </Button>
  );
}

export function FikrJavobFormasi({ fikr }: { fikr: Fikr }) {
  const [holat, amal] = useActionState<AdminHolati, FormData>(fikrniYangila, {});
  return (
    <form action={amal} className="mt-4 space-y-3">
      <input type="hidden" name="id" value={fikr.id} />
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar> : null}
      <textarea
        name="javob"
        rows={3}
        maxLength={1000}
        defaultValue={fikr.admin_javobi ?? ""}
        aria-label="Javob"
        placeholder="O‘quvchiga javob (ixtiyoriy)"
        className="w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-sm text-fg placeholder:text-muted-soft focus:border-gold-400"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select
          name="holat"
          defaultValue={fikr.holat}
          aria-label="Holat"
          className="h-10 rounded-xl border border-border-subtle bg-ink-850/70 px-3 text-sm text-fg"
        >
          {Object.entries(FIKR_HOLATLARI).map(([k, nom]) => (
            <option key={k} value={k}>{nom}</option>
          ))}
        </select>
        <Tugma />
      </div>
    </form>
  );
}
