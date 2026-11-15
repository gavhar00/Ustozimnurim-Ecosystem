"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Label } from "@/components/ui/form";
import { javobYoz, type HamjamiyatHolati } from "@/app/hamjamiyat/amallar";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Send className="size-4" aria-hidden="true" />
      {pending ? "Yuborilmoqda…" : "Javob yuborish"}
    </Button>
  );
}

export function JavobFormasi({ munozaraId }: { munozaraId: string }) {
  const forma = useRef<HTMLFormElement>(null);
  const amalBilan = javobYoz.bind(null, munozaraId);
  const [holat, amal] = useActionState<HamjamiyatHolati, FormData>(
    async (oldingi, formData) => {
      const natija = await amalBilan(oldingi, formData);
      if (!natija.xato) forma.current?.reset();
      return natija;
    },
    {},
  );

  return (
    <form ref={forma} action={amal} className="surface-card space-y-4 p-6">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}

      <div>
        <Label htmlFor="javob-matn">Javobingiz</Label>
        <textarea
          id="javob-matn"
          name="matn"
          required
          minLength={2}
          rows={5}
          placeholder="Bilganingizni ulashing…"
          className="w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg placeholder:text-muted-soft"
        />
      </div>

      <Tugma />
    </form>
  );
}
