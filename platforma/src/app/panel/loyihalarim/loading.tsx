import { Container } from "@/components/ui/primitives";

export default function LoyihalarimYuklanmoqda() {
  return (
    <Container className="py-8 sm:py-12" aria-busy="true">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-ink-700" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-ink-700" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-card border border-border-subtle bg-bg-card" />)}
      </div>
    </Container>
  );
}
