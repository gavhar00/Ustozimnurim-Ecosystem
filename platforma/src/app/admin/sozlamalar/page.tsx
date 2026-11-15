import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Sozlamalar",
  robots: { index: false, follow: false },
};

export default function AdminSozlamalar() {
  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Sozlamalar
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Platforma sozlamalari.
        </p>
      </header>

      <div className="mt-7">
        <EmptyState
          ikona={<Settings className="size-7" aria-hidden="true" />}
          sarlavha="Sozlamalar tayyorlanmoqda"
          izoh="To‘lov tariflari, bildirishnomalar va integratsiyalar keyingi bosqichda qo‘shiladi."
        />
      </div>
    </>
  );
}
