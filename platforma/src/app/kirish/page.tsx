import type { Metadata } from "next";
import Link from "next/link";
import { AuthQobiq } from "@/components/auth/auth-qobiq";
import { KirishFormasi } from "@/components/auth/kirish-formasi";
import { GoogleKirishTugmasi } from "@/components/auth/google-kirish-tugmasi";
import { FormXabar } from "@/components/ui/form";

export const metadata: Metadata = {
  title: "Kirish",
  description: "UstozimNurim platformasidagi hisobingizga kiring.",
  robots: { index: false, follow: true },
};

export default async function KirishSahifasi({
  searchParams,
}: {
  searchParams: Promise<{ xato?: string }>;
}) {
  const { xato } = await searchParams;
  return (
    <AuthQobiq
      sarlavha="Xush kelibsiz!"
      izoh="Hisobingizga kiring va o‘qishni qoldirgan joyingizdan davom ettiring."
      pastki={
        <>
          Hisobingiz yo‘qmi?{" "}
          <Link
            href="/royxatdan-otish"
            className="font-bold text-gold-300 hover:text-gold-200"
          >
            Ro‘yxatdan o‘ting
          </Link>
        </>
      }
    >
      {xato === "oauth" ? (
        <div className="mb-4">
          <FormXabar>Google orqali kirish yakunlanmadi. Qayta urinib ko‘ring.</FormXabar>
        </div>
      ) : null}
      <GoogleKirishTugmasi />
      <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-fg-muted">
        <span className="h-px flex-1 bg-border-subtle" />
        yoki email bilan
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
      <KirishFormasi />
      <p className="mt-5 text-center text-sm">
        <Link
          href="/parolni-tiklash"
          className="text-fg-muted hover:text-gold-300"
        >
          Parolni unutdingizmi?
        </Link>
      </p>
    </AuthQobiq>
  );
}
