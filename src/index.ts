// ─── Client ──────────────────────────────────────────────────────────────────
export { MercuryClient } from "./client.js";
export type { MercuryClientOptions } from "./client.js";

// ─── Errors ──────────────────────────────────────────────────────────────────
export {
  MercuryError,
  MercuryAuthError,
  MercuryNotFoundError,
  MercuryValidationError,
  MercuryConflictError,
  MercuryRateLimitError,
  MercuryServerError,
  MercuryNetworkError,
} from "./lib/errors.js";
export type { MercuryErrorCode, MercuryErrorBody } from "./lib/errors.js";

// ─── Paginator utilities ──────────────────────────────────────────────────────
export { paginate, collectAll } from "./lib/paginator.js";
export type { PageFetcher } from "./lib/paginator.js";

// ─── All types ────────────────────────────────────────────────────────────────
export type {
  // Primitives
  UUID,
  UTCTime,
  Email,
  ISO3166Alpha2,
  Region,
  CurrencyCode,
  USState,
  // Shared
  PaginationParams,
  PageInfo,
  SortOrder,
  // Enums
  AccountStatus,
  AccountType,
  TransactionStatus,
  TransactionKind,
  TransactionAttachmentType,
  TransactionRelationKind,
  MercuryCategory,
  ElectronicAccountType,
  SwiftBankAccountType,
  PaymentMethod,
  PostTransactionPaymentMethod,
  RecipientStatus,
  TaxFormType,
  PakistaniLegalIdType,
  WirePurposeCategory,
  WebhookStatus,
  ApprovalStatus,
  CardStatus,
  CardType,
  InvoiceStatus,
  // Address types
  AddressData,
  AddressWithoutName,
  Address,
  // Routing info — response
  ElectronicRoutingInfo,
  DomesticWireRoutingInfo,
  RealTimePaymentRoutingInfo,
  InternationalWireRoutingInfo,
  InternationalWireCountrySpecificData,
  SwiftCodeData,
  InternationalWireCorrespondentInfo,
  // Routing info — request
  ElectronicRoutingInfoRaw,
  DomesticWireRoutingInfoRaw,
  CheckInfo,
  CheckInfoRaw,
  // Accounts
  Account,
  AccountsPaginatedResponse,
  AccountStatement,
  AccountStatementsPaginatedResponse,
  GetStatementsParams,
  Card,
  // Transactions
  Transaction,
  TransactionsPaginatedResponse,
  ListTransactionsParams,
  TransactionAttachment,
  CategoryData,
  GlAllocation,
  MerchantData,
  CurrencyExchangeInfo,
  CreditCardInfo,
  DebitCardInfo,
  TransactionMethodData,
  RelatedTransactionData,
  SendMoneyRequest,
  SimplePurpose,
  PostTransactionSendMoneyPurpose,
  // Internal transfer
  InternalTransferRequest,
  InternalTransferResponse,
  // Recipients
  RecipientInfo,
  RecipientsPaginatedResponse,
  CreateRecipientRequest,
  UpdateRecipientRequest,
  RecipientAttachment,
  RecipientAttachmentsResponse,
  // Invoices
  Invoice,
  InvoicesPaginatedResponse,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceLineItem,
  InvoiceAttachment,
  InvoiceAttachmentsResponse,
  // Categories
  Category,
  CategoriesPaginatedResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  // Customers
  Customer,
  CustomersPaginatedResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  // Treasury
  TreasuryAccount,
  TreasuryAccountsPaginatedResponse,
  TreasuryTransaction,
  TreasuryTransactionsPaginatedResponse,
  TreasuryStatement,
  TreasuryStatementsPaginatedResponse,
  // Webhooks
  Webhook,
  WebhooksPaginatedResponse,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  VerifyWebhookRequest,
  // Events
  MercuryEvent,
  EventsPaginatedResponse,
  // Payments
  RequestSendMoneyRequest,
  InternalTransferRequest as TransferRequest,
  SendMoneyApprovalRequest,
  SendMoneyApprovalRequestsPaginatedResponse,
  ListApprovalRequestsParams,
  // Organization
  Organization,
  // Users
  MercuryUser,
  UsersPaginatedResponse,
  // SAFEs
  SafeRequest,
  // Credit
  CreditAccount,
  // Attachments
  Attachment,
  // OAuth2
  OAuth2TokenResponse,
  OAuth2AuthorizeParams,
  OAuth2TokenRequest,
} from "./types/index.js";
