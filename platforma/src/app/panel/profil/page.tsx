import type { Metadata } from "next";
import { HavolalarFormasi } from "@/components/panel/havolalar-formasi";
import { KonikmalarBoshqaruvi } from "@/components/panel/konikmalar-boshqaruvi";
import { ProfilFormasi } from "@/components/panel/profil-formasi";
import { RasmYuklash } from "@/components/panel/rasm-yuklash";
import { ToldirishKorsatkichi } from "@/components/panel/toldirish-korsatkichi";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil, ROL_NOMI } from "@/lib/auth";
import {
  profilKonikmalari,
  toldirilganlik,
  toliqProfil,
} from "@/lib/data/profil";

export const metadata: Metadata = {
  title: "Profil",
  robots: { index: false, follow: false },
};

export default async function ProfilSahifasi() {
  const hisob = await profilTalabQil("/panel/profil");
  const profil = await toliqProfil(hisob.id);

  if (!profil) {
    return (
      <EmptyState
        sarlavha="Profil ma’lumotlari olinmadi"
        izoh="Baza ulanmagan yoki so‘rov bajarilmadi. Birozdan so‘ng qayta urinib ko‘ring."
      />
    );
  }

  const konikmalar = await profilKonikmalari(profil.id);
  const { foiz, bandlar } = toldirilganlik(profil, konikmalar.length);

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">Profil</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Rolingiz:{" "}
          <span className="font-bold text-champagne">
            {ROL_NOMI[hisob.rol]}
          </span>
          . Bu ma’lumotlar ommaviy profilingizda ko‘rinadi.
        </p>
      </header>

      <div className="mt-7 space-y-6">
        <ToldirishKorsatkichi
          foiz={foiz}
          bandlar={bandlar}
          username={profil.username}
        />

        <section>
          <h2 className="mb-3 text-lg font-extrabold">Rasmlar</h2>
          <div className="surface-card grid gap-7 p-6 sm:grid-cols-[auto_1fr]">
            <div>
              <h3 className="mb-3 text-sm font-bold text-champagne">Avatar</h3>
              <RasmYuklash
                turi="avatar"
                joriyUrl={profil.avatar_url}
                foydalanuvchiId={profil.id}
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold text-champagne">Muqova</h3>
              <RasmYuklash
                turi="muqova"
                joriyUrl={profil.muqova_url}
                foydalanuvchiId={profil.id}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold">Asosiy ma’lumotlar</h2>
          <ProfilFormasi profil={profil} email={hisob.email} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold">Ko‘nikmalar</h2>
          <KonikmalarBoshqaruvi konikmalar={konikmalar} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold">Havolalar</h2>
          <HavolalarFormasi havolalar={profil.havolalar} />
        </section>
      </div>
    </>
  );
}
