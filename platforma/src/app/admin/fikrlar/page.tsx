import type { Metadata } from "next";
import { MessageSquareHeart } from "lucide-react";
import { FikrJavobFormasi } from "@/components/admin/fikr-javob-formasi";
import { EmptyState } from "@/components/ui/empty-state";
import { adminFikrlari } from "@/lib/data/fikrlar";
import { FIKR_HOLATLARI, FIKR_TURLARI } from "@/lib/fikr-turlari";
import { tadbirSanasi } from "@/lib/sana";

export const metadata: Metadata = { title: "Fikr-mulohazalar", robots: { index: false, follow: false } };

export default async function AdminFikrlar() {
  const fikrlar = await adminFikrlari();
  const yangi = fikrlar.filter((f) => f.holat === "yangi").length;

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">Fikr-mulohazalar</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          O‘quvchilar yuborgan fikrlar. Holatini belgilang va javob yozing — javob o‘quvchining
          panelida ko‘rinadi. Fikrlar saytda e’lon qilinmaydi.
          {fikrlar.length > 0 ? ` Yangi: ${yangi}.` : ""}
        </p>
      </header>

      {fikrlar.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            ikona={<MessageSquareHeart className="size-7" aria-hidden="true" />}
            sarlavha="Hali fikr yuborilmagan"
            izoh="O‘quvchilar paneldagi “Fikr-mulohaza” bo‘limidan yozadi."
          />
        </div>
      ) : (
        <ul className="mt-7 space-y-3">
          {fikrlar.map((f) => (
            <li key={f.id} className="surface-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
                <span>
                  <span className="font-bold text-gold-300">{FIKR_TURLARI[f.turi]}</span> · {f.muallif}
                </span>
                <span>
                  {tadbirSanasi(f.yaratilgan)} · {FIKR_HOLATLARI[f.holat]}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{f.matn}</p>
              <FikrJavobFormasi fikr={f} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
