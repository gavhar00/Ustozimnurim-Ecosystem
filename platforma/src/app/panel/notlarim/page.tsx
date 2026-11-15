import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mening notlarim",
  robots: { index: false, follow: false },
};

export default async function Sahifa() {
  await profilTalabQil("/panel/notlarim");

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Mening notlarim
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">Darslar davomida yozgan qaydlaringiz.</p>
      </header>

      <div className="mt-7">
        <EmptyState
          ikona={<NotebookPen className="size-7" aria-hidden="true" />}
          sarlavha="Hali qayd yo‘q"
          izoh="Dars ichida yozgan qaydlaringiz shu yerda to‘planadi."
        />
      </div>
    </>
  );
}
