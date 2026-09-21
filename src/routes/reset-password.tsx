import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/labels";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة — مِكلاف" },
      { name: "description", content: "اختر كلمة مرور جديدة لحسابك في منصة مِكلاف." },
      { property: "og:title", content: "تعيين كلمة مرور جديدة — مِكلاف" },
      { property: "og:description", content: "أكمل إعادة تعيين كلمة المرور لحسابك." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = async () => {
      const hash = window.location.hash;
      const { data } = await supabase.auth.getSession();
      setReady(Boolean(data.session) || hash.includes("type=recovery"));
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 8) next["password"] = "كلمة المرور 8 أحرف على الأقل";
    if (password !== confirm) next["confirm"] = "كلمتا المرور غير متطابقتين";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(authErrorMessage(error.message));
      return;
    }
    toast.success("تم تحديث كلمة المرور بنجاح");
    void navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AuthShell
      title="تعيين كلمة مرور جديدة"
      subtitle="حماية حسابك"
      footer={
        <Link to="/login" className="font-bold text-primary">
          العودة لتسجيل الدخول
        </Link>
      }
    >
      {!ready ? (
        <div className="rounded-2xl border border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          هذا الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من صفحة{" "}
          <Link to="/forgot-password" className="font-bold text-primary">
            استعادة كلمة المرور
          </Link>
          .
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
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
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" size={16} />}
            {busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
