import { MercuryRateLimitError, MercuryServerError } from "./errors.js";

export interface RetryOptions {
  /** Max number of retry attempts. Default: 3 */
  maxRetries: number;
  /** Initial delay in ms. Default: 500 */
  initialDelayMs: number;
  /** Max delay cap in ms. Default: 30_000 */
  maxDelayMs: number;
  /** Jitter factor 0–1. Default: 0.25 */
  jitter: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 30_000,
  jitter: 0.25,
};

function isRetryable(err: unknown): boolean {
  if (err instanceof MercuryRateLimitError) return true;
  if (err instanceof MercuryServerError && err.statusCode != null) {
    return err.statusCode >= 500;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS,
): Promise<T> {
  let attempt = 0;

  // All exits are via return or throw — for(;;) avoids no-unnecessary-condition lint error
  for (;;) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      if (attempt > options.maxRetries || !isRetryable(err)) {
        throw err;
      }

      let waitMs: number;
      if (err instanceof MercuryRateLimitError && err.retryAfter != null) {
        waitMs = err.retryAfter * 1000;
      } else {
        const base = options.initialDelayMs * Math.pow(2, attempt - 1);
        const jitterRange = base * options.jitter;
        waitMs = Math.min(
          base + Math.random() * jitterRange * 2 - jitterRange,
          options.maxDelayMs,
        );
      }

      await delay(waitMs);
    }
  }
}
