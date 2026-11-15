import type { Metadata } from "next";
import { Users } from "lucide-react";
import {
  BekorTugmasi,
  JavobTugmalari,
} from "@/components/ijtimoiy/sorov-tugmalari";
import { ProfilKartasi } from "@/components/ijtimoiy/profil-kartasi";
import { EmptyState } from "@/components/ui/empty-state";
import { profilTalabQil } from "@/lib/auth";
import { boglanishRoyxatlari, tavsiyaEtilganlar } from "@/lib/data/ijtimoiy";

export const metadata: Metadata = {
  title: "Bog‘lanishlar",
  robots: { index: false, follow: false },
};

export default async function BoglanishlarSahifasi() {
  const hisob = await profilTalabQil("/panel/boglanishlar");
  const [royxatlar, tavsiyalar] = await Promise.all([
    boglanishRoyxatlari(hisob.id),
    tavsiyaEtilganlar(hisob.id),
  ]);

  const bogliqIdlar = new Set([
    ...royxatlar.boglangan.map((p) => p.id),
    ...royxatlar.kelgan.map((s) => s.profil.id),
    ...royxatlar.yuborilgan.map((s) => s.profil.id),
  ]);

  const yangiTavsiyalar = tavsiyalar.filter((p) => !bogliqIdlar.has(p.id));

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Bog‘lanishlar
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Jamoadosh toping, so‘rovlarga javob bering va tanishlaringizni
          kuzating.
        </p>
      </header>

      <div className="mt-7 space-y-10">
        <Bolim
          sarlavha="Kelgan so‘rovlar"
          soni={royxatlar.kelgan.length}
          bosh="Hozircha so‘rov yo‘q."
        >
          {royxatlar.kelgan.map((s) => (
            <ProfilKartasi
              key={s.id}
              profil={s.profil}
              amal={<JavobTugmalari sorovId={s.id} />}
            />
          ))}
        </Bolim>

        <Bolim
          sarlavha="Yuborilgan so‘rovlar"
          soni={royxatlar.yuborilgan.length}
          bosh="Hali hech kimga so‘rov yubormagansiz."
        >
          {royxatlar.yuborilgan.map((s) => (
            <ProfilKartasi
              key={s.id}
              profil={s.profil}
              amal={<BekorTugmasi sorovId={s.id} />}
            />
          ))}
        </Bolim>

        <Bolim
          sarlavha="Mening bog‘lanishlarim"
          soni={royxatlar.boglangan.length}
          bosh="Hali bog‘lanish yo‘q. Quyidagi tavsiyalardan boshlang."
        >
          {royxatlar.boglangan.map((p) => (
            <ProfilKartasi key={p.id} profil={p} />
          ))}
        </Bolim>

        <Bolim
          sarlavha="Tavsiya etilgan odamlar"
          soni={yangiTavsiyalar.length}
          bosh="Hozircha tavsiya yo‘q — platformada yangi odamlar paydo bo‘lishi bilan chiqadi."
        >
          {yangiTavsiyalar.map((p) => (
            <ProfilKartasi key={p.id} profil={p} />
          ))}
        </Bolim>
      </div>
    </>
  );
}

function Bolim({
  sarlavha,
  soni,
  bosh,
  children,
}: {
  sarlavha: string;
  soni: number;
  bosh: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-extrabold">
        {sarlavha}
        {soni > 0 ? (
          <span className="ml-2 text-sm font-bold text-gold-300">{soni}</span>
        ) : null}
      </h2>

      {soni === 0 ? (
        <div className="mt-3">
          <EmptyState
            ikona={<Users className="size-7" aria-hidden="true" />}
            sarlavha={bosh}
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">{children}</ul>
      )}
    </section>
  );
}
