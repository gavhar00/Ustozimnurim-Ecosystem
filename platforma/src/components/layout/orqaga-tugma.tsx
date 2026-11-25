"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Oldingi sahifaga qaytadi; tarix bo‘lmasa (to‘g‘ridan-to‘g‘ri ochilgan bo‘lsa) zaxira manzilga o‘tadi. */
export function OrqagaTugma({ zaxira, className }: { zaxira: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(zaxira);
      }}
      aria-label="Orqaga qaytish"
      title="Orqaga"
      className={className}
    >
      <ArrowLeft className="size-[18px]" aria-hidden="true" />
    </button>
  );
}
