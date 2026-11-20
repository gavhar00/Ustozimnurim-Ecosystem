import { redirect } from "next/navigation";
import { profilTalabQil } from "@/lib/auth";
import { toliqProfil } from "@/lib/data/profil";

/**
 * «Profil» bo‘limiga o‘tilganda foydalanuvchi o‘z profilini darhol ko‘radi.
 * Foydalanuvchi nomi hali yo‘q bo‘lsa — tahrirlash sahifasiga o‘tkaziladi.
 */
export default async function ProfilimKorinishi() {
  const hisob = await profilTalabQil("/panel/profil");
  const profil = await toliqProfil(hisob.id);
  redirect(profil?.username ? `/profil/${profil.username}` : "/panel/profil");
}
