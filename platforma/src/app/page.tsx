import { Hero } from "@/components/home/hero";
import { YonalishlarBolimi } from "@/components/home/yonalishlar-bolimi";
import { InteraktivPreview } from "@/components/home/interaktiv-preview";
import { StatistikaBolimi } from "@/components/home/statistika-bolimi";
import { YakuniyCta } from "@/components/home/yakuniy-cta";

export default function BoshSahifa() {
  return (
    <>
      <Hero />
      <YonalishlarBolimi />
      <InteraktivPreview />
      <StatistikaBolimi />
      <YakuniyCta />
    </>
  );
}
