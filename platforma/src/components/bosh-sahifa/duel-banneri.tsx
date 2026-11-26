"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Swords } from "lucide-react";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { YaratishOynasi } from "@/components/duel/raqiblar-royxati";
import { yonalishNomi, type DuelRaqibi } from "@/lib/duel-turlari";

/** Bosh sahifadagi duel taklifi: foydalanuvchini qidirib, shu yerning o‘zida chaqirish mumkin. */
export function DuelBanneri({ raqiblar, takliflarSoni }: { raqiblar: DuelRaqibi[]; takliflarSoni: number }) {
  const [soz, setSoz] = useState("");
  const [tanlangan, setTanlangan] = useState<DuelRaqibi | null>(null);

  const korinadigan = useMemo(() => {
    const q = soz.trim().toLowerCase();
    const royxat = [...raqiblar].sort((a, b) => b.reyting - a.reyting);
    return (q
      ? royxat.filter((r) => r.toliq_ism.toLowerCase().includes(q) || (r.username ?? "").toLowerCase().includes(q))
      : royxat
    ).slice(0, 5);
  }, [raqiblar, soz]);

  return (
    <section aria-labelledby="duel-banner" className="surface-card relative overflow-hidden p-4 sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-gold-500/15 blur-[60px]" />
      <h2 id="duel-banner" className="inline-flex items-center gap-2 text-base font-black">
        <Swords className="size-5 text-gold-300" aria-hidden="true" /> Duelga chaqiring
      </h2>
      <p className="mt-1 text-xs text-fg-muted">Do‘stingizni tanlang — bir xil savollar, bir vaqtda boshlanadi.</p>
      {takliflarSoni > 0 ? (
        <Link
          href="/duel"
          className="mt-3 flex items-center justify-between rounded-xl border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-xs font-extrabold text-gold-300"
        >
          Sizga {takliflarSoni} ta duel taklifi bor <span aria-hidden="true">→</span>
        </Link>
      ) : null}
      <label className="relative mt-3 block">
        <span className="sr-only">Foydalanuvchini qidirish</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
        <input
          value={soz}
          onChange={(e) => setSoz(e.target.value)}
          placeholder="Ism yoki username"
          className="h-10 w-full rounded-full border border-border-subtle bg-bg/60 pl-9 pr-3 text-sm outline-none focus:border-gold-400"
        />
      </label>
      <ul className="mt-3 space-y-1">
        {korinadigan.map((r) => (
          <li key={r.id} className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-gold-400/5">
            <MuallifAvatari ism={r.toliq_ism} url={r.avatar_url} className="size-9" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold">{r.toliq_ism}</span>
              <span className="block truncate text-[0.7rem] text-fg-muted">
                {r.yonalish ? yonalishNomi(r.yonalish) : "Yo‘nalish yo‘q"} · {r.reyting} ball
              </span>
            </span>
            <button
              type="button"
              onClick={() => setTanlangan(r)}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-gold-400 px-3 text-xs font-black text-ink-950 hover:bg-gold-300"
            >
              <Swords className="size-3.5" aria-hidden="true" /> Chaqirish
            </button>
          </li>
        ))}
        {korinadigan.length === 0 ? (
          <li className="py-3 text-center text-xs text-fg-muted">
            {raqiblar.length === 0 ? "Hali boshqa foydalanuvchi yo‘q." : "Foydalanuvchi topilmadi."}
          </li>
        ) : null}
      </ul>
      <Link href="/duel" className="mt-3 inline-block text-xs font-extrabold text-gold-300 hover:underline">
        Barcha foydalanuvchilar va TOP 10 →
      </Link>
      {tanlangan ? <YaratishOynasi raqib={tanlangan} yop={() => setTanlangan(null)} /> : null}
    </section>
  );
}
