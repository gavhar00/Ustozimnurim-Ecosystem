"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Code2, Home, Images, MessagesSquare, Swords, UserRound, type LucideIcon } from "lucide-react";
import { XabarBelgisi } from "@/components/layout/xabar-belgisi";
import { cn } from "@/lib/utils";

type Bolim = { nom: string; href: string; faol: string[]; Ikona: LucideIcon; belgi?: boolean };

/**
 * Tizimga kirgan foydalanuvchi uchun telefon pastki navigatsiyasi: 7 ta bo‘lim.
 */
const BOLIMLAR: Bolim[] = [
  { nom: "Bosh sahifa", href: "/lenta", faol: ["/lenta", "/panel$"], Ikona: Home },
  { nom: "Kurslarim", href: "/panel/kurslarim", faol: ["/panel/kurslarim", "/kurslar"], Ikona: BookOpen },
  { nom: "Duel", href: "/duel", faol: ["/duel"], Ikona: Swords },
  { nom: "Lahzalarim", href: "/lahzalar", faol: ["/lahzalar"], Ikona: Images },
  { nom: "Xabarlar", href: "/xabarlar", faol: ["/xabarlar"], Ikona: MessagesSquare, belgi: true },
  { nom: "Amaliyot", href: "/amaliyot", faol: ["/amaliyot"], Ikona: Code2 },
  { nom: "Profil", href: "/panel/profil/korinish", faol: ["/panel/profil", "/profil"], Ikona: UserRound },
];

function faolmi(yol: string, qoidalar: string[]) {
  return qoidalar.some((q) =>
    q.endsWith("$") ? yol === q.slice(0, -1) : yol === q || yol.startsWith(`${q}/`),
  );
}

export function PastkiMenyu() {
  const yol = usePathname();
  return (
    <nav
      aria-label="Asosiy bo‘limlar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-7">
        {BOLIMLAR.map(({ nom, href, faol, Ikona, belgi }) => {
          const hozir = faolmi(yol, faol);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={hozir ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[0.6rem] font-bold transition-colors",
                  hozir ? "text-gold-300" : "text-fg-muted hover:text-fg",
                )}
              >
                <span className="relative">
                  <Ikona className="size-[22px]" aria-hidden="true" />
                  {belgi ? <XabarBelgisi /> : null}
                </span>
                {nom}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
