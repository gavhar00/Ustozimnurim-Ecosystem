import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  ExternalLink,
  Code2 as Github,
  GraduationCap,
  Handshake,
  Link2,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import { AloqaTugmalari } from "@/components/ijtimoiy/aloqa-tugmalari";
import { Postlar } from "@/components/ijtimoiy/postlar";
import { ProfilKartasi } from "@/components/ijtimoiy/profil-kartasi";
import { KursJarayoni } from "@/components/panel/kurs-jarayoni";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/primitives";
import { joriyProfil } from "@/lib/auth";
import { aloqaHolati, profilPostlari } from "@/lib/data/ijtimoiy";
import { boglanishRoyxatlari } from "@/lib/data/ijtimoiy";
import { sertifikatlar, yozilganKurslar } from "@/lib/data/panel";
import {
  profilKonikmalari,
  profilLoyihalari,
  profilUsernameBoyicha,
} from "@/lib/data/profil";
import {
  DARAJA_NOMI,
  KONIKMA_TURKUMI_NOMI,
  LOYIHA_HOLATI_NOMI,
  type Konikma,
  type KonikmaTurkumi,
} from "@/lib/turlar";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ bolim?: string }>;
};

const BOLIMLAR = [
  { kalit: "umumiy", nom: "Umumiy" },
  { kalit: "postlar", nom: "Postlar" },
  { kalit: "loyihalar", nom: "Loyihalar" },
  { kalit: "konikmalar", nom: "Ko‘nikmalar" },
  { kalit: "talim", nom: "Ta’lim" },
  { kalit: "boglanishlar", nom: "Bog‘lanishlar" },
] as const;

const OZIGA_XOS = [
  { kalit: "kurslar", nom: "Kurslar" },
  { kalit: "yutuqlar", nom: "Yutuqlar" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profil = await profilUsernameBoyicha(username);

  if (!profil) return { title: "Profil topilmadi" };

  return {
    title: `${profil.toliq_ism} (@${profil.username})`,
    description:
      profil.bio?.slice(0, 160) ??
      `${profil.toliq_ism} — UstozimNurim platformasidagi profil.`,
  };
}

export default async function OmmaviyProfil({ params, searchParams }: Props) {
  const { username } = await params;
  const { bolim = "umumiy" } = await searchParams;

  const profil = await profilUsernameBoyicha(username);
  if (!profil) notFound();

  const koruvchi = await joriyProfil();
  const ozimi = koruvchi?.id === profil.id;

  const [konikmalar, loyihalar, postlar, aloqa] = await Promise.all([
    profilKonikmalari(profil.id),
    profilLoyihalari(profil.id),
    profilPostlari(profil.id, koruvchi?.id ?? null),
    aloqaHolati(profil.id, koruvchi?.id ?? null),
  ]);

  const boglangan = ozimi
    ? (await boglanishRoyxatlari(profil.id)).boglangan
    : [];

  const kurslar = ozimi ? await yozilganKurslar(profil.id) : [];
  const yutuqlar = ozimi ? await sertifikatlar(profil.id) : [];

  const bolimlar = ozimi ? [...BOLIMLAR, ...OZIGA_XOS] : BOLIMLAR;
  const faol = bolimlar.some((b) => b.kalit === bolim) ? bolim : "umumiy";

  const havolalar = [
    { kalit: "github", nom: "GitHub", Ikona: Github },
    { kalit: "telegram", nom: "Telegram", Ikona: Send },
    { kalit: "linkedin", nom: "LinkedIn", Ikona: Link2 },
    { kalit: "portfolio", nom: "Sayt", Ikona: ExternalLink },
  ] as const;

  return (
    <Container className="py-8 sm:py-10">
      {/* Muqova va asosiy ma'lumot */}
      <header className="surface-card overflow-hidden p-0">
        {/* Muqova */}
        <div className="relative h-36 sm:h-48 lg:h-56">
          {profil.muqova_url ? (
            <Image
              src={profil.muqova_url}
              alt=""
              fill
              priority
              sizes="(max-width: 1240px) 100vw, 1240px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              aria-hidden="true"
              className="size-full bg-linear-[110deg,var(--color-ink-700),var(--color-gold-700)_55%,var(--color-ink-800)]"
            />
          )}

          {/* Pastki soyali o'tish — avatar va matn aniq ko'rinishi uchun */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-10 bg-linear-[to_top,var(--bg-card),transparent] opacity-70"
          />
        </div>

        <div className="relative z-10 px-6 pb-7 sm:px-8">
          {/* Avatar + amal tugmalari */}
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
            {profil.avatar_url ? (
              <Image
                src={profil.avatar_url}
                alt={`${profil.toliq_ism} avatari`}
                width={128}
                height={128}
                unoptimized
                className="size-28 rounded-3xl object-cover shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)] ring-4 ring-bg-card sm:size-32"
              />
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex size-28 items-center justify-center rounded-3xl bg-gold-400/20 text-4xl font-black text-gold-200 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)] ring-4 ring-bg-card sm:size-32"
              >
                {profil.toliq_ism.trim().charAt(0).toUpperCase() || "U"}
              </span>
            )}

            <div className="mb-1">
              {ozimi ? (
                <ButtonLink href="/panel/profil" variant="secondary" size="sm">
                  Profilni tahrirlash
                </ButtonLink>
              ) : koruvchi ? (
                <AloqaTugmalari
                  profilId={profil.id}
                  boshlangichBoglanish={aloqa.boglanish}
                  boshlangichKuzatyapman={aloqa.kuzatyapman}
                />
              ) : null}
            </div>
          </div>

          {/* Ism va username */}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-balance text-2xl font-black leading-tight sm:text-3xl">
              {profil.toliq_ism}
            </h1>
            <p className="font-mono text-sm text-gold-300">@{profil.username}</p>
          </div>

          {/* Qisqa belgilar */}
          {profil.kasb || profil.joylashuv || profil.hamkorlikka_ochiq ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profil.kasb ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-subtle px-3 py-1.5 text-sm text-fg-muted">
                  <Sparkles className="size-3.5 text-gold-400/70" aria-hidden="true" />
                  {profil.kasb}
                </span>
              ) : null}
              {profil.joylashuv ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-subtle px-3 py-1.5 text-sm text-fg-muted">
                  <MapPin className="size-3.5 text-gold-400/70" aria-hidden="true" />
                  {profil.joylashuv}
                </span>
              ) : null}
              {profil.hamkorlikka_ochiq ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-[#5fd39b]/40 bg-[#5fd39b]/10 px-3 py-1.5 text-sm font-bold text-[#9fe4c2]">
                  <Handshake className="size-3.5" aria-hidden="true" />
                  Hamkorlikka ochiq
                </span>
              ) : null}
            </div>
          ) : null}

          {profil.bio ? (
            <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-fg-muted">
              {profil.bio}
            </p>
          ) : null}

          {/* Sonlar va havolalar bir qatorda */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border-subtle pt-5">
            <dl className="flex flex-wrap gap-x-7 gap-y-2">
              {[
                { nom: "kuzatuvchi", son: aloqa.kuzatuvchilar },
                { nom: "kuzatilmoqda", son: aloqa.kuzatilganlar },
                { nom: "bog\u2018lanish", son: aloqa.boglanishlar },
              ].map((q) => (
                <div key={q.nom}>
                  <dt className="sr-only">{q.nom}</dt>
                  <dd className="text-xl font-black leading-tight text-fg">
                    {q.son}
                  </dd>
                  <dd className="text-xs text-fg-muted">{q.nom}</dd>
                </div>
              ))}
            </dl>

            <ul className="flex flex-wrap gap-2">
              {havolalar.map(({ kalit, nom, Ikona }) => {
                const url = profil.havolalar[kalit];
                if (!url) return null;
                return (
                  <li key={kalit}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-pill border border-border-subtle px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:border-border-strong hover:text-gold-300"
                    >
                      <Ikona className="size-4" aria-hidden="true" />
                      {nom}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </header>

      {/* Bo'limlar */}
      <nav
        aria-label="Profil bo‘limlari"
        className="surface-card mt-6 overflow-x-auto p-1.5"
      >
        <ul className="flex gap-1">
          {bolimlar.map((b) => (
            <li key={b.kalit} className="shrink-0">
              <Link
                href={`/profil/${profil.username}?bolim=${b.kalit}`}
                aria-current={faol === b.kalit ? "page" : undefined}
                className={cn(
                  "inline-block whitespace-nowrap rounded-pill px-4 py-2.5 text-sm font-bold transition-colors",
                  faol === b.kalit
                    ? "bg-gold-400/15 text-gold-200"
                    : "text-fg-muted hover:bg-gold-400/8 hover:text-fg",
                )}
              >
                {b.nom}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">
        {faol === "umumiy" ? (
          <UmumiyBolim profil={profil} konikmalar={konikmalar} />
        ) : null}

        {faol === "postlar" ? (
          <Postlar
            postlar={postlar}
            ozimi={ozimi}
            kirgan={Boolean(koruvchi)}
            muallifIsmi={profil.toliq_ism}
          />
        ) : null}

        {faol === "boglanishlar" ? (
          ozimi ? (
            boglangan.length === 0 ? (
              <EmptyState
                sarlavha="Hali bog‘lanish yo‘q"
                izoh="Panelning “Bog‘lanishlar” bo‘limidan odamlarni toping."
                amal={
                  <ButtonLink href="/panel/boglanishlar">
                    Odamlarni ko‘rish
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="space-y-3">
                {boglangan.map((p) => (
                  <ProfilKartasi key={p.id} profil={p} />
                ))}
              </ul>
            )
          ) : (
            <EmptyState
              sarlavha="Bog‘lanishlar yopiq"
              izoh="Foydalanuvchining bog‘lanishlari faqat o‘ziga ko‘rinadi."
            />
          )
        ) : null}

        {faol === "loyihalar" ? (
          loyihalar.length === 0 ? (
            <EmptyState
              sarlavha="Hali loyiha qo‘shilmagan"
              izoh={
                ozimi
                  ? "Qurgan ishlaringizni “Loyihalarim” bo‘limidan qo‘shing."
                  : "Bu foydalanuvchi hali loyiha ulashmagan."
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {loyihalar.map((loyiha) => (
                <li key={loyiha.id} className="surface-card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-extrabold text-fg">{loyiha.nom}</h2>
                    <span className="shrink-0 rounded-pill border border-border-strong px-3 py-1 text-xs font-bold text-gold-300">
                      {LOYIHA_HOLATI_NOMI[loyiha.holat]}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
                    {loyiha.tavsif}
                  </p>
                  {loyiha.texnologiyalar.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {loyiha.texnologiyalar.map((t) => (
                        <li
                          key={t}
                          className="rounded-md bg-ink-700/70 px-2 py-1 font-mono text-xs text-champagne"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4 flex items-center gap-4 border-t border-border-subtle pt-3">
                    {loyiha.github_url ? (
                      <a
                        href={loyiha.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-gold-300"
                      >
                        <Github className="size-3.5" aria-hidden="true" />
                        Kod
                      </a>
                    ) : null}
                    {loyiha.demo_url ? (
                      <a
                        href={loyiha.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-gold-300"
                      >
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        Demo
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {faol === "konikmalar" ? (
          <KonikmalarBolimi konikmalar={konikmalar} />
        ) : null}

        {faol === "talim" ? (
          <div className="surface-card space-y-5 p-6">
            <Qator nom="Ta’lim" qiymat={profil.talim} />
            <Qator nom="Maqsad" qiymat={profil.maqsad} />
            <Qator
              nom="Tillar"
              qiymat={profil.tillar.length ? profil.tillar.join(", ") : null}
            />
          </div>
        ) : null}

        {faol === "kurslar" && ozimi ? (
          kurslar.length === 0 ? (
            <EmptyState
              ikona={<BookOpen className="size-7" aria-hidden="true" />}
              sarlavha="Hali kursga yozilmagansiz"
              izoh="Katalogdan kurs tanlang va birinchi darsni boshlang."
              amal={
                <ButtonLink href="/kurslar">
                  <GraduationCap className="size-4" aria-hidden="true" />
                  Kurslarni ko‘rish
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {kurslar.map((kurs) => (
                <KursJarayoni key={kurs.id} kurs={kurs} />
              ))}
            </ul>
          )
        ) : null}

        {faol === "yutuqlar" && ozimi ? (
          yutuqlar.length === 0 ? (
            <EmptyState
              ikona={<Award className="size-7" aria-hidden="true" />}
              sarlavha="Hali sertifikat yo‘q"
              izoh="Birinchi kursni tugating — sertifikat avtomatik beriladi."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {yutuqlar.map((s) => (
                <li
                  key={s.id}
                  className="surface-card flex items-center gap-4 p-5"
                >
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
                    <Award className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-fg">{s.kurs_nomi}</p>
                    <p className="text-xs text-fg-muted">
                      {new Intl.DateTimeFormat("uz-UZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(s.berilgan))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </Container>
  );
}

function Qator({ nom, qiymat }: { nom: string; qiymat: string | null }) {
  return (
    <div className="border-b border-border-subtle pb-4 last:border-0 last:pb-0">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-champagne">
        {nom}
      </h2>
      <p className="mt-2 whitespace-pre-line leading-relaxed text-fg-muted">
        {qiymat ?? "Kiritilmagan"}
      </p>
    </div>
  );
}

function UmumiyBolim({
  profil,
  konikmalar,
}: {
  profil: { bio: string | null; maqsad: string | null; qiziqishlar: string[] };
  konikmalar: Konikma[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="surface-card space-y-5 p-6">
        <Qator nom="Men haqimda" qiymat={profil.bio} />
        <Qator nom="Maqsad" qiymat={profil.maqsad} />
      </div>

      <div className="space-y-5">
        <div className="surface-card p-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-champagne">
            Qiziqishlar
          </h2>
          {profil.qiziqishlar.length === 0 ? (
            <p className="mt-2 text-sm text-fg-muted">Tanlanmagan</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {profil.qiziqishlar.map((q) => (
                <li
                  key={q}
                  className="rounded-pill border border-border-subtle px-3 py-1.5 text-sm text-fg-muted"
                >
                  {q}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card p-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-champagne">
            Asosiy ko‘nikmalar
          </h2>
          {konikmalar.length === 0 ? (
            <p className="mt-2 text-sm text-fg-muted">Qo‘shilmagan</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {konikmalar.slice(0, 8).map((k) => (
                <li
                  key={k.id}
                  className="rounded-pill border border-border-strong bg-gold-400/8 px-3 py-1.5 text-sm font-semibold text-fg"
                >
                  {k.nom}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KonikmalarBolimi({ konikmalar }: { konikmalar: Konikma[] }) {
  if (konikmalar.length === 0) {
    return (
      <EmptyState
        sarlavha="Hali ko‘nikma qo‘shilmagan"
        izoh="Ko‘nikmalar profil sozlamalaridan qo‘shiladi."
      />
    );
  }

  const turkumlar = Object.keys(KONIKMA_TURKUMI_NOMI) as KonikmaTurkumi[];

  return (
    <div className="space-y-5">
      {turkumlar.map((turkum) => {
        const royxat = konikmalar.filter((k) => k.turkum === turkum);
        if (royxat.length === 0) return null;

        return (
          <section key={turkum} className="surface-card p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-champagne">
              {KONIKMA_TURKUMI_NOMI[turkum]}
            </h2>
            <ul className="mt-4 space-y-3">
              {royxat.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="font-semibold text-fg">{k.nom}</span>
                  <span className="shrink-0 rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-gold-300">
                    {DARAJA_NOMI[k.daraja]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
