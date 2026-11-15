"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { supabaseBrauzer } from "@/lib/supabase/client";

export function RoyxatFormasi() {
  const router = useRouter();
  const [ism, setIsm] = useState("");
  const [email, setEmail] = useState("");
  const [parol, setParol] = useState("");
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [yuborildi, setYuborildi] = useState(false);

  const supabase = supabaseBrauzer();

  async function yubor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    if (parol.length < 8) {
      setXato("Parol kamida 8 ta belgidan iborat bo‘lishi kerak.");
      return;
    }

    setYuborilmoqda(true);
    setXato(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: parol,
      options: { data: { toliq_ism: ism } },
    });

    if (error) {
      const xabar = error.message.toLowerCase();
      if (xabar.includes("already registered") || xabar.includes("already been registered")) {
        setXato("Bu email bilan hisob allaqachon mavjud — kirish sahifasidan foydalaning.");
      } else if (xabar.includes("rate limit") || xabar.includes("too many")) {
        setXato("Juda ko‘p urinish bo‘ldi. Bir necha daqiqadan so‘ng qayta urining.");
      } else {
        setXato("Ro‘yxatdan o‘tishda xatolik yuz berdi. Qayta urinib ko‘ring.");
      }
      setYuborilmoqda(false);
      return;
    }

    // Email tasdiqlash o‘chirilgan bo‘lsa, Supabase darhol sessiya qaytaradi —
    // foydalanuvchini to‘g‘ridan-to‘g‘ri panelga olib o‘tamiz.
    if (data.session) {
      router.push("/panel");
      router.refresh();
      return;
    }

    // Tasdiqlash yoqilgan holat uchun zaxira xabar.
    setYuborildi(true);
    setYuborilmoqda(false);
  }

  if (!supabase) {
    return (
      <FormXabar turi="ogohlantirish">
        Hisob tizimi hali ulanmagan. Ro‘yxatdan o‘tish imkoniyati platformaning
        keyingi bosqichida ochiladi.
      </FormXabar>
    );
  }

  if (yuborildi) {
    return (
      <FormXabar turi="muvaffaqiyat">
        Tasdiqlash havolasi <strong>{email}</strong> manziliga yuborildi.
        Pochtangizni tekshiring va havola orqali hisobingizni faollashtiring.
      </FormXabar>
    );
  }

  return (
    <form onSubmit={yubor} className="space-y-5">
      {xato ? <FormXabar>{xato}</FormXabar> : null}

      <div>
        <Label htmlFor="ism">To‘liq ism</Label>
        <Input
          id="ism"
          type="text"
          autoComplete="name"
          required
          value={ism}
          onChange={(e) => setIsm(e.target.value)}
          placeholder="Ism Familiya"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          value={parol}
          onChange={(e) => setParol(e.target.value)}
          placeholder="Kamida 8 ta belgi"
          aria-describedby="parol-izoh"
        />
        <p id="parol-izoh" className="mt-2 text-xs text-fg-muted">
          Kamida 8 ta belgi bo‘lsin.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={yuborilmoqda}>
        {yuborilmoqda ? "Yuborilmoqda…" : "Ro‘yxatdan o‘tish"}
      </Button>
    </form>
  );
}
