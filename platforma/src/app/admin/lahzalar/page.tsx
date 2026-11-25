import type { Metadata } from "next";
import Image from "next/image";
import { Images } from "lucide-react";
import { LahzaTugmalari } from "@/components/admin/lahza-tugmalari";
import { EmptyState } from "@/components/ui/empty-state";
import { LAHZA_HOLATI, adminLahzalari } from "@/lib/data/lahzalar";
import { tadbirSanasi } from "@/lib/sana";

export const metadata: Metadata = { title: "Lahzalar", robots: { index: false, follow: false } };

export default async function AdminLahzalar() {
  const lahzalar = await adminLahzalari();
  const kutilmoqda = lahzalar.filter((l) => l.holat === "kutilmoqda").length;

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">Lahzalar moderatsiyasi</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Lahzalar tasdiqsiz darhol e’lon qilinadi. Nomaqbul yoki shaxsiy ma’lumot bor lahzani
          bu yerdan “Rad etish” orqali yashirishingiz mumkin.
          {kutilmoqda > 0 ? ` Tekshiruvda: ${kutilmoqda}.` : ""}
        </p>
      </header>

      {lahzalar.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            ikona={<Images className="size-7" aria-hidden="true" />}
            sarlavha="Hali lahza yo‘q"
            izoh="A’zolar lahzalarni ommaviy /lahzalar sahifasidan joylaydi."
          />
        </div>
      ) : (
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lahzalar.map((l) => (
            <li key={l.id} className="surface-card overflow-hidden">
              {l.rasm_url ? (
                <div className="relative aspect-[4/3] bg-ink-850">
                  <Image src={l.rasm_url} alt={l.izoh ?? "Lahzadagi rasm"} fill sizes="(max-width: 640px) 100vw, 360px" className="object-cover" unoptimized />
                </div>
              ) : null}
              <div className="space-y-3 p-4">
                <p className="text-xs text-fg-muted">
                  <span className="font-bold text-gold-300">{LAHZA_HOLATI[l.holat]}</span> · {l.muallif} ·{" "}
                  {tadbirSanasi(l.yaratilgan)}
                </p>
                {l.asl_id ? <p className="text-sm text-fg-muted">Repost</p> : null}
                {l.matn ? <p className="line-clamp-6 whitespace-pre-wrap break-words text-sm">{l.matn}</p> : null}
                {l.tadbir_nomi ? <p className="text-xs text-fg-muted">Tadbir: {l.tadbir_nomi}</p> : null}
                <LahzaTugmalari id={l.id} holat={l.holat} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
