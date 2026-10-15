import "server-only";

// Logger structuré (code-standards.md) : une ligne JSON par événement, lisible dans les journaux Vercel.
// Invariant 9 : seuls un nom d'événement et des valeurs simples choisies par le code sont acceptés,
// jamais un message d'erreur brut, une image, un email ou un jeton.

type SafeValue = string | number | boolean | null;
export type LogFields = Record<string, SafeValue>;
type Level = "info" | "warn" | "error";

function write(level: Level, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ level, event, ...fields, at: new Date().toISOString() });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const log = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
