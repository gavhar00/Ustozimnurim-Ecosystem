import type { Metadata } from "next";
import Link from "next/link";
import { Swords } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { RaqiblarRoyxati } from "@/components/duel/raqiblar-royxati";
import { TaklifTugmalari } from "@/components/duel/taklif-tugmalari";
import { TopRoyxati } from "@/components/duel/top-royxati";
import { profilTalabQil } from "@/lib/auth";
import { duelRaqiblari, duelTop, meningDuellarim, meningStatistikam } from "@/lib/data/duel";
import { qiyinlikNomi, yonalishNomi, type DuelQatori } from "@/lib/duel-turlari";

export const metadata: Metadata = {
  title: "Duel",
  robots: { index: false, follow: false },
};

export default async function DuelAsosiySahifa() {
  const profil = await profilTalabQil("/duel");
  const [raqiblar, duellar, top, haftalik, stat] = await Promise.all([
    duelRaqiblari(profil.id),
    meningDuellarim(profil.id),
    duelTop(false),
    duelTop(true),
    meningStatistikam(profil.id),
  ]);

  const ochiq = duellar.filter((d) => d.holat === "kutilmoqda" || d.holat === "boshlandi");
  // Siz hali kirmagan duellar (sizni kutishmoqda)
  const takliflar = ochiq.filter((d) => !d.men_boshladi);
  // Siz boshlagan, raqib hali ishlamagan yoki davom etayotgan duellar
  const faol = ochiq.filter((d) => d.men_boshladi);
  const kutilayotgan: DuelQatori[] = [];
  const tarix = duellar.filter((d) => ["tugadi", "rad", "bekor"].includes(d.holat));

  return (
    <Container className="max-w-5xl py-8 sm:py-10">
      <div className="surface-card relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-gold-500/15 blur-[90px]" />
        <p className="inline-flex items-center gap-2 text-sm font-extrabold text-gold-300">
          <Swords className="size-4" aria-hidden="true" /> Duel
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Duel bellashamizmi?</h1>
        <p className="mt-2 max-w-xl text-fg-muted">
          Raqib tanlang, yo‘nalish va qiyinlikni belgilang — ikkalangizga bir xil savollar. Tayyor bo‘lgan darrov boshlaydi, raqibda kirish uchun 24 soat bor; kirmasa, ishlagan odam g‘olib bo‘ladi.
        </p>
        {stat ? (
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Reyting", stat.reyting],
              ["G‘alaba", stat.galabalar],
              ["Mag‘lubiyat", stat.magliubiyatlar],
              ["Durang", stat.durranglar],
            ].map(([n, q]) => (
              <div key={n} className="rounded-2xl border border-border-subtle bg-bg/60 p-3 text-center">
                <dt className="text-xs font-bold text-fg-muted">{n}</dt>
                <dd className="text-2xl font-black tabular-nums text-gold-300">{q}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {takliflar.length + faol.length + kutilayotgan.length > 0 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Blok sarlavha="Sizni kutayotgan duellar" bosh={takliflar.length === 0} bosXabar="Hozircha taklif yo‘q.">
            {takliflar.map((d) => (
              <Qator
                key={d.id}
                d={d}
                amal={d.men_chaqiruvchi ? <Link href={`/duel/${d.id}`} className="text-sm font-extrabold text-gold-300 hover:underline">Boshlash</Link> : <TaklifTugmalari id={d.id} />}
                izoh={`${d.men_chaqiruvchi ? "siz chaqirdingiz" : "sizni chaqirdi"} · ${qolganVaqt(d.muddat)}`}
              />
            ))}
          </Blok>
          <Blok sarlavha="Faol duellar" bosh={faol.length === 0} bosXabar="Faol duel yo‘q.">
            {faol.map((d) => (
              <Qator key={d.id} d={d} izoh={d.raqib_boshladi ? "ikkalangiz ishlayapsiz" : `raqib hali kirmagan · ${qolganVaqt(d.muddat)}`} amal={<Link href={`/duel/${d.id}`} className="text-sm font-extrabold text-gold-300 hover:underline">Davom ettirish</Link>} />
            ))}
          </Blok>
          {kutilayotgan.length > 0 ? (
            <Blok sarlavha="Kutilayotgan duellar" bosh={false} bosXabar="">
              {kutilayotgan.map((d) => (
                <Qator key={d.id} d={d} izoh="javob kutilmoqda" amal={<Link href={`/duel/${d.id}`} className="text-sm font-extrabold text-gold-300 hover:underline">Ochish</Link>} />
              ))}
            </Blok>
          ) : null}
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="raqib-sarlavha">
        <h2 id="raqib-sarlavha" className="mb-4 text-xl font-black">Raqib tanlash</h2>
        {raqiblar.length === 0 ? (
          <EmptyState sarlavha="Hozircha boshqa foydalanuvchi yo‘q" izoh="Birinchi do‘stlaringiz qo‘shilgach, ularni shu yerdan duelga chaqira olasiz." />
        ) : (
          <RaqiblarRoyxati raqiblar={raqiblar} />
        )}
      </section>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <TopRoyxati qatorlar={haftalik} haftalik bosh="Haftalik TOP 10" />
        <TopRoyxati qatorlar={top} bosh="Umumiy reyting TOP 10" />
      </div>

      <section className="mt-10" aria-labelledby="tarix-sarlavha">
        <h2 id="tarix-sarlavha" className="mb-4 text-xl font-black">Duel tarixi</h2>
        {tarix.length === 0 ? (
          <EmptyState sarlavha="Hali duel o‘ynalmagan" izoh="Birinchi duelingiz natijasi shu yerda saqlanadi." />
        ) : (
          <ul className="space-y-2">
            {tarix.map((d) => (
              <li key={d.id}>
                <Qator d={d} izoh={tarixIzohi(d, profil.id)} amal={<Link href={`/duel/${d.id}`} className="text-sm font-extrabold text-gold-300 hover:underline">Ko‘rish</Link>} sarlavhaLi={false} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}

function qolganVaqt(muddat: string) {
  const ms = Date.parse(muddat) - Date.now();
  if (ms <= 0) return "muddat tugayapti";
  const s = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return s > 0 ? `${s} soat ${m} daqiqa qoldi` : `${m} daqiqa qoldi`;
}

function tarixIzohi(d: DuelQatori, menId: string) {
  if (d.holat === "rad") return "Rad etilgan";
  if (d.holat === "bekor") return "Bekor qilingan";
  const natija = d.galib_id === null ? "Durang" : d.galib_id === menId ? "G‘alaba" : "Mag‘lubiyat";
  const oz = d.mening_ozgarishim ?? 0;
  return `${natija} · ${d.mening_ballim ?? 0}:${d.raqib_ball ?? 0} · ${oz > 0 ? `+${oz}` : oz} reyting`;
}

function Blok({ sarlavha, bosh, bosXabar, children }: { sarlavha: string; bosh: boolean; bosXabar: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-black">{sarlavha}</h2>
      {bosh ? <p className="surface-card p-5 text-sm text-fg-muted">{bosXabar}</p> : <ul className="space-y-2">{children}</ul>}
    </section>
  );
}

function Qator({ d, izoh, amal, sarlavhaLi = true }: { d: DuelQatori; izoh: string; amal: React.ReactNode; sarlavhaLi?: boolean }) {
  const ichi = (
    <div className="surface-card flex items-center gap-3 p-3.5">
      <MuallifAvatari ism={d.raqib.toliq_ism} url={d.raqib.avatar_url} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">{sarlavhaLi ? `${d.raqib.toliq_ism} — ${izoh}` : d.raqib.toliq_ism}</p>
        <p className="truncate text-xs text-fg-muted">
          {sarlavhaLi ? `${yonalishNomi(d.yonalish)} · ${qiyinlikNomi(d.qiyinlik)}` : `${yonalishNomi(d.yonalish)} · ${qiyinlikNomi(d.qiyinlik)} · ${izoh}`}
        </p>
      </div>
      {amal}
    </div>
  );
  return sarlavhaLi ? <li>{ichi}</li> : ichi;
}
