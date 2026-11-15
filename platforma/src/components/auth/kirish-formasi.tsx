"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { supabaseBrauzer } from "@/lib/supabase/client";

export function KirishFormasi() {
  const router = useRouter();
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
      setXato(
        error.message === "Invalid login credentials"
          ? "Email yoki parol noto‘g‘ri."
          : "Kirishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.",
      );
      setYuborilmoqda(false);
      return;
    }

    // Himoyalangan sahifadan kelgan bo‘lsa — o‘sha yerga qaytaramiz.
    const keyin = new URLSearchParams(window.location.search).get("keyin");
    router.push(keyin && keyin.startsWith("/") ? keyin : "/panel");
    router.refresh();
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
        <Input
          id="parol"
          type="password"
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
