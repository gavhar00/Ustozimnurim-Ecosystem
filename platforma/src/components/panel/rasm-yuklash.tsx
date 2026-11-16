"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { FormXabar } from "@/components/ui/form";
import { rasmniSaqla } from "@/app/panel/profil/amallar";
import { supabaseBrauzer } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAKS_BAYT = 3 * 1024 * 1024; // 3 MB
const RUXSAT = ["image/jpeg", "image/png", "image/webp"];

/**
 * Avatar yoki muqova rasmini yuklaydi.
 * Fayl to'g'ridan-to'g'ri Supabase Storage'ga ketadi, so'ng manzili profilga yoziladi.
 */
export function RasmYuklash({
  turi,
  joriyUrl,
  foydalanuvchiId,
}: {
  turi: "avatar" | "muqova";
  joriyUrl: string | null;
  foydalanuvchiId: string;
}) {
  const [url, setUrl] = useState(joriyUrl);
  const [xato, setXato] = useState<string | null>(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const bucket = turi === "avatar" ? "avatarlar" : "muqovalar";
  const nom = turi === "avatar" ? "Avatar" : "Muqova";

  async function fayliniYukla(fayl: File) {
    setXato(null);

    if (!RUXSAT.includes(fayl.type)) {
      setXato("Faqat JPG, PNG yoki WebP rasm yuklash mumkin.");
      return;
    }
    if (fayl.size > MAKS_BAYT) {
      setXato("Rasm hajmi 3 MB dan oshmasligi kerak.");
      return;
    }

    const supabase = supabaseBrauzer();
    if (!supabase) {
      setXato("Baza ulanmagan.");
      return;
    }

    setYuklanmoqda(true);

    const kengaytma = fayl.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const yol = `${foydalanuvchiId}/${turi}-${Date.now()}.${kengaytma}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(yol, fayl, { upsert: true, contentType: fayl.type });

    if (error) {
      console.error("Rasm yuklashda xato:", error.message);
      setXato("Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring.");
      setYuklanmoqda(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(yol);
    setUrl(data.publicUrl);
    setYuklanmoqda(false);

    startTransition(async () => {
      const natija = await rasmniSaqla(turi, data.publicUrl);
      if (natija.xato) setXato(natija.xato);
    });
  }

  function ochir() {
    setUrl(null);
    startTransition(async () => {
      await rasmniSaqla(turi, "");
    });
  }

  return (
    <div className="space-y-3">
      {xato ? <FormXabar>{xato}</FormXabar> : null}

      <div
        className={cn(
          "relative overflow-hidden border border-border-subtle bg-ink-850/60",
          turi === "avatar"
            ? "size-28 rounded-2xl"
            : "h-32 w-full rounded-xl sm:h-40",
        )}
      >
        {url ? (
          <Image
            src={url}
            alt={`${nom} rasmi`}
            fill
            sizes={turi === "avatar" ? "112px" : "(max-width: 640px) 100vw, 640px"}
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-fg-muted">
            <ImagePlus className="size-7" aria-hidden="true" />
          </div>
        )}

        {yuklanmoqda ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
            <Loader2
              className="size-6 animate-spin text-gold-300"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-fg transition-colors hover:border-gold-400/60 focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2 focus-within:ring-offset-ink-950"
        >
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const fayl = e.target.files?.[0];
              if (fayl) void fayliniYukla(fayl);
              e.target.value = "";
            }}
          />
          <span className="inline-flex items-center gap-2">
            <ImagePlus className="size-4" aria-hidden="true" />
            {url ? `${nom}ni almashtirish` : `${nom} yuklash`}
          </span>
        </label>

        {url ? (
          <button
            type="button"
            onClick={ochir}
            className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-[#ffb3ad]"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            O‘chirish
          </button>
        ) : null}
      </div>

      <p className="text-xs text-fg-muted">
        JPG, PNG yoki WebP. Hajmi 3 MB gacha.
      </p>
    </div>
  );
}
