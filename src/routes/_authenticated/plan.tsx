import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
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
import { api, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { formatDate, taskStatusLabels, type TaskStatus } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "الخطة التشغيلية — مِكلاف" },
      { name: "description", content: "مهام الخطة التشغيلية للمدرسة بحالاتها ونسب الإنجاز وتواريخ الاستحقاق." },
      { property: "og:title", content: "الخطة التشغيلية — مِكلاف" },
      { property: "og:description", content: "تتبع مهام الخطة التشغيلية ونسب إنجازها." },
    ],
  }),
  component: PlanPage,
});

const columns: TaskStatus[] = ["not_started", "in_progress", "done"];
const columnTone: Record<TaskStatus, Tone> = {
  not_started: "muted",
  in_progress: "sea",
  done: "leaf",
};

function PlanPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", owner: "", due_date: "" });

  const tasks = useQuery({ queryKey: qk.tasks, queryFn: api.tasks });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("عنوان المهمة مطلوب.");
      const { error } = await supabase.from("plan_tasks").insert({
        title: form.title.trim(),
        description: form.description || null,
        owner: form.owner || null,
        due_date: form.due_date || null,
        created_by: user?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تمت إضافة المهمة.");
      setOpen(false);
      setForm({ title: "", description: "", owner: "", due_date: "" });
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: TaskStatus; progress?: number } }) => {
      const { error } = await supabase.from("plan_tasks").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.tasks }),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plan_tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم حذف المهمة.");
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const all = tasks.data ?? [];
  const done = all.filter((task) => task.status === "done").length;
  const completion = all.length ? Math.round((done / all.length) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="الخطة التشغيلية"
        description="مهام الخطة المدرسية موزعة على ثلاث مراحل مع نسب الإنجاز."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "الخطة التشغيلية" }]}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} /> مهمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مهمة</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>العنوان</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                  />
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>المسؤول</Label>
                    <Input
                      value={form.owner}
                      onChange={(event) => setForm({ ...form, owner: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label>تاريخ الاستحقاق</Label>
                    <Input
                      type="date"
                      value={form.due_date}
                      onChange={(event) => setForm({ ...form, due_date: event.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={create.isPending}>
                  حفظ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Panel className="mb-5" title="نسبة إنجاز الخطة">
        <div className="flex items-center gap-4">
          <Bar value={completion} tone="leaf" />
          <span className="font-display text-xl font-black">{completion}%</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {done} مهمة مكتملة من أصل {all.length}
        </p>
      </Panel>

      {tasks.isLoading ? (
        <LoadingRows />
      ) : tasks.isError ? (
        <ErrorState />
      ) : all.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<ClipboardList size={20} />}
            title="لا توجد مهام"
            description="أضف أول مهمة في الخطة التشغيلية."
          />
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((status) => {
            const items = all.filter((task) => task.status === status);
            return (
              <Panel key={status} title={taskStatusLabels[status]} description={`${items.length} مهمة`}>
                <div className="space-y-3">
                  {items.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-display text-sm font-black">{task.title}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => remove.mutate(task.id)}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">{task.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        {task.owner && <Chip tone="sea">{task.owner}</Chip>}
                        <Chip tone="gold">استحقاق {formatDate(task.due_date)}</Chip>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Bar value={task.progress} tone={columnTone[status]} />
                        <span className="text-xs font-bold text-muted-foreground">{task.progress}%</span>
                      </div>
                      <Select
                        value={task.status}
                        onValueChange={(value) =>
                          update.mutate({
                            id: task.id,
                            patch: {
                              status: value as TaskStatus,
                              progress: value === "done" ? 100 : task.progress,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="mt-3 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((key) => (
                            <SelectItem key={key} value={key}>
                              {taskStatusLabels[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">لا توجد مهام هنا.</p>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
