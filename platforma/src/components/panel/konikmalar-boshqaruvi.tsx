"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import {
  konikmaOchir,
  konikmaQosh,
  type ProfilHolati,
} from "@/app/panel/profil/amallar";
import {
  DARAJA_NOMI,
  KONIKMA_TURKUMI_NOMI,
  type Konikma,
  type KonikmaTurkumi,
} from "@/lib/turlar";

const selectUslubi =
  "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="size-4" aria-hidden="true" />
      {pending ? "Qo‘shilmoqda…" : "Qo‘shish"}
    </Button>
  );
}

export function KonikmalarBoshqaruvi({
  konikmalar,
}: {
  konikmalar: Konikma[];
}) {
  const [holat, amal] = useActionState<ProfilHolati, FormData>(konikmaQosh, {});
  const [kutilmoqda, startTransition] = useTransition();

  const turkumlar = Object.keys(KONIKMA_TURKUMI_NOMI) as KonikmaTurkumi[];

  return (
    <div className="surface-card space-y-6 p-6" id="konikmalar">
      {konikmalar.length === 0 ? (
        <p className="text-sm text-fg-muted">
          Hali ko‘nikma qo‘shilmagan. Birinchisini quyida qo‘shing.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {konikmalar.map((k) => (
            <li
              key={k.id}
              className="inline-flex items-center gap-2 rounded-pill border border-border-strong bg-gold-400/8 py-2 pl-4 pr-2 text-sm"
            >
              <span className="font-bold text-fg">{k.nom}</span>
              <span className="text-xs text-fg-muted">
                {DARAJA_NOMI[k.daraja]}
              </span>
              <button
                type="button"
                disabled={kutilmoqda}
                aria-label={`${k.nom} ko‘nikmasini o‘chirish`}
                onClick={() =>
                  startTransition(async () => {
                    await konikmaOchir(k.id);
                  })
                }
                className="inline-flex size-6 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-[#ff8f87]/15 hover:text-[#ffb3ad]"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={amal} className="space-y-4 border-t border-border-subtle pt-5">
        {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label htmlFor="konikma-nom">Ko‘nikma</Label>
            <Input
              id="konikma-nom"
              name="nom"
              required
              minLength={2}
              maxLength={40}
              placeholder="JavaScript"
            />
          </div>

          <div>
            <Label htmlFor="konikma-turkum">Turkum</Label>
            <select id="konikma-turkum" name="turkum" className={selectUslubi}>
              {turkumlar.map((t) => (
                <option key={t} value={t}>
                  {KONIKMA_TURKUMI_NOMI[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="konikma-daraja">Daraja</Label>
            <select id="konikma-daraja" name="daraja" className={selectUslubi}>
              {(["boshlangich", "orta", "yuqori"] as const).map((d) => (
                <option key={d} value={d}>
                  {DARAJA_NOMI[d]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Tugma />
      </form>
    </div>
  );
}
