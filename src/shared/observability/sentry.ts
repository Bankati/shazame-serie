import type * as Sentry from "@sentry/nextjs";

type SentryOptions = Parameters<typeof Sentry.init>[0];
type DataCollection = NonNullable<SentryOptions["dataCollection"]>;
// Non exporté par @sentry/nextjs : déduit de la signature de beforeSendTransaction.
type TransactionEvent = Parameters<NonNullable<SentryOptions["beforeSendTransaction"]>>[0];

// Options Sentry communes au serveur, à l'edge et au navigateur (invariant 9 : aucune donnée personnelle).
// Sentry 11 collecte par défaut cookies, en-têtes, corps et utilisateur : on coupe tout à la source,
// puis `scrubEvent` sert de seconde barrière avant l'envoi.

export const SENTRY_DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  genAI: { inputs: false, outputs: false },
  stackFrameVariables: false,
};

export const SENTRY_TRACES_SAMPLE_RATE = 0.1;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EMAIL_PLACEHOLDER = "[email]";

export function redactEmails(text: string): string {
  return text.replace(EMAIL_PATTERN, EMAIL_PLACEHOLDER);
}

// Partie commune aux erreurs et aux traces : utilisateur, requête et données libres.
function scrubCommon(event: Sentry.Event): void {
  delete event.user;
  delete event.extra;

  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) {
      event.request.url = stripQueryAndFragment(event.request.url);
    }
  }
}

function stripQueryAndFragment(url: string): string {
  return url.split(/[?#]/, 1)[0] ?? "";
}

export function scrubTransaction(event: TransactionEvent): TransactionEvent {
  scrubCommon(event);
  return event;
}

export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  scrubCommon(event);

  if (event.message) {
    event.message = redactEmails(event.message);
  }
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) {
      exception.value = redactEmails(exception.value);
    }
  }
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message) {
      breadcrumb.message = redactEmails(breadcrumb.message);
    }
    delete breadcrumb.data;
  }

  return event;
}
