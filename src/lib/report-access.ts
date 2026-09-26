import type { AppRole } from "@/lib/labels";

export type ReportKey = "attendance" | "students" | "cases" | "tasks";

/** Stable display order of the reports. */
export const REPORT_ORDER: ReportKey[] = ["attendance", "students", "cases", "tasks"];

/**
 * Which reports each role may open.
 *
 * The database decides what a role can actually read; this table only keeps the
 * interface from offering a report the account has no business producing. The
 * counselling report is deliberately absent for classroom teachers.
 */
const REPORTS_BY_ROLE: Record<AppRole, ReportKey[]> = {
  administrator: ["attendance", "students", "cases", "tasks"],
  educational_deputy: ["attendance", "students", "tasks"],
  school_deputy: ["attendance", "students", "tasks"],
  student_affairs_deputy: ["attendance", "students", "cases", "tasks"],
  counselor: ["attendance", "students", "cases", "tasks"],
  teacher: ["attendance", "students"],
};

const COUNSELLING_ROLES: AppRole[] = ["administrator", "counselor", "student_affairs_deputy"];

export function reportKeysFor(roles: string[]): ReportKey[] {
  const allowed = new Set<ReportKey>();
  for (const role of roles) {
    for (const key of REPORTS_BY_ROLE[role as AppRole] ?? []) allowed.add(key);
  }
  // A brand new account with no workspace role yet still sees the two safe
  // reports, so the page is never empty while an administrator sets its role.
  if (allowed.size === 0) return ["attendance", "students"];
  return REPORT_ORDER.filter((key) => allowed.has(key));
}

export function canReadCounsellingReports(roles: string[], isAdmin: boolean) {
  if (isAdmin) return true;
  return roles.some((role) => COUNSELLING_ROLES.includes(role as AppRole));
}

/** The role a report belongs to, used as the subtitle on the printed sheet. */
export const reportAudience: Record<ReportKey, string> = {
  students: "سجل الطلاب",
  attendance: "الحضور والانضباط",
  tasks: "المهام والإنجاز",
  cases: "الإرشاد الطلابي",
};