"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Bolim = { nom: string; href: string; faol: string[]; Ikona: LucideIcon; bildirish?: boolean };

/**
 * Tizimga kirgan foydalanuvchi uchun telefon pastki navigatsiyasi: faqat Bildirishnoma va Profil.
 */
const BOLIMLAR: Bolim[] = [
  { nom: "Bildirishnoma", href: "/panel/bildirishnomalar", faol: ["/panel/bildirishnomalar"], Ikona: Bell, bildirish: true },
  { nom: "Profil", href: "/panel/profil/korinish", faol: ["/panel/profil", "/profil"], Ikona: UserRound },
];

function faolmi(yol: string, qoidalar: string[]) {
  return qoidalar.some((q) =>
    q.endsWith("$") ? yol === q.slice(0, -1) : yol === q || yol.startsWith(`${q}/`),
  );
}

export function PastkiMenyu({ oqilmagan = 0 }: { oqilmagan?: number }) {
  const yol = usePathname();
  return (
    <nav
      aria-label="Asosiy bo‘limlar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-2">
        {BOLIMLAR.map(({ nom, href, faol, Ikona, bildirish }) => {
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
                  {bildirish && oqilmagan > 0 ? (
                    <span className="absolute -right-2 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[0.6rem] font-black text-ink-950">
                      {oqilmagan > 9 ? "9+" : oqilmagan}
                    </span>
                  ) : null}
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
