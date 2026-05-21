import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type LogName = "chat" | "provider" | "execution";

const SENSITIVE_KEY = /(password|secret|token|credential)/i;

export function writeLog(name: LogName, entry: Record<string, unknown>): void {
  const logsDir = getLogsDir();
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  const filePath = path.join(logsDir, `${name}.log`);
  appendFileSync(filePath, `${JSON.stringify(redact(entry))}\n`, "utf8");
}

export function readRecentLogs(name: LogName, limit = 20): Array<Record<string, unknown>> {
  const filePath = path.join(getLogsDir(), `${name}.log`);
  if (!existsSync(filePath)) {
    return [];
  }

  const lines = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit);

  return lines.map((line) => {
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch {
      return { message: line };
    }
  });
}

function getLogsDir(): string {
  const cwd = process.cwd();
  const root = path.basename(cwd).toLowerCase() === "backend" ? path.resolve(cwd, "../..") : cwd;
  return path.join(root, "logs");
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? "******" : redact(item)
      ])
    );
  }

  return value;
}
