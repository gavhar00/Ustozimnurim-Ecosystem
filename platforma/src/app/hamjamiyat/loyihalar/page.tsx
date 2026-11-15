import type { Metadata } from "next";
import { FolderGit2 } from "lucide-react";
import { BolimMenyusi } from "@/components/hamjamiyat/bolim-menyusi";
import { LoyihalarRoyxati } from "@/components/hamjamiyat/loyihalar-royxati";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { ommaviyLoyihalar } from "@/lib/data/ijtimoiy";

export const metadata: Metadata = {
  title: "Loyihalar",
  description:
    "UstozimNurim o‘quvchilari qurgan loyihalar — texnologiya va turkum bo‘yicha ko‘ring.",
};

export default async function LoyihalarSahifasi() {
  const loyihalar = await ommaviyLoyihalar();

  return (
    <>
      <PageHeader
        yorliq="Hamjamiyat"
        yorliqIkona={<FolderGit2 className="size-4" />}
        sarlavha="O‘quvchilar qurgan"
        oltinQism="loyihalar"
        tavsif="Boshqalar nimalar qilayotganini ko‘ring, g‘oya oling va jamoadosh toping."
      >
        <ButtonLink href="/panel/loyihalarim">O‘z loyihangizni qo‘shish</ButtonLink>
      </PageHeader>

      <Container className="pb-16">
        <div className="mb-7">
          <BolimMenyusi />
        </div>

        <LoyihalarRoyxati loyihalar={loyihalar} />
      </Container>
    </>
  );
}
