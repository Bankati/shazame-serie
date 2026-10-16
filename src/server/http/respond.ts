import "server-only";

import { ERROR_MESSAGES } from "@/content/fr/errors";
import { ERROR_HTTP_STATUS, type ErrorCode } from "@/schemas/errors";

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init);
}

export function jsonError(
  code: ErrorCode,
  message: string = ERROR_MESSAGES[code],
  init?: ResponseInit,
  details?: Record<string, unknown>,
): Response {
  const error = details ? { code, message, details } : { code, message };
  return Response.json({ ok: false, error }, { ...init, status: ERROR_HTTP_STATUS[code] });
}
