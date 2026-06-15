import type { HttpClient } from "../lib/http.js";
import { paginate, collectAll } from "../lib/paginator.js";
import type {
  Invoice,
  InvoicesPaginatedResponse,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceAttachmentsResponse,
  PaginationParams,
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

export class InvoicesResource {
  constructor(private readonly http: HttpClient) {}

  /** POST /invoices */
  create(request: CreateInvoiceRequest): Promise<Invoice> {
    return this.http.post<Invoice>("invoices", request);
  }

  /** GET /invoices/{invoiceId} */
  get(invoiceId: UUID): Promise<Invoice> {
    return this.http.get<Invoice>(`invoices/${invoiceId}`);
  }

  /** GET /invoices */
  list(params?: PaginationParams): Promise<InvoicesPaginatedResponse> {
    return this.http.get<InvoicesPaginatedResponse>("invoices", params);
  }

  /** Auto-paginating async generator over all invoices */
  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<Invoice[]> {
    return paginate<Invoice>((cursor) =>
      this.http
        .get<InvoicesPaginatedResponse>("invoices", withCursor(params, cursor))
        .then((r) => ({ items: r.invoices, page: r.page })),
    );
  }

  /** Collect all invoices into a flat array */
  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<Invoice[]> {
    return collectAll<Invoice>(
      (cursor) =>
        this.http
          .get<InvoicesPaginatedResponse>(
            "invoices",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.invoices, page: r.page })),
      maxItems,
    );
  }

  /** PUT /invoices/{invoiceId} */
  update(invoiceId: UUID, data: UpdateInvoiceRequest): Promise<Invoice> {
    return this.http.put<Invoice>(`invoices/${invoiceId}`, data);
  }

  /** POST /invoices/{invoiceId}/cancel — irreversible */
  cancel(invoiceId: UUID): Promise<Invoice> {
    return this.http.post<Invoice>(`invoices/${invoiceId}/cancel`);
  }

  /**
   * GET /invoices/{invoiceId}/pdf
   * Returns the invoice as a PDF ArrayBuffer.
   */
  async downloadPdf(invoiceId: UUID, apiKey: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://api.mercury.com/api/v1/invoices/${invoiceId}/pdf`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!response.ok)
      throw new Error(`PDF download failed: ${response.status.toString()}`);
    return response.arrayBuffer();
  }

  /** GET /invoices/{invoiceId}/attachments */
  listAttachments(invoiceId: UUID): Promise<InvoiceAttachmentsResponse> {
    return this.http.get<InvoiceAttachmentsResponse>(
      `invoices/${invoiceId}/attachments`,
    );
  }
}
