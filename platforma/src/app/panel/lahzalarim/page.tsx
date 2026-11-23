import type { Metadata } from "next";
import Image from "next/image";
import { Images } from "lucide-react";
import { LahzaOchirish } from "@/components/panel/lahza-ochirish";
import { LahzaYuklash } from "@/components/panel/lahza-yuklash";
import { profilTalabQil } from "@/lib/auth";
import { LAHZA_HOLATI, menimLahzalarim } from "@/lib/data/lahzalar";
import { tadbirlarRoyxati } from "@/lib/data/tadbirlar";

export const metadata: Metadata = { title: "Lahzalarim", robots: { index: false, follow: false } };

export default async function LahzalarimSahifasi() {
  const profil = await profilTalabQil("/panel/lahzalarim");
  const [lahzalar, tadbirlar] = await Promise.all([menimLahzalarim(profil.id), tadbirlarRoyxati()]);

  return (
    <>
      <header>
        <h1 className="inline-flex items-center gap-3 text-2xl font-black sm:text-3xl">
          <Images className="size-7 text-gold-300" aria-hidden="true" />
          Lahzalarim
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Tadbir va darslardan rasmlar yuboring. Jamoa tekshirgach, ular umumiy galereyada ko‘rinadi.
        </p>
      </header>

      <div className="mt-7">
        <LahzaYuklash
          foydalanuvchiId={profil.id}
          tadbirlar={tadbirlar.map((t) => ({ id: t.id, nom: t.nom }))}
        />
      </div>

      {lahzalar.length > 0 ? (
        <section className="mt-10" aria-labelledby="yuborganlarim">
          <h2 id="yuborganlarim" className="text-lg font-extrabold">Yuborgan rasmlarim</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lahzalar.map((l) => (
              <li key={l.id} className="surface-card overflow-hidden">
                <div className="relative aspect-[4/3] bg-ink-850">
                  <Image src={l.rasm_url} alt={l.izoh ?? "Yuborilgan rasm"} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" unoptimized />
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-xs font-bold text-gold-300">{LAHZA_HOLATI[l.holat]}</p>
                  {l.izoh ? <p className="text-sm text-fg-muted">{l.izoh}</p> : null}
                  <LahzaOchirish id={l.id} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
