"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { postYarat } from "@/app/lenta/amallar";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { RasmTanlagich, type YangiRasm } from "@/components/lenta/rasm-tanlagich";
import { Button } from "@/components/ui/button";
import { FormXabar } from "@/components/ui/form";
import { rasmlarniYukla } from "@/lib/lenta-rasm";
import { POST_MAKS_MATN, type LentaPost } from "@/lib/lenta-turlari";

export function PostYozish({
  men,
  yaratildi,
}: {
  men: { id: string; toliq_ism: string; avatar_url: string | null };
  yaratildi: (post: LentaPost) => void;
}) {
  const [matn, setMatn] = useState("");
  const [yangilar, setYangilar] = useState<YangiRasm[]>([]);
  const [xato, setXato] = useState<string | null>(null);
  const [muvaffaqiyat, setMuvaffaqiyat] = useState(false);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const korinishlar = useRef<string[]>([]);
  const taymer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const royxat = korinishlar;
    return () => {
      royxat.current.forEach((u) => URL.revokeObjectURL(u));
      if (taymer.current) clearTimeout(taymer.current);
    };
  }, []);

  function qosh(r: YangiRasm[]) {
    korinishlar.current.push(...r.map((x) => x.korinish));
    setYangilar((eski) => [...eski, ...r]);
  }
  function olibTashla(id: string) {
    setYangilar((eski) => {
      const topildi = eski.find((x) => x.id === id);
      if (topildi) URL.revokeObjectURL(topildi.korinish);
      return eski.filter((x) => x.id !== id);
    });
  }

  const bosh = matn.trim().length === 0 && yangilar.length === 0;

  async function yuborish(e: React.FormEvent) {
    e.preventDefault();
    if (bosh || yuborilmoqda) return;
    setXato(null);
    setMuvaffaqiyat(false);
    setYuborilmoqda(true);

    const yuklash = await rasmlarniYukla(yangilar.map((r) => r.fayl), men.id);
    if (yuklash.xato) {
      setXato(yuklash.xato);
      setYuborilmoqda(false);
      return;
    }

    const natija = await postYarat({ matn, rasmlar: yuklash.urllar });
    setYuborilmoqda(false);
    if (!natija.ok) {
      setXato(natija.xato);
      return;
    }

    yangilar.forEach((r) => URL.revokeObjectURL(r.korinish));
    korinishlar.current = [];
    setYangilar([]);
    setMatn("");
    setMuvaffaqiyat(true);
    if (taymer.current) clearTimeout(taymer.current);
    taymer.current = setTimeout(() => setMuvaffaqiyat(false), 4000);
    yaratildi(natija.malumot);
  }

  return (
    <form onSubmit={yuborish} className="surface-card space-y-4 p-4 sm:p-5" aria-label="Yangi post yozish">
      <div className="flex gap-3">
        <MuallifAvatari ism={men.toliq_ism} url={men.avatar_url} />
        <div className="min-w-0 flex-1">
          <label htmlFor="yangi-post" className="sr-only">Post matni</label>
          <textarea
            id="yangi-post"
            value={matn}
            onChange={(e) => setMatn(e.target.value)}
            maxLength={POST_MAKS_MATN}
            rows={3}
            disabled={yuborilmoqda}
            placeholder="Nimani o‘rgandingiz, nima qurdingiz yoki qanday savolingiz bor?"
            className="w-full resize-y rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg placeholder:text-muted-soft focus:border-gold-400 focus:outline-none"
          />
        </div>
      </div>

      <RasmTanlagich
        mavjud={[]}
        yangilar={yangilar}
        mavjudniOlibTashla={() => {}}
        yangiQosh={qosh}
        yanginiOlibTashla={olibTashla}
        xatoBerish={setXato}
        bloklangan={yuborilmoqda}
      />

      {xato ? <FormXabar>{xato}</FormXabar> : null}
      {muvaffaqiyat ? (
        <FormXabar turi="muvaffaqiyat">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Post joylandi.
          </span>
        </FormXabar>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-fg-muted">{matn.length}/{POST_MAKS_MATN}</span>
        <Button type="submit" disabled={bosh || yuborilmoqda}>
          {yuborilmoqda ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {yuborilmoqda ? "Joylanmoqda…" : "Post yozish"}
        </Button>
      </div>
    </form>
  );
}
