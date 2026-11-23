"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { tadbirHolati, tadbirOchir, tadbirYarat } from "@/app/admin/tadbirlar/amallar";
import type { AdminHolati } from "@/app/admin/amallar";

const maydon =
  "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-sm text-fg placeholder:text-muted-soft focus:border-gold-400";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Yaratilmoqda…" : "Tadbir yaratish"}
    </Button>
  );
}

export function TadbirFormasi() {
  const [holat, amal] = useActionState<AdminHolati, FormData>(tadbirYarat, {});
  return (
    <form action={amal} className="space-y-5">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-nom">Nomi</Label>
          <Input id="t-nom" name="nom" required minLength={3} maxLength={150} />
        </div>
        <div>
          <Label htmlFor="t-joy">Joy (ixtiyoriy)</Label>
          <Input id="t-joy" name="joy" maxLength={150} placeholder="Manzil yoki onlayn havola" />
        </div>
        <div>
          <Label htmlFor="t-vaqt">Boshlanish (Toshkent vaqti)</Label>
          <Input id="t-vaqt" name="boshlanish" type="datetime-local" required />
        </div>
        <div>
          <Label htmlFor="t-sigim">Sig‘im (ixtiyoriy)</Label>
          <Input id="t-sigim" name="sigim" type="number" min={1} placeholder="Cheklovsiz" />
        </div>
      </div>
      <div>
        <Label htmlFor="t-tavsif">Tavsif</Label>
        <textarea id="t-tavsif" name="tavsif" required minLength={10} maxLength={4000} rows={5} className={maydon} />
      </div>
      <Tugma />
    </form>
  );
}

export function TadbirAmallari({ id, holat }: { id: string; holat: string }) {
  const [joriy, setJoriy] = useState(holat);
  const [tasdiq, setTasdiq] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();
  const chop = joriy === "chop_etilgan";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={chop ? "secondary" : "primary"}
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            const yangi = chop ? "qoralama" : "chop_etilgan";
            const n = await tadbirHolati(id, yangi);
            if (n.xato) setXato(n.xato);
            else setJoriy(yangi);
          })
        }
      >
        {chop ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        {chop ? "Qoralamaga" : "Chop etish"}
      </Button>
      {tasdiq ? (
        <>
          <Button
            type="button"
            size="sm"
            disabled={kutilmoqda}
            onClick={() =>
              startTransition(async () => {
                const n = await tadbirOchir(id);
                if (n.xato) setXato(n.xato);
              })
            }
          >
            Ha, o‘chirish
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(false)}>
            Bekor qilish
          </Button>
        </>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(true)}>
          <Trash2 className="size-4" aria-hidden="true" />
          O‘chirish
        </Button>
      )}
      {xato ? <span className="text-sm text-[#ffb3ad]">{xato}</span> : null}
    </div>
  );
}
