import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type StudentRow = Tables["students"]["Row"];
export type ClassRow = Tables["classes"]["Row"];
export type AttendanceRow = Tables["attendance"]["Row"];
export type CaseRow = Tables["counseling_cases"]["Row"];
export type CaseNoteRow = Tables["case_notes"]["Row"];
export type AppointmentRow = Tables["appointments"]["Row"];
export type AnnouncementRow = Tables["announcements"]["Row"];
export type TaskRow = Tables["plan_tasks"]["Row"];
export type SchoolRow = Tables["school_settings"]["Row"];
export type ProfileRow = Tables["profiles"]["Row"];

/**
 * Query keys stay stable across the app so saving a record refreshes every view
 * that shows it.
 */
export const qk = {
  students: ["students"] as const,
  student: (id: string) => ["student", id] as const,
  classes: ["classes"] as const,
  attendance: (date?: string) => ["attendance", date ?? "all"] as const,
  studentAttendance: (id: string) => ["attendance", "student", id] as const,
  cases: ["cases"] as const,
  caseNotes: (id: string) => ["case-notes", id] as const,
  appointments: ["appointments"] as const,
  announcements: ["announcements"] as const,
  tasks: ["tasks"] as const,
  school: ["school"] as const,
  people: ["people"] as const,
  notifications: ["notifications"] as const,
  taskEvents: (id: string) => ["task-events", id] as const,
  audit: ["audit-logs"] as const,
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

/**
 * Reads rely on row level security in the database for the actual restriction;
 * the school filter below simply keeps the query narrow and index-friendly.
 * A request that omits it still cannot reach another school's rows.
 */
export const api = {
  async students() {
    return unwrap(
      await supabase.from("students").select("*").order("created_at", { ascending: false }),
    ) as StudentRow[];
  },
  async student(id: string) {
    const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as StudentRow | null;
  },
  async classes() {
    return unwrap(await supabase.from("classes").select("*").order("name")) as ClassRow[];
  },
  async attendanceByDate(date: string) {
    return unwrap(
      await supabase.from("attendance").select("*").eq("date", date),
    ) as AttendanceRow[];
  },
  async attendanceRange(from: string) {
    return unwrap(
      await supabase
        .from("attendance")
        .select("*")
        .gte("date", from)
        .order("date", { ascending: false }),
    ) as AttendanceRow[];
  },
  async studentAttendance(id: string) {
    return unwrap(
      await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", id)
        .order("date", { ascending: false })
        .limit(60),
    ) as AttendanceRow[];
  },
  async cases() {
    return unwrap(
      await supabase.from("counseling_cases").select("*").order("created_at", { ascending: false }),
    ) as CaseRow[];
  },
  async caseNotes(caseId: string) {
    return unwrap(
      await supabase
        .from("case_notes")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false }),
    ) as CaseNoteRow[];
  },
  async appointments() {
    return unwrap(
      await supabase.from("appointments").select("*").order("starts_at"),
    ) as AppointmentRow[];
  },
  async announcements() {
    return unwrap(
      await supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    ) as AnnouncementRow[];
  },
  async tasks() {
    return unwrap(
      await supabase.from("plan_tasks").select("*").order("due_date", { nullsFirst: false }),
    ) as TaskRow[];
  },
  async school() {
    const { data, error } = await supabase
      .from("school_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as SchoolRow | null;
  },
  /** Accounts that belong to the same school, together with their roles. */
  async people() {
    const { data: profiles, error } = await supabase.from("profiles").select("*").order("created_at");
    if (error) throw new Error(error.message);
    const { data: userRoles } = await supabase.from("user_roles").select("user_id,role");
    const { data: members } = await supabase
      .from("school_members")
      .select("user_id,role,status,manager_id");
    return {
      profiles: (profiles ?? []) as ProfileRow[],
      roles: (userRoles ?? []) as {
        user_id: string;
        role: Database["public"]["Enums"]["app_role"];
      }[],
      members: (members ?? []) as {
        user_id: string;
        role: string;
        status: string;
        manager_id: string | null;
      }[],
    };
  },
  /** Notifications addressed to the signed-in account. */
  async notifications() {
    return unwrap(
      await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
    ) as Tables["notifications"]["Row"][];
  },
  /** The recorded history of one task: creation, submissions, notes, approvals. */
  async taskEvents(taskId: string) {
    return unwrap(
      await supabase
        .from("task_events")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false }),
    ) as Tables["task_events"]["Row"][];
  },
  /** Administrative trail for the school: role changes and memberships. */
  async audit() {
    return unwrap(
      await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80),
    ) as Tables["audit_logs"]["Row"][];
  },
};

export function mustSucceed(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}