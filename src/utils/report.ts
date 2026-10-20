// Client-side report output until the backend export endpoint exists

export type ReportSection = { title: string; columns: string[]; rows: (string | number)[][] };

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(filename: string, sections: ReportSection[]) {
  const lines = sections.flatMap((s, i) => [
    ...(i ? [""] : []),
    csvCell(s.title),
    s.columns.map(csvCell).join(","),
    ...s.rows.map((r) => r.map(csvCell).join(",")),
  ]);
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const escapeHtml = (v: string | number) =>
  String(v).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

// Opens a print-ready page; the browser's print dialog saves it as PDF
export function printReport(title: string, subtitle: string, sections: ReportSection[]) {
  const win = window.open("", "_blank");
  if (!win) return false;
  const body = sections
    .map(
      (s) => `<h2>${escapeHtml(s.title)}</h2><table><thead><tr>${s.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${s.rows
        .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`,
    )
    .join("");
  win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500&display=swap" rel="stylesheet">
<style>
  body { font-family: "Clash Display", system-ui, sans-serif; color: #1c1a18; margin: 40px; }
  h1 { font-size: 22px; font-weight: 500; margin: 0; }
  p { color: #6b7180; font-size: 12px; margin: 4px 0 24px; }
  h2 { font-size: 14px; font-weight: 500; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; color: #6b7180; font-weight: 400; background: #f8f9fb; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #eceef2; }
</style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${body}<script>window.onload = () => window.print();</script></body></html>`);
  // Printing waits for onload so the PDF uses Clash Display
  win.document.close();
  return true;
}
