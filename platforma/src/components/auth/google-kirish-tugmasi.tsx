"use client";

import { useState } from "react";
import { Globe2, LoaderCircle } from "lucide-react";
import { FormXabar } from "@/components/ui/form";
import { supabaseBrauzer } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GoogleKirishTugmasi() {
  const [xato, setXato] = useState<string | null>(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);

  async function googleBilanKirish() {
    const supabase = supabaseBrauzer();
    if (!supabase) {
      setXato("Kirish tizimi hali ulanmagan.");
      return;
    }

    setYuklanmoqda(true);
    setXato(null);
    const keyin = new URLSearchParams(window.location.search).get("keyin");
    const next = keyin && keyin.startsWith("/") && !keyin.startsWith("//")
      ? keyin
      : "/panel";
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });

    if (error) {
      setXato("Google orqali kirib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring.");
      setYuklanmoqda(false);
    }
  }

  return (
    <div className="space-y-3">
      {xato ? <FormXabar>{xato}</FormXabar> : null}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={googleBilanKirish}
        disabled={yuklanmoqda}
      >
        {yuklanmoqda ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Globe2 className="size-4" aria-hidden="true" />
        )}
        Google bilan davom etish
      </Button>
    </div>
  );
}
