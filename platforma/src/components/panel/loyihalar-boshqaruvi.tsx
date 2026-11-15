"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Code2 as Github, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import {
  loyihaOchir,
  loyihaQosh,
  type LoyihaHolatiNatija,
} from "@/app/panel/loyihalar-amallari";
import { LoyihaSorovlari } from "@/components/panel/loyiha-sorovlari";
import type { LoyihaAzosi, LoyihaSorovi } from "@/lib/data/ijtimoiy";
import { LOYIHA_HOLATI_NOMI, type Loyiha, type LoyihaHolati } from "@/lib/turlar";

const selectUslubi =
  "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg";
const textareaUslubi =
  "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg placeholder:text-muted-soft";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="size-4" aria-hidden="true" />
      {pending ? "Qo‘shilmoqda…" : "Loyihani qo‘shish"}
    </Button>
  );
}

export function LoyihalarBoshqaruvi({
  loyihalar,
  azolar = {},
  sorovlar = [],
}: {
  loyihalar: Loyiha[];
  azolar?: Record<string, LoyihaAzosi[]>;
  sorovlar?: LoyihaSorovi[];
}) {
  const [holat, amal] = useActionState<LoyihaHolatiNatija, FormData>(
    loyihaQosh,
    {},
  );
  const [ochirilayotgan, setOchirilayotgan] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      {loyihalar.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {loyihalar.map((loyiha) => (
            <li key={loyiha.id} className="surface-card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-extrabold text-fg">{loyiha.nom}</h3>
                <span className="shrink-0 rounded-pill border border-border-strong px-3 py-1 text-xs font-bold text-gold-300">
                  {LOYIHA_HOLATI_NOMI[loyiha.holat]}
                </span>
              </div>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
                {loyiha.tavsif}
              </p>

              {(azolar[loyiha.id] ?? []).length > 0 ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-fg-muted">Jamoa:</span>
                  <ul className="flex -space-x-2">
                    {(azolar[loyiha.id] ?? []).slice(0, 5).map((azo) => (
                      <li
                        key={azo.id}
                        title={azo.toliq_ism}
                        className="inline-flex size-7 items-center justify-center rounded-full bg-gold-400/20 text-[0.65rem] font-black text-gold-200 ring-2 ring-bg-card"
                      >
                        {azo.toliq_ism.trim().charAt(0).toUpperCase()}
                      </li>
                    ))}
                  </ul>
                  <span className="text-xs text-fg-muted">
                    {(azolar[loyiha.id] ?? []).length} kishi
                  </span>
                </div>
              ) : null}

              {loyiha.texnologiyalar.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {loyiha.texnologiyalar.map((t) => (
                    <li
                      key={t}
                      className="rounded-md bg-ink-700/70 px-2 py-1 font-mono text-xs text-champagne"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 flex items-center gap-3 border-t border-border-subtle pt-3">
                {loyiha.github_url ? (
                  <a
                    href={loyiha.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-gold-300"
                  >
                    <Github className="size-3.5" aria-hidden="true" />
                    Kod
                  </a>
                ) : null}
                {loyiha.demo_url ? (
                  <a
                    href={loyiha.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-gold-300"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    Demo
                  </a>
                ) : null}

                <button
                  type="button"
                  disabled={kutilmoqda}
                  onClick={() => {
                    if (ochirilayotgan === loyiha.id) {
                      startTransition(async () => {
                        await loyihaOchir(loyiha.id);
                        setOchirilayotgan(null);
                      });
                    } else {
                      setOchirilayotgan(loyiha.id);
                    }
                  }}
                  onBlur={() => setOchirilayotgan(null)}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted transition-colors hover:text-[#ffb3ad]"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  {ochirilayotgan === loyiha.id ? "Tasdiqlang" : "O‘chirish"}
                </button>
              </div>

              <LoyihaSorovlari
                sorovlar={sorovlar.filter((s) => s.loyiha_id === loyiha.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <form action={amal} className="surface-card space-y-5 p-6">
        <h2 className="text-lg font-extrabold">Yangi loyiha</h2>

        {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
        {holat.muvaffaqiyat ? (
          <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar>
        ) : null}

        <div>
          <Label htmlFor="loyiha-nom">Loyiha nomi</Label>
          <Input
            id="loyiha-nom"
            name="nom"
            required
            minLength={3}
            maxLength={80}
            placeholder="Masalan: Kitob javoni"
          />
        </div>

        <div>
          <Label htmlFor="loyiha-tavsif">Tavsif</Label>
          <textarea
            id="loyiha-tavsif"
            name="tavsif"
            required
            minLength={10}
            rows={4}
            maxLength={1000}
            placeholder="Loyiha nima qiladi, qanday muammoni hal qiladi?"
            className={textareaUslubi}
          />
        </div>

        <div>
          <Label htmlFor="loyiha-tex">Texnologiyalar</Label>
          <Input
            id="loyiha-tex"
            name="texnologiyalar"
            maxLength={200}
            placeholder="React, TypeScript, Supabase"
            aria-describedby="tex-izoh"
          />
          <p id="tex-izoh" className="mt-2 text-xs text-fg-muted">
            Vergul bilan ajrating.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="loyiha-turkum">Turkum</Label>
            <Input
              id="loyiha-turkum"
              name="turkum"
              maxLength={40}
              placeholder="Veb ilova"
            />
          </div>

          <div>
            <Label htmlFor="loyiha-holat">Holat</Label>
            <select
              id="loyiha-holat"
              name="holat"
              defaultValue="jarayonda"
              className={selectUslubi}
            >
              {(Object.keys(LOYIHA_HOLATI_NOMI) as LoyihaHolati[]).map((h) => (
                <option key={h} value={h}>
                  {LOYIHA_HOLATI_NOMI[h]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="loyiha-github">GitHub havolasi</Label>
            <Input
              id="loyiha-github"
              name="github_url"
              maxLength={200}
              placeholder="github.com/ism/loyiha"
            />
          </div>

          <div>
            <Label htmlFor="loyiha-demo">Demo havolasi</Label>
            <Input
              id="loyiha-demo"
              name="demo_url"
              maxLength={200}
              placeholder="loyiha.vercel.app"
            />
          </div>
        </div>

        <Tugma />
      </form>
    </div>
  );
}
