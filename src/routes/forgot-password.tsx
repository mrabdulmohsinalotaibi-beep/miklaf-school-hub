import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/labels";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "استعادة كلمة المرور — مِكلاف" },
      { name: "description", content: "أرسل رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني." },
      { property: "og:title", content: "استعادة كلمة المرور — مِكلاف" },
      { property: "og:description", content: "استعد الوصول إلى حسابك في منصة مِكلاف." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("أدخل بريدًا إلكترونيًا صحيحًا");
      return;
    }
    setError("");
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (resetError) {
      toast.error(authErrorMessage(resetError.message));
      return;
    }
    setSent(true);
    toast.success("تم إرسال رابط إعادة التعيين");
  };

  return (
    <AuthShell
      title="استعادة كلمة المرور"
      subtitle="لا تقلق، الأمر بسيط"
      footer={
        <Link to="/login" className="font-bold text-primary">
          العودة لتسجيل الدخول
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-leaf/30 bg-leaf-soft px-5 py-10 text-center">
          <MailCheck className="text-leaf" size={34} />
          <div className="font-display text-base font-black">تحقّق من بريدك الإلكتروني</div>
          <p className="text-sm text-muted-foreground">
            أرسلنا رابط إعادة تعيين كلمة المرور إلى{" "}
            <span className="font-bold text-foreground">{email}</span>.
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <p className="text-sm text-muted-foreground">
            أدخل بريدك الإلكتروني المسجّل وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
          </p>
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              className="mt-1.5"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@school.sa"
              aria-invalid={Boolean(error)}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" size={16} />}
            {busy ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
