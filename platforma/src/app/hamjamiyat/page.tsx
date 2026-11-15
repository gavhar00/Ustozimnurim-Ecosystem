import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, MessagesSquare } from "lucide-react";
import { BolimMenyusi } from "@/components/hamjamiyat/bolim-menyusi";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { munozaralar } from "@/lib/data/hamjamiyat";

export const metadata: Metadata = {
  title: "Hamjamiyat",
  description:
    "Savol bering, javob oling, loyihangizni ulashing — UstozimNurim o‘quvchilari va ustozlari bilan birga.",
};

function sanaMatni(iso: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function HamjamiyatSahifasi() {
  const royxat = await munozaralar();

  return (
    <>
      <PageHeader
        yorliq="Hamjamiyat"
        yorliqIkona={<MessagesSquare className="size-4" />}
        sarlavha="Bilim o‘quvchilar va ustozlar bilan"
        oltinQism="birgalikda"
        tavsif="Savolingizni bering, boshqalarga yordam bering, o‘z loyihangizni ko‘rsating. Har bir javob kimningdir yo‘lini ochadi."
      >
        <ButtonLink href="/hamjamiyat/yangi">Munozara ochish</ButtonLink>
      </PageHeader>

      <Container className="pb-16">
        <div className="mb-7">
          <BolimMenyusi />
        </div>

        {royxat.length === 0 ? (
          <EmptyState
            ikona={<MessageCircle className="size-7" aria-hidden="true" />}
            sarlavha="Hamjamiyat hali boshlanmagan"
            izoh="Birinchi munozarani siz ochishingiz mumkin. Hisobga kiring va savolingizni yozing."
            amal={<ButtonLink href="/hamjamiyat/yangi">Munozara ochish</ButtonLink>}
          />
        ) : (
          <ul className="space-y-4">
            {royxat.map((m) => (
              <li
                key={m.id}
                className="surface-card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="inline-block rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-gold-300">
                    {m.turkum}
                  </span>
                  <h2 className="mt-2.5 text-lg font-extrabold leading-snug">
                    <Link
                      href={`/hamjamiyat/${m.id}`}
                      className="text-fg hover:text-gold-300"
                    >
                      {m.sarlavha}
                    </Link>
                  </h2>
                  <p className="mt-1.5 text-sm text-fg-muted">
                    {m.muallif_ismi} · {sanaMatni(m.yaratilgan)}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border-subtle px-4 py-2 text-sm font-bold text-fg-muted">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {m.javoblar_soni} javob
                </span>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
