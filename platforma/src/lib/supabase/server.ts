import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Supabase ulangan-ulanmaganini bildiradi. Ulanmagan bo‘lsa — sahifa mock emas, bo‘sh holat ko‘rsatadi. */
export const supabaseSozlangan = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * Server tarafdagi Supabase klienti (RLS bilan, foydalanuvchi sessiyasi cookie'dan).
 * Muhit o‘zgaruvchilari yo‘q bo‘lsa — null qaytaradi, chaqiruvchi buni tekshiradi.
 */
export async function supabaseServer() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component ichida yozib bo‘lmaydi — middleware yangilaydi.
        }
      },
    },
  });
}
