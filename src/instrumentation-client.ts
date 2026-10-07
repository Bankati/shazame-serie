import * as Sentry from "@sentry/nextjs";

import { SENTRY_DATA_COLLECTION, SENTRY_TRACES_SAMPLE_RATE, scrubEvent } from "@/shared/observability/sentry";

// Pas de Session Replay ni de widget de retour : aucune base légale validée (Q15).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  dataCollection: SENTRY_DATA_COLLECTION,
  beforeSend: scrubEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
