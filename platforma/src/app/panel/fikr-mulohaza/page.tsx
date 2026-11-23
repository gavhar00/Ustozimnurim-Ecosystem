import type { Metadata } from "next";
import { MessageSquareHeart } from "lucide-react";
import { FikrFormasi } from "@/components/panel/fikr-formasi";
import { profilTalabQil } from "@/lib/auth";
import { menimFikrlarim } from "@/lib/data/fikrlar";
import { FIKR_HOLATLARI, FIKR_TURLARI } from "@/lib/fikr-turlari";
import { tadbirSanasi } from "@/lib/sana";

export const metadata: Metadata = { title: "Fikr-mulohaza", robots: { index: false, follow: false } };

export default async function FikrMulohazaSahifasi() {
  const profil = await profilTalabQil("/panel/fikr-mulohaza");
  const fikrlar = await menimFikrlarim(profil.id);

  return (
    <>
      <header>
        <h1 className="inline-flex items-center gap-3 text-2xl font-black sm:text-3xl">
          <MessageSquareHeart className="size-7 text-gold-300" aria-hidden="true" />
          Fikr-mulohaza
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Platformani birga yaxshilaymiz: taklif, xato yoki savolingizni yozing.
        </p>
      </header>

      <div className="mt-7">
        <FikrFormasi />
      </div>

      {fikrlar.length > 0 ? (
        <section className="mt-10" aria-labelledby="mening-fikrlarim">
          <h2 id="mening-fikrlarim" className="text-lg font-extrabold">Yuborgan fikrlarim</h2>
          <ul className="mt-4 space-y-3">
            {fikrlar.map((f) => (
              <li key={f.id} className="surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
                  <span className="font-bold text-gold-300">{FIKR_TURLARI[f.turi]}</span>
                  <span>
                    {tadbirSanasi(f.yaratilgan)} · {FIKR_HOLATLARI[f.holat]}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{f.matn}</p>
                {f.admin_javobi ? (
                  <div className="mt-3 rounded-xl border border-border-strong bg-gold-400/8 p-3 text-sm">
                    <p className="text-xs font-bold text-gold-300">Jamoa javobi</p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed">{f.admin_javobi}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
