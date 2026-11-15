import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, NotebookPen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { notlar } from "@/lib/data/hamjamiyat";

export const metadata: Metadata = {
  title: "Notlar",
  description:
    "Foydali notalar, qo‘llanmalar va o‘quv materiallari — bir joyda, o‘zbek tilida.",
};

export default async function NotlarSahifasi() {
  const royxat = await notlar();

  return (
    <>
      <PageHeader
        yorliq="Notlar"
        yorliqIkona={<NotebookPen className="size-4" />}
        sarlavha="Foydali notalar, qo‘llanmalar va"
        oltinQism="materiallar"
        tavsif="Darslarga ilova bo‘lgan qisqa qo‘llanmalar, shpargalkalar va tanlab olingan manbalar."
      />

      <Container className="pb-16">
        {royxat.length === 0 ? (
          <EmptyState
            ikona={<NotebookPen className="size-7" aria-hidden="true" />}
            sarlavha="Hozircha notalar qo‘shilmagan"
            izoh="Birinchi materiallar tayyorlanmoqda. Tez orada shu yerda paydo bo‘ladi."
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {royxat.map((not) => (
              <li key={not.id}>
                <Link
                  href={`/notlar/${not.slug}`}
                  className="group flex h-full flex-col rounded-card border border-border-subtle bg-bg-card p-6 transition-all duration-250 hover:-translate-y-1 hover:border-border-strong"
                >
                  <span className="inline-block w-fit rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-gold-300">
                    {not.turkum}
                  </span>
                  <h2 className="mt-3.5 text-lg font-extrabold leading-snug text-fg">
                    {not.nom}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
                    {not.qisqa_tavsif}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-gold-300">
                    O‘qish
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
