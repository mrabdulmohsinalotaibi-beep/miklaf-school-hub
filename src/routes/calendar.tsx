import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/miklaf/AppShell";
import { Chip, Panel } from "@/components/miklaf/primitives";
import { calendarEvents, toneClasses } from "@/lib/miklaf-data";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم المدرسي — مِكلاف" },
      { name: "description", content: "أحداث المدرسة والاختبارات والمحطات الأكاديمية في تقويم واحد." },
      { property: "og:title", content: "التقويم المدرسي — مِكلاف" },
      {
        property: "og:description",
        content: "أحداث المدرسة والاختبارات والمحطات الأكاديمية في تقويم واحد.",
      },
    ],
  }),
  component: CalendarPage,
});

const weekDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function CalendarPage() {
  const [selected, setSelected] = useState<number>(7);
  const daysInMonth = 30;
  const leading = 2;
  const dayEvents = calendarEvents.filter((event) => event.day === selected);

  return (
    <AppShell title="التقويم المدرسي">
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="مارس ٢٠٢٦"
          action={
            <div className="flex items-center gap-1">
              <button className="rounded-lg border border-border p-1.5 text-muted-foreground" aria-label="الشهر السابق">
                <ChevronRight size={15} />
              </button>
              <button className="rounded-lg border border-border p-1.5 text-muted-foreground" aria-label="الشهر التالي">
                <ChevronLeft size={15} />
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <div key={day} className="pb-2 text-[10px] font-bold text-muted-foreground">
                {day}
              </div>
            ))}
            {Array.from({ length: leading }).map((_, index) => (
              <div key={`pad-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const event = calendarEvents.find((item) => item.day === day);
              const isSelected = selected === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelected(day)}
                  className={`relative flex min-h-[52px] flex-col items-center justify-center rounded-xl text-sm font-bold transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {day}
                  {event && (
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : toneClasses[event.tone].bar}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title={`أحداث يوم ${selected} مارس`}>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد أحداث مجدولة في هذا اليوم.</p>
            ) : (
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div key={event.title} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold">{event.title}</div>
                      <Chip tone={event.tone}>{event.type}</Chip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="كل أحداث الشهر">
            <div className="space-y-2.5">
              {calendarEvents.map((event) => (
                <button
                  key={event.title}
                  onClick={() => setSelected(event.day)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-right transition hover:bg-muted"
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-black ${toneClasses[event.tone].bg} ${toneClasses[event.tone].text}`}
                  >
                    {event.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{event.title}</div>
                    <div className="text-[11px] text-muted-foreground">{event.type}</div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
