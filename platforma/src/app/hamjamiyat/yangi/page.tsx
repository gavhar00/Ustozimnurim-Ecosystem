import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, MessagesSquare } from "lucide-react";
import { MunozaraFormasi } from "@/components/hamjamiyat/munozara-formasi";
import { Container, SectionLabel } from "@/components/ui/primitives";
import { profilTalabQil } from "@/lib/auth";
import { turkumlar } from "@/app/hamjamiyat/amallar";

export const metadata: Metadata = {
  title: "Munozara ochish",
  robots: { index: false, follow: true },
};

export default async function YangiMunozaraSahifasi() {
  await profilTalabQil("/hamjamiyat/yangi");
  const royxat = await turkumlar();

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Yo‘l" className="mb-5">
        <Link
          href="/hamjamiyat"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-gold-300"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Hamjamiyat
        </Link>
      </nav>

      <SectionLabel icon={<MessagesSquare className="size-4" />}>
        Yangi munozara
      </SectionLabel>

      <h1 className="mt-5 text-balance text-3xl font-black leading-tight sm:text-4xl">
        Savolingizni <span className="text-gold-gradient">bering</span>
      </h1>
      <p className="mt-3 max-w-xl text-pretty leading-relaxed text-fg-muted">
        Aniq yozilgan savol tezroq javob oladi: nimani sinab ko‘rdingiz va
        qanday xato chiqdi — shuni ham qo‘shing.
      </p>

      <div className="mt-8 max-w-2xl">
        <MunozaraFormasi turkumlar={royxat} />
      </div>
    </Container>
  );
}
