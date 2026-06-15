# mercury-fintech-sdk

Production-grade TypeScript SDK for the [Mercury Banking API](https://docs.mercury.com).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-green)]()
[![Tests](https://img.shields.io/badge/tests-47%20passing-brightgreen)]()

## Features

- **Full API coverage** — all 59 Mercury endpoints across 15 resource namespaces
- **Zero runtime dependencies** — uses native `fetch`, no axios/got
- **Strict TypeScript** — branded UUID/UTCTime primitives, exhaustive enums, exact types throughout
- **Dual CJS/ESM output** — works in Node.js, Bun, Deno, and edge runtimes
- **Auto-pagination** — `listAll()` async generators and `collectAll()` flat-array helpers on every resource
- **Exponential backoff retries** — automatic retry with jitter on 429/5xx; non-retryable errors (400/401/404) fail immediately
- **Rich error hierarchy** — `MercuryAuthError`, `MercuryNotFoundError`, `MercuryRateLimitError`, etc. for surgical catch blocks
- **Request/response hooks** — plug in your own logger or telemetry

---

## Installation

```bash
npm install mercury-fintech-sdk
```

---

## Quick start

```ts
import { MercuryClient } from "mercury-fintech-sdk";

const mercury = new MercuryClient({
  apiKey: "secret-token:mercury_production_...",
});

// Get a single account
const account = await mercury.accounts.get("acc-uuid");

// List all transactions with auto-pagination
const allTxns = await mercury.transactions.collectAll({ status: ["sent"] });

// Stream pages one at a time
for await (const page of mercury.accounts.listAll()) {
  console.log(page.map(a => a.name));
}
```

---

## Client options

```ts
const mercury = new MercuryClient({
  apiKey: "secret-token:...",          // required
  baseUrl: "https://api.mercury.com/api/v1/", // override for sandbox
  timeoutMs: 30_000,                   // default: 30s

  retry: {
    maxRetries: 3,                     // default: 3
    initialDelayMs: 500,               // default: 500ms
    maxDelayMs: 30_000,                // default: 30s
    jitter: 0.25,                      // default: 25%
  },

  // Logging / tracing hooks
  onRequest: ({ method, url, requestId }) => {
    console.log(`→ ${method} ${url} [${requestId}]`);
  },
  onResponse: ({ statusCode, durationMs, requestId }) => {
    console.log(`← ${statusCode} in ${durationMs}ms [${requestId}]`);
  },
});
```

---

## Resources

### `accounts`

```ts
mercury.accounts.get(accountId)
mercury.accounts.list({ limit, order, start_after })
mercury.accounts.listAll()                          // AsyncGenerator<Account[]>
mercury.accounts.collectAll(params?, maxItems?)     // Promise<Account[]>
mercury.accounts.getCards(accountId)
mercury.accounts.listStatements(accountId, params?)
mercury.accounts.listTransactions(accountId, params?)
mercury.accounts.sendMoney(accountId, {
  recipientId, amount, paymentMethod, idempotencyKey,
  note?, externalMemo?, purpose?
})
```

### `transactions`

```ts
mercury.transactions.get(transactionId)
mercury.transactions.list({ status?, search?, start?, end?, accountId?, ... })
mercury.transactions.listAll(params?)
mercury.transactions.collectAll(params?, maxItems?)
mercury.transactions.update(transactionId, { note?, categoryId? })
mercury.transactions.uploadAttachment(transactionId, file, fileName)
```

### `recipients`

```ts
mercury.recipients.create({ name, emails, electronicRoutingInfo?, ... })
mercury.recipients.get(recipientId)
mercury.recipients.list(params?)
mercury.recipients.listAll(params?)
mercury.recipients.collectAll(params?, maxItems?)
mercury.recipients.update(recipientId, data)
mercury.recipients.delete(recipientId)
mercury.recipients.listAttachments(params?)
mercury.recipients.uploadAttachment(recipientId, file, fileName)
```

### `invoices`

```ts
mercury.invoices.create({ amount, currency?, recipientId?, dueDate?, lineItems? })
mercury.invoices.get(invoiceId)
mercury.invoices.list(params?)
mercury.invoices.listAll(params?)
mercury.invoices.collectAll(params?, maxItems?)
mercury.invoices.update(invoiceId, data)
mercury.invoices.cancel(invoiceId)
mercury.invoices.downloadPdf(invoiceId)         // Promise<ArrayBuffer>
mercury.invoices.listAttachments(invoiceId)
```

### `payments`

```ts
mercury.payments.createInternalTransfer({ toAccountId, amount, idempotencyKey })
mercury.payments.requestSendMoney({ recipientId, accountId, amount, paymentMethod })
mercury.payments.getApprovalRequest(requestId)
mercury.payments.listApprovalRequests({ accountId?, status? })
mercury.payments.collectAllApprovalRequests(params?, maxItems?)
```

### Other namespaces

| Namespace | Key methods |
|---|---|
| `categories` | `create`, `list`, `listAll`, `collectAll`, `update`, `delete` |
| `customers` | `create`, `get`, `list`, `listAll`, `collectAll`, `update`, `delete` |
| `treasury` | `list`, `listAll`, `collectAll`, `listTransactions`, `listStatements` |
| `webhooks` | `create`, `get`, `list`, `update`, `delete`, `verify` |
| `events` | `get`, `list`, `listAll` |
| `organization` | `get`, `submitOnboarding` |
| `users` | `get`, `list`, `collectAll` |
| `safeRequests` | `get`, `list`, `downloadDocument` |
| `credit` | `list` |
| `attachments` | `get` |

---

## Error handling

```ts
import {
  MercuryAuthError,
  MercuryNotFoundError,
  MercuryRateLimitError,
  MercuryValidationError,
  MercuryServerError,
  MercuryNetworkError,
} from "mercury-fintech-sdk";

try {
  await mercury.accounts.get(id);
} catch (err) {
  if (err instanceof MercuryAuthError) {
    // 401 — bad/missing token
  } else if (err instanceof MercuryNotFoundError) {
    // 404 — resource doesn't exist
    console.log(err.resource);
  } else if (err instanceof MercuryRateLimitError) {
    // 429 — check err.retryAfter (seconds)
  } else if (err instanceof MercuryValidationError) {
    // 400 — bad request body
  } else if (err instanceof MercuryServerError) {
    // 5xx — check err.statusCode
  } else if (err instanceof MercuryNetworkError) {
    // fetch failed entirely
  }
}
```

All errors extend `MercuryError` which exposes:
- `err.code` — `"unauthorized" | "not_found" | "bad_request" | "rate_limited" | ...`
- `err.statusCode` — HTTP status
- `err.body` — raw response body
- `err.requestId` — Mercury / SDK request ID for tracing

---

## Pagination

All list resources follow the same three-tier pattern:

```ts
// 1. Single page — manual cursor control
const page1 = await mercury.recipients.list({ limit: 25 });
const page2 = await mercury.recipients.list({ start_after: page1.page.nextPage });

// 2. Async generator — stream pages (memory-efficient for millions of rows)
for await (const page of mercury.recipients.listAll()) {
  await processBatch(page);
}

// 3. Collect all — convenience for smaller datasets
const all = await mercury.recipients.collectAll(undefined, 500); // cap at 500
```

---

## Retry behaviour

| Error | Retried? |
|---|---|
| `429 Too Many Requests` | ✅ (respects `Retry-After` header) |
| `500 / 502 / 503 / 504` | ✅ (exponential backoff + jitter) |
| `400 / 401 / 403 / 404 / 409` | ❌ (fail immediately) |
| Network timeout | ❌ |

---

## Development

```bash
npm install
npm run build        # Vite ESM + CJS + tsc declarations
npm test             # Vitest (47 tests)
npm run test:watch   # watch mode
npm run lint         # tsc --noEmit
```

---

## License

MIT
