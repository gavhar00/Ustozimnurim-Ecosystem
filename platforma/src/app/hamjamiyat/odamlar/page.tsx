import type { Metadata } from "next";
import { Users } from "lucide-react";
import { BolimMenyusi } from "@/components/hamjamiyat/bolim-menyusi";
import { OdamlarRoyxati } from "@/components/hamjamiyat/odamlar-royxati";
import { Container } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { hamjamiyatOdamlari } from "@/lib/data/ijtimoiy";

export const metadata: Metadata = {
  title: "Odamlar",
  description:
    "UstozimNurim hamjamiyatidagi o‘quvchilar va ustozlar — ko‘nikma, qiziqish va joylashuv bo‘yicha toping.",
};

export default async function OdamlarSahifasi() {
  const odamlar = await hamjamiyatOdamlari();

  return (
    <>
      <PageHeader
        yorliq="Hamjamiyat"
        yorliqIkona={<Users className="size-4" />}
        sarlavha="Jamoadosh va ustoz"
        oltinQism="toping"
        tavsif="Ko‘nikma, qiziqish yoki joylashuv bo‘yicha filtrlang. Hamkorlikka ochiq odamlar alohida belgilanadi."
      />

      <Container className="pb-16">
        <div className="mb-7">
          <BolimMenyusi />
        </div>

        <OdamlarRoyxati odamlar={odamlar} />
      </Container>
    </>
  );
}
