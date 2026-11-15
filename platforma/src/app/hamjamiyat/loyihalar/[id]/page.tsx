import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Code2, ExternalLink, Users } from "lucide-react";
import { ProfilKartasi } from "@/components/ijtimoiy/profil-kartasi";
import { QoshilishTugmasi } from "@/components/hamjamiyat/qoshilish-tugmasi";
import { Container } from "@/components/ui/primitives";
import { joriyProfil } from "@/lib/auth";
import {
  azolikHolati,
  loyihaAzolari,
  ommaviyLoyiha,
} from "@/lib/data/ijtimoiy";
import { LOYIHA_HOLATI_NOMI, type LoyihaHolati } from "@/lib/turlar";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const loyiha = await ommaviyLoyiha(id);

  if (!loyiha) return { title: "Loyiha topilmadi" };

  return {
    title: loyiha.nom,
    description: loyiha.tavsif.slice(0, 160),
  };
}

export default async function LoyihaSahifasi({ params }: Props) {
  const { id } = await params;
  const loyiha = await ommaviyLoyiha(id);
  if (!loyiha) notFound();

  const koruvchi = await joriyProfil();
  const [azolar, azolik] = await Promise.all([
    loyihaAzolari(loyiha.id),
    azolikHolati(loyiha.id, loyiha.muallif?.id ?? "", koruvchi?.id ?? null),
  ]);

  const sana = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(loyiha.yaratilgan));

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Yo‘l" className="mb-5">
        <Link
          href="/hamjamiyat/loyihalar"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-gold-300"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Loyihalar
        </Link>
      </nav>

      <article className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-pill border border-border-strong px-3 py-1 text-xs font-bold text-gold-300">
            {LOYIHA_HOLATI_NOMI[loyiha.holat as LoyihaHolati] ?? loyiha.holat}
          </span>
          <span className="rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-fg-muted">
            {loyiha.turkum}
          </span>
        </div>

        <h1 className="mt-4 text-balance text-3xl font-black leading-tight sm:text-4xl">
          {loyiha.nom}
        </h1>

        {loyiha.muallif ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
            <span
              aria-hidden="true"
              className="inline-flex size-8 items-center justify-center rounded-full bg-gold-400/15 text-xs font-black text-gold-300"
            >
              {loyiha.muallif.toliq_ism.trim().charAt(0).toUpperCase()}
            </span>
            {loyiha.muallif.username ? (
              <Link
                href={`/profil/${loyiha.muallif.username}`}
                className="font-bold text-fg hover:text-gold-300"
              >
                {loyiha.muallif.toliq_ism}
              </Link>
            ) : (
              <span className="font-bold text-fg">
                {loyiha.muallif.toliq_ism}
              </span>
            )}
            · {sana}
          </p>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">{sana}</p>
        )}

        <div className="surface-card mt-7 whitespace-pre-line p-6 leading-relaxed text-fg">
          {loyiha.tavsif}
        </div>

        {loyiha.texnologiyalar.length > 0 ? (
          <section className="mt-7">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-champagne">
              Texnologiyalar
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {loyiha.texnologiyalar.map((t) => (
                <li
                  key={t}
                  className="rounded-md bg-ink-700/70 px-3 py-1.5 font-mono text-sm text-champagne"
                >
                  {t}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {loyiha.github_url || loyiha.demo_url ? (
          <div className="mt-7 flex flex-wrap gap-3">
            {loyiha.github_url ? (
              <a
                href={loyiha.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-pill border border-border-strong px-5 py-2.5 text-sm font-bold text-fg transition-colors hover:border-gold-400/60"
              >
                <Code2 className="size-4" aria-hidden="true" />
                Kodni ko‘rish
              </a>
            ) : null}
            {loyiha.demo_url ? (
              <a
                href={loyiha.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-pill border border-border-strong px-5 py-2.5 text-sm font-bold text-fg transition-colors hover:border-gold-400/60"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Demoni ochish
              </a>
            ) : null}
          </div>
        ) : null}

        {/* Jamoa */}
        <section className="mt-10">
          <h2 className="inline-flex items-center gap-2 text-xl font-extrabold">
            <Users className="size-5 text-gold-300" aria-hidden="true" />
            Jamoa ({azolar.length})
          </h2>

          {azolar.length === 0 ? (
            <p className="mt-3 rounded-xl border border-border-subtle bg-ink-850/60 px-5 py-4 text-sm text-fg-muted">
              Jamoa ro‘yxati bo‘sh.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {azolar.map((azo) => (
                <ProfilKartasi
                  key={azo.id}
                  profil={azo}
                  amal={
                    <span className="rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-fg-muted">
                      {azo.rol === "muallif" ? "Muallif" : "A‘zo"}
                    </span>
                  }
                />
              ))}
            </ul>
          )}

          <div className="mt-5">
            {koruvchi ? (
              <QoshilishTugmasi
                loyihaId={loyiha.id}
                boshlangichHolat={azolik}
              />
            ) : (
              <p className="text-sm text-fg-muted">
                Jamoaga qo‘shilish uchun hisobingizga kiring.
              </p>
            )}
          </div>
        </section>
      </article>
    </Container>
  );
}
