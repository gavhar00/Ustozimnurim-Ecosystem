import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-linear-[98deg,var(--color-gold-200),var(--color-gold-400)_45%,var(--color-gold-500)] text-ink-950 font-extrabold btn-shine shadow-[0_16px_38px_-16px_var(--color-gold-500),inset_0_1px_0_rgb(255_255_255/0.45)] hover:-translate-y-0.5 active:translate-y-0 active:brightness-95",
  secondary:
    "bg-bg-card text-fg border border-border-strong font-bold hover:border-gold-400/60 hover:bg-ink-800",
  outline:
    "glass text-fg font-bold hover:bg-gold-400/10 hover:border-gold-400/70 hover:-translate-y-0.5",
  ghost: "text-fg-muted font-semibold hover:text-fg hover:bg-gold-400/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

const base =
  "inline-flex items-center justify-center rounded-pill whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}
