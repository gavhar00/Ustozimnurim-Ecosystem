"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Newspaper } from "lucide-react";
import { lentaniYukla } from "@/app/lenta/amallar";
import { PostKartasi } from "@/components/lenta/post-kartasi";
import { PostYozish } from "@/components/lenta/post-yozish";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormXabar } from "@/components/ui/form";
import type { LentaPost } from "@/lib/lenta-turlari";

export function LentaRoyxati({
  boshlangich,
  davomi: boshlangichDavomi,
  yuklashXatosi,
  men,
}: {
  boshlangich: LentaPost[];
  davomi: string | null;
  yuklashXatosi: boolean;
  men: { id: string; toliq_ism: string; avatar_url: string | null; admin: boolean };
}) {
  const router = useRouter();
  const [postlar, setPostlar] = useState(boshlangich);
  const [davomi, setDavomi] = useState(boshlangichDavomi);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  async function yana() {
    if (!davomi || yuklanmoqda) return;
    setYuklanmoqda(true);
    setXato(null);
    const natija = await lentaniYukla(davomi);
    setYuklanmoqda(false);
    if (!natija.ok) return setXato(natija.xato);
    setPostlar((eski) => {
      const bor = new Set(eski.map((p) => p.id));
      return [...eski, ...natija.malumot.postlar.filter((p) => !bor.has(p.id))];
    });
    setDavomi(natija.malumot.davomi);
  }

  return (
    <div className="space-y-5">
      <PostYozish
        men={men}
        yaratildi={(post) => setPostlar((eski) => [post, ...eski.filter((p) => p.id !== post.id)])}
      />

      {yuklashXatosi ? (
        <div className="space-y-3">
          <FormXabar>Lentani yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.</FormXabar>
          <Button type="button" variant="secondary" onClick={() => router.refresh()}>Qayta urinish</Button>
        </div>
      ) : postlar.length === 0 ? (
        <EmptyState
          ikona={<Newspaper className="size-7" aria-hidden="true" />}
          sarlavha="Lentada hali post yo‘q"
          izoh="Birinchi bo‘lib o‘rganganlaringiz yoki savolingizni yuqoridagi maydonda yozing."
        />
      ) : (
        <div className="space-y-5">
          {postlar.map((post) => (
            <PostKartasi
              key={post.id}
              post={post}
              men={men}
              yangilandi={(yangi) => setPostlar((eski) => eski.map((p) => (p.id === yangi.id ? yangi : p)))}
              ochirildi={(id) => setPostlar((eski) => eski.filter((p) => p.id !== id))}
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
