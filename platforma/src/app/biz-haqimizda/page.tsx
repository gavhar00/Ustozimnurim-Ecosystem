import type { Metadata } from "next";
import { Compass, Heart, Sparkles, Target, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, SectionTitle } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Biz haqimizda",
  description:
    "UstozimNurim — o‘zbek tilidagi interaktiv dasturlash platformasi. Missiyamiz, qadriyatlarimiz va jamoamiz.",
};

/**
 * Sahifa matni — tasdiqlanishi kerak bo‘lgan qoralama.
 * Jamoa ro‘yxatiga qo‘shimcha a’zolar egasining roziligi bilan kiritiladi.
 */
const QADRIYATLAR = [
  {
    Ikona: Heart,
    nom: "Ona tilida",
    matn: "Murakkab tushunchalar o‘zbek tilida, sodda va tushunarli bayon qilinadi.",
  },
  {
    Ikona: Sparkles,
    nom: "Amaliyot ustuvor",
    matn: "Har bir dars kod yozish bilan tugaydi — faqat tomosha qilib qolinmaydi.",
  },
  {
    Ikona: Users,
    nom: "Birga o‘rganish",
    matn: "Savol berish uyat emas. Hamjamiyat har bir o‘quvchining orqasida turadi.",
  },
  {
    Ikona: Compass,
    nom: "Aniq yo‘l",
    matn: "Nimadan boshlash va keyin nima qilish — har bir qadam oldindan ko‘rinadi.",
  },
];

export default function BizHaqimizdaSahifasi() {
  return (
    <>
      <PageHeader
        yorliq="Biz haqimizda"
        yorliqIkona={<Target className="size-4" />}
        sarlavha="Dasturlashni o‘rganish yo‘lini"
        oltinQism="ochiq qilamiz"
        tavsif="UstozimNurim — o‘zbek tilidagi interaktiv dasturlash platformasi. Maqsadimiz: til to‘sig‘i va manba yetishmasligi tufayli yo‘lda to‘xtab qolgan har bir o‘quvchiga aniq yo‘nalish berish."
      />

      <Container className="pb-16">
        {/* Missiya va vizyon */}
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface-card p-8">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
              <Target className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">Missiyamiz</h2>
            <p className="mt-3 leading-relaxed text-fg-muted">
              O‘zbek tilida sifatli, amaliy va tushunarli dasturlash ta’limini
              har bir o‘quvchi uchun ochiq qilish. Bilim qayerda yashashingizga
              yoki qaysi tilni bilishingizga bog‘liq bo‘lmasligi kerak.
            </p>
          </section>

          <section className="surface-card p-8">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
              <Compass className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold">Vizyonimiz</h2>
            <p className="mt-3 leading-relaxed text-fg-muted">
              O‘zbekistondagi har bir yosh dasturchi birinchi qadamini shu
              platformada qo‘ysin — tomosha qilib emas, kod yozib o‘rgansin va
              shu bilan o‘z kasbini qursin.
            </p>
          </section>
        </div>

        {/* Qadriyatlar */}
        <section className="mt-14">
          <SectionTitle>
            Nimaga <span className="text-gold-gradient">ishonamiz</span>
          </SectionTitle>

          <ul className="mt-7 grid gap-5 sm:grid-cols-2">
            {QADRIYATLAR.map(({ Ikona, nom, matn }) => (
              <li key={nom} className="surface-card flex gap-4 p-6">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/12 text-gold-300">
                  <Ikona className="size-5.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-fg">{nom}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {matn}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Aloqa */}
        <section className="surface-card mt-14 flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Savolingiz bormi?</h2>
            <p className="mt-2 leading-relaxed text-fg-muted">
              Hamkorlik, taklif yoki oddiy savol — bemalol yozing.
            </p>
          </div>
          <ButtonLink
            href="mailto:info@ustozimnurim.uz"
            size="lg"
            className="shrink-0"
          >
            info@ustozimnurim.uz
          </ButtonLink>
        </section>
      </Container>
    </>
  );
}
