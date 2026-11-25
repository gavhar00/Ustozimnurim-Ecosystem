"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { ParolMaydoni } from "@/components/ui/parol-maydoni";
import { supabaseBrauzer } from "@/lib/supabase/client";
import { xavfsizIchkiManzil } from "@/lib/profil-toldirish";

export function KirishFormasi() {
  const [email, setEmail] = useState("");
  const [parol, setParol] = useState("");
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  const supabase = supabaseBrauzer();

  async function yubor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    setYuborilmoqda(true);
    setXato(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parol,
    });

    if (error) {
      const xabar = error.message.toLowerCase();
      if (xabar.includes("invalid login credentials")) {
        setXato(
          "Email yoki parol noto‘g‘ri. Hisobingiz bo‘lmasa, avval ro‘yxatdan o‘ting.",
        );
      } else if (xabar.includes("rate limit") || xabar.includes("too many")) {
        setXato("Juda ko‘p urinish bo‘ldi. Bir necha daqiqadan so‘ng qayta urining.");
      } else {
        setXato("Kirishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.");
      }
      setYuborilmoqda(false);
      return;
    }

    // Himoyalangan sahifadan kelgan bo‘sa — o‘sha yerga qaytaramiz.
    // To‘liq sahifa yuklanishi bilan o‘tamiz: shunda sessiya cookie’si server
    // tomonga kafolatli yetib boradi va qo‘riqchi bizni qaytarib yubormaydi.
    const keyin = new URLSearchParams(window.location.search).get("keyin");
    window.location.replace(xavfsizIchkiManzil(keyin));
  }

  if (!supabase) {
    return (
      <FormXabar turi="ogohlantirish">
        Hisob tizimi hali ulanmagan. Ro‘yxatdan o‘tish va kirish imkoniyati
        platformaning keyingi bosqichida ochiladi.
      </FormXabar>
    );
  }

  return (
    <form onSubmit={yubor} className="space-y-5">
      {xato ? <FormXabar>{xato}</FormXabar> : null}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ism@example.com"
        />
      </div>

      <div>
        <Label htmlFor="parol">Parol</Label>
        <ParolMaydoni
          id="parol"
          autoComplete="current-password"
          required
          value={parol}
          onChange={(e) => setParol(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={yuborilmoqda}>
        {yuborilmoqda ? "Kirilmoqda…" : "Kirish"}
      </Button>
    </form>
  );
}
