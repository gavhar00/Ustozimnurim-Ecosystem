"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Play, RotateCcw, Sparkles, Terminal } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, SectionLabel, SectionTitle } from "@/components/ui/primitives";
import { MASKOT } from "@/lib/maskot";

const BOSHLANGICH_KOD = `function salomlash(ism) {
  return "Salom, " + ism + "!";
}

console.log(salomlash("Nurim"));`;

type Natija = { turi: "chiqish" | "xato"; qatorlar: string[] } | null;

export function InteraktivPreview() {
  const [kod, setKod] = useState(BOSHLANGICH_KOD);
  const [natija, setNatija] = useState<Natija>(null);

  /** Foydalanuvchi yozgan kodni brauzerning o‘zida ishga tushiradi. */
  function ishgaTushir() {
    const qatorlar: string[] = [];
    const soxtaConsole = {
      log: (...argumentlar: unknown[]) =>
        qatorlar.push(
          argumentlar
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" "),
        ),
    };

    try {
      const bajar = new Function("console", kod);
      bajar(soxtaConsole);
      setNatija({
        turi: "chiqish",
        qatorlar: qatorlar.length ? qatorlar : ["(natija bo‘sh)"],
      });
    } catch (xato) {
      setNatija({
        turi: "xato",
        qatorlar: [xato instanceof Error ? xato.message : "Noma’lum xato"],
      });
    }
  }

  function tiklash() {
    setKod(BOSHLANGICH_KOD);
    setNatija(null);
  }

  return (
    <section className="py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
        {/* Muharrir */}
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
          </div>

          <label htmlFor="demo-kod" className="sr-only">
            Namuna kod muharriri
          </label>
          <textarea
            id="demo-kod"
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full resize-none bg-transparent px-5 py-4 font-mono text-[0.86rem] leading-relaxed text-champagne outline-none"
          />

          <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-4 py-3">
            <button
              type="button"
              onClick={tiklash}
              className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-fg"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Tiklash
            </button>

            <button
              type="button"
              onClick={ishgaTushir}
              className="inline-flex items-center gap-2 rounded-pill bg-linear-[98deg,var(--color-gold-200),var(--color-gold-400)_45%,var(--color-gold-500)] px-5 py-2.5 text-sm font-extrabold text-ink-950 transition-all hover:brightness-110"
            >
              Ishga tushirish
              <Play className="size-3.5 fill-current" aria-hidden="true" />
            </button>
          </div>

          {natija ? (
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

        {/* Matn */}
        <div className="relative">
          <SectionLabel icon={<Sparkles className="size-4" />}>
            Interaktiv ta’lim
          </SectionLabel>

          <SectionTitle className="mt-5">
            Tomosha qiling va{" "}
            <span className="text-gold-gradient">kod yozing!</span>
          </SectionTitle>

          <p className="mt-4 max-w-md text-pretty leading-relaxed text-fg-muted">
            Darsni to‘xtatib, o‘sha zahoti kodni tahrirlaysiz va natijani
            brauzerda darhol ko‘rasiz. Hech narsa o‘rnatish shart emas — chapdagi
            muharrirni hoziroq sinab ko‘ring.
          </p>

          <ButtonLink href="/kurslar" className="mt-7">
            Endi sinab ko‘ring
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>

          {MASKOT.interaktiv ? (
            <Image
              src={MASKOT.interaktiv}
              alt="UstozimNurim maskoti planshet bilan"
              width={220}
              height={220}
              className="pointer-events-none mt-8 animate-float select-none lg:absolute lg:-right-6 lg:-bottom-12 lg:mt-0"
            />
          ) : null}
        </div>
      </Container>
    </section>
  );
}
