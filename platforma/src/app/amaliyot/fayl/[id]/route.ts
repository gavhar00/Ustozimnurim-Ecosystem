import { NextResponse, type NextRequest } from "next/server";
import { joriyProfil } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

/** Vazifa faylini qisqa muddatli havola orqali beradi (faqat vazifani boshlagan o‘quvchi yoki admin). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profil = await joriyProfil();
  const supabase = await supabaseServer();
  if (!profil || !supabase) return new NextResponse("Avval tizimga kiring.", { status: 401 });
  const { data: v } = await supabase
    .from("vazifalar")
    .select("fayl_yoli, fayl_nomi")
    .eq("id", id)
    .maybeSingle();
  if (!v?.fayl_yoli) return new NextResponse("Fayl topilmadi.", { status: 404 });
  const { data, error } = await supabase.storage
    .from("vazifa-fayllari")
    .createSignedUrl(v.fayl_yoli, 300, { download: v.fayl_nomi ?? true });
  if (error || !data) return new NextResponse("Faylni olish uchun avval vazifani boshlang.", { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
