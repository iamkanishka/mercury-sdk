import type { HttpClient } from "../lib/http.js";
import { paginate, collectAll } from "../lib/paginator.js";
import type {
  RecipientInfo,
  RecipientsPaginatedResponse,
  CreateRecipientRequest,
  UpdateRecipientRequest,
  PaginationParams,
  RecipientAttachment,
  RecipientAttachmentsResponse,
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

export class RecipientsResource {
  constructor(private readonly http: HttpClient) {}

  /** POST /recipients */
  create(request: CreateRecipientRequest): Promise<RecipientInfo> {
    return this.http.post<RecipientInfo>("recipients", request);
  }

  /** GET /recipients/{recipientId} */
  get(recipientId: UUID): Promise<RecipientInfo> {
    return this.http.get<RecipientInfo>(`recipients/${recipientId}`);
  }

  /** GET /recipients */
  list(params?: PaginationParams): Promise<RecipientsPaginatedResponse> {
    return this.http.get<RecipientsPaginatedResponse>("recipients", params);
  }

  /** Auto-paginating async generator over all recipients */
  listAll(
    params?: Omit<PaginationParams, "start_after">,
  ): AsyncGenerator<RecipientInfo[]> {
    return paginate<RecipientInfo>((cursor) =>
      this.http
        .get<RecipientsPaginatedResponse>(
          "recipients",
          withCursor(params, cursor),
        )
        .then((r) => ({ items: r.recipients, page: r.page })),
    );
  }

  /** Collect all recipients into a flat array */
  collectAll(
    params?: Omit<PaginationParams, "start_after">,
    maxItems?: number,
  ): Promise<RecipientInfo[]> {
    return collectAll<RecipientInfo>(
      (cursor) =>
        this.http
          .get<RecipientsPaginatedResponse>(
            "recipients",
            withCursor(params, cursor),
          )
          .then((r) => ({ items: r.recipients, page: r.page })),
      maxItems,
    );
  }

  /** PUT /recipients/{recipientId} */
  update(
    recipientId: UUID,
    data: UpdateRecipientRequest,
  ): Promise<RecipientInfo> {
    return this.http.put<RecipientInfo>(`recipients/${recipientId}`, data);
  }

  /** DELETE /recipients/{recipientId} */
  delete(recipientId: UUID): Promise<void> {
    return this.http.deleteVoid(`recipients/${recipientId}`);
  }

  /** GET /recipients/attachments — org-wide tax form attachments */
  listAttachments(
    params?: PaginationParams,
  ): Promise<RecipientAttachmentsResponse> {
    return this.http.get<RecipientAttachmentsResponse>(
      "recipients/attachments",
      params,
    );
  }

  /**
   * POST /recipients/{recipientId}/attachments
   * Upload a tax form (W-9, W-8BEN, etc.). Uses multipart/form-data.
   */
  async uploadAttachment(
    recipientId: UUID,
    file: Blob,
    fileName: string,
    apiKey: string,
  ): Promise<RecipientAttachment> {
    const form = new FormData();
    form.append("file", file, fileName);
    const response = await fetch(
      `https://api.mercury.com/api/v1/recipients/${recipientId}/attachments`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      },
    );
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status.toString()}`);
    }
    return response.json() as Promise<RecipientAttachment>;
  }
}
