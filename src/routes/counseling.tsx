import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, MapPin } from "lucide-react";
import { AppShell } from "@/components/miklaf/AppShell";
import { Bar, Chip, Panel } from "@/components/miklaf/primitives";
import { counselingCases, sessions } from "@/lib/miklaf-data";

export const Route = createFileRoute("/counseling")({
  head: () => ({
    meta: [
      { title: "الإرشاد الطلابي — مِكلاف" },
      {
        name: "description",
        content: "تتبّع الحالات السلوكية والأكاديمية وجلسات الإرشاد ومتابعتها خطوة بخطوة.",
      },
      { property: "og:title", content: "الإرشاد الطلابي — مِكلاف" },
      {
        property: "og:description",
        content: "تتبّع الحالات السلوكية والأكاديمية وجلسات الإرشاد ومتابعتها خطوة بخطوة.",
      },
    ],
  }),
  component: CounselingPage,
});

const filters = ["الكل", "جديدة", "قيد المتابعة", "مغلقة"];

function CounselingPage() {
  const [filter, setFilter] = useState("الكل");
  const list = counselingCases.filter((item) => filter === "الكل" || item.status === filter);

  const summary = [
    { label: "حالات نشطة", value: counselingCases.filter((c) => c.status !== "مغلقة").length, tone: "rose" as const },
    { label: "حالات مغلقة", value: counselingCases.filter((c) => c.status === "مغلقة").length, tone: "leaf" as const },
    { label: "جلسات هذا الأسبوع", value: 16, tone: "sea" as const },
    { label: "مقابلات أولياء الأمور", value: 5, tone: "gold" as const },
  ];

  return (
    <AppShell title="الإرشاد الطلابي">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label} className="panel p-5">
              <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-display text-3xl font-black">{item.value}</span>
                <Chip tone={item.tone}>هذا الفصل</Chip>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <Panel
            title="سجل الحالات"
            action={
              <div className="flex flex-wrap gap-1.5">
                {filters.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                      filter === item
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            }
          >
            <div className="space-y-3">
              {list.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold">{item.student}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.id} · فُتحت في {item.opened} · {item.sessions} جلسات
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Chip tone="sea">{item.type}</Chip>
                      <Chip
                        tone={
                          item.priority === "عالية" ? "rose" : item.priority === "متوسطة" ? "gold" : "sea"
                        }
                      >
                        {item.priority}
                      </Chip>
                      <Chip tone={item.status === "مغلقة" ? "leaf" : "gold"}>{item.status}</Chip>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Bar value={item.progress} tone={item.status === "مغلقة" ? "leaf" : "rose"} />
                    <span className="shrink-0 text-xs font-bold text-muted-foreground">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    الموجه المسؤول: {item.counselor}
                  </div>
                </div>
              ))}
              {list.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">لا توجد حالات في هذا التصنيف.</p>
              )}
            </div>
          </Panel>

          <div className="space-y-5">
            <Panel title="جلسات اليوم">
              <div className="space-y-3">
                {sessions.map((item) => (
                  <div key={item.time} className="flex gap-3 rounded-xl border border-border p-3">
                    <div className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-rose-soft font-display text-sm font-black text-rose">
                      {item.time}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{item.student}</div>
                      <div className="text-[11px] text-muted-foreground">{item.topic}</div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin size={11} /> {item.place}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="برامج إرشادية قادمة">
              <div className="space-y-3 text-sm">
                {[
                  { name: "ورشة إدارة وقت المذاكرة", when: "الأربعاء ١٠:٠٠" },
                  { name: "لقاء توعوي: الأمن السيبراني", when: "الخميس ٠٩:٣٠" },
                  { name: "برنامج الإرشاد المهني", when: "الأحد القادم" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-xl bg-muted p-3">
                    <CalendarClock size={15} className="shrink-0 text-primary" />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-[11px] text-muted-foreground">{item.when}</span>
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
