"use client";

import { supabaseBrauzer } from "@/lib/supabase/client";
import {
  POST_BUCKET,
  POST_MAKS_BAYT,
  RASM_TURLARI,
} from "@/lib/lenta-turlari";

/** Faylning birinchi baytlari haqiqatan rasmga mosligini tekshiradi (MIME aldashidan himoya). */
async function imzoMosmi(fayl: File): Promise<boolean> {
  const b = new Uint8Array(await fayl.slice(0, 12).arrayBuffer());
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp =
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (fayl.type === "image/jpeg") return jpeg;
  if (fayl.type === "image/png") return png;
  if (fayl.type === "image/webp") return webp;
  return false;
}

/** Xato matni yoki null (fayl yaroqli). */
export async function rasmniTekshir(fayl: File): Promise<string | null> {
  if (!(fayl.type in RASM_TURLARI)) return `«${fayl.name}»: faqat JPG, PNG yoki WebP mumkin.`;
  if (fayl.size > POST_MAKS_BAYT) return `«${fayl.name}»: hajmi 5 MB dan oshmasligi kerak.`;
  if (fayl.size === 0) return `«${fayl.name}»: fayl bo‘sh.`;
  if (!(await imzoMosmi(fayl))) return `«${fayl.name}»: bu haqiqiy rasm fayliga o‘xshamaydi.`;
  return null;
}

/** Rasmlarni foydalanuvchining o‘z papkasiga yuklab, ommaviy havolalarini qaytaradi. */
export async function rasmlarniYukla(
  fayllar: File[],
  foydalanuvchiId: string,
): Promise<{ urllar: string[]; xato?: string }> {
  const supabase = supabaseBrauzer();
  if (!supabase) return { urllar: [], xato: "Baza ulanmagan." };

  const urllar: string[] = [];
  for (const fayl of fayllar) {
    const yol = `${foydalanuvchiId}/${crypto.randomUUID()}.${RASM_TURLARI[fayl.type]}`;
    const { error } = await supabase.storage
      .from(POST_BUCKET)
      .upload(yol, fayl, { contentType: fayl.type, upsert: false });
    if (error) {
      console.error("Post rasmini yuklashda xato:", error.message);
      // Yarim yuklangan rasmlarni tozalaymiz.
      const yuklangan = urllar.map((u) => u.split(`/${POST_BUCKET}/`)[1]);
      if (yuklangan.length) await supabase.storage.from(POST_BUCKET).remove(yuklangan);
      return { urllar: [], xato: "Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring." };
    }
    urllar.push(supabase.storage.from(POST_BUCKET).getPublicUrl(yol).data.publicUrl);
  }
  return { urllar };
}
