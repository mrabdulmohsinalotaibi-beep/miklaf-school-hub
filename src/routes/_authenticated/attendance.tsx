import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, ClipboardList, Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  Panel,
  type Tone,
} from "@/components/app/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { api, qk, type AttendanceRow } from "@/lib/data";
import { attendanceLabels, formatDate, isoDate, type AttendanceStatus } from "@/lib/labels";
import { exportToExcel, printReport } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "الحضور والغياب — مِكلاف" },
      { name: "description", content: "رصد الحضور اليومي لكل فصل مع تقارير الغياب والتأخر." },
      { property: "og:title", content: "الحضور والغياب — مِكلاف" },
      { property: "og:description", content: "رصد يومي دقيق للحضور وتقارير غياب تفصيلية." },
    ],
  }),
  component: AttendancePage,
});

const statusOrder: AttendanceStatus[] = ["present", "absent", "late", "excused"];
const statusTone: Record<AttendanceStatus, Tone> = {
  present: "leaf",
  absent: "rose",
  late: "gold",
  excused: "sea",
};

function AttendancePage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(isoDate());
  const [classId, setClassId] = useState<string>("all");

  const students = useQuery({ queryKey: qk.students, queryFn: api.students });
  const classes = useQuery({ queryKey: qk.classes, queryFn: api.classes });
  const daily = useQuery({ queryKey: qk.attendance(date), queryFn: () => api.attendanceByDate(date) });

  const from = isoDate(new Date(Date.now() - 29 * 86400000));
  const monthly = useQuery({
    queryKey: ["attendance", "range", from],
    queryFn: () => api.attendanceRange(from),
  });

  const visibleStudents = useMemo(
    () =>
      (students.data ?? []).filter((student) => classId === "all" || student.class_id === classId),
    [students.data, classId],
  );

  const statusByStudent = useMemo(() => {
    const map = new Map<string, AttendanceRow>();
    for (const row of daily.data ?? []) map.set(row.student_id, row);
    return map;
  }, [daily.data]);

  const save = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: AttendanceStatus }) => {
      const existing = statusByStudent.get(studentId);
      if (existing) {
        const { error } = await supabase
          .from("attendance")
          .update({ status })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await supabase
        .from("attendance")
        .insert({ student_id: studentId, date, status });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.attendance(date) });
      void queryClient.invalidateQueries({ queryKey: ["attendance", "range", from] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const markAllPresent = useMutation({
    mutationFn: async () => {
      const missing = visibleStudents.filter((student) => !statusByStudent.has(student.id));
      if (missing.length === 0) return 0;
      const { error } = await supabase.from("attendance").insert(
        missing.map((student) => ({ student_id: student.id, date, status: "present" as const })),
      );
      if (error) throw new Error(error.message);
      return missing.length;
    },
    onSuccess: (count) => {
      toast.success(count ? `تم رصد الحضور لـ ${count} طالبًا.` : "جميع الطلاب مرصودون مسبقًا.");
      void queryClient.invalidateQueries({ queryKey: qk.attendance(date) });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const summary = statusOrder.map((status) => ({
    status,
    count: visibleStudents.filter((s) => statusByStudent.get(s.id)?.status === status).length,
  }));

  const studentNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const student of students.data ?? []) map.set(student.id, student.full_name);
    return map;
  }, [students.data]);

  const absenceReport = useMemo(() => {
    const totals = new Map<string, { absent: number; late: number; excused: number }>();
    for (const row of monthly.data ?? []) {
      if (row.status === "present") continue;
      const entry = totals.get(row.student_id) ?? { absent: 0, late: 0, excused: 0 };
      if (row.status === "absent") entry.absent += 1;
      if (row.status === "late") entry.late += 1;
      if (row.status === "excused") entry.excused += 1;
      totals.set(row.student_id, entry);
    }
    return [...totals.entries()]
      .map(([id, value]) => ({ id, name: studentNames.get(id) ?? "—", ...value }))
      .sort((a, b) => b.absent + b.late - (a.absent + a.late));
  }, [monthly.data, studentNames]);

  const reportHeaders = ["الطالب", "غياب", "تأخر", "بعذر"];
  const reportRows = absenceReport.map((row) => [row.name, row.absent, row.late, row.excused]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="الحضور والغياب"
        description="رصد يومي سريع لكل فصل، وتقرير شهري للغياب والتأخر."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "الحضور والغياب" }]}
      />

      <Tabs defaultValue="daily" className="space-y-5">
        <TabsList>
          <TabsTrigger value="daily">الرصد اليومي</TabsTrigger>
          <TabsTrigger value="report">تقرير الغياب</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-5">
          <Panel>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">التاريخ</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-44"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">الفصل</label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفصول</SelectItem>
                    {(classes.data ?? []).map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="secondary"
                onClick={() => markAllPresent.mutate()}
                disabled={markAllPresent.isPending || visibleStudents.length === 0}
              >
                <CheckCheck size={16} /> رصد الجميع حاضرين
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summary.map((item) => (
                <div key={item.status} className="rounded-2xl border border-border p-3">
                  <div className="text-xs text-muted-foreground">{attendanceLabels[item.status]}</div>
                  <div className="font-display text-2xl font-black">{item.count}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={`قائمة الرصد — ${formatDate(date)}`}>
            {students.isLoading ? (
              <LoadingRows />
            ) : students.isError ? (
              <ErrorState />
            ) : visibleStudents.length === 0 ? (
              <EmptyState
                icon={<ClipboardList size={20} />}
                title="لا يوجد طلاب في هذا الفصل"
                description="اختر فصلًا آخر أو أضف طلابًا من سجل الطلاب."
              />
            ) : (
              <div className="space-y-2">
                {visibleStudents.map((student) => {
                  const current = statusByStudent.get(student.id)?.status;
                  return (
                    <div
                      key={student.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-bold">{student.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.student_no} · {student.grade}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {statusOrder.map((status) => (
                          <button
                            key={status}
                            onClick={() => save.mutate({ studentId: student.id, status })}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                              current === status
                                ? "border-transparent bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {attendanceLabels[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="report">
          <Panel
            title="تقرير الغياب والتأخر (آخر ٣٠ يومًا)"
            action={
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportToExcel("تقرير-الغياب", reportHeaders, reportRows)}
                >
                  <Download size={15} /> تصدير
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => printReport("تقرير الغياب والتأخر", reportHeaders, reportRows)}
                >
                  <Printer size={15} /> طباعة
                </Button>
              </div>
            }
          >
            {monthly.isLoading ? (
              <LoadingRows />
            ) : absenceReport.length === 0 ? (
              <EmptyState title="لا توجد حالات غياب" description="سجل الحضور نظيف خلال آخر ٣٠ يومًا." />
            ) : (
              <div className="space-y-2">
                {absenceReport.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
                  >
                    <span className="text-sm font-bold">{row.name}</span>
                    <div className="flex gap-2">
                      <Chip tone={statusTone.absent}>غياب {row.absent}</Chip>
                      <Chip tone={statusTone.late}>تأخر {row.late}</Chip>
                      <Chip tone={statusTone.excused}>بعذر {row.excused}</Chip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
