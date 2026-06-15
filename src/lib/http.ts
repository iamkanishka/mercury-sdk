import {
  MercuryAuthError,
  MercuryConflictError,
  MercuryError,
  MercuryNetworkError,
  MercuryNotFoundError,
  MercuryRateLimitError,
  MercuryServerError,
  MercuryValidationError,
  type MercuryErrorBody,
} from "./errors.js";
import {
  withRetry,
  type RetryOptions,
  DEFAULT_RETRY_OPTIONS,
} from "./retry.js";

export type RequestHook = (info: {
  method: string;
  url: string;
  requestId: string;
}) => void;

export type ResponseHook = (info: {
  method: string;
  url: string;
  requestId: string;
  statusCode: number;
  durationMs: number;
}) => void;

export interface HttpClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  retry: RetryOptions;
  onRequest?: RequestHook;
  onResponse?: ResponseHook;
}

function buildUrl(
  base: string,
  path: string,
  params?: Record<string, unknown>,
): string {
  const url = new URL(path, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function makeRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class HttpClient {
  private readonly opts: HttpClientOptions;

  constructor(opts: HttpClientOptions) {
    this.opts = opts;
  }

  async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, unknown>; body?: unknown } = {},
  ): Promise<T> {
    const url = buildUrl(this.opts.baseUrl, path, options.params);
    const requestId = makeRequestId();

    if (this.opts.onRequest) {
      this.opts.onRequest({ method, url, requestId });
    }

    return withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, this.opts.timeoutMs);
      const start = Date.now();

      let response: Response;
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${this.opts.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Mercury-SDK": "mercury-sdk-ts/1.0.0",
        };

        response = await fetch(url, {
          method,
          headers,
          body:
            options.body !== undefined
              ? JSON.stringify(options.body)
              : undefined,
          signal: controller.signal,
        });
      } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new MercuryError(
            `Request timed out after ${this.opts.timeoutMs.toString()}ms`,
            "timeout",
          );
        }
        const msg = err instanceof Error ? err.message : "unknown";
        throw new MercuryNetworkError(`Network error: ${msg}`, err);
      }

      clearTimeout(timer);
      const durationMs = Date.now() - start;

      if (this.opts.onResponse) {
        this.opts.onResponse({
          method,
          url,
          requestId,
          statusCode: response.status,
          durationMs,
        });
      }

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        const text = await response.text();
        return text ? (JSON.parse(text) as T) : (undefined as T);
      }

      const serverRequestId = response.headers.get("x-request-id") ?? requestId;
      let body: MercuryErrorBody | undefined;
      try {
        body = (await response.json()) as MercuryErrorBody;
      } catch {
        // not JSON
      }

      const message =
        body?.message ??
        body?.error ??
        `HTTP ${response.status.toString()} ${response.statusText}`;

      switch (response.status) {
        case 401:
          throw new MercuryAuthError(message, serverRequestId);
        case 403:
          throw new MercuryError(
            message,
            "forbidden",
            403,
            body,
            serverRequestId,
          );
        case 404:
          throw new MercuryNotFoundError(path, serverRequestId);
        case 400:
          throw new MercuryValidationError(message, body, serverRequestId);
        case 409:
          throw new MercuryConflictError(message, body, serverRequestId);
        case 429: {
          const retryAfter = response.headers.get("retry-after");
          throw new MercuryRateLimitError(
            retryAfter != null ? Number(retryAfter) : undefined,
            serverRequestId,
          );
        }
        default:
          if (response.status >= 500) {
            throw new MercuryServerError(
              response.status,
              body,
              serverRequestId,
            );
          }
          throw new MercuryError(
            message,
            "unknown",
            response.status,
            body,
            serverRequestId,
          );
      }
    }, this.opts.retry);
  }

  get<T>(path: string, params?: object): Promise<T> {
    if (params !== undefined) {
      return this.request<T>("GET", path, {
        params: params as Record<string, unknown>,
      });
    }
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  /** POST for endpoints that return 204 No Content. */
  postVoid(path: string, body?: unknown): Promise<void> {
    return this.request<undefined>("POST", path, { body }).then(
      () => undefined,
    );
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  /** DELETE for endpoints that return 204 No Content. */
  deleteVoid(path: string): Promise<void> {
    return this.request<undefined>("DELETE", path).then(() => undefined);
  }
}

export function createHttpClient(
  apiKey: string,
  options: Partial<Omit<HttpClientOptions, "apiKey">> = {},
): HttpClient {
  const opts: HttpClientOptions = {
    baseUrl: options.baseUrl ?? "https://api.mercury.com/api/v1/",
    apiKey,
    timeoutMs: options.timeoutMs ?? 30_000,
    retry: options.retry ?? DEFAULT_RETRY_OPTIONS,
  };
  if (options.onRequest) opts.onRequest = options.onRequest;
  if (options.onResponse) opts.onResponse = options.onResponse;
  return new HttpClient(opts);
}
