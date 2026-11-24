import { z } from "zod";

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "ACCOUNT_SUSPENDED",
  "NOT_FOUND",
  "QUOTA_EXCEEDED",
  "RATE_LIMITED",
  "WATCHLIST_FULL",
  "FRAMES_UNUSABLE",
  // Identification par lien (U36) : lien hors liste, publication introuvable, publication sans indice.
  "LINK_UNSUPPORTED",
  "LINK_NOT_FOUND",
  "LINK_NO_CLUES",
  "AI_PAUSED",
  "UPSTREAM_ERROR",
  "INTERNAL_ERROR",
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ACCOUNT_SUSPENDED: 403,
  NOT_FOUND: 404,
  QUOTA_EXCEEDED: 429,
  RATE_LIMITED: 429,
  WATCHLIST_FULL: 409,
  FRAMES_UNUSABLE: 422,
  LINK_UNSUPPORTED: 400,
  LINK_NOT_FOUND: 404,
  LINK_NO_CLUES: 422,
  AI_PAUSED: 503,
  UPSTREAM_ERROR: 502,
  INTERNAL_ERROR: 500,
};

export type AppError = { code: ErrorCode; message: string };

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
