import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, ClipboardList, FileText, Plus, ScrollText, Table2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel, Chip, EmptyState, LoadingCards } from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { api, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/operations")({
  head: () => ({
    meta: [
      { title: "مركز أعمال الوكلاء — مِكلاف" },
      { name: "description", content: "الجداول والمساءلات والتعاميم والتعهدات المدرسية." },
    ],
  }),
  component: OperationsPage,
});

type OperationKey = "schedules" | "accountability" | "circulars" | "pledges";

const operationConfig: Record<
  OperationKey,
  {
    title: string;
    description: string;
    icon: typeof Table2;
    tone: "sea" | "rose" | "gold" | "leaf";
  }
> = {
  schedules: {
    title: "الجداول",
    description: "جداول الحصص والاختبارات والمناوبات والفعاليات.",
    icon: Table2,
    tone: "sea",
  },
  accountability: {
    title: "المساءلات",
    description: "متابعة المساءلات الإدارية والسلوكية والإجراءات المتخذة.",
    icon: ClipboardList,
    tone: "rose",
  },
  circulars: {
    title: "التعاميم",
    description: "تسجيل التعاميم وتحديد الجهة المستلمة وحالة التفعيل.",
    icon: BellRing,
    tone: "gold",
  },
  pledges: {
    title: "التعهدات الطلابية",
    description: "توثيق تعهدات الطلاب ومتابعة سريانها وملاحظاتها.",
    icon: ScrollText,
    tone: "leaf",
  },
};

function OperationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const school = useQuery({
    queryKey: ["active-school-for-operations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_members")
        .select("school_id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.school_id ?? null;
    },
  });
  const students = useQuery({ queryKey: qk.students, queryFn: api.students });
  const counts = useQuery({
    queryKey: ["operations-counts", school.data],
    enabled: Boolean(school.data),
    queryFn: async () => {
      const [schedules, accountability, circulars, pledges] = await Promise.all([
        supabase
          .from("school_schedules")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.data!),
        supabase
          .from("student_accountability")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.data!),
        supabase
          .from("circulars")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.data!),
        supabase
          .from("student_pledges")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.data!),
      ]);
      const error = [schedules, accountability, circulars, pledges].find(
        (result) => result.error,
      )?.error;
      if (error) throw new Error(error.message);
      return {
        schedules: schedules.count ?? 0,
        accountability: accountability.count ?? 0,
        circulars: circulars.count ?? 0,
        pledges: pledges.count ?? 0,
      };
    },
  });
  const [active, setActive] = useState<OperationKey>("schedules");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");
  const [studentId, setStudentId] = useState("");
  const config = operationConfig[active];
  const Icon = config.icon;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const createRecord = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("العنوان مطلوب");
      if (!school.data) throw new Error("أنشئ مساحة مدرسة أو انضم إلى مدرسة أولًا");
      if (active === "schedules") {
        const { error } = await supabase.from("school_schedules").insert({
          school_id: school.data,
          created_by: user?.id ?? null,
          title: title.trim(),
          details: details || null,
          schedule_date: date || null,
        });
        if (error) throw new Error(error.message);
      } else if (active === "accountability") {
        const { error } = await supabase.from("student_accountability").insert({
          school_id: school.data,
          created_by: user?.id ?? null,
          title: title.trim(),
          details: details || null,
          student_id: studentId || null,
          due_date: date || null,
        });
        if (error) throw new Error(error.message);
      } else if (active === "circulars") {
        const { error } = await supabase.from("circulars").insert({
          school_id: school.data,
          created_by: user?.id ?? null,
          title: title.trim(),
          body: details || null,
          issued_date: date || today,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("student_pledges").insert({
          school_id: school.data,
          created_by: user?.id ?? null,
          title: title.trim(),
          notes: details || null,
          student_id: studentId || null,
          pledge_date: date || today,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(`تمت إضافة ${config.title}`);
      setTitle("");
      setDetails("");
      setDate("");
      setStudentId("");
      void queryClient.invalidateQueries({ queryKey: ["operations-counts"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (school.isLoading || counts.isLoading) return <LoadingCards count={4} />;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="مركز أعمال الوكلاء"
        description="أدوات تشغيلية مشتركة لوكيل الشؤون التعليمية والمدرسية وشؤون الطلاب."
        crumbs={[{ label: "الرئيسية", to: "/dashboard" }, { label: "مركز أعمال الوكلاء" }]}
      />
      {!school.data && (
        <Panel
          title="لا توجد مساحة مدرسة نشطة"
          description="أنشئ مدرسة أو اطلب الانضمام إلى مدرسة قبل إضافة أي سجل تشغيلي."
        >
          <EmptyState
            title="ابدأ من مساحة المدرسة"
            description="يتم عزل الجداول والمساءلات والتعاميم والتعهدات حسب المدرسة."
          />
        </Panel>
      )}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(operationConfig) as OperationKey[]).map((key) => {
          const item = operationConfig[key];
          const ItemIcon = item.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`rounded-2xl border p-4 text-right transition-all ${active === key ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-muted"}`}
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                  <ItemIcon size={19} />
                </div>
                <strong className="text-2xl">{counts.data?.[key] ?? 0}</strong>
              </div>
              <div className="mt-3 font-bold">{item.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
            </button>
          );
        })}
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel
          title={`إضافة ${config.title}`}
          description="يتم حفظ السجل داخل مكلاف ويمكن مراجعته من أصحاب الصلاحية."
        >
          <div className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input
                className="mt-1.5"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  active === "pledges" ? "تعهد بالمحافظة على الانضباط" : `عنوان ${config.title}`
                }
              />
            </div>
            {(active === "accountability" || active === "pledges") && (
              <div>
                <Label>الطالب المرتبط (اختياري)</Label>
                <Select
                  value={studentId || "none"}
                  onValueChange={(value) => setStudentId(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="اختر طالبًا" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون طالب محدد</SelectItem>
                    {(students.data ?? []).map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} — {student.student_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>{active === "circulars" ? "نص التعميم" : "التفاصيل والملاحظات"}</Label>
              <Textarea
                className="mt-1.5"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                className="mt-1.5"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <Button onClick={() => createRecord.mutate()} disabled={createRecord.isPending}>
              <Plus size={16} /> {createRecord.isPending ? "جارٍ الحفظ..." : `حفظ ${config.title}`}
            </Button>
          </div>
        </Panel>
        <Panel title="دليل الإجراء" description="مسارات عمل مقترحة حسب اختصاص الوكيل">
          <div className="space-y-3">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 font-bold">
                <Icon size={17} className="text-primary" /> {config.title}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{config.description}</p>
              <Chip tone={config.tone} className="mt-3">
                سجل محلي قابل للمراجعة
              </Chip>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <FileText size={17} className="mb-2 text-primary" />
                <div className="text-sm font-bold">توثيق الإجراء</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  أدخل العنوان والتفاصيل والتاريخ ثم احفظ السجل.
                </div>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <ClipboardList size={17} className="mb-2 text-primary" />
                <div className="text-sm font-bold">المتابعة والمساءلة</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  يمكن ربط المساءلات والتعهدات بالطالب عند الحاجة.
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
