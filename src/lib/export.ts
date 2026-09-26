/**
 * Reporting helpers: Excel export and an official printable document.
 *
 * The printed sheet carries the same brand mark as the platform, so a report
 * that leaves the system still looks like it came from مِكلاف.
 */

import * as XLSX from "xlsx";

const BRAND_INK = "#7e2320";
const BRAND_DEEP = "#4a1513";
const BRAND_PAPER = "#fbf1ef";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Absolute URL so the print window and the Excel file always resolve it. */
function brandUrl(file: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/brand/${file}`;
}

export function exportToExcel(
  fileName: string,
  headers: string[],
  rows: (string | number)[][],
  meta?: { schoolName?: string; preparedBy?: string },
) {
  const sheetRows = [
    [`منصة مِكلاف — ${meta?.schoolName ?? "مدرسة مِكلاف"}`],
    [`${meta?.preparedBy ?? "إدارة المدرسة"} | ${new Date().toLocaleString("ar-SA")}`],
    [],
    headers,
    ...rows,
  ];
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet["!cols"] = headers.map((header) => ({ wch: Math.max(14, Math.min(34, header.length + 8)) }));
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, headers.length - 1) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(0, headers.length - 1) } },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "التقرير");
  XLSX.writeFile(workbook, `${fileName}.xlsx`, { compression: true, bookType: "xlsx" });
}

/** Download a clean, bilingual-friendly template with instructions as a second sheet. */
export function downloadStudentImportTemplate() {
  const headers = [
    "اسم الطالب",
    "رقم الهوية / السجل المدني",
    "الجنسية",
    "الصف الدراسي",
    "الفصل",
    "اسم ولي الأمر",
    "رقم جوال ولي الأمر",
  ];
  const example = ["أحمد محمد العتيبي", "1000000000", "سعودي", "أول ثانوي", "1/1", "محمد العتيبي", "0500000000"];
  const instructions = [
    ["قالب استيراد طلاب منصة مِكلاف"],
    ["احذف الصف التجريبي قبل رفع الملف، ثم احفظه بصيغة XLSX أو CSV."],
    ["الاسم ورقم الهوية مهمان لمنع التكرار. الصف والفصل يجب أن يطابقا بيانات المدرسة."],
  ];
  const workbook = XLSX.utils.book_new();
  const data = XLSX.utils.aoa_to_sheet([headers, example]);
  data["!cols"] = headers.map((header) => ({ wch: Math.max(18, header.length + 8) }));
  XLSX.utils.book_append_sheet(workbook, data, "بيانات الطلاب");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(instructions), "تعليمات");
  XLSX.writeFile(workbook, "قالب-استيراد-طلاب-مكلاف.xlsx", { compression: true });
}

export function printReport(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  options?: { schoolName?: string; subtitle?: string; preparedBy?: string },
) {
  const win = window.open("", "_blank", "width=980,height=760");
  if (!win) return;
  const schoolName = options?.schoolName ?? "مدرسة مِكلاف";
  const now = new Date();
  const stamp = now.toLocaleString("ar-SA");

  win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4; margin: 15mm 13mm; }
      * { box-sizing: border-box; }
      body { font-family: "IBM Plex Sans Arabic", system-ui, sans-serif; color: #2b1b1a; margin: 0; }

      .official { display: flex; align-items: center; gap: 16px;
        border-bottom: 3px double ${BRAND_INK}; padding-bottom: 12px; }
      .official .logo { height: 74px; width: auto; }
      .official .side { font-size: 11px; line-height: 1.9; color: ${BRAND_DEEP}; font-weight: 700; }
      .official .side.end { margin-inline-start: auto; text-align: left; }

      .doc-title { text-align: center; margin: 20px 0 4px; font-size: 19px; font-weight: 900; }
      .doc-sub { text-align: center; color: #6d5f5d; font-size: 11.5px; margin: 0 0 6px; }
      .meta { display: flex; justify-content: space-between; font-size: 11px; color: #4a3b39;
        border: 1px solid #e6dedb; background: ${BRAND_PAPER}; padding: 7px 10px;
        border-radius: 6px; margin-top: 12px; }

      table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11.5px; }
      th, td { border: 1px solid #ddcfcb; padding: 7px 9px; text-align: right; }
      th { background: ${BRAND_INK}; color: #fff; font-weight: 700; }
      tbody tr:nth-child(even) td { background: #fdf8f7; }

      .signs { margin-top: 42px; display: flex; justify-content: space-between; gap: 24px; }
      .sign { flex: 1; text-align: center; font-size: 11.5px; }
      .sign .line { margin-top: 44px; border-top: 1px solid #b8a5a1; padding-top: 6px; color: #4a3b39; }
      .seal { margin-top: 22px; width: 112px; height: 112px; border: 2px dashed #b8a5a1;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        color: #9a8683; font-size: 10.5px; }
      .foot { margin-top: 26px; border-top: 1px solid #e6dedb; padding-top: 8px; font-size: 10px;
        color: #8a7a77; display: flex; justify-content: space-between; }
    </style></head><body>
    <div class="official">
      <img class="logo" src="${brandUrl("miklaf-logo.png")}" alt="مِكلاف" />
      <div class="side">المملكة العربية السعودية<br/>وزارة التعليم<br/>${escapeHtml(
        schoolName,
      )}</div>
      <div class="side end">التاريخ: ${escapeHtml(now.toLocaleDateString("ar-SA"))}<br/>الرقم: ${escapeHtml(
        String(now.getTime()).slice(-6),
      )}<br/>المرفقات: —</div>
    </div>
    <h1 class="doc-title">${escapeHtml(title)}</h1>
    <p class="doc-sub">${escapeHtml(
      options?.subtitle ?? "تقرير رسمي صادر عن منصة مِكلاف لإدارة المدرسة",
    )}</p>
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
    <div class="foot"><span>منصة مِكلاف — منصة إدارة المدرسة</span><span>وثيقة داخلية</span></div>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

/**
 * Opens the browser's print dialog with the PDF destination suggested, which is
 * how an Arabic report is saved as a PDF without a server round-trip.
 */
export function exportToPdf(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  options?: { schoolName?: string; subtitle?: string; preparedBy?: string },
) {
  printReport(title, headers, rows, options);
}
