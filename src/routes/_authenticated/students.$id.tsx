import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Chip, EmptyState, LoadingRows, PageHeader, Panel } from "@/components/app/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { attendanceLabels, caseStatusLabels, formatDate } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/students/$id")({
  head: () => ({
    meta: [
      { title: "ملف الطالب — مِكلاف" },
      { name: "description", content: "الملف الأكاديمي والسلوكي وسجل الحضور للطالب." },
      { property: "og:title", content: "ملف الطالب — مِكلاف" },
      { property: "og:description", content: "بيانات الطالب الأكاديمية والحضور وحالات الموجه الطلابي." },
    ],
  }),
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { id } = useParams({ from: "/_authenticated/students/$id" });

  const student = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const attendance = useQuery({
    queryKey: ["student-attendance", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", id)
        .order("date", { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const cases = useQuery({
    queryKey: ["student-cases", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counseling_cases")
        .select("*")
        .eq("student_id", id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  if (student.isLoading) return <LoadingRows />;
  if (!student.data) return <EmptyState title="لم يتم العثور على الطالب" />;

  const row = student.data;

  return (
    <>
      <PageHeader
        title={row.full_name}
        description={`${row.student_no} · ${row.grade}`}
        crumbs={[
          { label: "الرئيسية", to: "/dashboard" },
          { label: "سجل الطلاب", to: "/students" },
          { label: row.full_name },
        ]}
      />

      <Tabs defaultValue="academic" dir="rtl">
        <TabsList>
          <TabsTrigger value="academic">الأكاديمي</TabsTrigger>
          <TabsTrigger value="attendance">الحضور</TabsTrigger>
          <TabsTrigger value="behavior">السلوك والتوجيه</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-4">
          <Panel title="البيانات الأكاديمية">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="المعدل العام" value={String(Number(row.average))} />
              <Field label="الصف" value={row.grade} />
              <Field label="الحالة" value={row.status} />
              <Field label="ولي الأمر" value={row.guardian_name ?? "—"} />
              <Field label="جوال ولي الأمر" value={row.guardian_phone ?? "—"} />
            </dl>
          </Panel>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Panel title="سجل الحضور">
            {(attendance.data ?? []).length === 0 ? (
              <EmptyState title="لا يوجد سجل حضور" />
            ) : (
              <ul className="space-y-2">
                {(attendance.data ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-border p-3 text-sm"
                  >
                    <span>{formatDate(item.date)}</span>
                    <Chip tone={item.status === "present" ? "leaf" : item.status === "absent" ? "rose" : "gold"}>
                      {attendanceLabels[item.status]}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="behavior" className="mt-4">
          <Panel title="حالات الموجه الطلابي">
            {(cases.data ?? []).length === 0 ? (
              <EmptyState title="لا توجد حالات مسجلة" />
            ) : (
              <ul className="space-y-2">
                {(cases.data ?? []).map((item) => (
                  <li key={item.id} className="rounded-2xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{item.title}</span>
                      <Chip tone="sea">{caseStatusLabels[item.status]}</Chip>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-bold">{value}</dd>
    </div>
  );
}
