/** Export helpers: Excel-compatible download + printable view. */

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportToExcel(fileName: string, headers: string[], rows: (string | number)[][]) {
  const table = `
    <table border="1">
      <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("")}</tbody>
    </table>`;

  const html = `<html dir="rtl" lang="ar"><head><meta charset="utf-8" /></head><body>${table}</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printReport(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  options?: { schoolName?: string; subtitle?: string; preparedBy?: string },
) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const schoolName = options?.schoolName ?? "مدرسة مِكلاف";
  const now = new Date();
  const stamp = now.toLocaleString("ar-SA");
  win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4; margin: 16mm 14mm; }
      * { box-sizing: border-box; }
      body { font-family: "IBM Plex Sans Arabic", system-ui, sans-serif; color: #16242f; margin: 0; }
      .official { border-bottom: 3px double #0f3b57; padding-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .official .side { font-size: 11px; line-height: 1.8; color: #0f3b57; font-weight: 700; }
      .crest { width: 66px; height: 66px; border: 2px solid #0f3b57; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #0f3b57; font-size: 17px; }
      .doc-title { text-align: center; margin: 20px 0 4px; font-size: 19px; font-weight: 900; }
      .doc-sub { text-align: center; color: #64748b; font-size: 11.5px; margin: 0 0 6px; }
      .meta { display: flex; justify-content: space-between; font-size: 11px; color: #475569; border: 1px solid #dbe3ea; background: #f8fafc; padding: 7px 10px; border-radius: 6px; margin-top: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11.5px; }
      th, td { border: 1px solid #cdd7e0; padding: 7px 9px; text-align: right; }
      th { background: #0f3b57; color: #fff; font-weight: 700; }
      tbody tr:nth-child(even) td { background: #f6f9fb; }
      .signs { margin-top: 42px; display: flex; justify-content: space-between; gap: 24px; }
      .sign { flex: 1; text-align: center; font-size: 11.5px; }
      .sign .line { margin-top: 44px; border-top: 1px solid #94a3b8; padding-top: 6px; color: #475569; }
      .seal { margin-top: 26px; width: 120px; height: 120px; border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; }
      .foot { margin-top: 26px; border-top: 1px solid #dbe3ea; padding-top: 8px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    </style></head><body>
    <div class="official">
      <div class="side">المملكة العربية السعودية<br/>وزارة التعليم<br/>${escapeHtml(schoolName)}</div>
      <div class="crest">مِكلاف</div>
      <div class="side">التاريخ: ${escapeHtml(now.toLocaleDateString("ar-SA"))}<br/>الرقم: ${escapeHtml(
        String(now.getTime()).slice(-6),
      )}<br/>المرفقات: —</div>
    </div>
    <h1 class="doc-title">${escapeHtml(title)}</h1>
    <p class="doc-sub">${escapeHtml(options?.subtitle ?? "تقرير رسمي صادر عن منصة مِكلاف لإدارة المدرسة")}</p>
    <div class="meta"><span>عدد السجلات: ${rows.length}</span><span>أُعدّ بواسطة: ${escapeHtml(
      options?.preparedBy ?? "إدارة المدرسة",
    )}</span><span>تاريخ الإصدار: ${escapeHtml(stamp)}</span></div>
    <table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>
    <div class="signs">
      <div class="sign">الموجه الطلابي<div class="line">الاسم / التوقيع</div></div>
      <div class="sign">وكيل شؤون الطلاب<div class="line">الاسم / التوقيع</div></div>
      <div class="sign">مدير المدرسة<div class="line">الاسم / التوقيع</div><div class="seal">ختم المدرسة</div></div>
    </div>
    <div class="foot"><span>منصة مِكلاف — منصة إدارة المدرسة المستقلة</span><span>وثيقة داخلية</span></div>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

