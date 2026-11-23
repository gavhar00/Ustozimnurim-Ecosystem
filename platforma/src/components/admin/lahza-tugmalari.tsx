"use client";

import { useState, useTransition } from "react";
import { Check, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lahzaHolati } from "@/app/admin/lahzalar/amallar";

export function LahzaTugmalari({ id, holat }: { id: string; holat: string }) {
  const [joriy, setJoriy] = useState(holat);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  function ozgartir(yangi: "tasdiqlangan" | "rad" | "kutilmoqda") {
    startTransition(async () => {
      const n = await lahzaHolati(id, yangi);
      if (n.xato) setXato(n.xato);
      else setJoriy(yangi);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {joriy !== "tasdiqlangan" ? (
        <Button type="button" size="sm" disabled={kutilmoqda} onClick={() => ozgartir("tasdiqlangan")}>
          <Check className="size-4" aria-hidden="true" />
          Tasdiqlash
        </Button>
      ) : null}
      {joriy !== "rad" ? (
        <Button type="button" size="sm" variant="secondary" disabled={kutilmoqda} onClick={() => ozgartir("rad")}>
          <X className="size-4" aria-hidden="true" />
          Rad etish
        </Button>
      ) : null}
      {joriy !== "kutilmoqda" ? (
        <Button type="button" size="sm" variant="secondary" disabled={kutilmoqda} onClick={() => ozgartir("kutilmoqda")}>
          <Undo2 className="size-4" aria-hidden="true" />
          Tekshiruvga qaytarish
        </Button>
      ) : null}
      {xato ? <span className="text-sm text-[#ffb3ad]">{xato}</span> : null}
    </div>
  );
}
