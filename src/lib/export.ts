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

export function printReport(title: string, headers: string[], rows: (string | number)[][]) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: "IBM Plex Sans Arabic", system-ui, sans-serif; padding: 28px; color: #16242f; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      p { color: #64748b; font-size: 12px; margin-top: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
      th, td { border: 1px solid #d8dee6; padding: 8px 10px; text-align: right; }
      th { background: #f1f5f9; }
    </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <p>منصة مِكلاف — تم الإنشاء في ${new Date().toLocaleString("ar-SA")}</p>
    <table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}
