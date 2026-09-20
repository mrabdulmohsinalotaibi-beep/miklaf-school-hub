import { useState, type FormEvent } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp, type MiklafUser } from "@/lib/demo-auth";

type AuthMode = "login" | "register";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: MiklafUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("admin@miklaf.school");
  const [password, setPassword] = useState("Pass123456");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "register") {
        if (!fullName.trim()) throw new Error("يرجى إدخال الاسم الكامل");
        await signUp(email, password, fullName.trim());
        setMessage("تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول.");
        setMode("login");
        setFullName("");
      } else {
        onAuthenticated(await signIn(email, password));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden bg-navy p-10 text-navy-foreground lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 font-display text-xl font-black text-gold">
                م
              </div>
              <div>
                <div className="font-display text-2xl font-black">مِكلاف</div>
                <div className="text-[10px] tracking-[0.22em] text-navy-foreground/60">
                  منصة إدارة المدرسة المستقلة
                </div>
              </div>
            </div>

            <div className="max-w-md">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-gold">
                <GraduationCap size={13} /> النظام المركزي للمدرسة
              </div>
              <h1 className="font-display text-4xl font-black leading-tight">
                إدارة تعليمية فعّالة، موثوقة، وتحليلات دقيقة.
              </h1>
              <p className="mt-4 text-sm leading-7 text-navy-foreground/70">
                تتبّع الطلاب، الحالات الإرشادية، التقويم، الرسائل، التقارير، والصلاحيات من مكان واحد
                في بيئة آمنة.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-navy-foreground/80">
            <div className="flex items-center justify-between">
              <span>وضع التجربة</span>
              <span className="text-leaf-soft">مفعّل</span>
            </div>
            <div className="flex items-center justify-between">
              <span>إدارة الجلسة</span>
              <span className="text-leaf-soft">محمي</span>
            </div>
            <div className="flex items-center justify-between">
              <span>الأدوار والصلاحيات</span>
              <span className="text-leaf-soft">جاهزة</span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">مرحبًا بك</div>
              <div className="font-display text-2xl font-black text-foreground">
                {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {mode === "login" ? "حساب موجود" : "مستخدم جديد"}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-sm font-medium">الاسم الكامل</label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="مثال: محمد العتيبي"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">كلمة المرور</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="rounded-xl border border-accent bg-accent/40 px-3 py-2 text-sm text-accent-foreground">
                {message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "جاري المعالجة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>{mode === "login" ? "ليس لديك حساب؟" : "لديك حساب؟"}</span>
            <button
              type="button"
              className="font-bold text-primary"
              onClick={() => {
                setMode((prev) => (prev === "login" ? "register" : "login"));
                setMessage(null);
              }}
            >
              {mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-muted p-4 text-xs leading-6 text-muted-foreground">
            <div className="mb-2 font-bold text-foreground">حسابات تجريبية جاهزة</div>
            <div>مدير المدرسة: admin@miklaf.school — Pass123456</div>
            <div>الموجه الطلابي: counselor@miklaf.school — Pass123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}
