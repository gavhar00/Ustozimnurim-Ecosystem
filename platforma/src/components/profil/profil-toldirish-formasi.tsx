"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, LoaderCircle, Sparkles } from "lucide-react";
import {
  profilniYakunla,
  qoralamaniSaqla,
  usernameBoshmi,
} from "@/app/profil/toldirish/amallar";
import { RasmYuklash } from "@/components/panel/rasm-yuklash";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import {
  ONBOARDING_KASBLAR,
  USERNAME_SHAKLI,
  toldirishProgressi,
  toldirishXatolari,
  type ToldirishQiymatlari,
  type ToldirishXatolari,
} from "@/lib/profil-toldirish";
import { DARAJA_NOMI, MAQSAD_TURLARI, QIZIQISHLAR } from "@/lib/turlar";
import { cn } from "@/lib/utils";

const maydonSinfi =
  "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-sm text-fg placeholder:text-muted-soft focus:border-gold-400 focus:outline-none";
const chipSinfi =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2 focus-within:ring-offset-ink-950";

type Saqlash = "bosh" | "saqlanmoqda" | "saqlandi" | "xato";
type UsernameHolati = { turi: "bosh" | "tekshirilmoqda" | "band" | "yaroqli" | "xato"; xabar?: string };

function Sarlavha({ nom, majburiy }: { nom: string; majburiy: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      {nom}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
          majburiy ? "bg-gold-400/15 text-gold-300" : "bg-ink-700 text-fg-muted",
        )}
      >
        {majburiy ? "Majburiy" : "Ixtiyoriy"}
      </span>
    </span>
  );
}

function MaydonXatosi({ matn }: { matn?: string }) {
  return matn ? (
    <p role="alert" className="mt-1.5 text-xs text-[#ffb3ad]">
      {matn}
    </p>
  ) : null;
}

export function ProfilToldirishFormasi({
  boshlangich,
  yonalishlar,
  profilId,
  avatarUrl,
  nextManzil,
}: {
  boshlangich: ToldirishQiymatlari;
  yonalishlar: { slug: string; nom: string }[];
  profilId: string;
  avatarUrl: string | null;
  nextManzil: string;
}) {
  const [q, setQ] = useState<ToldirishQiymatlari>(boshlangich);
  const [saqlash, setSaqlash] = useState<Saqlash>("bosh");
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [urinildi, setUrinildi] = useState(false);
  const [serverXatolari, setServerXatolari] = useState<ToldirishXatolari>({});
  const [username, setUsername] = useState<UsernameHolati>({ turi: "bosh" });

  const saqlashTaymeri = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameTaymeri = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oxirgiUsernameSoragi = useRef(0);
  const yakunlandi = useRef(false);

  useEffect(
    () => () => {
      if (saqlashTaymeri.current) clearTimeout(saqlashTaymeri.current);
      if (usernameTaymeri.current) clearTimeout(usernameTaymeri.current);
    },
    [],
  );

  const { bosqichlar, foiz } = toldirishProgressi(q);
  const xatolar = { ...toldirishXatolari(q), ...serverXatolari };
  const korsatXato = (kalit: keyof ToldirishQiymatlari) =>
    urinildi || serverXatolari[kalit] ? xatolar[kalit] : undefined;

  async function qoralamaYoz(qiymat: ToldirishQiymatlari) {
    if (yakunlandi.current) return;
    setSaqlash("saqlanmoqda");
    const natija = await qoralamaniSaqla(qiymat);
    if (yakunlandi.current) return;
    setSaqlash(natija.muvaffaqiyat ? "saqlandi" : "xato");
  }

  function usernameniTekshir(nom: string) {
    if (usernameTaymeri.current) clearTimeout(usernameTaymeri.current);
    if (!nom) return setUsername({ turi: "bosh" });
    if (!USERNAME_SHAKLI.test(nom)) {
      return setUsername({
        turi: "xato",
        xabar: "3–20 ta belgi: kichik lotin harflari, raqamlar va pastki chiziq.",
      });
    }
    setUsername({ turi: "tekshirilmoqda" });
    const nobat = ++oxirgiUsernameSoragi.current;
    usernameTaymeri.current = setTimeout(async () => {
      const natija = await usernameBoshmi(nom);
      if (nobat !== oxirgiUsernameSoragi.current) return;
      setUsername(
        natija.bosh
          ? { turi: "yaroqli", xabar: "Bu nom bo‘sh." }
          : { turi: natija.xato?.includes("band") ? "band" : "xato", xabar: natija.xato },
      );
    }, 450);
  }

  /** Har bir o‘zgarishda holatni yangilaydi va qoralamani 1,2 soniyadan so‘ng saqlaydi. */
  function ozgartir(qism: Partial<ToldirishQiymatlari>) {
    const yangi = { ...q, ...qism };
    setQ(yangi);
    setServerXatolari({});
    setXato(null);
    if (qism.username !== undefined) usernameniTekshir(yangi.username);
    if (saqlashTaymeri.current) clearTimeout(saqlashTaymeri.current);
    saqlashTaymeri.current = setTimeout(() => void qoralamaYoz(yangi), 1200);
  }

  function qiziqishniAlmashtir(nom: string) {
    ozgartir({
      qiziqishlar: q.qiziqishlar.includes(nom)
        ? q.qiziqishlar.filter((x) => x !== nom)
        : [...q.qiziqishlar, nom],
    });
  }

  async function yuborish(e: React.FormEvent) {
    e.preventDefault();
    setUrinildi(true);
    setXato(null);
    if (saqlashTaymeri.current) clearTimeout(saqlashTaymeri.current);

    if (Object.keys(toldirishXatolari(q)).length > 0) {
      setXato("Majburiy maydonlarni to‘ldiring — ular qizil rangda ko‘rsatilgan.");
      return;
    }
    if (username.turi === "band" || username.turi === "tekshirilmoqda") {
      setXato("Foydalanuvchi nomini tekshirib bo‘lmadi yoki band. Boshqasini tanlang.");
      return;
    }

    setYuborilmoqda(true);
    const natija = await profilniYakunla(q);
    if (natija.muvaffaqiyat) {
      yakunlandi.current = true;
      // To‘liq sahifa almashtirish: sessiya cookie'lari va profil holati serverga yetib borsin.
      window.location.assign(nextManzil);
      return;
    }
    setYuborilmoqda(false);
    setServerXatolari(natija.maydonXatolari ?? {});
    setXato(natija.xato ?? "Saqlab bo‘lmadi. Qayta urinib ko‘ring.");
  }

  return (
    <form onSubmit={yuborish} noValidate className="space-y-6">
      <section className="surface-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-gold-300">
              <Sparkles className="size-4" aria-hidden="true" />
              Bir martalik qadam
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Profilingizni tanishtiring</h1>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Bu ma’lumotlarni faqat bir marta so‘raymiz. Tugatgach, to‘g‘ridan-to‘g‘ri hamjamiyat
              lentasiga o‘tasiz. Yozganlaringiz avtomatik saqlanadi — sahifani yangilasangiz ham
              yo‘qolmaydi.
            </p>
          </div>
          <div
            className="grid size-24 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-gold-400) ${foiz}%, var(--border-subtle) 0)`,
            }}
            role="img"
            aria-label={`Majburiy maydonlar ${foiz}% to‘ldirilgan`}
          >
            <div className="grid size-[76px] place-items-center rounded-full bg-bg-card text-xl font-black">
              {foiz}%
            </div>
          </div>
        </div>

        <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2" aria-label="To‘ldirish bosqichlari">
          {bosqichlar.map((b) => (
            <li
              key={b.kalit}
              className={cn(
                "flex items-center gap-2 text-sm",
                b.bajarilgan ? "text-fg" : "text-fg-muted",
              )}
            >
              {b.bajarilgan ? (
                <CheckCircle2 className="size-4 text-gold-300" aria-hidden="true" />
              ) : (
                <Circle className="size-4" aria-hidden="true" />
              )}
              {b.nom}
              <span className="sr-only">{b.bajarilgan ? " — bajarildi" : " — hali to‘ldirilmagan"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-fg-muted" aria-live="polite">
          {saqlash === "saqlanmoqda" && "Qoralama saqlanmoqda…"}
          {saqlash === "saqlandi" && "Qoralama saqlandi."}
          {saqlash === "xato" && "Qoralamani saqlab bo‘lmadi — internetni tekshiring."}
        </p>
      </section>

      {xato ? <FormXabar>{xato}</FormXabar> : null}

      <section className="surface-card grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold">Siz haqingizda</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ism"><Sarlavha nom="Ism" majburiy /></Label>
              <Input id="ism" value={q.ism} onChange={(e) => ozgartir({ ism: e.target.value })} maxLength={60} autoComplete="given-name" aria-invalid={Boolean(korsatXato("ism"))} />
              <MaydonXatosi matn={korsatXato("ism")} />
            </div>
            <div>
              <Label htmlFor="familiya"><Sarlavha nom="Familiya" majburiy /></Label>
              <Input id="familiya" value={q.familiya} onChange={(e) => ozgartir({ familiya: e.target.value })} maxLength={60} autoComplete="family-name" aria-invalid={Boolean(korsatXato("familiya"))} />
              <MaydonXatosi matn={korsatXato("familiya")} />
            </div>
          </div>

          <div>
            <Label htmlFor="username"><Sarlavha nom="Foydalanuvchi nomi" majburiy /></Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-soft" aria-hidden="true">@</span>
              <Input
                id="username"
                value={q.username}
                onChange={(e) => ozgartir({ username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                maxLength={20}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="pl-9"
                aria-invalid={Boolean(korsatXato("username")) || username.turi === "band"}
                aria-describedby="username-izoh"
              />
            </div>
            <p id="username-izoh" aria-live="polite" className={cn("mt-1.5 text-xs", username.turi === "yaroqli" ? "text-[#9fe4c2]" : username.turi === "band" || username.turi === "xato" ? "text-[#ffb3ad]" : "text-fg-muted")}>
              {username.turi === "tekshirilmoqda" ? "Tekshirilmoqda…" : username.xabar ?? "Profil havolangiz shu nom bilan bo‘ladi."}
            </p>
            <MaydonXatosi matn={korsatXato("username")} />
          </div>

          <div>
            <Label htmlFor="bio"><Sarlavha nom="Qisqacha bio" majburiy /></Label>
            <textarea id="bio" value={q.bio} onChange={(e) => ozgartir({ bio: e.target.value })} maxLength={500} rows={3} className={maydonSinfi} placeholder="Siz kimsiz va nimaga qiziqasiz?" aria-invalid={Boolean(korsatXato("bio"))} />
            <div className="flex justify-between"><MaydonXatosi matn={korsatXato("bio")} /><span className="ml-auto mt-1.5 text-xs text-fg-muted">{q.bio.length}/500</span></div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-champagne"><Sarlavha nom="Profil rasmi" majburiy={false} /></h3>
          <RasmYuklash turi="avatar" joriyUrl={avatarUrl} foydalanuvchiId={profilId} />
        </div>
      </section>

      <section className="surface-card space-y-5 p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">Kasb va tajriba</h2>
        <fieldset aria-invalid={Boolean(korsatXato("kasb"))}>
          <legend className="mb-3 text-sm font-bold"><Sarlavha nom="Hozir kimsiz?" majburiy /></legend>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_KASBLAR.map((kasb) => (
              <label key={kasb} className={cn(chipSinfi, q.kasb === kasb ? "border-gold-400 bg-gold-400/10" : "border-border-subtle hover:border-gold-400/60")}>
                <input type="radio" name="kasb" value={kasb} checked={q.kasb === kasb} onChange={() => ozgartir({ kasb })} className="accent-gold-400" />
                {kasb}
              </label>
            ))}
          </div>
          <MaydonXatosi matn={korsatXato("kasb")} />
        </fieldset>
        <div>
          <Label htmlFor="talim"><Sarlavha nom="Ta’lim muassasasi yoki ish joyi" majburiy={false} /></Label>
          <Input id="talim" value={q.talim} onChange={(e) => ozgartir({ talim: e.target.value })} maxLength={150} placeholder="Masalan, 21-maktab yoki TATU" />
        </div>
        <fieldset aria-invalid={Boolean(korsatXato("tajriba"))}>
          <legend className="mb-3 text-sm font-bold"><Sarlavha nom="Tajriba darajasi" majburiy /></legend>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(DARAJA_NOMI) as [string, string][]).map(([kalit, nom]) => (
              <label key={kalit} className={cn(chipSinfi, q.tajriba === kalit ? "border-gold-400 bg-gold-400/10" : "border-border-subtle hover:border-gold-400/60")}>
                <input type="radio" name="tajriba" value={kalit} checked={q.tajriba === kalit} onChange={() => ozgartir({ tajriba: kalit })} className="accent-gold-400" />
                {nom}
              </label>
            ))}
          </div>
          <MaydonXatosi matn={korsatXato("tajriba")} />
        </fieldset>
      </section>

      <section className="surface-card space-y-5 p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">IT qiziqishlari va maqsad</h2>
        <fieldset aria-invalid={Boolean(korsatXato("qiziqishlar"))}>
          <legend className="mb-3 text-sm font-bold"><Sarlavha nom="Qiziqishlaringiz" majburiy /></legend>
          <div className="flex flex-wrap gap-2">
            {QIZIQISHLAR.map((nom) => (
              <label key={nom} className={cn(chipSinfi, q.qiziqishlar.includes(nom) ? "border-gold-400 bg-gold-400/10" : "border-border-subtle hover:border-gold-400/60")}>
                <input type="checkbox" checked={q.qiziqishlar.includes(nom)} onChange={() => qiziqishniAlmashtir(nom)} className="accent-gold-400" />
                {nom}
              </label>
            ))}
          </div>
          <MaydonXatosi matn={korsatXato("qiziqishlar")} />
        </fieldset>
        <div>
          <Label htmlFor="konikmalar"><Sarlavha nom="Ko‘nikma va texnologiyalar" majburiy={false} /></Label>
          <Input id="konikmalar" value={q.konikmalar} onChange={(e) => ozgartir({ konikmalar: e.target.value })} maxLength={300} placeholder="HTML, CSS, JavaScript, Figma" />
          <p className="mt-1 text-xs text-fg-muted">Vergul bilan ajrating.</p>
        </div>
        <div>
          <Label htmlFor="maqsad"><Sarlavha nom="O‘qish maqsadingiz" majburiy /></Label>
          <textarea id="maqsad" value={q.maqsad} onChange={(e) => ozgartir({ maqsad: e.target.value })} maxLength={400} rows={3} className={maydonSinfi} placeholder="Yaqin kelajakda nimalarga erishmoqchisiz?" aria-invalid={Boolean(korsatXato("maqsad"))} />
          <MaydonXatosi matn={korsatXato("maqsad")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="yonalish"><Sarlavha nom="Qaysi yo‘nalish qiziqtiradi?" majburiy={false} /></Label>
            <select id="yonalish" value={q.tanlangan_yonalish} onChange={(e) => ozgartir({ tanlangan_yonalish: e.target.value })} className="h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg">
              <option value="">Hali aniq emas</option>
              {yonalishlar.map((y) => (<option key={y.slug} value={y.slug}>{y.nom}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="maqsad-turi"><Sarlavha nom="Asosiy yo‘nalish turi" majburiy={false} /></Label>
            <select id="maqsad-turi" value={q.maqsad_turi} onChange={(e) => ozgartir({ maqsad_turi: e.target.value })} className="h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg">
              <option value="">Tanlanmagan</option>
              {(Object.entries(MAQSAD_TURLARI) as [string, string][]).map(([k, nom]) => (<option key={k} value={k}>{nom}</option>))}
            </select>
          </div>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">Havolalar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="github"><Sarlavha nom="GitHub" majburiy={false} /></Label>
            <Input id="github" inputMode="url" value={q.github} onChange={(e) => ozgartir({ github: e.target.value })} maxLength={200} placeholder="github.com/foydalanuvchi" aria-invalid={Boolean(korsatXato("github"))} />
            <MaydonXatosi matn={korsatXato("github")} />
          </div>
          <div>
            <Label htmlFor="portfolio"><Sarlavha nom="Portfolio" majburiy={false} /></Label>
            <Input id="portfolio" inputMode="url" value={q.portfolio} onChange={(e) => ozgartir({ portfolio: e.target.value })} maxLength={200} placeholder="sizning-saytingiz.uz" aria-invalid={Boolean(korsatXato("portfolio"))} />
            <MaydonXatosi matn={korsatXato("portfolio")} />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-fg-muted">Keyin ma’lumotlarni profil sozlamalarida o‘zgartirishingiz mumkin.</p>
        <Button type="submit" size="lg" disabled={yuborilmoqda} className="min-h-12">
          {yuborilmoqda ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
          {yuborilmoqda ? "Saqlanmoqda…" : "Tugatish va lentaga o‘tish"}
        </Button>
      </div>
    </form>
  );
}
