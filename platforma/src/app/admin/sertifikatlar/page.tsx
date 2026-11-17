import type { Metadata } from "next";
import Link from "next/link";
import { Award } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { adminSertifikatlar } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: "Sertifikatlar",
  robots: { index: false, follow: false },
};

export default async function AdminSertifikatlar() {
  const royxat = await adminSertifikatlar();
  const sana = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Sertifikatlar
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          O‘quvchi kursning barcha darslarini tugatganda sertifikat avtomatik
          beriladi.
        </p>
      </header>

      <div className="mt-7">
        {royxat.length === 0 ? (
          <EmptyState
            ikona={<Award className="size-7" aria-hidden="true" />}
            sarlavha="Hali sertifikat berilmagan"
            izoh="O‘quvchilar kurslarni tugatgach, sertifikatlar shu yerda ko‘rinadi."
          />
        ) : (
          <div className="surface-card overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-fg-muted">
                <tr className="border-b border-border-subtle">
                  <th className="px-5 py-3 font-bold">O‘quvchi</th>
                  <th className="px-5 py-3 font-bold">Kurs</th>
                  <th className="px-5 py-3 font-bold">Sana</th>
                  <th className="px-5 py-3 font-bold">Kod</th>
                </tr>
              </thead>
              <tbody>
                {royxat.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border-subtle last:border-0"
                  >
                    <td className="px-5 py-3 font-extrabold">{s.oquvchi}</td>
                    <td className="px-5 py-3">{s.kurs_nomi}</td>
                    <td className="px-5 py-3 text-fg-muted">
                      {sana.format(new Date(s.berilgan))}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/sertifikat/${s.kod}`}
                        className="font-mono font-bold text-gold-300 hover:text-gold-200"
                      >
                        {s.kod}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
