import type { HttpClient } from "../lib/http.js";
import { paginate, collectAll } from "../lib/paginator.js";
import type {
  Account,
  AccountsPaginatedResponse,
  AccountStatementsPaginatedResponse,
  Card,
  GetStatementsParams,
  PaginationParams,
  Transaction,
  TransactionsPaginatedResponse,
  ListTransactionsParams,
  SendMoneyRequest,
  UUID,
} from "../types/index.js";

type Cursor = UUID | undefined;

function withCursor(
  params: Record<string, unknown> | undefined,
  cursor: Cursor,
): Record<string, unknown> {
  const base: Record<string, unknown> = params ? { ...params } : {};
  if (cursor !== undefined) {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    base["start_after"] = cursor;
  }
  return base;
}

export class AccountsResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /account/{accountId} */
  get(accountId: UUID): Promise<Account> {
    return this.http.get<Account>(`account/${accountId}`);
  }

  /** GET /accounts */
  list(params?: PaginationParams): Promise<AccountsPaginatedResponse> {
    return this.http.get<AccountsPaginatedResponse>("accounts", params);
  }

  /** Auto-paginating async generator over all accounts */
  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<Account[]> {
    return paginate<Account>((cursor) =>
      this.http
        .get<AccountsPaginatedResponse>("accounts", withCursor(params, cursor))
        .then((r) => ({ items: r.accounts, page: r.page })),
    );
  }

  /** Collect all accounts into a flat array */
  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<Account[]> {
    return collectAll<Account>(
      (cursor) =>
        this.http
          .get<AccountsPaginatedResponse>(
            "accounts",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.accounts, page: r.page })),
      maxItems,
    );
  }

  /** GET /account/{accountId}/cards */
  getCards(accountId: UUID): Promise<Card[]> {
    return this.http.get<Card[]>(`account/${accountId}/cards`);
  }

  /** GET /account/{accountId}/statements */
  listStatements(
    accountId: UUID,
    params?: GetStatementsParams,
  ): Promise<AccountStatementsPaginatedResponse> {
    return this.http.get<AccountStatementsPaginatedResponse>(
      `account/${accountId}/statements`,
      params,
    );
  }

  /** GET /account/{accountId}/transactions */
  listTransactions(
    accountId: UUID,
    params?: Omit<ListTransactionsParams, "accountId">,
  ): Promise<TransactionsPaginatedResponse> {
    return this.http.get<TransactionsPaginatedResponse>(
      `account/${accountId}/transactions`,
      params,
    );
  }

  /** Auto-paginating async generator over account transactions */
  listAllTransactions(
    accountId: UUID,
    params?: Omit<ListTransactionsParams, "accountId" | "start_after">,
  ): AsyncGenerator<Transaction[]> {
    return paginate<Transaction>((cursor) =>
      this.http
        .get<TransactionsPaginatedResponse>(
          `account/${accountId}/transactions`,
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.transactions, page: r.page })),
    );
  }

  /** POST /account/{accountId}/transactions — send money to a recipient */
  sendMoney(accountId: UUID, request: SendMoneyRequest): Promise<Transaction> {
    return this.http.post<Transaction>(
      `account/${accountId}/transactions`,
      request,
    );
  }
}
