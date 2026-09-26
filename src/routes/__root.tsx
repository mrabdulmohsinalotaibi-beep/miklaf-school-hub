import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/app/Logo";
import { AuthProvider } from "@/lib/auth-context";
import { SchoolProvider } from "@/lib/school-context";
import { ThemeProvider } from "@/lib/theme";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <Link to="/" aria-label="الصفحة الرئيسية لمنصة مِكلاف">
          <Logo variant="full" size="lg" />
        </Link>
        <div className="mt-4 font-display text-7xl font-black text-primary">٤٠٤</div>
        <h1 className="mt-4 font-display text-xl font-black text-foreground">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط الذي فتحته غير صحيح أو تم نقل الصفحة إلى مكان آخر.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            الصفحة الرئيسية
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
          >
            لوحة المتابعة
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <Link to="/" aria-label="الصفحة الرئيسية لمنصة مِكلاف">
          <Logo variant="full" size="lg" />
        </Link>
        <h1 className="mt-4 font-display text-xl font-black text-foreground">تعذّر تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو العودة للصفحة الرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
          >
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "مِكلاف — منصة إدارة المدرسة" },
      {
        name: "description",
        content:
          "منصة عربية متجاوبة لإدارة أعمال المدرسة ومتابعة الطلاب والموظفين والمهام وحالات الإرشاد الطلابي والتقارير، بصلاحيات دقيقة لكل دور.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "مِكلاف" },
      { property: "og:image", content: "/brand/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "شعار منصة مِكلاف — منصة إدارة المدرسة" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/brand/og-image.png" },
      { name: "theme-color", content: "#7E2320" },
      { name: "apple-mobile-web-app-title", content: "مِكلاف" },
      { name: "application-name", content: "مِكلاف" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SchoolProvider>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <Toaster position="top-center" richColors dir="rtl" />
          </SchoolProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
