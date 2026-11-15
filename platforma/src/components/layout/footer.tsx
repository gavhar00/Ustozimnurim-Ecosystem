import Link from "next/link";
import { LogoFull } from "@/components/brand/logo";
import { Container } from "@/components/ui/primitives";
import { FOOTER_HAVOLALAR } from "@/lib/navigatsiya";

const IJTIMOIY = [
  { nom: "Telegram", href: "https://t.me/ustozimnurim" },
  { nom: "YouTube", href: "https://youtube.com/@ustozimnurim" },
  { nom: "Instagram", href: "https://instagram.com/ustozimnurim" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border-subtle bg-ink-900/60">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <LogoFull />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Bilim. Amaliyot. Kelajak. O‘zbek tilidagi interaktiv dasturlash
              platformasi.
            </p>
            <a
              href="mailto:info@ustozimnurim.uz"
              className="mt-4 inline-block text-sm font-semibold text-gold-300 hover:text-gold-200"
            >
              info@ustozimnurim.uz
            </a>
          </div>

          {FOOTER_HAVOLALAR.map((ustun) => (
            <nav key={ustun.sarlavha} aria-label={ustun.sarlavha}>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-champagne">
                {ustun.sarlavha}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {ustun.havolalar.map((havola) => (
                  <li key={havola.nom}>
                    <Link
                      href={havola.href}
                      className="text-sm text-fg-muted transition-colors hover:text-gold-300"
                    >
                      {havola.nom}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-muted">
            © {new Date().getFullYear()} UstozimNurim. Barcha huquqlar
            himoyalangan.
          </p>
          <ul className="flex items-center gap-5">
            {IJTIMOIY.map((element) => (
              <li key={element.nom}>
                <a
                  href={element.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-fg-muted transition-colors hover:text-gold-300"
                >
                  {element.nom}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
