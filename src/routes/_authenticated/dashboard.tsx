import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Building2,
  ClipboardList,
  FileBarChart,
  GitBranch,
  Inbox,
  LayoutGrid,
  Plus,
  Send,
  Users,
} from "lucide-react";

import { Bar, Chip, EmptyState, LoadingCards, Panel, PageHeader } from "@/components/app/ui-kit";
import { api, qk } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDate, isoDate, taskStatusLabels } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة قيادة المدرسة — مِكلاف" },
      { name: "description", content: "لوحة تشغيل المدرسة والمهام والوارد والتقارير." },
    ],
  }),
  component: DashboardPage,
});

const modules = [
  {
    to: "/school",
    label: "مساحة المدرسة",
    hint: "الأعضاء والهيكل والصلاحيات",
    icon: Building2,
    tone: "sea" as const,
  },
  {
    to: "/operations",
    label: "مركز الأعمال",
    hint: "الجداول والمساءلات والتعهدات",
    icon: ClipboardList,
    tone: "gold" as const,
  },
  {
    to: "/plan",
    label: "إسناد الأعمال",
    hint: "المهام والمتابعة والشواهد",
    icon: LayoutGrid,
    tone: "rose" as const,
  },
  {
    to: "/reports",
    label: "تقارير المدرسة",
    hint: "تجميع وتصدير المؤشرات",
    icon: FileBarChart,
    tone: "leaf" as const,
  },
];

function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const students = useQuery({ queryKey: qk.students, queryFn: api.students });
  const tasks = useQuery({
    queryKey: [...qk.tasks, user?.id],
    enabled: Boolean(user?.id),
    queryFn: api.tasks,
  });
  const cases = useQuery({ queryKey: qk.cases, queryFn: api.cases });
  const members = useQuery({
    queryKey: ["dashboard-members"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("school_members")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
  const notifications = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
  const loading = students.isLoading || tasks.isLoading || cases.isLoading;
  const taskRows = tasks.data ?? [];
  const personalTasks = taskRows
    .filter((task) => task.assigned_to === user?.id && task.workflow_status !== "approved")
    .slice(0, 5);
  const completed = taskRows.filter((task) => task.status === "done").length;
  const active = taskRows.filter((task) => task.status === "in_progress").length;
  const overdue = taskRows.filter(
    (task) => task.due_date && task.due_date < isoDate() && task.status !== "done",
  ).length;
  const completionRate = taskRows.length ? Math.round((completed / taskRows.length) * 100) : 0;
  const openCases = (cases.data ?? []).filter((item) => item.status !== "closed");
  const summaryCards = [
    { label: "الموظفون", value: members.data ?? 0, icon: Users, tone: "sea" as const },
    { label: "كل المهام", value: taskRows.length, icon: LayoutGrid, tone: "gold" as const },
    { label: "مكتملة", value: completed, icon: ClipboardList, tone: "leaf" as const },
    {
      label: "نسبة الإنجاز",
      value: `${completionRate}%`,
      icon: FileBarChart,
      tone: "rose" as const,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="لوحة قيادة المدرسة"
        description="صورة تشغيلية واحدة للمدرسة: الأعمال، الفريق، الوارد، التقارير، والتنبيهات."
        crumbs={[{ label: "الرئيسية" }, { label: "لوحة القيادة" }]}
        action={
          <Link
            to="/school"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus size={16} /> إعداد مساحة المدرسة
          </Link>
        }
      />
      {loading ? (
        <LoadingCards count={4} />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="panel p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{label}</div>
                  <Chip tone={tone}>
                    <Icon size={14} />
                  </Chip>
                </div>
                <div className="mt-3 font-display text-3xl font-black">{value}</div>
              </div>
            ))}
          </div>
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Panel title="يحتاج تدخلك" description="أعمال تتطلب قرارًا أو متابعة من المدير">
              <div className="space-y-3">
                {[
                  [
                    `${overdue} مهام متأخرة`,
                    "راجع المهام التي تجاوزت تاريخ الاستحقاق.",
                    overdue > 0,
                  ],
                  [`${active} مهام قيد التنفيذ`, "تابع الأعمال النشطة مع الفريق.", active > 0],
                  [
                    `${openCases.length} حالات إرشادية مفتوحة`,
                    "اطلع على الحالات التي تحتاج متابعة.",
                    openCases.length > 0,
                  ],
                ].map(([title, description, visible]) => (
                  <div
                    key={String(title)}
                    className="flex items-center gap-3 rounded-xl border border-border p-4"
                  >
                    <span
                      className={`h-3 w-3 rounded-full ${visible ? "bg-rose" : "bg-muted-foreground/30"}`}
                    />
                    <div>
                      <div className="font-bold">{title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
                    </div>
                    <ArrowLeft size={15} className="mr-auto text-muted-foreground" />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="مؤشرات سريعة">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Inbox size={15} /> الوارد غير المقروء
                  </span>
                  <strong>{notifications.data ?? 0}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Send size={15} /> الصادر
                  </span>
                  <strong>—</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Bell size={15} /> تنبيهات اليوم
                  </span>
                  <strong>{overdue}</strong>
                </div>
              </div>
            </Panel>
          </div>
          <Panel title="تطبيقات المدرسة" description="كل صفحات مكلاف تعمل داخل مساحة المدرسة نفسها">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {modules.map((module) => (
                <Link
                  key={module.to}
                  to={module.to}
                  className="group rounded-2xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <Chip tone={module.tone}>
                      <module.icon size={14} />
                    </Chip>
                    <ArrowLeft
                      size={15}
                      className="text-muted-foreground transition group-hover:-translate-x-1"
                    />
                  </div>
                  <div className="mt-4 font-bold">{module.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{module.hint}</div>
                </Link>
              ))}
            </div>
          </Panel>
          <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <Panel
                title={isAdmin ? "أعمالك كمدير المدرسة" : "أعمالك المسندة"}
                description="قائمة شخصية للأعمال المفتوحة المسندة إلى حسابك."
              >
                {personalTasks.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList size={20} />}
                    title="لا توجد أعمال مفتوحة مسندة إليك"
                    description="عند إسناد عمل إلى حسابك سيظهر هنا مع موعده وحالته."
                    action={
                      <Link
                        to="/work-center"
                        className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
                      >
                        فتح مركز الأعمال
                      </Link>
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {personalTasks.map((task) => (
                      <li key={task.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-bold">{task.title}</div>
                          <Chip
                            tone={
                              task.status === "done"
                                ? "leaf"
                                : task.status === "in_progress"
                                  ? "gold"
                                  : "muted"
                            }
                          >
                            {taskStatusLabels[task.status]}
                          </Chip>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {task.due_date
                            ? `الاستحقاق: ${formatDate(task.due_date)}`
                            : "بدون تاريخ استحقاق"}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/work-center"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  عرض جميع مهامي <ArrowLeft size={13} />
                </Link>
              </Panel>
              <Panel title="أحدث الطلاب" description="البيانات الأساسية داخل مساحة المدرسة">
                <ul className="space-y-3">
                  {(students.data ?? []).length === 0 ? (
                    <EmptyState
                      title="لا يوجد طلاب بعد"
                      description="استورد الطلاب من ملف Excel."
                    />
                  ) : (
                    (students.data ?? []).slice(0, 5).map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between rounded-xl border border-border p-3"
                      >
                        <div>
                          <div className="font-bold">{student.full_name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {student.student_no} · {student.grade}
                          </div>
                        </div>
                        <Chip tone="muted">{student.status}</Chip>
                      </li>
                    ))
                  )}
                </ul>
              </Panel>
            </div>
            <Panel title="أحدث الأعمال في المدرسة" description="تتبع التنفيذ والإسناد">
              <ul className="space-y-3">
                {taskRows.length === 0 ? (
                  <EmptyState
                    title="لا توجد مهام بعد"
                    description="ابدأ بإنشاء مهمة من الخطة التشغيلية."
                  />
                ) : (
                  taskRows.slice(0, 5).map((task) => (
                    <li key={task.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{task.title}</span>
                        <Chip
                          tone={
                            task.status === "done"
                              ? "leaf"
                              : task.status === "in_progress"
                                ? "gold"
                                : "muted"
                          }
                        >
                          {taskStatusLabels[task.status]}
                        </Chip>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {task.due_date
                          ? `الاستحقاق: ${formatDate(task.due_date)}`
                          : "بدون تاريخ استحقاق"}
                      </div>
                      <Bar
                        value={
                          task.status === "done" ? 100 : task.status === "in_progress" ? 55 : 15
                        }
                        tone="sea"
                      />
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
