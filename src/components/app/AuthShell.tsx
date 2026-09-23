import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-navy p-10 text-navy-foreground lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link to="/" className="mb-10 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 font-display text-xl font-black text-gold">
                م
              </div>
              <div>
                <div className="font-display text-2xl font-black">مِكلاف</div>
                <div className="text-[10px] tracking-[0.22em] text-navy-foreground/60">
                  منصة إدارة المدرسة
                </div>
              </div>
            </Link>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-gold">
              <GraduationCap size={13} /> النظام المركزي للمدرسة
            </div>
            <h2 className="font-display text-3xl font-black leading-tight">
              إدارة تعليمية فعّالة، موثوقة، وتحليلات دقيقة.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-navy-foreground/70">
              تتبّع الطلاب، الحضور، حالات الموجه الطلابي، المواعيد، الرسائل، والتقارير من مكان واحد
              في بيئة آمنة ومنظمة.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-navy-foreground/80">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-leaf-soft" /> صلاحيات دقيقة لكل دور وظيفي
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-leaf-soft" /> تقارير قابلة للتصدير والطباعة
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-9">
          <div className="mb-7">
            <div className="text-sm font-medium text-muted-foreground">{subtitle}</div>
            <h1 className="font-display text-2xl font-black text-foreground">{title}</h1>
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
