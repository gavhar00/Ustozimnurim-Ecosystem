import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Hisobdan chiqish. Faqat POST — tasodifiy havola bosilishi bilan chiqib ketmasligi uchun. */
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  if (supabase) {
    await supabase.auth.signOut();
  }
  const javob = NextResponse.redirect(new URL("/kirish", request.url), { status: 303 });
  javob.cookies.delete("pt");
  return javob;
}
