"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  boglanishniOchir,
  sorovgaJavob,
} from "@/app/ijtimoiy/amallar";

/** Kelgan so'rovni qabul qilish yoki rad etish. */
export function JavobTugmalari({ sorovId }: { sorovId: string }) {
  const [kutilmoqda, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        type="button"
        size="sm"
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            await sorovgaJavob(sorovId, "qabul");
          })
        }
      >
        <Check className="size-4" aria-hidden="true" />
        Qabul qilish
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            await sorovgaJavob(sorovId, "rad");
          })
        }
      >
        <X className="size-4" aria-hidden="true" />
        Rad etish
      </Button>
    </div>
  );
}

/** Yuborilgan so'rovni bekor qilish. */
export function BekorTugmasi({ sorovId }: { sorovId: string }) {
  const [kutilmoqda, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={kutilmoqda}
      onClick={() =>
        startTransition(async () => {
          await boglanishniOchir(sorovId);
        })
      }
    >
      <X className="size-4" aria-hidden="true" />
      Bekor qilish
    </Button>
  );
}
