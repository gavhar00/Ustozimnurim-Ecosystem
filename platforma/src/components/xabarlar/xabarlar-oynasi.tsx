"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, FileText, Paperclip, Search, Send, Swords, X } from "lucide-react";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { suhbatlarniOl, suhbatniOl, xabarYubor } from "@/app/xabarlar/amallar";
import { supabaseBrauzer } from "@/lib/supabase/client";
import { qiyinlikNomi, yonalishNomi } from "@/lib/duel-turlari";
import {
  XABAR_BUCKET,
  XABAR_FAYL_TURLARI,
  XABAR_MAKS_BAYT,
  XABAR_MAKS_MATN,
  hajmMatni,
  type Suhbat,
  type SuhbatDueli,
  type SuhbatMalumoti,
  type Xabar,
} from "@/lib/xabar-turlari";
import { cn } from "@/lib/utils";

const vaqt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const kun = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

type Element =
  | { tur: "xabar"; vaqt: string; x: Xabar }
  | { tur: "duel"; vaqt: string; d: SuhbatDueli };

function DuelKartasi({ d, boshqaIsm }: { d: SuhbatDueli; boshqaIsm: string }) {
  const holat =
    d.holat === "kutilmoqda"
      ? d.men_chaqirdim
        ? `${boshqaIsm} javobini kutyapsiz`
        : `${boshqaIsm} sizni duelga chaqirdi`
      : d.holat === "qabul_qilindi" || d.holat === "boshlandi"
        ? "Duel davom etmoqda"
        : d.holat === "tugadi"
          ? "Duel yakunlandi"
          : d.holat === "rad"
            ? "Taklif rad etildi"
            : "Taklif bekor qilindi";
  const harakat = d.holat === "kutilmoqda" && !d.men_chaqirdim ? "Javob berish" : d.holat === "tugadi" || d.holat === "qabul_qilindi" || d.holat === "boshlandi" ? "Ochish" : null;
  return (
    <div className="mx-auto my-2 w-full max-w-sm rounded-2xl border border-gold-400/30 bg-gold-400/10 p-3 text-center">
      <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gold-300">
        <Swords className="size-3.5" aria-hidden="true" /> Duel · {yonalishNomi(d.yonalish)} · {qiyinlikNomi(d.qiyinlik)}
      </p>
      <p className="mt-1 text-sm font-bold">{holat}</p>
      {harakat ? (
        <Link
          href={d.holat === "kutilmoqda" ? "/duel" : `/duel/${d.id}`}
          className="mt-2 inline-flex h-8 items-center rounded-full bg-gold-400 px-4 text-xs font-black text-ink-950 hover:bg-gold-300"
        >
          {harakat}
        </Link>
      ) : null}
    </div>
  );
}

function Pufak({ x }: { x: Xabar }) {
  return (
    <div className={cn("flex", x.men ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2 text-sm",
          x.men ? "rounded-br-md bg-gold-400 text-ink-950" : "rounded-bl-md border border-border-subtle bg-bg-elevated",
        )}
      >
        {x.fayl_url && x.fayl_turi === "rasm" ? (
          <a href={x.fayl_url} target="_blank" rel="noopener noreferrer" className="mb-1 block overflow-hidden rounded-xl">
            <Image
              src={x.fayl_url}
              alt={x.fayl_nomi ?? "Rasm"}
              width={320}
              height={240}
              unoptimized
              className="h-auto max-h-64 w-full object-cover"
            />
          </a>
        ) : null}
        {x.fayl_url && x.fayl_turi === "fayl" ? (
          <a
            href={x.fayl_url}
            target="_blank"
            rel="noopener noreferrer"
            download={x.fayl_nomi ?? undefined}
            className={cn(
              "mb-1 flex items-center gap-2 rounded-xl p-2",
              x.men ? "bg-ink-950/10" : "bg-bg/60",
            )}
          >
            <FileText className="size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate font-bold">{x.fayl_nomi ?? "Fayl"}</span>
              <span className="block text-xs opacity-70">{hajmMatni(x.fayl_hajmi)}</span>
            </span>
          </a>
        ) : null}
        {x.matn ? <p className="whitespace-pre-wrap break-words">{x.matn}</p> : null}
        <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[0.65rem]", x.men ? "text-ink-950/70" : "text-fg-muted")}>
          <span suppressHydrationWarning>{vaqt(x.yaratilgan)}</span>
          {x.men ? (
            x.oqilgan ? (
              <CheckCheck className="size-3.5" aria-label="O‘qildi" />
            ) : (
              <Check className="size-3.5" aria-label="Yuborildi" />
            )
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function XabarlarOynasi({
  menId,
  boshlangichSuhbatlar,
  boshlangichTanlangan,
}: {
  menId: string;
  boshlangichSuhbatlar: Suhbat[];
  boshlangichTanlangan: string | null;
}) {
  const [suhbatlar, setSuhbatlar] = useState(boshlangichSuhbatlar);
  const [tanlangan, setTanlangan] = useState<string | null>(boshlangichTanlangan);
  const [malumot, setMalumot] = useState<SuhbatMalumoti | null>(null);
  const [qidiruv, setQidiruv] = useState("");
  const [matn, setMatn] = useState("");
  const [fayl, setFayl] = useState<File | null>(null);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [xato, setXato] = useState("");
  const oxiri = useRef<HTMLDivElement>(null);
  const fayliTanlash = useRef<HTMLInputElement>(null);

  const tanlash = useCallback((id: string | null) => {
    setTanlangan(id);
    setXato("");
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("kim", id);
    else url.searchParams.delete("kim");
    window.history.replaceState(null, "", url);
  }, []);

  // Suhbatlar ro‘yxatini vaqti-vaqti bilan yangilab turamiz.
  useEffect(() => {
    let tirik = true;
    const t = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      suhbatlarniOl().then((r) => tirik && setSuhbatlar(r)).catch(() => undefined);
    }, 6000);
    return () => {
      tirik = false;
      clearInterval(t);
    };
  }, []);

  // Tanlangan suhbatni yuklaymiz va tez-tez yangilaymiz.
  useEffect(() => {
    if (!tanlangan) return;
    let tirik = true;
    const yukla = () => {
      if (document.visibilityState === "hidden") return;
      suhbatniOl(tanlangan)
        .then((r) => {
          if (tirik && r) setMalumot(r);
        })
        .catch(() => undefined);
    };
    yukla();
    const t = setInterval(yukla, 2500);
    return () => {
      tirik = false;
      clearInterval(t);
    };
  }, [tanlangan]);

  const joriy = malumot && malumot.boshqa.id === tanlangan ? malumot : null;
  const oxirgiXabarId = joriy?.xabarlar[joriy.xabarlar.length - 1]?.id;
  useEffect(() => {
    oxiri.current?.scrollIntoView({ block: "end" });
  }, [oxirgiXabarId, tanlangan]);

  const royxat = useMemo(() => {
    const q = qidiruv.trim().toLowerCase();
    return q
      ? suhbatlar.filter((s) => s.toliq_ism.toLowerCase().includes(q) || (s.username ?? "").toLowerCase().includes(q))
      : suhbatlar;
  }, [suhbatlar, qidiruv]);

  const vaqtChizigi = useMemo<Element[]>(() => {
    if (!joriy) return [];
    return [
      ...joriy.xabarlar.map((x) => ({ tur: "xabar" as const, vaqt: x.yaratilgan, x })),
      ...joriy.duellar.map((d) => ({ tur: "duel" as const, vaqt: d.yaratilgan, d })),
    ].sort((a, b) => a.vaqt.localeCompare(b.vaqt));
  }, [joriy]);

  const tanlanganSuhbat = suhbatlar.find((s) => s.id === tanlangan) ?? null;
  const boshqaIsm = joriy?.boshqa.toliq_ism ?? tanlanganSuhbat?.toliq_ism ?? "";

  function faylTanla(f: File | null) {
    setXato("");
    if (!f) return setFayl(null);
    const kengaytma = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!XABAR_FAYL_TURLARI[kengaytma]) {
      return setXato("Bu fayl turi qo‘llab-quvvatlanmaydi (rasm, PDF, TXT, ZIP, DOCX, PPTX, XLSX).");
    }
    if (f.size > XABAR_MAKS_BAYT) return setXato("Fayl 10 MB dan oshmasligi kerak.");
    setFayl(f);
  }

  async function yubor() {
    if (!tanlangan || yuborilmoqda) return;
    const t = matn.trim();
    if (!t && !fayl) return;
    setYuborilmoqda(true);
    setXato("");
    try {
      let yuk: { url: string; nomi: string; turi: "rasm" | "fayl"; hajmi: number } | undefined;
      if (fayl) {
        const sb = supabaseBrauzer();
        if (!sb) throw new Error("Baza ulanmagan.");
        const kengaytma = fayl.name.split(".").pop()?.toLowerCase() ?? "bin";
        const mime = XABAR_FAYL_TURLARI[kengaytma];
        const yol = `${menId}/${crypto.randomUUID()}.${kengaytma}`;
        const { error } = await sb.storage.from(XABAR_BUCKET).upload(yol, fayl, { contentType: mime });
        if (error) throw new Error("Faylni yuklab bo‘lmadi.");
        const { data } = sb.storage.from(XABAR_BUCKET).getPublicUrl(yol);
        yuk = { url: data.publicUrl, nomi: fayl.name, turi: mime.startsWith("image/") ? "rasm" : "fayl", hajmi: fayl.size };
      }
      const r = await xabarYubor(tanlangan, t, yuk);
      if (!r.ok) {
        setXato(r.xato);
      } else {
        setMatn("");
        setFayl(null);
        const yangi = await suhbatniOl(tanlangan);
        if (yangi) setMalumot(yangi);
        suhbatlarniOl().then(setSuhbatlar).catch(() => undefined);
      }
    } catch (e) {
      setXato(e instanceof Error ? e.message : "Xabarni yuborib bo‘lmadi.");
    } finally {
      setYuborilmoqda(false);
    }
  }

  return (
    <div className="surface-card grid h-[calc(100dvh-17rem)] min-h-[26rem] overflow-hidden md:h-[calc(100dvh-9rem)] md:grid-cols-[20rem_1fr]">
      {/* Suhbatlar ro‘yxati */}
      <aside className={cn("flex min-h-0 flex-col border-border-subtle md:border-r", tanlangan ? "hidden md:flex" : "flex")}>
        <div className="border-b border-border-subtle p-3">
          <label className="relative block">
            <span className="sr-only">Suhbatlardan qidirish</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
            <input
              value={qidiruv}
              onChange={(e) => setQidiruv(e.target.value)}
              placeholder="Qidirish"
              className="h-10 w-full rounded-full border border-border-subtle bg-bg/60 pl-9 pr-3 text-sm outline-none focus:border-gold-400"
            />
          </label>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {royxat.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => tanlash(s.id)}
                aria-current={s.id === tanlangan ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-gold-400/5",
                  s.id === tanlangan && "bg-gold-400/10",
                )}
              >
                <span className="relative">
                  <MuallifAvatari ism={s.toliq_ism} url={s.avatar_url} className="size-11" />
                  {s.onlayn ? (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-bg bg-emerald-400" aria-label="Onlayn" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold">{s.toliq_ism}</span>
                    {s.oxirgi_vaqt ? (
                      <span className="shrink-0 text-[0.65rem] text-fg-muted" suppressHydrationWarning>
                        {vaqt(s.oxirgi_vaqt)}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-fg-muted">
                      {s.oxirgi_matn || s.oxirgi_fayl_turi
                        ? `${s.oxirgi_men ? "Siz: " : ""}${s.oxirgi_matn ?? (s.oxirgi_fayl_turi === "rasm" ? "Rasm" : "Fayl")}`
                        : "Suhbatni boshlang"}
                    </span>
                    {s.oqilmagan > 0 ? (
                      <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-gold-400 px-1.5 text-[0.65rem] font-black text-ink-950">
                        {s.oqilmagan}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {royxat.length === 0 ? (
            <li className="p-6 text-center text-sm text-fg-muted">
              {suhbatlar.length === 0 ? (
                <>
                  Hali bog‘langan foydalanuvchi yo‘q. <Link href="/hamjamiyat" className="font-bold text-gold-300 hover:underline">Hamjamiyatdan</Link> bog‘laning — keyin shu yerda yozishingiz mumkin.
                </>
              ) : (
                "Hech narsa topilmadi."
              )}
            </li>
          ) : null}
        </ul>
      </aside>

      {/* Suhbat */}
      <section className={cn("min-h-0 flex-col", tanlangan ? "flex" : "hidden md:flex")}>
        {!tanlangan ? (
          <div className="m-auto p-6 text-center text-fg-muted">Suhbatni tanlang.</div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-border-subtle p-3">
              <button
                type="button"
                onClick={() => tanlash(null)}
                aria-label="Suhbatlar ro‘yxatiga qaytish"
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-gold-400/10 md:hidden"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <MuallifAvatari ism={boshqaIsm} url={joriy?.boshqa.avatar_url ?? tanlanganSuhbat?.avatar_url ?? null} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">{boshqaIsm}</p>
                <p className="text-xs text-fg-muted">
                  {(joriy?.boshqa.onlayn ?? tanlanganSuhbat?.onlayn) ? (
                    <span className="font-bold text-emerald-400">Onlayn</span>
                  ) : joriy?.boshqa.oxirgi_faollik ? (
                    <span suppressHydrationWarning>Oxirgi faollik: {kun(joriy.boshqa.oxirgi_faollik)} {vaqt(joriy.boshqa.oxirgi_faollik)}</span>
                  ) : (
                    "Oflayn"
                  )}
                </p>
              </div>
              <Link
                href="/duel"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold-400/40 px-3 text-xs font-extrabold text-gold-300 hover:bg-gold-400/10"
              >
                <Swords className="size-4" aria-hidden="true" /> Duel
              </Link>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {!joriy ? <p className="p-6 text-center text-sm text-fg-muted">Yuklanmoqda…</p> : null}
              {joriy && vaqtChizigi.length === 0 ? (
                <p className="p-6 text-center text-sm text-fg-muted">Hali xabar yo‘q. Birinchi bo‘lib yozing.</p>
              ) : null}
              {vaqtChizigi.map((e, i) => {
                const k = kun(e.vaqt);
                const sarlavha = i === 0 || kun(vaqtChizigi[i - 1].vaqt) !== k;
                return (
                  <div key={e.tur === "xabar" ? e.x.id : `d-${e.d.id}`}>
                    {sarlavha ? (
                      <p className="my-2 text-center text-[0.7rem] font-bold text-fg-muted" suppressHydrationWarning>{k}</p>
                    ) : null}
                    {e.tur === "xabar" ? <Pufak x={e.x} /> : <DuelKartasi d={e.d} boshqaIsm={boshqaIsm} />}
                  </div>
                );
              })}
              <div ref={oxiri} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void yubor();
              }}
              className="border-t border-border-subtle p-3"
            >
              {xato ? <p role="alert" className="mb-2 text-xs font-bold text-red-400">{xato}</p> : null}
              {fayl ? (
                <p className="mb-2 flex items-center gap-2 rounded-xl bg-bg/60 px-3 py-1.5 text-xs">
                  <Paperclip className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-bold">{fayl.name}</span>
                  <span className="text-fg-muted">{hajmMatni(fayl.size)}</span>
                  <button type="button" onClick={() => setFayl(null)} aria-label="Faylni olib tashlash">
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </p>
              ) : null}
              <div className="flex items-end gap-2">
                <input
                  ref={fayliTanlash}
                  type="file"
                  className="sr-only"
                  accept={Object.keys(XABAR_FAYL_TURLARI).map((k) => `.${k}`).join(",")}
                  onChange={(e) => {
                    faylTanla(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fayliTanlash.current?.click()}
                  aria-label="Rasm yoki fayl biriktirish"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle hover:bg-gold-400/10"
                >
                  <Paperclip className="size-5" aria-hidden="true" />
                </button>
                <textarea
                  value={matn}
                  onChange={(e) => setMatn(e.target.value.slice(0, XABAR_MAKS_MATN))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void yubor();
                    }
                  }}
                  rows={1}
                  placeholder="Xabar yozing…"
                  aria-label="Xabar matni"
                  className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-border-subtle bg-bg/60 px-4 py-2 text-sm outline-none focus:border-gold-400"
                />
                <button
                  type="submit"
                  disabled={yuborilmoqda || (!matn.trim() && !fayl)}
                  aria-label="Yuborish"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-950 transition-opacity hover:bg-gold-300 disabled:opacity-40"
                >
                  <Send className="size-5" aria-hidden="true" />
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
