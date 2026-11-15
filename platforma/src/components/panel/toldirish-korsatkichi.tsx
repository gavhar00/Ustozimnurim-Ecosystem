import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { ToldirishBandi } from "@/lib/data/profil";

/** Profil to'ldirilganlik foizi va yetishmayotgan bandlar ro'yxati. */
export function ToldirishKorsatkichi({
  foiz,
  bandlar,
  username,
}: {
  foiz: number;
  bandlar: ToldirishBandi[];
  username: string | null;
}) {
  const qolgan = bandlar.filter((b) => !b.bajarilgan);

  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold">Profil to‘ldirilganligi</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {foiz === 100
              ? "Profilingiz to‘liq — zo‘r!"
              : `Yana ${qolgan.length} ta band qoldi.`}
          </p>
        </div>
        <span className="text-3xl font-black text-gold-gradient">{foiz}%</span>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-pill bg-ink-700/70"
        role="progressbar"
        aria-valuenow={foiz}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profil to‘ldirilganligi"
      >
        <div
          className="h-full rounded-pill bg-linear-[90deg,var(--color-gold-300),var(--color-gold-500)] transition-[width] duration-700"
          style={{ width: `${foiz}%` }}
        />
      </div>

      {qolgan.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {qolgan.map((b) => (
            <li key={b.nom}>
              <Link
                href={b.havola}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-gold-400/8 hover:text-fg"
              >
                <Circle className="size-4 shrink-0" aria-hidden="true" />
                {b.nom}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {bandlar.some((b) => b.bajarilgan) ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-fg-muted hover:text-fg">
            Bajarilganlar ({bandlar.filter((b) => b.bajarilgan).length})
          </summary>
          <ul className="mt-3 space-y-2">
            {bandlar
              .filter((b) => b.bajarilgan)
              .map((b) => (
                <li
                  key={b.nom}
                  className="flex items-center gap-2.5 px-2 text-sm text-fg-muted"
                >
                  <Check
                    className="size-4 shrink-0 text-[#9fe4c2]"
                    aria-hidden="true"
                  />
                  {b.nom}
                </li>
              ))}
          </ul>
        </details>
      ) : null}

      {username ? (
        <Link
          href={`/profil/${username}`}
          className="mt-5 inline-block text-sm font-bold text-gold-300 hover:text-gold-200"
        >
          Profilim qanday ko‘rinishini ko‘rish →
        </Link>
      ) : (
        <p className="mt-5 text-xs text-fg-muted">
          Ommaviy profil ochilishi uchun foydalanuvchi nomini kiriting.
        </p>
      )}
    </div>
  );
}
