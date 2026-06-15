import { createHttpClient, type HttpClientOptions } from "./lib/http.js";
import type { RetryOptions } from "./lib/retry.js";
import { AccountsResource } from "./resources/accounts.js";
import { TransactionsResource } from "./resources/transactions.js";
import { RecipientsResource } from "./resources/recipients.js";
import { InvoicesResource } from "./resources/invoices.js";
import {
  CategoriesResource,
  CustomersResource,
  TreasuryResource,
  WebhooksResource,
  EventsResource,
  OrganizationResource,
  UsersResource,
  SafeRequestsResource,
  CreditResource,
  PaymentsResource,
  AttachmentsResource,
  StatementsResource,
  OAuth2Resource,
} from "./resources/index.js";

export interface MercuryClientOptions {
  /**
   * Mercury API token. Must include the `secret-token:` prefix.
   * @example "secret-token:mercury_production_..."
   */
  apiKey: string;
  /**
   * Override the base URL (useful for sandbox/testing).
   * @default "https://api.mercury.com/api/v1/"
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @default 30_000
   */
  timeoutMs?: number;
  /** Retry configuration for transient failures. */
  retry?: Partial<RetryOptions>;
  /** Hook called before every request — useful for logging and tracing. */
  onRequest?: HttpClientOptions["onRequest"];
  /** Hook called after every response — useful for metrics. */
  onResponse?: HttpClientOptions["onResponse"];
}

/**
 * Mercury Banking API SDK.
 *
 * Covers all 59 endpoints across 15 resource namespaces with:
 * - Full TypeScript types (branded UUIDs, exhaustive enums)
 * - Auto-pagination on every list endpoint
 * - Exponential backoff retry on 429/5xx
 * - Rich error hierarchy for surgical catch blocks
 *
 * @example
 * ```ts
 * import { MercuryClient } from "mercury-sdk";
 *
 * const mercury = new MercuryClient({ apiKey: "secret-token:..." });
 *
 * // Get one account
 * const account = await mercury.accounts.get(accountId);
 *
 * // Stream all transactions across the org
 * for await (const page of mercury.transactions.listAll({ status: ["sent"] })) {
 *   await ingestBatch(page);
 * }
 *
 * // Internal transfer — both legs returned
 * const { debitTransaction, creditTransaction } =
 *   await mercury.payments.createInternalTransfer({
 *     sourceAccountId, destinationAccountId,
 *     amount: 1000, idempotencyKey: crypto.randomUUID(),
 *   });
 * ```
 */
export class MercuryClient {
  /** The resolved API key — used internally for multipart requests */
  readonly apiKey: string;
  readonly baseUrl: string;

  readonly accounts: AccountsResource;
  readonly transactions: TransactionsResource;
  readonly recipients: RecipientsResource;
  readonly invoices: InvoicesResource;
  readonly categories: CategoriesResource;
  readonly customers: CustomersResource;
  readonly treasury: TreasuryResource;
  readonly webhooks: WebhooksResource;
  readonly events: EventsResource;
  readonly organization: OrganizationResource;
  readonly users: UsersResource;
  readonly safeRequests: SafeRequestsResource;
  readonly credit: CreditResource;
  readonly payments: PaymentsResource;
  readonly attachments: AttachmentsResource;
  readonly statements: StatementsResource;
  readonly oauth2: OAuth2Resource;

  constructor(options: MercuryClientOptions) {
    if (!options.apiKey) {
      throw new Error("MercuryClient: apiKey is required");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.mercury.com/api/v1/";

    const retry: RetryOptions | undefined = options.retry
      ? {
          maxRetries: options.retry.maxRetries ?? 3,
          initialDelayMs: options.retry.initialDelayMs ?? 500,
          maxDelayMs: options.retry.maxDelayMs ?? 30_000,
          jitter: options.retry.jitter ?? 0.25,
        }
      : undefined;

    const httpOpts: Partial<Omit<HttpClientOptions, "apiKey">> = {
      baseUrl: this.baseUrl,
      timeoutMs: options.timeoutMs,
      retry,
    };
    if (options.onRequest) httpOpts.onRequest = options.onRequest;
    if (options.onResponse) httpOpts.onResponse = options.onResponse;

    const http = createHttpClient(options.apiKey, httpOpts);

    this.accounts = new AccountsResource(http);
    this.transactions = new TransactionsResource(http);
    this.recipients = new RecipientsResource(http);
    this.invoices = new InvoicesResource(http);
    this.categories = new CategoriesResource(http);
    this.customers = new CustomersResource(http);
    this.treasury = new TreasuryResource(http);
    this.webhooks = new WebhooksResource(http);
    this.events = new EventsResource(http);
    this.organization = new OrganizationResource(http);
    this.users = new UsersResource(http);
    this.safeRequests = new SafeRequestsResource(http);
    this.credit = new CreditResource(http);
    this.payments = new PaymentsResource(http);
    this.attachments = new AttachmentsResource(http);
    this.statements = new StatementsResource();
    this.oauth2 = new OAuth2Resource(this.baseUrl);
  }
}
