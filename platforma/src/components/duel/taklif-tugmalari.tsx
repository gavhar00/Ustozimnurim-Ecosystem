"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { duelQabul } from "@/app/duel/amallar";

export function TaklifTugmalari({ id }: { id: string }) {
  const router = useRouter();
  const [xato, setXato] = useState("");
  const [band, start] = useTransition();

  function javob(qabul: boolean) {
    setXato("");
    start(async () => {
      const n = await duelQabul(id, qabul);
      if (!n.ok) return setXato(n.xato);
      if (qabul) router.push(`/duel/${id}`);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" disabled={band} onClick={() => javob(true)}>Qabul</Button>
        <Button size="sm" variant="secondary" disabled={band} onClick={() => javob(false)}>Rad</Button>
      </div>
      {xato ? <p role="alert" className="text-xs font-bold text-red-400">{xato}</p> : null}
    </div>
  );
}
