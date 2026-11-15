import type { Metadata } from "next";
import { Users } from "lucide-react";
import { RolTanlagich } from "@/components/admin/rol-tanlagich";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil } from "@/lib/auth";
import { adminFoydalanuvchilari } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: "Foydalanuvchilar",
  robots: { index: false, follow: false },
};

export default async function AdminFoydalanuvchilar() {
  const men = await profilTalabQil("/admin/foydalanuvchilar");
  const royxat = await adminFoydalanuvchilari();

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Foydalanuvchilar
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          {royxat.length} ta hisob. Rolni o‘zgartirsangiz, ruxsatlar darhol
          qo‘llanadi.
        </p>
      </header>

      {royxat.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            ikona={<Users className="size-7" aria-hidden="true" />}
            sarlavha="Foydalanuvchi topilmadi"
            izoh="Hali hech kim ro‘yxatdan o‘tmagan."
          />
        </div>
      ) : (
        <ul className="mt-7 space-y-3">
          {royxat.map((f) => (
            <li
              key={f.id}
              className="surface-card flex items-center justify-between gap-4 p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-400/15 font-black text-gold-300"
                >
                  {f.toliq_ism.trim().charAt(0).toUpperCase() || "U"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-fg">
                    {f.toliq_ism || "Ism kiritilmagan"}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {new Intl.DateTimeFormat("uz-UZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(f.yaratilgan))}
                  </p>
                </div>
              </div>

              <RolTanlagich
                foydalanuvchiId={f.id}
                joriyRol={f.rol}
                ozi={f.id === men.id}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
