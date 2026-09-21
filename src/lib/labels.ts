import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type CasePriority = Database["public"]["Enums"]["case_priority"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];

export const roleLabels: Record<AppRole, string> = {
  administrator: "مدير المدرسة",
  counselor: "موجه طلابي",
  teacher: "معلم",
};

export const attendanceLabels: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};

export const caseStatusLabels: Record<CaseStatus, string> = {
  new: "جديدة",
  in_progress: "قيد المتابعة",
  closed: "مغلقة",
};

export const casePriorityLabels: Record<CasePriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  not_started: "لم تبدأ",
  in_progress: "قيد التنفيذ",
  done: "مكتملة",
};

export const grades = ["أول ثانوي", "ثاني ثانوي", "ثالث ثانوي"] as const;

export const studentStatuses = [
  "منتظم",
  "متفوق",
  "متابعة أكاديمية",
  "متابعة إرشادية",
  "إنذار غياب",
] as const;

const arabicDate = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const arabicDateTime = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return arabicDate.format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return arabicDateTime.format(date);
}

export function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Friendly Arabic messages for backend auth errors. */
export function authErrorMessage(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (text.includes("email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني أولًا عبر الرسالة المرسلة إليك.";
  if (text.includes("already registered") || text.includes("already been registered"))
    return "هذا البريد الإلكتروني مسجل مسبقًا.";
  if (text.includes("password should be")) return "كلمة المرور قصيرة جدًا، استخدم 8 أحرف على الأقل.";
  if (text.includes("rate limit") || text.includes("too many"))
    return "تم إرسال عدد كبير من الطلبات، يرجى المحاولة بعد قليل.";
  if (text.includes("network")) return "تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت.";
  return "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.";
}
