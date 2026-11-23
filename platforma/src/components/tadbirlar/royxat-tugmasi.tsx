"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, CalendarX } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { royxatdanChiqish, royxatdanOtish } from "@/app/tadbirlar/amallar";

/** Tadbirga yozilish / bekor qilish. `yozilgan === null` — foydalanuvchi kirmagan. */
export function RoyxatTugmasi({
  tadbirId,
  slug,
  yozilgan,
  joyYoq,
}: {
  tadbirId: string;
  slug: string;
  yozilgan: boolean | null;
  joyYoq: boolean;
}) {
  const [holat, setHolat] = useState(Boolean(yozilgan));
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  if (yozilgan === null) {
    return (
      <ButtonLink href={`/kirish?keyin=${encodeURIComponent(`/tadbirlar/${slug}`)}`}>
        Yozilish uchun kiring
      </ButtonLink>
    );
  }

  if (!holat && joyYoq) {
    return <p className="text-sm font-bold text-fg-muted">Joylar tugagan.</p>;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={holat ? "secondary" : "primary"}
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            setXato(null);
            const natija = holat
              ? await royxatdanChiqish(tadbirId, slug)
              : await royxatdanOtish(tadbirId, slug);
            if (natija.xato) setXato(natija.xato);
            else setHolat(!holat);
          })
        }
      >
        {holat ? (
          <>
            <CalendarX className="size-4" aria-hidden="true" />
            Yozilishni bekor qilish
          </>
        ) : (
          <>
            <CalendarCheck className="size-4" aria-hidden="true" />
            Tadbirga yozilish
          </>
        )}
      </Button>
      {holat ? <p className="text-sm text-fg-muted">Siz bu tadbirga yozilgansiz.</p> : null}
      {xato ? (
        <p role="alert" className="text-sm text-[#ffb3ad]">
          {xato}
        </p>
      ) : null}
    </div>
  );
}
