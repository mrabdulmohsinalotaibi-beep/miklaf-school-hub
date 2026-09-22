import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessagesSquare, Plus, Trash2 } from "lucide-react";
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
import { Chip, EmptyState, ErrorState, LoadingRows, PageHeader, Panel } from "@/components/app/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { api, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "الرسائل والإعلانات — مِكلاف" },
      { name: "description", content: "إعلانات داخلية موجهة للمعلمين والموجهين وأولياء الأمور." },
      { property: "og:title", content: "الرسائل والإعلانات — مِكلاف" },
      { property: "og:description", content: "قناة تواصل داخلية موحدة لمنسوبي المدرسة." },
    ],
  }),
  component: MessagesPage,
});

const audiences = ["الجميع", "المعلمون", "الموجهون", "أولياء الأمور", "الإدارة"];

function MessagesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("الكل");
  const [form, setForm] = useState({ title: "", body: "", audience: "الجميع" });

  const announcements = useQuery({ queryKey: qk.announcements, queryFn: api.announcements });

  const items = (announcements.data ?? []).filter(
    (item) => filter === "الكل" || item.audience === filter,
  );

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.body.trim()) throw new Error("العنوان والنص مطلوبان.");
      const { error } = await supabase.from("announcements").insert({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        author_id: user?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم نشر الإعلان.");
      setOpen(false);
      setForm({ title: "", body: "", audience: "الجميع" });
      void queryClient.invalidateQueries({ queryKey: qk.announcements });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم حذف الإعلان.");
      void queryClient.invalidateQueries({ queryKey: qk.announcements });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="الرسائل والإعلانات"
        description="انشر التعاميم الداخلية وحدد الفئة المستهدفة."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "الرسائل" }]}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} /> إعلان جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>نشر إعلان</DialogTitle>
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
                  <Label>الفئة المستهدفة</Label>
                  <Select
                    value={form.audience}
                    onValueChange={(value) => setForm({ ...form, audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>النص</Label>
                  <Textarea
                    rows={5}
                    value={form.body}
                    onChange={(event) => setForm({ ...form, body: event.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={create.isPending}>
                  نشر
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {["الكل", ...audiences].map((item) => (
          <Button
            key={item}
            size="sm"
            variant={filter === item ? "default" : "secondary"}
            onClick={() => setFilter(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      {announcements.isLoading ? (
        <LoadingRows />
      ) : announcements.isError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<MessagesSquare size={20} />}
            title="لا توجد إعلانات"
            description="ابدأ بنشر أول تعميم داخلي."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Panel key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-black">{item.title}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Chip tone="gold">{item.audience}</Chip>
                    {formatDateTime(item.created_at)}
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
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/85">{item.body}</p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
