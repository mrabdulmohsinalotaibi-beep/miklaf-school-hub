import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  HeartHandshake,
  BookOpenCheck,
  Building2,
  UserCog,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { roleLabels } from "@/lib/labels";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean };

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "نظرة عامة",
    items: [
      { to: "/dashboard", label: "لوحة المتابعة", icon: LayoutDashboard },
      { to: "/reports", label: "التقارير", icon: FileBarChart },
    ],
  },
  {
    title: "المدرسة",
    items: [
      { to: "/school", label: "مساحة المدرسة", icon: Building2 },
      { to: "/operations", label: "مركز الأعمال", icon: ClipboardList },
      { to: "/inbox", label: "الوارد والصادر", icon: MessagesSquare },
    ],
  },
  {
    title: "المجتمع المدرسي",
    items: [
      { to: "/students", label: "سجل الطلاب", icon: Users },
      { to: "/attendance", label: "الحضور والغياب", icon: ClipboardList },
      { to: "/counseling", label: "الموجه الطلابي", icon: HeartHandshake },
      { to: "/counselor", label: "مساحة الموجه", icon: HeartHandshake },
      { to: "/teacher", label: "مساحة المعلم", icon: BookOpenCheck },
      { to: "/appointments", label: "المواعيد والمقابلات", icon: CalendarClock },
    ],
  },
  {
    title: "التشغيل والتوثيق",
    items: [
      { to: "/messages", label: "الرسائل والإعلانات", icon: MessagesSquare },
      { to: "/plan", label: "الخطة التشغيلية", icon: ClipboardList },
      { to: "/operations", label: "الجداول والمساءلات والتعهدات", icon: ClipboardList },
      { to: "/educational-deputy", label: "وكيل الشؤون التعليمية", icon: BookOpenCheck },
      { to: "/school-deputy", label: "وكيل الشؤون المدرسية", icon: Building2 },
      { to: "/student-affairs-deputy", label: "وكيل شؤون الطلاب", icon: UserCog },
      { to: "/users", label: "إدارة المستخدمين", icon: ShieldCheck, adminOnly: true },
      { to: "/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0] ?? "").join("") || "م";
}

function SidebarContent({
  collapsed,
  isAdmin,
  onNavigate,
}: {
  collapsed: boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-1">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sidebar-primary font-display text-lg font-black text-sidebar-primary-foreground">
          م
        </div>
        {!collapsed && (
          <div>
            <div className="font-display text-lg font-black text-sidebar-foreground">مِكلاف</div>
            <div className="text-[10px] tracking-[0.18em] text-sidebar-foreground/60">
              منصة إدارة المدرسة
            </div>
          </div>
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-5">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              {!collapsed && (
                <div className="mb-2 px-2 text-[10px] font-bold tracking-[0.18em] text-sidebar-foreground/45">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon size={18} aria-hidden />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/75">
          <div className="mb-1 flex items-center gap-2 font-bold text-sidebar-primary">
            <GraduationCap size={14} /> نظام مدرسي متكامل
          </div>
          جميع البيانات محفوظة ومؤمَّنة بصلاحيات الوصول.
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, user, roles, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const name = profile?.full_name || user?.email || "مستخدم";
  const roleLabel = roles[0] ? roleLabels[roles[0]] : "عضو";

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-l border-sidebar-border bg-sidebar transition-[width] duration-300 lg:block",
          collapsed ? "w-[84px]" : "w-[264px]",
        )}
      >
        <SidebarContent collapsed={collapsed} isAdmin={isAdmin} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="فتح القائمة">
                  <Menu size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[272px] bg-sidebar p-0">
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                <SidebarContent
                  collapsed={false}
                  isAdmin={isAdmin}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="تبديل الوضع الليلي">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 text-right transition-colors hover:bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-navy text-xs font-bold text-navy-foreground">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">
                    <span className="block text-xs font-bold leading-4">{name}</span>
                    <span className="block text-[10px] text-muted-foreground">{roleLabel}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void navigate({ to: "/settings" })}>
                  <UserRound size={15} /> الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void navigate({ to: "/settings" })}>
                  <Settings size={15} /> الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => void handleSignOut()}
                >
                  <LogOut size={15} /> تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
