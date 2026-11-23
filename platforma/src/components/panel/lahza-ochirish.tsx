"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lahzaniOchir } from "@/app/panel/lahzalarim/amallar";

export function LahzaOchirish({ id }: { id: string }) {
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
      <Button
        type="button"
        size="sm"
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            const n = await lahzaniOchir(id);
            if (n.xato) setXato(n.xato);
          })
        }
      >
        Ha, o‘chirish
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(false)}>
        Bekor qilish
      </Button>
      {xato ? <span className="text-sm text-[#ffb3ad]">{xato}</span> : null}
    </div>
  );
}
