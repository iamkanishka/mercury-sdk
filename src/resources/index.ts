import type { HttpClient } from "../lib/http.js";
import { paginate, collectAll } from "../lib/paginator.js";
import type {
  Category,
  CategoriesPaginatedResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Customer,
  CustomersPaginatedResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  TreasuryAccount,
  TreasuryAccountsPaginatedResponse,
  TreasuryTransaction,
  TreasuryTransactionsPaginatedResponse,
  TreasuryStatement,
  TreasuryStatementsPaginatedResponse,
  Webhook,
  WebhooksPaginatedResponse,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  VerifyWebhookRequest,
  MercuryEvent,
  EventsPaginatedResponse,
  Organization,
  MercuryUser,
  UsersPaginatedResponse,
  SafeRequest,
  CreditAccount,
  SendMoneyApprovalRequest,
  SendMoneyApprovalRequestsPaginatedResponse,
  ListApprovalRequestsParams,
  RequestSendMoneyRequest,
  InternalTransferRequest,
  InternalTransferResponse,
  Attachment,
  PaginationParams,
  UUID,
  OAuth2TokenRequest,
  OAuth2TokenResponse,
  OAuth2AuthorizeParams,
} from "../types/index.js";

type Cursor = UUID | undefined;

function withCursor(
  params: Record<string, unknown> | undefined,
  cursor: Cursor,
): Record<string, unknown> {
  const base: Record<string, unknown> = params ? { ...params } : {};
  if (cursor !== undefined) {
    // `start_after` must use bracket notation (contains underscore — dot-notation rule prefers dot, but
    // this key is intentionally snake_case as required by the Mercury API query parameter name)
    // eslint-disable-next-line @typescript-eslint/dot-notation
    base["start_after"] = cursor;
  }
  return base;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export class CategoriesResource {
  constructor(private readonly http: HttpClient) {}

  /** POST /categories */
  create(request: CreateCategoryRequest): Promise<Category> {
    return this.http.post<Category>("categories", request);
  }

  /** GET /categories */
  list(params?: PaginationParams): Promise<CategoriesPaginatedResponse> {
    return this.http.get<CategoriesPaginatedResponse>("categories", params);
  }

  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<Category[]> {
    return paginate<Category>((cursor) =>
      this.http
        .get<CategoriesPaginatedResponse>(
          "categories",
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.categories, page: r.page })),
    );
  }

  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<Category[]> {
    return collectAll<Category>(
      (cursor) =>
        this.http
          .get<CategoriesPaginatedResponse>(
            "categories",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.categories, page: r.page })),
      maxItems,
    );
  }

  /** PUT /categories/{categoryId} */
  update(categoryId: UUID, data: UpdateCategoryRequest): Promise<Category> {
    return this.http.put<Category>(`categories/${categoryId}`, data);
  }

  /** DELETE /categories/{categoryId} */
  delete(categoryId: UUID): Promise<void> {
    return this.http.deleteVoid(`categories/${categoryId}`);
  }
}

// ─── Customers ───────────────────────────────────────────────────────────────

export class CustomersResource {
  constructor(private readonly http: HttpClient) {}

  /** POST /customers */
  create(request: CreateCustomerRequest): Promise<Customer> {
    return this.http.post<Customer>("customers", request);
  }

  /** GET /customers/{customerId} */
  get(customerId: UUID): Promise<Customer> {
    return this.http.get<Customer>(`customers/${customerId}`);
  }

  /** GET /customers */
  list(params?: PaginationParams): Promise<CustomersPaginatedResponse> {
    return this.http.get<CustomersPaginatedResponse>("customers", params);
  }

  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<Customer[]> {
    return paginate<Customer>((cursor) =>
      this.http
        .get<CustomersPaginatedResponse>(
          "customers",
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.customers, page: r.page })),
    );
  }

  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<Customer[]> {
    return collectAll<Customer>(
      (cursor) =>
        this.http
          .get<CustomersPaginatedResponse>(
            "customers",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.customers, page: r.page })),
      maxItems,
    );
  }

  /** PUT /customers/{customerId} */
  update(customerId: UUID, data: UpdateCustomerRequest): Promise<Customer> {
    return this.http.put<Customer>(`customers/${customerId}`, data);
  }

  /** DELETE /customers/{customerId} — irreversible */
  delete(customerId: UUID): Promise<void> {
    return this.http.deleteVoid(`customers/${customerId}`);
  }
}

// ─── Treasury ────────────────────────────────────────────────────────────────

export class TreasuryResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /treasury */
  list(params?: PaginationParams): Promise<TreasuryAccountsPaginatedResponse> {
    return this.http.get<TreasuryAccountsPaginatedResponse>("treasury", params);
  }

  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<TreasuryAccount[]> {
    return paginate<TreasuryAccount>((cursor) =>
      this.http
        .get<TreasuryAccountsPaginatedResponse>(
          "treasury",
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.accounts, page: r.page })),
    );
  }

  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<TreasuryAccount[]> {
    return collectAll<TreasuryAccount>(
      (cursor) =>
        this.http
          .get<TreasuryAccountsPaginatedResponse>(
            "treasury",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.accounts, page: r.page })),
      maxItems,
    );
  }

  /** GET /treasury/{accountId}/transactions */
  listTransactions(
    accountId: UUID,
    params?: PaginationParams,
  ): Promise<TreasuryTransactionsPaginatedResponse> {
    return this.http.get<TreasuryTransactionsPaginatedResponse>(
      `treasury/${accountId}/transactions`,
      params,
    );
  }

  listAllTransactions(
    accountId: UUID,
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<TreasuryTransaction[]> {
    return paginate<TreasuryTransaction>((cursor) =>
      this.http
        .get<TreasuryTransactionsPaginatedResponse>(
          `treasury/${accountId}/transactions`,
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.transactions, page: r.page })),
    );
  }

  /** GET /treasury/{accountId}/statements */
  listStatements(
    accountId: UUID,
    params?: PaginationParams & { documentType?: string },
  ): Promise<TreasuryStatementsPaginatedResponse> {
    return this.http.get<TreasuryStatementsPaginatedResponse>(
      `treasury/${accountId}/statements`,
      params,
    );
  }

  listAllStatements(
    accountId: UUID,
    params?: Omit<PaginationParams, "start_after"> & { documentType?: string },
  ): AsyncGenerator<TreasuryStatement[]> {
    return paginate<TreasuryStatement>((cursor) =>
      this.http
        .get<TreasuryStatementsPaginatedResponse>(
          `treasury/${accountId}/statements`,
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.statements, page: r.page })),
    );
  }
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /** POST /webhooks */
  create(request: CreateWebhookRequest): Promise<Webhook> {
    return this.http.post<Webhook>("webhooks", request);
  }

  /** GET /webhooks/{webhookId} */
  get(webhookId: UUID): Promise<Webhook> {
    return this.http.get<Webhook>(`webhooks/${webhookId}`);
  }

  /** GET /webhooks */
  list(
    params?: PaginationParams & { status?: string },
  ): Promise<WebhooksPaginatedResponse> {
    return this.http.get<WebhooksPaginatedResponse>("webhooks", params);
  }

  listAll(
    params?: Omit<PaginationParams, "start_after"> & { status?: string },
  ): AsyncGenerator<Webhook[]> {
    return paginate<Webhook>((cursor) =>
      this.http
        .get<WebhooksPaginatedResponse>("webhooks", withCursor(params, cursor))
        .then((r) => ({ items: r.webhooks, page: r.page })),
    );
  }

  /** PUT /webhooks/{webhookId} — setting status='active' reactivates a disabled webhook */
  update(webhookId: UUID, data: UpdateWebhookRequest): Promise<Webhook> {
    return this.http.put<Webhook>(`webhooks/${webhookId}`, data);
  }

  /** DELETE /webhooks/{webhookId} */
  delete(webhookId: UUID): Promise<void> {
    return this.http.deleteVoid(`webhooks/${webhookId}`);
  }

  /** POST /webhooks/{webhookId}/verify — sends a test event to the endpoint */
  verify(webhookId: UUID, data?: VerifyWebhookRequest): Promise<void> {
    return this.http.postVoid(`webhooks/${webhookId}/verify`, data ?? {});
  }
}

// ─── Events ──────────────────────────────────────────────────────────────────

export class EventsResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /events/{eventId} */
  get(eventId: UUID): Promise<MercuryEvent> {
    return this.http.get<MercuryEvent>(`events/${eventId}`);
  }

  /** GET /events — auditable change stream with before/after snapshots */
  list(params?: PaginationParams): Promise<EventsPaginatedResponse> {
    return this.http.get<EventsPaginatedResponse>("events", params);
  }

  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<MercuryEvent[]> {
    return paginate<MercuryEvent>((cursor) =>
      this.http
        .get<EventsPaginatedResponse>("events", withCursor(params, cursor))
        .then((r) => ({ items: r.events, page: r.page })),
    );
  }

  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<MercuryEvent[]> {
    return collectAll<MercuryEvent>(
      (cursor) =>
        this.http
          .get<EventsPaginatedResponse>("events", withCursor(params, cursor))
          .then((r) => ({ items: r.events, page: r.page })),
      maxItems,
    );
  }
}

// ─── Organization ─────────────────────────────────────────────────────────────

export class OrganizationResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /organization */
  get(): Promise<Organization> {
    return this.http.get<Organization>("organization");
  }

  /**
   * POST /onboarding
   * Submit pre-fill data for a new Mercury applicant (partner flows).
   */
  submitOnboarding(data: Record<string, unknown>): Promise<void> {
    return this.http.postVoid("onboarding", data);
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /users/{userId} */
  get(userId: UUID): Promise<MercuryUser> {
    return this.http.get<MercuryUser>(`users/${userId}`);
  }

  /** GET /users */
  list(params?: PaginationParams): Promise<UsersPaginatedResponse> {
    return this.http.get<UsersPaginatedResponse>("users", params);
  }

  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<MercuryUser[]> {
    return paginate<MercuryUser>((cursor) =>
      this.http
        .get<UsersPaginatedResponse>("users", withCursor(params, cursor))
        .then((r) => ({ items: r.users, page: r.page })),
    );
  }

  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<MercuryUser[]> {
    return collectAll<MercuryUser>(
      (cursor) =>
        this.http
          .get<UsersPaginatedResponse>("users", withCursor(params, cursor))
          .then((r) => ({ items: r.users, page: r.page })),
      maxItems,
    );
  }
}

// ─── SAFEs ───────────────────────────────────────────────────────────────────

export class SafeRequestsResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /safe-requests/{safeId} */
  get(safeId: UUID): Promise<SafeRequest> {
    return this.http.get<SafeRequest>(`safe-requests/${safeId}`);
  }

  /** GET /safe-requests */
  list(): Promise<SafeRequest[]> {
    return this.http.get<SafeRequest[]>("safe-requests");
  }

  /**
   * GET /safe-requests/{safeId}/document
   * Returns the SAFE agreement PDF as an ArrayBuffer.
   */
  async downloadDocument(safeId: UUID, apiKey: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://api.mercury.com/api/v1/safe-requests/${safeId}/document`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!response.ok)
      throw new Error(`PDF download failed: ${response.status.toString()}`);
    return response.arrayBuffer();
  }
}

// ─── Credit ───────────────────────────────────────────────────────────────────

export class CreditResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /credit */
  list(): Promise<CreditAccount[]> {
    return this.http.get<CreditAccount[]>("credit");
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export class PaymentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * POST /transfer
   * Transfers funds between two Mercury accounts within the same org.
   * Returns both debit and credit transaction legs.
   */
  createInternalTransfer(
    request: InternalTransferRequest,
  ): Promise<InternalTransferResponse> {
    return this.http.post<InternalTransferResponse>("transfer", request);
  }

  /**
   * POST /request-send-money
   * Creates a send money request requiring approval before execution.
   */
  requestSendMoney(
    request: RequestSendMoneyRequest,
  ): Promise<SendMoneyApprovalRequest> {
    return this.http.post<SendMoneyApprovalRequest>(
      "request-send-money",
      request,
    );
  }

  /** GET /send-money-approval-requests/{id} */
  getApprovalRequest(requestId: UUID): Promise<SendMoneyApprovalRequest> {
    return this.http.get<SendMoneyApprovalRequest>(
      `send-money-approval-requests/${requestId}`,
    );
  }

  /** GET /send-money-approval-requests */
  listApprovalRequests(
    params?: ListApprovalRequestsParams,
  ): Promise<SendMoneyApprovalRequestsPaginatedResponse> {
    return this.http.get<SendMoneyApprovalRequestsPaginatedResponse>(
      "send-money-approval-requests",
      params,
    );
  }

  listAllApprovalRequests(
    params?: Omit<ListApprovalRequestsParams, "start_after">,
  ): AsyncGenerator<SendMoneyApprovalRequest[]> {
    return paginate<SendMoneyApprovalRequest>((cursor) =>
      this.http
        .get<SendMoneyApprovalRequestsPaginatedResponse>(
          "send-money-approval-requests",
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.requests, page: r.page })),
    );
  }

  collectAllApprovalRequests(
    params?: Omit<ListApprovalRequestsParams, "start_after">,
    maxItems?: number,
  ): Promise<SendMoneyApprovalRequest[]> {
    return collectAll<SendMoneyApprovalRequest>(
      (cursor) =>
        this.http
          .get<SendMoneyApprovalRequestsPaginatedResponse>(
            "send-money-approval-requests",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.requests, page: r.page })),
      maxItems,
    );
  }
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export class AttachmentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * GET /attachments/{attachmentId}
   * Returns attachment metadata and a short-lived presigned download URL.
   */
  get(attachmentId: UUID): Promise<Attachment> {
    return this.http.get<Attachment>(`attachments/${attachmentId}`);
  }
}

// ─── Statements ──────────────────────────────────────────────────────────────

export class StatementsResource {
  /**
   * GET /statements/{statementId}/pdf
   * Download a bank statement as raw PDF bytes.
   */
  async downloadPdf(statementId: UUID, apiKey: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://api.mercury.com/api/v1/statements/${statementId}/pdf`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!response.ok)
      throw new Error(`PDF download failed: ${response.status.toString()}`);
    return response.arrayBuffer();
  }
}

// ─── OAuth2 ───────────────────────────────────────────────────────────────────

export class OAuth2Resource {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build the authorization redirect URL for the OAuth2 consent flow.
   * GET /oauth/authorize
   */
  buildAuthorizeUrl(params: OAuth2AuthorizeParams): string {
    const url = new URL("oauth/authorize", this.baseUrl);
    url.searchParams.set("client_id", params.client_id);
    url.searchParams.set("redirect_uri", params.redirect_uri);
    url.searchParams.set("response_type", params.response_type);
    if (params.scope !== undefined) url.searchParams.set("scope", params.scope);
    if (params.state !== undefined) url.searchParams.set("state", params.state);
    return url.toString();
  }

  /**
   * POST /oauth/token
   * Exchange an authorization code for an access token.
   */
  async exchangeCode(
    request: OAuth2TokenRequest,
  ): Promise<OAuth2TokenResponse> {
    const url = new URL("oauth/token", this.baseUrl);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OAuth2 token exchange failed: ${response.status.toString()} ${body}`,
      );
    }
    return response.json() as Promise<OAuth2TokenResponse>;
  }
}
