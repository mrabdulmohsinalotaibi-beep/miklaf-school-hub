import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Panel, PageHeader, Bar, Chip, ErrorState, LoadingCards } from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { AppRole } from "@/lib/labels";
import { formatDate } from "@/lib/labels";

export type WorkspaceKey =
  "counselor" | "teacher" | "educational_deputy" | "school_deputy" | "student_affairs_deputy";

type WorkspaceConfig = {
  role: AppRole;
  title: string;
  description: string;
  accent: string;
  priorities: string[];
  links: { label: string; to: string; icon: typeof Users }[];
};

const configs: Record<WorkspaceKey, WorkspaceConfig> = {
  counselor: {
    role: "counselor",
    title: "مساحة الموجه الطلابي",
    description: "لوحة متابعة يومية للحالات الإرشادية، المقابلات، التقارير وبرامج الوقاية.",
    accent: "منصة الذات — جاهزة للربط بعد تزويد API الرسمي",
    priorities: [
      "الحالات ذات الأولوية العالية",
      "جلسات المتابعة القادمة",
      "الغياب المتكرر والإنذارات",
      "التقارير الإرشادية الشهرية",
    ],
    links: [
      { label: "الحالات الإرشادية", to: "/counseling", icon: HeartHandshake },
      { label: "المواعيد والمقابلات", to: "/appointments", icon: CalendarCheck },
      { label: "التقارير الكاملة", to: "/reports", icon: FileBarChart },
    ],
  },
  teacher: {
    role: "teacher",
    title: "مساحة المعلم",
    description: "سجل متابعة الفصل، الحضور، الملاحظات الأكاديمية والسلوكية وإحالات الطلاب.",
    accent: "سجل متابعة الفصل الدراسي",
    priorities: [
      "الطلاب المحتاجون للمتابعة",
      "الحضور اليومي",
      "الملاحظات السلوكية",
      "الإحالات للموجه الطلابي",
    ],
    links: [
      { label: "سجل الطلاب", to: "/students", icon: Users },
      { label: "الحضور والغياب", to: "/attendance", icon: ClipboardCheck },
      { label: "إحالة للموجه", to: "/counseling", icon: HeartHandshake },
    ],
  },
  educational_deputy: {
    role: "educational_deputy",
    title: "مساحة وكيل الشؤون التعليمية",
    description: "متابعة التحصيل، الخطط العلاجية، أداء المعلمين والاختبارات والنتائج.",
    accent: "مؤشرات الأداء الأكاديمي",
    priorities: [
      "متوسطات الطلاب والمواد",
      "الطلاب المتعثرون",
      "خطط التحسين الأكاديمي",
      "تقارير الاختبارات",
    ],
    links: [
      { label: "التقارير الأكاديمية", to: "/reports", icon: FileBarChart },
      { label: "الخطة التشغيلية", to: "/plan", icon: BookOpenCheck },
      { label: "سجل الطلاب", to: "/students", icon: Users },
    ],
  },
  school_deputy: {
    role: "school_deputy",
    title: "مساحة وكيل الشؤون المدرسية",
    description: "التشغيل اليومي للمدرسة، الحضور والانضباط، المرافق والبلاغات والإعلانات.",
    accent: "التشغيل والانضباط المدرسي",
    priorities: [
      "نسبة الحضور والانصراف",
      "المهام التشغيلية",
      "الإعلانات المدرسية",
      "البلاغات المفتوحة",
    ],
    links: [
      { label: "الحضور والغياب", to: "/attendance", icon: ClipboardCheck },
      { label: "الخطة التشغيلية", to: "/plan", icon: BookOpenCheck },
      { label: "الرسائل والإعلانات", to: "/messages", icon: Activity },
    ],
  },
  student_affairs_deputy: {
    role: "student_affairs_deputy",
    title: "مساحة وكيل شؤون الطلاب",
    description: "إدارة رعاية الطلاب، السلوك، الغياب، التواصل مع الأسرة والبرامج الطلابية.",
    accent: "رعاية الطالب والانضباط",
    priorities: [
      "الحالات السلوكية",
      "الغياب المتكرر",
      "التواصل مع أولياء الأمور",
      "البرامج الوقائية",
    ],
    links: [
      { label: "الموجه الطلابي", to: "/counseling", icon: HeartHandshake },
      { label: "الحضور والغياب", to: "/attendance", icon: ClipboardCheck },
      { label: "المواعيد والمقابلات", to: "/appointments", icon: CalendarCheck },
    ],
  },
};

type Snapshot = {
  students: number;
  openCases: number;
  urgentCases: number;
  todayAttendance: number;
  tasks: number;
  nextAppointment: string | null;
};

export function RoleWorkspace({ kind }: { kind: WorkspaceKey }) {
  const config = configs[kind];
  const { roles } = useAuth();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canAccess = roles.includes("administrator") || roles.includes(config.role);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const [students, cases, attendance, tasks, appointments] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("counseling_cases").select("status, priority"),
      supabase.from("attendance").select("status").eq("date", today),
      supabase
        .from("plan_tasks")
        .select("id", { count: "exact", head: true })
        .neq("status", "done"),
      supabase
        .from("appointments")
        .select("starts_at")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(1),
    ]);
    const firstError = [students, cases, attendance, tasks, appointments].find(
      (item) => item.error,
    )?.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }
    const caseRows = cases.data ?? [];
    setSnapshot({
      students: students.count ?? 0,
      openCases: caseRows.filter((item) => item.status !== "closed").length,
      urgentCases: caseRows.filter((item) => item.priority === "high" && item.status !== "closed")
        .length,
      todayAttendance: (attendance.data ?? []).filter((item) => item.status === "present").length,
      tasks: tasks.count ?? 0,
      nextAppointment: appointments.data?.[0]?.starts_at ?? null,
    });
    setLoading(false);
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const stats = useMemo(
    () => [
      { label: "إجمالي الطلاب", value: snapshot?.students ?? 0, icon: Users, tone: "sea" as const },
      {
        label: "الحالات المفتوحة",
        value: snapshot?.openCases ?? 0,
        icon: HeartHandshake,
        tone: "rose" as const,
      },
      {
        label: "أولوية عالية",
        value: snapshot?.urgentCases ?? 0,
        icon: ShieldCheck,
        tone: "gold" as const,
      },
      {
        label: "مهام غير مكتملة",
        value: snapshot?.tasks ?? 0,
        icon: ClipboardCheck,
        tone: "leaf" as const,
      },
    ],
    [snapshot],
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={config.title}
        description={config.description}
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: config.title }]}
        action={
          <Button variant="outline" onClick={() => void loadSnapshot()} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : undefined} /> تحديث البيانات
          </Button>
        }
      />

      {!canAccess && (
        <div className="mb-5 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-accent-foreground">
          هذه المساحة مخصصة لدور {config.title.replace("مساحة ", "")}. يمكنك مشاهدة البيانات
          المشتركة فقط إلى أن يعيّن لك المدير هذا الدور.
        </div>
      )}

      <Panel className="mb-5 border-navy/15 bg-navy text-navy-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-bold text-gold">تكامل البيانات</div>
            <h2 className="font-display text-lg font-black">{config.accent}</h2>
            <p className="mt-1 text-xs text-navy-foreground/70">
              يتم عرض البيانات الحالية من مكلاف. المزامنة الثنائية مع منصة الذات تحتاج رابط API أو
              موصل رسمي من المنصة.
            </p>
          </div>
          <Chip tone="gold">مزامنة داخلية فعالة</Chip>
        </div>
      </Panel>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <LoadingCards count={4} />
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Panel key={stat.label} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <Icon size={19} />
                    </div>
                    <span className="text-2xl font-black">{stat.value}</span>
                  </div>
                  <div className="mt-3 text-xs font-bold text-muted-foreground">{stat.label}</div>
                </Panel>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title="أولويات العمل اليوم" description="قائمة مختصرة قابلة للتنفيذ حسب الدور">
              <div className="space-y-4">
                {config.priorities.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-sm font-black">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{item}</div>
                      <Bar
                        value={Math.max(20, 100 - index * 18)}
                        tone={index === 0 ? "rose" : "sea"}
                      />
                    </div>
                    <ArrowLeft size={15} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="مؤشرات سريعة" description="قراءة مباشرة من سجلات المدرسة">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">حضور اليوم</span>
                  <strong>{snapshot?.todayAttendance ?? 0} طالب</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">المقابلة القادمة</span>
                  <strong>{formatDate(snapshot?.nextAppointment)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">آخر تحديث</span>
                  <strong>{formatDate(new Date().toISOString())}</strong>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="اختصارات الدور" className="mt-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {config.links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm font-bold transition-colors hover:bg-muted"
                  >
                    <Icon size={18} className="text-primary" />
                    {link.label}
                    <ArrowLeft size={15} className="mr-auto text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
