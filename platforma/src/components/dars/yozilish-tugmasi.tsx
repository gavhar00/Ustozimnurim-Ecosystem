"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import { kursgaYozil } from "@/app/dars/amallar";

export function YozilishTugmasi({
  kursId,
  allaqachonYozilgan,
  birinchiDarsHref,
}: {
  kursId: string;
  allaqachonYozilgan: boolean;
  birinchiDarsHref: string | null;
}) {
  const router = useRouter();
  const [yozilgan, setYozilgan] = useState(allaqachonYozilgan);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  if (yozilgan) {
    return birinchiDarsHref ? (
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => router.push(birinchiDarsHref)}
      >
        O&#8216;qishni davom ettirish
        <ArrowRight className="size-4.5" aria-hidden="true" />
      </Button>
    ) : (
      <p className="inline-flex items-center gap-2 text-sm font-bold text-[#9fe4c2]">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Kursga yozilgansiz
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {xato ? <FormXabar>{xato}</FormXabar> : null}
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            setXato(null);
            const natija = await kursgaYozil(kursId);
            if (natija.xato) {
              setXato(natija.xato);
              return;
            }
            setYozilgan(true);
            router.refresh();
          })
        }
      >
        {kutilmoqda ? "Yozilmoqda…" : "Kursga yozilish"}
        <ArrowRight className="size-4.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
