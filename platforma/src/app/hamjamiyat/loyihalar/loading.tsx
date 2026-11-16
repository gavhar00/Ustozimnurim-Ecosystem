import { Container } from "@/components/ui/primitives";

export default function OmmaviyLoyihalarYuklanmoqda() {
  return (
    <Container className="py-8 sm:py-12" aria-busy="true">
      <div className="h-12 w-72 max-w-full animate-pulse rounded-lg bg-ink-700" />
      <div className="mt-8 h-20 animate-pulse rounded-card border border-border-subtle bg-bg-card" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-card border border-border-subtle bg-bg-card" />)}
      </div>
    </Container>
  );
}
