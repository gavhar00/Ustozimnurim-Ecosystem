"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";
import { loyihaQosh, loyihaTahrirla, type LoyihaHolatiNatija } from "@/app/panel/loyihalar-amallari";
import { LoyihaRasmMaydoni } from "@/components/panel/loyiha-rasm-maydoni";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { LOYIHA_HOLATI_NOMI, type Loyiha, type LoyihaHolati } from "@/lib/turlar";

const selectClass = "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-sm text-fg";
const textAreaClass = "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-sm text-fg placeholder:text-muted-soft";

function SaqlashTugmasi({ tahrirlash }: { tahrirlash: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
      {pending ? "Saqlanmoqda…" : tahrirlash ? "O‘zgarishlarni saqlash" : "Loyihani qo‘shish"}
    </Button>
  );
}

export function LoyihaFormasi({
  foydalanuvchiId,
  loyiha,
}: {
  foydalanuvchiId: string;
  loyiha?: Loyiha;
}) {
  const router = useRouter();
  const editAction = loyiha
    ? (oldingi: LoyihaHolatiNatija, data: FormData) => loyihaTahrirla(loyiha.id, oldingi, data)
    : loyihaQosh;
  const [holat, amal] = useActionState<LoyihaHolatiNatija, FormData>(editAction, {});

  useEffect(() => {
    if (holat.muvaffaqiyat && loyiha) {
      router.push("/panel/loyihalarim");
      router.refresh();
    }
  }, [holat.muvaffaqiyat, loyiha, router]);

  return (
    <form action={amal} className="surface-card space-y-6 p-5 sm:p-7">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {!loyiha && holat.muvaffaqiyat ? <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar> : null}
      <div>
        <h2 className="text-xl font-extrabold">{loyiha ? "Loyihani tahrirlash" : "Yangi loyiha"}</h2>
        <p className="mt-1 text-sm text-fg-muted">Portfoliongiz uchun loyiha tafsilotlari va rasmlarini kiriting.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div><Label htmlFor="loyiha-nom">Loyiha nomi</Label><Input id="loyiha-nom" name="nom" required minLength={3} maxLength={80} defaultValue={loyiha?.nom} placeholder="Masalan: Kitob javoni" /></div>
          <div><Label htmlFor="loyiha-tavsif">Tavsif</Label><textarea id="loyiha-tavsif" name="tavsif" required minLength={10} maxLength={1000} rows={5} defaultValue={loyiha?.tavsif} placeholder="Loyiha nima qiladi va qanday muammoni hal qiladi?" className={textAreaClass} /></div>
        </div>
        <div className="w-full space-y-5 md:w-72">
          <div><Label>Muqova</Label><LoyihaRasmMaydoni turi="muqova" foydalanuvchiId={foydalanuvchiId} boshlangichUrl={loyiha?.muqova_url} /></div>
          <div><Label>Logo</Label><LoyihaRasmMaydoni turi="logo" foydalanuvchiId={foydalanuvchiId} boshlangichUrl={loyiha?.logo_url} /></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="loyiha-turkum">Turkum</Label><Input id="loyiha-turkum" name="turkum" maxLength={40} defaultValue={loyiha?.turkum} placeholder="Masalan, Veb ilova" /></div>
        <div><Label htmlFor="loyiha-rol">Loyihadagi rolingiz</Label><Input id="loyiha-rol" name="egalik_rol" maxLength={80} defaultValue={loyiha?.egalik_rol ?? ""} placeholder="Masalan, Frontend dasturchi" /></div>
        <div><Label htmlFor="loyiha-tex">Texnologiyalar</Label><Input id="loyiha-tex" name="texnologiyalar" maxLength={200} defaultValue={loyiha?.texnologiyalar.join(", ")} placeholder="React, TypeScript, Supabase" /><p className="mt-1 text-xs text-fg-muted">Vergul bilan ajrating.</p></div>
        <div><Label htmlFor="loyiha-holat">Holat</Label><select id="loyiha-holat" name="holat" defaultValue={loyiha?.holat ?? "jarayonda"} className={selectClass}>{(Object.keys(LOYIHA_HOLATI_NOMI) as LoyihaHolati[]).map((holat) => <option key={holat} value={holat}>{LOYIHA_HOLATI_NOMI[holat]}</option>)}</select></div>
        <div><Label htmlFor="loyiha-github">GitHub havolasi</Label><Input id="loyiha-github" name="github_url" type="url" maxLength={200} defaultValue={loyiha?.github_url ?? ""} placeholder="https://github.com/ism/loyiha" /></div>
        <div><Label htmlFor="loyiha-demo">Demo havolasi</Label><Input id="loyiha-demo" name="demo_url" type="url" maxLength={200} defaultValue={loyiha?.demo_url ?? ""} placeholder="https://loyiha.example" /></div>
      </div>
      <p className="text-xs text-fg-muted">Har bir rasm alohida saqlanadi. Ommaviy portfolio rasmlarini hamma ko‘ra oladi; tahrirlash faqat siz uchun ochiq.</p>
      <SaqlashTugmasi tahrirlash={Boolean(loyiha)} />
    </form>
  );
}
