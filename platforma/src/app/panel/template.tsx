import { SahifaOtishi } from "@/components/ui/harakat";

/** Panel ichida sahifa almashganda yengil paydo bo‘lish. */
export default function PanelShabloni({ children }: { children: React.ReactNode }) {
  return <SahifaOtishi>{children}</SahifaOtishi>;
}
