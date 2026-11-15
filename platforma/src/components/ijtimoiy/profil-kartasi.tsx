import Link from "next/link";
import { Handshake } from "lucide-react";
import type { QisqaProfil } from "@/lib/data/ijtimoiy";

/** Hamjamiyat va bog'lanishlar ro'yxatlaridagi qisqa profil kartasi. */
export function ProfilKartasi({
  profil,
  amal,
}: {
  profil: QisqaProfil;
  amal?: React.ReactNode;
}) {
  const ichki = (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-400/15 font-black text-gold-300"
      >
        {profil.toliq_ism.trim().charAt(0).toUpperCase() || "U"}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-fg">{profil.toliq_ism}</p>
        <p className="truncate text-xs text-fg-muted">
          {profil.username ? `@${profil.username}` : "—"}
          {profil.kasb ? ` · ${profil.kasb}` : ""}
        </p>
      </div>
    </div>
  );

  return (
    <li className="surface-card flex items-center justify-between gap-4 p-4">
      {profil.username ? (
        <Link href={`/profil/${profil.username}`} className="min-w-0 flex-1">
          {ichki}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{ichki}</div>
      )}

      <div className="flex shrink-0 items-center gap-2">
        {profil.hamkorlikka_ochiq ? (
          <span
            title="Hamkorlikka ochiq"
            className="inline-flex size-8 items-center justify-center rounded-full bg-[#5fd39b]/10 text-[#9fe4c2]"
          >
            <Handshake className="size-4" aria-hidden="true" />
            <span className="sr-only">Hamkorlikka ochiq</span>
          </span>
        ) : null}
        {amal}
      </div>
    </li>
  );
}
