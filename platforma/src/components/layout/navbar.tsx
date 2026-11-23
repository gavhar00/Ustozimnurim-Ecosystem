"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, Menu, Search } from "lucide-react";
import { LogoFull } from "@/components/brand/logo";
import { MobilMenyu } from "@/components/layout/mobil-menyu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  FoydalanuvchiMenyusi,
  type NavProfil,
} from "@/components/layout/foydalanuvchi-menyusi";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ASOSIY_MENU } from "@/lib/navigatsiya";
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
  const pathname = usePathname();
  const [ochiq, setOchiq] = useState(false);
  const [suzuvchi, setSuzuvchi] = useState(false);

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
        <Link href="/" aria-label="UstozimNurim — bosh sahifa">
          <LogoFull />
        </Link>

        <nav aria-label="Asosiy menyu" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {ASOSIY_MENU.map((element) => {
              const faol =
                element.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(element.href);
              return (
                <li key={element.href}>
                  <Link
                    href={element.href}
                    aria-current={faol ? "page" : undefined}
                    className={cn(
                      "relative rounded-pill px-4 py-2 text-[0.95rem] font-semibold transition-colors",
                      faol
                        ? "text-gold-300"
                        : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {element.nom}
                    {faol ? (
                      <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gold-400" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/kurslar"
            aria-label="Kurslarni qidirish"
            className={cn(ikonaTugma, "hidden sm:inline-flex")}
          >
            <Search className="size-[18px]" aria-hidden="true" />
          </Link>
          <ThemeToggle className={cn(ikonaTugma, "hidden sm:inline-flex")} />

          {profil ? (
            <>
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
            <ButtonLink
              href="/kirish"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Kirish
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          )}

          <button
            type="button"
            onClick={() => setOchiq(true)}
            aria-expanded={ochiq}
            aria-controls="mobil-menyu"
            aria-label="Menyuni ochish"
            aria-haspopup="dialog"
            className={cn(ikonaTugma, "lg:hidden")}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </Container>

      <MobilMenyu
        ochiq={ochiq}
        yop={() => setOchiq(false)}
        kirgan={Boolean(profil)}
      />
    </header>
  );
}
