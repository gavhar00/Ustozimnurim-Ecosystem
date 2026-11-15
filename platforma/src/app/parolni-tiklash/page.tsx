import type { Metadata } from "next";
import Link from "next/link";
import { AuthQobiq } from "@/components/auth/auth-qobiq";
import { ParolTiklashFormasi } from "@/components/auth/parol-tiklash-formasi";

export const metadata: Metadata = {
  title: "Parolni tiklash",
  description: "Parolingizni tiklash uchun email manzilingizni kiriting.",
  robots: { index: false, follow: true },
};

export default function ParolniTiklashSahifasi() {
  return (
    <AuthQobiq
      sarlavha="Parolni tiklash"
      izoh="Email manzilingizni kiriting — parolni yangilash havolasini yuboramiz."
      pastki={
        <Link
          href="/kirish"
          className="font-bold text-gold-300 hover:text-gold-200"
        >
          Kirish sahifasiga qaytish
        </Link>
      }
    >
      <ParolTiklashFormasi />
    </AuthQobiq>
  );
}
