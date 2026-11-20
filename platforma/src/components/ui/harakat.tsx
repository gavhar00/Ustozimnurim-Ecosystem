"use client";

import * as React from "react";
import {
  animate,
  motion,
  MotionConfig,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "framer-motion";

const YUMSHOQ = [0.22, 1, 0.36, 1] as const;

/** Butun bo‘lim uchun: foydalanuvchi «harakatni kamaytirish»ni yoqqan bo‘lsa, animatsiya o‘chadi. */
export function HarakatSozlamasi({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Sahifa almashganda yengil paydo bo‘lish (template.tsx ichida ishlatiladi). */
export function SahifaOtishi({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: YUMSHOQ }}
    >
      {children}
    </motion.div>
  );
}

const royxatVariantlari: Variants = {
  yashirin: {},
  korinadi: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const elementVariantlari: Variants = {
  yashirin: { opacity: 0, y: 14 },
  korinadi: { opacity: 1, y: 0, transition: { duration: 0.38, ease: YUMSHOQ } },
};

/** Ichidagi <PaydoElement>lar birin-ketin paydo bo‘ladi. */
export function PaydoRoyxat({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "dl" | "section";
}) {
  const Komponent = motion[as] as typeof motion.div;
  return (
    <Komponent
      className={className}
      variants={royxatVariantlari}
      initial="yashirin"
      animate="korinadi"
    >
      {children}
    </Komponent>
  );
}

/** Ekranga kirganda (skroll qilinganda) bir marta paydo bo‘ladigan ro‘yxat. */
export function KorinibRoyxat({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "dl" | "section";
}) {
  const Komponent = motion[as] as typeof motion.div;
  return (
    <Komponent
      className={className}
      variants={royxatVariantlari}
      initial="yashirin"
      whileInView="korinadi"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
      {children}
    </Komponent>
  );
}

export function PaydoElement({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Komponent = motion[as] as typeof motion.div;
  return (
    <Komponent className={className} variants={elementVariantlari}>
      {children}
    </Komponent>
  );
}

/** Raqam 0 dan qiymatgacha sanab chiqadi. Harakat o‘chirilgan bo‘lsa, darhol qiymatni ko‘rsatadi. */
export function SanaydiganRaqam({ qiymat }: { qiymat: number }) {
  const kamHarakat = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const korindi = useInView(ref, { once: true });
  const qadam = useMotionValue(0);
  const yaxlit = useTransform(qadam, (v) => Math.round(v).toString());

  React.useEffect(() => {
    if (!korindi) return;
    if (kamHarakat) {
      qadam.set(qiymat);
      return;
    }
    const boshqaruv = animate(qadam, qiymat, { duration: 0.9, ease: YUMSHOQ });
    return () => boshqaruv.stop();
  }, [korindi, kamHarakat, qiymat, qadam]);

  return (
    <motion.span ref={ref}>
      {yaxlit}
    </motion.span>
  );
}

/** Jarayon chizig‘i chapdan o‘ngga to‘ladi. */
export function JarayonChizigi({
  foiz,
  etiket,
}: {
  foiz: number;
  etiket: string;
}) {
  return (
    <div
      className="h-2 overflow-hidden rounded-pill bg-ink-700/70"
      role="progressbar"
      aria-valuenow={foiz}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiket}
    >
      <motion.div
        className="h-full rounded-pill bg-linear-[90deg,var(--color-gold-300),var(--color-gold-500)]"
        initial={{ width: 0 }}
        animate={{ width: `${foiz}%` }}
        transition={{ duration: 0.8, ease: YUMSHOQ, delay: 0.15 }}
      />
    </div>
  );
}
