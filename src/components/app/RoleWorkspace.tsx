import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

import {
  Panel,
  PageHeader,
  Chip,
  EmptyState,
  ErrorState,
  LoadingCards,
} from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { AppRole, TaskStatus } from "@/lib/labels";
import { formatDate, taskStatusLabels } from "@/lib/labels";

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
    accent: "سجل الموجه الطلابي المحلي",
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
      { label: "الجداول والتعاميم", to: "/operations", icon: CalendarCheck },
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
      { label: "الجداول والمساءلات", to: "/operations", icon: ClipboardCheck },
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
      { label: "التعهدات والمساءلات", to: "/operations", icon: ClipboardCheck },
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
  taskItems: {
    id: string;
    title: string;
    due_date: string | null;
    status: TaskStatus;
    workflow_status: string;
    topic: string;
  }[];
  nextAppointment: string | null;
};

const workflowStatusLabels: Record<string, string> = {
  assigned: "مسندة",
  in_progress: "قيد التنفيذ",
  submitted: "بانتظار الاعتماد",
  returned: "تحتاج استكمالًا",
  approved: "معتمدة",
};

const topicLabels: Record<string, string> = {
  academic: "الشؤون التعليمية",
  guidance: "الإرشاد الطلابي",
  "student-affairs": "شؤون الطلاب",
  operations: "الشؤون المدرسية",
};

export function RoleWorkspace({ kind }: { kind: WorkspaceKey }) {
  const config = configs[kind];
  const { user, profile, roles, loading: authLoading } = useAuth();
  const canAccess = roles.includes("administrator") || roles.includes(config.role);

  const snapshotQuery = useQuery({
    queryKey: ["role-workspace-snapshot", kind, user?.id],
    enabled: Boolean(user?.id) && !authLoading && canAccess,
    queryFn: async (): Promise<Snapshot> => {
      const today = new Date().toISOString().slice(0, 10);
      const [students, cases, attendance, tasks, appointments] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("counseling_cases").select("status, priority"),
        supabase.from("attendance").select("status").eq("date", today),
        supabase
          .from("plan_tasks")
          .select("id,title,due_date,status,workflow_status,topic", { count: "exact" })
          .eq("assigned_to", user!.id)
          .neq("workflow_status", "approved")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(6),
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
      if (firstError) throw new Error(firstError.message);

      const caseRows = cases.data ?? [];
      return {
        students: students.count ?? 0,
        openCases: caseRows.filter((item) => item.status !== "closed").length,
        urgentCases: caseRows.filter((item) => item.priority === "high" && item.status !== "closed")
          .length,
        todayAttendance: (attendance.data ?? []).filter((item) => item.status === "present").length,
        tasks: tasks.count ?? 0,
        taskItems: tasks.data ?? [],
        nextAppointment: appointments.data?.[0]?.starts_at ?? null,
      };
    },
  });
  const snapshot = snapshotQuery.data ?? null;
  const accessResolved = !authLoading && (!user?.id || roles.length > 0 || profile?.id === user.id);
  const loading =
    authLoading || (Boolean(user?.id) && !accessResolved) || (canAccess && snapshotQuery.isLoading);
  const error = snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null;

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
        label: "مهام مسندة إليك",
        value: snapshot?.tasks ?? 0,
        icon: ClipboardCheck,
        tone: "leaf" as const,
      },
    ],
    [snapshot],
  );

  if (!loading && accessResolved && !canAccess) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title={config.title}
          description={config.description}
          crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: config.title }]}
        />
        <Panel>
          <EmptyState
            icon={<ShieldCheck size={20} />}
            title="هذه المساحة غير متاحة لحسابك"
            description="يعرض النظام مساحة العمل بعد أن يحدد مدير المدرسة دورك الوظيفي."
            action={
              <Button asChild variant="outline">
                <Link to="/dashboard">العودة إلى لوحة المتابعة</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={config.title}
        description={config.description}
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: config.title }]}
        action={
          <Button variant="outline" onClick={() => void snapshotQuery.refetch()} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : undefined} /> تحديث البيانات
          </Button>
        }
      />

      <Panel className="mb-5 border-navy/15 bg-navy text-navy-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-bold text-gold">مصدر البيانات</div>
            <h2 className="font-display text-lg font-black">{config.accent}</h2>
            <p className="mt-1 text-xs text-navy-foreground/70">
              جميع المؤشرات في هذه المساحة تُقرأ من سجلات مكلاف المحلية فقط، مع حفظ البيانات داخل
              قاعدة المدرسة وصلاحياتها.
            </p>
          </div>
          <Chip tone="leaf">بيانات مكلاف المحلية</Chip>
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
            <Panel title="مسؤوليات الدور" description="مجالات المتابعة الأساسية لهذا الحساب">
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
                      <div className="mt-1 text-xs text-muted-foreground">
                        ضمن مسؤوليات {config.title.replace("مساحة ", "")}
                      </div>
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

          <Panel
            title="أعمالك المسندة إليك"
            description="المهام المفتوحة المخصصة لهذا الحساب، مرتبة حسب موعد الاستحقاق."
            className="mt-5"
          >
            {snapshot?.taskItems.length ? (
              <ul className="space-y-3">
                {snapshot.taskItems.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{task.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {topicLabels[task.topic] ?? task.topic}
                        {" · "}
                        {task.due_date ? `الاستحقاق: ${formatDate(task.due_date)}` : "دون موعد"}
                      </div>
                    </div>
                    <Chip
                      tone={
                        task.workflow_status === "returned"
                          ? "rose"
                          : task.workflow_status === "submitted"
                            ? "gold"
                            : "sea"
                      }
                    >
                      {workflowStatusLabels[task.workflow_status] ?? taskStatusLabels[task.status]}
                    </Chip>
                    <Link
                      to="/work-center"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      فتح المهمة <ArrowLeft size={13} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<ClipboardCheck size={20} />}
                title="لا توجد مهام مفتوحة مسندة إليك"
                description="ستظهر هنا الأعمال التي يحددك مدير المدرسة أو رئيسك المباشر مسؤولًا عنها."
                action={
                  <Button asChild variant="outline">
                    <Link to="/work-center">فتح مركز الأعمال</Link>
                  </Button>
                }
              />
            )}
          </Panel>

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
