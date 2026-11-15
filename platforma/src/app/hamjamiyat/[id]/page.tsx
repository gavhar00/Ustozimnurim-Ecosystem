import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { JavobFormasi } from "@/components/hamjamiyat/javob-formasi";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { joriyProfil } from "@/lib/auth";
import { munozaraJavoblari, munozaraTopish } from "@/lib/data/hamjamiyat";

type Props = { params: Promise<{ id: string }> };

function sana(iso: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const munozara = await munozaraTopish(id);
  return { title: munozara ? munozara.sarlavha : "Munozara topilmadi" };
}

export default async function MunozaraSahifasi({ params }: Props) {
  const { id } = await params;
  const munozara = await munozaraTopish(id);
  if (!munozara) notFound();

  const [javoblar, profil] = await Promise.all([
    munozaraJavoblari(id),
    joriyProfil(),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Yo‘l" className="mb-5">
        <Link
          href="/hamjamiyat"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-gold-300"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Hamjamiyat
        </Link>
      </nav>

      <article className="max-w-3xl">
        <span className="inline-block rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-gold-300">
          {munozara.turkum}
        </span>

        <h1 className="mt-3 text-balance text-2xl font-black leading-tight sm:text-3xl">
          {munozara.sarlavha}
        </h1>

        <p className="mt-2 text-sm text-fg-muted">
          {munozara.muallif_ismi} · {sana(munozara.yaratilgan)}
        </p>

        <div className="surface-card mt-6 whitespace-pre-line p-6 leading-relaxed text-fg">
          {munozara.matn}
        </div>
      </article>

      <section className="mt-10 max-w-3xl">
        <h2 className="inline-flex items-center gap-2 text-xl font-extrabold">
          <MessageCircle className="size-5 text-gold-300" aria-hidden="true" />
          Javoblar ({javoblar.length})
        </h2>

        {javoblar.length === 0 ? (
          <p className="mt-4 rounded-xl border border-border-subtle bg-ink-850/60 px-5 py-4 text-sm text-fg-muted">
            Hali javob yo‘q. Birinchi bo‘lib yordam bering.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {javoblar.map((javob) => (
              <li key={javob.id} className="surface-card p-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-sm font-black text-gold-300"
                  >
                    {javob.muallif_ismi.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-fg">
                      {javob.muallif_ismi}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {sana(javob.yaratilgan)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-fg-muted">
                  {javob.matn}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          {profil ? (
            <JavobFormasi munozaraId={munozara.id} />
          ) : (
            <div className="surface-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-fg-muted">
                Javob yozish uchun hisobingizga kiring.
              </p>
              <ButtonLink
                href={`/kirish?keyin=${encodeURIComponent(`/hamjamiyat/${munozara.id}`)}`}
              >
                Kirish
              </ButtonLink>
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}
