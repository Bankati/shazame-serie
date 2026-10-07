import "server-only";

import type * as Sentry from "@sentry/nextjs";

import { env } from "@/server/env";
import { SENTRY_DATA_COLLECTION, SENTRY_TRACES_SAMPLE_RATE, scrubEvent } from "@/shared/observability/sentry";

// Options des runtimes serveur (Node.js et edge) ; le navigateur a les siennes dans instrumentation-client.ts.
export const SENTRY_SERVER_OPTIONS = {
  dsn: env.SENTRY_DSN,
  enabled: env.SENTRY_DSN !== undefined,
  environment: env.VERCEL_ENV ?? "development",
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  dataCollection: SENTRY_DATA_COLLECTION,
  beforeSend: scrubEvent,
} satisfies Parameters<typeof Sentry.init>[0];
