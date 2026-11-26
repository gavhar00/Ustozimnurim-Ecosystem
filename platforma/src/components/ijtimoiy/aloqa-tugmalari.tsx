"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Clock, MessageSquare, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import {
  kuzatishniAlmashtir,
  sorovYubor,
  type IjtimoiyHolati,
} from "@/app/ijtimoiy/amallar";
import type { BoglanishHolati } from "@/lib/data/ijtimoiy";

/** Profil sarlavhasidagi "Kuzatish" va "Bog'lanish" tugmalari. */
export function AloqaTugmalari({
  profilId,
  boshlangichBoglanish,
  boshlangichKuzatyapman,
}: {
  profilId: string;
  boshlangichBoglanish: BoglanishHolati;
  boshlangichKuzatyapman: boolean;
}) {
  const [boglanish, setBoglanish] = useState(boshlangichBoglanish);
  const [kuzatyapman, setKuzatyapman] = useState(boshlangichKuzatyapman);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  if (boglanish === "ozim") return null;

  function amal(ishla: () => Promise<IjtimoiyHolati>) {
    setXato(null);
    startTransition(async () => {
      const natija = await ishla();
      if (natija.xato) setXato(natija.xato);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={kuzatyapman ? "secondary" : "primary"}
          disabled={kutilmoqda}
          onClick={() => {
            const yangi = !kuzatyapman;
            setKuzatyapman(yangi);
            amal(() => kuzatishniAlmashtir(profilId, !yangi));
          }}
        >
          {kuzatyapman ? (
            <>
              <UserMinus className="size-4" aria-hidden="true" />
              Kuzatilmoqda
            </>
          ) : (
            <>
              <UserPlus className="size-4" aria-hidden="true" />
              Kuzatish
            </>
          )}
        </Button>

        {boglanish === "boglangan" ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-[#5fd39b]/40 bg-[#5fd39b]/10 px-4 py-2 text-sm font-bold text-[#9fe4c2]">
              <Check className="size-4" aria-hidden="true" />
              Bog‘langansiz
            </span>
            <Link
              href={`/xabarlar?kim=${profilId}`}
              className="inline-flex items-center gap-1.5 rounded-pill bg-gold-400 px-4 py-2 text-sm font-black text-ink-950 hover:bg-gold-300"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              Xabar yozish
            </Link>
          </>
        ) : boglanish === "men_yubordim" ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-fg-muted">
            <Clock className="size-4" aria-hidden="true" />
            So‘rov yuborilgan
          </span>
        ) : boglanish === "menga_yuborildi" ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-gold-300">
            <Clock className="size-4" aria-hidden="true" />
            Sizga so‘rov yuborgan
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={kutilmoqda}
            onClick={() =>
              amal(async () => {
                const natija = await sorovYubor(profilId);
                if (!natija.xato) setBoglanish("men_yubordim");
                return natija;
              })
            }
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Bog‘lanish
          </Button>
        )}
      </div>

      {xato ? <FormXabar>{xato}</FormXabar> : null}
    </div>
  );
}
