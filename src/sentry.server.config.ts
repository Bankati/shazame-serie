import * as Sentry from "@sentry/nextjs";

import { SENTRY_SERVER_OPTIONS } from "@/server/observability/sentry-options";

Sentry.init(SENTRY_SERVER_OPTIONS);
