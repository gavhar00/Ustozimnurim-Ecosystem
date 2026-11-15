import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export default function TopilmadiSahifasi() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-7xl font-black text-gold-gradient">404</p>
      <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
        Bunday sahifa topilmadi
      </h1>
      <p className="mt-3 max-w-md text-pretty leading-relaxed text-fg-muted">
        Havola eskirgan bo‘lishi yoki sahifa ko‘chirilgan bo‘lishi mumkin.
        Kurslar bo‘limidan davom eting.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Bosh sahifa</ButtonLink>
        <ButtonLink href="/kurslar" variant="outline">
          Kurslar
        </ButtonLink>
      </div>
    </Container>
  );
}
