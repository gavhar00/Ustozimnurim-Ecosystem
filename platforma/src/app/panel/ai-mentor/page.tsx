import type { Metadata } from "next";
import { MessageCircle, Sparkles } from "lucide-react";
import { profilTalabQil } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI mentor",
  robots: { index: false, follow: false },
};

export default async function AiMentorSahifasi() {
  await profilTalabQil("/panel/ai-mentor");

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          AI mentor
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Savolingizga javob beradigan yordamchi — platformaning har bir
          sahifasida ochiq turadi.
        </p>
      </header>

      <div className="surface-card mt-7 p-7">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
          <Sparkles className="size-7" aria-hidden="true" />
        </span>

        <h2 className="mt-5 text-xl font-extrabold">Qanday ishlatiladi</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-fg-muted">
          Ekranning pastki o‘ng burchagidagi suhbat tugmasini bosing. Yordamchi
          kurslar, yo‘nalishlar va platforma bo‘yicha savollarga javob beradi.
        </p>

        <ul className="mt-6 space-y-3">
          {[
            "Qaysi kursdan boshlasam bo‘ladi?",
            "Frontend yo‘nalishida nimalarni o‘rganaman?",
            "Kurslar pullikmi?",
          ].map((savol) => (
            <li
              key={savol}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-ink-850/60 px-4 py-3 text-sm text-fg-muted"
            >
              <MessageCircle
                className="size-4 shrink-0 text-gold-400/70"
                aria-hidden="true"
              />
              “{savol}”
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-fg-muted">
          Yordamchi javoblari bilim bazasiga asoslanadi — noaniq javob bo‘lsa,
          Hamjamiyatda savol bering.
        </p>
      </div>
    </>
  );
}
