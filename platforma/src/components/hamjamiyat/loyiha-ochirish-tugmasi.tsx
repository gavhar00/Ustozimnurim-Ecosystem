"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { loyihaOchir } from "@/app/panel/loyihalar-amallari";

export function LoyihaOchirishTugmasi({ loyihaId }: { loyihaId: string }) {
  const [tasdiq, setTasdiq] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();
  const router = useRouter();

  function ochirish() {
    if (!tasdiq) {
      setTasdiq(true);
      return;
    }
    startTransition(async () => {
      const natija = await loyihaOchir(loyihaId);
      if (natija.xato) {
        setXato(natija.xato);
        setTasdiq(false);
        return;
      }
      router.push("/hamjamiyat/loyihalar");
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={kutilmoqda}
        onClick={ochirish}
        onBlur={() => setTasdiq(false)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-subtle px-4 text-sm font-bold text-fg-muted hover:border-[#ff8c82] hover:text-[#ffb3ad] disabled:opacity-60"
      >
        {kutilmoqda ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
        {kutilmoqda ? "O‘chirilmoqda…" : tasdiq ? "O‘chirishni tasdiqlang" : "Loyihani o‘chirish"}
      </button>
      {xato ? <p className="mt-2 text-sm text-[#ffb3ad]" role="alert">{xato}</p> : null}
    </div>
  );
}
