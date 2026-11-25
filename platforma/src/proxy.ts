import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { xavfsizIchkiManzil } from "@/lib/profil-toldirish";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Faqat kirgan foydalanuvchi uchun ochiq bo‘limlar. */
const HIMOYALANGAN = ["/panel", "/admin", "/lenta", "/profil/toldirish"];
const DARSLAR_YOLI = /^\/kurslar\/[^/]+\/dars\/[^/]+/;

/** Kirgan foydalanuvchiga keraksiz sahifalar. */
const FAQAT_MEHMONGA = ["/kirish", "/royxatdan-otish", "/parolni-tiklash"];

/** Onboarding tugamagan foydalanuvchi ham kira oladigan yo‘llar. */
const TOLDIRISHDA_RUXSAT = ["/profil/toldirish", "/chiqish", "/auth", "/api"];

/**
 * Profil to‘ldirilgani haqidagi belgi. Qiymati foydalanuvchi id'si bo‘lgani uchun
 * boshqa hisobga o‘tmaydi; bu faqat tezlik uchun — server sahifalari bazadagi
 * belgini o‘zlari ham tekshiradi.
 */
const TOLDIRILGAN_COOKIE = "pt";

const tegadi = (yol: string, royxat: string[]) =>
  royxat.some((p) => yol === p || yol.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  const javob = NextResponse.next({ request });
  const yol = request.nextUrl.pathname;

  const himoyalangan = tegadi(yol, HIMOYALANGAN) || DARSLAR_YOLI.test(yol);

  // Supabase sozlanmagan bo‘lsa, himoyalangan bo‘limlar yopiq turadi.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (himoyalangan) return NextResponse.redirect(new URL("/kirish", request.url));
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

  /** Yangilangan sessiya cookie'lari yo‘qolmasligi uchun ularni yo‘naltirishga ko‘chiramiz. */
  const yonalt = (manzil: URL) => {
    const r = NextResponse.redirect(manzil);
    javob.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  // Sessiyani yangilaydi — bu chaqiruvni olib tashlamang.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Kirmagan mehmon uchun kirish nuqtasi — ro‘yxatdan o‘tish sahifasi.
    if (yol === "/") return yonalt(new URL("/royxatdan-otish", request.url));
    if (himoyalangan) {
      const manzil = new URL("/kirish", request.url);
      manzil.searchParams.set("keyin", `${yol}${request.nextUrl.search}`);
      return yonalt(manzil);
    }
    return javob;
  }

  // Kirgan foydalanuvchi: profil to‘ldirilganmi?
  let toldirilgan = request.cookies.get(TOLDIRILGAN_COOKIE)?.value === user.id;
  if (!toldirilgan) {
    const { data, error } = await supabase
      .from("profillar")
      .select("profil_toldirilgan")
      .eq("id", user.id)
      .maybeSingle();
    // Baza xatosida yo‘naltirish sikliga tushmaslik uchun o‘tkazib yuboramiz:
    // server sahifalari baribir o‘zlari tekshiradi.
    toldirilgan = error ? true : Boolean(data?.profil_toldirilgan);
    if (toldirilgan && !error) {
      javob.cookies.set(TOLDIRILGAN_COOKIE, user.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  const nishon = toldirilgan ? "/lenta" : "/profil/toldirish";

  // Bosh sahifa va kirish/ro‘yxat sahifalari — kirganlarga kerak emas.
  if (yol === "/" || tegadi(yol, FAQAT_MEHMONGA)) {
    return yonalt(new URL(nishon, request.url));
  }

  // Profil bir marta to‘ldiriladi — tugagan bo‘lsa, qayta so‘ralmaydi.
  if (toldirilgan && yol === "/profil/toldirish" && request.method === "GET") {
    const keyin = xavfsizIchkiManzil(request.nextUrl.searchParams.get("keyin"));
    return yonalt(new URL(keyin, request.url));
  }

  // To‘ldirilmagan profil: onboardingni aylanib o‘tib bo‘lmaydi.
  if (
    !toldirilgan &&
    request.method === "GET" &&
    !yol.includes(".") &&
    !tegadi(yol, TOLDIRISHDA_RUXSAT)
  ) {
    const manzil = new URL("/profil/toldirish", request.url);
    if (yol !== "/") manzil.searchParams.set("keyin", `${yol}${request.nextUrl.search}`);
    return yonalt(manzil);
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
