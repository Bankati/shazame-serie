import "server-only";

import { ERROR_HTTP_STATUS, type AppError } from "@/schemas/errors";

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init);
}

export function jsonError(error: AppError, init?: ResponseInit): Response {
  return Response.json({ ok: false, error }, { ...init, status: ERROR_HTTP_STATUS[error.code] });
}
