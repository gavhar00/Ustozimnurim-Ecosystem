import { KirishAnimatsiyasi, kirishScripti } from "@/components/brand/kirish-animatsiyasi";
import type { Metadata, Viewport } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { PastkiMenyu } from "@/components/layout/pastki-menyu";
import { Footer } from "@/components/layout/footer";
import { HarakatSozlamasi } from "@/components/ui/harakat";
import { AiMentorWidget } from "@/components/ai/ai-mentor-widget";
import { joriyProfil } from "@/lib/auth";
import { oqilmaganSoni } from "@/lib/data/bildirishnomalar";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  display: "swap",
});

const monoCode = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ustozimnurim.uz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UstozimNurim — Bilim sari birga",
    template: "%s | UstozimNurim",
  },
  description:
    "O‘zbek tilidagi interaktiv dasturlash platformasi. Darsni tomosha qiling, kodni o‘sha yerda yozing va natijani darhol ko‘ring.",
  keywords: [
    "dasturlash kurslari",
    "o‘zbek tilida dasturlash",
    "frontend",
    "backend",
    "interaktiv darslar",
    "UstozimNurim",
  ],
  authors: [{ name: "UstozimNurim" }],
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: SITE_URL,
    siteName: "UstozimNurim",
    title: "UstozimNurim — Bilim sari birga",
    description:
      "O‘zbek tilidagi interaktiv dasturlash platformasi. Tomosha qiling, kod yozing, natijani darhol ko‘ring.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UstozimNurim — Bilim sari birga",
    description: "O‘zbek tilidagi interaktiv dasturlash platformasi.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080605",
  colorScheme: "dark light",
};

/** Mavzuni sahifa chizilishidan oldin qo‘llaydi — "miltillash" bo‘lmasligi uchun. */
const themeScript = `
(function(){
  try {
    var saved = localStorage.getItem("un-theme");
    var theme = saved === "light" || saved === "dark" ? saved : "dark";
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profil = await joriyProfil();
  const oqilmagan = profil ? await oqilmaganSoni() : 0;

  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: kirishScripti }} />
      </head>
      <body className={`${nunito.variable} ${monoCode.variable} antialiased`}>
        <KirishAnimatsiyasi />
        <a
          href="#asosiy-kontent"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold-400 focus:px-5 focus:py-2.5 focus:font-bold focus:text-ink-950"
        >
          Asosiy kontentga o‘tish
        </a>
        <Navbar
          profil={
            profil ? { toliq_ism: profil.toliq_ism, rol: profil.rol } : null
          }
          oqilmagan={oqilmagan}
        />
        <main id="asosiy-kontent" className={profil ? "pb-20 md:pb-0" : undefined}>
          <HarakatSozlamasi>{children}</HarakatSozlamasi>
        </main>
        <Footer />
        {profil ? <PastkiMenyu /> : null}
        <AiMentorWidget />
      </body>
    </html>
  );
}
