import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
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
import { Chip, EmptyState, LoadingRows, PageHeader, Panel } from "@/components/app/ui-kit";
import { WhatsAppButton } from "@/components/app/WhatsAppButton";
import { supabase } from "@/integrations/supabase/client";
import { api, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, isoDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { whatsappMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({
    meta: [
      { title: "المواعيد والمقابلات — مِكلاف" },
      { name: "description", content: "جدولة المقابلات مع الطلاب وأولياء الأمور بعرض تقويمي شهري." },
      { property: "og:title", content: "المواعيد والمقابلات — مِكلاف" },
      { property: "og:description", content: "تقويم شهري لكل مقابلات المدرسة." },
    ],
  }),
  component: AppointmentsPage,
});

const weekDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const types = ["مقابلة طالب", "لقاء ولي أمر", "اجتماع داخلي", "ورشة"];

function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(isoDate());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "مقابلة طالب",
    student_id: "",
    with_person: "",
    location: "",
    starts_at: `${isoDate()}T09:00`,
  });

  const appointments = useQuery({ queryKey: qk.appointments, queryFn: api.appointments });
  const students = useQuery({ queryKey: qk.students, queryFn: api.students });

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of appointments.data ?? []) {
      const key = item.starts_at.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [appointments.data]);

  const dayItems = (appointments.data ?? []).filter(
    (item) => item.starts_at.slice(0, 10) === selectedDay,
  );
  const selectedStudent = (students.data ?? []).find((student) => student.id === form.student_id);

  const monthLabel = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  const cells = useMemo(() => {
    const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const result: (string | null)[] = Array.from({ length: firstDay }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      result.push(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }
    return result;
  }, [cursor]);

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("عنوان الموعد مطلوب.");
      const { error } = await supabase.from("appointments").insert({
        title: form.title.trim(),
        type: form.type,
        student_id: form.student_id || null,
        with_person: form.with_person || null,
        location: form.location || null,
        starts_at: new Date(form.starts_at).toISOString(),
        created_by: user?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تمت إضافة الموعد.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.appointments });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم حذف الموعد.");
      void queryClient.invalidateQueries({ queryKey: qk.appointments });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="المواعيد والمقابلات"
        description="نظّم مقابلات الطلاب وأولياء الأمور والاجتماعات الداخلية."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "المواعيد" }]}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} /> موعد جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة موعد</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>العنوان</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>النوع</Label>
                    <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الموعد</Label>
                    <Input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>الطالب</Label>
                  <Select
                    value={form.student_id}
                    onValueChange={(value) => setForm({ ...form, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختياري" />
                    </SelectTrigger>
                  <SelectContent>
                      {(students.data ?? []).map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudent?.guardian_phone && (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs">
                      <span>ولي الأمر: {selectedStudent.guardian_phone}</span>
                      <WhatsAppButton
                        phone={selectedStudent.guardian_phone}
                        message={whatsappMessage(selectedStudent.full_name, "تأكيد موعد المقابلة")}
                        label="إرسال تذكير"
                      />
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>مع</Label>
                    <Input
                      value={form.with_person}
                      onChange={(event) => setForm({ ...form, with_person: event.target.value })}
                      placeholder="ولي الأمر / المعلم"
                    />
                  </div>
                  <div>
                    <Label>المكان</Label>
                    <Input
                      value={form.location}
                      onChange={(event) => setForm({ ...form, location: event.target.value })}
                      placeholder="مكتب التوجيه"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={create.isPending}>
                  حفظ الموعد
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel
          title={monthLabel}
          action={
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="الشهر السابق"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="الشهر التالي"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">
            {weekDays.map((day) => (
              <div key={day} className="py-1">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell, index) => {
              if (!cell) return <div key={`empty-${index}`} />;
              const count = byDay.get(cell) ?? 0;
              const active = cell === selectedDay;
              return (
                <button
                  key={cell}
                  onClick={() => setSelectedDay(cell)}
                  className={cn(
                    "aspect-square rounded-xl border text-sm font-bold transition-colors",
                    active
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <div>{Number(cell.slice(8))}</div>
                  {count > 0 && (
                    <div
                      className={cn(
                        "mx-auto mt-0.5 h-1.5 w-1.5 rounded-full",
                        active ? "bg-primary-foreground" : "bg-gold",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="مواعيد اليوم المحدد">
          {appointments.isLoading ? (
            <LoadingRows rows={3} />
          ) : dayItems.length === 0 ? (
            <EmptyState
              icon={<CalendarClock size={20} />}
              title="لا توجد مواعيد"
              description="اختر يومًا آخر أو أضف موعدًا جديدًا."
            />
          ) : (
            <div className="space-y-3">
              {dayItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-sm font-black">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(item.starts_at)}
                        {item.location ? ` · ${item.location}` : ""}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="حذف"
                      onClick={() => remove.mutate(item.id)}
                    >
                      <Trash2 size={15} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Chip tone="sea">{item.type}</Chip>
                    {item.with_person && <Chip tone="muted">{item.with_person}</Chip>}
                    {(() => {
                      const appointmentStudent = (students.data ?? []).find((student) => student.id === item.student_id);
                      return appointmentStudent?.guardian_phone ? (
                        <WhatsAppButton
                          phone={appointmentStudent.guardian_phone}
                          message={whatsappMessage(appointmentStudent.full_name, "تذكير بالموعد")}
                          compact
                        />
                      ) : null;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
