"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilKartasi } from "@/components/ijtimoiy/profil-kartasi";
import { loyihaSoroviganJavob } from "@/app/ijtimoiy/amallar";
import type { LoyihaSorovi } from "@/lib/data/ijtimoiy";

/** Loyihaga kelgan qo'shilish so'rovlari. */
export function LoyihaSorovlari({ sorovlar }: { sorovlar: LoyihaSorovi[] }) {
  if (sorovlar.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border-subtle pt-4">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-gold-300">
        Qo‘shilish so‘rovlari ({sorovlar.length})
      </h4>
      <ul className="mt-3 space-y-3">
        {sorovlar.map((sorov) => (
          <SorovQatori key={sorov.id} sorov={sorov} />
        ))}
      </ul>
    </div>
  );
}

function SorovQatori({ sorov }: { sorov: LoyihaSorovi }) {
  const [kutilmoqda, startTransition] = useTransition();

  function javob(qiymat: "qabul" | "rad") {
    startTransition(async () => {
      await loyihaSoroviganJavob(sorov.id, qiymat);
    });
  }

  return (
    <li>
      <ul>
        <ProfilKartasi
          profil={sorov.profil}
          amal={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={kutilmoqda}
                onClick={() => javob("qabul")}
              >
                <Check className="size-4" aria-hidden="true" />
                Qabul
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={kutilmoqda}
                onClick={() => javob("rad")}
              >
                <X className="size-4" aria-hidden="true" />
                Rad
              </Button>
            </div>
          }
        />
      </ul>
      {sorov.xabar ? (
        <p className="mt-2 rounded-xl border border-border-subtle bg-ink-850/60 px-4 py-3 text-sm leading-relaxed text-fg-muted">
          {sorov.xabar}
        </p>
      ) : null}
    </li>
  );
}
