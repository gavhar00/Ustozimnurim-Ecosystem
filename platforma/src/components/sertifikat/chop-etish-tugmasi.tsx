"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Brauzerning chop etish oynasini ochadi — u yerdan "PDF sifatida saqlash" mumkin. */
export function ChopEtishTugmasi() {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" />
      Chop etish / PDF saqlash
    </Button>
  );
}
