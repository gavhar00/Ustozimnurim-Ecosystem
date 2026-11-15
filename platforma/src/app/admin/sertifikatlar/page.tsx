import type { Metadata } from "next";
import { Award } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Sertifikatlar",
  robots: { index: false, follow: false },
};

export default function AdminSertifikatlar() {
  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Sertifikatlar
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Berilgan sertifikatlar ro‘yxati va qo‘lda berish imkoniyati.
        </p>
      </header>

      <div className="mt-7">
        <EmptyState
          ikona={<Award className="size-7" aria-hidden="true" />}
          sarlavha="Hali sertifikat berilmagan"
          izoh="O‘quvchilar kurslarni tugatgach, sertifikatlar shu yerda ko‘rinadi."
        />
      </div>
    </>
  );
}
