import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Check,
  Copy,
  GitBranch,
  KeyRound,
  Link2,
  Plus,
  QrCode,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel, Chip, LoadingCards, EmptyState } from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { roleLabels } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/school")({ component: SchoolWorkspacePage });

type Section = "overview" | "members" | "tree" | "permissions" | "requests";
type SchoolForm = {
  name: string;
  stage: string;
  type: string;
  city: string;
  department: string;
  district: string;
  year: string;
};
const sections: { key: Section; label: string; icon: typeof Building2 }[] = [
  { key: "overview", label: "بيانات المدرسة", icon: Building2 },
  { key: "members", label: "أعضاء المدرسة", icon: Users },
  { key: "tree", label: "الهيكل التنظيمي", icon: GitBranch },
  { key: "permissions", label: "الصلاحيات", icon: KeyRound },
  { key: "requests", label: "طلبات الانضمام", icon: Link2 },
];

function makeSchoolCode(name: string) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || "SCH";
  return `THAT-${initials}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function SchoolWorkspacePage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>("overview");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section") as Section | null;
    if (requested && sections.some((item) => item.key === requested)) setSection(requested);
  }, []);
  const [form, setForm] = useState<SchoolForm>({
    name: "",
    stage: "",
    type: "",
    city: "",
    department: "",
    district: "",
    year: "1448-1449",
  });
  const schools = useQuery({
    queryKey: ["school-workspace", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("created_at")
        .limit(1);
      if (error) throw new Error(error.message);
      return data?.[0] ?? null;
    },
  });
  const school = schools.data;
  const members = useQuery({
    queryKey: ["school-members", school?.id],
    enabled: Boolean(school?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_members")
        .select("*")
        .eq("school_id", school!.id);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const requests = useQuery({
    queryKey: ["membership-requests", school?.id],
    enabled: Boolean(school?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_requests")
        .select("*")
        .eq("school_id", school!.id)
        .eq("status", "pending");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const memberIds = (members.data ?? []).map((member) => member.user_id).sort();
  const memberProfiles = useQuery({
    queryKey: ["school-member-profiles", school?.id, memberIds.join(",")],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("id", memberIds);
      if (error) throw new Error(error.message);
      return Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]));
    },
  });
  const updateManager = useMutation({
    mutationFn: async ({ memberId, managerId }: { memberId: string; managerId: string | null }) => {
      if (!school?.id) throw new Error("تعذر تحديد المدرسة.");
      const { error } = await supabase
        .from("school_members")
        .update({ manager_id: managerId })
        .eq("id", memberId)
        .eq("school_id", school.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم تحديث الرئيس المباشر.");
      void queryClient.invalidateQueries({ queryKey: ["school-members", school?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const createSchool = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !user?.id) throw new Error("اسم المدرسة مطلوب");
      const code = makeSchoolCode(form.name);
      const { data, error } = await supabase
        .from("schools")
        .insert({
          name: form.name.trim(),
          education_stage: form.stage || null,
          education_type: form.type || null,
          city: form.city || null,
          education_department: form.department || null,
          district: form.district || null,
          school_year: form.year || null,
          code,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const { error: memberError } = await supabase
        .from("school_members")
        .insert({ school_id: data.id, user_id: user.id, role: "administrator" });
      if (memberError) throw new Error(memberError.message);
    },
    onSuccess: () => {
      toast.success("تم إنشاء مساحة المدرسة");
      void queryClient.invalidateQueries({ queryKey: ["school-workspace"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const reviewRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("membership_requests")
        .update({ status, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم تحديث طلب الانضمام");
      void queryClient.invalidateQueries({ queryKey: ["membership-requests", school?.id] });
    },
    onError: (error) => toast.error(error.message),
  });
  const treeMembers = useMemo(() => members.data ?? [], [members.data]);
  const currentMember = treeMembers.find((member) => member.user_id === user?.id);
  const canManageTree =
    isAdmin ||
    currentMember?.role === "administrator" ||
    currentMember?.role === "مدير مدرسة" ||
    currentMember?.role === "admin";

  if (schools.isLoading) return <LoadingCards count={4} />;
  if (!school)
    return (
      <CreateSchool
        form={form}
        setForm={setForm}
        onSubmit={() => createSchool.mutate()}
        pending={createSchool.isPending}
      />
    );

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="مساحة المدرسة"
        description="الهوية والعضوية والهيكل والصلاحيات في مساحة عمل واحدة معزولة."
        crumbs={[{ label: "الرئيسية", to: "/dashboard" }, { label: "المدرسة" }]}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${section === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
      {section === "overview" && (
        <Overview
          school={school}
          onCopy={() => {
            void navigator.clipboard?.writeText(school.code);
            toast.success("تم نسخ رمز المدرسة");
          }}
        />
      )}
      {section === "members" && <Members members={members.data ?? []} />}
      {section === "tree" && (
        <Tree
          members={treeMembers}
          names={memberProfiles.data ?? {}}
          canEdit={canManageTree}
          onManagerChange={(memberId, managerId) => updateManager.mutate({ memberId, managerId })}
        />
      )}
      {section === "permissions" && <Permissions />}
      {section === "requests" && (
        <Requests
          requests={requests.data ?? []}
          isAdmin={isAdmin}
          onReview={(id, status) => reviewRequest.mutate({ id, status })}
        />
      )}
    </div>
  );
}

function CreateSchool({
  form,
  setForm,
  onSubmit,
  pending,
}: {
  form: SchoolForm;
  setForm: (form: SchoolForm) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  const update = (key: keyof SchoolForm, value: string) => setForm({ ...form, [key]: value });
  const detailFields: Array<{ key: Exclude<keyof SchoolForm, "name">; label: string }> = [
    { key: "stage", label: "المرحلة التعليمية" },
    { key: "type", label: "نوع التعليم" },
    { key: "city", label: "المدينة" },
    { key: "department", label: "إدارة التعليم" },
    { key: "district", label: "الحي" },
    { key: "year", label: "العام الدراسي" },
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="أنشئ مساحة مدرستك"
        description="ابدأ بإنشاء مدرسة مستقلة، ثم أرسل رمز الانضمام للموظفين."
        crumbs={[{ label: "المدرسة" }]}
      />
      <Panel
        title="بيانات المدرسة"
        description="هذه البيانات ستظهر في التقارير والشواهد والإشعارات."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>اسم المدرسة</Label>
            <Input
              className="mt-1.5"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="مدرسة ..."
            />
          </div>
          {detailFields.map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                className="mt-1.5"
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <Button className="mt-5" onClick={onSubmit} disabled={pending}>
          <Plus size={16} /> {pending ? "جارٍ الإنشاء..." : "إنشاء مساحة المدرسة"}
        </Button>
      </Panel>
    </div>
  );
}

function Overview({
  school,
  onCopy,
}: {
  school: NonNullable<ReturnType<typeof useSchoolPlaceholder>>;
  onCopy: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel title={school.name} description="بيانات مساحة العمل المدرسية">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["المرحلة", school.education_stage],
            ["نوع التعليم", school.education_type],
            ["المدينة", school.city],
            ["إدارة التعليم", school.education_department],
            ["الحي", school.district],
            ["العام الدراسي", school.school_year],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 font-bold">{value || "غير محدد"}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="رمز الانضمام" description="استخدمه أو شارك QR مع الموظفين">
        <div className="rounded-2xl bg-navy p-5 text-center text-navy-foreground">
          <div className="mx-auto mb-4 grid h-28 w-28 grid-cols-7 gap-1 rounded-xl bg-white p-3">
            {Array.from({ length: 49 }, (_, index) => (
              <span
                key={index}
                className={
                  index % 3 === 0 || index % 7 === 2 || index === 24 ? "bg-navy" : "bg-white"
                }
              />
            ))}
          </div>
          <div className="font-mono text-lg font-black tracking-wider">{school.code}</div>
          <Button variant="secondary" className="mt-4" onClick={onCopy}>
            <Copy size={15} /> نسخ الرمز
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <QrCode size={15} /> الموظف يرسل طلب انضمام، ولا يدخل مباشرة قبل قبول المدير.
        </div>
      </Panel>
    </div>
  );
}

type SchoolLike = {
  id: string;
  name: string;
  education_stage: string | null;
  education_type: string | null;
  city: string | null;
  education_department: string | null;
  district: string | null;
  school_year: string | null;
  code: string;
};
function useSchoolPlaceholder() {
  return null as unknown as SchoolLike;
}

function Members({
  members,
}: {
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    status: string;
    manager_id: string | null;
  }>;
}) {
  return (
    <Panel title="أعضاء المدرسة" description="كل عضو مرتبط بدور ورئيس مباشر ونطاق صلاحيات.">
      {members.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title="لا يوجد أعضاء"
          description="أضف أعضاء بعد مشاركة رمز المدرسة."
        />
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-border p-4"
            >
              <div>
                <div className="font-bold">{member.user_id}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  الرئيس: {member.manager_id ?? "غير محدد"}
                </div>
              </div>
              <Chip tone={member.status === "active" ? "leaf" : "rose"}>{member.role}</Chip>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
function Tree({
  members,
  names,
  canEdit,
  onManagerChange,
}: {
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    manager_id: string | null;
    status?: string;
  }>;
  names: Record<string, { id: string; full_name: string; email: string }>;
  canEdit: boolean;
  onManagerChange: (memberId: string, managerId: string | null) => void;
}) {
  const getName = (userId: string) => names[userId]?.full_name || names[userId]?.email || userId;
  const wouldCreateCycle = (memberId: string, managerId: string) => {
    let current = members.find((member) => member.id === managerId);
    const visited = new Set<string>();
    while (current) {
      if (current.id === memberId || visited.has(current.id)) return true;
      visited.add(current.id);
      current = members.find((member) => member.id === current?.manager_id);
    }
    return false;
  };

  return (
    <Panel
      title="الهيكل التنظيمي"
      description="حدد الرئيس المباشر لكل عضو. يمنع النظام ربط عضو بنفسه أو بأحد مرؤوسيه."
    >
      <div className="space-y-3">
        {members.map((member) => {
          const manager = members.find((item) => item.id === member.manager_id);
          const role =
            roleLabels[member.role as keyof typeof roleLabels] ?? member.role ?? "عضو";
          const eligibleManagers = members.filter(
            (candidate) =>
              candidate.id !== member.id && !wouldCreateCycle(member.id, candidate.id),
          );
          return (
            <div
              key={member.id}
              className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)] sm:items-center"
            >
              <div>
                <div className="font-bold">{getName(member.user_id)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {role} · الرئيس الحالي: {manager ? getName(manager.user_id) : "غير محدد"}
                </div>
              </div>
              {canEdit ? (
                <Select
                  value={member.manager_id ?? "none"}
                  onValueChange={(value) =>
                    onManagerChange(member.id, value === "none" ? null : value)
                  }
                >
                  <SelectTrigger aria-label={`تغيير الرئيس المباشر لـ ${getName(member.user_id)}`}>
                    <SelectValue placeholder="اختر الرئيس المباشر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون رئيس مباشر</SelectItem>
                    {eligibleManagers.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {getName(candidate.user_id)} —{" "}
                        {roleLabels[candidate.role as keyof typeof roleLabels] ?? candidate.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Chip tone="muted">{role}</Chip>
              )}
            </div>
          );
        })}
        {members.length === 0 && (
          <EmptyState
            icon={<Users size={20} />}
            title="لا يوجد أعضاء"
            description="أضف أعضاء للمدرسة قبل إعداد التسلسل الإداري."
          />
        )}
      </div>
    </Panel>
  );
}
function Permissions() {
  const items = [
    "programs.view",
    "programs.create",
    "programs.approve",
    "records.view",
    "records.create",
    "records.submit",
    "reports.view",
    "reports.approve",
    "reports.export",
    "tasks.assign",
  ];
  return (
    <Panel
      title="مصفوفة الصلاحيات"
      description="الصلاحيات الأساسية قابلة للتخصيص مع نطاق own أو team أو school."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-xl border border-border p-4"
          >
            <span className="font-mono text-sm">{item}</span>
            <Chip tone="leaf">متاح للتخصيص</Chip>
          </div>
        ))}
      </div>
    </Panel>
  );
}
function Requests({
  requests,
  isAdmin,
  onReview,
}: {
  requests: Array<{ id: string; user_id: string; requested_role: string; status: string }>;
  isAdmin: boolean;
  onReview: (id: string, status: string) => void;
}) {
  return (
    <Panel
      title="طلبات الانضمام"
      description="يتم قبول الموظف أو رفضه أو تغيير دوره قبل دخوله إلى المدرسة."
    >
      {requests.length === 0 ? (
        <EmptyState
          icon={<Link2 size={20} />}
          title="لا توجد طلبات معلقة"
          description="ستظهر طلبات الموظفين هنا."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div>
                <div className="font-bold">{request.user_id}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  الدور المطلوب: {request.requested_role}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onReview(request.id, "approved")}>
                    <Check size={15} /> قبول
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReview(request.id, "rejected")}
                  >
                    <X size={15} /> رفض
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
