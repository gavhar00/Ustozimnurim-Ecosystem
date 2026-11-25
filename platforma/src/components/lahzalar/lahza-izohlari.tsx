"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, Send, Trash2 } from "lucide-react";
import { izohlarniOl, izohniOchir, izohYoz } from "@/app/lahzalar/amallar";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { FormXabar } from "@/components/ui/form";
import { IZOH_MAKS_MATN } from "@/lib/lenta-turlari";
import type { LahzaIzoh } from "@/lib/lahza-turlari";
import { tadbirSanasi } from "@/lib/sana";

export function LahzaIzohlari({
  lahzaId,
  lahzaMuallifId,
  men,
  yozish,
  sonOzgardi,
}: {
  lahzaId: string;
  lahzaMuallifId: string;
  men: { id: string; admin: boolean };
  yozish: boolean;
  sonOzgardi: (farq: number) => void;
}) {
  const [izohlar, setIzohlar] = useState<LahzaIzoh[]>([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [xato, setXato] = useState<string | null>(null);
  const [matn, setMatn] = useState("");
  const [yuborilmoqda, setYuborilmoqda] = useState(false);

  useEffect(() => {
    let bekor = false;
    void izohlarniOl(lahzaId).then((natija) => {
      if (bekor) return;
      if (natija.ok) setIzohlar(natija.malumot);
      else setXato(natija.xato);
      setYuklanmoqda(false);
    });
    return () => {
      bekor = true;
    };
  }, [lahzaId]);

  async function yuborish(e: React.FormEvent) {
    e.preventDefault();
    if (!matn.trim() || yuborilmoqda) return;
    setYuborilmoqda(true);
    setXato(null);
    const natija = await izohYoz(lahzaId, matn);
    setYuborilmoqda(false);
    if (!natija.ok) return setXato(natija.xato);
    setIzohlar((eski) => [...eski, natija.malumot]);
    setMatn("");
    sonOzgardi(1);
  }

  async function ochirish(id: string) {
    setXato(null);
    const natija = await izohniOchir(id);
    if (!natija.ok) return setXato(natija.xato);
    setIzohlar((eski) => eski.filter((i) => i.id !== id));
    sonOzgardi(-1);
  }

  return (
    <div className="space-y-4 border-t border-border-subtle pt-4">
      {xato ? <FormXabar>{xato}</FormXabar> : null}

      {yuklanmoqda ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Izohlar yuklanmoqda…
        </p>
      ) : izohlar.length === 0 ? (
        <p className="text-sm text-fg-muted">Hali izoh yo‘q. Birinchi bo‘lib yozing.</p>
      ) : (
        <ul className="space-y-3">
          {izohlar.map((i) => {
            const ochirsa = i.muallif_id === men.id || men.admin || lahzaMuallifId === men.id;
            return (
              <li key={i.id} className="flex gap-2.5">
                <MuallifAvatari ism={i.muallif.toliq_ism} url={i.muallif.avatar_url} className="size-8 text-xs" />
                <div className="min-w-0 flex-1 rounded-2xl bg-ink-850/60 px-3.5 py-2.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    {i.muallif.username ? (
                      <Link href={`/profil/${i.muallif.username}`} className="text-sm font-bold text-fg hover:text-gold-300">
                        {i.muallif.toliq_ism}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold">{i.muallif.toliq_ism}</span>
                    )}
                    <time dateTime={i.yaratilgan} className="text-xs text-fg-muted">
                      {tadbirSanasi(i.yaratilgan)}
                    </time>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">{i.matn}</p>
                </div>
                {ochirsa ? (
                  <button
                    type="button"
                    onClick={() => void ochirish(i.id)}
                    aria-label="Izohni o‘chirish"
                    className="self-start rounded-full p-1.5 text-fg-muted transition-colors hover:text-[#ffb3ad]"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {yozish ? (
      <form onSubmit={yuborish} className="flex items-end gap-2">
        <label htmlFor={`izoh-${lahzaId}`} className="sr-only">Izoh yozish</label>
        <textarea
          id={`izoh-${lahzaId}`}
          value={matn}
          onChange={(e) => setMatn(e.target.value)}
          maxLength={IZOH_MAKS_MATN}
          rows={1}
          disabled={yuborilmoqda}
          placeholder="Izoh yozing…"
          className="min-h-11 flex-1 resize-y rounded-xl border border-border-subtle bg-ink-850/70 px-3.5 py-2.5 text-sm text-fg placeholder:text-muted-soft focus:border-gold-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!matn.trim() || yuborilmoqda}
          aria-label="Izohni yuborish"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-950 transition-opacity disabled:opacity-40"
        >
          {yuborilmoqda ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        </button>
      </form>
      ) : (
        <p className="text-sm text-fg-muted">
          Izoh yozish uchun{" "}
          <Link href="/kirish?keyin=%2Flahzalar" className="font-bold text-gold-300 hover:text-gold-200">kiring</Link>{" "}
          yoki{" "}
          <Link href="/royxatdan-otish" className="font-bold text-gold-300 hover:text-gold-200">ro‘yxatdan o‘ting</Link>.
        </p>
      )}
    </div>
  );
}
