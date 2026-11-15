import type { Metadata } from "next";
import { LoyihalarBoshqaruvi } from "@/components/panel/loyihalar-boshqaruvi";
import { profilTalabQil } from "@/lib/auth";
import { profilLoyihalari } from "@/lib/data/profil";
import { loyihaAzolari, loyihaSorovlari } from "@/lib/data/ijtimoiy";

export const metadata: Metadata = {
  title: "Loyihalarim",
  robots: { index: false, follow: false },
};

export default async function LoyihalarimSahifasi() {
  const hisob = await profilTalabQil("/panel/loyihalarim");
  const loyihalar = await profilLoyihalari(hisob.id);

  const idlar = loyihalar.map((l) => l.id);
  const sorovlar = await loyihaSorovlari(idlar);
  const azoJuftlari = await Promise.all(
    idlar.map(async (id) => [id, await loyihaAzolari(id)] as const),
  );
  const azolar = Object.fromEntries(azoJuftlari);

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Loyihalarim
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          {loyihalar.length > 0
            ? `${loyihalar.length} ta loyiha. Ular ommaviy profilingizda ko‘rinadi.`
            : "Qurgan ishlaringizni qo‘shing — ular ommaviy profilingizda ko‘rinadi."}
        </p>
      </header>

      <div className="mt-7">
        <LoyihalarBoshqaruvi
          loyihalar={loyihalar}
          azolar={azolar}
          sorovlar={sorovlar}
        />
      </div>
    </>
  );
}
