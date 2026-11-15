"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormXabar, Input, Label } from "@/components/ui/form";
import { darsYarat, type AdminHolati } from "@/app/admin/amallar";

const TURLAR = [
  { qiymat: "video", nom: "Video dars" },
  { qiymat: "amaliyot", nom: "Amaliyot" },
  { qiymat: "test", nom: "Test" },
];

const selectUslubi =
  "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg";
const textareaUslubi =
  "w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 py-3 text-[0.95rem] text-fg placeholder:text-muted-soft";

function Tugma() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Qo‘shilmoqda…" : "Dars qo‘shish"}
    </Button>
  );
}

export function DarsFormasi({ kursId }: { kursId: string }) {
  const amalKursBilan = darsYarat.bind(null, kursId);
  const [holat, amal] = useActionState<AdminHolati, FormData>(
    amalKursBilan,
    {},
  );

  return (
    <form action={amal} className="surface-card space-y-5 p-6">
      {holat.xato ? <FormXabar>{holat.xato}</FormXabar> : null}
      {holat.muvaffaqiyat ? (
        <FormXabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</FormXabar>
      ) : null}

      <div>
        <Label htmlFor="nom">Dars nomi</Label>
        <Input
          id="nom"
          name="nom"
          required
          minLength={3}
          placeholder="Masalan: Funksiyalar bilan tanishuv"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="turi">Turi</Label>
          <select id="turi" name="turi" className={selectUslubi}>
            {TURLAR.map((t) => (
              <option key={t.qiymat} value={t.qiymat}>
                {t.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="davomiylik_daqiqa">Davomiyligi (daqiqa)</Label>
          <Input
            id="davomiylik_daqiqa"
            name="davomiylik_daqiqa"
            type="number"
            min={0}
            max={600}
            defaultValue={10}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="video_url">Video havolasi</Label>
        <Input
          id="video_url"
          name="video_url"
          type="url"
          placeholder="YouTube havolasi yoki to‘g‘ridan-to‘g‘ri video manzili (ixtiyoriy)"
        />
      </div>

      <div>
        <Label htmlFor="yoriqnoma">Yo‘riqnoma</Label>
        <textarea
          id="yoriqnoma"
          name="yoriqnoma"
          rows={5}
          placeholder="O‘quvchi nima qilishi kerakligini yozing"
          className={textareaUslubi}
        />
      </div>

      <div>
        <Label htmlFor="boshlangich_kod">Boshlang‘ich kod</Label>
        <textarea
          id="boshlangich_kod"
          name="boshlangich_kod"
          rows={6}
          spellCheck={false}
          placeholder={"// O‘quvchi muharrirda ko‘radigan kod\nconsole.log(\"Salom\");"}
          className={`${textareaUslubi} font-mono text-[0.86rem]`}
        />
        <p className="mt-2 text-xs text-fg-muted">
          Hozircha muharrir JavaScript kodini brauzerda ishga tushiradi.
        </p>
      </div>

      <Tugma />
    </form>
  );
}
