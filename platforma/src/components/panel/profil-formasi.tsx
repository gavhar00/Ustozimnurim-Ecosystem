"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import {
  profilniYangila,
  type ProfilHolati,
} from "@/app/panel/profil/amallar";
import { KASBLAR, QIZIQISHLAR, type ToliqProfil } from "@/lib/turlar";

const selectUslubi =
  "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg";
const textareaUslubi =
  "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg placeholder:text-muted-soft";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda…" : "Saqlash"}
    </Button>
  );
}

export function ProfilFormasi({
  profil,
  email,
}: {
  profil: ToliqProfil;
  email: string | null;
}) {
  const [holat, amal] = useActionState<ProfilHolati, FormData>(
    profilniYangila,
    {},
  );

  return (
    <form action={amal} className="surface-card space-y-6 p-6" id="asosiy">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? (
        <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="toliq_ism">To‘liq ism</Label>
          <Input
            id="toliq_ism"
            name="toliq_ism"
            required
            minLength={2}
            maxLength={80}
            defaultValue={profil.toliq_ism}
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="username">Foydalanuvchi nomi</Label>
          <Input
            id="username"
            name="username"
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            defaultValue={profil.username ?? ""}
            placeholder="masalan: habibulloh"
            aria-describedby="username-izoh"
          />
          <p id="username-izoh" className="mt-2 text-xs text-fg-muted">
            Profilingiz manzili:{" "}
            <span className="font-mono text-champagne">
              /profil/{profil.username || "nomingiz"}
            </span>
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Qisqa tanishtiruv</Label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={profil.bio ?? ""}
          placeholder="O‘zingiz haqingizda bir-ikki jumla"
          className={textareaUslubi}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="kasb">Hozirgi roli</Label>
          <select
            id="kasb"
            name="kasb"
            defaultValue={profil.kasb ?? ""}
            className={selectUslubi}
          >
            <option value="">Tanlanmagan</option>
            {KASBLAR.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="joylashuv">Joylashuv</Label>
          <Input
            id="joylashuv"
            name="joylashuv"
            maxLength={100}
            defaultValue={profil.joylashuv ?? ""}
            placeholder="Toshkent, O‘zbekiston"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="talim">Ta’lim</Label>
        <Input
          id="talim"
          name="talim"
          maxLength={150}
          defaultValue={profil.talim ?? ""}
          placeholder="Masalan: TATU, Dasturiy injiniring"
        />
      </div>

      <div>
        <Label htmlFor="tillar">Tillar</Label>
        <Input
          id="tillar"
          name="tillar"
          maxLength={200}
          defaultValue={profil.tillar.join(", ")}
          placeholder="O‘zbek, Rus, Ingliz"
          aria-describedby="tillar-izoh"
        />
        <p id="tillar-izoh" className="mt-2 text-xs text-fg-muted">
          Vergul bilan ajrating.
        </p>
      </div>

      <div>
        <Label htmlFor="maqsad">Maqsadingiz</Label>
        <textarea
          id="maqsad"
          name="maqsad"
          rows={3}
          maxLength={400}
          defaultValue={profil.maqsad ?? ""}
          placeholder="Nimani o‘rganmoqchisiz, qayerga intilyapsiz?"
          className={textareaUslubi}
        />
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-champagne">
          Qiziqishlar
        </legend>
        <div className="flex flex-wrap gap-2">
          {QIZIQISHLAR.map((q) => (
            <label
              key={q}
              className="cursor-pointer rounded-pill border border-border-subtle px-4 py-2 text-sm font-semibold text-fg-muted transition-colors has-checked:border-gold-400/60 has-checked:bg-gold-400/15 has-checked:text-gold-200 focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2 focus-within:ring-offset-ink-950"
            >
              <input
                type="checkbox"
                name="qiziqishlar"
                value={q}
                defaultChecked={profil.qiziqishlar.includes(q)}
                className="sr-only"
              />
              {q}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl border border-border-subtle bg-ink-850/60 p-4">
        <input
          type="checkbox"
          name="hamkorlikka_ochiq"
          defaultChecked={profil.hamkorlikka_ochiq}
          className="mt-0.5 size-4 accent-[var(--color-gold-400)]"
        />
        <span>
          <span className="block text-sm font-bold text-fg">
            Hamkorlikka ochiqman
          </span>
          <span className="mt-0.5 block text-xs text-fg-muted">
            Loyihalarga jamoadosh qidirayotganlar sizni topa oladi.
          </span>
        </span>
      </label>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email ?? ""} disabled readOnly />
        <p className="mt-2 text-xs text-fg-muted">
          Email manzilini hozircha o‘zgartirib bo‘lmaydi.
        </p>
      </div>

      <Tugma />
    </form>
  );
}
