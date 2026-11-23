"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LahzaNatijasi = { xato?: string; muvaffaqiyat?: string };

export async function lahzaQosh(input: {
  rasmUrl: string;
  izoh: string;
  tadbirId: string;
  rozilik: boolean;
}): Promise<LahzaNatijasi> {
  if (!input.rozilik) {
    return { xato: "Rasmda ko‘ringan hamma odam e’lon qilishga rozi ekanini tasdiqlang." };
  }
  const izoh = input.izoh.trim().slice(0, 300);

  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { xato: "Sessiya tugagan. Qaytadan kiring." };

  // Rasm shu foydalanuvchining o'z papkasidagi lahzalar bucket'idan bo'lishi shart.
  if (!input.rasmUrl.includes(`/storage/v1/object/public/lahzalar/${user.id}/`)) {
    return { xato: "Rasm manzili noto‘g‘ri." };
  }

  const { error } = await supabase.from("lahzalar").insert({
    rasm_url: input.rasmUrl,
    izoh: izoh || null,
    tadbir_id: input.tadbirId || null,
    rozilik: true,
  });
  if (error) {
    console.error("Lahza qo‘shishda xato:", error.message);
    return { xato: "Saqlab bo‘lmadi. Qayta urinib ko‘ring." };
  }
  revalidatePath("/panel/lahzalarim");
  return { muvaffaqiyat: "Rasm yuborildi. Jamoa tekshirgach galereyada ko‘rinadi." };
}

export async function lahzaniOchir(id: string): Promise<LahzaNatijasi> {
  const supabase = await supabaseServer();
  if (!supabase) return { xato: "Baza ulanmagan." };
  const { error } = await supabase.from("lahzalar").delete().eq("id", id);
  if (error) return { xato: "O‘chirib bo‘lmadi." };
  revalidatePath("/panel/lahzalarim");
  revalidatePath("/lahzalar");
  return { muvaffaqiyat: "O‘chirildi." };
}
