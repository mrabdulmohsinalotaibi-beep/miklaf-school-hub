import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/miklaf/AppShell";
import { Bar, Chip, Panel } from "@/components/miklaf/primitives";
import { planGoals } from "@/lib/miklaf-data";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "الخطة التشغيلية — مِكلاف" },
      { name: "description", content: "أهداف المدرسة والمهام المسندة ونسب الإنجاز." },
      { property: "og:title", content: "الخطة التشغيلية — مِكلاف" },
      { property: "og:description", content: "أهداف المدرسة والمهام المسندة ونسب الإنجاز." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  return (
    <AppShell title="الخطة التشغيلية">
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {planGoals.map((goal) => (
          <Panel key={goal.title} title={goal.title}>
            <div className="text-[11px] text-muted-foreground">
              المسؤول: {goal.owner} · الاستحقاق: {goal.due}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Bar value={goal.progress} tone={goal.progress >= 70 ? "leaf" : "gold"} />
              <span className="shrink-0 text-xs font-bold">{goal.progress}%</span>
            </div>
            <div className="mt-5 space-y-2.5">
              {goal.tasks.map((task) => (
                <div
                  key={task.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                >
                  <span className="flex-1">{task.name}</span>
                  <Chip
                    tone={
                      task.status === "مكتملة" ? "leaf" : task.status === "قيد التنفيذ" ? "gold" : "sea"
                    }
                  >
                    {task.status}
                  </Chip>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
