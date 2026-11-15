import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sinflarini xavfsiz birlashtiradi. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sonni o‘zbekcha ko‘rinishda qisqartiradi: 1 250 → "1 250", 118 000 → "118K". */
export function formatSon(son: number): string {
  if (son >= 1_000_000) {
    return `${(son / 1_000_000).toFixed(son % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (son >= 10_000) {
    return `${Math.round(son / 1000)}K`;
  }
  return new Intl.NumberFormat("uz-UZ").format(son);
}
