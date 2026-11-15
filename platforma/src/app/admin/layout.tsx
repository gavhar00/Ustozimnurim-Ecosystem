import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminYonMenyu } from "@/components/admin/yon-menyu";
import { Container } from "@/components/ui/primitives";
import { rolTalabQil } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Faqat administrator. Boshqalar o‘quvchi paneliga qaytariladi.
  const profil = await rolTalabQil(["admin"], "/admin");

  return (
    <Container className="py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-5 rounded-2xl border border-border-strong bg-gold-400/8 p-4">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gold-300">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Boshqaruv
            </p>
            <p className="mt-2 truncate text-sm font-bold text-fg">
              {profil.toliq_ism}
            </p>
            <Link
              href="/panel"
              className="mt-1 inline-block text-xs text-fg-muted hover:text-gold-300"
            >
              O‘quvchi paneliga o‘tish →
            </Link>
          </div>

          <AdminYonMenyu />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
