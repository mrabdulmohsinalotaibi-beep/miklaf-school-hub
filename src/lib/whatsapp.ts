/** WhatsApp helpers. The browser opens the official chat composer; the user confirms sending in WhatsApp. */
export function normalizePhone(value: string | null | undefined, defaultCountry = "966") {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (raw.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith(defaultCountry)) return digits;
  if (digits.startsWith("0")) return `${defaultCountry}${digits.slice(1)}`;
  return `${defaultCountry}${digits}`;
}

export function whatsappUrl(phone: string | null | undefined, message?: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const query = message?.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
  return `https://wa.me/${normalized}${query}`;
}

export function whatsappMessage(studentName?: string, context = "") {
  return `السلام عليكم، معك إدارة منصة مِكلاف${studentName ? ` بخصوص الطالب/ة ${studentName}` : ""}${context ? ` — ${context}` : ""}.`;
}
