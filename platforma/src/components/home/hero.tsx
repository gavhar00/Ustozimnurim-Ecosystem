"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Code2, Lightbulb, Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { MASKOT } from "@/lib/maskot";

/** Maskot atrofida suzuvchi kichik ikonalar. */
const SUZUVCHI = [
  { Ikona: Lightbulb, joy: "right-[4%] top-[8%]", kechikish: 0 },
  { Ikona: Code2, joy: "right-[2%] top-[42%]", kechikish: 0.6 },
  { Ikona: BookOpen, joy: "left-[2%] top-[26%]", kechikish: 1.2 },
  { Ikona: Play, joy: "right-[12%] bottom-[10%]", kechikish: 1.8 },
];

export function Hero() {
  const kamHarakat = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pt-16">
      {/* Fon nuri */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-18%] -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gold-500/12 blur-[120px]"
      />

      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <motion.div
          initial={kamHarakat ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-balance text-[2.6rem] font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]">
            <span className="text-gold-gradient">Ustozim</span>{" "}
            <span className="text-fg">Nurim</span>
            <span className="mt-1 block text-[1.9rem] font-extrabold text-fg sm:text-4xl lg:text-[2.7rem]">
              Bilim sari birga!
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-fg-muted sm:text-lg">
            Bu platformada o‘zingizga mos kursni topasiz, darsni tomosha
            qilayotib kod yozasiz va kelajak kasbingizni o‘zbek tilida
            egallaysiz.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/kurslar" size="lg">
              Boshlash
              <ArrowRight className="size-4.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/kurslar" size="lg" variant="outline">
              <span className="mr-1 inline-flex size-7 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                <Play className="size-3.5 fill-current" aria-hidden="true" />
              </span>
              Qanday ishlaydi
            </ButtonLink>
          </div>

          <p className="mt-7 flex items-center gap-2.5 text-sm text-fg-muted">
            <span className="inline-block size-2 animate-pulse rounded-full bg-gold-400" />
            Hozircha barcha kurslar va manbalar bepul ochiq.
          </p>
        </motion.div>

        {/* Maskot maydoni */}
        <motion.div
          initial={kamHarakat ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="relative mx-auto aspect-square w-full max-w-[460px]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-[12%] rounded-full bg-gold-400/10 blur-3xl"
          />

          <MaskotOrni />

          {SUZUVCHI.map(({ Ikona, joy, kechikish }, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className={`absolute ${joy} inline-flex size-12 items-center justify-center rounded-2xl border border-border-strong bg-ink-800/80 text-gold-300 backdrop-blur-sm sm:size-14`}
              animate={kamHarakat ? undefined : { y: [0, -12, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: kechikish,
              }}
            >
              <Ikona className="size-5 sm:size-6" />
            </motion.span>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/**
 * Maskot rasmi `src/lib/maskot.ts` da yo‘l ko‘rsatilgach avtomatik chiqadi.
 * Yo‘l bo‘lmasa — oltin doira ko‘rinishidagi joy egallab turadi (soxta rasm emas).
 */
function MaskotOrni() {
  const manba = MASKOT.hero;

  if (manba) {
    return (
      <Image
        src={manba}
        alt="UstozimNurim maskoti — noutbuk oldida o‘tirgan momiq oltin personaj"
        fill
        priority
        sizes="(max-width: 1024px) 80vw, 460px"
        className="animate-float object-contain"
      />
    );
  }

  return (
    <div className="absolute inset-[8%] flex flex-col items-center justify-center gap-3 rounded-full border border-dashed border-border-strong bg-ink-850/50 text-center">
      <span className="text-5xl" aria-hidden="true">
        ✨
      </span>
      <p className="max-w-[60%] text-sm font-semibold text-fg-muted">
        Maskot rasmi shu yerga qo‘yiladi
      </p>
    </div>
  );
}
