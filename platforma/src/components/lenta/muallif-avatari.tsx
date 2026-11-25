import Image from "next/image";
import { cn } from "@/lib/utils";

export function MuallifAvatari({
  ism,
  url,
  className,
}: {
  ism: string;
  url: string | null;
  className?: string;
}) {
  const bosh = ism.trim().charAt(0).toUpperCase() || "U";
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-400/15 text-sm font-black text-gold-300",
        className,
      )}
    >
      {url ? (
        <Image src={url} alt="" fill sizes="44px" className="object-cover" unoptimized />
      ) : (
        <span aria-hidden="true">{bosh}</span>
      )}
    </span>
  );
}
