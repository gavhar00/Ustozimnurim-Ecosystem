"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Search, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { duelYarat } from "@/app/duel/amallar";
import {
  DUEL_DAVOMIYLIKLARI,
  DUEL_QIYINLIK,
  DUEL_VAZIFALAR_SONI,
  DUEL_YONALISHLARI,
  yonalishNomi,
  type DuelRaqibi,
} from "@/lib/duel-turlari";
import { cn } from "@/lib/utils";

const maydon =
  "h-11 w-full rounded-xl border border-border-subtle bg-bg-card px-3 text-sm font-semibold text-fg outline-none focus:border-gold-400/70";

export function RaqiblarRoyxati({ raqiblar }: { raqiblar: DuelRaqibi[] }) {
  const [soz, setSoz] = useState("");
  const [yonalish, setYonalish] = useState("");
  const [tartib, setTartib] = useState<"reyting" | "ism">("reyting");
  const [tanlangan, setTanlangan] = useState<DuelRaqibi | null>(null);

  const korinadigan = useMemo(() => {
    const q = soz.trim().toLowerCase();
    return raqiblar
      .filter((r) => (!q || r.toliq_ism.toLowerCase().includes(q) || (r.username ?? "").toLowerCase().includes(q)) && (!yonalish || r.yonalish === yonalish))
      .sort((a, b) => (tartib === "reyting" ? b.reyting - a.reyting : a.toliq_ism.localeCompare(b.toliq_ism, "uz")));
  }, [raqiblar, soz, yonalish, tartib]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <label className="relative block">
          <span className="sr-only">Foydalanuvchini qidirish</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
          <input value={soz} onChange={(e) => setSoz(e.target.value)} placeholder="Ism yoki username bo‘yicha qidirish" className={cn(maydon, "pl-9")} />
        </label>
        <select aria-label="Yo‘nalish" value={yonalish} onChange={(e) => setYonalish(e.target.value)} className={maydon}>
          <option value="">Barcha yo‘nalishlar</option>
          {DUEL_YONALISHLARI.map((y) => <option key={y.id} value={y.id}>{y.nom}</option>)}
        </select>
        <select aria-label="Saralash" value={tartib} onChange={(e) => setTartib(e.target.value as "reyting" | "ism")} className={maydon}>
          <option value="reyting">Reyting bo‘yicha</option>
          <option value="ism">Ism bo‘yicha</option>
        </select>
      </div>

      {korinadigan.length === 0 ? (
        <EmptyState className="mt-5" sarlavha="Foydalanuvchi topilmadi" izoh="Qidiruv yoki filtrni o‘zgartirib ko‘ring." />
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {korinadigan.map((r) => (
            <li key={r.id} className="surface-card flex items-center gap-3 p-4">
              <MuallifAvatari ism={r.toliq_ism} url={r.avatar_url} className="size-12" />
              <div className="min-w-0 flex-1">
                <Link href={r.username ? `/profil/${r.username}` : "#"} className="block truncate font-extrabold hover:text-gold-300">
                  {r.toliq_ism}
                </Link>
                <p className="truncate text-xs text-fg-muted">
                  {r.yonalish ? yonalishNomi(r.yonalish) : r.kasb ?? "Yo‘nalish tanlanmagan"} · {r.reyting} ball · {r.galabalar} g‘alaba
                </p>
              </div>
              <Button size="sm" onClick={() => setTanlangan(r)}>
                <Swords className="size-4" aria-hidden="true" />
                Chaqirish
              </Button>
            </li>
          ))}
        </ul>
      )}

      {tanlangan ? <YaratishOynasi raqib={tanlangan} yop={() => setTanlangan(null)} /> : null}
    </div>
  );
}

function YaratishOynasi({ raqib, yop }: { raqib: DuelRaqibi; yop: () => void }) {
  const router = useRouter();
  const [yonalish, setYonalish] = useState<string>(raqib.yonalish && DUEL_YONALISHLARI.some((y) => y.id === raqib.yonalish) ? raqib.yonalish : "html");
  const [qiyinlik, setQiyinlik] = useState<string>("oson");
  const [davomiylik, setDavomiylik] = useState<number>(120);
  const [soni, setSoni] = useState<number>(5);
  const [xato, setXato] = useState("");
  const [band, start] = useTransition();

  function yubor() {
    setXato("");
    start(async () => {
      const n = await duelYarat(raqib.id, yonalish, qiyinlik, davomiylik, soni);
      if (!n.ok) return setXato(n.xato);
      router.push(`/duel/${n.malumot.id}`);
    });
  }

  const tanla = (faol: boolean) =>
    cn("rounded-full border px-4 py-2 text-sm font-bold transition-colors", faol ? "border-gold-400/70 bg-gold-400/15 text-gold-300" : "border-border-subtle text-fg-muted hover:border-border-strong");

  return (
    <div role="dialog" aria-modal="true" aria-label="Duel yaratish" className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={yop}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border-strong bg-bg p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Duelga chaqirish</h2>
            <p className="mt-1 text-sm text-fg-muted">Raqib: <b className="text-fg">{raqib.toliq_ism}</b></p>
          </div>
          <button type="button" onClick={yop} aria-label="Yopish" className="inline-flex size-9 items-center justify-center rounded-full border border-border-subtle text-fg-muted hover:text-fg">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <Guruh nom="Yo‘nalish">
          {DUEL_YONALISHLARI.map((y) => <button key={y.id} type="button" className={tanla(yonalish === y.id)} onClick={() => setYonalish(y.id)}>{y.nom}</button>)}
        </Guruh>
        <Guruh nom="Qiyinlik">
          {DUEL_QIYINLIK.map((q) => <button key={q.id} type="button" className={tanla(qiyinlik === q.id)} onClick={() => setQiyinlik(q.id)}>{q.nom}</button>)}
        </Guruh>
        <Guruh nom="Davomiyligi">
          {DUEL_DAVOMIYLIKLARI.map((d) => <button key={d.soniya} type="button" className={tanla(davomiylik === d.soniya)} onClick={() => setDavomiylik(d.soniya)}>{d.nom}</button>)}
        </Guruh>
        <Guruh nom="Savollar soni">
          {DUEL_VAZIFALAR_SONI.map((s) => <button key={s} type="button" className={tanla(soni === s)} onClick={() => setSoni(s)}>{s} ta</button>)}
        </Guruh>

        {xato ? <p role="alert" className="mt-4 text-sm font-bold text-red-400">{xato}</p> : null}
        <Button className="mt-6 w-full" size="lg" disabled={band} onClick={yubor}>
          {band ? "Yuborilmoqda…" : "Taklif yuborish"}
        </Button>
      </div>
    </div>
  );
}

function Guruh({ nom, children }: { nom: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-xs font-extrabold uppercase tracking-wide text-fg-muted">{nom}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
