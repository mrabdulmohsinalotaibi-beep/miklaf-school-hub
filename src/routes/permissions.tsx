import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/miklaf/AppShell";
import { Chip, Panel } from "@/components/miklaf/primitives";
import { permissionMatrix, roles } from "@/lib/miklaf-data";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      { title: "الصلاحيات والأدوار — مِكلاف" },
      {
        name: "description",
        content: "إدارة أدوار مدير المدرسة والموجه والمعلم والإداري وصلاحياتهم.",
      },
      { property: "og:title", content: "الصلاحيات والأدوار — مِكلاف" },
      {
        property: "og:description",
        content: "إدارة أدوار مدير المدرسة والموجه والمعلم والإداري وصلاحياتهم.",
      },
    ],
  }),
  component: PermissionsPage,
});

function toneFor(level: string) {
  if (level === "كامل") return "leaf" as const;
  if (level === "جزئي") return "gold" as const;
  if (level === "قراءة") return "sea" as const;
  return "rose" as const;
}

function PermissionsPage() {
  return (
    <AppShell title="الصلاحيات والأدوار">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <div key={role.key} className="panel p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <div className="font-display text-base font-black">{role.name}</div>
              </div>
              <p className="mt-2 text-[11px] leading-6 text-muted-foreground">{role.desc}</p>
              <div className="mt-3 text-xs font-bold">{role.members} مستخدم</div>
            </div>
          ))}
        </div>

        <Panel title="مصفوفة الصلاحيات">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground">
                  <th className="pb-3 font-bold">الوحدة</th>
                  <th className="pb-3 font-bold">مدير المدرسة</th>
                  <th className="pb-3 font-bold">الموجه الطلابي</th>
                  <th className="pb-3 font-bold">المعلم</th>
                  <th className="pb-3 font-bold">الإداري</th>
                </tr>
              </thead>
              <tbody>
                {permissionMatrix.map((row) => (
                  <tr key={row.module} className="border-t border-border">
                    <td className="py-3 font-bold">{row.module}</td>
                    {[row.principal, row.counselor, row.teacher, row.admin].map((level, index) => (
                      <td key={index} className="py-3">
                        <Chip tone={toneFor(level)}>{level}</Chip>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
