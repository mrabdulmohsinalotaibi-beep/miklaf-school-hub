import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/app/AuthShell";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage, roleLabels, type AppRole } from "@/lib/labels";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب — مِكلاف" },
      { name: "description", content: "أنشئ حسابك في منصة مِكلاف لإدارة المدرسة والموجه الطلابي." },
      { property: "og:title", content: "إنشاء حساب — مِكلاف" },
      { property: "og:description", content: "انضم إلى منصة مِكلاف كمدير أو موجه طلابي أو معلم." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<AppRole>("teacher");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (fullName.trim().length < 3) next["fullName"] = "أدخل الاسم الكامل (3 أحرف على الأقل)";
    if (!/^\S+@\S+\.\S+$/.test(email)) next["email"] = "أدخل بريدًا إلكترونيًا صحيحًا";
    if (password.length < 8) next["password"] = "كلمة المرور 8 أحرف على الأقل";
    if (password !== confirm) next["confirm"] = "كلمتا المرور غير متطابقتين";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(authErrorMessage(error.message));
      return;
    }
    setSent(true);
    toast.success("تم إنشاء الحساب، تحقق من بريدك لتأكيد التسجيل");
  };

  if (sent) {
    return (
      <AuthShell
        title="تأكيد البريد الإلكتروني"
        subtitle="خطوة أخيرة"
        footer={
          <Link to="/login" className="font-bold text-primary">
            العودة لتسجيل الدخول
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-leaf/30 bg-leaf-soft px-5 py-10 text-center">
          <MailCheck className="text-leaf" size={34} />
          <div className="font-display text-base font-black">أرسلنا رسالة تأكيد إلى بريدك</div>
          <p className="text-sm text-muted-foreground">
            افتح الرسالة المرسلة إلى <span className="font-bold text-foreground">{email}</span> واضغط
            على رابط التأكيد لتفعيل حسابك، ثم سجّل الدخول.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="انضم إلى فريق المدرسة"
      footer={
        <span>
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="font-bold text-primary">
            تسجيل الدخول
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <Input
            id="fullName"
            className="mt-1.5"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="مثال: محمد العتيبي"
            aria-invalid={Boolean(errors["fullName"])}
          />
          {errors["fullName"] && <p className="mt-1 text-xs text-destructive">{errors["fullName"]}</p>}
        </div>

        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@school.sa"
            aria-invalid={Boolean(errors["email"])}
          />
          {errors["email"] && <p className="mt-1 text-xs text-destructive">{errors["email"]}</p>}
        </div>

        <div>
          <Label htmlFor="role">الدور الوظيفي</Label>
          <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
            <SelectTrigger id="role" className="mt-1.5 w-full">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1.5"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              aria-invalid={Boolean(errors["password"])}
            />
            {errors["password"] && (
              <p className="mt-1 text-xs text-destructive">{errors["password"]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="mt-1.5"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="••••••••"
              aria-invalid={Boolean(errors["confirm"])}
            />
            {errors["confirm"] && <p className="mt-1 text-xs text-destructive">{errors["confirm"]}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" size={16} />}
          {busy ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
        </Button>
      </form>
    </AuthShell>
  );
}
