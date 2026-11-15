"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderGit2, MessagesSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const BOLIMLAR = [
  { nom: "Munozaralar", href: "/hamjamiyat", Ikona: MessagesSquare },
  { nom: "Odamlar", href: "/hamjamiyat/odamlar", Ikona: Users },
  { nom: "Loyihalar", href: "/hamjamiyat/loyihalar", Ikona: FolderGit2 },
];

/** Hamjamiyat bo'limlari o'rtasida almashish. */
export function BolimMenyusi() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hamjamiyat bo‘limlari">
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {BOLIMLAR.map(({ nom, href, Ikona }) => {
          const faol =
            href === "/hamjamiyat"
              ? pathname === "/hamjamiyat"
              : pathname.startsWith(href);

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={faol ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-bold transition-colors",
                  faol
                    ? "bg-gold-400/15 text-gold-200"
                    : "text-fg-muted hover:bg-gold-400/8 hover:text-fg",
                )}
              >
                <Ikona className="size-4" aria-hidden="true" />
                {nom}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
