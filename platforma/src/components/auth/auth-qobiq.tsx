import * as React from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Container } from "@/components/ui/primitives";

/** Auth sahifalarining umumiy ko‘rinishi. */
export function AuthQobiq({
  sarlavha,
  izoh,
  children,
  pastki,
}: {
  sarlavha: string;
  izoh: string;
  children: React.ReactNode;
  pastki?: React.ReactNode;
}) {
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md">
        <div className="surface-card p-8">
          <Link
            href="/"
            className="inline-flex"
            aria-label="UstozimNurim — bosh sahifa"
          >
            <LogoMark size={48} />
          </Link>

          <h1 className="mt-5 text-2xl font-black leading-tight">{sarlavha}</h1>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{izoh}</p>

          <div className="mt-7">{children}</div>
        </div>

        {pastki ? (
          <p className="mt-5 text-center text-sm text-fg-muted">{pastki}</p>
        ) : null}
      </div>
    </Container>
  );
}
