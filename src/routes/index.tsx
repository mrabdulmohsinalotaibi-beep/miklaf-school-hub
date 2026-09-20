import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { AppShell } from "@/components/miklaf/AppShell";
import { Bar, Chip, Panel } from "@/components/miklaf/primitives";
import {
  activities,
  attendanceTrend,
  calendarEvents,
  classes,
  counselingCases,
  school,
  stats,
  toneClasses,
} from "@/lib/miklaf-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة المتابعة — مِكلاف" },
      {
        name: "description",
        content: "نظرة شاملة على الحضور والحالات الإرشادية وآخر الأنشطة في المدرسة.",
      },
      { property: "og:title", content: "لوحة المتابعة — مِكلاف" },
      {
        property: "og:description",
        content: "نظرة شاملة على الحضور والحالات الإرشادية وآخر الأنشطة في المدرسة.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const activeCases = counselingCases.filter((item) => item.status !== "مغلقة");

  return (
    <AppShell title="لوحة المتابعة">
      <div className="space-y-6">
        <div className="panel overflow-hidden bg-navy p-6 text-navy-foreground sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-[11px] font-bold tracking-[0.18em] text-gold">
                {school.term} · {school.year}
              </div>
              <h2 className="mt-2 font-display text-2xl font-black sm:text-3xl">
                صباح الخير، {school.name}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-navy-foreground/70">
                جميع مؤشرات المدرسة محدثة لحظيًا: الحضور، الحالات الإرشادية، الخطة التشغيلية،
                والتقارير.
              </p>
            </div>
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/15"
            >
              عرض التقارير <ArrowLeft size={15} />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="panel p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
                  <div className="mt-2 font-display text-3xl font-black">{stat.value}</div>
                </div>
                <Chip tone={stat.tone}>{stat.delta}</Chip>
              </div>
              <div className="mt-4 flex h-9 items-end gap-1">
                {stat.spark.map((point, index) => (
                  <span
                    key={index}
                    className={`flex-1 rounded-t ${toneClasses[stat.tone].bar} opacity-80`}
                    style={{ height: `${point}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">{stat.note}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <Panel title="نسبة الحضور خلال الأسبوع">
            <div className="h-[260px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 8, left: -20 }}>
                  <defs>
                    <linearGradient id="attendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="حضور"
                    stroke="var(--color-chart-2)"
                    fill="url(#attendance)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="أقرب أحداث التقويم">
            <div className="space-y-3">
              {calendarEvents.slice(0, 5).map((event) => (
                <div key={event.title} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted">
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-black ${toneClasses[event.tone].bg} ${toneClasses[event.tone].text}`}
                  >
                    {event.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{event.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays size={11} /> {event.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel
            title="الحالات الإرشادية النشطة"
            action={
              <Link to="/counseling" className="text-xs font-bold text-primary">
                عرض الكل
              </Link>
            }
          >
            <div className="space-y-3">
              {activeCases.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold">{item.student}</div>
                    <Chip
                      tone={
                        item.priority === "عالية" ? "rose" : item.priority === "متوسطة" ? "gold" : "sea"
                      }
                    >
                      {item.priority}
                    </Chip>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {item.type} · {item.counselor} · {item.sessions} جلسات
                  </div>
                  <div className="mt-3">
                    <Bar value={item.progress} tone="rose" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-5">
            <Panel title="آخر الأنشطة">
              <div className="space-y-3">
                {activities.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${toneClasses[item.tone].bar}`}
                    />
                    <div>
                      <div className="text-sm font-medium leading-6">{item.title}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock size={11} /> {item.who} · {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="حضور الفصول اليوم">
              <div className="grid gap-3 sm:grid-cols-2">
                {classes.map((item) => (
                  <div key={item.name} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>فصل {item.name}</span>
                      <span className="text-muted-foreground">{item.attendance}%</span>
                    </div>
                    <div className="mt-2">
                      <Bar value={item.attendance} tone={item.attendance >= 93 ? "leaf" : "gold"} />
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {item.teacher} · {item.students} طالبًا
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
