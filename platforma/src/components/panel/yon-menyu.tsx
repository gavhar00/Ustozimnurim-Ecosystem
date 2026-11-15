"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  Code2,
  FolderGit2,
  Compass,
  LayoutDashboard,
  NotebookPen,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BOLIMLAR = [
  { nom: "Umumiy ko‘rinish", href: "/panel", Ikona: LayoutDashboard },
  { nom: "Mening kurslarim", href: "/panel/kurslarim", Ikona: BookOpen },
  { nom: "Yo‘nalishlarim", href: "/panel/yonalishlarim", Ikona: Compass },
  { nom: "Amaliyot", href: "/panel/amaliyot", Ikona: Code2 },
  { nom: "AI mentor", href: "/panel/ai-mentor", Ikona: Sparkles },
  { nom: "Mening notlarim", href: "/panel/notlarim", Ikona: NotebookPen },
  { nom: "Loyihalarim", href: "/panel/loyihalarim", Ikona: FolderGit2 },
  { nom: "Bog‘lanishlar", href: "/panel/boglanishlar", Ikona: Users },
  { nom: "Bildirishnomalar", href: "/panel/bildirishnomalar", Ikona: Bell },
  { nom: "Yutuqlar", href: "/panel/yutuqlar", Ikona: Award },
  { nom: "Profil", href: "/panel/profil", Ikona: UserRound },
];

export function YonMenyu() {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel bo‘limlari">
      {/* Mobil: gorizontal varaqlanadigan tasma */}
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {BOLIMLAR.map(({ nom, href, Ikona }) => {
          const faol =
            href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);

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
