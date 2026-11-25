import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { xavfsizIchkiManzil } from "@/lib/profil-toldirish";

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

  const { data: profil } = await supabase
    .from("profillar")
    .select("profil_toldirilgan")
    .eq("id", user.id)
    .maybeSingle();
  const manzil = profil?.profil_toldirilgan ? next : "/profil/toldirish";
  return NextResponse.redirect(new URL(manzil, request.url));
}
