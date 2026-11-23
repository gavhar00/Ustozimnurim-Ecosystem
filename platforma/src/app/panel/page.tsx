import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FolderGit2,
  GraduationCap,
  MessagesSquare,
  PlayCircle,
  UserRound,
} from "lucide-react";
import { KursKartasi } from "@/components/kurslar/kurs-kartasi";
import { KursJarayoni } from "@/components/panel/kurs-jarayoni";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  JarayonChizigi,
  PaydoElement,
  PaydoRoyxat,
  SanaydiganRaqam,
} from "@/components/ui/harakat";
import { profilTalabQil } from "@/lib/auth";
import { kurslarRoyxati } from "@/lib/data/kurslar";
import { panelHisobi, yozilganKurslar } from "@/lib/data/panel";
import { toliqProfil } from "@/lib/data/profil";
import { yonalishlarRoyxati } from "@/lib/data/yonalishlar";
import { DARAJA_NOMI, MAQSAD_TURLARI } from "@/lib/turlar";

export const metadata: Metadata = {
  title: "Bosh sahifa",
  robots: { index: false, follow: false },
};

const TEZKOR_HAVOLALAR = [
  { Ikona: BookOpen, nom: "Kurslar katalogi", izoh: "Yangi kurs tanlang", href: "/kurslar" },
  { Ikona: FolderGit2, nom: "Loyihalarim", izoh: "Portfolioga loyiha qo‘shing", href: "/panel/loyihalarim" },
  { Ikona: MessagesSquare, nom: "Hamjamiyat", izoh: "Savol bering, yordam bering", href: "/hamjamiyat" },
  { Ikona: UserRound, nom: "Profilim", izoh: "Boshqalar sizni qanday ko‘radi", href: "/panel/profil/korinish" },
];

export default async function PanelSahifasi() {
  const profil = await profilTalabQil("/panel");
  const [hisob, kurslar, toliq, barchaKurslar, yonalishlar] = await Promise.all([
    panelHisobi(profil.id),
    yozilganKurslar(profil.id),
    toliqProfil(profil.id),
    kurslarRoyxati(),
    yonalishlarRoyxati(),
  ]);

  // Tavsiya — oddiy qoida: tanlangan yo'nalishdagi, hali yozilmagan kurslar;
  // tajriba darajasiga mos kelganlari birinchi.
  const tanlangan = yonalishlar.find((y) => y.slug === toliq?.tanlangan_yonalish);
  const yozilganIdlar = new Set(kurslar.map((k) => k.id));
  const tavsiyalar = tanlangan
    ? barchaKurslar
        .filter((k) => k.yonalish_slug === tanlangan.slug && !yozilganIdlar.has(k.id))
        .sort(
          (a, b) =>
            Number(b.daraja === toliq?.tajriba_darajasi) -
            Number(a.daraja === toliq?.tajriba_darajasi),
        )
        .slice(0, 2)
    : [];

  const kartalar = hisob
    ? [
        { Ikona: BookOpen, son: hisob.kurslar, izoh: "Kurslarim" },
        { Ikona: CheckCircle2, son: hisob.tugatilgan_darslar, izoh: "Tugatilgan darslar" },
        { Ikona: Award, son: hisob.sertifikatlar, izoh: "Sertifikatlar" },
      ]
    : [];

  // «Keyingi qadam»: tugallanmagan birinchi kurs; hammasi tugagan bo‘lsa — birinchisi.
  const davomEtadigan =
    kurslar.find((k) => k.tugatilgan_darslar < Math.max(k.darslar_soni, 1)) ?? kurslar[0];
  const davomFoizi = davomEtadigan
    ? Math.min(
        Math.round(
          (davomEtadigan.tugatilgan_darslar / Math.max(davomEtadigan.darslar_soni, 1)) * 100,
        ),
        100,
      )
    : 0;
  const kursTugagan = Boolean(davomEtadigan) && davomFoizi >= 100;

  return (
    <>
      <header>
        <h1 className="text-balance text-2xl font-black leading-tight sm:text-3xl">
          Xush kelibsiz, <span className="text-gold-gradient">{profil.toliq_ism}</span>!
        </h1>
        <p className="mt-2 text-pretty leading-relaxed text-fg-muted">
          Quyida nimadan davom etishingiz mumkinligi ko‘rsatilgan.
        </p>
      </header>

      <PaydoRoyxat className="mt-7 space-y-8">
        {/* 1. Keyingi qadam — bitta aniq harakat */}
        <PaydoElement>
          <section
            aria-labelledby="keyingi-qadam"
            className="surface-card relative overflow-hidden border-gold-400/30 p-6 sm:p-7"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold-400/10 blur-3xl"
            />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-300">
              Keyingi qadam
            </p>

            {davomEtadigan ? (
              <>
                <h2 id="keyingi-qadam" className="mt-2 text-xl font-extrabold sm:text-2xl">
                  {kursTugagan ? "Kursni tugatdingiz: " : "Davom ettiring: "}
                  {davomEtadigan.nom}
                </h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {davomEtadigan.tugatilgan_darslar} / {davomEtadigan.darslar_soni} dars tugatilgan
                </p>
                <div className="mt-4 max-w-md">
                  <JarayonChizigi
                    foiz={davomFoizi}
                    etiket={`${davomEtadigan.nom} bo‘yicha jarayon`}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {kursTugagan ? (
                    <ButtonLink href="/panel/yutuqlar">
                      <Award className="size-4" aria-hidden="true" />
                      Sertifikatni ko‘rish
                    </ButtonLink>
                  ) : (
                    <ButtonLink href={`/kurslar/${davomEtadigan.slug}`}>
                      <PlayCircle className="size-4" aria-hidden="true" />
                      Davom ettirish
                    </ButtonLink>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 id="keyingi-qadam" className="mt-2 text-xl font-extrabold sm:text-2xl">
                  Birinchi kursingizni boshlang
                </h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Katalogdan o‘zingizga mos kursni tanlang — darslar interaktiv.
                </p>
                <div className="mt-5">
                  <ButtonLink href="/kurslar">
                    <GraduationCap className="size-4" aria-hidden="true" />
                    Kurslarni ko‘rish
                  </ButtonLink>
                </div>
              </>
            )}
          </section>
        </PaydoElement>

        {/* 2. Profil to‘ldirilganligi — faqat to‘liq bo‘lmasa */}
        {profil.toldirishFoizi < 100 ? (
          <PaydoElement>
            <Link
              href="/panel/profil"
              className="surface-card group flex items-center gap-4 p-4 transition-colors hover:border-border-strong sm:p-5"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  Profilingiz {profil.toldirishFoizi}% to‘ldirilgan
                </p>
                <div className="mt-2 max-w-xs">
                  <JarayonChizigi
                    foiz={profil.toldirishFoizi}
                    etiket="Profil to‘ldirilganligi"
                  />
                </div>
              </div>
              <ArrowRight
                className="size-5 shrink-0 text-gold-300 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </PaydoElement>
        ) : null}

        {/* 3. Raqamlar */}
        {kartalar.length > 0 ? (
          <PaydoElement>
            <dl className="grid gap-4 sm:grid-cols-3">
              {kartalar.map(({ Ikona, son, izoh }) => (
                <div key={izoh} className="surface-card flex items-center gap-4 p-5">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
                    <Ikona className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="sr-only">{izoh}</dt>
                    <dd>
                      <span className="block text-2xl font-black leading-tight text-fg">
                        <SanaydiganRaqam qiymat={son} />
                      </span>
                      <span className="text-sm text-fg-muted">{izoh}</span>
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </PaydoElement>
        ) : null}

        {/* 4. Mening kurslarim */}
        <PaydoElement>
          <section>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-xl font-extrabold">Mening kurslarim</h2>
              {kurslar.length > 0 ? (
                <Link
                  href="/panel/kurslarim"
                  className="text-sm font-bold text-gold-300 hover:text-gold-200"
                >
                  Hammasi →
                </Link>
              ) : null}
            </div>

            {kurslar.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  ikona={<BookOpen className="size-7" aria-hidden="true" />}
                  sarlavha="Siz hali birorta kursga yozilmagansiz"
                  izoh="Katalogdan o‘zingizga mos kursni tanlang va birinchi darsni boshlang."
                  amal={
                    <ButtonLink href="/kurslar">
                      <GraduationCap className="size-4" aria-hidden="true" />
                      Kurslarni ko‘rish
                    </ButtonLink>
                  }
                />
              </div>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {kurslar.slice(0, 4).map((kurs) => (
                  <KursJarayoni key={kurs.id} kurs={kurs} />
                ))}
              </ul>
            )}
          </section>
        </PaydoElement>

        {/* 5. Siz uchun — onboarding javoblari asosida */}
        {tanlangan ? (
          <PaydoElement>
            <section aria-labelledby="siz-uchun">
              <h2 id="siz-uchun" className="text-xl font-extrabold">
                Siz uchun: {tanlangan.nom}
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                {[
                  toliq?.tajriba_darajasi ? `Daraja: ${DARAJA_NOMI[toliq.tajriba_darajasi]}` : null,
                  toliq?.maqsad_turi ? `Maqsad: ${MAQSAD_TURLARI[toliq.maqsad_turi]}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Siz tanlagan yo‘nalish bo‘yicha kurslar."}
              </p>
              {tavsiyalar.length > 0 ? (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {tavsiyalar.map((kurs) => (
                    <KursKartasi key={kurs.id} kurs={kurs} ikona={tanlangan.ikona} />
                  ))}
                </ul>
              ) : (
                <p className="surface-card mt-4 p-5 text-sm text-fg-muted">
                  Bu yo‘nalishda hozircha sizga yangi kurs yo‘q. Kurslar qo‘shilganda shu yerda ko‘rinadi.
                </p>
              )}
            </section>
          </PaydoElement>
        ) : null}

        {/* 6. Tezkor havolalar */}
        <PaydoElement>
          <section aria-labelledby="tezkor">
            <h2 id="tezkor" className="text-xl font-extrabold">
              Tezkor havolalar
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {TEZKOR_HAVOLALAR.map(({ Ikona, nom, izoh, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="surface-card group flex h-full items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-border-strong"
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/12 text-gold-300">
                      <Ikona className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold">{nom}</span>
                      <span className="block text-xs text-fg-muted">{izoh}</span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-gold-300 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </PaydoElement>
      </PaydoRoyxat>
    </>
  );
}
