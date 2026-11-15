import * as React from "react";
import { Container, SectionLabel } from "@/components/ui/primitives";

/** Ichki sahifalarning yagona ko‘rinishdagi sarlavha bloki. */
export function PageHeader({
  yorliq,
  yorliqIkona,
  sarlavha,
  oltinQism,
  tavsif,
  children,
}: {
  yorliq?: string;
  yorliqIkona?: React.ReactNode;
  sarlavha: string;
  oltinQism?: string;
  tavsif?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pb-10 pt-10 sm:pt-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-30%] -z-10 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-gold-500/10 blur-[110px]"
      />
      <Container>
        {yorliq ? (
          <SectionLabel icon={yorliqIkona}>{yorliq}</SectionLabel>
        ) : null}

        <h1 className="mt-5 text-balance text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl">
          {sarlavha}
          {oltinQism ? (
            <>
              {" "}
              <span className="text-gold-gradient">{oltinQism}</span>
            </>
          ) : null}
        </h1>

        {tavsif ? (
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-fg-muted">
            {tavsif}
          </p>
        ) : null}

        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </section>
  );
}
