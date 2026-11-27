"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Images, LoaderCircle } from "lucide-react";
import { lahzalarniYukla } from "@/app/lahzalar/amallar";
import { LahzaKartasi } from "@/components/lahzalar/lahza-kartasi";
import { LahzaYozish } from "@/components/lahzalar/lahza-yozish";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormXabar } from "@/components/ui/form";
import type { LahzaAsos, LahzaPost } from "@/lib/lahza-turlari";

export type Yozuvchi = { id: string; toliq_ism: string; avatar_url: string | null; admin: boolean };

export function LahzalarRoyxati({
  boshlangich,
  davomi: boshlangichDavomi,
  yuklashXatosi,
  men,
  tadbir,
  toldirilmagan,
  yozishsiz = false,
}: {
  boshlangich: LahzaPost[];
  davomi: string | null;
  yuklashXatosi: boolean;
  men: Yozuvchi | null;
  tadbir?: string | null;
  toldirilmagan?: boolean;
  /** true bo‘lsa yozish maydoni ko‘rsatilmaydi (masalan, bosh sahifada): faqat ommaviy lenta. */
  yozishsiz?: boolean;
}) {
  const router = useRouter();
  const [lahzalar, setLahzalar] = useState(boshlangich);
  const [davomi, setDavomi] = useState(boshlangichDavomi);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  async function yana() {
    if (!davomi || yuklanmoqda) return;
    setYuklanmoqda(true);
    setXato(null);
    const n = await lahzalarniYukla(davomi, tadbir);
    setYuklanmoqda(false);
    if (!n.ok) return setXato(n.xato);
    setLahzalar((eski) => {
      const bor = new Set(eski.map((p) => p.id));
      return [...eski, ...n.malumot.lahzalar.filter((p) => !bor.has(p.id))];
    });
    setDavomi(n.malumot.davomi);
  }

  /** Asl lahza bir necha kartada (o‘zi va repostlarida) ko‘rinishi mumkin — hammasini yangilaymiz. */
  function asosYangilandi(id: string, patch: Partial<LahzaAsos>) {
    setLahzalar((eski) =>
      eski.map((p) => {
        if (p.id === id) return { ...p, ...patch };
        if (p.asl?.id === id) return { ...p, asl: { ...p.asl, ...patch } };
        return p;
      }),
    );
  }

  return (
    <div className="space-y-5">
      {yozishsiz ? null : men ? (
        <LahzaYozish
          men={men}
          yaratildi={(l) => setLahzalar((eski) => [l, ...eski.filter((p) => p.id !== l.id)])}
        />
      ) : toldirilmagan ? (
        <div className="surface-card p-5 text-sm">
          Lahza yozish uchun avval{" "}
          <Link href="/profil/toldirish?keyin=%2Flahzalar" className="font-bold text-gold-300 hover:text-gold-200">
            profilingizni to‘ldiring
          </Link>
          .
        </div>
      ) : (
        <div className="surface-card flex flex-wrap items-center gap-3 p-5 text-sm">
          <span className="text-fg-muted">Lahza yozish, yoqtirish, izoh qoldirish va repost qilish uchun hisobingizga kiring.</span>
          <span className="ml-auto flex gap-2">
            <ButtonLink href="/kirish?keyin=%2Flahzalar" size="sm" variant="secondary">Kirish</ButtonLink>
            <ButtonLink href="/royxatdan-otish" size="sm">Ro‘yxatdan o‘tish</ButtonLink>
          </span>
        </div>
      )}

      {yuklashXatosi ? (
        <div className="space-y-3">
          <FormXabar>Lahzalarni yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.</FormXabar>
          <Button type="button" variant="secondary" onClick={() => router.refresh()}>Qayta urinish</Button>
        </div>
      ) : lahzalar.length === 0 ? (
        <EmptyState
          ikona={<Images className="size-7" aria-hidden="true" />}
          sarlavha="Hozircha lahza yo‘q"
          izoh="Birinchi lahzani siz joylang — hech qanday tasdiqsiz darhol hammaga ko‘rinadi."
        />
      ) : (
        <div className="space-y-5">
          {lahzalar.map((l) => (
            <LahzaKartasi
              key={l.id}
              lahza={l}
              men={men ? { id: men.id, admin: men.admin } : null}
              asosYangilandi={asosYangilandi}
              repostYaratildi={(r) => setLahzalar((eski) => [r, ...eski.filter((p) => p.id !== r.id)])}
              repostOlindi={(aslId) =>
                setLahzalar((eski) => eski.filter((p) => !(p.asl_id === aslId && men && p.profil_id === men.id)))
              }
              ochirildi={(id) =>
                setLahzalar((eski) => eski.filter((p) => p.id !== id && p.asl_id !== id))
              }
            />
          ))}

          {xato ? <FormXabar>{xato}</FormXabar> : null}
          {davomi ? (
            <div className="flex justify-center">
              <Button type="button" variant="secondary" onClick={() => void yana()} disabled={yuklanmoqda}>
                {yuklanmoqda ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                {yuklanmoqda ? "Yuklanmoqda…" : "Yana yuklash"}
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-fg-muted">Hammasini ko‘rdingiz.</p>
          )}
        </div>
      )}
    </div>
  );
}
