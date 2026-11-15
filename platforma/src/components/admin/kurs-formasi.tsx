"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { kursYarat, type AdminHolati } from "@/app/admin/amallar";

const DARAJALAR = [
  { qiymat: "boshlangich", nom: "Boshlang‘ich" },
  { qiymat: "orta", nom: "O‘rta" },
  { qiymat: "yuqori", nom: "Yuqori" },
];

const selectUslubi =
  "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Yaratilmoqda…" : "Kurs yaratish"}
    </Button>
  );
}

export function KursFormasi({
  yonalishlar,
}: {
  yonalishlar: { slug: string; nom: string }[];
}) {
  const [holat, amal] = useActionState<AdminHolati, FormData>(kursYarat, {});

  return (
    <form action={amal} className="surface-card space-y-5 p-6">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? (
        <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar>
      ) : null}

      <div>
        <Label htmlFor="nom">Kurs nomi</Label>
        <Input id="nom" name="nom" required minLength={3} placeholder="Masalan: JavaScript asoslari" />
      </div>

      <div>
        <Label htmlFor="qisqa_tavsif">Qisqa tavsif</Label>
        <Input
          id="qisqa_tavsif"
          name="qisqa_tavsif"
          required
          minLength={10}
          placeholder="Bir jumlada kurs nima haqida"
        />
      </div>

      <div>
        <Label htmlFor="tavsif">To‘liq tavsif</Label>
        <textarea
          id="tavsif"
          name="tavsif"
          rows={4}
          placeholder="Kurs haqida batafsil (ixtiyoriy)"
          className="w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] text-fg placeholder:text-muted-soft"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="daraja">Daraja</Label>
          <select id="daraja" name="daraja" className={selectUslubi}>
            {DARAJALAR.map((d) => (
              <option key={d.qiymat} value={d.qiymat}>
                {d.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="yonalish_slug">Yo‘nalish</Label>
          <select id="yonalish_slug" name="yonalish_slug" className={selectUslubi}>
            <option value="">Tanlanmagan</option>
            {yonalishlar.map((y) => (
              <option key={y.slug} value={y.slug}>
                {y.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="ustoz_ismi">Ustoz ismi</Label>
        <Input id="ustoz_ismi" name="ustoz_ismi" placeholder="Ixtiyoriy" />
      </div>

      <Tugma />
    </form>
  );
}
