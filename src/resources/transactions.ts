import type { HttpClient } from "../lib/http.js";
import { paginate, collectAll } from "../lib/paginator.js";
import type {
  Transaction,
  TransactionsPaginatedResponse,
  ListTransactionsParams,
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

export class TransactionsResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /transaction/{transactionId} */
  get(transactionId: UUID): Promise<Transaction> {
    return this.http.get<Transaction>(`transaction/${transactionId}`);
  }

  /** GET /transactions — all transactions across all accounts */
  list(
    params?: ListTransactionsParams,
  ): Promise<TransactionsPaginatedResponse> {
    return this.http.get<TransactionsPaginatedResponse>("transactions", params);
  }

  /** Auto-paginating async generator */
  listAll(
    params?: Omit<ListTransactionsParams, "start_after">,
  ): AsyncGenerator<Transaction[]> {
    return paginate<Transaction>((cursor) =>
      this.http
        .get<TransactionsPaginatedResponse>(
          "transactions",
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.transactions, page: r.page })),
    );
  }

  /** Collect all transactions into a flat array */
  collectAll(
    params?: Omit<ListTransactionsParams, "start_after">,
    maxItems?: number,
  ): Promise<Transaction[]> {
    return collectAll<Transaction>(
      (cursor) =>
        this.http
          .get<TransactionsPaginatedResponse>(
            "transactions",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.transactions, page: r.page })),
      maxItems,
    );
  }

  /**
   * POST /transaction/{transactionId} — update note and/or category.
   * Pass null to clear a field.
   */
  update(
    transactionId: UUID,
    data: { note?: string | null; categoryId?: UUID | null },
  ): Promise<Transaction> {
    return this.http.post<Transaction>(`transaction/${transactionId}`, data);
  }

  /**
   * POST /transaction/{transactionId}/attachment
   * Uploads a receipt or file attachment. Uses multipart/form-data.
   */
  async uploadAttachment(
    transactionId: UUID,
    file: Blob,
    fileName: string,
    apiKey: string,
  ): Promise<void> {
    const form = new FormData();
    form.append("file", file, fileName);
    const response = await fetch(
      `https://api.mercury.com/api/v1/transaction/${transactionId}/attachment`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      },
    );
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status.toString()}`);
    }
  }
}
