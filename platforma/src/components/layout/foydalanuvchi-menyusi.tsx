"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { ROL_NOMI, type Rol } from "@/lib/rollar";

export type NavProfil = { toliq_ism: string; rol: Rol };

/** Kirgan foydalanuvchining ismi va ochiladigan menyusi. */
export function FoydalanuvchiMenyusi({ profil }: { profil: NavProfil }) {
  const [ochiq, setOchiq] = useState(false);
  const orov = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ochiq) return;

    function tashqariBosildi(e: MouseEvent) {
      if (orov.current && !orov.current.contains(e.target as Node)) {
        setOchiq(false);
      }
    }
    function escBosildi(e: KeyboardEvent) {
      if (e.key === "Escape") setOchiq(false);
    }

    document.addEventListener("mousedown", tashqariBosildi);
    document.addEventListener("keydown", escBosildi);
    return () => {
      document.removeEventListener("mousedown", tashqariBosildi);
      document.removeEventListener("keydown", escBosildi);
    };
  }, [ochiq]);

  const bosh = profil.toliq_ism.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={orov}>
      <button
        type="button"
        onClick={() => setOchiq((v) => !v)}
        aria-expanded={ochiq}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-pill border border-border-subtle py-1.5 pl-1.5 pr-3.5 transition-colors hover:border-border-strong"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-8 items-center justify-center rounded-full bg-gold-400/15 text-sm font-black text-gold-300"
        >
          {bosh}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-bold text-fg sm:inline">
          {profil.toliq_ism}
        </span>
      </button>

      {ochiq ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] w-60 overflow-hidden rounded-2xl border border-border-strong bg-bg-elevated shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="truncate text-sm font-bold text-fg">
              {profil.toliq_ism}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {ROL_NOMI[profil.rol]}
            </p>
          </div>

          <div className="p-1.5">
            <Link
              href="/panel/profil/korinish"
              role="menuitem"
              onClick={() => setOchiq(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-gold-400/10 hover:text-fg"
            >
              <UserRound className="size-4" aria-hidden="true" />
              Profilim
            </Link>

            {profil.rol === "admin" ? (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOchiq(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-gold-400/10 hover:text-fg"
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Boshqaruv paneli
              </Link>
            ) : null}
          </div>

          <form action="/chiqish" method="post" className="border-t border-border-subtle p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-[#ff8f87]/10 hover:text-[#ffb3ad]"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Chiqish
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
