import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { ChopEtishTugmasi } from "@/components/sertifikat/chop-etish-tugmasi";
import { Container } from "@/components/ui/primitives";
import { supabaseServer } from "@/lib/supabase/server";

type Props = { params: Promise<{ kod: string }> };

const KOD_SHAKLI = /^UN-[A-Z0-9]{10}$/;

async function sertifikatTopish(kod: string) {
  const toza = kod.trim().toUpperCase();
  if (!KOD_SHAKLI.test(toza)) return null;

  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("sertifikat_tekshir", {
    p_kod: toza,
  });
  if (error) {
    console.error("Sertifikatni tekshirishda xato:", error.message);
    return null;
  }

  const qator = (data ?? [])[0] as
    | { toliq_ism: string; kurs_nomi: string; berilgan: string }
    | undefined;
  return qator ? { ...qator, kod: toza } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  const s = await sertifikatTopish(kod);
  return {
    title: s ? `${s.toliq_ism} — ${s.kurs_nomi} sertifikati` : "Sertifikat",
    robots: { index: false, follow: false },
  };
}

export default async function SertifikatSahifasi({ params }: Props) {
  const { kod } = await params;
  const s = await sertifikatTopish(kod);
  if (!s) notFound();

  const sana = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(s.berilgan));

  return (
    <Container className="py-8 sm:py-12">
      {/* Chop etishda sayt bezagi yashiriladi, sertifikat oq qog'ozda chiqadi */}
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          header, footer, nav, .chop-yashir { display: none !important; }
          html, body { background: #fff !important; }
          body::before { display: none !important; }
          .sertifikat-varaq { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; width: 100vw !important; max-width: none !important; }
        }
        .sertifikat-varaq { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      <div className="chop-yashir mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-gold-300">
          <BadgeCheck className="size-5" aria-hidden="true" />
          Haqiqiy sertifikat — UstozimNurim bazasida tasdiqlangan
        </p>
        <ChopEtishTugmasi />
      </div>

      <article
        aria-label="Sertifikat"
        style={{
          width: "min(100%, 56rem, max(22rem, calc((100svh - 15rem) * 1.414)))",
          containerType: "inline-size",
        }}
        className="sertifikat-varaq relative mx-auto aspect-[1.414/1] max-sm:aspect-[3/4] overflow-hidden rounded-2xl bg-[#fbf7ef] p-3 text-[#1b1410] shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)] sm:p-5"
      >
        <div className="relative flex size-full flex-col items-center justify-between rounded-xl border-2 border-gold-500 px-[max(1.25rem,6cqw)] py-[max(1.25rem,3.6cqw)] text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-1.5 rounded-lg border border-gold-400/60 sm:inset-2.5"
          />

          <div className="flex flex-col items-center gap-1.5">
            <LogoMark size={44} />
            <p className="text-[max(0.8rem,1.9cqw)] font-extrabold tracking-tight">
              Ustozim<span className="text-gold-600">Nurim</span>
            </p>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-[max(0.6rem,1.4cqw)] font-bold uppercase tracking-[0.35em] text-gold-700">
              Sertifikat
            </p>
            <p className="mt-[1.2cqw] text-[max(0.7rem,1.7cqw)] text-[#5d5141]">
              Ushbu sertifikat egasi
            </p>
            <h1 className="mt-[0.6cqw] max-w-full text-balance text-[max(1.25rem,5.2cqw)] font-black leading-tight text-[#1b1410]">
              {s.toliq_ism}
            </h1>
            <div
              aria-hidden="true"
              className="my-[1.6cqw] h-px w-[16cqw] bg-gold-500"
            />
            <p className="text-[max(0.7rem,1.7cqw)] text-[#5d5141]">
              quyidagi kursni muvaffaqiyatli tugatdi:
            </p>
            <p className="mt-[0.6cqw] max-w-full text-balance text-[max(0.95rem,3.3cqw)] font-extrabold text-gold-700">
              {s.kurs_nomi}
            </p>
          </div>

          <div className="flex w-full items-end justify-between gap-3 text-left text-[max(0.58rem,1.35cqw)] text-[#5d5141]">
            <div>
              <p className="font-bold text-[#1b1410]">{sana}</p>
              <p>Berilgan sana</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-[#1b1410]">{s.kod}</p>
              <p>Tekshiruv kodi: /sertifikat/{s.kod}</p>
            </div>
          </div>
        </div>
      </article>

      <p className="chop-yashir mx-auto mt-5 max-w-4xl text-center text-sm text-fg-muted">
        Sertifikat haqiqiyligini tekshirish uchun shu sahifa havolasini ulashing:
        kod orqali ochilganda ism, kurs va sana bazadan ko‘rsatiladi.
      </p>
    </Container>
  );
}
