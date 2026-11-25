import type { Metadata } from "next";
import Link from "next/link";
import { Images } from "lucide-react";
import { LahzalarRoyxati } from "@/components/lahzalar/lahzalar-royxati";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { joriyProfil } from "@/lib/auth";
import { lahzalarLentasi } from "@/lib/data/lahzalar-lenta";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lahzalar",
  description:
    "UstozimNurim hamjamiyatining ochiq lentasi: fikrlar, hikoyalar va rasmlar. Yozish uchun hech kimning tasdig‘i kerak emas.",
};

type Props = { searchParams: Promise<{ tadbir?: string }> };

export default async function LahzalarSahifasi({ searchParams }: Props) {
  const { tadbir } = await searchParams;
  const [profil, supabase] = await Promise.all([joriyProfil(), supabaseServer()]);
  const natija = await lahzalarLentasi(profil?.id ?? null, null, tadbir ?? null);

  return (
    <>
      <PageHeader
        yorliq="Lahzalar"
        yorliqIkona={<Images className="size-4" />}
        sarlavha="Hamjamiyatimizdan"
        oltinQism="ochiq lahzalar"
        tavsif="Hamma ko‘ra oladi. Kirgan har bir a’zo 5000 so‘zgacha matn va rasm joylashi, yoqtirishi, izoh qoldirishi va repost qilishi mumkin — hech qanday tasdiqsiz."
      />
      <Container className="max-w-2xl pb-16">
        {tadbir ? (
          <p className="mb-5 text-sm">
            <Link href="/lahzalar" className="font-bold text-gold-300 hover:text-gold-200">
              ← Barcha lahzalar
            </Link>
          </p>
        ) : null}
        <LahzalarRoyxati
          boshlangich={natija.lahzalar}
          davomi={natija.davomi}
          yuklashXatosi={natija.xato || !supabase}
          tadbir={tadbir ?? null}
          toldirilmagan={!!profil && !profil.toldirilgan}
          men={
            profil && profil.toldirilgan
              ? {
                  id: profil.id,
                  toliq_ism: profil.toliq_ism,
                  avatar_url: profil.avatar_url,
                  admin: profil.rol === "admin",
                }
              : null
          }
        />
      </Container>
    </>
  );
}
