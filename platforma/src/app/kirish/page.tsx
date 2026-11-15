import type { Metadata } from "next";
import Link from "next/link";
import { AuthQobiq } from "@/components/auth/auth-qobiq";
import { KirishFormasi } from "@/components/auth/kirish-formasi";

export const metadata: Metadata = {
  title: "Kirish",
  description: "UstozimNurim platformasidagi hisobingizga kiring.",
  robots: { index: false, follow: true },
};

export default function KirishSahifasi() {
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
