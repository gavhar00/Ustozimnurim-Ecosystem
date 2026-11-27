"use client";

import { useRef, useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { vazifaHolatiniOzgartir, vazifaOchir, vazifaYarat } from "@/app/admin/vazifalar/amallar";
import { supabaseBrauzer } from "@/lib/supabase/client";

const maydon =
  "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-sm text-fg placeholder:text-muted-soft focus:border-gold-400";
const MAKS_BAYT = 25 * 1024 * 1024;

export function VazifaFormasi() {
  const forma = useRef<HTMLFormElement>(null);
  const [xato, setXato] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();

  function yubor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fayl = f.get("fayl");
    const faylBor = fayl instanceof File && fayl.size > 0;
    setXato(null);
    setOk(null);
    if (faylBor && (fayl as File).size > MAKS_BAYT) return setXato("Fayl 25 MB dan oshmasin.");
    startTransition(async () => {
      let yol: string | null = null;
      let faylNomi: string | null = null;
      if (faylBor) {
        const asl = fayl as File;
        faylNomi = asl.name.slice(0, 120);
        const xavfsiz = asl.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80) || "fayl";
        yol = `${crypto.randomUUID()}/${xavfsiz}`;
        const sb = supabaseBrauzer();
        if (!sb) return setXato("Baza ulanmagan.");
        const { error } = await sb.storage.from("vazifa-fayllari").upload(yol, asl, { contentType: asl.type || "application/octet-stream" });
        if (error) return setXato("Faylni yuklab bo‘lmadi. Admin huquqini tekshiring.");
      }
      const r = await vazifaYarat(
        String(f.get("nom") ?? ""),
        String(f.get("tavsif") ?? ""),
        Number(f.get("muddat") ?? 48),
        yol,
        faylNomi,
      );
      if (r.xato) return setXato(r.xato);
      setOk(r.muvaffaqiyat ?? "Yaratildi.");
      forma.current?.reset();
    });
  }

  return (
    <form ref={forma} onSubmit={yubor} className="space-y-5">
      {xato ? <FormXabar>{xato}</FormXabar> : null}
      {ok ? <FormXabar turi="muvaffaqiyat">{ok}</FormXabar> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="v-nom">Vazifa nomi</Label>
          <Input id="v-nom" name="nom" required minLength={3} maxLength={150} />
        </div>
        <div>
          <Label htmlFor="v-muddat">Muddat (soat) — o‘quvchi boshlagan zahoti ochiladi</Label>
          <Input id="v-muddat" name="muddat" type="number" min={1} max={720} defaultValue={48} required />
        </div>
      </div>
      <div>
        <Label htmlFor="v-tavsif">Vazifa sharti</Label>
        <textarea id="v-tavsif" name="tavsif" required minLength={10} maxLength={6000} rows={6} className={maydon} />
      </div>
      <div>
        <Label htmlFor="v-fayl">Loyiha fayli (ixtiyoriy, 25 MB gacha)</Label>
        <input id="v-fayl" name="fayl" type="file" className="block w-full text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-ink-950" />
        <p className="mt-1 text-xs text-fg-muted">Fayl o‘quvchiga vazifani boshlagandan keyin beriladi.</p>
      </div>
      <Button type="submit" disabled={kutilmoqda}>{kutilmoqda ? "Yaratilmoqda…" : "Vazifa yaratish"}</Button>
    </form>
  );
}

export function VazifaAmallari({ id, holat }: { id: string; holat: string }) {
  const [joriy, setJoriy] = useState(holat);
  const [tasdiq, setTasdiq] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [kutilmoqda, startTransition] = useTransition();
  const chop = joriy === "chop_etilgan";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={chop ? "secondary" : "primary"}
        disabled={kutilmoqda}
        onClick={() =>
          startTransition(async () => {
            const yangi = chop ? "qoralama" : "chop_etilgan";
            const n = await vazifaHolatiniOzgartir(id, yangi);
            if (n.xato) setXato(n.xato);
            else setJoriy(yangi);
          })
        }
      >
        {chop ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        {chop ? "Qoralamaga" : "Chop etish"}
      </Button>
      {tasdiq ? (
        <>
          <Button
            type="button"
            size="sm"
            disabled={kutilmoqda}
            onClick={() =>
              startTransition(async () => {
                const n = await vazifaOchir(id);
                if (n.xato) setXato(n.xato);
              })
            }
          >
            Ha, o‘chirish (topshiriqlari ham o‘chadi)
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(false)}>Bekor qilish</Button>
        </>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={() => setTasdiq(true)}>
          <Trash2 className="size-4" aria-hidden="true" /> O‘chirish
        </Button>
      )}
      {xato ? <span className="text-sm text-[#ffb3ad]">{xato}</span> : null}
    </div>
  );
}
