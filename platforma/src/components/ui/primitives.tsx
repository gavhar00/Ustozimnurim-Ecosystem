import * as React from "react";
import { cn } from "@/lib/utils";

/** Sahifa kengligini bir xil ushlab turuvchi o‘ram. */
export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1240px] px-5 sm:px-8", className)}
      {...props}
    />
  );
}

/** Bo‘lim tepasidagi kichik oltin yorliq: ⭐ Mashhur yo‘nalishlar */
export function SectionLabel({
  children,
  icon,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "glass inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-bold text-champagne",
        className,
      )}
    >
      {icon ? <span className="text-gold-400">{icon}</span> : null}
      {children}
    </span>
  );
}

/** Yumaloq, oltin chegarali karta. */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "surface-card lift p-6",
        className,
      )}
      {...props}
    />
  );
}

/** Bo‘lim sarlavhasi — ikkinchi so‘z oltin gradientda. */
export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "text-balance text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
