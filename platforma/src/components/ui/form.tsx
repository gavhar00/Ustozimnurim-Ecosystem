import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-border-subtle bg-ink-850/70 px-4 text-[0.95rem] text-fg placeholder:text-muted-soft",
        "transition-colors focus:border-gold-400/60 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 block text-sm font-bold text-champagne", className)}
      {...props}
    />
  );
}

/** Forma ostidagi xato yoki muvaffaqiyat xabari. */
export function FormXabar({
  turi = "xato",
  children,
}: {
  turi?: "xato" | "muvaffaqiyat" | "ogohlantirish";
  children: React.ReactNode;
}) {
  const uslub = {
    xato: "border-[#ff8f87]/35 bg-[#ff8f87]/10 text-[#ffb3ad]",
    muvaffaqiyat: "border-[#5fd39b]/35 bg-[#5fd39b]/10 text-[#9fe4c2]",
    ogohlantirish: "border-border-strong bg-gold-400/10 text-champagne",
  }[turi];

  return (
    <p
      role={turi === "xato" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        uslub,
      )}
    >
      {children}
    </p>
  );
}
