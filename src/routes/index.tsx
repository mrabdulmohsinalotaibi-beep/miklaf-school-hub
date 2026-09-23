import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  MessagesSquare,
  MoveLeft,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مِكلاف — منصة إدارة المدرسة والموجه الطلابي" },
      {
        name: "description",
        content:
          "منصة عربية متكاملة لإدارة الطلاب والحضور وحالات الموجه الطلابي والمواعيد والخطة التشغيلية والتقارير، بواجهة حديثة وصلاحيات آمنة.",
      },
      { property: "og:title", content: "مِكلاف — منصة إدارة المدرسة والموجه الطلابي" },
      {
        property: "og:description",
        content: "أدِر مدرستك من مكان واحد: الطلاب، الحضور، التوجيه، المواعيد، التقارير.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  { icon: LayoutDashboard, title: "لوحة متابعة ذكية", desc: "مؤشرات فورية للطلاب والحضور والحالات والمواعيد." },
  { icon: Users, title: "سجل طلاب متكامل", desc: "بحث وتصفية وملف شامل لكل طالب أكاديميًا وسلوكيًا." },
  { icon: ClipboardList, title: "رصد الحضور اليومي", desc: "تسجيل سريع لكل فصل وتقارير للغياب والتأخر." },
  { icon: HeartHandshake, title: "الموجه الطلابي", desc: "فتح الحالات وتتبع الجلسات والملاحظات ومواعيد المتابعة." },
  { icon: CalendarClock, title: "المواعيد والمقابلات", desc: "جدولة المقابلات مع أولياء الأمور بعرض تقويمي." },
  { icon: MessagesSquare, title: "إعلانات داخلية", desc: "تواصل منظم بين الإدارة والمعلمين والموجهين." },
  { icon: BarChart3, title: "تقارير قابلة للتصدير", desc: "تقارير مفلترة مع تصدير إلى إكسل ونسخة للطباعة." },
  { icon: ShieldCheck, title: "صلاحيات وأدوار", desc: "مدير، موجه طلابي، معلم — كل دور يرى ما يخصه." },
];

const steps = [
  { num: "١", title: "أنشئ حسابك", desc: "سجّل ببريدك الإلكتروني واختر دورك الوظيفي، ثم أكّد بريدك." },
  { num: "٢", title: "أدخل بيانات المدرسة", desc: "أضف الفصول والطلاب أو ابدأ من البيانات التجريبية الجاهزة." },
  { num: "٣", title: "أدِر يومك المدرسي", desc: "ارصد الحضور، تابع الحالات، جدول المواعيد، وأصدر التقارير." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-navy font-display text-lg font-black text-gold">
              م
            </div>
            <div>
              <div className="font-display text-lg font-black">مِكلاف</div>
              <div className="text-[10px] tracking-[0.18em] text-muted-foreground">
                منصة إدارة المدرسة
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild>
              <Link to="/register">ابدأ الآن</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="rise-in">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-gold">
              <ShieldCheck size={13} /> نظام مدرسي عربي آمن ومتكامل
            </div>
            <h1 className="font-display text-4xl font-black leading-[1.25] sm:text-5xl">
              أدِر مدرستك كاملةً من منصة واحدة
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-navy-foreground/75">
              مِكلاف تجمع سجل الطلاب، الحضور اليومي، الموجه الطلابي، المواعيد، الرسائل، الخطة
              التشغيلية والتقارير في واجهة عربية أنيقة، مع صلاحيات دقيقة لكل دور وظيفي.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  أنشئ حسابك المجاني <MoveLeft size={16} />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-navy-foreground hover:bg-white/10 hover:text-navy-foreground"
                asChild
              >
                <Link to="/login">لدي حساب</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-navy-foreground/60">
              <Lock size={13} /> بيانات محمية بسياسات وصول على مستوى كل سجل
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "سجل الطلاب", value: "متكامل" },
              { label: "رصد الحضور", value: "يومي" },
              { label: "حالات الموجه الطلابي", value: "متابعة" },
              { label: "التقارير", value: "قابلة للتصدير" },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-[22px] border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <div className="text-xs text-navy-foreground/60">{card.label}</div>
                <div className="mt-2 font-display text-2xl font-black text-gold">{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-black">كل ما تحتاجه المدرسة في مكان واحد</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            وحدات مترابطة تغطي العمل اليومي للإدارة والموجهين والمعلمين.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="panel p-5 transition-transform hover:-translate-y-1">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-sea-soft text-sea">
                <feature.icon size={20} />
              </div>
              <div className="font-display text-base font-black">{feature.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-black">كيف تبدأ؟</h2>
            <p className="mt-3 text-sm text-muted-foreground">ثلاث خطوات فقط لتشغيل المنصة في مدرستك.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="panel p-6">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-navy font-display text-lg font-black text-gold">
                  {step.num}
                </div>
                <div className="font-display text-lg font-black">{step.title}</div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="panel flex flex-col items-center gap-5 bg-navy p-12 text-center text-navy-foreground">
          <h2 className="font-display text-3xl font-black">جاهز لتنظيم عمل مدرستك؟</h2>
          <p className="max-w-xl text-sm leading-7 text-navy-foreground/75">
            ابدأ اليوم بإنشاء حساب مجاني، واستعرض المنصة ببيانات تجريبية جاهزة يمكن حذفها بضغطة واحدة.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">إنشاء حساب</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-navy-foreground hover:bg-white/10 hover:text-navy-foreground"
              asChild
            >
              <Link to="/login">تسجيل الدخول</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-navy font-display text-sm font-black text-gold">
              م
            </div>
            منصة مِكلاف — إدارة المدرسة والموجه الطلابي
          </div>
          <div className="flex gap-5">
            <Link to="/login" className="transition-colors hover:text-foreground">
              تسجيل الدخول
            </Link>
            <Link to="/register" className="transition-colors hover:text-foreground">
              إنشاء حساب
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
