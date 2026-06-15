export type MercuryErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "bad_request"
  | "conflict"
  | "rate_limited"
  | "server_error"
  | "network_error"
  | "timeout"
  | "unknown";

export interface MercuryErrorBody {
  message?: string;
  error?: string;
  details?: unknown;
}

export class MercuryError extends Error {
  readonly code: MercuryErrorCode;
  readonly statusCode: number | undefined;
  readonly body: MercuryErrorBody | undefined;
  readonly requestId: string | undefined;

  constructor(
    message: string,
    code: MercuryErrorCode,
    statusCode?: number,
    body?: MercuryErrorBody,
    requestId?: string,
  ) {
    super(message);
    this.name = "MercuryError";
    this.code = code;
    this.statusCode = statusCode;
    this.body = body;
    this.requestId = requestId;
  }
}

export class MercuryAuthError extends MercuryError {
  constructor(
    message = "Unauthorized: invalid or missing API token",
    requestId?: string,
  ) {
    super(message, "unauthorized", 401, undefined, requestId);
    this.name = "MercuryAuthError";
  }
}

export class MercuryNotFoundError extends MercuryError {
  readonly resource: string;
  constructor(resource: string, requestId?: string) {
    super(`Not found: ${resource}`, "not_found", 404, undefined, requestId);
    this.name = "MercuryNotFoundError";
    this.resource = resource;
  }
}

export class MercuryValidationError extends MercuryError {
  constructor(message: string, body?: MercuryErrorBody, requestId?: string) {
    super(message, "bad_request", 400, body, requestId);
    this.name = "MercuryValidationError";
  }
}

export class MercuryConflictError extends MercuryError {
  constructor(message: string, body?: MercuryErrorBody, requestId?: string) {
    super(message, "conflict", 409, body, requestId);
    this.name = "MercuryConflictError";
  }
}

export class MercuryRateLimitError extends MercuryError {
  readonly retryAfter: number | undefined;
  constructor(retryAfter?: number, requestId?: string) {
    super("Rate limit exceeded", "rate_limited", 429, undefined, requestId);
    this.name = "MercuryRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class MercuryServerError extends MercuryError {
  constructor(statusCode: number, body?: MercuryErrorBody, requestId?: string) {
    super(
      `Mercury server error: ${statusCode}`,
      "server_error",
      statusCode,
      body,
      requestId,
    );
    this.name = "MercuryServerError";
  }
}

export class MercuryNetworkError extends MercuryError {
  readonly cause: unknown;
  constructor(message: string, cause: unknown) {
    super(message, "network_error");
    this.name = "MercuryNetworkError";
    this.cause = cause;
  }
}
