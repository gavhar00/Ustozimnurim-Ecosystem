"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { laykchilarniOl } from "@/app/lahzalar/amallar";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { FormXabar } from "@/components/ui/form";
import type { LahzaLaykchi } from "@/lib/lahza-turlari";
import { tadbirSanasi } from "@/lib/sana";

/** Kim layk bosgani — hamma ko‘ra oladi. `versiya` o‘zgarsa ro‘yxat qayta yuklanadi. */
export function Laykchilar({ lahzaId, versiya }: { lahzaId: string; versiya: number }) {
  const [royxat, setRoyxat] = useState<LahzaLaykchi[] | null>(null);
  const [xato, setXato] = useState<string | null>(null);

  useEffect(() => {
    let bekor = false;
    void laykchilarniOl(lahzaId).then((n) => {
      if (bekor) return;
      if (n.ok) {
        setRoyxat(n.malumot);
        setXato(null);
      } else setXato(n.xato);
    });
    return () => {
      bekor = true;
    };
  }, [lahzaId, versiya]);

  return (
    <div className="border-t border-border-subtle pt-4" aria-label="Yoqtirganlar ro‘yxati">
      <p className="mb-3 text-sm font-bold">Kim yoqtirdi</p>
      {xato ? (
        <FormXabar>{xato}</FormXabar>
      ) : royxat === null ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Yuklanmoqda…
        </p>
      ) : royxat.length === 0 ? (
        <p className="text-sm text-fg-muted">Hali hech kim yoqtirmagan.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {royxat.map((l) => (
            <li key={l.profil.id} className="flex items-center gap-2.5">
              <MuallifAvatari ism={l.profil.toliq_ism} url={l.profil.avatar_url} className="size-8 text-xs" />
              <div className="min-w-0 flex-1">
                {l.profil.username ? (
                  <Link href={`/profil/${l.profil.username}`} className="block truncate text-sm font-bold hover:text-gold-300">
                    {l.profil.toliq_ism}
                  </Link>
                ) : (
                  <span className="block truncate text-sm font-bold">{l.profil.toliq_ism}</span>
                )}
              </div>
              <time dateTime={l.yaratilgan} className="shrink-0 text-xs text-fg-muted">
                {tadbirSanasi(l.yaratilgan)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
