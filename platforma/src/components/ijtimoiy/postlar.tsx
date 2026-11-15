"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Heart, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormXabar, Label } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import {
  postOchir,
  postYoz,
  yoqtirishniAlmashtir,
  type IjtimoiyHolati,
} from "@/app/ijtimoiy/amallar";
import type { Post } from "@/lib/data/ijtimoiy";
import { cn } from "@/lib/utils";

function sana(iso: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function Postlar({
  postlar,
  ozimi,
  kirgan,
  muallifIsmi,
}: {
  postlar: Post[];
  ozimi: boolean;
  kirgan: boolean;
  muallifIsmi: string;
}) {
  const forma = useRef<HTMLFormElement>(null);
  const [holat, amal] = useActionState<IjtimoiyHolati, FormData>(
    async (oldingi, formData) => {
      const natija = await postYoz(oldingi, formData);
      if (!natija.xato) forma.current?.reset();
      return natija;
    },
    {},
  );

  return (
    <div className="space-y-6">
      {ozimi ? (
        <form ref={forma} action={amal} className="surface-card space-y-4 p-6">
          {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}

          <div>
            <Label htmlFor="post-matn">Nima yangilik?</Label>
            <textarea
              id="post-matn"
              name="matn"
              required
              minLength={3}
              maxLength={2000}
              rows={4}
              placeholder="O‘rganganingiz, qurganingiz yoki savolingizni yozing…"
              className="w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] leading-relaxed text-fg placeholder:text-muted-soft"
            />
          </div>

          <Button type="submit">
            <Send className="size-4" aria-hidden="true" />
            Joylash
          </Button>
        </form>
      ) : null}

      {postlar.length === 0 ? (
        <EmptyState
          sarlavha="Hali post yo‘q"
          izoh={
            ozimi
              ? "Birinchi postingizni yuqoridagi formadan joylang."
              : `${muallifIsmi} hali post joylamagan.`
          }
        />
      ) : (
        <ul className="space-y-4">
          {postlar.map((post) => (
            <PostKartasi
              key={post.id}
              post={post}
              ozimi={ozimi}
              kirgan={kirgan}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PostKartasi({
  post,
  ozimi,
  kirgan,
}: {
  post: Post;
  ozimi: boolean;
  kirgan: boolean;
}) {
  const [yoqtirdim, setYoqtirdim] = useState(post.ozim_yoqtirdim);
  const [soni, setSoni] = useState(post.yoqtirishlar_soni);
  const [tasdiq, setTasdiq] = useState(false);
  const [kutilmoqda, startTransition] = useTransition();

  return (
    <li className="surface-card p-5">
      <p className="whitespace-pre-line leading-relaxed text-fg">{post.matn}</p>

      <div className="mt-4 flex items-center gap-4 border-t border-border-subtle pt-3">
        <span className="text-xs text-fg-muted">{sana(post.yaratilgan)}</span>

        <button
          type="button"
          disabled={!kirgan || kutilmoqda}
          aria-pressed={yoqtirdim}
          onClick={() => {
            const yangi = !yoqtirdim;
            setYoqtirdim(yangi);
            setSoni((s) => s + (yangi ? 1 : -1));
            startTransition(async () => {
              const natija = await yoqtirishniAlmashtir(post.id, !yangi);
              if (natija.xato) {
                setYoqtirdim(!yangi);
                setSoni((s) => s + (yangi ? -1 : 1));
              }
            });
          }}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-bold transition-colors",
            yoqtirdim ? "text-gold-300" : "text-fg-muted hover:text-gold-300",
            !kirgan && "cursor-not-allowed opacity-60",
          )}
          title={kirgan ? undefined : "Yoqtirish uchun hisobingizga kiring"}
        >
          <Heart
            className={cn("size-4", yoqtirdim && "fill-current")}
            aria-hidden="true"
          />
          {soni}
        </button>

        {ozimi ? (
          <button
            type="button"
            disabled={kutilmoqda}
            onClick={() => {
              if (tasdiq) {
                startTransition(async () => {
                  await postOchir(post.id);
                });
              } else {
                setTasdiq(true);
              }
            }}
            onBlur={() => setTasdiq(false)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted transition-colors hover:text-[#ffb3ad]"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {tasdiq ? "Tasdiqlang" : "O‘chirish"}
          </button>
        ) : null}
      </div>
    </li>
  );
}
