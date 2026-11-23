"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  Bell,
  BookOpen,
  FolderGit2,
  Images,
  LayoutDashboard,
  MessageSquareHeart,
  NotebookPen,
  Sparkles,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Bolim = { nom: string; href: string; faolYol?: string; Ikona: LucideIcon };
type Guruh = { sarlavha: string | null; bolimlar: Bolim[] };

/**
 * Faqat tayyor bo‘limlar ko‘rsatiladi. «Amaliyot» va «Yo‘nalishlarim» hali
 * tayyor emas — ular tayyor bo‘lganda shu ro‘yxatga qaytariladi.
 */
const GURUHLAR: Guruh[] = [
  {
    sarlavha: null,
    bolimlar: [{ nom: "Bosh sahifa", href: "/panel", Ikona: LayoutDashboard }],
  },
  {
    sarlavha: "O‘qish",
    bolimlar: [
      { nom: "Mening kurslarim", href: "/panel/kurslarim", Ikona: BookOpen },
      { nom: "Mening notlarim", href: "/panel/notlarim", Ikona: NotebookPen },
      { nom: "AI mentor", href: "/panel/ai-mentor", Ikona: Sparkles },
    ],
  },
  {
    sarlavha: "Hamjamiyat",
    bolimlar: [
      { nom: "Loyihalarim", href: "/panel/loyihalarim", Ikona: FolderGit2 },
      { nom: "Bog‘lanishlar", href: "/panel/boglanishlar", Ikona: Users },
      { nom: "Bildirishnomalar", href: "/panel/bildirishnomalar", Ikona: Bell },
      { nom: "Lahzalarim", href: "/panel/lahzalarim", Ikona: Images },
    ],
  },
  {
    sarlavha: "Hisob",
    bolimlar: [
      { nom: "Yutuqlar", href: "/panel/yutuqlar", Ikona: Award },
      { nom: "Fikr-mulohaza", href: "/panel/fikr-mulohaza", Ikona: MessageSquareHeart },
      { nom: "Profil", href: "/panel/profil/korinish", faolYol: "/panel/profil", Ikona: UserRound },
    ],
  },
];

export function YonMenyu() {
  const pathname = usePathname();

  function faolmi(b: Bolim) {
    const asos = b.faolYol ?? b.href;
    return asos === "/panel" ? pathname === "/panel" : pathname.startsWith(asos);
  }

  return (
    <nav aria-label="Panel bo‘limlari">
      {/* Mobil: gorizontal varaqlanadigan tasma; katta ekranda guruhlangan ro‘yxat */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
        {GURUHLAR.map((guruh, i) => (
          <div key={guruh.sarlavha ?? `guruh-${i}`} className="flex shrink-0 gap-2 lg:block lg:shrink">
            {guruh.sarlavha ? (
              <p className="mb-1.5 hidden px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-fg-muted/70 lg:block">
                {guruh.sarlavha}
              </p>
            ) : null}
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
              {guruh.bolimlar.map((b) => {
                const faol = faolmi(b);
                return (
                  <li key={b.href} className="shrink-0 lg:shrink">
                    <Link
                      href={b.href}
                      aria-current={faol ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                        faol ? "text-gold-300" : "text-fg-muted hover:bg-gold-400/8 hover:text-fg",
                      )}
                    >
                      {faol ? (
                        <motion.span
                          layoutId="panel-faol-bolim"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl bg-gold-400/12 ring-1 ring-gold-400/25"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      ) : null}
                      <b.Ikona className="relative size-4 shrink-0" aria-hidden="true" />
                      <span className="relative whitespace-nowrap">{b.nom}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
