import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingRows, PageHeader, Panel } from "@/components/app/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { api, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { formatDate, roleLabels, type AppRole } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "إدارة المستخدمين — مِكلاف" },
      { name: "description", content: "إدارة صلاحيات منسوبي المدرسة وتعيين الأدوار." },
      { property: "og:title", content: "إدارة المستخدمين — مِكلاف" },
      { property: "og:description", content: "تعيين أدوار المديرين والموجهين والمعلمين." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const people = useQuery({ queryKey: qk.people, queryFn: api.people, enabled: isAdmin });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw new Error(deleteError.message);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم تحديث الصلاحية.");
      void queryClient.invalidateQueries({ queryKey: qk.people });
    },
    onError: () => toast.error("تعذّر تحديث الصلاحية، تأكد من صلاحياتك."),
  });

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="إدارة المستخدمين" />
        <Panel>
          <EmptyState
            icon={<ShieldCheck size={20} />}
            title="هذه الصفحة للمديرين فقط"
            description="لا تملك صلاحية الوصول إلى إدارة المستخدمين."
          />
        </Panel>
      </div>
    );
  }

  const roleByUser = new Map<string, AppRole>();
  for (const row of people.data?.roles ?? []) roleByUser.set(row.user_id, row.role);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="إدارة المستخدمين"
        description="عيّن دور كل منسوب: مدير مدرسة، موجه طلابي أو معلم."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "إدارة المستخدمين" }]}
      />

      <Panel>
        {people.isLoading ? (
          <LoadingRows />
        ) : people.isError ? (
          <ErrorState />
        ) : (people.data?.profiles.length ?? 0) === 0 ? (
          <EmptyState title="لا يوجد مستخدمون" />
        ) : (
          <div className="space-y-3">
            {(people.data?.profiles ?? []).map((person) => (
              <div
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-navy text-xs font-bold text-navy-foreground">
                      {person.full_name.trim().charAt(0) || "م"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-bold">{person.full_name || "بدون اسم"}</div>
                    <div className="text-xs text-muted-foreground">
                      {person.email} · انضم {formatDate(person.created_at)}
                    </div>
                  </div>
                </div>
                <Select
                  value={roleByUser.get(person.id) ?? "teacher"}
                  onValueChange={(value) => setRole.mutate({ userId: person.id, role: value as AppRole })}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(roleLabels) as AppRole[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {roleLabels[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
