import type { Metadata } from "next";
import { BildirishnomalarRoyxati } from "@/components/panel/bildirishnomalar-royxati";
import { profilTalabQil } from "@/lib/auth";
import { bildirishnomalar } from "@/lib/data/bildirishnomalar";

export const metadata: Metadata = {
  title: "Bildirishnomalar",
  robots: { index: false, follow: false },
};

export default async function BildirishnomalarSahifasi() {
  await profilTalabQil("/panel/bildirishnomalar");
  const royxat = await bildirishnomalar();

  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          Bildirishnomalar
        </h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Bog‘lanish so‘rovlari, yangi kuzatuvchilar, yoqtirishlar va javoblar.
        </p>
      </header>

      <div className="mt-7">
        <BildirishnomalarRoyxati royxat={royxat} />
      </div>
    </>
  );
}
