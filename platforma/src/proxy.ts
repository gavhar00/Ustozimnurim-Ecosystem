import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PROFIL_TOLDIRISH_CHEGARASI,
  profilToldirishFoizi,
} from "@/lib/profil-toldirish";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Faqat kirgan foydalanuvchi uchun ochiq bo‘limlar. */
const HIMOYALANGAN = ["/panel", "/admin"];
const DARSLAR_YOLI = /^\/kurslar\/[^/]+\/dars\/[^/]+/;

/** Kirgan foydalanuvchiga keraksiz sahifalar. */
const FAQAT_MEHMONGA = ["/kirish", "/royxatdan-otish", "/parolni-tiklash"];

export async function proxy(request: NextRequest) {
  const javob = NextResponse.next({ request });
  const yol = request.nextUrl.pathname;

  // Supabase sozlanmagan bo‘lsa, himoyalangan bo‘limlar yopiq turadi.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (HIMOYALANGAN.some((p) => yol.startsWith(p)) || DARSLAR_YOLI.test(yol)) {
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

  const himoyalangan = HIMOYALANGAN.some((p) => yol.startsWith(p)) || DARSLAR_YOLI.test(yol);

  if (!user && himoyalangan) {
    const manzil = new URL("/kirish", request.url);
    manzil.searchParams.set("keyin", `${yol}${request.nextUrl.search}`);
    return NextResponse.redirect(manzil);
  }

  // /panel va /admin to‘ldirilganlikni o‘z layout'ida tekshiradi (bazaga ikki marta
  // bormaslik uchun). Dars sahifalarida esa yagona qo‘riqchi shu yer.
  if (user && DARSLAR_YOLI.test(yol)) {
    const [{ data: profil, error: profilXatosi }, { data: shaxsiy, error: shaxsiyXatosi }] =
      await Promise.all([
        supabase
          .from("profillar")
          .select("toliq_ism, avatar_url, talim, sinf_kurs, joylashuv, qiziqishlar, organish_yonalishlari, organmoqchi_konikmalar, mavjud_konikmalar, maqsad, bio")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("profil_shaxsiy").select("tugilgan_sana").eq("profil_id", user.id).maybeSingle(),
      ]);
    const foiz = profilXatosi || shaxsiyXatosi
      ? 0
      : profilToldirishFoizi({ ...profil, tugilgan_sana: shaxsiy?.tugilgan_sana });

    if (foiz < PROFIL_TOLDIRISH_CHEGARASI && yol !== "/profil/toldirish") {
      const manzil = new URL("/profil/toldirish", request.url);
      manzil.searchParams.set("keyin", `${yol}${request.nextUrl.search}`);
      return NextResponse.redirect(manzil);
    }
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
