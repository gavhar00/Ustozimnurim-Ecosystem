"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart, LoaderCircle, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { postniOchir, postniTahrirla } from "@/app/lenta/amallar";
import { yoqtirishniAlmashtir } from "@/app/ijtimoiy/amallar";
import { Izohlar } from "@/components/lenta/izohlar";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { RasmTanlagich, type YangiRasm } from "@/components/lenta/rasm-tanlagich";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import { rasmlarniYukla } from "@/lib/lenta-rasm";
import { POST_MAKS_MATN, type LentaPost } from "@/lib/lenta-turlari";
import { tadbirSanasi } from "@/lib/sana";
import { cn } from "@/lib/utils";

export type Men = { id: string; admin: boolean };

const amalTugma =
  "inline-flex min-h-10 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold text-fg-muted transition-colors hover:bg-gold-400/10 hover:text-fg disabled:opacity-50";

export function PostKartasi({
  post,
  men,
  yangilandi,
  ochirildi,
}: {
  post: LentaPost;
  men: Men;
  yangilandi: (post: LentaPost) => void;
  ochirildi: (id: string) => void;
}) {
  const ozimniki = post.muallif_id === men.id;
  const ochira = ozimniki || men.admin;

  const [izohOchiq, setIzohOchiq] = useState(false);
  const [tahrirlash, setTahrirlash] = useState(false);
  const [tasdiq, setTasdiq] = useState(false);
  const [band, setBand] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  const [matn, setMatn] = useState(post.matn);
  const [mavjud, setMavjud] = useState(post.rasmlar);
  const [yangilar, setYangilar] = useState<YangiRasm[]>([]);
  const korinishlar = useRef<string[]>([]);

  useEffect(() => {
    const royxat = korinishlar;
    return () => royxat.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function tahrirniBoshlash() {
    setMatn(post.matn);
    setMavjud(post.rasmlar);
    setXato(null);
    setTahrirlash(true);
  }
  function tahrirniYopish() {
    yangilar.forEach((r) => URL.revokeObjectURL(r.korinish));
    korinishlar.current = [];
    setYangilar([]);
    setTahrirlash(false);
    setXato(null);
  }

  async function yoqtirish() {
    if (band) return;
    setBand(true);
    setXato(null);
    const hozir = post.ozim_yoqtirdim;
    // Darhol ko‘rsatamiz, xato bo‘lsa qaytaramiz.
    yangilandi({
      ...post,
      ozim_yoqtirdim: !hozir,
      yoqtirishlar_soni: Math.max(post.yoqtirishlar_soni + (hozir ? -1 : 1), 0),
    });
    const natija = await yoqtirishniAlmashtir(post.id, hozir);
    if (natija.xato) {
      yangilandi(post);
      setXato(natija.xato);
    }
    setBand(false);
  }

  async function saqlash() {
    if (band) return;
    setBand(true);
    setXato(null);
    const yuklash = await rasmlarniYukla(yangilar.map((r) => r.fayl), men.id);
    if (yuklash.xato) {
      setXato(yuklash.xato);
      setBand(false);
      return;
    }
    const natija = await postniTahrirla(post.id, {
      matn,
      rasmlar: [...mavjud, ...yuklash.urllar],
    });
    setBand(false);
    if (!natija.ok) return setXato(natija.xato);
    yangilandi({ ...post, ...natija.malumot });
    tahrirniYopish();
  }

  async function ochirish() {
    if (band) return;
    setBand(true);
    setXato(null);
    const natija = await postniOchir(post.id);
    if (!natija.ok) {
      setBand(false);
      setTasdiq(false);
      return setXato(natija.xato);
    }
    ochirildi(post.id);
  }

  const bosh = matn.trim().length === 0 && mavjud.length + yangilar.length === 0;
  const profilHavolasi = post.muallif.username ? `/profil/${post.muallif.username}` : null;

  return (
    <article className="surface-card space-y-4 p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <MuallifAvatari ism={post.muallif.toliq_ism} url={post.muallif.avatar_url} />
        <div className="min-w-0 flex-1">
          {profilHavolasi ? (
            <Link href={profilHavolasi} className="block truncate text-[0.95rem] font-extrabold text-fg hover:text-gold-300">
              {post.muallif.toliq_ism}
            </Link>
          ) : (
            <span className="block truncate text-[0.95rem] font-extrabold">{post.muallif.toliq_ism}</span>
          )}
          <p className="text-xs text-fg-muted">
            {post.muallif.username ? `@${post.muallif.username} · ` : ""}
            <time dateTime={post.yaratilgan}>{tadbirSanasi(post.yaratilgan)}</time>
            {post.yangilangan ? <span title={tadbirSanasi(post.yangilangan)}> · tahrirlangan</span> : null}
          </p>
        </div>
        {ochira && !tahrirlash ? (
          <div className="flex shrink-0 items-center gap-1">
            {ozimniki ? (
              <button type="button" onClick={tahrirniBoshlash} className={amalTugma} aria-label="Postni tahrirlash">
                <Pencil className="size-4" aria-hidden="true" />
              </button>
            ) : null}
            {!tasdiq ? (
              <button type="button" onClick={() => setTasdiq(true)} className={cn(amalTugma, "hover:text-[#ffb3ad]")} aria-label="Postni o‘chirish">
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {tasdiq ? (
        <div role="alertdialog" aria-label="O‘chirishni tasdiqlash" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#ff8f87]/35 bg-[#ff8f87]/10 px-4 py-3 text-sm">
          <span className="text-[#ffb3ad]">Post va uning rasmlari butunlay o‘chadi. Davom etasizmi?</span>
          <span className="ml-auto flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(false)} disabled={band}>Bekor qilish</Button>
            <Button type="button" size="sm" onClick={() => void ochirish()} disabled={band}>
              {band ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              Ha, o‘chirish
            </Button>
          </span>
        </div>
      ) : null}

      {tahrirlash ? (
        <div className="space-y-3">
          <label htmlFor={`tahrir-${post.id}`} className="sr-only">Post matni</label>
          <textarea
            id={`tahrir-${post.id}`}
            value={matn}
            onChange={(e) => setMatn(e.target.value)}
            maxLength={POST_MAKS_MATN}
            rows={4}
            disabled={band}
            className="w-full resize-y rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg focus:border-gold-400 focus:outline-none"
          />
          <RasmTanlagich
            mavjud={mavjud}
            yangilar={yangilar}
            mavjudniOlibTashla={(url) => setMavjud((e) => e.filter((u) => u !== url))}
            yangiQosh={(r) => {
              korinishlar.current.push(...r.map((x) => x.korinish));
              setYangilar((e) => [...e, ...r]);
            }}
            yanginiOlibTashla={(id) =>
              setYangilar((e) => {
                const t = e.find((x) => x.id === id);
                if (t) URL.revokeObjectURL(t.korinish);
                return e.filter((x) => x.id !== id);
              })
            }
            xatoBerish={setXato}
            bloklangan={band}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={tahrirniYopish} disabled={band}>Bekor qilish</Button>
            <Button type="button" size="sm" onClick={() => void saqlash()} disabled={band || bosh}>
              {band ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      ) : (
        <>
          {post.matn ? (
            <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-fg">{post.matn}</p>
          ) : null}
          {post.rasmlar.length > 0 ? (
            <ul className={cn("grid gap-2", post.rasmlar.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {post.rasmlar.map((url, i) => (
                <li key={url} className={cn("relative overflow-hidden rounded-xl border border-border-subtle bg-ink-850/60", post.rasmlar.length === 1 ? "aspect-[16/10]" : "aspect-square", post.rasmlar.length === 3 && i === 0 && "row-span-2 aspect-auto")}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Rasmni to‘liq ochish">
                    <Image src={url} alt={`${post.muallif.toliq_ism} postidagi rasm`} fill sizes="(max-width: 672px) 100vw, 336px" className="object-cover" unoptimized />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      {xato ? <FormXabar>{xato}</FormXabar> : null}

      <footer className="flex items-center gap-1 border-t border-border-subtle pt-3">
        <button
          type="button"
          onClick={() => void yoqtirish()}
          disabled={band}
          aria-pressed={post.ozim_yoqtirdim}
          aria-label={post.ozim_yoqtirdim ? "Yoqtirishni bekor qilish" : "Yoqtirish"}
          className={cn(amalTugma, post.ozim_yoqtirdim && "text-gold-300")}
        >
          <Heart className={cn("size-4", post.ozim_yoqtirdim && "fill-current")} aria-hidden="true" />
          {post.yoqtirishlar_soni}
        </button>
        <button
          type="button"
          onClick={() => setIzohOchiq((v) => !v)}
          aria-expanded={izohOchiq}
          className={amalTugma}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {post.izohlar_soni} <span className="sr-only">izoh</span>
        </button>
      </footer>

      {izohOchiq ? (
        <Izohlar
          postId={post.id}
          postMuallifId={post.muallif_id}
          men={men}
          sonOzgardi={(farq) =>
            yangilandi({ ...post, izohlar_soni: Math.max(post.izohlar_soni + farq, 0) })
          }
        />
      ) : null}
    </article>
  );
}
