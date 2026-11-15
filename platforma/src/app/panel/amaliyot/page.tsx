import type { Metadata } from "next";
import { Code2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Amaliyot",
  robots: { index: false, follow: false },
};

export default async function Sahifa() {
  await profilTalabQil("/panel/amaliyot");

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Amaliyot
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">Kod yozib mustahkamlaydigan mashqlar.</p>
      </header>

      <div className="mt-7">
        <EmptyState
          ikona={<Code2 className="size-7" aria-hidden="true" />}
          sarlavha="Mashqlar tayyorlanmoqda"
          izoh="Interaktiv dars tizimi ishga tushgach, amaliy topshiriqlar shu yerda ochiladi."
        />
      </div>
    </>
  );
}
