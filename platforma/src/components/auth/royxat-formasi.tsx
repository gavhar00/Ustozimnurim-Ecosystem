"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { ParolMaydoni } from "@/components/ui/parol-maydoni";
import { supabaseBrauzer } from "@/lib/supabase/client";

export function RoyxatFormasi() {
  const [ism, setIsm] = useState("");
  const [email, setEmail] = useState("");
  const [parol, setParol] = useState("");
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const [xato, setXato] = useState<string | null>(null);

  const supabase = supabaseBrauzer();

  /** To‘liq sahifa yuklanishi bilan o‘tamiz — sessiya cookie’si server
   *  tomonga kafolatli yetib boradi (client navigatsiyada ulgurmasligi mumkin). */
  function panelgaOt() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- to‘liq yuklanish sessiya cookie’sini serverga yetkazadi
    window.location.assign("/panel");
  }

  async function yubor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    if (parol.length < 6) {
      setXato("Parol kamida 6 ta belgidan iborat bo‘lishi kerak.");
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

    // Email tasdiqlash talab qilinmaydi: hisob darhol faol bo‘ladi.
    // Sessiya qaytsa — to‘g‘ridan-to‘g‘ri panelga.
    if (data.session) {
      panelgaOt();
      return;
    }

    // Sessiya qaytmasa, o‘sha ma’lumot bilan darhol kirishga urinamiz.
    const { error: kirishXatosi } = await supabase.auth.signInWithPassword({
      email,
      password: parol,
    });

    if (!kirishXatosi) {
      panelgaOt();
      return;
    }

    // Supabase mavjud email uchun ham "muvaffaqiyat" qaytaradi (kim ro‘yxatdan
    // o‘tgani oshkor bo‘lmasligi uchun). Kirish ham o‘tmasa — sabab shu.
    setXato(
      "Bu email bilan hisob allaqachon mavjud. Kirish sahifasidan o‘z parolingiz bilan kiring.",
    );
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
        <ParolMaydoni
          id="parol"
          autoComplete="new-password"
          required
          minLength={6}
          value={parol}
          onChange={(e) => setParol(e.target.value)}
          placeholder="Kamida 6 ta belgi"
          aria-describedby="parol-izoh"
        />
        <p id="parol-izoh" className="mt-2 text-xs text-fg-muted">
          Kamida 6 ta belgi bo‘lsin. Email tasdiqlash talab qilinmaydi.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={yuborilmoqda}>
        {yuborilmoqda ? "Yuborilmoqda…" : "Ro‘yxatdan o‘tish"}
      </Button>
    </form>
  );
}
