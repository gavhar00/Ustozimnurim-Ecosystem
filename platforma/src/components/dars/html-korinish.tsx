"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HTML/CSS darslari uchun jonli ko'rinish oynasi.
 *
 * Kod ajratilgan iframe ichida chiziladi: `sandbox="allow-scripts"` bo'lgani
 * uchun u sahifaning DOM'iga, cookie'lariga va Supabase sessiyasiga yeta
 * olmaydi. Yozilgan zahoti emas, yozish to'xtagach yangilanadi — har bosilgan
 * tugmada qayta chizilsa, oyna miltillab turadi.
 */
export function HtmlKorinish({ kod }: { kod: string }) {
  const [korsatiladigan, setKorsatiladigan] = useState(kod);
  const birinchi = useRef(true);

  useEffect(() => {
    if (birinchi.current) {
      birinchi.current = false;
      return;
    }
    const soat = setTimeout(() => setKorsatiladigan(kod), 400);
    return () => clearTimeout(soat);
  }, [kod]);

  // Foydalanuvchi faqat tana qismini yozgan bo'lsa, atrofini o'zimiz o'raymiz.
  const toliq = /<html[\s>]/i.test(korsatiladigan)
    ? korsatiladigan
    : `<!doctype html><html lang="uz"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#fff;color:#111}</style>` +
      `</head><body>${korsatiladigan}</body></html>`;

  return (
    <div className="border-t border-border-subtle">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="font-mono text-xs font-bold text-champagne">
          Ko‘rinishi
        </span>
        <span className="text-xs text-fg-muted">Yozishni to‘xtatsangiz yangilanadi</span>
      </div>
      <iframe
        title="Natija ko‘rinishi"
        sandbox="allow-scripts"
        srcDoc={toliq}
        className="h-80 w-full border-0 bg-white"
      />
    </div>
  );
}
