"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, LoaderCircle, MessageCircle, Repeat2, Trash2 } from "lucide-react";
import { laykniAlmashtir, lahzaniOchir, repostniAlmashtir } from "@/app/lahzalar/amallar";
import { Laykchilar } from "@/components/lahzalar/laykchilar";
import { LahzaIzohlari } from "@/components/lahzalar/lahza-izohlari";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import { sozlarSoni, type LahzaAsos, type LahzaPost } from "@/lib/lahza-turlari";
import { tadbirSanasi } from "@/lib/sana";
import { cn } from "@/lib/utils";

export type LahzaMen = { id: string; admin: boolean } | null;

const amalTugma =
  "inline-flex min-h-10 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold text-fg-muted transition-colors hover:bg-gold-400/10 hover:text-fg disabled:opacity-50";
const KIRISH = "/kirish?keyin=%2Flahzalar";
const UZUN_SOZ = 120;

function Muallif({ l }: { l: LahzaAsos }) {
  return l.muallif.username ? (
    <Link href={`/profil/${l.muallif.username}`} className="block truncate text-[0.95rem] font-extrabold text-fg hover:text-gold-300">
      {l.muallif.toliq_ism}
    </Link>
  ) : (
    <span className="block truncate text-[0.95rem] font-extrabold">{l.muallif.toliq_ism}</span>
  );
}

export function LahzaKartasi({
  lahza,
  men,
  asosYangilandi,
  repostYaratildi,
  repostOlindi,
  ochirildi,
}: {
  lahza: LahzaPost;
  men: LahzaMen;
  asosYangilandi: (id: string, patch: Partial<LahzaAsos>) => void;
  repostYaratildi: (repost: LahzaPost) => void;
  repostOlindi: (aslId: string) => void;
  ochirildi: (id: string) => void;
}) {
  const asos: LahzaAsos = lahza.asl ?? lahza;
  const repostMi = lahza.asl !== null;
  const ozimniki = !!men && lahza.profil_id === men.id; // kartaning o‘zi (repost bo‘lsa — repost)
  const ochira = ozimniki || !!men?.admin;
  const asosOzimniki = !!men && asos.profil_id === men.id;

  const [panel, setPanel] = useState<null | "izoh" | "layk">(null);
  const [laykVersiya, setLaykVersiya] = useState(0);
  const [kengaytirilgan, setKengaytirilgan] = useState(false);
  const [tasdiq, setTasdiq] = useState(false);
  const [band, setBand] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  const uzun = sozlarSoni(asos.matn) > UZUN_SOZ;

  async function layk() {
    if (!men || band) return;
    setBand(true);
    setXato(null);
    const hozir = asos.ozim_layk;
    asosYangilandi(asos.id, {
      ozim_layk: !hozir,
      layklar_soni: Math.max(asos.layklar_soni + (hozir ? -1 : 1), 0),
    });
    const n = await laykniAlmashtir(asos.id, hozir);
    if (!n.ok) {
      asosYangilandi(asos.id, { ozim_layk: hozir, layklar_soni: asos.layklar_soni });
      setXato(n.xato);
    } else {
      asosYangilandi(asos.id, n.malumot);
      setLaykVersiya((v) => v + 1);
    }
    setBand(false);
  }

  async function repost() {
    if (!men || band) return;
    setBand(true);
    setXato(null);
    const n = await repostniAlmashtir(asos.id, asos.ozim_repost);
    if (!n.ok) {
      setXato(n.xato);
    } else {
      asosYangilandi(asos.id, { repostlar_soni: n.malumot.repostlar_soni, ozim_repost: n.malumot.ozim_repost });
      if (n.malumot.repost) repostYaratildi(n.malumot.repost);
      else repostOlindi(asos.id);
    }
    setBand(false);
  }

  async function ochirish() {
    if (band) return;
    setBand(true);
    setXato(null);
    const n = await lahzaniOchir(lahza.id);
    if (!n.ok) {
      setBand(false);
      setTasdiq(false);
      return setXato(n.xato);
    }
    ochirildi(lahza.id);
  }

  const rasmlar = asos.rasmlar;

  return (
    <article className="surface-card space-y-4 p-4 sm:p-5">
      {repostMi ? (
        <p className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
          <Repeat2 className="size-4 text-gold-300" aria-hidden="true" />
          <span>
            {lahza.muallif.username ? (
              <Link href={`/profil/${lahza.muallif.username}`} className="font-bold text-fg hover:text-gold-300">
                {lahza.muallif.toliq_ism}
              </Link>
            ) : (
              <span className="font-bold text-fg">{lahza.muallif.toliq_ism}</span>
            )}{" "}
            repost qildi · <time dateTime={lahza.yaratilgan}>{tadbirSanasi(lahza.yaratilgan)}</time>
          </span>
        </p>
      ) : null}

      <header className="flex items-start gap-3">
        <MuallifAvatari ism={asos.muallif.toliq_ism} url={asos.muallif.avatar_url} />
        <div className="min-w-0 flex-1">
          <Muallif l={asos} />
          <p className="text-xs text-fg-muted">
            {asos.muallif.username ? `@${asos.muallif.username} · ` : ""}
            <time dateTime={asos.yaratilgan}>{tadbirSanasi(asos.yaratilgan)}</time>
            {asos.yangilangan ? <span> · tahrirlangan</span> : null}
          </p>
        </div>
        {ochira && !tasdiq ? (
          <button
            type="button"
            onClick={() => setTasdiq(true)}
            className={cn(amalTugma, "shrink-0 hover:text-[#ffb3ad]")}
            aria-label={repostMi ? "Repostni o‘chirish" : "Lahzani o‘chirish"}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </header>

      {tasdiq ? (
        <div role="alertdialog" aria-label="O‘chirishni tasdiqlash" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#ff8f87]/35 bg-[#ff8f87]/10 px-4 py-3 text-sm">
          <span className="text-[#ffb3ad]">
            {repostMi ? "Repost o‘chadi (asl lahza qoladi)." : "Lahza, rasmlari, layk va izohlari butunlay o‘chadi."} Davom etasizmi?
          </span>
          <span className="ml-auto flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(false)} disabled={band}>Bekor qilish</Button>
            <Button type="button" size="sm" onClick={() => void ochirish()} disabled={band}>
              {band ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              Ha, o‘chirish
            </Button>
          </span>
        </div>
      ) : null}

      {asos.matn ? (
        <div>
          <p className={cn("whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-fg", uzun && !kengaytirilgan && "line-clamp-6")}>
            {asos.matn}
          </p>
          {uzun ? (
            <button
              type="button"
              onClick={() => setKengaytirilgan((v) => !v)}
              aria-expanded={kengaytirilgan}
              className="mt-2 text-sm font-bold text-gold-300 hover:text-gold-200"
            >
              {kengaytirilgan ? "Yig‘ish" : "To‘liq o‘qish"}
            </button>
          ) : null}
        </div>
      ) : null}

      {rasmlar.length > 0 ? (
        <ul className={cn("grid gap-2", rasmlar.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {rasmlar.map((url, i) => (
            <li key={url} className={cn("relative overflow-hidden rounded-xl border border-border-subtle bg-ink-850/60", rasmlar.length === 1 ? "aspect-[16/10]" : "aspect-square", rasmlar.length === 3 && i === 0 && "row-span-2 aspect-auto")}>
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Rasmni to‘liq ochish">
                <Image src={url} alt={`${asos.muallif.toliq_ism} lahzasidagi rasm`} fill sizes="(max-width: 672px) 100vw, 336px" className="object-cover" unoptimized />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {xato ? <FormXabar>{xato}</FormXabar> : null}

      <footer className="flex flex-wrap items-center gap-1 border-t border-border-subtle pt-3">
        {men ? (
          <button
            type="button"
            onClick={() => void layk()}
            disabled={band}
            aria-pressed={asos.ozim_layk}
            aria-label={asos.ozim_layk ? "Yoqtirishni bekor qilish" : "Yoqtirish"}
            className={cn(amalTugma, "pr-1.5", asos.ozim_layk && "text-gold-300")}
          >
            <Heart className={cn("size-4", asos.ozim_layk && "fill-current")} aria-hidden="true" />
          </button>
        ) : (
          <Link href={KIRISH} className={cn(amalTugma, "pr-1.5")} aria-label="Yoqtirish uchun kiring">
            <Heart className="size-4" aria-hidden="true" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setPanel((p) => (p === "layk" ? null : "layk"))}
          aria-expanded={panel === "layk"}
          aria-label={`Kim yoqtirdi: ${asos.layklar_soni} ta`}
          className={cn(amalTugma, "pl-1.5")}
        >
          {asos.layklar_soni}
        </button>

        <button
          type="button"
          onClick={() => setPanel((p) => (p === "izoh" ? null : "izoh"))}
          aria-expanded={panel === "izoh"}
          className={amalTugma}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {asos.izohlar_soni} <span className="sr-only">izoh</span>
        </button>

        {men ? (
          <button
            type="button"
            onClick={() => void repost()}
            disabled={band || asosOzimniki}
            aria-pressed={asos.ozim_repost}
            title={asosOzimniki ? "O‘z lahzangizni repost qilib bo‘lmaydi" : asos.ozim_repost ? "Repostni bekor qilish" : "Repost qilish"}
            aria-label={asos.ozim_repost ? "Repostni bekor qilish" : "Repost qilish"}
            className={cn(amalTugma, asos.ozim_repost && "text-gold-300")}
          >
            <Repeat2 className="size-4" aria-hidden="true" />
            {asos.repostlar_soni}
          </button>
        ) : (
          <Link href={KIRISH} className={amalTugma} aria-label="Repost qilish uchun kiring">
            <Repeat2 className="size-4" aria-hidden="true" />
            {asos.repostlar_soni}
          </Link>
        )}
      </footer>

      {panel === "layk" ? <Laykchilar lahzaId={asos.id} versiya={laykVersiya} /> : null}
      {panel === "izoh" ? (
        <LahzaIzohlari
          lahzaId={asos.id}
          lahzaMuallifId={asos.profil_id}
          men={men ?? { id: "", admin: false }}
          yozish={!!men}
          sonOzgardi={(farq) => asosYangilandi(asos.id, { izohlar_soni: Math.max(asos.izohlar_soni + farq, 0) })}
        />
      ) : null}
    </article>
  );
}
