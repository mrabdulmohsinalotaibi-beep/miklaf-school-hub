import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartHandshake, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Bar,
  Chip,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  Panel,
  type Tone,
} from "@/components/app/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { api, qk, type CaseRow } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import {
  casePriorityLabels,
  caseStatusLabels,
  formatDate,
  formatDateTime,
  type CasePriority,
  type CaseStatus,
} from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/counseling")({
  head: () => ({
    meta: [
      { title: "الموجه الطلابي — مِكلاف" },
      { name: "description", content: "إدارة حالات الموجه الطلابي والسلوك ومتابعتها بالملاحظات." },
      { property: "og:title", content: "الموجه الطلابي — مِكلاف" },
      { property: "og:description", content: "تتبع حالات التوجيه من الفتح حتى الإغلاق." },
    ],
  }),
  component: CounselingPage,
});

const statusTone: Record<CaseStatus, Tone> = {
  new: "gold",
  in_progress: "sea",
  closed: "leaf",
};

const priorityTone: Record<CasePriority, Tone> = {
  high: "rose",
  medium: "gold",
  low: "muted",
};

const categories = ["سلوكي", "أكاديمي", "نفسي", "اجتماعي", "صحي"];

function CounselingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");
  const [selected, setSelected] = useState<CaseRow | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "سلوكي",
    student_id: "",
    priority: "medium" as CasePriority,
    follow_up_date: "",
  });

  const cases = useQuery({ queryKey: qk.cases, queryFn: api.cases });
  const students = useQuery({ queryKey: qk.students, queryFn: api.students });
  const notes = useQuery({
    queryKey: qk.caseNotes(selected?.id ?? "none"),
    queryFn: () => api.caseNotes(selected?.id ?? ""),
    enabled: Boolean(selected),
  });

  const studentNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const student of students.data ?? []) map.set(student.id, student.full_name);
    return map;
  }, [students.data]);

  const filtered = (cases.data ?? []).filter(
    (item) => statusFilter === "all" || item.status === statusFilter,
  );

  const createCase = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("عنوان الحالة مطلوب.");
      const { error } = await supabase.from("counseling_cases").insert({
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        student_id: form.student_id || null,
        follow_up_date: form.follow_up_date || null,
        counselor_id: user?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم إنشاء الحالة.");
      setOpen(false);
      setForm({ title: "", category: "سلوكي", student_id: "", priority: "medium", follow_up_date: "" });
      void queryClient.invalidateQueries({ queryKey: qk.cases });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateCase = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CaseRow> }) => {
      const { error } = await supabase.from("counseling_cases").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم تحديث الحالة.");
      void queryClient.invalidateQueries({ queryKey: qk.cases });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!selected || !note.trim()) throw new Error("اكتب نص الملاحظة أولًا.");
      const { error } = await supabase
        .from("case_notes")
        .insert({ case_id: selected.id, body: note.trim(), author_id: user?.id ?? null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNote("");
      toast.success("تمت إضافة الملاحظة.");
      void queryClient.invalidateQueries({ queryKey: qk.caseNotes(selected?.id ?? "none") });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="الموجه الطلابي"
        description="حالات التوجيه والسلوك، حالتها، نسبة تقدمها وتواريخ المتابعة."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "الموجه الطلابي" }]}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} /> حالة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء حالة توجيه</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>عنوان الحالة</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="مثال: متابعة تحسين التحصيل"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>التصنيف</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) => setForm({ ...form, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الأولوية</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(value) => setForm({ ...form, priority: value as CasePriority })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(casePriorityLabels) as CasePriority[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {casePriorityLabels[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>الطالب</Label>
                  <Select
                    value={form.student_id}
                    onValueChange={(value) => setForm({ ...form, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {(students.data ?? []).map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>تاريخ المتابعة</Label>
                  <Input
                    type="date"
                    value={form.follow_up_date}
                    onChange={(event) => setForm({ ...form, follow_up_date: event.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createCase.mutate()} disabled={createCase.isPending}>
                  حفظ الحالة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "new", "in_progress", "closed"] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={statusFilter === key ? "default" : "secondary"}
            onClick={() => setStatusFilter(key)}
          >
            {key === "all" ? "الكل" : caseStatusLabels[key]}
          </Button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="الحالات">
          {cases.isLoading ? (
            <LoadingRows />
          ) : cases.isError ? (
            <ErrorState />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<HeartHandshake size={20} />}
              title="لا توجد حالات"
              description="أنشئ حالة توجيه جديدة لبدء المتابعة."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full rounded-2xl border border-border p-4 text-right transition-colors hover:bg-muted/60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-sm font-black">{item.title}</span>
                    <div className="flex gap-2">
                      <Chip tone={priorityTone[item.priority]}>{casePriorityLabels[item.priority]}</Chip>
                      <Chip tone={statusTone[item.status]}>{caseStatusLabels[item.status]}</Chip>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.student_id ? studentNames.get(item.student_id) ?? "—" : "بدون طالب"} ·{" "}
                    {item.category} · متابعة {formatDate(item.follow_up_date)}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Bar value={item.progress} tone={statusTone[item.status]} />
                    <span className="text-xs font-bold text-muted-foreground">{item.progress}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={selected ? selected.title : "تفاصيل الحالة"}>
          {!selected ? (
            <EmptyState title="اختر حالة" description="اضغط على أي حالة لعرض ملاحظاتها وتحديث حالتها." />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>الحالة</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(value) => {
                      setSelected({ ...selected, status: value as CaseStatus });
                      updateCase.mutate({ id: selected.id, patch: { status: value as CaseStatus } });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(caseStatusLabels) as CaseStatus[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {caseStatusLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نسبة التقدم</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={selected.progress}
                    onChange={(event) =>
                      setSelected({ ...selected, progress: Number(event.target.value) })
                    }
                    onBlur={() =>
                      updateCase.mutate({ id: selected.id, patch: { progress: selected.progress } })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>تاريخ المتابعة</Label>
                <Input
                  type="date"
                  value={selected.follow_up_date ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelected({ ...selected, follow_up_date: value });
                    updateCase.mutate({ id: selected.id, patch: { follow_up_date: value || null } });
                  }}
                />
              </div>

              <div>
                <Label>إضافة ملاحظة</Label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="اكتب ملاحظة المتابعة..."
                  rows={3}
                />
                <Button
                  className="mt-2 w-full"
                  onClick={() => addNote.mutate()}
                  disabled={addNote.isPending}
                >
                  حفظ الملاحظة
                </Button>
              </div>

              <div className="space-y-2">
                {(notes.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-xl bg-muted/60 p-3 text-xs">
                    <div className="text-muted-foreground">{formatDateTime(item.created_at)}</div>
                    <p className="mt-1 text-foreground">{item.body}</p>
                  </div>
                ))}
                {notes.data?.length === 0 && (
                  <p className="text-xs text-muted-foreground">لا توجد ملاحظات بعد.</p>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
