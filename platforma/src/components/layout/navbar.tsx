"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Bell, LayoutDashboard, MessagesSquare, Swords } from "lucide-react";
import { LogoFull, LogoMark } from "@/components/brand/logo";
import { OrqagaTugma } from "@/components/layout/orqaga-tugma";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  FoydalanuvchiMenyusi,
  type NavProfil,
} from "@/components/layout/foydalanuvchi-menyusi";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ikonaTugma =
  "inline-flex size-10 items-center justify-center rounded-full border border-border-subtle text-fg-muted transition-colors hover:border-border-strong hover:text-gold-300";

export function Navbar({
  profil,
  oqilmagan = 0,
}: {
  profil: NavProfil | null;
  oqilmagan?: number;
}) {
  const [suzuvchi, setSuzuvchi] = useState(false);
  const yol = usePathname();
  const bosh = yol === "/";
  const tugma = (href: string) =>
    cn(
      "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border px-0 text-sm font-bold transition-colors sm:px-4",
      yol === href || yol.startsWith(`${href}/`)
        ? "border-gold-400/60 bg-gold-400/10 text-gold-300"
        : "border-border-subtle text-fg-muted hover:border-border-strong hover:text-gold-300",
    );

  useEffect(() => {
    const onScroll = () => setSuzuvchi(window.scrollY > 12);
    // Dastlabki holatni keyingi kadrda o‘qiymiz — effekt ichida to‘g‘ridan-to‘g‘ri
    // setState chaqirish ortiqcha qayta chizishga olib keladi.
    const kadr = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(kadr);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0",
        "z-50 border-b transition-colors duration-300",
        suzuvchi
          ? "border-border-subtle bg-bg/70 shadow-[0_18px_40px_-30px_rgb(0_0_0/0.9)] backdrop-blur-2xl backdrop-saturate-150"
          : "border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-18 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {!bosh ? <OrqagaTugma zaxira={profil ? "/lenta" : "/"} className={ikonaTugma} /> : null}
          <Link href={profil ? "/lenta" : "/"} aria-label="UstozimNurim — bosh sahifa">
            <span className="sm:hidden"><LogoMark size={32} /></span>
            <span className="hidden sm:inline"><LogoFull /></span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle className={ikonaTugma} />

          {profil ? (
            <>
              <Link href="/lenta" className={tugma("/lenta")} aria-label="Lenta">
                <MessagesSquare className="size-[18px]" aria-hidden="true" />
                <span className="hidden sm:inline">Lenta</span>
              </Link>
              <Link href="/duel" className={tugma("/duel")} aria-label="Duel">
                <Swords className="size-[18px]" aria-hidden="true" />
                <span className="hidden sm:inline">Duel</span>
              </Link>
              <Link href="/panel" className={tugma("/panel")} aria-label="Panel">
                <LayoutDashboard className="size-[18px]" aria-hidden="true" />
                <span className="hidden sm:inline">Panel</span>
              </Link>
              <Link
                href="/panel/bildirishnomalar"
                aria-label={
                  oqilmagan > 0
                    ? `Bildirishnomalar, ${oqilmagan} ta o‘qilmagan`
                    : "Bildirishnomalar"
                }
                className={cn(ikonaTugma, "relative")}
              >
                <Bell className="size-[18px]" aria-hidden="true" />
                {oqilmagan > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-gold-400 px-1.5 text-[0.65rem] font-black text-ink-950">
                    {oqilmagan > 9 ? "9+" : oqilmagan}
                  </span>
                ) : null}
              </Link>
              <FoydalanuvchiMenyusi profil={profil} />
            </>
          ) : (
            <ButtonLink href="/kirish" size="sm">
              Kirish
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          )}

        </div>
      </Container>

    </header>
  );
}
