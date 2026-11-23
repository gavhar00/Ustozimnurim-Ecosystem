import {
  Code2,
  Compass,
  Database,
  LineChart,
  Palette,
  Server,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

/** Admin yo‘nalish uchun tanlaydigan ikonalar. Kalit bazada saqlanadi. */
export const YONALISH_IKONALARI: Record<string, { nom: string; Ikona: LucideIcon }> = {
  code: { nom: "Kod", Ikona: Code2 },
  database: { nom: "Ma’lumotlar bazasi", Ikona: Database },
  chart: { nom: "Grafik", Ikona: LineChart },
  palette: { nom: "Dizayn", Ikona: Palette },
  smartphone: { nom: "Telefon", Ikona: Smartphone },
  shield: { nom: "Xavfsizlik", Ikona: ShieldCheck },
  server: { nom: "Server", Ikona: Server },
};

/** Yo‘nalish ikonasi — kalit bo‘yicha. Noma’lum kalitda umumiy kompas ikonasi. */
export function YonalishIkona({
  kalit,
  className,
}: {
  kalit?: string | null;
  className?: string;
}) {
  const Ikona = (kalit ? YONALISH_IKONALARI[kalit]?.Ikona : undefined) ?? Compass;
  return <Ikona className={className} aria-hidden="true" />;
}
