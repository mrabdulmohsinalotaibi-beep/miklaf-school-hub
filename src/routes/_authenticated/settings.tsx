import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/app/ui-kit";
import { WhatsAppButton } from "@/components/app/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { normalizePhone, whatsappMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات والملف الشخصي — مِكلاف" },
      { name: "description", content: "تحديث بياناتك الشخصية وكلمة المرور." },
      { property: "og:title", content: "الإعدادات والملف الشخصي — مِكلاف" },
      { property: "og:description", content: "إدارة الحساب وبيانات المستخدم في منصة مِكلاف." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: normalizePhone(phone) || null })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error("تعذّر حفظ البيانات");
      return;
    }
    toast.success("تم تحديث الملف الشخصي");
    await refreshProfile();
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });
    setBusy(false);
    if (error) {
      toast.error("تعذّر تغيير كلمة المرور، تأكد من كلمة المرور الحالية");
      return;
    }
    toast.success("تم تغيير كلمة المرور");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <>
      <PageHeader
        title="الإعدادات والملف الشخصي"
        description="حدّث بياناتك الشخصية وكلمة المرور."
        crumbs={[{ label: "الرئيسية", to: "/dashboard" }, { label: "الإعدادات" }]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="الملف الشخصي">
          <div className="space-y-3">
            <div>
              <Label>الاسم الكامل</Label>
              <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input className="mt-1.5" value={user?.email ?? ""} disabled />
            </div>
            <div>
              <Label>رقم الجوال</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx أو +9665xxxxxxxx"
                />
                <WhatsAppButton phone={phone} message={whatsappMessage(profile?.full_name)} compact />
              </div>
            </div>
            <Button onClick={() => void saveProfile()} disabled={busy}>
              حفظ التغييرات
            </Button>
          </div>
        </Panel>

        <Panel title="تغيير كلمة المرور">
          <div className="space-y-3">
            <div>
              <Label>كلمة المرور الحالية</Label>
              <Input
                className="mt-1.5"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>كلمة المرور الجديدة</Label>
              <Input
                className="mt-1.5"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button onClick={() => void changePassword()} disabled={busy}>
              تحديث كلمة المرور
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
