"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { supabaseBrauzer } from "@/lib/supabase/client";

export function ParolTiklashFormasi() {
  const [email, setEmail] = useState("");
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [yuborildi, setYuborildi] = useState(false);

  const supabase = supabaseBrauzer();

  async function yubor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    setYuborilmoqda(true);
    setXato(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/parolni-yangilash`,
    });

    if (error) {
      setXato("Havolani yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.");
      setYuborilmoqda(false);
      return;
    }

    setYuborildi(true);
    setYuborilmoqda(false);
  }

  if (!supabase) {
    return (
      <FormXabar turi="ogohlantirish">
        Hisob tizimi hali ulanmagan. Parolni tiklash imkoniyati platformaning
        keyingi bosqichida ochiladi.
      </FormXabar>
    );
  }

  if (yuborildi) {
    return (
      <FormXabar turi="muvaffaqiyat">
        Agar <strong>{email}</strong> manzili ro‘yxatdan o‘tgan bo‘lsa, parolni
        tiklash havolasi yuborildi. Pochtangizni tekshiring.
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

      <Button type="submit" size="lg" className="w-full" disabled={yuborilmoqda}>
        {yuborilmoqda ? "Yuborilmoqda…" : "Havola yuborish"}
      </Button>
    </form>
  );
}
