import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, LoadingCards, PageHeader, Panel } from "@/components/app/ui-kit";
import { api, qk } from "@/lib/data";
import { exportToExcel, printReport } from "@/lib/export";
import {
  attendanceLabels,
  caseStatusLabels,
  formatDate,
  isoDate,
  taskStatusLabels,
  type AttendanceStatus,
} from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — مِكلاف" },
      { name: "description", content: "تقارير الحضور وحالات الموجه الطلابي والخطة التشغيلية مع التصدير والطباعة." },
      { property: "og:title", content: "التقارير — مِكلاف" },
      { property: "og:description", content: "تقارير قابلة للتصفية والتصدير إلى Excel والطباعة." },
    ],
  }),
  component: ReportsPage,
});

type ReportKey = "attendance" | "students" | "cases" | "tasks";

const reportLabels: Record<ReportKey, string> = {
  attendance: "تقرير الحضور",
  students: "تقرير الطلاب",
  cases: "تقرير حالات الموجه الطلابي",
  tasks: "تقرير الخطة التشغيلية",
};

const pieColors = ["var(--leaf)", "var(--rose)", "var(--gold)", "var(--sea)"];

function ReportsPage() {
  const [report, setReport] = useState<ReportKey>("attendance");
  const [days, setDays] = useState("30");
  const [grade, setGrade] = useState("all");

  const from = isoDate(new Date(Date.now() - Number(days) * 86400000));
  const students = useQuery({ queryKey: qk.students, queryFn: api.students });
  const attendance = useQuery({
    queryKey: ["attendance", "range", from],
    queryFn: () => api.attendanceRange(from),
  });
  const cases = useQuery({ queryKey: qk.cases, queryFn: api.cases });
  const tasks = useQuery({ queryKey: qk.tasks, queryFn: api.tasks });

  const studentNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const student of students.data ?? []) map.set(student.id, student.full_name);
    return map;
  }, [students.data]);

  const loading =
    students.isLoading || attendance.isLoading || cases.isLoading || tasks.isLoading;

  const table = useMemo<{ headers: string[]; rows: (string | number)[][] }>(() => {
    if (report === "attendance") {
      return {
        headers: ["التاريخ", "الطالب", "الحالة"],
        rows: (attendance.data ?? []).map((row) => [
          formatDate(row.date),
          studentNames.get(row.student_id) ?? "—",
          attendanceLabels[row.status],
        ]),
      };
    }
    if (report === "students") {
      return {
        headers: ["الاسم", "الرقم", "الصف", "المعدل", "الحالة"],
        rows: (students.data ?? [])
          .filter((student) => grade === "all" || student.grade === grade)
          .map((student) => [
            student.full_name,
            student.student_no,
            student.grade,
            student.average,
            student.status,
          ]),
      };
    }
    if (report === "cases") {
      return {
        headers: ["الحالة", "الطالب", "التصنيف", "الوضع", "التقدم"],
        rows: (cases.data ?? []).map((item) => [
          item.title,
          item.student_id ? studentNames.get(item.student_id) ?? "—" : "—",
          item.category,
          caseStatusLabels[item.status],
          `${item.progress}%`,
        ]),
      };
    }
    return {
      headers: ["المهمة", "المسؤول", "الحالة", "الاستحقاق", "التقدم"],
      rows: (tasks.data ?? []).map((task) => [
        task.title,
        task.owner ?? "—",
        taskStatusLabels[task.status],
        formatDate(task.due_date),
        `${task.progress}%`,
      ]),
    };
  }, [report, attendance.data, students.data, cases.data, tasks.data, studentNames, grade]);

  const attendancePie = useMemo(() => {
    const counts = new Map<AttendanceStatus, number>();
    for (const row of attendance.data ?? [])
      counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    return [...counts.entries()].map(([status, value]) => ({
      name: attendanceLabels[status],
      value,
    }));
  }, [attendance.data]);

  const gradeBars = useMemo(() => {
    const counts = new Map<string, number>();
    for (const student of students.data ?? [])
      counts.set(student.grade, (counts.get(student.grade) ?? 0) + 1);
    return [...counts.entries()].map(([name, طلاب]) => ({ name, طلاب }));
  }, [students.data]);

  const grades = useMemo(
    () => [...new Set((students.data ?? []).map((student) => student.grade))],
    [students.data],
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="التقارير"
        description="اختر التقرير والفترة الزمنية، ثم صدّره إلى Excel أو اطبعه."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "التقارير" }]}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => exportToExcel(reportLabels[report], table.headers, table.rows)}
            >
              <Download size={16} /> تصدير Excel
            </Button>
            <Button onClick={() => printReport(reportLabels[report], table.headers, table.rows)}>
              <Printer size={16} /> طباعة
            </Button>
          </div>
        }
      />

      <Panel className="mb-5">
        <div className="flex flex-wrap gap-3">
          <Select value={report} onValueChange={(value) => setReport(value as ReportKey)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(reportLabels) as ReportKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {reportLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر ٧ أيام</SelectItem>
              <SelectItem value="30">آخر ٣٠ يومًا</SelectItem>
              <SelectItem value="90">آخر ٩٠ يومًا</SelectItem>
            </SelectContent>
          </Select>

          {report === "students" && (
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {grades.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Panel>

      {loading ? (
        <LoadingCards count={2} />
      ) : (
        <>
          <div className="mb-5 grid gap-5 lg:grid-cols-2">
            <Panel title="توزيع الحضور">
              {attendancePie.length === 0 ? (
                <EmptyState title="لا توجد بيانات حضور" />
              ) : (
                <div className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={attendancePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
                        {attendancePie.map((entry, index) => (
                          <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="الطلاب حسب الصف">
              {gradeBars.length === 0 ? (
                <EmptyState title="لا يوجد طلاب" />
              ) : (
                <div className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeBars}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <RBar dataKey="طلاب" fill="var(--sea)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <Panel title={reportLabels[report]} description={`${table.rows.length} سجل`}>
            {table.rows.length === 0 ? (
              <EmptyState title="لا توجد بيانات" description="غيّر الفترة أو التصفية." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      {table.headers.map((header) => (
                        <th key={header} className="px-3 py-2 font-bold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.slice(0, 100).map((row, index) => (
                      <tr key={index} className="border-b border-border/60 last:border-0">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2.5">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
