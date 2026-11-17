"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import { darsniSaqla } from "@/app/dars/amallar";
import { kodniYurgiz } from "@/components/dars/kod-sandbox";
import { HtmlKorinish } from "@/components/dars/html-korinish";

type Natija = { turi: "chiqish" | "xato"; qatorlar: string[] } | null;

export function InteraktivDars({
  darsId,
  yoriqnoma,
  videoUrl,
  boshlangichKod,
  saqlanganKod,
  tugatilgan,
  keyingiHref,
}: {
  darsId: string;
  yoriqnoma: string | null;
  videoUrl: string | null;
  boshlangichKod: string | null;
  saqlanganKod: string | null;
  tugatilgan: boolean;
  keyingiHref: string | null;
}) {
  const asl = boshlangichKod ?? "// Kodni shu yerga yozing\n";
  // HTML/CSS darsi: boshlang‘ich kod teg bilan boshlansa, konsol o‘rniga
  // jonli ko‘rinish oynasi chiqadi.
  const htmlDarsi = /^\s*</.test(boshlangichKod ?? "");
  const [kod, setKod] = useState(saqlanganKod ?? asl);
  const [natija, setNatija] = useState<Natija>(null);
  const [xabar, setXabar] = useState<string | null>(null);
  const [sertKod, setSertKod] = useState<string | null>(null);
  const [bajarildi, setBajarildi] = useState(tugatilgan);
  const [kutilmoqda, startTransition] = useTransition();
  const [ishlamoqda, setIshlamoqda] = useState(false);

  async function ishgaTushir() {
    setIshlamoqda(true);
    setNatija(null);
    try {
      setNatija(await kodniYurgiz(kod));
    } finally {
      setIshlamoqda(false);
    }
  }

  function saqla(tugat: boolean) {
    setXabar(null);
    startTransition(async () => {
      const natija = await darsniSaqla(darsId, kod, tugat);
      if (natija.xato) {
        setXabar(natija.xato);
        return;
      }
      if (tugat) setBajarildi(true);
      if (natija.sertifikatKodi) setSertKod(natija.sertifikatKodi);
      setXabar(natija.muvaffaqiyat ?? null);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* Chap: video va yo'riqnoma */}
      <div className="space-y-5">
        {videoUrl ? (
          <div className="surface-card overflow-hidden p-0">
            <div className="aspect-video w-full bg-ink-900">
              {videoUrl.includes("youtube.com") ||
              videoUrl.includes("youtu.be") ? (
                <iframe
                  src={videoUrl.replace("watch?v=", "embed/")}
                  title="Dars videosi"
                  allowFullScreen
                  className="size-full"
                />
              ) : (
                <video src={videoUrl} controls className="size-full">
                  Brauzeringiz videoni qo&#8216;llab-quvvatlamaydi.
                </video>
              )}
            </div>
          </div>
        ) : null}

        <div className="surface-card p-6">
          <h2 className="text-lg font-extrabold">Yo&#8216;riqnoma</h2>
          {yoriqnoma ? (
            <div className="mt-3 whitespace-pre-line leading-relaxed text-fg-muted">
              {yoriqnoma}
            </div>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">
              Bu dars uchun yo&#8216;riqnoma kiritilmagan.
            </p>
          )}
        </div>
      </div>

      {/* O'ng: kod muharriri */}
      <div className="lg:sticky lg:top-24">
        <div className="surface-card overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </span>
            <span className="ml-1 rounded-md bg-ink-700/70 px-2.5 py-1 font-mono text-xs text-champagne">
              dars.js
            </span>
            {bajarildi ? (
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#9fe4c2]">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Tugatilgan
              </span>
            ) : null}
          </div>

          <label htmlFor="dars-kod" className="sr-only">
            Kod muharriri
          </label>
          <textarea
            id="dars-kod"
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            spellCheck={false}
            rows={14}
            className="w-full resize-y bg-transparent px-5 py-4 font-mono text-[0.86rem] leading-relaxed text-champagne outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setKod(asl);
                setNatija(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-fg"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Boshidan
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => saqla(false)}
                disabled={kutilmoqda}
              >
                <Save className="size-4" aria-hidden="true" />
                Saqlash
              </Button>
              {htmlDarsi ? null : (
                <Button
                  type="button"
                  size="sm"
                  onClick={ishgaTushir}
                  disabled={ishlamoqda}
                >
                  {ishlamoqda ? "Ishlamoqda…" : "Ishga tushirish"}
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>

          {htmlDarsi ? <HtmlKorinish kod={kod} /> : null}

          {!htmlDarsi && natija ? (
            <div
              role="status"
              aria-live="polite"
              className="border-t border-border-subtle bg-ink-900/70 px-5 py-4"
            >
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-muted">
                <Terminal className="size-3.5" aria-hidden="true" />
                Natija
              </p>
              <pre
                className={`overflow-x-auto font-mono text-[0.84rem] leading-relaxed ${
                  natija.turi === "xato" ? "text-[#ff8f87]" : "text-gold-200"
                }`}
              >
                {natija.qatorlar.join("\n")}
              </pre>
            </div>
          ) : null}
        </div>

        {xabar ? (
          <div className="mt-4">
            <FormXabar turi="muvaffaqiyat">{xabar}</FormXabar>
          </div>
        ) : null}

        {sertKod ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-400/50 bg-gold-400/10 p-4">
            <p className="inline-flex items-center gap-2 font-extrabold text-gold-200">
              <Award className="size-5" aria-hidden="true" />
              Tabriklaymiz! Kursni tugatdingiz.
            </p>
            <Link
              href={`/sertifikat/${sertKod}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-300 hover:text-gold-200"
            >
              Sertifikatni ochish
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => saqla(true)}
            disabled={kutilmoqda || bajarildi}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {bajarildi ? "Tugatilgan" : "Darsni tugatdim"}
          </Button>

          {keyingiHref ? (
            <Link
              href={keyingiHref}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-300 hover:text-gold-200"
            >
              Keyingi dars
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
