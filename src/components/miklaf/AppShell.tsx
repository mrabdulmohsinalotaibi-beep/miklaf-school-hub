import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { AuthScreen } from "./AuthScreen";
import { getStoredSession, persistSession, type MiklafUser } from "@/lib/demo-auth";
import { school } from "@/lib/miklaf-data";

const navGroups = [
  {
    title: "نظرة عامة",
    items: [
      { label: "لوحة المتابعة", icon: LayoutDashboard, to: "/" },
      { label: "التقويم المدرسي", icon: CalendarDays, to: "/calendar" },
    ],
  },
  {
    title: "المجتمع المدرسي",
    items: [
      { label: "سجل الطلاب", icon: Users, to: "/students" },
      { label: "الإرشاد الطلابي", icon: LifeBuoy, to: "/counseling" },
      { label: "التواصل والرسائل", icon: MessageSquareText, to: "/messages" },
    ],
  },
  {
    title: "التشغيل والتوثيق",
    items: [
      { label: "الخطة التشغيلية", icon: ClipboardCheck, to: "/plan" },
      { label: "التقارير", icon: FileText, to: "/reports" },
      { label: "الصلاحيات والأدوار", icon: ShieldCheck, to: "/permissions" },
      { label: "الإعدادات", icon: Settings, to: "/settings" },
    ],
  },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<MiklafUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    setUser(getStoredSession());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        جارٍ تحميل منصة مِكلاف...
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(next) => {
          persistSession(next);
          setUser(next);
        }}
      />
    );
  }

  const handleLogout = () => {
    persistSession(null);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-[286px] flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 pb-7 pt-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary font-display text-lg font-black text-primary-foreground shadow-lg">
              م
            </div>
            <div>
              <div className="font-display text-[21px] font-black tracking-tight">مِكلاف</div>
              <div className="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-sidebar-foreground/60">
                منصة إدارة المدرسة
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-sidebar-foreground/70 transition hover:bg-white/10 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-5 mb-7 rounded-2xl border border-sidebar-border bg-white/[0.07] p-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold font-display text-xs font-black text-sidebar-primary-foreground">
              {user.fullName.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{user.fullName}</div>
              <div className="mt-0.5 truncate text-[11px] text-sidebar-foreground/60">
                {user.roleLabel}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-5">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <div className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-sidebar-foreground/50">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const selected = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-right text-[13px] font-medium transition ${
                        selected
                          ? "bg-white/10 text-sidebar-foreground"
                          : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
                      }`}
                    >
                      <Icon
                        size={17}
                        strokeWidth={selected ? 2.3 : 1.8}
                        className={selected ? "text-gold" : "text-sidebar-foreground/60"}
                      />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-sidebar-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium text-sidebar-foreground/80 transition hover:bg-white/5"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:mr-[286px]">
        <header className="sticky top-0 z-20 flex h-[77px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <LayoutDashboard size={12} />
                <span>الرئيسية</span>
                <span className="opacity-50">/</span>
                <span>{title}</span>
              </div>
              <h1 className="mt-1 truncate font-display text-xl font-black tracking-tight sm:text-[23px]">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 ${
                searchOpen ? "w-[180px] px-3 sm:w-[250px]" : "w-10"
              }`}
            >
              <button
                onClick={() => setSearchOpen((value) => !value)}
                className="shrink-0 p-2 text-muted-foreground"
                aria-label="بحث"
              >
                <Search size={17} />
              </button>
              {searchOpen && (
                <input
                  autoFocus
                  className="w-full bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground"
                  placeholder="ابحث في المنصة..."
                />
              )}
            </div>
            <button
              className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition hover:border-primary/40"
              aria-label="التنبيهات"
            >
              <Bell size={17} />
              <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-left">
                <div className="text-[10px] font-medium text-muted-foreground">المدرسة</div>
                <div className="text-[12px] font-bold">{school.name}</div>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold font-display text-xs font-black text-sidebar-primary-foreground">
                م
              </div>
            </div>
          </div>
        </header>

        <div className="rise-in px-5 pb-12 pt-7 sm:px-8 lg:px-10 lg:pt-9">{children}</div>
      </main>
    </div>
  );
}
