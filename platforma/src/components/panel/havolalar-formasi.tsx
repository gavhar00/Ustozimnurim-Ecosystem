"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import {
  havolalarniYangila,
  type ProfilHolati,
} from "@/app/panel/profil/amallar";
import type { Havolalar } from "@/lib/turlar";

const MAYDONLAR = [
  { kalit: "github", nom: "GitHub", joy: "github.com/ismingiz" },
  { kalit: "telegram", nom: "Telegram", joy: "t.me/ismingiz" },
  { kalit: "linkedin", nom: "LinkedIn", joy: "linkedin.com/in/ismingiz" },
  { kalit: "portfolio", nom: "Portfolio yoki sayt", joy: "sizningsayt.uz" },
] as const;

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda…" : "Havolalarni saqlash"}
    </Button>
  );
}

export function HavolalarFormasi({ havolalar }: { havolalar: Havolalar }) {
  const [holat, amal] = useActionState<ProfilHolati, FormData>(
    havolalarniYangila,
    {},
  );

  return (
    <form action={amal} className="surface-card space-y-5 p-6" id="havolalar">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? (
        <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar>
      ) : null}

      {MAYDONLAR.map((m) => (
        <div key={m.kalit}>
          <Label htmlFor={m.kalit}>{m.nom}</Label>
          <Input
            id={m.kalit}
            name={m.kalit}
            maxLength={200}
            defaultValue={havolalar[m.kalit] ?? ""}
            placeholder={m.joy}
          />
        </div>
      ))}

      <Tugma />
    </form>
  );
}
