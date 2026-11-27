import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Code2, Clock, XCircle } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { AmaliyotMuharriri } from "@/components/amaliyot/amaliyot-muharriri";
import { VazifaPaneli } from "@/components/amaliyot/vazifa-paneli";
import { profilTalabQil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { meningVazifalarim } from "@/lib/data/vazifalar";
import { vazifaHolati } from "@/lib/vazifa-turlari";
import type { SaqlanganKod } from "@/lib/amaliyot-turlari";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Amaliyot",
  robots: { index: false, follow: false },
};

export default async function AmaliyotSahifasi({ searchParams }: { searchParams: Promise<{ bolim?: string }> }) {
  const profil = await profilTalabQil("/amaliyot");
  const { bolim } = await searchParams;
  const erkin = bolim === "erkin";

  const sarlavha = (
    <>
      <h1 className="mb-1 inline-flex items-center gap-2 text-2xl font-black sm:text-3xl">
        <Code2 className="size-7 text-gold-300" aria-hidden="true" /> Amaliyot
      </h1>
      <div role="tablist" aria-label="Amaliyot bo‘limlari" className="my-4 flex w-fit gap-1 rounded-full border border-border-subtle p-0.5">
        {[
          ["vazifa", "Vazifalar", "/amaliyot"],
          ["erkin", "Erkin muharrir", "/amaliyot?bolim=erkin"],
        ].map(([k, n, h]) => (
          <Link
            key={k}
            href={h}
            role="tab"
            aria-selected={(k === "erkin") === erkin}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-extrabold transition-colors",
              (k === "erkin") === erkin ? "bg-gold-400 text-ink-950" : "text-fg-muted hover:text-fg",
            )}
          >
            {n}
          </Link>
        ))}
      </div>
    </>
  );

  if (erkin) {
    const supabase = await supabaseServer();
    const { data } = supabase
      ? await supabase
          .from("amaliyot_kodlari")
          .select("id, nom, til, html, css, js, python, yangilangan")
          .eq("profil_id", profil.id)
          .order("yangilangan", { ascending: false })
          .limit(50)
      : { data: null };
    return (
      <Container className="max-w-6xl py-6 sm:py-8">
        {sarlavha}
        <p className="mb-5 max-w-2xl text-sm text-fg-muted">
          Kod yozing va natijani darrov ko‘ring. Barcha kod brauzeringizda, ajratilgan oynada ishlaydi — serverda emas.
        </p>
        <AmaliyotMuharriri saqlanganlar={(data ?? []) as SaqlanganKod[]} />
      </Container>
    );
  }

  const { vazifalar, urinishlar, xato } = await meningVazifalarim(profil.id);
  const hozir = new Date().getTime();
  const holatlar = vazifalar.map((v) => {
    const u = urinishlar.find((x) => x.vazifa_id === v.id);
    return { v, u, h: vazifaHolati(u, hozir) };
  });
  const faol = holatlar.find((x) => x.h === "faol");
  const keyingi = holatlar.find((x) => x.h === "kutmoqda");
  const bajarilgan = holatlar.filter((x) => x.h === "topshirilgan").length;

  return (
    <Container className="max-w-6xl py-6 sm:py-8">
      {sarlavha}

      {xato ? (
        <p role="alert" className="surface-card p-5 text-sm text-fg-muted">Vazifalarni yuklab bo‘lmadi. Sahifani yangilang.</p>
      ) : vazifalar.length === 0 ? (
        <div className="surface-card p-6 text-center">
          <ClipboardList className="mx-auto mb-2 size-8 text-gold-300" aria-hidden="true" />
          <p className="font-extrabold">Hozircha vazifa yo‘q</p>
          <p className="mt-1 text-sm text-fg-muted">Ustoz vazifa qo‘shganda shu yerda ko‘rinadi. Bu orada «Erkin muharrir»da mashq qilishingiz mumkin.</p>
        </div>
      ) : faol ? (
        <>
          <VazifaPaneli vazifa={faol.v} holat="faol" muddat={faol.u!.muddat} />
          <AmaliyotMuharriri
            key={faol.v.id}
            saqlanganlar={[]}
            vazifa={{
              id: faol.v.id,
              til: faol.u!.til,
              html: faol.u!.html,
              css: faol.u!.css,
              js: faol.u!.js,
              python: faol.u!.python,
            }}
          />
        </>
      ) : keyingi ? (
        <VazifaPaneli vazifa={keyingi.v} holat="kutmoqda" keyingiBor={bajarilgan > 0 || holatlar.some((x) => x.h === "otkazilgan")} />
      ) : (
        <div className="surface-card p-6 text-center">
          <CheckCircle2 className="mx-auto mb-2 size-8 text-gold-300" aria-hidden="true" />
          <p className="font-extrabold">Hozirgi vazifalarning barchasi bajarildi</p>
          <p className="mt-1 text-sm text-fg-muted">Yangi vazifa qo‘shilganda shu yerda paydo bo‘ladi.</p>
        </div>
      )}

      {holatlar.length > 0 ? (
        <section aria-labelledby="vazifalar-tarixi" className="mt-8">
          <h2 id="vazifalar-tarixi" className="mb-3 text-lg font-black">Barcha vazifalar</h2>
          <ul className="surface-card divide-y divide-border-subtle overflow-hidden">
            {holatlar.map(({ v, h }) => (
              <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-bold">№{v.tartib}. {v.nom}</span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 text-xs font-extrabold",
                    h === "topshirilgan" && "text-emerald-400",
                    h === "faol" && "text-gold-300",
                    h === "otkazilgan" && "text-red-400",
                    h === "kutmoqda" && "text-fg-muted",
                  )}
                >
                  {h === "topshirilgan" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : h === "otkazilgan" ? <XCircle className="size-4" aria-hidden="true" /> : <Clock className="size-4" aria-hidden="true" />}
                  {h === "topshirilgan" ? "Topshirilgan" : h === "faol" ? "Jarayonda" : h === "otkazilgan" ? "Muddat o‘tgan" : "Kutmoqda"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
