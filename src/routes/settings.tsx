import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/miklaf/AppShell";
import { Panel } from "@/components/miklaf/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { school } from "@/lib/miklaf-data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — مِكلاف" },
      { name: "description", content: "بيانات المدرسة وتفضيلات النظام والإشعارات." },
      { property: "og:title", content: "الإعدادات — مِكلاف" },
      { property: "og:description", content: "بيانات المدرسة وتفضيلات النظام والإشعارات." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [profile, setProfile] = useState(school);
  const [prefs, setPrefs] = useState({
    attendanceAlerts: true,
    guardianSms: true,
    weeklyDigest: false,
  });

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    toast.success("تم حفظ إعدادات المدرسة");
  };

  return (
    <AppShell title="الإعدادات">
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="بيانات المدرسة">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
            {(
              [
                ["name", "اسم المدرسة"],
                ["stage", "المرحلة"],
                ["city", "المدينة"],
                ["ministryId", "الرقم الوزاري"],
                ["year", "العام الدراسي"],
                ["term", "الفصل الدراسي"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <Input
                  value={profile[key]}
                  onChange={(event) => setProfile((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit">حفظ التغييرات</Button>
            </div>
          </form>
        </Panel>

        <Panel title="تفضيلات النظام">
          <div className="space-y-4">
            {(
              [
                ["attendanceAlerts", "تنبيهات الغياب الفوري"],
                ["guardianSms", "إشعار أولياء الأمور بالرسائل"],
                ["weeklyDigest", "ملخص أسبوعي للإدارة"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border p-3.5"
              >
                <span className="text-sm font-medium">{label}</span>
                <Switch
                  checked={prefs[key]}
                  onCheckedChange={(value) => setPrefs((prev) => ({ ...prev, [key]: value }))}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-muted p-4 text-xs leading-6 text-muted-foreground">
            المنصة تعمل حاليًا ببيانات تجريبية. عند ربط قاعدة بيانات ستُحفظ كل التغييرات بشكل دائم.
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
