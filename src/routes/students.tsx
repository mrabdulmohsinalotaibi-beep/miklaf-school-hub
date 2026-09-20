import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/miklaf/AppShell";
import { Bar, Chip, Panel } from "@/components/miklaf/primitives";
import { Input } from "@/components/ui/input";
import { classes, students } from "@/lib/miklaf-data";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "سجل الطلاب — مِكلاف" },
      { name: "description", content: "دليل الطلاب والفصول والحضور والدرجات وملفات الطلاب." },
      { property: "og:title", content: "سجل الطلاب — مِكلاف" },
      {
        property: "og:description",
        content: "دليل الطلاب والفصول والحضور والدرجات وملفات الطلاب.",
      },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("الكل");
  const [selectedId, setSelectedId] = useState(students[0].id);

  const grades = ["الكل", ...Array.from(new Set(students.map((s) => s.grade)))];

  const filtered = useMemo(
    () =>
      students.filter(
        (student) =>
          (grade === "الكل" || student.grade === grade) &&
          (student.name.includes(query.trim()) || student.id.includes(query.trim())),
      ),
    [query, grade],
  );

  const selected = students.find((student) => student.id === selectedId) ?? students[0];

  return (
    <AppShell title="سجل الطلاب">
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث بالاسم أو رقم الطالب"
                  className="pr-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grades.map((item) => (
                  <button
                    key={item}
                    onClick={() => setGrade(item)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                      grade === item
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-right text-sm">
                <thead>
                  <tr className="text-[11px] text-muted-foreground">
                    <th className="pb-3 font-bold">الطالب</th>
                    <th className="pb-3 font-bold">الصف</th>
                    <th className="pb-3 font-bold">الحضور</th>
                    <th className="pb-3 font-bold">المعدل</th>
                    <th className="pb-3 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedId(student.id)}
                      className={`cursor-pointer border-t border-border transition hover:bg-muted ${
                        selectedId === student.id ? "bg-muted" : ""
                      }`}
                    >
                      <td className="py-3">
                        <div className="font-bold">{student.name}</div>
                        <div className="text-[11px] text-muted-foreground">{student.id}</div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {student.grade} · {student.section}
                      </td>
                      <td className="py-3">{student.attendance}%</td>
                      <td className="py-3">{student.average}</td>
                      <td className="py-3">
                        <Chip
                          tone={
                            student.status === "متفوق"
                              ? "leaf"
                              : student.status === "منتظم"
                                ? "sea"
                                : student.status === "إنذار غياب"
                                  ? "rose"
                                  : "gold"
                          }
                        >
                          {student.status}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
              )}
            </div>
          </Panel>

          <Panel title="الفصول الدراسية">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((item) => (
                <div key={item.name} className="rounded-xl border border-border p-4">
                  <div className="font-display text-lg font-black">فصل {item.name}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    رائد الفصل: {item.teacher}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold">
                    <span>{item.students} طالبًا</span>
                    <span className="text-muted-foreground">{item.attendance}%</span>
                  </div>
                  <div className="mt-2">
                    <Bar value={item.attendance} tone="sea" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="ملف الطالب">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <UserRound size={24} />
            </div>
            <div>
              <div className="font-display text-lg font-black">{selected.name}</div>
              <div className="text-xs text-muted-foreground">
                {selected.id} · {selected.grade} · {selected.section}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <div className="text-[11px] text-muted-foreground">نسبة الحضور</div>
              <div className="mt-1 font-display text-2xl font-black">{selected.attendance}%</div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-[11px] text-muted-foreground">المعدل العام</div>
              <div className="mt-1 font-display text-2xl font-black">{selected.average}</div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              <span className="text-muted-foreground">الحالة</span>
              <span className="font-bold">{selected.status}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone size={13} /> ولي الأمر
              </span>
              <span className="font-bold" dir="ltr">
                {selected.guardian}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-bold text-muted-foreground">آخر الملاحظات</div>
            <ul className="space-y-2 text-sm leading-6">
              <li className="rounded-xl bg-muted p-3">تحسن ملحوظ في مادة الرياضيات خلال آخر شهرين.</li>
              <li className="rounded-xl bg-muted p-3">تم إشعار ولي الأمر بغياب يومي الأحد والإثنين.</li>
            </ul>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
