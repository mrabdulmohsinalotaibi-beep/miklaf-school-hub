import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/labels";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — مِكلاف" },
      { name: "description", content: "سجّل الدخول إلى منصة مِكلاف لإدارة المدرسة والإرشاد الطلابي." },
      { property: "og:title", content: "تسجيل الدخول — مِكلاف" },
      { property: "og:description", content: "بوابة الدخول إلى منصة إدارة المدرسة مِكلاف." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next["email"] = "أدخل بريدًا إلكترونيًا صحيحًا";
    if (password.length < 8) next["password"] = "كلمة المرور 8 أحرف على الأقل";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(authErrorMessage(error.message));
      return;
    }
    toast.success("تم تسجيل الدخول بنجاح");
    void navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="مرحبًا بعودتك"
      footer={
        <span>
          ليس لديك حساب؟{" "}
          <Link to="/register" className="font-bold text-primary">
            أنشئ حسابًا جديدًا
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link to="/forgot-password" className="text-xs font-bold text-primary">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(errors["password"])}
          />
          {errors["password"] && <p className="mt-1 text-xs text-destructive">{errors["password"]}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" size={16} />}
          {busy ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>
    </AuthShell>
  );
}
