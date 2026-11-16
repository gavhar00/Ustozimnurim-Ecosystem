"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { FormXabar } from "@/components/ui/form";
import { supabaseBrauzer } from "@/lib/supabase/client";

const MAKS_HAJM = 5 * 1024 * 1024;
const RUXSAT = ["image/jpeg", "image/png", "image/webp"];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function LoyihaRasmMaydoni({
  turi,
  foydalanuvchiId,
  boshlangichUrl = null,
}: {
  turi: "muqova" | "logo";
  foydalanuvchiId: string;
  boshlangichUrl?: string | null;
}) {
  const [url, setUrl] = useState(boshlangichUrl);
  const [oldindanKorish, setOldindanKorish] = useState<string | null>(null);
  const [foiz, setFoiz] = useState(0);
  const [xato, setXato] = useState<string | null>(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sarlavha = turi === "muqova" ? "Muqova rasmi" : "Loyiha logosi";

  function yuklash(fayl: File) {
    setXato(null);
    if (!RUXSAT.includes(fayl.type)) {
      setXato("Faqat JPG, PNG yoki WebP formatidagi rasm qabul qilinadi.");
      return;
    }
    if (fayl.size > MAKS_HAJM) {
      setXato("Rasm hajmi 5 MB dan oshmasligi kerak.");
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setXato("Baza ulanmagan.");
      return;
    }

    const preview = URL.createObjectURL(fayl);
    setOldindanKorish(preview);
    setYuklanmoqda(true);
    setFoiz(0);

    void (async () => {
      const supabase = supabaseBrauzer();
      if (!supabase) {
        setXato("Baza ulanmagan.");
        setYuklanmoqda(false);
        setOldindanKorish(null);
        URL.revokeObjectURL(preview);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setXato("Rasm yuklash uchun hisobingizga qayta kiring.");
        setYuklanmoqda(false);
        setOldindanKorish(null);
        URL.revokeObjectURL(preview);
        return;
      }

      const ext = fayl.name.split(".").pop()?.toLowerCase();
      const kengaytma = ext && ["jpg", "jpeg", "png", "webp"].includes(ext)
        ? ext
        : fayl.type === "image/png" ? "png" : fayl.type === "image/webp" ? "webp" : "jpg";
      const path = `${foydalanuvchiId}/${crypto.randomUUID()}-${turi}.${kengaytma}`;
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/loyiha-rasmlari/${encodedPath}`);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("apikey", SUPABASE_KEY);
      xhr.setRequestHeader("Content-Type", fayl.type);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setFoiz(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onerror = () => {
        setXato("Rasmni yuklab bo‘lmadi. Internet aloqasini tekshiring.");
        setYuklanmoqda(false);
        setOldindanKorish(null);
        URL.revokeObjectURL(preview);
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          setXato("Rasmni yuklab bo‘lmadi. Ruxsat va baza sozlamalarini tekshiring.");
          setYuklanmoqda(false);
          setOldindanKorish(null);
          URL.revokeObjectURL(preview);
          return;
        }
        const { data } = supabase.storage.from("loyiha-rasmlari").getPublicUrl(path);
        setUrl(data.publicUrl);
        setOldindanKorish(null);
        setFoiz(100);
        setYuklanmoqda(false);
        URL.revokeObjectURL(preview);
      };
      xhr.send(fayl);
    })();
  }

  const korsatiladiganUrl = oldindanKorish ?? url;
  return (
    <div className="space-y-3">
      <input type="hidden" name={`${turi}_url`} value={url ?? ""} />
      {xato ? <FormXabar>{xato}</FormXabar> : null}
      <div className={`relative overflow-hidden border border-border-subtle bg-ink-850/60 ${turi === "logo" ? "size-24 rounded-2xl" : "h-40 w-full rounded-xl"}`}>
        {korsatiladiganUrl ? (
          <Image
            src={korsatiladiganUrl}
            alt={`${sarlavha} oldindan ko‘rinishi`}
            fill
            sizes={turi === "logo" ? "96px" : "(max-width: 640px) 100vw, 640px"}
            className={turi === "logo" ? "object-contain p-2" : "object-cover"}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-fg-muted">
            <ImagePlus className="size-7" aria-hidden="true" />
          </div>
        )}
        {yuklanmoqda ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-950/75 px-4">
            <LoaderCircle className="size-5 animate-spin text-gold-300" aria-hidden="true" />
            <div className="h-1.5 w-full max-w-36 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-label="Rasm yuklanmoqda" aria-valuemin={0} aria-valuemax={100} aria-valuenow={foiz}>
              <div className="h-full bg-gold-400 transition-[width]" style={{ width: `${foiz}%` }} />
            </div>
            <span className="text-xs text-fg">{foiz}%</span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <label aria-disabled={yuklanmoqda} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-bold hover:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2 focus-within:ring-offset-ink-950 aria-disabled:cursor-not-allowed aria-disabled:opacity-50">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={yuklanmoqda}
            className="sr-only"
            onChange={(event) => {
              const fayl = event.target.files?.[0];
              if (fayl) yuklash(fayl);
              event.target.value = "";
            }}
          />
          <span className="inline-flex items-center gap-2">
            <ImagePlus className="size-4" aria-hidden="true" />
            {url ? "Almashtirish" : "Rasm yuklash"}
          </span>
        </label>
        {url ? (
          <button type="button" disabled={yuklanmoqda} onClick={() => { setUrl(null); setOldindanKorish(null); setFoiz(0); }} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm text-fg-muted hover:text-[#ffb3ad]">
            <Trash2 className="size-4" aria-hidden="true" /> O‘chirish
          </button>
        ) : null}
      </div>
      <p className="text-xs text-fg-muted">JPG, PNG yoki WEBP · 5 MB gacha</p>
    </div>
  );
}
