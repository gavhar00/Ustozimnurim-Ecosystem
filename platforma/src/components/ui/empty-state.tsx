import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bo‘sh holat — ma’lumot hali qo‘shilmaganda ko‘rsatiladi.
 * Soxta kontent o‘rniga rost xabar beradi.
 */
export function EmptyState({
  sarlavha,
  izoh,
  ikona,
  amal,
  className,
}: {
  sarlavha: string;
  izoh?: string;
  ikona?: React.ReactNode;
  amal?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
        {ikona ?? <Inbox className="size-7" aria-hidden="true" />}
      </span>
      <h2 className="mt-5 text-lg font-extrabold text-fg">{sarlavha}</h2>
      {izoh ? (
        <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed text-fg-muted">
          {izoh}
        </p>
      ) : null}
      {amal ? <div className="mt-6">{amal}</div> : null}
    </div>
  );
}
