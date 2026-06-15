import { describe, it, expect, vi, afterEach } from "vitest";
import { MercuryClient } from "../src/client.js";
import {
  MercuryAuthError,
  MercuryNotFoundError,
  MercuryValidationError,
  MercuryConflictError,
  MercuryRateLimitError,
  MercuryServerError,
  MercuryNetworkError,
  MercuryError,
} from "../src/lib/errors.js";
import { paginate, collectAll } from "../src/lib/paginator.js";
import { withRetry } from "../src/lib/retry.js";
import type {
  Account, Transaction, RecipientInfo, Invoice, Category,
  Customer, Webhook, MercuryEvent, Organization, MercuryUser,
  SafeRequest, CreditAccount, SendMoneyApprovalRequest,
  InternalTransferResponse, UUID,
} from "../src/types/index.js";

// ─── Typed fetch call helpers ─────────────────────────────────────────────────
// `mock.calls[n]` is `T[] | undefined` under noUncheckedIndexedAccess.
// These helpers assert the call exists and return typed tuples.

function getCallUrl(fetchMock: ReturnType<typeof vi.fn>, callIdx = 0): string {
  const call = fetchMock.mock.calls[callIdx];
  if (!call) throw new Error(`fetch call [${callIdx.toString()}] does not exist`);
  return call[0] as string;
}

function getCallArgs(
  fetchMock: ReturnType<typeof vi.fn>,
  callIdx = 0,
): [string, RequestInit] {
  const call = fetchMock.mock.calls[callIdx];
  if (!call) throw new Error(`fetch call [${callIdx.toString()}] does not exist`);
  return [call[0] as string, call[1] as RequestInit];
}

function getHeaders(fetchMock: ReturnType<typeof vi.fn>, callIdx = 0): Record<string, string> {
  const [, init] = getCallArgs(fetchMock, callIdx);
  return (init.headers ?? {}) as Record<string, string>;
}

function getBody(fetchMock: ReturnType<typeof vi.fn>, callIdx = 0): Record<string, unknown> {
  const [, init] = getCallArgs(fetchMock, callIdx);
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

// ─── Mock fetch factory ───────────────────────────────────────────────────────

function mockFetch(
  responses: Array<{ status: number; body?: unknown; headers?: Record<string, string> }>,
) {
  let call = 0;
  return vi.fn(() => {
    const r = responses[call] ?? responses[responses.length - 1];
    if (!r) throw new Error("No mock response configured");
    call++;
    const isNoContent = r.status === 204 || r.status === 304;
    const body = isNoContent
      ? null
      : r.body !== undefined
        ? JSON.stringify(r.body)
        : "";
    return Promise.resolve(
      new Response(body, {
        status: r.status,
        headers: { "Content-Type": "application/json", ...r.headers },
      }),
    );
  });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ID = "00000000-0000-0000-0000-000000000001" as UUID;
const ID2 = "00000000-0000-0000-0000-000000000002" as UUID;

function makeAccount(o: Partial<Account> = {}): Account {
  return {
    id: ID, accountNumber: "1234567890", routingNumber: "021000021",
    name: "Mercury Checking", legalBusinessName: "Acme Corp",
    kind: "checking", type: "mercury", status: "active",
    availableBalance: 10000.0, currentBalance: 10500.0,
    createdAt: "2024-01-01T00:00:00Z" as never,
    dashboardLink: "https://app.mercury.com/accounts/acc-1",
    ...o,
  };
}

function makeTransaction(o: Partial<Transaction> = {}): Transaction {
  return {
    id: ID, accountId: ID, amount: 500.0, status: "sent", kind: "outgoingPayment",
    createdAt: "2024-06-01T10:00:00Z" as never,
    estimatedDeliveryDate: "2024-06-03T00:00:00Z" as never,
    counterpartyId: ID2, counterpartyName: "Vendor Inc",
    dashboardLink: "https://app.mercury.com/transactions/txn-1",
    compliantWithReceiptPolicy: true, hasGeneratedReceipt: false,
    glAllocations: [], attachments: [], relatedTransactions: [],
    ...o,
  };
}

function makeRecipient(o: Partial<RecipientInfo> = {}): RecipientInfo {
  return {
    id: ID, status: "active", name: "Vendor Inc",
    emails: ["vendor@example.com" as never],
    defaultPaymentMethod: "ach", attachments: [],
    ...o,
  };
}

function makeInvoice(o: Partial<Invoice> = {}): Invoice {
  return {
    id: ID, status: "draft", amount: 1000, currency: "USD" as never,
    createdAt: "2024-01-01T00:00:00Z" as never,
    updatedAt: "2024-01-01T00:00:00Z" as never,
    ...o,
  };
}

function makeCategory(o: Partial<Category> = {}): Category {
  return {
    id: ID, name: "Software",
    visibleForReimbursements: false, visibleForCardSpend: true, visibleForOther: true,
    ...o,
  };
}

function makeWebhook(o: Partial<Webhook> = {}): Webhook {
  return {
    id: ID, url: "https://example.com/webhook", status: "active",
    eventTypes: ["transaction.created"],
    createdAt: "2024-01-01T00:00:00Z" as never,
    updatedAt: "2024-01-01T00:00:00Z" as never,
    ...o,
  };
}

function makeCustomer(o: Partial<Customer> = {}): Customer {
  return {
    id: ID, name: "Acme Corp",
    createdAt: "2024-01-01T00:00:00Z" as never,
    updatedAt: "2024-01-01T00:00:00Z" as never,
    ...o,
  };
}

function makeEvent(o: Partial<MercuryEvent> = {}): MercuryEvent {
  return { id: ID, type: "account.updated", createdAt: "2024-01-01T00:00:00Z" as never, ...o };
}

function makeUser(o: Partial<MercuryUser> = {}): MercuryUser {
  return {
    id: ID, name: "Jane Doe", email: "jane@example.com" as never,
    role: "admin", createdAt: "2024-01-01T00:00:00Z" as never,
    ...o,
  };
}

// ─── MercuryClient construction ───────────────────────────────────────────────

describe("MercuryClient", () => {
  it("throws if apiKey is missing", () => {
    expect(() => new MercuryClient({ apiKey: "" })).toThrow("apiKey is required");
  });

  it("exposes all 17 resource namespaces", () => {
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    expect(c.accounts).toBeDefined();
    expect(c.transactions).toBeDefined();
    expect(c.recipients).toBeDefined();
    expect(c.invoices).toBeDefined();
    expect(c.categories).toBeDefined();
    expect(c.customers).toBeDefined();
    expect(c.treasury).toBeDefined();
    expect(c.webhooks).toBeDefined();
    expect(c.events).toBeDefined();
    expect(c.organization).toBeDefined();
    expect(c.users).toBeDefined();
    expect(c.safeRequests).toBeDefined();
    expect(c.credit).toBeDefined();
    expect(c.payments).toBeDefined();
    expect(c.attachments).toBeDefined();
    expect(c.statements).toBeDefined();
    expect(c.oauth2).toBeDefined();
  });

  it("stores resolved baseUrl", () => {
    const c = new MercuryClient({
      apiKey: "secret-token:test",
      baseUrl: "https://sandbox.mercury.com/api/v1/",
    });
    expect(c.baseUrl).toBe("https://sandbox.mercury.com/api/v1/");
  });
});

// ─── Accounts ─────────────────────────────────────────────────────────────────

describe("accounts.get", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /account/{id}", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeAccount() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const account = await c.accounts.get(ID);
    expect(account.id).toBe(ID);
    expect(getCallUrl(fetchMock)).toContain(`account/${ID}`);
  });

  it("sends Bearer token", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeAccount() }]));
    const c = new MercuryClient({ apiKey: "secret-token:mykey" });
    await c.accounts.get(ID);
    expect(getHeaders(vi.mocked(fetch))["Authorization"]).toBe("Bearer secret-token:mykey");
  });
});

describe("accounts.list", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns paginated response", async () => {
    vi.stubGlobal("fetch", mockFetch([{
      status: 200, body: { accounts: [makeAccount()], page: { nextPage: ID2 } },
    }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.accounts.list({ limit: 10 });
    expect(result.accounts).toHaveLength(1);
    expect(result.page.nextPage).toBe(ID2);
  });

  it("passes query params", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { accounts: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.accounts.list({ limit: 5, order: "desc" });
    const url = getCallUrl(fetchMock);
    expect(url).toContain("limit=5");
    expect(url).toContain("order=desc");
  });
});

describe("accounts.collectAll", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("auto-paginates three pages", async () => {
    vi.stubGlobal("fetch", mockFetch([
      { status: 200, body: { accounts: [makeAccount({ id: "a1" as UUID })], page: { nextPage: "a1" } } },
      { status: 200, body: { accounts: [makeAccount({ id: "a2" as UUID })], page: { nextPage: "a2" } } },
      { status: 200, body: { accounts: [makeAccount({ id: "a3" as UUID })], page: {} } },
    ]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const all = await c.accounts.collectAll();
    expect(all).toHaveLength(3);
    expect(all.map((a) => a.id)).toEqual(["a1", "a2", "a3"]);
  });

  it("respects maxItems", async () => {
    vi.stubGlobal("fetch", mockFetch(
      Array.from({ length: 10 }, (_, i) => ({
        status: 200,
        body: { accounts: [makeAccount({ id: `a${i.toString()}` as UUID })], page: { nextPage: `a${i.toString()}` } },
      })),
    ));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const all = await c.accounts.collectAll(undefined, 3);
    expect(all.length).toBeLessThanOrEqual(3);
  });
});

describe("accounts.getCards", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /account/{id}/cards", async () => {
    const cards = [{ id: ID, accountId: ID, type: "debit", status: "active", lastFour: "4242", cardholderName: "Jane Doe", expirationDate: "2026-12", createdAt: "2024-01-01T00:00:00Z" }];
    const fetchMock = mockFetch([{ status: 200, body: cards }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.accounts.getCards(ID);
    expect(result).toHaveLength(1);
    expect(result[0]?.lastFour).toBe("4242");
    expect(getCallUrl(fetchMock)).toContain(`account/${ID}/cards`);
  });
});

describe("accounts.listStatements", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /account/{id}/statements with date filter", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { statements: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.accounts.listStatements(ID, { start: "2024-01-01" });
    const url = getCallUrl(fetchMock);
    expect(url).toContain(`account/${ID}/statements`);
    expect(url).toContain("start=2024-01-01");
  });
});

describe("accounts.listTransactions", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /account/{id}/transactions with filters", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { transactions: [makeTransaction()], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.accounts.listTransactions(ID, { status: ["sent"], limit: 25 });
    expect(result.transactions).toHaveLength(1);
    const url = getCallUrl(fetchMock);
    expect(url).toContain(`account/${ID}/transactions`);
    expect(url).toContain("status=sent");
  });
});

describe("accounts.listAllTransactions", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("streams pages from account transactions", async () => {
    vi.stubGlobal("fetch", mockFetch([
      { status: 200, body: { transactions: [makeTransaction()], page: { nextPage: ID2 } } },
      { status: 200, body: { transactions: [makeTransaction({ id: ID2 })], page: {} } },
    ]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const all: Transaction[] = [];
    for await (const page of c.accounts.listAllTransactions(ID)) {
      all.push(...page);
    }
    expect(all).toHaveLength(2);
  });
});

describe("accounts.sendMoney", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("POST /account/{id}/transactions", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeTransaction() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const txn = await c.accounts.sendMoney(ID, {
      recipientId: ID2, amount: 500.0, paymentMethod: "ach", idempotencyKey: "idem-001",
    });
    expect(txn.amount).toBe(500.0);
    const [url, init] = getCallArgs(fetchMock);
    expect(url).toContain(`account/${ID}/transactions`);
    expect(init.method).toBe("POST");
    const body = getBody(fetchMock);
    expect(body["idempotencyKey"]).toBe("idem-001");
    expect(body["paymentMethod"]).toBe("ach");
  });

  it("sends wire purpose for domesticWire", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeTransaction() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.accounts.sendMoney(ID, {
      recipientId: ID2, amount: 1000, paymentMethod: "domesticWire",
      idempotencyKey: "wire-1",
      purpose: { simple: { category: "Vendor", additionalInfo: "Acme" } },
    });
    const body = getBody(fetchMock);
    expect((body["purpose"] as Record<string, unknown>)?.["simple"]).toBeDefined();
  });
});

// ─── Transactions ─────────────────────────────────────────────────────────────

describe("transactions.get", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /transaction/{id}", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeTransaction() }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const txn = await c.transactions.get(ID);
    expect(txn.id).toBe(ID);
    expect(txn.status).toBe("sent");
  });
});

describe("transactions.list", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("filters by status array", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { transactions: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.transactions.list({ status: ["sent", "pending"], limit: 50 });
    const url = getCallUrl(fetchMock);
    expect(url).toContain("status=sent");
    expect(url).toContain("status=pending");
    expect(url).toContain("limit=50");
  });

  it("filters by date range", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { transactions: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.transactions.list({ start: "2024-01-01", end: "2024-12-31" });
    const url = getCallUrl(fetchMock);
    expect(url).toContain("start=2024-01-01");
    expect(url).toContain("end=2024-12-31");
  });

  it("filters by multiple accountIds", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { transactions: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.transactions.list({ accountId: [ID, ID2] });
    const url = getCallUrl(fetchMock);
    expect(url).toContain(`accountId=${ID}`);
    expect(url).toContain(`accountId=${ID2}`);
  });
});

describe("transactions.update", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("POST /transaction/{id} with note and categoryId", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeTransaction({ note: "Updated" }) }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.transactions.update(ID, { note: "Updated", categoryId: ID2 });
    expect(result.note).toBe("Updated");
    const [, init] = getCallArgs(fetchMock);
    expect(init.method).toBe("POST");
    const body = getBody(fetchMock);
    expect(body["note"]).toBe("Updated");
    expect(body["categoryId"]).toBe(ID2);
  });
});

// ─── Recipients ───────────────────────────────────────────────────────────────

describe("recipients.create", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("POST /recipients with ACH routing info", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeRecipient() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const rcp = await c.recipients.create({
      name: "Vendor Inc",
      emails: ["vendor@example.com" as never],
      electronicRoutingInfo: {
        accountNumber: "123456", routingNumber: "021000021",
        electronicAccountType: "businessChecking",
        address: { address1: "123 Main St", city: "SF", region: "CA" as never, postalCode: "94105", country: "US" as never },
      },
    });
    expect(rcp.name).toBe("Vendor Inc");
    expect(getCallUrl(fetchMock)).toContain("recipients");
  });
});

describe("recipients.update", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("PUT /recipients/{id}", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeRecipient({ name: "New Name" }) }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.recipients.update(ID, { name: "New Name" });
    expect(result.name).toBe("New Name");
    expect(getCallArgs(fetchMock)[1].method).toBe("PUT");
  });
});

describe("recipients.delete", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("DELETE /recipients/{id}", async () => {
    const fetchMock = mockFetch([{ status: 204 }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.recipients.delete(ID);
    expect(getCallArgs(fetchMock)[1].method).toBe("DELETE");
  });
});

describe("recipients.listAttachments", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /recipients/attachments", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { attachments: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.recipients.listAttachments();
    expect(result.attachments).toEqual([]);
    expect(getCallUrl(fetchMock)).toContain("recipients/attachments");
  });
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

describe("invoices.create", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("POST /invoices", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeInvoice() }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const inv = await c.invoices.create({ amount: 1000, currency: "USD" as never });
    expect(inv.amount).toBe(1000);
  });
});

describe("invoices.cancel", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("POST /invoices/{id}/cancel", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeInvoice({ status: "cancelled" }) }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.invoices.cancel(ID);
    expect(result.status).toBe("cancelled");
    const [url, init] = getCallArgs(fetchMock);
    expect(url).toContain(`invoices/${ID}/cancel`);
    expect(init.method).toBe("POST");
  });
});

describe("invoices.listAttachments", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /invoices/{id}/attachments", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { attachments: [] } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.invoices.listAttachments(ID);
    expect(result.attachments).toEqual([]);
    expect(getCallUrl(fetchMock)).toContain(`invoices/${ID}/attachments`);
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

describe("categories", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("create POST /categories", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeCategory() }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const cat = await c.categories.create({ name: "Software" });
    expect(cat.name).toBe("Software");
    expect(cat.visibleForCardSpend).toBe(true);
    expect(cat.visibleForReimbursements).toBe(false);
  });

  it("update PUT /categories/{id}", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeCategory({ name: "Renamed" }) }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.categories.update(ID, { name: "Renamed" });
    expect(result.name).toBe("Renamed");
    expect(getCallArgs(fetchMock)[1].method).toBe("PUT");
  });

  it("delete DELETE /categories/{id}", async () => {
    const fetchMock = mockFetch([{ status: 204 }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.categories.delete(ID);
    expect(getCallArgs(fetchMock)[1].method).toBe("DELETE");
  });
});

// ─── Customers ────────────────────────────────────────────────────────────────

describe("customers", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("full CRUD cycle", async () => {
    const fetchMock = mockFetch([
      { status: 200, body: makeCustomer() },
      { status: 200, body: makeCustomer() },
      { status: 200, body: makeCustomer({ name: "New Name" }) },
      { status: 204 },
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const created = await c.customers.create({ name: "Acme Corp" });
    expect(created.name).toBe("Acme Corp");
    const got = await c.customers.get(ID);
    expect(got.id).toBe(ID);
    const updated = await c.customers.update(ID, { name: "New Name" });
    expect(updated.name).toBe("New Name");
    await c.customers.delete(ID);
    const methods = fetchMock.mock.calls.map((_call, i) => getCallArgs(fetchMock, i)[1].method);
    expect(methods).toEqual(["POST", "GET", "PUT", "DELETE"]);
  });
});

// ─── Treasury ─────────────────────────────────────────────────────────────────

describe("treasury", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("list GET /treasury", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { accounts: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.treasury.list();
    expect(result.accounts).toEqual([]);
    expect(getCallUrl(fetchMock)).toContain("/treasury");
  });

  it("listTransactions GET /treasury/{id}/transactions", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { transactions: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.treasury.listTransactions(ID);
    expect(getCallUrl(fetchMock)).toContain(`treasury/${ID}/transactions`);
  });

  it("listStatements GET /treasury/{id}/statements with documentType", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { statements: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.treasury.listStatements(ID, { documentType: "monthlyStatement" });
    const url = getCallUrl(fetchMock);
    expect(url).toContain(`treasury/${ID}/statements`);
    expect(url).toContain("documentType=monthlyStatement");
  });
});

// ─── Webhooks ─────────────────────────────────────────────────────────────────

describe("webhooks", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("create POST /webhooks", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeWebhook() }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const wh = await c.webhooks.create({ url: "https://example.com/webhook", eventTypes: ["transaction.created"] });
    expect(wh.id).toBe(ID);
    expect(wh.eventTypes).toContain("transaction.created");
  });

  it("get GET /webhooks/{id}", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeWebhook() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const wh = await c.webhooks.get(ID);
    expect(wh.status).toBe("active");
    expect(getCallUrl(fetchMock)).toContain(`webhooks/${ID}`);
  });

  it("update PUT /webhooks/{id}", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeWebhook({ status: "active" }) }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.webhooks.update(ID, { status: "active" });
    expect(result.status).toBe("active");
    expect(getCallArgs(fetchMock)[1].method).toBe("PUT");
  });

  it("delete DELETE /webhooks/{id}", async () => {
    const fetchMock = mockFetch([{ status: 204 }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.webhooks.delete(ID);
    expect(getCallArgs(fetchMock)[1].method).toBe("DELETE");
  });

  it("verify POST /webhooks/{id}/verify", async () => {
    const fetchMock = mockFetch([{ status: 204 }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.webhooks.verify(ID, { eventType: "transaction.created" });
    const [url, init] = getCallArgs(fetchMock);
    expect(url).toContain(`webhooks/${ID}/verify`);
    expect(init.method).toBe("POST");
  });

  it("list with status filter", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { webhooks: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.webhooks.list({ status: "active" });
    expect(getCallUrl(fetchMock)).toContain("status=active");
  });
});

// ─── Events ───────────────────────────────────────────────────────────────────

describe("events", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("get GET /events/{id}", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeEvent() }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const evt = await c.events.get(ID);
    expect(evt.type).toBe("account.updated");
  });

  it("list GET /events", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: { events: [makeEvent()], page: {} } }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.events.list();
    expect(result.events).toHaveLength(1);
  });

  it("collectAll paginates events", async () => {
    vi.stubGlobal("fetch", mockFetch([
      { status: 200, body: { events: [makeEvent()], page: { nextPage: ID2 } } },
      { status: 200, body: { events: [makeEvent({ id: ID2 })], page: {} } },
    ]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const all = await c.events.collectAll();
    expect(all).toHaveLength(2);
  });
});

// ─── Organization ─────────────────────────────────────────────────────────────

describe("organization", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("get GET /organization", async () => {
    const org: Organization = { id: ID, legalBusinessName: "Acme Corp", ein: "12-3456789", dbas: [] };
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: org }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.organization.get();
    expect(result.legalBusinessName).toBe("Acme Corp");
  });

  it("submitOnboarding POST /onboarding", async () => {
    const fetchMock = mockFetch([{ status: 204 }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.organization.submitOnboarding({ companyName: "Acme" });
    const [url, init] = getCallArgs(fetchMock);
    expect(url).toContain("onboarding");
    expect(init.method).toBe("POST");
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

describe("users", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("get GET /users/{id}", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeUser() }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    expect((await c.users.get(ID)).role).toBe("admin");
  });

  it("list GET /users", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: { users: [makeUser()], page: {} } }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    expect((await c.users.list()).users).toHaveLength(1);
  });

  it("collectAll paginates", async () => {
    vi.stubGlobal("fetch", mockFetch([
      { status: 200, body: { users: [makeUser()], page: { nextPage: ID2 } } },
      { status: 200, body: { users: [makeUser({ id: ID2 })], page: {} } },
    ]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    expect(await c.users.collectAll()).toHaveLength(2);
  });
});

// ─── SAFEs ────────────────────────────────────────────────────────────────────

describe("safeRequests", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  const makeSafe = (o: Partial<SafeRequest> = {}): SafeRequest => ({
    id: ID, status: "pending", amount: 500000, currency: "USD" as never,
    createdAt: "2024-01-01T00:00:00Z" as never, ...o,
  });

  it("get GET /safe-requests/{id}", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeSafe() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    expect((await c.safeRequests.get(ID)).amount).toBe(500000);
    expect(getCallUrl(fetchMock)).toContain(`safe-requests/${ID}`);
  });

  it("list GET /safe-requests", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: [makeSafe()] }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    expect(await c.safeRequests.list()).toHaveLength(1);
  });
});

// ─── Credit ───────────────────────────────────────────────────────────────────

describe("credit", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("list GET /credit", async () => {
    const accounts: CreditAccount[] = [{
      id: ID, name: "Mercury Credit", creditLimit: 50000, availableCredit: 45000,
      currentBalance: 5000, status: "active", createdAt: "2024-01-01T00:00:00Z" as never,
    }];
    const fetchMock = mockFetch([{ status: 200, body: accounts }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.credit.list();
    expect(result[0]?.creditLimit).toBe(50000);
    expect(getCallUrl(fetchMock)).toContain("/credit");
  });
});

// ─── Payments ─────────────────────────────────────────────────────────────────

describe("payments.createInternalTransfer", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("POST /transfer — correct endpoint and response shape", async () => {
    const transferResponse: InternalTransferResponse = {
      debitTransaction: makeTransaction({ kind: "internalTransfer", amount: -1000 }),
      creditTransaction: makeTransaction({ id: ID2, kind: "internalTransfer", amount: 1000 }),
    };
    const fetchMock = mockFetch([{ status: 200, body: transferResponse }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.payments.createInternalTransfer({
      sourceAccountId: ID, destinationAccountId: ID2,
      amount: 1000, idempotencyKey: "xfer-001",
    });
    expect(result.debitTransaction.amount).toBe(-1000);
    expect(result.creditTransaction.amount).toBe(1000);
    const [url, init] = getCallArgs(fetchMock);
    expect(url).toMatch(/\/transfer$/);
    expect(init.method).toBe("POST");
    const body = getBody(fetchMock);
    expect(body["sourceAccountId"]).toBe(ID);
    expect(body["destinationAccountId"]).toBe(ID2);
  });
});

describe("payments.requestSendMoney", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("POST /request-send-money", async () => {
    const approval: SendMoneyApprovalRequest = {
      id: ID, accountId: ID, amount: 500, status: "pending",
      recipientId: ID2, paymentMethod: "ach",
      createdAt: "2024-01-01T00:00:00Z" as never,
      updatedAt: "2024-01-01T00:00:00Z" as never,
    };
    const fetchMock = mockFetch([{ status: 200, body: approval }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.payments.requestSendMoney({ recipientId: ID2, accountId: ID, amount: 500, paymentMethod: "ach" });
    expect(result.status).toBe("pending");
    expect(getCallUrl(fetchMock)).toContain("request-send-money");
  });
});

describe("payments.listApprovalRequests", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /send-money-approval-requests with filters", async () => {
    const fetchMock = mockFetch([{ status: 200, body: { requests: [], page: {} } }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.payments.listApprovalRequests({ accountId: ID, status: "pending" });
    const url = getCallUrl(fetchMock);
    expect(url).toContain("send-money-approval-requests");
    expect(url).toContain(`accountId=${ID}`);
    expect(url).toContain("status=pending");
  });
});

// ─── Attachments ──────────────────────────────────────────────────────────────

describe("attachments.get", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("GET /attachments/{id}", async () => {
    const att = { id: ID, fileName: "receipt.pdf", url: "https://s3.example.com/f", downloadUrl: "https://s3.example.com/d", createdAt: "2024-01-01T00:00:00Z" };
    const fetchMock = mockFetch([{ status: 200, body: att }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    expect((await c.attachments.get(ID)).fileName).toBe("receipt.pdf");
    expect(getCallUrl(fetchMock)).toContain(`attachments/${ID}`);
  });
});

// ─── OAuth2 ───────────────────────────────────────────────────────────────────

describe("oauth2", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("buildAuthorizeUrl constructs correct URL", () => {
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const url = c.oauth2.buildAuthorizeUrl({
      client_id: "client-123", redirect_uri: "https://myapp.com/callback",
      response_type: "code", scope: "transactions:read", state: "state-abc",
    });
    expect(url).toContain("oauth/authorize");
    expect(url).toContain("client_id=client-123");
    expect(url).toContain("response_type=code");
    expect(url).toContain("state=state-abc");
  });

  it("buildAuthorizeUrl omits optional fields when absent", () => {
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const url = c.oauth2.buildAuthorizeUrl({
      client_id: "c", redirect_uri: "https://app.com/cb", response_type: "code",
    });
    expect(url).not.toContain("scope");
    expect(url).not.toContain("state");
  });

  it("exchangeCode POST /oauth/token", async () => {
    const token = { access_token: "tok-abc", token_type: "Bearer", expires_in: 3600 };
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: token }]));
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    const result = await c.oauth2.exchangeCode({
      grant_type: "authorization_code", code: "auth-xyz",
      redirect_uri: "https://app.com/cb", client_id: "c", client_secret: "s",
    });
    expect(result.access_token).toBe("tok-abc");
    expect(getCallUrl(vi.mocked(fetch))).toContain("oauth/token");
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("Error: 401 Unauthorized", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("throws MercuryAuthError with code 'unauthorized'", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 401, body: { message: "Unauthorized" } }]));
    const c = new MercuryClient({ apiKey: "secret-token:bad", retry: { maxRetries: 0 } });
    const err = await c.accounts.get(ID).catch((e: unknown) => e) as MercuryAuthError;
    expect(err).toBeInstanceOf(MercuryAuthError);
    expect(err.code).toBe("unauthorized");
    expect(err.statusCode).toBe(401);
  });
});

describe("Error: 404 Not Found", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("throws MercuryNotFoundError with resource path", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 404, body: {} }]));
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 0 } });
    const err = await c.accounts.get("missing" as UUID).catch((e: unknown) => e) as MercuryNotFoundError;
    expect(err).toBeInstanceOf(MercuryNotFoundError);
    expect(err.code).toBe("not_found");
    expect(err.statusCode).toBe(404);
    expect(err.resource).toContain("account");
  });
});

describe("Error: 400 Bad Request", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("throws MercuryValidationError", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 400, body: { message: "Invalid amount" } }]));
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 0 } });
    const err = await c.accounts.sendMoney(ID, {
      recipientId: ID2, amount: -1, paymentMethod: "ach", idempotencyKey: "k",
    }).catch((e: unknown) => e) as MercuryValidationError;
    expect(err).toBeInstanceOf(MercuryValidationError);
    expect(err.message).toContain("Invalid amount");
  });
});

describe("Error: 409 Conflict", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("throws MercuryConflictError for duplicate idempotency key", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 409, body: { message: "Duplicate" } }]));
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 0 } });
    const err = await c.accounts.sendMoney(ID, {
      recipientId: ID2, amount: 100, paymentMethod: "ach", idempotencyKey: "dup",
    }).catch((e: unknown) => e) as MercuryConflictError;
    expect(err).toBeInstanceOf(MercuryConflictError);
    expect(err.code).toBe("conflict");
  });
});

describe("Error: 429 Rate Limit", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("retries and eventually throws MercuryRateLimitError", async () => {
    vi.stubGlobal("fetch", mockFetch(
      Array.from({ length: 5 }, () => ({ status: 429, body: {}, headers: { "retry-after": "0" } })),
    ));
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 2, initialDelayMs: 0 } });
    await expect(c.accounts.get(ID)).rejects.toThrow(MercuryRateLimitError);
  });

  it("parses retry-after header", async () => {
    vi.stubGlobal("fetch", mockFetch(
      Array.from({ length: 2 }, () => ({ status: 429, body: {}, headers: { "retry-after": "60" } })),
    ));
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 0 } });
    const err = await c.accounts.get(ID).catch((e: unknown) => e) as MercuryRateLimitError;
    expect(err).toBeInstanceOf(MercuryRateLimitError);
    expect(err.retryAfter).toBe(60);
  });
});

describe("Error: 500 Server Error with retry", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("retries twice then succeeds", async () => {
    const fetchMock = mockFetch([
      { status: 500, body: {} },
      { status: 503, body: {} },
      { status: 200, body: makeAccount() },
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 2, initialDelayMs: 0 } });
    expect((await c.accounts.get(ID)).id).toBe(ID);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws MercuryServerError after exhausting retries", async () => {
    vi.stubGlobal("fetch", mockFetch(Array.from({ length: 5 }, () => ({ status: 502, body: {} }))));
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 2, initialDelayMs: 0 } });
    const err = await c.accounts.get(ID).catch((e: unknown) => e) as MercuryServerError;
    expect(err).toBeInstanceOf(MercuryServerError);
    expect(err.statusCode).toBe(502);
  });
});

describe("Error: Network failure", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("throws MercuryNetworkError with original cause", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const c = new MercuryClient({ apiKey: "secret-token:test", retry: { maxRetries: 0 } });
    const err = await c.accounts.get(ID).catch((e: unknown) => e) as MercuryNetworkError;
    expect(err).toBeInstanceOf(MercuryNetworkError);
    expect(err.code).toBe("network_error");
    expect(err.cause).toBeInstanceOf(TypeError);
  });
});

// ─── withRetry ────────────────────────────────────────────────────────────────

describe("withRetry", () => {
  it("retries on 5xx up to maxRetries", async () => {
    let calls = 0;
    const result = await withRetry(
      () => { calls++; if (calls < 3) throw new MercuryServerError(500); return Promise.resolve("ok"); },
      { maxRetries: 3, initialDelayMs: 0, maxDelayMs: 100, jitter: 0 },
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("does NOT retry 400 validation errors", async () => {
    let calls = 0;
    await expect(withRetry(
      () => { calls++; throw new MercuryValidationError("bad"); },
      { maxRetries: 3, initialDelayMs: 0, maxDelayMs: 100, jitter: 0 },
    )).rejects.toThrow(MercuryValidationError);
    expect(calls).toBe(1);
  });

  it("does NOT retry 401 auth errors", async () => {
    let calls = 0;
    await expect(withRetry(
      () => { calls++; throw new MercuryAuthError(); },
      { maxRetries: 3, initialDelayMs: 0, maxDelayMs: 100, jitter: 0 },
    )).rejects.toThrow(MercuryAuthError);
    expect(calls).toBe(1);
  });

  it("retries on 429 rate limit", async () => {
    let calls = 0;
    const result = await withRetry(
      () => { calls++; if (calls < 2) throw new MercuryRateLimitError(0); return Promise.resolve("done"); },
      { maxRetries: 3, initialDelayMs: 0, maxDelayMs: 100, jitter: 0 },
    );
    expect(result).toBe("done");
    expect(calls).toBe(2);
  });
});

// ─── Paginator ────────────────────────────────────────────────────────────────

describe("paginate", () => {
  it("yields pages and stops on empty nextPage", async () => {
    const pages = [
      { items: [1, 2], page: { nextPage: "c1" as UUID } },
      { items: [3, 4], page: { nextPage: "c2" as UUID } },
      { items: [5],    page: {} },
    ];
    let idx = 0;
    const all: number[] = [];
    for await (const page of paginate(() => Promise.resolve(pages[idx++]!))) {
      all.push(...page);
    }
    expect(all).toEqual([1, 2, 3, 4, 5]);
  });

  it("stops on empty first page", async () => {
    let called = 0;
    for await (const _page of paginate(() => {
      called++;
      return Promise.resolve({ items: [] as number[], page: {} });
    })) { /* noop */ }
    expect(called).toBe(1);
  });

  it("threads cursor to subsequent fetches", async () => {
    const seen: Array<UUID | undefined> = [];
    const fetcher = (c?: UUID) => {
      seen.push(c);
      return c
        ? Promise.resolve({ items: [2], page: {} })
        : Promise.resolve({ items: [1], page: { nextPage: "p2" as UUID } });
    };
    const all: number[] = [];
    for await (const page of paginate(fetcher)) all.push(...page);
    expect(all).toEqual([1, 2]);
    expect(seen[0]).toBeUndefined();
    expect(seen[1]).toBe("p2");
  });
});

describe("collectAll", () => {
  it("flattens all pages", async () => {
    const data = [[1, 2], [3, 4], [5]];
    let idx = 0;
    const result = await collectAll((_c) => {
      const items = data[idx] ?? [];
      const nextPage = idx < data.length - 1 ? `c${idx.toString()}` as UUID : undefined;
      idx++;
      return Promise.resolve({ items, page: nextPage ? { nextPage } : {} });
    });
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("respects maxItems", async () => {
    const result = await collectAll(
      () => Promise.resolve({ items: [1, 2, 3], page: { nextPage: "n" as UUID } }),
      5,
    );
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

// ─── Error hierarchy ──────────────────────────────────────────────────────────

describe("Error hierarchy", () => {
  it("all errors extend MercuryError", () => {
    expect(new MercuryAuthError()).toBeInstanceOf(MercuryError);
    expect(new MercuryNotFoundError("x")).toBeInstanceOf(MercuryError);
    expect(new MercuryValidationError("x")).toBeInstanceOf(MercuryError);
    expect(new MercuryConflictError("x")).toBeInstanceOf(MercuryError);
    expect(new MercuryRateLimitError()).toBeInstanceOf(MercuryError);
    expect(new MercuryServerError(500)).toBeInstanceOf(MercuryError);
    expect(new MercuryNetworkError("x", null)).toBeInstanceOf(MercuryError);
  });

  it("error names are set correctly", () => {
    expect(new MercuryAuthError().name).toBe("MercuryAuthError");
    expect(new MercuryNotFoundError("r").name).toBe("MercuryNotFoundError");
    expect(new MercuryRateLimitError(30).name).toBe("MercuryRateLimitError");
    expect(new MercuryServerError(503).name).toBe("MercuryServerError");
    expect(new MercuryNetworkError("n", null).name).toBe("MercuryNetworkError");
  });

  it("MercuryNotFoundError carries resource field", () => {
    const e = new MercuryNotFoundError("/account/x");
    expect(e.resource).toBe("/account/x");
    expect(e.statusCode).toBe(404);
  });

  it("MercuryRateLimitError retryAfter is optional", () => {
    expect(new MercuryRateLimitError(30).retryAfter).toBe(30);
    expect(new MercuryRateLimitError().retryAfter).toBeUndefined();
  });

  it("MercuryNetworkError preserves cause", () => {
    const cause = new TypeError("network fail");
    const e = new MercuryNetworkError("net", cause);
    expect(e.cause).toBe(cause);
    expect(e.code).toBe("network_error");
  });
});

// ─── SDK headers ──────────────────────────────────────────────────────────────

describe("SDK headers", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("sends X-Mercury-SDK header on every request", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeAccount() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.accounts.get(ID);
    expect(getHeaders(fetchMock)["X-Mercury-SDK"]).toBe("mercury-fintech-sdk-ts/1.0.0");
  });

  it("sends Accept: application/json", async () => {
    const fetchMock = mockFetch([{ status: 200, body: makeAccount() }]);
    vi.stubGlobal("fetch", fetchMock);
    const c = new MercuryClient({ apiKey: "secret-token:test" });
    await c.accounts.get(ID);
    expect(getHeaders(fetchMock)["Accept"]).toBe("application/json");
  });
});

// ─── Hooks ────────────────────────────────────────────────────────────────────

describe("hooks", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("onRequest receives method, url, requestId", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeAccount() }]));
    const onRequest = vi.fn();
    const c = new MercuryClient({ apiKey: "secret-token:test", onRequest });
    await c.accounts.get(ID);
    expect(onRequest).toHaveBeenCalledOnce();
    const arg = onRequest.mock.calls[0]?.[0] as { method: string; url: string; requestId: string };
    expect(arg.method).toBe("GET");
    expect(arg.url).toContain(`account/${ID}`);
    expect(arg.requestId).toMatch(/^req_/);
  });

  it("onResponse receives statusCode and durationMs", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: makeAccount() }]));
    const onResponse = vi.fn();
    const c = new MercuryClient({ apiKey: "secret-token:test", onResponse });
    await c.accounts.get(ID);
    expect(onResponse).toHaveBeenCalledOnce();
    const arg = onResponse.mock.calls[0]?.[0] as { statusCode: number; durationMs: number };
    expect(arg.statusCode).toBe(200);
    expect(arg.durationMs).toBeGreaterThanOrEqual(0);
  });
});
