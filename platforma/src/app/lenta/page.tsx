import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Flame, GraduationCap, Users } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { LentaRoyxati } from "@/components/lenta/lenta-royxati";
import { LahzalarRoyxati } from "@/components/lahzalar/lahzalar-royxati";
import { DuelBanneri } from "@/components/bosh-sahifa/duel-banneri";
import { TopRoyxati } from "@/components/duel/top-royxati";
import { profilTalabQil } from "@/lib/auth";
import { lentaPostlari } from "@/lib/data/lenta";
import { lahzalarLentasi } from "@/lib/data/lahzalar-lenta";
import { duelRaqiblari, duelTop, meningDuellarim, meningStatistikam } from "@/lib/data/duel";
import { yozilganKurslar } from "@/lib/data/panel";
import { kelayotganTadbirlar, onlaynFoydalanuvchilar } from "@/lib/data/tadbirlar";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bosh sahifa",
  robots: { index: false, follow: false },
};

const ILHOM = [
  "Har kuni oz-ozdan — katta natija shundan boshlanadi.",
  "Bugun yozgan bir qator kod ertangi tajribangizga aylanadi.",
  "Xato qilish — o‘rganishning bir qismi. Davom eting!",
  "Kichik loyiha ham katta qadam. Bugun nimadir yarating.",
  "Eng yaxshi vaqt — hozir. Bitta dars, bitta mashq.",
  "Do‘stingizni duelga chaqiring: bellashuv bilimni mustahkamlaydi.",
  "Bilim bo‘lishilganda ko‘payadi. Lahzangizni ulashing.",
];

function kunlikIlhom() {
  const kun = Math.floor(new Date().getTime() / 86400000);
  return ILHOM[kun % ILHOM.length];
}

const sana = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function BoshSahifa({ searchParams }: { searchParams: Promise<{ bolim?: string }> }) {
  const profil = await profilTalabQil("/lenta");
  const { bolim } = await searchParams;
  const fikrlar = bolim === "fikrlar";
  const supabase = await supabaseServer();

  const [lahzalar, postlar, raqiblar, duellar, haftalik, stat, kurslar, tadbirlar, onlayn] = await Promise.all([
    fikrlar ? null : lahzalarLentasi(profil.id),
    fikrlar ? lentaPostlari(profil.id) : null,
    duelRaqiblari(profil.id),
    meningDuellarim(profil.id),
    duelTop(true),
    meningStatistikam(profil.id),
    yozilganKurslar(profil.id),
    kelayotganTadbirlar(3),
    onlaynFoydalanuvchilar(),
  ]);

  const takliflar = duellar.filter((d) => d.holat === "kutilmoqda" && !d.men_chaqiruvchi).length;
  const joriyKurs = kurslar.find((k) => k.darslar_soni > 0 && k.tugatilgan_darslar < k.darslar_soni) ?? kurslar[0];
  const foiz = joriyKurs && joriyKurs.darslar_soni > 0
    ? Math.min(100, Math.round((joriyKurs.tugatilgan_darslar / joriyKurs.darslar_soni) * 100))
    : 0;
  const men = {
    id: profil.id,
    toliq_ism: profil.toliq_ism,
    avatar_url: profil.avatar_url,
    admin: profil.rol === "admin",
  };
  const birinchiIsm = profil.toliq_ism.split(" ")[0];

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      <header className="surface-card relative mb-6 overflow-hidden p-5 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-gold-500/15 blur-[90px]" />
        <h1 className="text-2xl font-black sm:text-4xl">
          Salom, <span className="text-gold-300">{birinchiIsm}</span>!
        </h1>
        <p className="mt-2 max-w-xl text-sm text-fg-muted sm:text-base">{kunlikIlhom()}</p>
        <dl className="mt-4 flex flex-wrap gap-3 text-sm">
          {stat ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg/60 px-3 py-1.5">
              <Flame className="size-4 text-gold-300" aria-hidden="true" />
              <dt className="text-fg-muted">Duel reytingi</dt>
              <dd className="font-black tabular-nums text-gold-300">{stat.reyting}</dd>
            </div>
          ) : null}
          <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg/60 px-3 py-1.5">
            <Users className="size-4 text-gold-300" aria-hidden="true" />
            <dt className="text-fg-muted">Hozir onlayn</dt>
            <dd className="font-black tabular-nums text-gold-300">{onlayn}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0">
          <div role="tablist" aria-label="Lenta bo‘limlari" className="mb-4 flex gap-1 rounded-full border border-border-subtle p-0.5 w-fit">
            {[
              ["lahzalar", "Lahzalar", "/lenta"],
              ["fikrlar", "Fikrlar", "/lenta?bolim=fikrlar"],
            ].map(([k, n, h]) => (
              <Link
                key={k}
                href={h}
                role="tab"
                aria-selected={(k === "fikrlar") === fikrlar}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-extrabold transition-colors",
                  (k === "fikrlar") === fikrlar ? "bg-gold-400 text-ink-950" : "text-fg-muted hover:text-fg",
                )}
              >
                {n}
              </Link>
            ))}
          </div>

          {fikrlar && postlar ? (
            <LentaRoyxati
              boshlangich={postlar.postlar}
              davomi={postlar.davomi}
              yuklashXatosi={postlar.xato || !supabase}
              men={men}
            />
          ) : lahzalar ? (
            <LahzalarRoyxati
              boshlangich={lahzalar.lahzalar}
              davomi={lahzalar.davomi}
              yuklashXatosi={lahzalar.xato || !supabase}
              tadbir={null}
              yozishsiz
              men={profil.toldirilgan ? men : null}
            />
          ) : null}
        </main>

        <aside className="space-y-5">
          <DuelBanneri raqiblar={raqiblar} takliflarSoni={takliflar} />
          <TopRoyxati qatorlar={haftalik} haftalik bosh="Haftalik TOP 10" />

          <section aria-labelledby="joriy-kurs" className="surface-card p-4 sm:p-5">
            <h2 id="joriy-kurs" className="mb-3 inline-flex items-center gap-2 text-base font-black">
              <GraduationCap className="size-5 text-gold-300" aria-hidden="true" /> Joriy kursim
            </h2>
            {joriyKurs ? (
              <>
                <Link href={`/kurslar/${joriyKurs.slug}`} className="font-extrabold hover:text-gold-300">
                  {joriyKurs.nom}
                </Link>
                <div
                  role="progressbar"
                  aria-valuenow={foiz}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Kurs bo‘yicha jarayon"
                  className="mt-3 h-2 overflow-hidden rounded-full bg-ink-800"
                >
                  <div className="h-full rounded-full bg-gold-400" style={{ width: `${foiz}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-fg-muted">
                  {joriyKurs.tugatilgan_darslar} / {joriyKurs.darslar_soni} dars · {foiz}%
                </p>
                <Link href={`/kurslar/${joriyKurs.slug}`} className="mt-3 inline-block text-xs font-extrabold text-gold-300 hover:underline">
                  Davom etish →
                </Link>
              </>
            ) : (
              <p className="text-sm text-fg-muted">
                Hali kursga yozilmagansiz. <Link href="/kurslar" className="font-bold text-gold-300 hover:underline">Kurslarni ko‘rish</Link>
              </p>
            )}
          </section>

          <section aria-labelledby="yangiliklar" className="surface-card p-4 sm:p-5">
            <h2 id="yangiliklar" className="mb-3 inline-flex items-center gap-2 text-base font-black">
              <CalendarDays className="size-5 text-gold-300" aria-hidden="true" /> Yaqin tadbirlar
            </h2>
            {tadbirlar.length === 0 ? (
              <p className="text-sm text-fg-muted">Hozircha rejalashtirilgan tadbir yo‘q.</p>
            ) : (
              <ul className="space-y-3">
                {tadbirlar.map((t) => (
                  <li key={t.id}>
                    <Link href={`/tadbirlar/${t.slug}`} className="block font-extrabold hover:text-gold-300">
                      {t.nom}
                    </Link>
                    <p className="text-xs text-fg-muted">
                      {sana(t.boshlanish)}
                      {t.joy ? ` · ${t.joy}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </Container>
  );
}
