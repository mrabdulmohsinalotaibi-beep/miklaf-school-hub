import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ClipboardList, FileText, Plus, Send, Signature } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Chip, EmptyState, ErrorState, LoadingRows, PageHeader, Panel } from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDate, roleLabels, taskStatusLabels } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/work-center")({
  head: () => ({
    meta: [
      { title: "مركز الأعمال — مِكلاف" },
      { name: "description", content: "إسناد الأعمال يدويًا، تعبئة النماذج، ومتابعة الاعتمادات بالتسلسل." },
      { property: "og:title", content: "مركز الأعمال — مِكلاف" },
      { property: "og:description", content: "مهام المدرسة ونماذجها واعتماداتها في مساحة موحدة." },
    ],
  }),
  component: WorkCenterPage,
});

type FormFieldDefinition = { key: string; label: string; type: string; required?: boolean };
type WorkflowTemplate = {
  id: string;
  title: string;
  topic: string;
  field_schema: unknown;
  signature_roles: unknown;
};
type SchoolMember = {
  id: string;
  school_id: string;
  user_id: string;
  role: string;
  manager_id: string | null;
  status: string;
  profile: { full_name: string; email: string } | null;
};
type PlanTask = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  assigned_to: string | null;
  supervisor_id: string | null;
  school_id: string | null;
  topic: string;
  template_id: string | null;
  form_data: Record<string, string>;
  workflow_status: string;
  progress: number;
  status: "not_started" | "in_progress" | "done";
};
type TaskSignature = {
  id: string;
  school_id: string;
  task_id: string;
  step_order: number;
  signer_id: string;
  signer_name: string | null;
  signer_role: string;
  signature_text: string | null;
  status: "pending" | "signed" | "returned";
  comment: string | null;
  signed_at: string | null;
};

const createTaskSchema = z.object({
  title: z.string().trim().min(2, "أدخل عنوانًا واضحًا للمهمة."),
  description: z.string().optional(),
  templateId: z.string().min(1, "اختر نموذجًا."),
  assigneeId: z.string().min(1, "حدد الموظف المسؤول."),
  supervisorId: z.string().optional(),
  dueDate: z.string().optional(),
});
type CreateTaskValues = z.infer<typeof createTaskSchema>;

const statusLabels: Record<string, string> = {
  assigned: "مسندة",
  in_progress: "قيد التنفيذ",
  submitted: "بانتظار الاعتماد",
  returned: "تحتاج استكمالًا",
  approved: "معتمدة",
};

function getFields(template?: WorkflowTemplate | null): FormFieldDefinition[] {
  if (!template || !Array.isArray(template.field_schema)) return [];
  return template.field_schema.filter(
    (field): field is FormFieldDefinition =>
      typeof field === "object" &&
      field !== null &&
      "key" in field &&
      "label" in field &&
      typeof field.key === "string" &&
      typeof field.label === "string",
  );
}

function WorkCenterPage() {
  const { user, roles, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"mine" | "assigned" | "approvals" | "templates">("mine");
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewers, setReviewers] = useState<string[]>([""]);
  const [submissionTask, setSubmissionTask] = useState<PlanTask | null>(null);
  const [submission, setSubmission] = useState<Record<string, string>>({});
  const [signatureStep, setSignatureStep] = useState<TaskSignature | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [signatureComment, setSignatureComment] = useState("");

  const createForm = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      templateId: "",
      assigneeId: "",
      supervisorId: "",
      dueDate: "",
    },
  });

  const schoolQuery = useQuery({
    queryKey: ["workflow-center-school", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id,name")
        .order("created_at")
        .limit(1);
      if (error) throw new Error(error.message);
      return data?.[0] ?? null;
    },
  });
  const school = schoolQuery.data;
  const peopleQuery = useQuery({
    queryKey: ["workflow-center-people", school?.id],
    enabled: Boolean(school?.id),
    queryFn: async () => {
      const { data: members, error: memberError } = await supabase
        .from("school_members")
        .select("id,school_id,user_id,role,manager_id,status")
        .eq("school_id", school!.id)
        .eq("status", "active")
        .order("joined_at");
      if (memberError) throw new Error(memberError.message);
      const ids = (members ?? []).map((member) => member.user_id);
      if (ids.length === 0) return [] as SchoolMember[];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("id", ids);
      if (profileError) throw new Error(profileError.message);
      const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      return (members ?? []).map((member) => ({
        ...member,
        profile: profileById.get(member.user_id) ?? null,
      })) as SchoolMember[];
    },
  });
  const people = peopleQuery.data ?? [];
  const templatesQuery = useQuery({
    queryKey: ["workflow-center-templates", school?.id],
    enabled: Boolean(school?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_templates")
        .select("id,title,topic,field_schema,signature_roles")
        .order("title");
      if (error) throw new Error(error.message);
      return (data ?? []) as WorkflowTemplate[];
    },
  });
  const tasksQuery = useQuery({
    queryKey: ["workflow-center-tasks", school?.id],
    enabled: Boolean(school?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_tasks")
        .select("*")
        .eq("school_id", school!.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as PlanTask[];
    },
  });
  const signaturesQuery = useQuery({
    queryKey: ["workflow-center-signatures", school?.id],
    enabled: Boolean(school?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_signatures")
        .select("*")
        .eq("school_id", school!.id)
        .order("step_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as TaskSignature[];
    },
  });

  const canAssign =
    isAdmin ||
    roles.some((role) =>
      ["administrator", "educational_deputy", "school_deputy", "student_affairs_deputy"].includes(
        role,
      ),
    );
  const templates = templatesQuery.data ?? [];
  const allTasks = tasksQuery.data ?? [];
  const allSignatures = signaturesQuery.data ?? [];
  const visibleTasks = useMemo(() => {
    if (canAssign) return allTasks;
    const signatureTaskIds = new Set(
      allSignatures.filter((step) => step.signer_id === user?.id).map((step) => step.task_id),
    );
    return allTasks.filter(
      (task) =>
        task.assigned_to === user?.id ||
        task.supervisor_id === user?.id ||
        signatureTaskIds.has(task.id),
    );
  }, [allSignatures, allTasks, canAssign, user?.id]);
  const myTasks = visibleTasks.filter((task) => task.assigned_to === user?.id);
  const assignedTasks = canAssign
    ? visibleTasks
    : visibleTasks.filter((task) => task.supervisor_id === user?.id);
  const myApprovalSteps = allSignatures.filter(
    (step) =>
      step.signer_id === user?.id &&
      step.status === "pending" &&
      !allSignatures.some(
        (prior) =>
          prior.task_id === step.task_id &&
          prior.step_order < step.step_order &&
          prior.status !== "signed",
      ),
  );

  const createTask = useMutation({
    mutationFn: async (values: CreateTaskValues) => {
      if (!school?.id || !user?.id) throw new Error("يجب إنشاء مساحة المدرسة وتسجيل الدخول أولًا.");
      const template = templates.find((item) => item.id === values.templateId);
      const assignee = people.find((member) => member.user_id === values.assigneeId);
      if (!template || !assignee) throw new Error("تعذر تحديد النموذج أو الموظف المسؤول.");
      const orderedReviewers = reviewers
        .filter(Boolean)
        .map((id) => people.find((member) => member.user_id === id))
        .filter((member): member is SchoolMember => Boolean(member));
      if (orderedReviewers.length === 0) throw new Error("حدد شخصًا واحدًا على الأقل للاعتماد.");
      if (new Set(orderedReviewers.map((member) => member.user_id)).size !== orderedReviewers.length)
        throw new Error("لا تكرر الشخص نفسه في أكثر من خطوة اعتماد.");

      const { data: task, error: taskError } = await supabase
        .from("plan_tasks")
        .insert({
          title: values.title.trim(),
          description: values.description?.trim() || null,
          owner: assignee.profile?.full_name || assignee.profile?.email || null,
          due_date: values.dueDate || null,
          created_by: user.id,
          school_id: school.id,
          assigned_to: assignee.user_id,
          supervisor_id: values.supervisorId || null,
          topic: template.topic,
          template_id: template.id,
          form_data: {},
          workflow_status: "assigned",
          status: "not_started",
          progress: 0,
          is_demo: false,
        })
        .select("id")
        .single();
      if (taskError) throw new Error(taskError.message);

      const { error: signatureError } = await supabase.from("task_signatures").insert(
        orderedReviewers.map((member, index) => ({
          school_id: school.id,
          task_id: task.id,
          step_order: index + 1,
          signer_id: member.user_id,
          signer_role: roleLabels[member.role as keyof typeof roleLabels] ?? member.role,
          status: "pending" as const,
          assigned_by: user.id,
        })),
      );
      if (signatureError) {
        await supabase.from("plan_tasks").delete().eq("id", task.id);
        throw new Error(signatureError.message);
      }
    },
    onSuccess: () => {
      toast.success("تم إسناد المهمة وإنشاء تسلسل الاعتماد.");
      setCreateOpen(false);
      setReviewers([""]);
      createForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["workflow-center-tasks", school?.id] });
      void queryClient.invalidateQueries({ queryKey: ["workflow-center-signatures", school?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitTask = useMutation({
    mutationFn: async () => {
      if (!submissionTask || !user?.id) throw new Error("تعذر تحديد المهمة.");
      if (submissionTask.assigned_to !== user.id) throw new Error("هذه المهمة ليست مسندة إليك.");
      const template = templates.find((item) => item.id === submissionTask.template_id);
      const missing = getFields(template).filter(
        (field) => field.required && !submission[field.key]?.trim(),
      );
      if (missing.length) throw new Error(`أكمل الحقول المطلوبة: ${missing.map((item) => item.label).join("، ")}.`);
      const { error } = await supabase
        .from("plan_tasks")
        .update({
          form_data: submission,
          workflow_status: "submitted",
          status: "in_progress",
          progress: 100,
        })
        .eq("id", submissionTask.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم إرسال النموذج إلى مسار الاعتماد.");
      setSubmissionTask(null);
      setSubmission({});
      void queryClient.invalidateQueries({ queryKey: ["workflow-center-tasks", school?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const signTask = useMutation({
    mutationFn: async () => {
      if (!signatureStep || !signatureName.trim()) throw new Error("اكتب اسمك لإتمام التوقيع.");
      const { error } = await supabase
        .from("task_signatures")
        .update({
          status: "signed",
          signer_name: signatureName.trim(),
          signature_text: signatureName.trim(),
          comment: signatureComment.trim() || null,
          signed_at: new Date().toISOString(),
        })
        .eq("id", signatureStep.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم تسجيل توقيعك.");
      setSignatureStep(null);
      setSignatureName("");
      setSignatureComment("");
      void queryClient.invalidateQueries({ queryKey: ["workflow-center-signatures", school?.id] });
      void queryClient.invalidateQueries({ queryKey: ["workflow-center-tasks", school?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selectedTemplateId = createForm.watch("templateId");
  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) ?? null;
  const openSubmission = (task: PlanTask) => {
    setSubmissionTask(task);
    setSubmission(task.form_data ?? {});
  };
  if (schoolQuery.isLoading) return <LoadingRows />;
  if (schoolQuery.isError) return <ErrorState />;
  if (!school) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader title="مركز الأعمال" description="إسناد المهام والنماذج والاعتمادات." />
        <Panel>
          <EmptyState
            icon={<ClipboardList size={20} />}
            title="أنشئ مساحة المدرسة أولًا"
            description="تحتاج المهام والرسائل والتواقيع إلى مساحة مدرسة مشتركة."
            action={
              <Button asChild>
                <Link to="/school">إعداد المدرسة</Link>
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="مركز الأعمال"
        description="إسناد يدوي، ونماذج موحدة حسب الموضوع، واعتمادات مرتبة باسم كل مسؤول."
        crumbs={[{ label: "الرئيسية", to: "/dashboard" }, { label: "مركز الأعمال" }]}
        action={
          canAssign ? (
            <Button
              onClick={() => {
                createForm.reset({
                  title: "",
                  description: "",
                  templateId: templates[0]?.id ?? "",
                  assigneeId: "",
                  supervisorId: "",
                  dueDate: "",
                });
                setReviewers([""]);
                setCreateOpen(true);
              }}
              data-testid="button-assign-task"
            >
              <Plus size={16} /> إسناد عمل
            </Button>
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        {[
          { key: "mine", label: `مهامي (${myTasks.length})` },
          ...(canAssign ? [{ key: "assigned", label: `الأعمال المسندة (${assignedTasks.length})` }] : []),
          { key: "approvals", label: `اعتماداتي (${myApprovalSteps.length})` },
          { key: "templates", label: "النماذج" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key as typeof view)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              view === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
            data-testid={`tab-${item.key}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(tasksQuery.isError || peopleQuery.isError || templatesQuery.isError || signaturesQuery.isError) && (
        <ErrorState />
      )}
      {(tasksQuery.isLoading || peopleQuery.isLoading || templatesQuery.isLoading || signaturesQuery.isLoading) && (
        <LoadingRows />
      )}

      {view === "templates" && (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const fields = getFields(template);
            const rolesInOrder = Array.isArray(template.signature_roles)
              ? template.signature_roles.filter((role): role is string => typeof role === "string")
              : [];
            return (
              <Panel key={template.id} title={template.title} description={`موضوع النموذج: ${template.topic}`}>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-bold text-muted-foreground">الحقول الموحدة</div>
                    <div className="flex flex-wrap gap-2">
                      {fields.map((field) => (
                        <Chip key={field.key} tone={field.required ? "sea" : "muted"}>
                          {field.label}{field.required ? " · مطلوب" : ""}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold text-muted-foreground">المسار المقترح للتوقيع</div>
                    <ol className="space-y-2">
                      {rolesInOrder.map((role, index) => (
                        <li key={`${role}-${index}`} className="flex items-center gap-2 text-sm">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-xs font-bold">
                            {index + 1}
                          </span>
                          {role}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </Panel>
            );
          })}
          {templates.length === 0 && (
            <Panel>
              <EmptyState
                icon={<FileText size={20} />}
                title="لا توجد نماذج بعد"
                description="تظهر النماذج المعتمدة للمدرسة هنا."
              />
            </Panel>
          )}
        </div>
      )}

      {view === "approvals" && (
        <div className="space-y-4">
          {myApprovalSteps.map((step) => {
            const task = visibleTasks.find((item) => item.id === step.task_id);
            if (!task) return null;
            const chain = allSignatures
              .filter((item) => item.task_id === task.id)
              .sort((a, b) => a.step_order - b.step_order);
            return (
              <TaskCard
                key={step.id}
                task={task}
                people={people}
                template={templates.find((item) => item.id === task.template_id)}
                signatures={chain}
                currentUserId={user?.id}
                onSubmit={() => openSubmission(task)}
                onSign={() => {
                  setSignatureStep(step);
                  setSignatureName("");
                  setSignatureComment("");
                }}
              />
            );
          })}
          {myApprovalSteps.length === 0 && (
            <Panel>
              <EmptyState
                icon={<Signature size={20} />}
                title="لا توجد اعتمادات بانتظارك"
                description="يظهر كل اعتماد عند وصول دوره في التسلسل المحدد."
              />
            </Panel>
          )}
        </div>
      )}

      {(view === "mine" || view === "assigned") && (
        <div className="space-y-4">
          {(view === "mine" ? myTasks : assignedTasks).map((task) => {
            const chain = allSignatures
              .filter((item) => item.task_id === task.id)
              .sort((a, b) => a.step_order - b.step_order);
            return (
              <TaskCard
                key={task.id}
                task={task}
                people={people}
                template={templates.find((item) => item.id === task.template_id)}
                signatures={chain}
                currentUserId={user?.id}
                onSubmit={() => openSubmission(task)}
                onSign={() => {
                  const nextStep = myApprovalSteps.find((item) => item.task_id === task.id);
                  if (!nextStep) return;
                  setSignatureStep(nextStep);
                  setSignatureName("");
                  setSignatureComment("");
                  setView("approvals");
                }}
              />
            );
          })}
          {(view === "mine" ? myTasks : assignedTasks).length === 0 && (
            <Panel>
              <EmptyState
                icon={<ClipboardList size={20} />}
                title={view === "mine" ? "لا توجد مهام مسندة إليك" : "لا توجد أعمال مسندة"}
                description={
                  view === "mine"
                    ? "عند إسناد عمل لك سيظهر هنا مع نموذجه وموعده."
                    : "أنشئ مهمة جديدة وحدد الموظف المسؤول ومسار اعتمادها."
                }
              />
            </Panel>
          )}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) createForm.reset();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>إسناد عمل يدويًا</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((values) => createTask.mutate(values))} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان العمل</FormLabel>
                    <FormControl><Input {...field} data-testid="input-task-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تفاصيل إضافية</FormLabel>
                    <FormControl><Textarea rows={2} {...field} data-testid="input-task-description" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نموذج الموضوع</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-template"><SelectValue placeholder="اختر النموذج" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموظف المسؤول</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-assignee"><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {people.map((person) => (
                            <SelectItem key={person.user_id} value={person.user_id}>
                              {person.profile?.full_name || person.profile?.email || person.user_id} —{" "}
                              {roleLabels[person.role as keyof typeof roleLabels] ?? person.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="supervisorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرئيس المباشر (اختياري)</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-supervisor"><SelectValue placeholder="اختر الرئيس" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون رئيس مباشر</SelectItem>
                          {people.map((person) => (
                            <SelectItem key={person.user_id} value={person.user_id}>
                              {person.profile?.full_name || person.profile?.email || person.user_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الاستحقاق</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-task-due-date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold">ترتيب الاعتماد والتوقيع</div>
                    <p className="mt-1 text-xs text-muted-foreground">ينتقل الطلب إلى الشخص التالي بعد إتمام التوقيع السابق.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setReviewers((current) => [...current, ""])} data-testid="button-add-reviewer">
                    <Plus size={14} /> إضافة خطوة
                  </Button>
                </div>
                {reviewers.map((reviewerId, index) => (
                  <div key={`reviewer-${index}`} className="grid gap-2 sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:items-center">
                    <Label className="text-xs">الخطوة {index + 1}</Label>
                    <Select value={reviewerId || "unassigned"} onValueChange={(value) => setReviewers((current) => current.map((item, itemIndex) => itemIndex === index ? (value === "unassigned" ? "" : value) : item))}>
                      <SelectTrigger data-testid={`select-reviewer-${index}`}><SelectValue placeholder="اختر المعتمد" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">اختر المعتمد</SelectItem>
                        {people.map((person) => (
                          <SelectItem key={person.user_id} value={person.user_id}>
                            {person.profile?.full_name || person.profile?.email || person.user_id} —{" "}
                            {roleLabels[person.role as keyof typeof roleLabels] ?? person.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {reviewers.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setReviewers((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`حذف خطوة الاعتماد ${index + 1}`}>
                        إزالة
                      </Button>
                    )}
                  </div>
                ))}
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground">
                    النموذج يقترح: {Array.isArray(selectedTemplate.signature_roles) ? selectedTemplate.signature_roles.join(" ← ") : "مسار اعتماد حسب المدرسة"}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createTask.isPending || !school?.id} data-testid="button-submit-task">
                  <Send size={15} /> {createTask.isPending ? "جارٍ الإسناد..." : "إسناد العمل"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(submissionTask)} onOpenChange={(open) => !open && setSubmissionTask(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>نموذج إنجاز العمل</DialogTitle></DialogHeader>
          {submissionTask && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitTask.mutate();
              }}
            >
              <div className="rounded-xl bg-muted p-3">
                <div className="font-bold">{submissionTask.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {templates.find((item) => item.id === submissionTask.template_id)?.title ?? "نموذج العمل"}
                </div>
              </div>
              {getFields(templates.find((item) => item.id === submissionTask.template_id)).map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`submission-${field.key}`}>
                    {field.label}{field.required ? " *" : ""}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={`submission-${field.key}`}
                      rows={3}
                      value={submission[field.key] ?? ""}
                      onChange={(event) => setSubmission((current) => ({ ...current, [field.key]: event.target.value }))}
                      required={field.required}
                      data-testid={`input-submission-${field.key}`}
                    />
                  ) : (
                    <Input
                      id={`submission-${field.key}`}
                      value={submission[field.key] ?? ""}
                      onChange={(event) => setSubmission((current) => ({ ...current, [field.key]: event.target.value }))}
                      required={field.required}
                      data-testid={`input-submission-${field.key}`}
                    />
                  )}
                </div>
              ))}
              <DialogFooter>
                <Button type="submit" disabled={submitTask.isPending} data-testid="button-submit-work">
                  {submitTask.isPending ? "جارٍ الإرسال..." : "إرسال للاعتماد"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(signatureStep)}
        onOpenChange={(open) => {
          if (!open) {
            setSignatureStep(null);
            setSignatureName("");
            setSignatureComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>اعتماد وتوقيع</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {signatureStep?.signer_role} — لا يمكن التوقيع قبل اكتمال الخطوات السابقة.
            </p>
            <div>
              <Label htmlFor="signature-name">الاسم كما سيظهر في سجل الاعتماد</Label>
              <Input
                id="signature-name"
                value={signatureName}
                onChange={(event) => setSignatureName(event.target.value)}
                autoComplete="name"
                data-testid="input-signature-name"
              />
            </div>
            <div>
              <Label htmlFor="signature-comment">ملاحظة (اختيارية)</Label>
              <Textarea
                id="signature-comment"
                value={signatureComment}
                onChange={(event) => setSignatureComment(event.target.value)}
                rows={3}
                data-testid="input-signature-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => signTask.mutate()} disabled={signTask.isPending || !signatureName.trim()} data-testid="button-sign-task">
              <Check size={15} /> {signTask.isPending ? "جارٍ التوقيع..." : "توقيع واعتماد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  people,
  template,
  signatures,
  currentUserId,
  onSubmit,
  onSign,
}: {
  task: PlanTask;
  people: SchoolMember[];
  template?: WorkflowTemplate | undefined;
  signatures: TaskSignature[];
  currentUserId?: string | undefined;
  onSubmit: () => void;
  onSign: () => void;
}) {
  const assignee = people.find((person) => person.user_id === task.assigned_to);
  const reviewer = signatures.find(
    (step) => step.signer_id === currentUserId && step.status === "pending",
  );
  const fields = getFields(template);
  const managerCanSeeSubmission = Boolean(task.form_data && Object.keys(task.form_data).length);
  const personName = (person?: SchoolMember) =>
    person?.profile?.full_name || person?.profile?.email || "غير محدد";

  return (
    <Panel className="animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-black">{task.title}</h2>
            <Chip tone={task.workflow_status === "approved" ? "leaf" : task.workflow_status === "submitted" ? "gold" : "sea"}>
              {statusLabels[task.workflow_status] ?? statusLabels["assigned"]}
            </Chip>
            {template && <Chip tone="muted">{template.title}</Chip>}
          </div>
          {task.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Chip tone="sea">المسؤول: {personName(assignee)}</Chip>
            <Chip tone="gold">الاستحقاق: {formatDate(task.due_date)}</Chip>
            <Chip tone="muted">{taskStatusLabels[task.status]}</Chip>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {task.assigned_to === currentUserId && task.workflow_status !== "submitted" && task.workflow_status !== "approved" && (
            <Button size="sm" onClick={onSubmit} data-testid={`button-fill-task-${task.id}`}>
              <FileText size={14} /> تعبئة النموذج
            </Button>
          )}
          {reviewer && (
            <Button size="sm" onClick={onSign} data-testid={`button-sign-task-${task.id}`}>
              <Signature size={14} /> اعتماد
            </Button>
          )}
        </div>
      </div>
      {signatures.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-3 text-xs font-bold text-muted-foreground">تسلسل التوقيعات الإداري</div>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {signatures.map((step) => {
              const signatory = people.find((person) => person.user_id === step.signer_id);
              return (
                <li key={step.id} className="flex items-start gap-2 rounded-xl bg-muted/70 p-3 text-sm">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${step.status === "signed" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                    {step.status === "signed" ? <Check size={13} /> : step.step_order}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold">{step.signer_role}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {step.signer_name || personName(signatory)}
                    </div>
                    {step.status === "signed" && (
                      <div className="mt-1 text-xs text-primary">
                        {step.signature_text} · {formatDate(step.signed_at)}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {managerCanSeeSubmission && task.workflow_status !== "assigned" && (
        <details className="mt-4 rounded-xl border border-border p-3">
          <summary className="cursor-pointer text-sm font-bold">عرض إجابة النموذج</summary>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs font-bold text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm">{task.form_data[field.key] || "—"}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </Panel>
  );
}