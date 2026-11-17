"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Code2,
  FolderGit2,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { MASKOT } from "@/lib/maskot";

/** Maskot atrofidagi shisha kartalar — har biri haqiqiy bo‘limga olib boradi. */
const XUSUSIYATLAR = [
  { Ikona: Code2, nom: "Interaktiv darslar", href: "/kurslar", joy: "right-0 top-[8%] sm:right-[-2%] sm:top-[10%]", kechikish: 0 },
  { Ikona: FolderGit2, nom: "Amaliy loyihalar", href: "/hamjamiyat", joy: "left-0 top-[34%] sm:left-[-4%]", kechikish: 0.7 },
  { Ikona: Award, nom: "Sertifikatlar", href: "/kurslar", joy: "right-0 top-[56%] sm:right-[-4%] sm:top-[52%]", kechikish: 1.4 },
  { Ikona: Users, nom: "Hamjamiyat", href: "/hamjamiyat", joy: "left-[4%] bottom-[4%]", kechikish: 2.1 },
];

export function Hero() {
  const kamHarakat = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pt-16">
      {/* Fon nuri */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-18%] -z-10 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gold-500/14 blur-[130px]"
      />

      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <motion.div
          initial={kamHarakat ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="glass inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-bold text-champagne">
            <Sparkles className="size-4 text-gold-400" aria-hidden="true" />
            O‘zbek tilidagi ta’lim ekotizimi
          </span>

          <h1 className="mt-6 text-balance text-[2.7rem] font-black leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-[4.4rem]">
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

          <p className="glass mt-8 inline-flex items-center gap-2.5 rounded-pill px-4 py-2 text-sm text-fg-muted">
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
            className="absolute inset-[10%] rounded-full bg-gold-400/12 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="animate-orbit absolute inset-[2%] rounded-full border border-dashed border-gold-400/25"
          />
          <div
            aria-hidden="true"
            className="animate-orbit-slow absolute inset-[14%] rounded-full border border-gold-400/15"
          />

          <MaskotOrni />

          {XUSUSIYATLAR.map(({ Ikona, nom, href, joy, kechikish }) => (
            <motion.div
              key={nom}
              className={`absolute ${joy} z-10`}
              animate={kamHarakat ? undefined : { y: [0, -10, 0] }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: kechikish,
              }}
            >
              <Link
                href={href}
                className="glass lift flex items-center gap-2 rounded-2xl px-3 py-2 text-[0.8rem] sm:gap-2.5 sm:px-3.5 sm:py-2.5 sm:text-sm font-bold text-fg"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                  <Ikona className="size-4" aria-hidden="true" />
                </span>
                {nom}
              </Link>
            </motion.div>
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
