import { createFileRoute } from "@tanstack/react-router";
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/miklaf/AppShell";
import { Panel } from "@/components/miklaf/primitives";
import { Button } from "@/components/ui/button";
import { gradeDistribution, reportCards, subjectPerformance } from "@/lib/miklaf-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — مِكلاف" },
      { name: "description", content: "تحليلات أكاديمية وإرشادية قابلة للتصدير." },
      { property: "og:title", content: "التقارير — مِكلاف" },
      { property: "og:description", content: "تحليلات أكاديمية وإرشادية قابلة للتصدير." },
    ],
  }),
  component: ReportsPage,
});

function exportCsv(title: string) {
  const rows = subjectPerformance.map((item) => `${item.subject},${item.معدل}`).join("\n");
  const blob = new Blob([`\uFEFFالمادة,المعدل\n${rows}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("تم تصدير التقرير");
}

function ReportsPage() {
  return (
    <AppShell title="التقارير">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportCards.map((report) => (
            <div key={report.title} className="panel flex flex-col p-5">
              <FileText size={20} className="text-primary" />
              <div className="mt-3 font-display text-base font-black">{report.title}</div>
              <p className="mt-1 flex-1 text-[11px] leading-6 text-muted-foreground">{report.desc}</p>
              <div className="mt-3 text-[11px] text-muted-foreground">
                {report.rows} سجل · تحديث {report.updated}
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => exportCsv(report.title)}
              >
                <Download size={15} /> تصدير CSV
              </Button>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="متوسط الأداء حسب المادة">
            <div className="h-[280px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} margin={{ top: 10, right: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <RBar dataKey="معدل" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="توزيع الطلاب والمعدلات حسب الصف">
            <div className="h-[280px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution} margin={{ top: 10, right: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <RBar dataKey="طلاب" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
                  <RBar dataKey="معدل" fill="var(--color-chart-3)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
