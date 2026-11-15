"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type Xususiyatlar = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  /** Maydon ichidagi ko‘z tugmasi uchun o‘qiladigan nom. */
  nom?: string;
};

/** Parol maydoni — ichida ko‘rsatish/yashirish tugmasi bilan. */
export function ParolMaydoni({ className, nom = "Parol", ...props }: Xususiyatlar) {
  const [ochiq, setOchiq] = useState(false);
  const tugmaId = useId();

  return (
    <div className="relative">
      <Input
        {...props}
        type={ochiq ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        id={tugmaId}
        type="button"
        onClick={() => setOchiq((o) => !o)}
        aria-label={ochiq ? `${nom}ni yashirish` : `${nom}ni ko‘rsatish`}
        aria-pressed={ochiq}
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2",
          "text-fg-muted transition-colors hover:text-gold-300",
          "focus:outline-none focus-visible:text-gold-300",
        )}
      >
        {ochiq ? (
          <EyeOff className="size-[1.05rem]" aria-hidden />
        ) : (
          <Eye className="size-[1.05rem]" aria-hidden />
        )}
      </button>
    </div>
  );
}
