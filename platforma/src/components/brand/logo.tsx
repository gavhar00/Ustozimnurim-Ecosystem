import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * UstozimNurim belgisi — brendning rasmiy logotipi (`public/brend/logo.png`).
 * Rasm almashtirilmaydi; o‘lchamini `size` orqali boshqaring.
 */
export function LogoMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  // Rasm 153x160 — nisbatni saqlaymiz, aks holda Next.js ogohlantiradi.
  const balandlik = Math.round((size * 160) / 153);

  return (
    <Image
      src="/brend/logo.webp"
      alt=""
      width={size}
      height={balandlik}
      priority
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/** Belgi + "UstozimNurim" yozuvi. */
export function LogoFull({
  className,
  size = 34,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="text-[1.15rem] font-extrabold tracking-tight text-fg">
        Ustozim<span className="text-gold-400">Nurim</span>
      </span>
    </span>
  );
}
