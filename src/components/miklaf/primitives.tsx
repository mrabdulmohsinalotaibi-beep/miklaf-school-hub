import type { ReactNode } from "react";
import { toneClasses, type Tone } from "@/lib/miklaf-data";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-base font-black">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chip({ tone = "sea", children }: { tone?: Tone; children: ReactNode }) {
  const t = toneClasses[tone];
  return (
    <span className={cn("rounded-lg px-2 py-1 text-[11px] font-bold", t.bg, t.text)}>
      {children}
    </span>
  );
}

export function Bar({ value, tone = "sea" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", toneClasses[tone].bar)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
