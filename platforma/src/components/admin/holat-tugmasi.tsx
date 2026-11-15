"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { kursHolatini } from "@/app/admin/amallar";

/** Kursni chop etish yoki qoralamaga qaytarish. */
export function HolatTugmasi({
  kursId,
  joriyHolat,
}: {
  kursId: string;
  joriyHolat: string;
}) {
  const [holat, setHolat] = useState(joriyHolat);
  const [kutilmoqda, startTransition] = useTransition();

  const chopEtilgan = holat === "chop_etilgan";

  return (
    <Button
      type="button"
      size="sm"
      variant={chopEtilgan ? "secondary" : "primary"}
      disabled={kutilmoqda}
      onClick={() =>
        startTransition(async () => {
          const yangi = chopEtilgan ? "qoralama" : "chop_etilgan";
          const natija = await kursHolatini(kursId, yangi);
          if (!natija.xato) setHolat(yangi);
        })
      }
    >
      {chopEtilgan ? (
        <>
          <EyeOff className="size-4" aria-hidden="true" />
          Qoralamaga
        </>
      ) : (
        <>
          <Eye className="size-4" aria-hidden="true" />
          Chop etish
        </>
      )}
    </Button>
  );
}
