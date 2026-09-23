import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, ClipboardCheck, HeartHandshake, Megaphone, TrendingUp, Users } from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Bar, Chip, EmptyState, LoadingCards, Panel, PageHeader } from "@/components/app/ui-kit";
import { api, qk } from "@/lib/data";
import {
  caseStatusLabels,
  casePriorityLabels,
  formatDate,
  formatDateTime,
  isoDate,
} from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة المتابعة — مِكلاف" },
      { name: "description", content: "مؤشرات المدرسة اليومية: الطلاب، الحضور، الحالات والمواعيد." },
      { property: "og:title", content: "لوحة المتابعة — مِكلاف" },
      { property: "og:description", content: "نظرة شاملة على أداء المدرسة اليومي." },
    ],
  }),
  component: DashboardPage,
});

const quickActions = [
  { to: "/attendance", label: "رصد الحضور", hint: "تسجيل حضور اليوم", icon: ClipboardCheck, tone: "sea" as const },
  { to: "/counseling", label: "حالة إرشادية", hint: "فتح حالة جديدة", icon: HeartHandshake, tone: "rose" as const },
  { to: "/appointments", label: "حجز موعد", hint: "مقابلة أو لقاء", icon: CalendarClock, tone: "gold" as const },
  { to: "/messages", label: "تعميم جديد", hint: "إعلان للمنسوبين", icon: Megaphone, tone: "leaf" as const },
];

function DashboardPage() {

  const from = isoDate(new Date(Date.now() - 13 * 86400000));
  const students = useQuery({ queryKey: qk.students, queryFn: api.students });
  const attendance = useQuery({ queryKey: ["attendance", "range", from], queryFn: () => api.attendanceRange(from) });
  const cases = useQuery({ queryKey: qk.cases, queryFn: api.cases });
  const appointments = useQuery({ queryKey: qk.appointments, queryFn: api.appointments });

  const loading = students.isLoading || attendance.isLoading || cases.isLoading;

  const rows = attendance.data ?? [];
  const byDate = new Map<string, { present: number; total: number }>();
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (row.status === "present") entry.present += 1;
    byDate.set(row.date, entry);
  }
  const chart = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-10)
    .map(([date, value]) => ({
      day: formatDate(date),
      حضور: value.total ? Math.round((value.present / value.total) * 100) : 0,
    }));

  const todayRows = rows.filter((row) => row.date === isoDate());
  const todayRate = todayRows.length
    ? Math.round((todayRows.filter((row) => row.status === "present").length / todayRows.length) * 100)
    : chart.length
      ? (chart[chart.length - 1]?.حضور ?? 0)
      : 0;

  const openCases = (cases.data ?? []).filter((item) => item.status !== "closed");
  const upcoming = (appointments.data ?? []).filter((item) => new Date(item.starts_at) >= new Date());

  const kpis = [
    { label: "إجمالي الطلاب", value: String(students.data?.length ?? 0), icon: Users, tone: "sea" as const },
    { label: "نسبة الحضور", value: `${todayRate}%`, icon: TrendingUp, tone: "leaf" as const },
    { label: "حالات إرشادية مفتوحة", value: String(openCases.length), icon: HeartHandshake, tone: "rose" as const },
    { label: "مواعيد قادمة", value: String(upcoming.length), icon: CalendarClock, tone: "gold" as const },
  ];

  return (
    <>
      <PageHeader
        title="لوحة المتابعة"
        description="نظرة سريعة على أهم مؤشرات المدرسة اليوم."
        crumbs={[{ label: "الرئيسية" }, { label: "لوحة المتابعة" }]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="panel group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Chip tone={action.tone}>
              <action.icon size={14} />
            </Chip>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{action.label}</div>
              <div className="truncate text-xs text-muted-foreground">{action.hint}</div>
            </div>
            <ArrowLeft size={16} className="ms-auto shrink-0 text-muted-foreground transition group-hover:-translate-x-1" />
          </Link>
        ))}
      </div>

      {loading ? (
        <LoadingCards />

      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="panel rise-in p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <Chip tone={kpi.tone}>
                  <kpi.icon size={13} />
                </Chip>
              </div>
              <div className="mt-3 font-display text-3xl font-black">{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Panel title="اتجاه الحضور" description="نسبة الحضور اليومية خلال آخر أسبوعين">
          {chart.length === 0 ? (
            <EmptyState title="لا توجد بيانات حضور بعد" description="ابدأ برصد الحضور من صفحة الحضور والغياب." />
          ) : (
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--sea)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--sea)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="حضور" stroke="var(--sea)" fill="url(#att)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="المواعيد القادمة">
          {upcoming.length === 0 ? (
            <EmptyState title="لا توجد مواعيد قادمة" />
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 5).map((item) => (
                <li key={item.id} className="rounded-2xl border border-border p-3">
                  <div className="text-sm font-bold">{item.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(item.starts_at)} · {item.location ?? "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="الحالات الإرشادية النشطة">
          {openCases.length === 0 ? (
            <EmptyState title="لا توجد حالات مفتوحة" />
          ) : (
            <ul className="space-y-4">
              {openCases.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{item.title}</span>
                    <div className="flex gap-1.5">
                      <Chip tone={item.priority === "high" ? "rose" : item.priority === "medium" ? "gold" : "muted"}>
                        {casePriorityLabels[item.priority]}
                      </Chip>
                      <Chip tone="sea">{caseStatusLabels[item.status]}</Chip>
                    </div>
                  </div>
                  <Bar value={item.progress} tone="rose" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="أحدث الطلاب المضافين">
          {(students.data ?? []).length === 0 ? (
            <EmptyState title="لا يوجد طلاب بعد" description="أضف الطلاب من صفحة سجل الطلاب." />
          ) : (
            <ul className="space-y-3">
              {(students.data ?? []).slice(0, 6).map((student) => (
                <li key={student.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                  <div>
                    <div className="text-sm font-bold">{student.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {student.student_no} · {student.grade}
                    </div>
                  </div>
                  <Chip tone="muted">{student.status}</Chip>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
