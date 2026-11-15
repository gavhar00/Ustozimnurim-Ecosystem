import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { Katalog } from "@/components/kurslar/katalog";
import { Container } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { kurslarRoyxati } from "@/lib/data/kurslar";

export const metadata: Metadata = {
  title: "Kurslar",
  description:
    "O‘zbek tilidagi dasturlash kurslari — frontend, backend, data science va UI/UX dizayn yo‘nalishlari bo‘yicha.",
};

export default async function KurslarSahifasi() {
  const kurslar = await kurslarRoyxati();

  return (
    <>
      <PageHeader
        yorliq="Kurslar"
        yorliqIkona={<GraduationCap className="size-4" />}
        sarlavha="O‘zingizga mos kursni"
        oltinQism="toping"
        tavsif="Yo‘nalish va daraja bo‘yicha filtrlang, nom bo‘yicha qidiring. Har bir kurs interaktiv darslardan iborat."
      />

      <Container className="pb-16">
        <Katalog kurslar={kurslar} />
      </Container>
    </>
  );
}
