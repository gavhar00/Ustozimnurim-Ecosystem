"use client";

import { useEffect, useState } from "react";
import { xabarBelgisi } from "@/app/xabarlar/amallar";

/** O‘qilmagan xabarlar soni belgisi; ayni paytda foydalanuvchi faolligini yangilaydi. */
export function XabarBelgisi({ className }: { className?: string }) {
  const [son, setSon] = useState(0);
  useEffect(() => {
    let tirik = true;
    const yangila = () => {
      if (document.visibilityState === "hidden") return;
      xabarBelgisi()
        .then((n) => tirik && setSon(n))
        .catch(() => undefined);
    };
    yangila();
    const t = setInterval(yangila, 20000);
    document.addEventListener("visibilitychange", yangila);
    return () => {
      tirik = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", yangila);
    };
  }, []);
  if (son <= 0) return null;
  return (
    <span
      aria-label={`${son} ta o‘qilmagan xabar`}
      className={
        className ??
        "absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[0.6rem] font-black text-ink-950"
      }
    >
      {son > 9 ? "9+" : son}
    </span>
  );
}
