"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Handshake, MapPin, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import type { OdamKartasi } from "@/lib/data/ijtimoiy";
import { cn } from "@/lib/utils";

const chipUslub = (faol: boolean) =>
  cn(
    "rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors",
    faol
      ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
      : "border-border-subtle text-fg-muted hover:border-border-strong hover:text-fg",
  );

export function OdamlarRoyxati({ odamlar }: { odamlar: OdamKartasi[] }) {
  const [qidiruv, setQidiruv] = useState("");
  const [konikma, setKonikma] = useState<string | null>(null);
  const [qiziqish, setQiziqish] = useState<string | null>(null);
  const [joy, setJoy] = useState<string | null>(null);
  const [faqatHamkor, setFaqatHamkor] = useState(false);

  const { konikmalar, qiziqishlar, joylar } = useMemo(() => {
    const k = new Set<string>();
    const q = new Set<string>();
    const j = new Set<string>();
    for (const o of odamlar) {
      o.konikmalar.forEach((x) => k.add(x));
      o.qiziqishlar.forEach((x) => q.add(x));
      if (o.joylashuv?.trim()) j.add(o.joylashuv.trim());
    }
    return {
      konikmalar: [...k].sort().slice(0, 20),
      qiziqishlar: [...q].sort(),
      joylar: [...j].sort().slice(0, 12),
    };
  }, [odamlar]);

  const natija = useMemo(() => {
    const matn = qidiruv.trim().toLowerCase();
    return odamlar.filter((o) => {
      if (faqatHamkor && !o.hamkorlikka_ochiq) return false;
      if (konikma && !o.konikmalar.includes(konikma)) return false;
      if (qiziqish && !o.qiziqishlar.includes(qiziqish)) return false;
      if (joy && o.joylashuv?.trim() !== joy) return false;
      if (!matn) return true;
      return (
        o.toliq_ism.toLowerCase().includes(matn) ||
        (o.username ?? "").toLowerCase().includes(matn) ||
        (o.maqsad ?? "").toLowerCase().includes(matn)
      );
    });
  }, [odamlar, qidiruv, konikma, qiziqish, joy, faqatHamkor]);

  if (odamlar.length === 0) {
    return (
      <EmptyState
        sarlavha="Hali hech kim profilini to‘ldirmagan"
        izoh="Foydalanuvchi nomi kiritilgan profillar shu yerda ko‘rinadi. Birinchi bo‘lib o‘zingiznikini to‘ldiring."
      />
    );
  }

  return (
    <div>
      <div className="surface-card space-y-5 p-5 sm:p-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-soft"
            aria-hidden="true"
          />
          <label htmlFor="odam-qidiruv" className="sr-only">
            Odamlarni qidirish
          </label>
          <Input
            id="odam-qidiruv"
            type="search"
            value={qidiruv}
            onChange={(e) => setQidiruv(e.target.value)}
            placeholder="Ism, foydalanuvchi nomi yoki maqsad bo‘yicha…"
            className="pl-11"
          />
        </div>

        {konikmalar.length > 0 ? (
          <Filtr
            sarlavha="Ko‘nikma"
            qiymatlar={konikmalar}
            tanlangan={konikma}
            tanla={setKonikma}
          />
        ) : null}

        {qiziqishlar.length > 0 ? (
          <Filtr
            sarlavha="Qiziqish"
            qiymatlar={qiziqishlar}
            tanlangan={qiziqish}
            tanla={setQiziqish}
          />
        ) : null}

        {joylar.length > 0 ? (
          <Filtr
            sarlavha="Joylashuv"
            qiymatlar={joylar}
            tanlangan={joy}
            tanla={setJoy}
          />
        ) : null}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={faqatHamkor}
            onChange={(e) => setFaqatHamkor(e.target.checked)}
            className="size-4 accent-[var(--color-gold-400)]"
          />
          <span className="text-sm font-semibold text-fg">
            Faqat hamkorlikka ochiq odamlar
          </span>
        </label>
      </div>

      <p className="mt-6 text-sm text-fg-muted" role="status" aria-live="polite">
        {natija.length} ta odam topildi
      </p>

      {natija.length === 0 ? (
        <EmptyState
          className="mt-4"
          ikona={<Search className="size-7" aria-hidden="true" />}
          sarlavha="Mos odam topilmadi"
          izoh="Filtrlarni tozalab yoki qidiruv so‘zini qisqartirib ko‘ring."
        />
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {natija.map((odam) => (
            <li key={odam.id}>
              <Link
                href={`/profil/${odam.username}`}
                className="group flex h-full flex-col rounded-card border border-border-subtle bg-bg-card p-5 transition-all duration-250 hover:-translate-y-1 hover:border-border-strong"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-lg font-black text-gold-300"
                  >
                    {odam.toliq_ism.trim().charAt(0).toUpperCase() || "U"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-fg">
                      {odam.toliq_ism}
                    </p>
                    <p className="truncate text-xs text-fg-muted">
                      @{odam.username}
                      {odam.kasb ? ` · ${odam.kasb}` : ""}
                    </p>
                  </div>
                </div>

                {odam.joylashuv ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-muted">
                    <MapPin className="size-3.5 text-gold-400/70" aria-hidden="true" />
                    {odam.joylashuv}
                  </p>
                ) : null}

                {odam.maqsad ? (
                  <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-fg-muted">
                    {odam.maqsad}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}

                {odam.konikmalar.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {odam.konikmalar.slice(0, 4).map((k) => (
                      <li
                        key={k}
                        className="rounded-md bg-ink-700/70 px-2 py-1 text-xs text-champagne"
                      >
                        {k}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {odam.hamkorlikka_ochiq ? (
                  <p className="mt-4 inline-flex items-center gap-1.5 border-t border-border-subtle pt-3 text-xs font-bold text-[#9fe4c2]">
                    <Handshake className="size-3.5" aria-hidden="true" />
                    Hamkorlikka ochiq
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filtr({
  sarlavha,
  qiymatlar,
  tanlangan,
  tanla,
}: {
  sarlavha: string;
  qiymatlar: string[];
  tanlangan: string | null;
  tanla: (q: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-fg-muted">
        {sarlavha}
      </legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => tanla(null)}
          aria-pressed={tanlangan === null}
          className={chipUslub(tanlangan === null)}
        >
          Barchasi
        </button>
        {qiymatlar.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => tanla(q)}
            aria-pressed={tanlangan === q}
            className={chipUslub(tanlangan === q)}
          >
            {q}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
