import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Images } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/primitives";
import { tasdiqlanganLahzalar } from "@/lib/data/lahzalar";

export const metadata: Metadata = {
  title: "Lahzalar",
  description: "UstozimNurim hamjamiyatining tadbir va darslardan olingan rasmlari.",
};

type Props = { searchParams: Promise<{ tadbir?: string }> };

export default async function LahzalarSahifasi({ searchParams }: Props) {
  const { tadbir } = await searchParams;
  const lahzalar = await tasdiqlanganLahzalar(tadbir);

  return (
    <>
      <PageHeader
        yorliq="Lahzalar"
        yorliqIkona={<Images className="size-4" />}
        sarlavha="Hamjamiyatimizdan"
        oltinQism="eng yaxshi lahzalar"
        tavsif="Rasmlar faqat ishtirokchilarning roziligi bilan va jamoa tekshiruvidan so‘ng e’lon qilinadi."
      />
      <Container className="pb-16">
        {tadbir ? (
          <p className="mb-5 text-sm">
            <Link href="/lahzalar" className="font-bold text-gold-300 hover:text-gold-200">
              ← Barcha lahzalar
            </Link>
          </p>
        ) : null}
        {lahzalar.length === 0 ? (
          <EmptyState
            ikona={<Images className="size-7" aria-hidden="true" />}
            sarlavha="Hozircha rasm yo‘q"
            izoh="Tasdiqlangan rasmlar shu yerda ko‘rinadi."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lahzalar.map((l) => (
              <li key={l.id} className="surface-card overflow-hidden">
                <div className="relative aspect-[4/3] bg-ink-850">
                  <Image
                    src={l.rasm_url}
                    alt={l.izoh ?? l.tadbir_nomi ?? "Hamjamiyat lahzasi"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {l.izoh || l.tadbir_nomi ? (
                  <div className="p-4 text-sm">
                    {l.izoh ? <p className="leading-relaxed">{l.izoh}</p> : null}
                    {l.tadbir_nomi ? <p className="mt-1 text-xs text-fg-muted">{l.tadbir_nomi}</p> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
