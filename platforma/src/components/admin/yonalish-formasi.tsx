"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { yonalishOchir, yonalishSaqla } from "@/app/admin/yonalishlar/amallar";
import type { AdminHolati } from "@/app/admin/amallar";
import type { Yonalish } from "@/lib/data/yonalishlar";
import { YONALISH_IKONALARI } from "@/lib/yonalish-ikonalari";

const selectUslubi =
  "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg";

function Tugma({ matn }: { matn: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda…" : matn}
    </Button>
  );
}

/** Yo‘nalish yaratish (yonalish yo‘q) yoki tahrirlash formasi. */
export function YonalishFormasi({ yonalish }: { yonalish?: Yonalish }) {
  const [holat, amal] = useActionState<AdminHolati, FormData>(yonalishSaqla, {});
  const tahrir = Boolean(yonalish);

  return (
    <form action={amal} className="space-y-5">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? (
        <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar>
      ) : null}
      {yonalish ? <input type="hidden" name="eski_slug" value={yonalish.slug} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={`nom-${yonalish?.slug ?? "yangi"}`}>Nomi</Label>
          <Input
            id={`nom-${yonalish?.slug ?? "yangi"}`}
            name="nom"
            required
            minLength={3}
            defaultValue={yonalish?.nom}
            placeholder="Masalan: Kiberxavfsizlik"
          />
        </div>
        {tahrir ? null : (
          <div>
            <Label htmlFor="slug-yangi">Slug (havola)</Label>
            <Input
              id="slug-yangi"
              name="slug"
              placeholder="Bo‘sh qoldirsangiz nomdan yasaladi"
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor={`tavsif-${yonalish?.slug ?? "yangi"}`}>Tavsif</Label>
        <Input
          id={`tavsif-${yonalish?.slug ?? "yangi"}`}
          name="tavsif"
          required
          minLength={10}
          defaultValue={yonalish?.tavsif}
          placeholder="Bir-ikki jumlada yo‘nalish nima haqida"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor={`ikona-${yonalish?.slug ?? "yangi"}`}>Ikona</Label>
          <select
            id={`ikona-${yonalish?.slug ?? "yangi"}`}
            name="ikona"
            defaultValue={yonalish?.ikona ?? "code"}
            className={selectUslubi}
          >
            {Object.entries(YONALISH_IKONALARI).map(([kalit, { nom }]) => (
              <option key={kalit} value={kalit}>
                {nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor={`tartib-${yonalish?.slug ?? "yangi"}`}>Tartib raqami</Label>
          <Input
            id={`tartib-${yonalish?.slug ?? "yangi"}`}
            name="tartib"
            type="number"
            min={0}
            max={99}
            defaultValue={yonalish?.tartib ?? 0}
          />
        </div>
        <label className="flex items-end gap-3 pb-3 text-sm font-bold text-champagne">
          <input
            type="checkbox"
            name="faol"
            defaultChecked={yonalish?.faol ?? false}
            className="size-5 accent-[#e5b454]"
          />
          Saytda ko‘rinsin
        </label>
      </div>

      <Tugma matn={tahrir ? "Saqlash" : "Yo‘nalish yaratish"} />
    </form>
  );
}

/** O‘chirish — ikki bosqichli tasdiq bilan. */
export function YonalishOchirish({ slug, nom }: { slug: string; nom: string }) {
  const [tasdiq, setTasdiq] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  if (!tasdiq) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        O‘chirish
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="alert">
      <span className="text-sm text-fg-muted">“{nom}” o‘chirilsinmi?</span>
      <Button
        type="button"
        size="sm"
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            const natija = await yonalishOchir(slug);
            if (natija.xato) setXato(natija.xato);
          })
        }
      >
        {kutilmoqda ? "O‘chirilmoqda…" : "Ha, o‘chirish"}
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(false)}>
        Bekor qilish
      </Button>
      {xato ? <span className="text-sm text-[#ffb3ad]">{xato}</span> : null}
    </div>
  );
}
