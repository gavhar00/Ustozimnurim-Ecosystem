import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Faqat kirgan foydalanuvchi uchun ochiq bo‘limlar. */
const HIMOYALANGAN = ["/panel", "/admin"];

/** Kirgan foydalanuvchiga keraksiz sahifalar. */
const FAQAT_MEHMONGA = ["/kirish", "/royxatdan-otish", "/parolni-tiklash"];

export async function proxy(request: NextRequest) {
  const javob = NextResponse.next({ request });
  const yol = request.nextUrl.pathname;

  // Supabase sozlanmagan bo‘lsa, himoyalangan bo‘limlar yopiq turadi.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (HIMOYALANGAN.some((p) => yol.startsWith(p))) {
      return NextResponse.redirect(new URL("/kirish", request.url));
    }
    return javob;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          javob.cookies.set(name, value, options),
        );
      },
    },
  });

  // Sessiyani yangilaydi — bu chaqiruvni olib tashlamang.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && HIMOYALANGAN.some((p) => yol.startsWith(p))) {
    const manzil = new URL("/kirish", request.url);
    manzil.searchParams.set("keyin", yol);
    return NextResponse.redirect(manzil);
  }

  if (user && FAQAT_MEHMONGA.includes(yol)) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return javob;
}

export const config = {
  matcher: [
    /*
     * Statik fayllar va rasmlardan tashqari barcha so‘rovlar.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
