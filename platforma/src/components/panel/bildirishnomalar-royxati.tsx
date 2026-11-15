"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  barchasiniOqilganDebBelgila,
  oqilganDebBelgila,
} from "@/app/panel/bildirishnomalar/amallar";
import type {
  Bildirishnoma,
  BildirishnomaTuri,
} from "@/lib/data/bildirishnomalar";
import { cn } from "@/lib/utils";

const IKONA: Record<BildirishnomaTuri, typeof Bell> = {
  boglanish_sorovi: UserPlus,
  sorov_qabul: Check,
  yangi_kuzatuvchi: UserPlus,
  post_yoqtirildi: Heart,
  javob_yozildi: MessageCircle,
};

function sana(iso: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function BildirishnomalarRoyxati({
  royxat,
}: {
  royxat: Bildirishnoma[];
}) {
  const [kutilmoqda, startTransition] = useTransition();
  const oqilmagan = royxat.filter((b) => !b.oqilgan).length;

  if (royxat.length === 0) {
    return (
      <EmptyState
        ikona={<Bell className="size-7" aria-hidden="true" />}
        sarlavha="Hozircha bildirishnoma yo‘q"
        izoh="Kimdir sizni kuzatsa, so‘rov yuborsa yoki postingizni yoqtirsa, shu yerda ko‘rinadi."
      />
    );
  }

  return (
    <div>
      {oqilmagan > 0 ? (
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={kutilmoqda}
            onClick={() =>
              startTransition(async () => {
                await barchasiniOqilganDebBelgila();
              })
            }
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Barchasini o‘qilgan deb belgilash
          </Button>
        </div>
      ) : null}

      <ul className="space-y-3">
        {royxat.map((b) => {
          const Ikona = IKONA[b.turi] ?? Bell;

          const ichki = (
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
                  b.oqilgan
                    ? "bg-ink-700/70 text-fg-muted"
                    : "bg-gold-400/15 text-gold-300",
                )}
              >
                <Ikona className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "leading-relaxed",
                    b.oqilgan ? "text-fg-muted" : "font-semibold text-fg",
                  )}
                >
                  {b.matn}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  {sana(b.yaratilgan)}
                </p>
              </div>
            </div>
          );

          return (
            <li
              key={b.id}
              className={cn(
                "surface-card flex items-center justify-between gap-4 p-4",
                !b.oqilgan && "border-border-strong",
              )}
            >
              {b.havola ? (
                <Link
                  href={b.havola}
                  className="min-w-0 flex-1"
                  onClick={() => {
                    if (!b.oqilgan) {
                      startTransition(async () => {
                        await oqilganDebBelgila(b.id);
                      });
                    }
                  }}
                >
                  {ichki}
                </Link>
              ) : (
                <div className="min-w-0 flex-1">{ichki}</div>
              )}

              {!b.oqilgan ? (
                <button
                  type="button"
                  disabled={kutilmoqda}
                  aria-label="O‘qilgan deb belgilash"
                  onClick={() =>
                    startTransition(async () => {
                      await oqilganDebBelgila(b.id);
                    })
                  }
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-gold-400/10 hover:text-gold-300"
                >
                  <Check className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
