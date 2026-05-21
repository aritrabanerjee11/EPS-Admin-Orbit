export type CodeView = "formatted" | "raw";

export function unformatCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export function formatCode(code: string): string {
  const raw = unformatCode(code).slice(0, 12);
  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
}

export async function copyCodes(codes: string[], view: CodeView): Promise<void> {
  const text = buildCodeText(codes, view);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function downloadCodes(codes: string[], view: CodeView, batchName: string): void {
  const text = view === "formatted" ? `Formatted Codes\n\n${buildCodeText(codes, view)}` : buildCodeText(codes, view);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const safeBatchName = batchName.replace(/[^a-z0-9-_]/gi, "-");

  link.href = URL.createObjectURL(blob);
  link.download = `${safeBatchName}-${view}-codes.txt`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}

export function downloadCodesCsv(codes: string[], batchName: string): void {
  const rows = ["raw,formatted", ...codes.map((code) => `${unformatCode(code)},${formatCode(code)}`)];
  downloadText(rows.join("\n"), `${safeName(batchName)}-codes.csv`, "text/csv;charset=utf-8");
}

export function downloadRequestSnapshot(snapshot: unknown, batchName: string): void {
  downloadText(JSON.stringify(snapshot, null, 2), `${safeName(batchName)}-request-snapshot.json`, "application/json;charset=utf-8");
}

function buildCodeText(codes: string[], view: CodeView): string {
  return codes.map((code) => (view === "formatted" ? formatCode(code) : unformatCode(code))).join("\n");
}

function downloadText(text: string, filename: string, type: string): void {
  const blob = new Blob([text], { type });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}

function safeName(name: string): string {
  return name.replace(/[^a-z0-9-_]/gi, "-");
}
