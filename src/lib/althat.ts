/**
 * Integration boundary for the external student-guidance platform.
 *
 * The platform's official API URL and authentication method are intentionally
 * not guessed. Configure the server-side adapter once the owner supplies the
 * official API/webhook contract; the UI can then consume the same normalized
 * records without changing role pages.
 */
export type AlthatConnectionState = "not_configured" | "configured";

export function getAlthatConnectionState(): AlthatConnectionState {
  return import.meta.env.VITE_ALTHAT_API_URL ? "configured" : "not_configured";
}

export function getAlthatApiUrl() {
  return import.meta.env.VITE_ALTHAT_API_URL ?? null;
}

export type AlthatCounselingRecord = {
  externalId: string;
  studentNumber: string;
  title: string;
  category: string;
  status: string;
  progress: number;
  followUpDate: string | null;
};

export type AlthatSyncResult = {
  imported: number;
  exported: number;
  conflicts: number;
  syncedAt: string;
};

/**
 * Placeholder kept deliberately server-side until the official API contract
 * is supplied. Never put service credentials in VITE_* variables.
 */
export async function syncAlthat(): Promise<AlthatSyncResult> {
  throw new Error("لم يتم إعداد موصل منصة الذات بعد. أضف رابط API الرسمي وطريقة المصادقة أولًا.");
}
