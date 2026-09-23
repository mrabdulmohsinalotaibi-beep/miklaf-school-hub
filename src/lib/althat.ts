const ALTHAT_SUPABASE_URL = "https://c--ff86189b-6cdb-4a8a-b190-a1c210e48686-prod.lovable.cloud";
const ALTHAT_PUBLISHABLE_KEY = "sb_publishable_hZ_1x1Tym3D7-HeMB3DzhQ_wOfJOTU9";

export type AlthatConnectionState = "connected" | "unavailable";

export type AlthatPublicEvent = {
  id: string;
  date: string | null;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
};

export type AlthatPublicTask = {
  id: string;
  task: string;
  dueDate: string | null;
  executionStatus: string | null;
  documentationStatus: string | null;
  createdAt: string | null;
};

export type AlthatPublicSummary = {
  programs: number;
  events: AlthatPublicEvent[];
  tasks: AlthatPublicTask[];
  newFeedbackCount: number;
  syncedAt: string;
  state: AlthatConnectionState;
};

const headers = {
  apikey: ALTHAT_PUBLISHABLE_KEY,
  Authorization: `Bearer ${ALTHAT_PUBLISHABLE_KEY}`,
};

async function readTable<T>(table: string, select: string) {
  const url = new URL(`${ALTHAT_SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", select);
  url.searchParams.set("limit", "20");
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Althat ${table}: ${response.status}`);
  return (await response.json()) as T[];
}

/**
 * Reads only non-student, general operational metadata from Althat.
 * Deliberately excludes students, counseling cases, attendance, behavior,
 * interviews, and message bodies.
 */
export async function fetchAlthatPublicSummary(): Promise<AlthatPublicSummary> {
  const [programs, events, tasks, feedback] = await Promise.all([
    readTable<{ id: string }>("programs", "id,exec_status,created_at"),
    readTable<{
      id: string;
      edate: string | null;
      title: string;
      etype: string | null;
      status: string | null;
      priority: string | null;
    }>("calendar_events", "id,edate,title,etype,status,priority"),
    readTable<{
      id: string;
      task: string;
      due_date: string | null;
      exec_status: string | null;
      doc_status: string | null;
      created_at: string | null;
    }>("plan_tasks", "id,exec_status,due_date,doc_status,task,created_at"),
    readTable<{ id: string; status: string | null }>("feedback_messages", "id,status,created_at"),
  ]);

  return {
    programs: programs.length,
    events: events.map((event) => ({
      id: event.id,
      date: event.edate,
      title: event.title,
      type: event.etype,
      status: event.status,
      priority: event.priority,
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      task: task.task,
      dueDate: task.due_date,
      executionStatus: task.exec_status,
      documentationStatus: task.doc_status,
      createdAt: task.created_at,
    })),
    newFeedbackCount: feedback.filter((item) => item.status === "جديد").length,
    syncedAt: new Date().toISOString(),
    state: "connected",
  };
}
