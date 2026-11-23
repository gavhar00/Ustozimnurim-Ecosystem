"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { LogoFull } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { ASOSIY_MENU } from "@/lib/navigatsiya";
import { cn } from "@/lib/utils";

const FOKUSLANADI =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mobil menyu — sahifa ustida suzuvchi panel (drawer).
 * Sahifani siljitmaydi: orqa fon skrolli qulflanadi, Escape va tashqariga
 * bosish yopadi, fokus panel ichida qoladi va yopilganda tugmaga qaytadi.
 */
export function MobilMenyu({
  ochiq,
  yop,
  kirgan,
}: {
  ochiq: boolean;
  yop: () => void;
  kirgan: boolean;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  // Hydratsiya xatosiz: serverda false, brauzerda true.
  const brauzerda = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!ochiq) return;

    const oldingiFokus = document.activeElement as HTMLElement | null;
    const body = document.body;
    const oldingiOverflow = body.style.overflow;
    const oldingiPadding = body.style.paddingRight;
    const skrollKengligi = window.innerWidth - document.documentElement.clientWidth;

    // Orqa fon skrolini qulflaymiz; skroll chizig‘i yo‘qolganda sakramasin.
    body.style.overflow = "hidden";
    if (skrollKengligi > 0) body.style.paddingRight = `${skrollKengligi}px`;

    const birinchi = panelRef.current?.querySelector<HTMLElement>(FOKUSLANADI);
    birinchi?.focus();

    function tugma(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        yop();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const elementlar = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOKUSLANADI),
      );
      if (elementlar.length === 0) return;
      const birinchiEl = elementlar[0];
      const oxirgiEl = elementlar[elementlar.length - 1];
      if (e.shiftKey && document.activeElement === birinchiEl) {
        e.preventDefault();
        oxirgiEl.focus();
      } else if (!e.shiftKey && document.activeElement === oxirgiEl) {
        e.preventDefault();
        birinchiEl.focus();
      }
    }
    document.addEventListener("keydown", tugma);

    return () => {
      document.removeEventListener("keydown", tugma);
      body.style.overflow = oldingiOverflow;
      body.style.paddingRight = oldingiPadding;
      oldingiFokus?.focus?.();
    };
  }, [ochiq, yop]);

  // Server tomonda portal yo‘q; menyu faqat bosilgandan keyin ochiladi.
  if (!brauzerda) return null;

  return createPortal(
    <AnimatePresence>
      {ochiq ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={yop}
          />

          <motion.div
            ref={panelRef}
            id="mobil-menyu"
            role="dialog"
            aria-modal="true"
            aria-label="Asosiy menyu"
            className="absolute right-0 top-0 flex h-dvh w-[min(86vw,360px)] flex-col overflow-y-auto border-l border-border-subtle bg-bg-elevated shadow-[-24px_0_60px_-30px_rgb(0_0_0/0.8)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-18 shrink-0 items-center justify-between gap-3 px-5">
              <Link href="/" onClick={yop} aria-label="UstozimNurim — bosh sahifa">
                <LogoFull size={30} />
              </Link>
              <button
                type="button"
                onClick={yop}
                aria-label="Menyuni yopish"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border-subtle text-fg-muted transition-colors hover:border-border-strong hover:text-gold-300"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Asosiy menyu" className="px-3 pt-2">
              <ul className="flex flex-col gap-1">
                {ASOSIY_MENU.map((element) => {
                  const faol =
                    element.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(element.href);
                  return (
                    <li key={element.href}>
                      <Link
                        href={element.href}
                        onClick={yop}
                        aria-current={faol ? "page" : undefined}
                        className={cn(
                          "flex items-center rounded-xl px-4 py-3 text-base font-semibold transition-colors",
                          faol
                            ? "bg-gold-400/12 text-gold-300"
                            : "text-fg-muted hover:bg-gold-400/8 hover:text-fg",
                        )}
                      >
                        {element.nom}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link
                    href="/kurslar"
                    onClick={yop}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-base font-semibold text-fg-muted transition-colors hover:bg-gold-400/8 hover:text-fg"
                  >
                    <Search className="size-[18px]" aria-hidden="true" />
                    Kurslarni qidirish
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="mt-auto flex items-center gap-3 border-t border-border-subtle p-5">
              <ButtonLink
                href={kirgan ? "/panel" : "/kirish"}
                size="md"
                className="flex-1"
                onClick={yop}
              >
                {kirgan ? "Panelga o‘tish" : "Kirish"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ThemeToggle className="inline-flex size-11 items-center justify-center rounded-full border border-border-subtle text-fg-muted transition-colors hover:border-border-strong hover:text-gold-300" />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
