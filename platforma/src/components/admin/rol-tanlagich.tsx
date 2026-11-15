"use client";

import { useState, useTransition } from "react";
import { rolniOzgartir } from "@/app/admin/amallar";
import { ROL_NOMI, type Rol } from "@/lib/rollar";

const ROLLAR: Rol[] = ["oquvchi", "ustoz", "admin"];

/** Foydalanuvchi rolini o‘zgartirish tanlagichi. */
export function RolTanlagich({
  foydalanuvchiId,
  joriyRol,
  ozi,
}: {
  foydalanuvchiId: string;
  joriyRol: Rol;
  ozi: boolean;
}) {
  const [rol, setRol] = useState<Rol>(joriyRol);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  if (ozi) {
    return (
      <span className="text-sm font-bold text-champagne">
        {ROL_NOMI[rol]} (siz)
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="sr-only" htmlFor={`rol-${foydalanuvchiId}`}>
        Rolni o‘zgartirish
      </label>
      <select
        id={`rol-${foydalanuvchiId}`}
        value={rol}
        disabled={kutilmoqda}
        onChange={(e) => {
          const yangi = e.target.value as Rol;
          const oldingi = rol;
          setRol(yangi);
          setXato(null);
          startTransition(async () => {
            const natija = await rolniOzgartir(foydalanuvchiId, yangi);
            if (natija.xato) {
              setRol(oldingi);
              setXato(natija.xato);
            }
          });
        }}
        className="h-10 rounded-xl border border-border-subtle bg-ink-850/70 px-3 text-sm font-semibold text-fg"
      >
        {ROLLAR.map((r) => (
          <option key={r} value={r}>
            {ROL_NOMI[r]}
          </option>
        ))}
      </select>
      {xato ? <span className="text-xs text-[#ffb3ad]">{xato}</span> : null}
    </div>
  );
}
