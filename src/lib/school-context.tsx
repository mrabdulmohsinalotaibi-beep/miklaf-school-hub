import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { AppRole } from "@/lib/labels";

export type SchoolRow = {
  id: string;
  name: string;
  code: string;
  education_stage: string | null;
  education_type: string | null;
  city: string | null;
  education_department: string | null;
  district: string | null;
  school_year: string | null;
};

export type MembershipRow = {
  id: string;
  school_id: string;
  user_id: string;
  role: string;
  manager_id: string | null;
  status: string;
};

type SchoolContextValue = {
  /** The user's own active school, or null before a school space exists. */
  school: SchoolRow | null;
  schoolId: string | null;
  membership: MembershipRow | null;
  /** Role taken from the school membership; falls back to the global role. */
  workspaceRole: string | null;
  roles: AppRole[];
  isAdmin: boolean;
  /** Roles allowed to supervise: see every task and approve work. */
  canSupervise: boolean;
  /** Roles allowed to read confidential counselling details. */
  canReadCounseling: boolean;
  /** Roles allowed to manage the school structure and accounts. */
  canManageSchool: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const SchoolContext = createContext<SchoolContextValue | undefined>(undefined);

const SUPERVISOR_ROLES = [
  "administrator",
  "educational_deputy",
  "school_deputy",
  "student_affairs_deputy",
];

const COUNSELING_ROLES = ["administrator", "counselor", "student_affairs_deputy"];
const SCHOOL_MANAGER_ROLES = ["administrator", "educational_deputy", "school_deputy"];

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user, roles, isAdmin } = useAuth();

  const membershipQuery = useQuery({
    queryKey: ["active-membership", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_members")
        .select("id,school_id,user_id,role,manager_id,status")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("joined_at")
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as MembershipRow | null) ?? null;
    },
  });

  const schoolId = membershipQuery.data?.school_id ?? null;

  const schoolQuery = useQuery({
    queryKey: ["active-school-record", schoolId],
    enabled: Boolean(schoolId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select(
          "id,name,code,education_stage,education_type,city,education_department,district,school_year",
        )
        .eq("id", schoolId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as SchoolRow | null) ?? null;
    },
  });

  const membership = membershipQuery.data ?? null;
  const workspaceRole = membership?.role ?? (isAdmin ? "administrator" : null);

  const value = useMemo<SchoolContextValue>(() => {
    const roleList: string[] = [...roles, ...(workspaceRole ? [workspaceRole] : [])];
    const has = (candidates: string[]) => candidates.some((role) => roleList.includes(role));
    return {
      school: schoolQuery.data ?? null,
      schoolId,
      membership,
      workspaceRole,
      roles,
      isAdmin: isAdmin || roleList.includes("administrator"),
      canSupervise: has(SUPERVISOR_ROLES),
      canReadCounseling: has(COUNSELING_ROLES),
      canManageSchool: has(SCHOOL_MANAGER_ROLES),
      loading: membershipQuery.isLoading || (Boolean(schoolId) && schoolQuery.isLoading),
      error:
        (membershipQuery.error instanceof Error ? membershipQuery.error.message : null) ??
        (schoolQuery.error instanceof Error ? schoolQuery.error.message : null),
      refetch: () => {
        void membershipQuery.refetch();
        void schoolQuery.refetch();
      },
    };
  }, [membership, membershipQuery, schoolQuery, schoolId, roles, workspaceRole, isAdmin]);

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("useSchool must be used inside SchoolProvider");
  return context;
}

/** Arabic label for the workspace role, including custom membership roles. */
export function workspaceRoleLabel(role: string | null, labels: Record<string, string>) {
  if (!role) return "عضو";
  return labels[role] ?? role;
}