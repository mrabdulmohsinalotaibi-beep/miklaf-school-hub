import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { BrandAvatar } from "@/components/app/Logo";
import { WhatsAppButton } from "@/components/app/WhatsAppButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  Panel,
} from "@/components/app/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { api, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { useSchool } from "@/lib/school-context";
import { formatDate, formatDateTime, roleLabels, type AppRole } from "@/lib/labels";
import { whatsappMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "أعضاء المدرسة والصلاحيات — مِكلاف" },
      { name: "description", content: "قائمة الموظفين وأدوارهم وحالة الحساب وسجل التغييرات." },
      { property: "og:title", content: "أعضاء المدرسة والصلاحيات — مِكلاف" },
      { property: "og:description", content: "تعيين أدوار المديرين والوكلاء والموجهين والمعلمين." },
    ],
  }),
  component: UsersPage,
});

const assignableRoles: AppRole[] = [
  "teacher",
  "counselor",
  "educational_deputy",
  "school_deputy",
  "student_affairs_deputy",
  "administrator",
];

function UsersPage() {
  const queryClient = useQueryClient();
  const { isAdmin, user } = useAuth();
  const { schoolId, canManageSchool, workspaceRole } = useSchool();
  const canManage = canManageSchool || isAdmin;

  const people = useQuery({
    queryKey: qk.people,
    queryFn: api.people,
    enabled: canManage,
  });
  const audit = useQuery({
    queryKey: qk.audit,
    queryFn: api.audit,
    enabled: canManage,
  });

  /**
   * Role changes go through one checked database function so the membership and
   * the platform role never disagree, and every change is audited there.
   */
  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (!schoolId) throw new Error("لا توجد مساحة مدرسة نشطة.");
      const { error } = await supabase.rpc("set_member_role", {
        target_school: schoolId,
        target_user: userId,
        new_role: role,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم تحديث دور العضو.");
      void queryClient.invalidateQueries({ queryKey: qk.people });
      void queryClient.invalidateQueries({ queryKey: qk.audit });
    },
    onError: (error: Error) => toast.error(error.message || "تعذّر تحديث الدور."),
  });

  const membershipByUser = useMemo(() => {
    const map = new Map<string, { role: string; status: string; manager_id: string | null }>();
    for (const member of people.data?.members ?? []) {
      map.set(member.user_id, {
        role: member.role,
        status: member.status,
        manager_id: member.manager_id,
      });
    }
    return map;
  }, [people.data]);

  const roleByUser = useMemo(() => {
    const map = new Map<string, AppRole>();
    for (const row of people.data?.roles ?? []) map.set(row.user_id, row.role);
    return map;
  }, [people.data]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const person of people.data?.profiles ?? []) map.set(person.id, person.full_name);
    return map;
  }, [people.data]);

  if (!canManage) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="أعضاء المدرسة والصلاحيات" />
        <Panel>
          <EmptyState
            icon={<ShieldCheck size={20} />}
            title="هذه الصفحة لمدير المدرسة فقط"
            description="تعيين الأدوار وتعديلها مقصور على مدير المدرسة."
          />
        </Panel>
      </div>
    );
  }

  const members = people.data?.profiles ?? [];
  const withoutMembership = members.filter((person) => !membershipByUser.has(person.id));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="أعضاء المدرسة والصلاحيات"
        description="قائمة الموظفين وأدوارهم وحالة الحساب، مع سجل لكل تغيير في الأدوار."
        crumbs={[{ label: "لوحة المتابعة", to: "/dashboard" }, { label: "أعضاء المدرسة" }]}
      />

      {!schoolId && (
        <Panel className="mb-5">
          <EmptyState
            icon={<UserCheck size={20} />}
            title="لا توجد مساحة مدرسة نشطة"
            description="أنشئ مساحة المدرسة أولًا من صفحة المدرسة، ثم عيّن أدوار الموظفين هنا."
          />
        </Panel>
      )}

      <Panel className="mb-5">
        {people.isLoading ? (
          <LoadingRows />
        ) : people.isError ? (
          <ErrorState />
        ) : members.length === 0 ? (
          <EmptyState
            title="لا يوجد أعضاء بعد"
            description="سيظهر هنا كل من ينشئ حسابًا في مدرستك لتعيين دوره."
          />
        ) : (
          <div className="space-y-3">
            {members.map((person) => {
              const membership = membershipByUser.get(person.id);
              const currentRole = (roleByUser.get(person.id) ?? "teacher") as AppRole;
              const manager = membership?.manager_id
                ? nameById.get(membership.manager_id)
                : undefined;
              const isSelf = person.id === user?.id;
              const canEditThisRow =
                Boolean(schoolId) &&
                membership?.status === "active" &&
                (!isSelf || workspaceRole === "administrator");
              return (
                <div
                  key={person.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <BrandAvatar />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">
                        {person.full_name || "بدون اسم"}
                        {isSelf && (
                          <span className="ms-2 text-[10px] font-bold text-muted-foreground">
                            (أنت)
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {person.email} · انضم {formatDate(person.created_at)}
                      </div>
                      {manager && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          الرئيس المباشر: {manager}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <WhatsAppButton
                      phone={person.phone}
                      message={whatsappMessage(person.full_name, "تواصل من إدارة المدرسة")}
                      compact
                    />
                    {membership ? (
                      <Chip tone={membership.status === "active" ? "leaf" : "gold"}>
                        {membership.status === "active" ? "نشط" : "بانتظار التفعيل"}
                      </Chip>
                    ) : (
                      <Chip tone="muted">حساب بلا عضوية</Chip>
                    )}
                    <Select
                      value={currentRole}
                      disabled={!canEditThisRow || setRole.isPending}
                      onValueChange={(value) =>
                        setRole.mutate({ userId: person.id, role: value as AppRole })
                      }
                    >
                      <SelectTrigger className="w-48" aria-label={`دور ${person.full_name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((key) => (
                          <SelectItem key={key} value={key}>
                            {roleLabels[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            {withoutMembership.length > 0 && schoolId && (
              <p className="rounded-xl bg-muted/60 p-3 text-xs leading-6 text-muted-foreground">
                {withoutMembership.length} حسابًا بلا عضوية في المدرسة. أضِفهم إلى المدرسة من
                صفحة <span className="font-bold text-foreground">المدرسة</span> أولًا، ثم يصبح
                تغيير دورهم متاحًا هنا.
              </p>
            )}
          </div>
        )}
      </Panel>

      <Panel
        title="سجل التدقيق"
        description="تغييرات الأدوار والعضوية والاعتمادات، محفوظة تلقائيًا في قاعدة البيانات."
      >
        {audit.isLoading ? (
          <LoadingRows />
        ) : (audit.data ?? []).length === 0 ? (
          <EmptyState
            title="لا توجد إجراءات مسجّلة"
            description="سيظهر هنا كل تغيير في الأدوار أو العضوية مع وقته ومسجّله."
          />
        ) : (
          <ul className="space-y-2">
            {(audit.data ?? []).slice(0, 20).map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3.5 py-2.5 text-xs"
              >
                <span className="font-bold">
                  {auditActionLabel(entry.action)} — {auditEntityLabel(entry.entity_type)}
                </span>
                <span className="text-muted-foreground">
                  {entry.user_id ? (nameById.get(entry.user_id) ?? "مسجّل") : "النظام"} ·{" "}
                  {formatDateTime(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function auditActionLabel(action: string) {
  return (
    { insert: "إضافة", update: "تعديل", delete: "حذف" }[action as "insert"] ?? action
  );
}

function auditEntityLabel(entity: string) {
  return (
    {
      school_members: "عضوية في المدرسة",
      user_roles: "دور مستخدم",
    }[entity as "school_members"] ??
    entity
  );
}
