import { YonMenyu } from "@/components/panel/yon-menyu";
import { Container } from "@/components/ui/primitives";
import { profilTalabQil, ROL_NOMI } from "@/lib/auth";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profil = await profilTalabQil("/panel");

  return (
    <Container className="py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-card p-4">
            <span
              aria-hidden="true"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-lg font-black text-gold-300"
            >
              {profil.toliq_ism.trim().charAt(0).toUpperCase() || "U"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-fg">
                {profil.toliq_ism}
              </p>
              <p className="text-xs text-fg-muted">{ROL_NOMI[profil.rol]}</p>
            </div>
          </div>

          <YonMenyu />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
