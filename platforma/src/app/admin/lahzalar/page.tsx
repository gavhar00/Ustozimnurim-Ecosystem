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
          Yuklovchi rasmdagi odamlarning roziligini tasdiqlagan. Baribir rasmni ko‘rib chiqing:
          nomaqbul yoki shaxsiy ma’lumot ko‘ringan rasmni rad eting.
          {lahzalar.length > 0 ? ` Tekshiruvda: ${kutilmoqda}.` : ""}
        </p>
      </header>

      {lahzalar.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            ikona={<Images className="size-7" aria-hidden="true" />}
            sarlavha="Hali rasm yuborilmagan"
            izoh="O‘quvchilar paneldagi “Lahzalarim” bo‘limidan yuboradi."
          />
        </div>
      ) : (
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lahzalar.map((l) => (
            <li key={l.id} className="surface-card overflow-hidden">
              <div className="relative aspect-[4/3] bg-ink-850">
                <Image src={l.rasm_url} alt={l.izoh ?? "Yuborilgan rasm"} fill sizes="(max-width: 640px) 100vw, 360px" className="object-cover" unoptimized />
              </div>
              <div className="space-y-3 p-4">
                <p className="text-xs text-fg-muted">
                  <span className="font-bold text-gold-300">{LAHZA_HOLATI[l.holat]}</span> · {l.muallif} ·{" "}
                  {tadbirSanasi(l.yaratilgan)}
                </p>
                {l.izoh ? <p className="text-sm">{l.izoh}</p> : null}
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
