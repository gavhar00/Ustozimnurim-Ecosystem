import { Container } from "@/components/ui/primitives";

export default function ProfilToldirishYuklanmoqda() {
  return (
    <Container className="max-w-5xl py-8 sm:py-12" aria-busy="true">
      <div className="h-36 animate-pulse rounded-card border border-border-subtle bg-bg-card" />
      <div className="mt-6 h-[28rem] animate-pulse rounded-card border border-border-subtle bg-bg-card" />
    </Container>
  );
}
