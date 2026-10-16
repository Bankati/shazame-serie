import "server-only";

// RG16 : en cas d'erreur technique, trois tentatives avec délai croissant, puis un message clair.

export const MAX_ATTEMPTS = 3;
/** Attente avant la 2e puis la 3e tentative. */
export const RETRY_DELAYS_MS = [500, 1_500] as const;

export type RetryOptions = {
  isRetryable: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
  signal?: AbortSignal;
};

/** Exécute `attempt(n)` (n à partir de 1) jusqu'à réussite, erreur définitive ou 3 tentatives. */
export async function withRetries<T>(attempt: (attemptNumber: number) => Promise<T>, options: RetryOptions): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  for (let attemptNumber = 1; ; attemptNumber++) {
    try {
      return await attempt(attemptNumber);
    } catch (error) {
      const delay = RETRY_DELAYS_MS[attemptNumber - 1];
      if (attemptNumber >= MAX_ATTEMPTS || delay === undefined || !options.isRetryable(error) || options.signal?.aborted) {
        throw error;
      }
      await sleep(delay);
    }
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
