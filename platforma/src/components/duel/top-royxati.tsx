import Link from "next/link";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import type { TopQatori } from "@/lib/duel-turlari";

export function TopRoyxati({ qatorlar, haftalik, bosh }: { qatorlar: TopQatori[]; haftalik?: boolean; bosh: string }) {
  return (
    <section aria-label={bosh} className="surface-card p-4 sm:p-5">
      <h3 className="mb-3 text-base font-black">{bosh}</h3>
      {qatorlar.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">
          {haftalik ? "Bu hafta hali g‘olib aniqlanmagan." : "Hali tugagan duel yo‘q."}
        </p>
      ) : (
        <ol className="space-y-2">
          {qatorlar.map((q, i) => (
            <li key={q.profil_id} className="flex items-center gap-3">
              <span className="w-6 text-center text-sm font-black text-gold-300">{i + 1}</span>
              <MuallifAvatari ism={q.toliq_ism} url={q.avatar_url} className="size-9" />
              <Link href={q.username ? `/profil/${q.username}` : "#"} className="min-w-0 flex-1 truncate text-sm font-extrabold hover:text-gold-300">
                {q.toliq_ism}
              </Link>
              <span className="text-xs font-bold tabular-nums text-fg-muted">
                {haftalik ? `${q.galabalar} g‘alaba` : `${q.reyting} ball · ${q.galabalar} g.`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
