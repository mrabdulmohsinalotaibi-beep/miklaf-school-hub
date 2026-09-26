import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BellRing,
  Building2,
  BookOpenCheck,
  ClipboardList,
  CalendarCheck,
  FileBarChart,
  Files,
  GraduationCap,
  HeartHandshake,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  UserRound,
  Users,
} from "lucide-react";

import { BrandAvatar, Logo } from "@/components/app/Logo";
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
import { useSchool } from "@/lib/school-context";
import { roleLabels, type AppRole } from "@/lib/labels";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

/** One workspace page per role, exactly as the brief describes. */
const roleWorkspaceLinks: { role: AppRole; item: NavItem }[] = [
  {
    role: "educational_deputy",
    item: { to: "/educational-deputy", label: "مساحة الشؤون التعليمية", icon: BookOpenCheck },
  },
  {
    role: "school_deputy",
    item: { to: "/school-deputy", label: "مساحة الشؤون المدرسية", icon: Building2 },
  },
  {
    role: "student_affairs_deputy",
    item: { to: "/student-affairs-deputy", label: "مساحة شؤون الطلاب", icon: Users },
  },
  {
    role: "counselor",
    item: { to: "/counselor", label: "مساحة الموجه الطلابي", icon: HeartHandshake },
  },
  {
    role: "teacher",
    item: { to: "/teacher", label: "مساحة المعلم", icon: CalendarCheck },
  },
];

function getNavGroups(roles: AppRole[], workspaceRole: string | null) {
  const effective = new Set<string>([...roles, ...(workspaceRole ? [workspaceRole] : [])]);
  const workspaceItems: NavItem[] = [
    {
      to: "/dashboard",
      label: effective.has("administrator") ? "مساحة مدير المدرسة" : "لوحة القيادة",
      icon: LayoutDashboard,
    },
    ...roleWorkspaceLinks.filter(({ role }) => effective.has(role)).map(({ item }) => item),
  ];

  return [
    { title: "مساحة العمل", items: workspaceItems },
    {
      title: "سير العمل",
      items: [
        { to: "/work-center", label: "مركز الأعمال والمهام", icon: ClipboardList },
        { to: "/internal-messages", label: "الرسائل والإشعارات", icon: MessagesSquare },
      ],
    },
    {
      title: "الخدمات",
      items: [
        { to: "/students", label: "الطلاب", icon: Files },
        { to: "/attendance", label: "الحضور والغياب", icon: CalendarCheck },
        { to: "/counseling", label: "الإرشاد الطلابي", icon: HeartHandshake },
        { to: "/operations", label: "العمليات والخطة", icon: Layers3 },
        { to: "/appointments", label: "المواعيد والمقابلات", icon: BellRing },
        { to: "/reports", label: "التقارير", icon: FileBarChart },
      ],
    },
    {
      title: "إدارة المدرسة",
      items: [
        { to: "/school", label: "أعضاء المدرسة والصلاحيات", icon: Users },
        { to: "/settings", label: "الإعدادات", icon: Settings },
      ],
    },
  ];
}

function SidebarContent({
  collapsed,
  roles,
  workspaceRole,
  onNavigate,
}: {
  collapsed: boolean;
  roles: AppRole[];
  workspaceRole: string | null;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { school } = useSchool();

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-1">
        {collapsed ? (
          <Logo variant="avatar" size="xs" className="h-10 w-10 rounded-xl" />
        ) : (
          <span className="flex min-w-0 flex-col gap-1">
            <Logo variant="wordmark" tone="light" size="sm" />
            <span className="truncate text-[10px] tracking-[0.18em] text-sidebar-foreground/60">
              {school?.name ?? "منصة إدارة المدرسة"}
            </span>
          </span>
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-5">
        {getNavGroups(roles, workspaceRole).map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <div className="mb-2 px-2 text-[10px] font-bold tracking-[0.18em] text-sidebar-foreground/45">
                {group.title}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
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
        ))}
      </nav>

      {!collapsed && (
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/75">
          <div className="mb-1 flex items-center gap-2 font-bold text-sidebar-primary">
            <GraduationCap size={14} /> نظام مدرسي متكامل
          </div>
          الصلاحيات مطبقة في قاعدة البيانات، لا في الواجهة فقط.
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, user, roles, isAdmin, signOut } = useAuth();
  const { school, workspaceRole } = useSchool();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const name = profile?.full_name || user?.email || "مستخدم";
  const roleLabel =
    (workspaceRole && roleLabels[workspaceRole as AppRole]) ||
    (roles[0] && roleLabels[roles[0]]) ||
    (isAdmin ? roleLabels.administrator : "عضو");

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
        <SidebarContent collapsed={collapsed} roles={roles} workspaceRole={workspaceRole} />
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
                  roles={roles}
                  workspaceRole={workspaceRole}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <Link to="/dashboard" className="lg:hidden" aria-label="مِكلاف">
              <Logo variant="wordmark" size="xs" />
            </Link>

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
                  <BrandAvatar />
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