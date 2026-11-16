import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  PROFIL_TOLDIRISH_CHEGARASI,
  profilToldirishFoizi,
  xavfsizIchkiManzil,
} from "@/lib/profil-toldirish";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = xavfsizIchkiManzil(request.nextUrl.searchParams.get("next"));
  const supabase = await supabaseServer();
  if (!supabase || !code) {
    return NextResponse.redirect(new URL("/kirish?xato=oauth", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/kirish?xato=oauth", request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/kirish?xato=oauth", request.url));
  }

  const [{ data: profil }, { data: shaxsiy }] = await Promise.all([
    supabase
      .from("profillar")
      .select("toliq_ism, avatar_url, talim, sinf_kurs, joylashuv, qiziqishlar, organish_yonalishlari, organmoqchi_konikmalar, mavjud_konikmalar, maqsad, bio")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("profil_shaxsiy").select("tugilgan_sana").eq("profil_id", user.id).maybeSingle(),
  ]);
  const foiz = profilToldirishFoizi({
    ...profil,
    tugilgan_sana: shaxsiy?.tugilgan_sana,
  });
  const manzil = foiz >= PROFIL_TOLDIRISH_CHEGARASI ? next : "/profil/toldirish";
  return NextResponse.redirect(new URL(manzil, request.url));
}
