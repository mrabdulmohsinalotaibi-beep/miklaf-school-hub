import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  Panel,
} from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { api, qk, type StudentRow } from "@/lib/data";
import { grades, studentStatuses } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/students/")({
  head: () => ({
    meta: [
      { title: "سجل الطلاب — مِكلاف" },
      { name: "description", content: "دليل الطلاب مع البحث والتصفية وإدارة البيانات." },
      { property: "og:title", content: "سجل الطلاب — مِكلاف" },
      { property: "og:description", content: "إدارة بيانات الطلاب والفصول وأولياء الأمور." },
    ],
  }),
  component: StudentsPage,
});

const PAGE_SIZE = 8;

type FormState = {
  id?: string;
  student_no: string;
  full_name: string;
  grade: string;
  class_id: string;
  guardian_name: string;
  guardian_phone: string;
  status: string;
  average: string;
  nationality: string;
};

type ImportRow = {
  full_name: string;
  student_no: string;
  nationality: string;
  grade: string;
  class_name: string;
  guardian_name: string;
  guardian_phone: string;
  class_id: string | null;
  valid: boolean;
  issue?: string;
};

const emptyForm: FormState = {
  student_no: "",
  full_name: "",
  grade: grades[0],
  class_id: "",
  guardian_name: "",
  guardian_phone: "",
  status: "منتظم",
  average: "0",
  nationality: "",
};

function StudentsPage() {
  const queryClient = useQueryClient();
  const students = useQuery({ queryKey: qk.students, queryFn: api.students });
  const classes = useQuery({ queryKey: qk.classes, queryFn: api.classes });

  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("all");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim();
    return (students.data ?? []).filter((student) => {
      const matchesTerm =
        !term || student.full_name.includes(term) || student.student_no.includes(term);
      const matchesGrade = grade === "all" || student.grade === grade;
      return matchesTerm && matchesGrade;
    });
  }, [students.data, search, grade]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const save = useMutation({
    mutationFn: async (values: FormState) => {
      const payload = {
        student_no: values.student_no.trim(),
        full_name: values.full_name.trim(),
        grade: values.grade,
        class_id: values.class_id || null,
        guardian_name: values.guardian_name || null,
        guardian_phone: values.guardian_phone || null,
        status: values.status,
        average: Number(values.average) || 0,
        nationality: values.nationality.trim() || null,
      };
      const { error } = values.id
        ? await supabase.from("students").update(payload).eq("id", values.id)
        : await supabase.from("students").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم حفظ بيانات الطالب");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.students });
    },
    onError: () => toast.error("تعذّر الحفظ، تأكد من عدم تكرار رقم الطالب."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم حذف الطالب");
      void queryClient.invalidateQueries({ queryKey: qk.students });
    },
    onError: () => toast.error("تعذّر حذف الطالب"),
  });

  const openEdit = (student: StudentRow) => {
    setForm({
      id: student.id,
      student_no: student.student_no,
      full_name: student.full_name,
      grade: student.grade,
      class_id: student.class_id ?? "",
      guardian_name: student.guardian_name ?? "",
      guardian_phone: student.guardian_phone ?? "",
      status: student.status,
      average: String(student.average),
      nationality: student.nationality ?? "",
    });
    setOpen(true);
  };

  const importExcel = async (file: File) => {
    setImportError("");
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("الملف لا يحتوي على ورقة عمل.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (rows.length === 0) throw new Error("لا توجد بيانات بعد صف العناوين.");
      // Missing columns are treated as blank values so the available data is still imported.
      const classRows = classes.data ?? [];
      const usedNumbers = new Set((students.data ?? []).map((student) => student.student_no));
      const parsed = rows.map((row, index) => {
        const text = (key: string) => String(row[key] ?? "").trim();
        const className = text("الفصل");
        const matchedClass = classRows.find((item) => item.name.trim() === className);
        const originalName = text("اسم الطالب");
        const originalNumber = text("رقم الهوية / السجل المدني");
        let studentNo = originalNumber || `IMPORT-${Date.now()}-${index + 1}`;
        while (usedNumbers.has(studentNo)) studentNo = `${studentNo}-${index + 1}`;
        usedNumbers.add(studentNo);
        const fullName = originalName || `غير محدد — ${studentNo}`;
        const warnings = [
          !originalName ? "الاسم ناقص" : "",
          !originalNumber ? "رقم الهوية ناقص وتم إنشاء رقم مؤقت" : "",
          className && !matchedClass ? "الفصل غير موجود" : "",
        ].filter(Boolean);
        return {
          full_name: fullName,
          student_no: studentNo,
          nationality: text("الجنسية"),
          grade: text("الصف الدراسي") || grades[0],
          class_name: className,
          guardian_name: text("اسم ولي الأمر"),
          guardian_phone: text("رقم جوال ولي الأمر"),
          class_id: matchedClass?.id ?? null,
          valid: true,
          issue: warnings.join("، ") || undefined,
        } satisfies ImportRow;
      });
      setImportRows(parsed);
      setImportOpen(true);
    } catch (reason) {
      setImportError(reason instanceof Error ? reason.message : "تعذر قراءة ملف Excel");
      setImportRows([]);
      setImportOpen(true);
    }
  };

  const saveImport = async () => {
    const validRows = importRows.filter((row) => row.valid);
    if (!validRows.length) return;
    setImporting(true);
    const { error } = await supabase.from("students").insert(
      validRows.map((row) => ({
        full_name: row.full_name,
        student_no: row.student_no,
        nationality: row.nationality || null,
        grade: row.grade,
        class_id: row.class_id,
        guardian_name: row.guardian_name || null,
        guardian_phone: row.guardian_phone || null,
        status: "منتظم",
        average: 0,
      })),
    );
    setImporting(false);
    if (error) {
      toast.error(
        error.message.includes("duplicate")
          ? "يوجد رقم هوية مكرر في البيانات"
          : "تعذر استيراد الطلاب",
      );
      return;
    }
    toast.success(`تم استيراد ${validRows.length} طالبًا بنجاح`);
    setImportOpen(false);
    setImportRows([]);
    void queryClient.invalidateQueries({ queryKey: qk.students });
  };

  return (
    <>
      <PageHeader
        title="سجل الطلاب"
        description="جميع الطلاب المسجلين في المدرسة مع بياناتهم الأساسية."
        crumbs={[{ label: "الرئيسية", to: "/dashboard" }, { label: "سجل الطلاب" }]}
        action={
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold transition-colors hover:bg-muted">
              <Upload size={16} /> استيراد Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importExcel(file);
                  event.target.value = "";
                }}
              />
            </label>
            <Button
              onClick={() => {
                setForm(emptyForm);
                setOpen(true);
              }}
            >
              <Plus size={16} /> إضافة طالب
            </Button>
          </div>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="ابحث بالاسم أو رقم الطالب"
              className="pr-9"
            />
          </div>
          <Select
            value={grade}
            onValueChange={(value) => {
              setGrade(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الصفوف</SelectItem>
              {grades.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {students.isLoading ? (
          <LoadingRows />
        ) : students.isError ? (
          <ErrorState />
        ) : current.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="لا يوجد طلاب مطابقون"
            description="جرّب تعديل البحث أو أضف طالبًا جديدًا."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الرقم</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الصف</TableHead>
                  <TableHead className="text-right">الجنسية</TableHead>
                  <TableHead className="text-right">ولي الأمر</TableHead>
                  <TableHead className="text-right">المعدل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs">{student.student_no}</TableCell>
                    <TableCell className="font-bold">
                      <Link
                        to="/students/$id"
                        params={{ id: student.id }}
                        className="transition-colors hover:text-primary"
                      >
                        {student.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.nationality ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {student.guardian_name ?? "—"} · {student.guardian_phone ?? "—"}
                    </TableCell>
                    <TableCell>{Number(student.average)}</TableCell>
                    <TableCell>
                      <Chip
                        tone={
                          student.status === "منتظم" || student.status === "متفوق" ? "leaf" : "gold"
                        }
                      >
                        {student.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(student)}
                          aria-label="تعديل"
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove.mutate(student.id)}
                          aria-label="حذف"
                        >
                          <Trash2 size={15} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              صفحة {page + 1} من {pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "تعديل بيانات طالب" : "إضافة طالب جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>رقم الطالب</Label>
              <Input
                className="mt-1.5"
                value={form.student_no}
                onChange={(event) => setForm({ ...form, student_no: event.target.value })}
              />
            </div>
            <div>
              <Label>الاسم الكامل</Label>
              <Input
                className="mt-1.5"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              />
            </div>
            <div>
              <Label>الصف</Label>
              <Select
                value={form.grade}
                onValueChange={(value) => setForm({ ...form, grade: value })}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الفصل</Label>
              <Select
                value={form.class_id || "none"}
                onValueChange={(value) =>
                  setForm({ ...form, class_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون فصل</SelectItem>
                  {(classes.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ولي الأمر</Label>
              <Input
                className="mt-1.5"
                value={form.guardian_name}
                onChange={(event) => setForm({ ...form, guardian_name: event.target.value })}
              />
            </div>
            <div>
              <Label>الجنسية</Label>
              <Input
                className="mt-1.5"
                value={form.nationality}
                onChange={(event) => setForm({ ...form, nationality: event.target.value })}
              />
            </div>
            <div>
              <Label>جوال ولي الأمر</Label>
              <Input
                className="mt-1.5"
                value={form.guardian_phone}
                onChange={(event) => setForm({ ...form, guardian_phone: event.target.value })}
              />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value })}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {studentStatuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المعدل</Label>
              <Input
                className="mt-1.5"
                type="number"
                value={form.average}
                onChange={(event) => setForm({ ...form, average: event.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (!form.student_no.trim() || !form.full_name.trim()) {
                  toast.error("رقم الطالب والاسم مطلوبان");
                  return;
                }
                save.mutate(form);
              }}
              disabled={save.isPending}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-sea" /> معاينة استيراد بيانات الطلاب
            </DialogTitle>
          </DialogHeader>
          {importError ? (
            <div className="rounded-xl border border-rose/30 bg-rose-soft p-4 text-sm text-rose">
              {importError}
              <p className="mt-2 text-xs text-muted-foreground">
                يجب أن تكون عناوين الأعمدة مطابقة للنموذج المرفق تمامًا.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sea-soft p-4 text-sm">
                <span>تمت قراءة {importRows.length} صفًا. راجع المعاينة قبل الحفظ.</span>
                <span className="font-bold text-sea">
                  {importRows.filter((row) => row.valid).length} صالح للحفظ
                </span>
              </div>
              <div className="max-h-[48vh] overflow-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الحالة</TableHead>
                      <TableHead>اسم الطالب</TableHead>
                      <TableHead>رقم الهوية</TableHead>
                      <TableHead>الجنسية</TableHead>
                      <TableHead>الصف</TableHead>
                      <TableHead>الفصل</TableHead>
                      <TableHead>ولي الأمر</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.slice(0, 100).map((row, index) => (
                      <TableRow key={`${row.student_no}-${index}`}>
                        <TableCell>
                          {row.valid ? (
                            <CheckCircle2 size={17} className="text-sea" aria-label="صالح" />
                          ) : (
                            <span className="text-xs text-rose">{row.issue}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold">{row.full_name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{row.student_no || "—"}</TableCell>
                        <TableCell>{row.nationality || "—"}</TableCell>
                        <TableCell>{row.grade}</TableCell>
                        <TableCell>{row.class_name || "—"}</TableCell>
                        <TableCell>{row.guardian_name || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {importRows.length > 100 && (
                <p className="text-xs text-muted-foreground">
                  تظهر أول 100 صف في المعاينة، وسيتم حفظ جميع الصفوف الصالحة.
                </p>
              )}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              إلغاء
            </Button>
            {!importError && (
              <Button
                onClick={() => void saveImport()}
                disabled={importing || !importRows.some((row) => row.valid)}
              >
                {importing ? "جارٍ الاستيراد..." : "حفظ الطلاب"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
