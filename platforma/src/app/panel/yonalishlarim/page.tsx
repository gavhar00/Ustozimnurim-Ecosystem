import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Yo‘nalishlarim",
  robots: { index: false, follow: false },
};

export default async function Sahifa() {
  await profilTalabQil("/panel/yonalishlarim");

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Yo‘nalishlarim
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">Tanlagan yo‘nalishlaringiz va yo‘l xaritasi.</p>
      </header>

      <div className="mt-7">
        <EmptyState
          ikona={<Compass className="size-7" aria-hidden="true" />}
          sarlavha="Yo‘l xaritasi tayyorlanmoqda"
          izoh="Yo‘nalish bosqichlari belgilangach, jarayoningiz shu yerda ko‘rinadi."
        />
      </div>
    </>
  );
}
