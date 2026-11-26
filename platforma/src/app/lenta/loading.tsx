import { Container } from "@/components/ui/primitives";

export default function LentaYuklanmoqda() {
  return (
    <Container className="max-w-6xl py-6 sm:py-8" aria-busy="true">
      <div className="mb-6 h-9 w-64 animate-pulse rounded-xl bg-ink-800" />
      <div className="space-y-5" role="status" aria-label="Lenta yuklanmoqda">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-full bg-ink-800" />
              <div className="h-4 w-40 animate-pulse rounded bg-ink-800" />
            </div>
            <div className="h-4 w-full animate-pulse rounded bg-ink-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-ink-800" />
          </div>
        ))}
      </div>
    </Container>
  );
}
