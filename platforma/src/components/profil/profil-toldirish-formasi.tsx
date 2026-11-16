"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { profilToldirishniSaqla, type ProfilToldirishNatija } from "@/app/profil/toldirish/amallar";
import { RasmYuklash } from "@/components/panel/rasm-yuklash";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import type { ToliqProfil } from "@/lib/turlar";
import { profilToldirishFoizi } from "@/lib/profil-toldirish";
import { QIZIQISHLAR } from "@/lib/turlar";

const textAreaClass =
  "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-sm text-fg placeholder:text-muted-soft focus:border-gold-400";

export function ProfilToldirishFormasi({
  profil,
  tugilganSana,
  nextManzil,
}: {
  profil: ToliqProfil;
  tugilganSana: string;
  nextManzil: string;
}) {
  const [holat, amal, kutilyapti] = useActionState<ProfilToldirishNatija, FormData>(
    profilToldirishniSaqla,
    {},
  );
  const router = useRouter();
  const ism = profil.toliq_ism.trim().split(/\s+/);
  const foiz = profilToldirishFoizi({
    toliq_ism: profil.toliq_ism,
    avatar_url: profil.avatar_url,
    tugilgan_sana: tugilganSana,
    talim: profil.talim,
    sinf_kurs: profil.sinf_kurs,
    joylashuv: profil.joylashuv,
    qiziqishlar: profil.qiziqishlar,
    organish_yonalishlari: profil.organish_yonalishlari,
    organmoqchi_konikmalar: profil.organmoqchi_konikmalar,
    mavjud_konikmalar: profil.mavjud_konikmalar,
    maqsad: profil.maqsad,
    bio: profil.bio,
  });

  useEffect(() => {
    if (holat.muvaffaqiyat) {
      router.refresh();
      if ((holat.foiz ?? 0) >= 60) router.push(nextManzil);
    }
  }, [holat.muvaffaqiyat, holat.foiz, nextManzil, router]);

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-gold-300">
              <Sparkles className="size-4" aria-hidden="true" />
              Sizning o‘quv yo‘lingiz
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
              Profilingizni tanishtiring
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Bu ma’lumotlar sizga mos imkoniyatlarni topishga yordam beradi. 60% ga yetgach,
              o‘quv paneli ochiladi; profilni keyin ham tahrirlashingiz mumkin.
            </p>
          </div>
          <div
            className="grid size-24 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-gold-400) ${foiz}%, var(--border-subtle) 0)`,
            }}
            aria-label={`Profil ${foiz}% to‘ldirilgan`}
            role="img"
          >
            <div className="grid size-[76px] place-items-center rounded-full bg-bg-card text-xl font-black">
              {foiz}%
            </div>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-700" aria-hidden="true">
          <div className="h-full rounded-full bg-gold-400 transition-[width]" style={{ width: `${foiz}%` }} />
        </div>
      </section>

      <form action={amal} className="space-y-6">
        {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
        {holat.muvaffaqiyat && (holat.foiz ?? 0) < 60 ? (
          <FormXabar turi="muvaffaqiyat">
            Saqlandi — profilingiz hozir {holat.foiz}% to‘ldirilgan. Panelga kirish uchun kamida 60% kerak.
          </FormXabar>
        ) : null}
        <section className="surface-card grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-lg font-extrabold">Siz haqingizda</h2>
            <p className="mt-1 text-sm text-fg-muted">Ism va tug‘ilgan sana shaxsiy hisobingizni to‘g‘ri yuritish uchun kerak.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="ism">Ism</Label><Input id="ism" name="ism" defaultValue={ism[0] ?? ""} required minLength={2} maxLength={60} autoComplete="given-name" /></div>
              <div><Label htmlFor="familiya">Familiya</Label><Input id="familiya" name="familiya" defaultValue={ism.slice(1).join(" ")} required minLength={2} maxLength={60} autoComplete="family-name" /></div>
              <div><Label htmlFor="tugilgan-sana">Tug‘ilgan sana</Label><Input id="tugilgan-sana" name="tugilgan_sana" type="date" defaultValue={tugilganSana} required max={new Date().toISOString().slice(0, 10)} /></div>
              <div><Label htmlFor="talim">Ta’lim muassasasi</Label><Input id="talim" name="talim" defaultValue={profil.talim ?? ""} maxLength={150} placeholder="Maktab, kollej yoki universitet" /></div>
              <div><Label htmlFor="sinf-kurs">Sinf yoki kurs</Label><Input id="sinf-kurs" name="sinf_kurs" defaultValue={profil.sinf_kurs ?? ""} maxLength={60} placeholder="Masalan, 10-sinf yoki 2-kurs" /></div>
              <div><Label htmlFor="joylashuv">Hudud</Label><Input id="joylashuv" name="joylashuv" defaultValue={profil.joylashuv ?? ""} maxLength={100} placeholder="Shahar yoki viloyat" autoComplete="address-level1" /></div>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-champagne">Profil rasmi</h3>
            <RasmYuklash turi="avatar" joriyUrl={profil.avatar_url} foydalanuvchiId={profil.id} />
          </div>
        </section>

        <section className="surface-card space-y-5 p-5 sm:p-7">
          <div>
            <h2 className="text-lg font-extrabold">Qiziqish va ko‘nikmalar</h2>
            <p className="mt-1 text-sm text-fg-muted">O‘rganayotgan va o‘rganmoqchi bo‘lgan yo‘nalishlaringizni belgilang.</p>
          </div>
          <fieldset>
            <legend className="mb-3 text-sm font-bold">Qiziqishlar</legend>
            <div className="flex flex-wrap gap-2">
              {QIZIQISHLAR.map((qiziqish) => (
                <label key={qiziqish} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border-subtle px-3 text-sm hover:border-gold-400/60 focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2 focus-within:ring-offset-ink-950">
                  <input type="checkbox" name="qiziqishlar" value={qiziqish} defaultChecked={profil.qiziqishlar.includes(qiziqish)} className="accent-gold-400" />
                  {qiziqish}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label htmlFor="yonalishlar">O‘rganish yo‘nalishlari</Label><Input id="yonalishlar" name="organish_yonalishlari" defaultValue={(profil.organish_yonalishlari ?? []).join(", ")} placeholder="Frontend, robototexnika" /><p className="mt-1 text-xs text-fg-muted">Vergul bilan ajrating.</p></div>
            <div><Label htmlFor="yangi-konikmalar">O‘rganmoqchi bo‘lgan ko‘nikmalar</Label><Input id="yangi-konikmalar" name="organmoqchi_konikmalar" defaultValue={(profil.organmoqchi_konikmalar ?? []).join(", ")} placeholder="React, jamoada ishlash" /><p className="mt-1 text-xs text-fg-muted">Vergul bilan ajrating.</p></div>
            <div><Label htmlFor="mavjud-konikmalar">Mavjud ko‘nikmalar</Label><Input id="mavjud-konikmalar" name="mavjud_konikmalar" defaultValue={(profil.mavjud_konikmalar ?? []).join(", ")} placeholder="HTML, Figma" /><p className="mt-1 text-xs text-fg-muted">Vergul bilan ajrating.</p></div>
            <div><Label htmlFor="maqsad">Ta’lim maqsadingiz</Label><textarea id="maqsad" name="maqsad" defaultValue={profil.maqsad ?? ""} maxLength={400} rows={3} className={textAreaClass} placeholder="Yaqin kelajakda nimalarga erishmoqchisiz?" /></div>
          </div>
          <div><Label htmlFor="bio">O‘zingiz haqingizda qisqacha</Label><textarea id="bio" name="bio" defaultValue={profil.bio ?? ""} maxLength={500} rows={4} className={textAreaClass} placeholder="Sizni nima ilhomlantiradi?" /></div>
        </section>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-fg-muted">Ma’lumotlaringizni istalgan vaqtda yangilashingiz mumkin.</p>
          <Button type="submit" size="lg" disabled={kutilyapti} className="min-h-12">
            {kutilyapti ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
            {kutilyapti ? "Saqlanmoqda…" : foiz >= 60 ? "O‘zgarishlarni saqlash" : "Saqlash va davom etish"}
          </Button>
        </div>
      </form>
    </div>
  );
}
