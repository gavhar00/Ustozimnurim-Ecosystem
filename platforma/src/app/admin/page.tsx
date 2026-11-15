import type { Metadata } from "next";
import {
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { adminStatistikasi } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: "Analitika",
  robots: { index: false, follow: false },
};

export default async function AdminAnalitika() {
  const s = await adminStatistikasi();

  const kartalar = s
    ? [
        { Ikona: Users, son: s.foydalanuvchilar, izoh: "Foydalanuvchilar" },
        { Ikona: BookOpen, son: s.kurslar, izoh: "Kurslar (jami)" },
        {
          Ikona: PlayCircle,
          son: s.chop_etilgan_kurslar,
          izoh: "Chop etilgan kurslar",
        },
        { Ikona: GraduationCap, son: s.darslar, izoh: "Darslar" },
        { Ikona: BarChart3, son: s.yozilishlar, izoh: "Yozilishlar" },
        { Ikona: Award, son: s.sertifikatlar, izoh: "Sertifikatlar" },
      ]
    : [];

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Analitika
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Platformaning joriy holati — barcha raqamlar bazadan.
        </p>
      </header>

      {kartalar.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            ikona={<BarChart3 className="size-7" aria-hidden="true" />}
            sarlavha="Ma’lumot olinmadi"
            izoh="Baza ulanmagan yoki so‘rov bajarilmadi."
          />
        </div>
      ) : (
        <dl className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kartalar.map(({ Ikona, son, izoh }) => (
            <div key={izoh} className="surface-card flex items-center gap-4 p-5">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold-400/12 text-gold-300">
                <Ikona className="size-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="sr-only">{izoh}</dt>
                <dd>
                  <span className="block text-2xl font-black leading-tight text-fg">
                    {son}
                  </span>
                  <span className="text-sm text-fg-muted">{izoh}</span>
                </dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
