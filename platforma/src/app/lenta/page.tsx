import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { LentaRoyxati } from "@/components/lenta/lenta-royxati";
import { profilTalabQil } from "@/lib/auth";
import { lentaPostlari } from "@/lib/data/lenta";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Hamjamiyat lentasi",
  robots: { index: false, follow: false },
};

export default async function LentaSahifasi() {
  const profil = await profilTalabQil("/lenta");
  const [natija, supabase] = await Promise.all([lentaPostlari(profil.id), supabaseServer()]);

  return (
    <Container className="max-w-2xl py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">Hamjamiyat lentasi</h1>
        <p className="mt-1 text-sm text-fg-muted">
          O‘quvchilar va ustozlar o‘rtasida fikr, savol va yutuqlar almashinadigan joy.
        </p>
      </div>
      <LentaRoyxati
        boshlangich={natija.postlar}
        davomi={natija.davomi}
        yuklashXatosi={natija.xato || !supabase}
        men={{
          id: profil.id,
          toliq_ism: profil.toliq_ism,
          avatar_url: profil.avatar_url,
          admin: profil.rol === "admin",
        }}
      />
    </Container>
  );
}
