"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const MANZIL = "/brend/kirish-animatsiya.mp4";
const KALIT = "un-intro";

/**
 * Saytga birinchi kirishda (har brauzer sessiyasida bir marta) logotip animatsiyasini ko‘rsatadi.
 * Ko‘rinishi `<html data-intro="1">` orqali boshqariladi — bu belgini sahifa chizilishidan oldin
 * `kirishScripti` qo‘yadi, shuning uchun sahifa "miltillamaydi". Video faqat kerak bo‘lganda yuklanadi.
 */
export function KirishAnimatsiyasi() {
  const qobiq = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const yopilgan = useRef(false);

  useEffect(() => {
    const html = document.documentElement;
    const v = video.current;
    if (html.getAttribute("data-intro") !== "1" || !v) return;

    function yop() {
      if (yopilgan.current) return;
      yopilgan.current = true;
      try {
        sessionStorage.setItem(KALIT, "1");
      } catch {
        /* sessionStorage yopiq bo‘lsa ham davom etamiz */
      }
      v?.pause();
      qobiq.current?.classList.add("chiqmoqda");
      window.setTimeout(() => html.removeAttribute("data-intro"), 600);
    }

    const tugmaBosildi = (e: KeyboardEvent) => {
      if (e.key === "Escape") yop();
    };
    window.addEventListener("keydown", tugmaBosildi);
    v.addEventListener("ended", yop);
    v.addEventListener("error", yop);
    // Zaxira: video yuklanmasa yoki to‘xtab qolsa, 15 soniyadan keyin yopiladi.
    const zaxira = window.setTimeout(yop, 15000);

    v.src = MANZIL;
    v.play().catch(yop);

    qobiq.current?.querySelector("button")?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener("keydown", tugmaBosildi);
      v.removeEventListener("ended", yop);
      v.removeEventListener("error", yop);
      window.clearTimeout(zaxira);
    };
  }, []);

  function otkazish() {
    const v = video.current;
    // Effekt ichidagi yop() ga `ended` hodisasi orqali yetib boramiz.
    if (v) {
      v.dispatchEvent(new Event("ended"));
    }
  }

  return (
    <div
      id="kirish-animatsiya"
      ref={qobiq}
      role="dialog"
      aria-modal="true"
      aria-label="UstozimNurim logotipi animatsiyasi"
    >
      <video ref={video} muted playsInline preload="none" disablePictureInPicture aria-hidden="true" />
      <button type="button" onClick={otkazish} className="kirish-otkazish">
        <X className="size-4" aria-hidden="true" />
        O‘tkazib yuborish
      </button>
    </div>
  );
}

/** <head> ichida, sahifa chizilishidan oldin ishlaydi. */
export const kirishScripti = `
(function(){
  try {
    var korilgan = sessionStorage.getItem("${KALIT}");
    var kamHarakat = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!korilgan && !kamHarakat) document.documentElement.setAttribute("data-intro", "1");
  } catch (e) {}
})();
`;
