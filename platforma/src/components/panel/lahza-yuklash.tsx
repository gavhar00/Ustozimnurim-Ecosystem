"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { lahzaQosh } from "@/app/panel/lahzalarim/amallar";
import { supabaseBrauzer } from "@/lib/supabase/client";

const MAKS_BAYT = 5 * 1024 * 1024;
const RUXSAT = ["image/jpeg", "image/png", "image/webp"];

export function LahzaYuklash({
  foydalanuvchiId,
  tadbirlar,
}: {
  foydalanuvchiId: string;
  tadbirlar: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [fayl, setFayl] = useState<File | null>(null);
  const [izoh, setIzoh] = useState("");
  const [tadbirId, setTadbirId] = useState("");
  const [rozilik, setRozilik] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [xabar, setXabar] = useState<string | null>(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [, startTransition] = useTransition();

  async function yubor(e: React.FormEvent) {
    e.preventDefault();
    setXato(null);
    setXabar(null);
    if (!fayl) return setXato("Rasm tanlang.");
    if (!RUXSAT.includes(fayl.type)) return setXato("Faqat JPG, PNG yoki WebP rasm yuklash mumkin.");
    if (fayl.size > MAKS_BAYT) return setXato("Rasm hajmi 5 MB dan oshmasligi kerak.");
    if (!rozilik) return setXato("Rasmda ko‘ringan hamma odam e’lon qilishga rozi ekanini tasdiqlang.");

    const supabase = supabaseBrauzer();
    if (!supabase) return setXato("Baza ulanmagan.");

    setYuklanmoqda(true);
    const kengaytma = fayl.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const yol = `${foydalanuvchiId}/${Date.now()}.${kengaytma}`;
    const { error } = await supabase.storage
      .from("lahzalar")
      .upload(yol, fayl, { contentType: fayl.type });
    if (error) {
      console.error("Lahza yuklashda xato:", error.message);
      setYuklanmoqda(false);
      return setXato("Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring.");
    }
    const { data } = supabase.storage.from("lahzalar").getPublicUrl(yol);

    startTransition(async () => {
      const natija = await lahzaQosh({ rasmUrl: data.publicUrl, izoh, tadbirId, rozilik });
      setYuklanmoqda(false);
      if (natija.xato) return setXato(natija.xato);
      setXabar(natija.muvaffaqiyat ?? null);
      setFayl(null);
      setIzoh("");
      setRozilik(false);
      if (input.current) input.current.value = "";
      router.refresh();
    });
  }

  return (
    <form onSubmit={yubor} className="surface-card space-y-5 p-6">
      {xato ? <FormXabar>{xato}</FormXabar> : null}
      {xabar ? <FormXabar turi="muvaffaqiyat">{xabar}</FormXabar> : null}

      <div>
        <Label htmlFor="lahza-rasm">Rasm (JPG, PNG yoki WebP, 5 MB gacha)</Label>
        <input
          id="lahza-rasm"
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFayl(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-fg-muted file:mr-4 file:rounded-full file:border-0 file:bg-gold-400/15 file:px-4 file:py-2 file:text-sm file:font-bold file:text-gold-300"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="lahza-izoh">Izoh (ixtiyoriy)</Label>
          <Input id="lahza-izoh" value={izoh} maxLength={300} onChange={(e) => setIzoh(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="lahza-tadbir">Tadbir (ixtiyoriy)</Label>
          <select
            id="lahza-tadbir"
            value={tadbirId}
            onChange={(e) => setTadbirId(e.target.value)}
            className="h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg"
          >
            <option value="">Tadbirga bog‘lamaslik</option>
            {tadbirlar.map((t) => (
              <option key={t.id} value={t.id}>{t.nom}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          checked={rozilik}
          onChange={(e) => setRozilik(e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-[#e5b454]"
        />
        <span>
          Rasmda ko‘ringan barcha odamlar (yoki ularning ota-onasi) rasmning saytda e’lon qilinishiga
          rozi ekanini tasdiqlayman. Rasm jamoa tekshirgandan keyingina ko‘rinadi.
        </span>
      </label>

      <Button type="submit" disabled={yuklanmoqda}>
        {yuklanmoqda ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ImagePlus className="size-4" aria-hidden="true" />
        )}
        {yuklanmoqda ? "Yuborilmoqda…" : "Rasm yuborish"}
      </Button>
    </form>
  );
}
