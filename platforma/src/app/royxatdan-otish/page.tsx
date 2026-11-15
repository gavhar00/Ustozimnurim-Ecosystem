import type { Metadata } from "next";
import Link from "next/link";
import { AuthQobiq } from "@/components/auth/auth-qobiq";
import { RoyxatFormasi } from "@/components/auth/royxat-formasi";

export const metadata: Metadata = {
  title: "Ro‘yxatdan o‘tish",
  description:
    "UstozimNurim platformasida hisob yarating va interaktiv darslarni boshlang.",
  robots: { index: false, follow: true },
};

export default function RoyxatdanOtishSahifasi() {
  return (
    <AuthQobiq
      sarlavha="Hisob yarating"
      izoh="Bir necha daqiqada ro‘yxatdan o‘ting va birinchi interaktiv darsingizni oching."
      pastki={
        <>
          Hisobingiz bormi?{" "}
          <Link
            href="/kirish"
            className="font-bold text-gold-300 hover:text-gold-200"
          >
            Kiring
          </Link>
        </>
      }
    >
      <RoyxatFormasi />
    </AuthQobiq>
  );
}
