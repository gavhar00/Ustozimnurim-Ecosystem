"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BOLIMLAR = [
  { nom: "Analitika", href: "/admin", Ikona: BarChart3 },
  { nom: "Foydalanuvchilar", href: "/admin/foydalanuvchilar", Ikona: Users },
  { nom: "Kurslar", href: "/admin/kurslar", Ikona: BookOpen },
  { nom: "Sertifikatlar", href: "/admin/sertifikatlar", Ikona: GraduationCap },
  { nom: "Sozlamalar", href: "/admin/sozlamalar", Ikona: Settings },
];

export function AdminYonMenyu() {
  const pathname = usePathname();

  return (
    <nav aria-label="Boshqaruv bo‘limlari">
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {BOLIMLAR.map(({ nom, href, Ikona }) => {
          const faol =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0 lg:shrink">
              <Link
                href={href}
                aria-current={faol ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  faol
                    ? "bg-gold-400/12 text-gold-300"
                    : "text-fg-muted hover:bg-gold-400/8 hover:text-fg",
                )}
              >
                <Ikona className="size-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{nom}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
