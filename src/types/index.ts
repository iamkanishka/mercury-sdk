// ─── Branded primitives ────────────────────────────────────────────────────
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type UUID = Brand<string, "UUID">;
export type UTCTime = Brand<string, "UTCTime">;
export type Email = Brand<string, "Email">;
export type ISO3166Alpha2 = Brand<string, "ISO3166Alpha2">;
export type Region = Brand<string, "Region">;
export type CurrencyCode = Brand<string, "CurrencyCode">;

// ─── Enumerations ──────────────────────────────────────────────────────────

export type AccountStatus = "active" | "deleted" | "pending" | "archived";
export type AccountType = "mercury" | "external" | "recipient";

export type TransactionStatus =
  | "pending"
  | "sent"
  | "cancelled"
  | "failed"
  | "reversed"
  | "blocked";

export type TransactionKind =
  | "externalTransfer"
  | "internalTransfer"
  | "outgoingPayment"
  | "creditCardCredit"
  | "creditCardTransaction"
  | "debitCardCredit"
  | "debitCardTransaction"
  | "cardInternationalTransactionFee"
  | "cardInternationalTransactionFeeRebate"
  | "cardInternationalTransactionFeeReversal"
  | "cardInternationalTransactionFeeRebateReversal"
  | "incomingDomesticWire"
  | "checkDeposit"
  | "incomingInternationalWire"
  | "treasuryTransfer"
  | "currencyCloudReturn"
  | "wireFee"
  | "personalBankingSubscriptionFee"
  | "billingEngineSubscriptionFee"
  | "expenseReimbursement"
  | "exogenousWireDrawdown"
  | "other";

export type TransactionAttachmentType = "checkImage" | "receipt" | "other";

export type TransactionRelationKind =
  | "ProvisionalCreditReversalToMerchantRefund"
  | "MerchantRefundToProvisionalCreditReversal"
  | "MerchantRefundToFraudulentCharge"
  | "FraudulentChargeToMerchantRefund"
  | "PaymentRefundToFailedPayment"
  | "FailedPaymentToPaymentRefund"
  | "GiftCompensationToOriginalTransaction"
  | "FeePaymentToOriginalTransaction"
  | "OriginalTransactionToFeePayment"
  | "FeePaymentToFeeRebate"
  | "FeeRebateToFeePayment"
  | "FeePaymentToFeeReversal"
  | "FeeReversalToFeePayment"
  | "FeeRebateToFeeRebateReversal"
  | "FeeRebateReversalToFeeRebate"
  | "TreasurySplitLiquidation"
  | "ProvisionalCreditToOriginalCharge"
  | "OriginalChargeToProvisionalCredit"
  | "FeeAtmReimbursementToAtmTransaction"
  | "AtmTransactionToFeeAtmReimbursement"
  | "AtmTransactionToAtmReimbursementReversal"
  | "AtmReimbursementReversalToAtmTransaction"
  | "ReturnToOriginalTransaction"
  | "OriginalTransactionToReturn"
  | "ProvisionalCreditToReversal"
  | "ReversalToProvisionalCredit";

export type MercuryCategory =
  | "Other"
  | "Advertising"
  | "Airlines"
  | "AlcoholAndBars"
  | "BooksAndNewspaper"
  | "CarRental"
  | "Charity"
  | "Clothing"
  | "Conferences"
  | "Education"
  | "Electronics"
  | "Entertainment"
  | "FacilitiesExpenses"
  | "Fees"
  | "FoodDelivery"
  | "FuelAndGas"
  | "Gambling"
  | "GovernmentServices"
  | "Grocery"
  | "GroundTransportation"
  | "Insurance"
  | "InternetAndTelephone"
  | "Legal"
  | "Lodging"
  | "Medical"
  | "Memberships"
  | "OfficeSupplies"
  | "OtherTravel"
  | "Parking"
  | "Political"
  | "ProfessionalServices"
  | "Restaurants"
  | "Retail"
  | "RideshareAndTaxis"
  | "Shipping"
  | "Software"
  | "Taxes"
  | "Utilities"
  | "VehicleExpenses";

export type ElectronicAccountType =
  | "businessChecking"
  | "businessSavings"
  | "personalChecking"
  | "personalSavings";

export type SwiftBankAccountType = "checking" | "savings";

/** All payment methods supported by Mercury */
export type PaymentMethod =
  | "ach"
  | "check"
  | "domesticWire"
  | "internationalWire"
  | "realTimePayment";

/** Payment methods accepted when sending money via POST /account/:id/transactions */
export type PostTransactionPaymentMethod = "ach" | "check" | "domesticWire";

export type RecipientStatus = "active" | "deleted";
export type TaxFormType = "w9" | "w8BEN" | "w8BENE" | "unknown";

export type PakistaniLegalIdType = "CNIC" | "SNIC" | "Passport" | "NTN";

export type SortOrder = "asc" | "desc";

/** Wire purpose category — required when paymentMethod is 'domesticWire' */
export type WirePurposeCategory =
  | "Employee"
  | "Landlord"
  | "Vendor"
  | "Contractor"
  | "Subsidiary"
  | "TransferToMyExternalAccount"
  | "FamilyMemberOrFriend"
  | "ForGoodsOrServices"
  | "AngelInvestment"
  | "SavingsOrInvestments"
  | "Expenses"
  | "Travel"
  | "Other";

export type WebhookStatus = "active" | "inactive" | "disabled";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";
export type CardStatus = "active" | "inactive" | "cancelled" | "frozen";
export type CardType = "debit" | "credit";
export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled" | "overdue";

export type USState =
  | "AL"
  | "AK"
  | "AZ"
  | "AR"
  | "CA"
  | "CO"
  | "CT"
  | "DE"
  | "DC"
  | "FL"
  | "GA"
  | "HI"
  | "ID"
  | "IL"
  | "IN"
  | "IA"
  | "KS"
  | "KY"
  | "LA"
  | "ME"
  | "MD"
  | "MA"
  | "MI"
  | "MN"
  | "MS"
  | "MO"
  | "MT"
  | "NE"
  | "NV"
  | "NH"
  | "NJ"
  | "NM"
  | "NY"
  | "NC"
  | "ND"
  | "OH"
  | "OK"
  | "OR"
  | "PA"
  | "RI"
  | "SC"
  | "SD"
  | "TN"
  | "TX"
  | "UT"
  | "VT"
  | "VA"
  | "WA"
  | "WV"
  | "WI"
  | "WY";

// ─── Shared pagination ────────────────────────────────────────────────────

export interface PaginationParams {
  limit?: number;
  order?: SortOrder;
  start_after?: UUID;
  end_before?: UUID;
}

export interface PageInfo {
  nextPage?: UUID;
  previousPage?: UUID;
}

// ─── Address types ────────────────────────────────────────────────────────

/** US-only address used for check mailing */
export interface AddressData {
  address1: string;
  address2?: string | null;
  city: string;
  postalCode: string;
  state?: USState | null;
}

/** International address without a name field */
export interface AddressWithoutName {
  address1: string;
  address2?: string | null;
  city: string;
  region: Region;
  postalCode: string;
  country: ISO3166Alpha2;
}

/** International address with a name field */
export interface Address {
  name: string;
  address1: string;
  address2?: string | null;
  city: string;
  region: Region;
  postalCode: string;
  country: ISO3166Alpha2;
}

// ─── Routing info — response shapes ──────────────────────────────────────

export interface ElectronicRoutingInfo {
  accountNumber: string;
  routingNumber: string;
  electronicAccountType: ElectronicAccountType;
  bankName?: string | null;
  address?: AddressWithoutName | null;
}

export interface DomesticWireRoutingInfo {
  accountNumber: string;
  routingNumber: string;
  bankName?: string | null;
  address?: AddressWithoutName | null;
}

export interface RealTimePaymentRoutingInfo {
  accountNumber: string;
  routingNumber: string;
  bankName?: string | null;
  address?: AddressWithoutName | null;
}

export interface SwiftCodeData {
  bankName: string;
  bankCityState: string;
  bankCountry: ISO3166Alpha2;
}

export interface InternationalWireCorrespondentInfo {
  bankName?: string | null;
  routingNumber?: string | null;
  swiftCode?: string | null;
}

export interface InternationalWireCountrySpecificData {
  australia?: { bsbCode: string } | null;
  brazil?: { legalId: string } | null;
  canada?: { bankCode: string; transitNumber: string } | null;
  chile?: { legalId: string } | null;
  colombia?: { legalId: string } | null;
  dominicanRepublic?: {
    accountType: SwiftBankAccountType;
    legalId: string;
  } | null;
  honduras?: { accountType: SwiftBankAccountType; legalId: string } | null;
  india?: { ifscCode: string } | null;
  kazakhstan?: { legalId: string } | null;
  pakistan?: { legalIdType: PakistaniLegalIdType; legalId: string } | null;
  paraguay?: { legalId: string } | null;
  philippines?: { routingNumber: string } | null;
  russia?: { inn: string } | null;
  southAfrica?: { branchCode: string } | null;
}

export interface InternationalWireRoutingInfo {
  iban: string;
  swiftCode: string;
  countrySpecific: InternationalWireCountrySpecificData;
  address?: AddressWithoutName | null;
  bankDetails?: SwiftCodeData | null;
  correspondentInfo?: InternationalWireCorrespondentInfo | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
}

// ─── Routing info — request shapes (stricter than response shapes) ────────

/** ACH routing info when creating a recipient. address is required. */
export interface ElectronicRoutingInfoRaw {
  accountNumber: string;
  routingNumber: string;
  electronicAccountType: ElectronicAccountType;
  address: AddressWithoutName;
}

/** Domestic wire routing info when creating a recipient. address is required. */
export interface DomesticWireRoutingInfoRaw {
  accountNumber: string;
  routingNumber: string;
  address: AddressWithoutName;
  defaultForBenefitOf?: string | null;
}

export interface CheckInfoRaw {
  address: AddressWithoutName;
}

export interface CheckInfo {
  address: AddressWithoutName;
}

// ─── Accounts ────────────────────────────────────────────────────────────

export interface Account {
  id: UUID;
  accountNumber: string;
  routingNumber: string;
  name: string;
  nickname?: string | null;
  legalBusinessName: string;
  /** Freeform string, e.g. "checking" or "savings" */
  kind: string;
  type: AccountType;
  status: AccountStatus;
  /** Spendable balance in USD */
  availableBalance: number;
  /** Posted balance including pending items, in USD */
  currentBalance: number;
  canReceiveTransactions?: boolean | null;
  createdAt: UTCTime;
  dashboardLink: string;
}

export interface AccountsPaginatedResponse {
  accounts: Account[];
  page: PageInfo;
}

// ─── Cards ───────────────────────────────────────────────────────────────

export interface Card {
  id: UUID;
  accountId: UUID;
  type: CardType;
  status: CardStatus;
  lastFour: string;
  cardholderName: string;
  expirationDate: string;
  createdAt: UTCTime;
}

// ─── Statements ──────────────────────────────────────────────────────────

export interface AccountStatement {
  id: UUID;
  accountId: UUID;
  period: string;
  url?: string | null;
  createdAt: UTCTime;
}

export interface AccountStatementsPaginatedResponse {
  statements: AccountStatement[];
  page: PageInfo;
}

export interface GetStatementsParams extends PaginationParams {
  start?: string;
  end?: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────

export interface TransactionAttachment {
  fileName: string;
  url: string;
  attachmentType: TransactionAttachmentType;
}

/**
 * Expense category with visibility flags.
 * Note: visibleFor* fields are present on CategoryData inside transactions
 * (from createInternalTransfer schema) but absent in createTransaction schema.
 * We include them as optional for compatibility.
 */
export interface CategoryData {
  id: UUID;
  name: string;
  visibleForReimbursements?: boolean;
  visibleForCardSpend?: boolean;
  visibleForOther?: boolean;
}

export interface GlAllocation {
  glCodeName: string;
  amount: number;
  description?: string | null;
}

export interface MerchantData {
  id?: string | null;
  category?: MercuryCategory | null;
  /** 4-digit merchant category code (MCC) */
  categoryCode?: string | null;
}

export interface CurrencyExchangeInfo {
  convertedFromCurrency: CurrencyCode;
  convertedToCurrency: CurrencyCode;
  convertedFromAmount: number;
  convertedToAmount: number;
  feeAmount: number;
  feePercentage: number;
  exchangeRate: number;
  feeTransactionId?: UUID | null;
}

export interface CreditCardInfo {
  id: UUID;
  paymentMethod: string;
  email?: string | null;
}

export interface DebitCardInfo {
  id: UUID;
}

export interface TransactionMethodData {
  address?: AddressData | null;
  creditCardInfo?: CreditCardInfo | null;
  debitCardInfo?: DebitCardInfo | null;
  domesticWireRoutingInfo?: DomesticWireRoutingInfo | null;
  electronicRoutingInfo?: ElectronicRoutingInfo | null;
  internationalWireRoutingInfo?: InternationalWireRoutingInfo | null;
}

export interface RelatedTransactionData {
  id: UUID;
  accountId: UUID;
  relationKind: TransactionRelationKind;
  amount: number;
}

export interface Transaction {
  id: UUID;
  accountId: UUID;
  amount: number;
  status: TransactionStatus;
  kind: TransactionKind;
  createdAt: UTCTime;
  estimatedDeliveryDate: UTCTime;
  counterpartyId: UUID;
  counterpartyName: string;
  counterpartyNickname?: string | null;
  dashboardLink: string;
  compliantWithReceiptPolicy: boolean;
  hasGeneratedReceipt: boolean;
  glAllocations: GlAllocation[];
  attachments: TransactionAttachment[];
  relatedTransactions: RelatedTransactionData[];
  note?: string | null;
  externalMemo?: string | null;
  bankDescription?: string | null;
  checkNumber?: string | null;
  trackingNumber?: string | null;
  requestId?: string | null;
  feeId?: UUID | null;
  postedAt?: UTCTime | null;
  failedAt?: UTCTime | null;
  reasonForFailure?: string | null;
  mercuryCategory?: MercuryCategory | null;
  categoryData?: CategoryData | null;
  merchant?: MerchantData | null;
  currencyExchangeInfo?: CurrencyExchangeInfo | null;
  creditAccountPeriodId?: UUID | null;
  details?: TransactionMethodData | null;
  /** @deprecated use glAllocations */
  generalLedgerCodeName?: string | null;
}

export interface TransactionsPaginatedResponse {
  transactions: Transaction[];
  page: PageInfo;
}

export interface ListTransactionsParams extends PaginationParams {
  status?: TransactionStatus[];
  search?: string;
  start?: string;
  end?: string;
  postedStart?: string;
  postedEnd?: string;
  accountId?: UUID[];
  cardId?: string[];
  mercuryCategory?: MercuryCategory;
  categoryId?: UUID;
  start_at?: string;
}

// ─── Send money ───────────────────────────────────────────────────────────

export interface SimplePurpose {
  /** Payment category. Required. */
  category: WirePurposeCategory;
  /**
   * Additional info. Required for: Vendor (vendor name), Contractor (contractor name),
   * Other (payment description). Optional for Subsidiary. Not accepted for other categories.
   */
  additionalInfo?: string;
}

export interface PostTransactionSendMoneyPurpose {
  simple?: SimplePurpose | null;
}

/** Request body for POST /account/{accountId}/transactions */
export interface SendMoneyRequest {
  /** Recipient ID from /recipients */
  recipientId: UUID;
  /** Amount in USD, must be >= 0.01 */
  amount: number;
  /** Payment method. If domesticWire, purpose.simple.category is required. */
  paymentMethod: PostTransactionPaymentMethod;
  /** Unique key to prevent duplicate transactions */
  idempotencyKey: string;
  note?: string;
  externalMemo?: string;
  /** Required when paymentMethod is 'domesticWire' */
  purpose?: PostTransactionSendMoneyPurpose;
}

// ─── Internal transfer ────────────────────────────────────────────────────

/** Request body for POST /transfer */
export interface InternalTransferRequest {
  sourceAccountId: UUID;
  destinationAccountId: UUID;
  amount: number;
  idempotencyKey: string;
  note?: string | null;
}

/** Response from POST /transfer — returns both legs of the transfer */
export interface InternalTransferResponse {
  debitTransaction: Transaction;
  creditTransaction: Transaction;
}

// ─── Request send money (approval required) ───────────────────────────────

export interface RequestSendMoneyRequest {
  recipientId: UUID;
  accountId: UUID;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  externalMemo?: string;
}

export interface SendMoneyApprovalRequest {
  id: UUID;
  accountId: UUID;
  amount: number;
  status: ApprovalStatus;
  recipientId: UUID;
  paymentMethod: PaymentMethod;
  createdAt: UTCTime;
  updatedAt: UTCTime;
  note?: string | null;
}

export interface SendMoneyApprovalRequestsPaginatedResponse {
  requests: SendMoneyApprovalRequest[];
  page: PageInfo;
}

export interface ListApprovalRequestsParams extends PaginationParams {
  accountId?: UUID;
  status?: ApprovalStatus;
}

// ─── Recipients ──────────────────────────────────────────────────────────

export interface RecipientInfo {
  id: UUID;
  status: RecipientStatus;
  name: string;
  nickname?: string | null;
  emails: Email[];
  contactEmail?: Email | null;
  defaultPaymentMethod: PaymentMethod;
  isBusiness?: boolean | null;
  dateLastPaid?: UTCTime | null;
  address?: Address | null;
  defaultAddress?: AddressWithoutName | null;
  checkInfo?: CheckInfo | null;
  electronicRoutingInfo?: ElectronicRoutingInfo | null;
  domesticWireRoutingInfo?: DomesticWireRoutingInfo | null;
  internationalWireRoutingInfo?: InternationalWireRoutingInfo | null;
  realTimePaymentRoutingInfo?: RealTimePaymentRoutingInfo | null;
  attachments: RecipientAttachment[];
}

export interface RecipientAttachment {
  fileName: string;
  /** Presigned URL valid for 12 hours */
  url: string;
  uploadedAt: UTCTime;
  formType?: TaxFormType | null;
}

export interface CreateRecipientRequest {
  name: string;
  emails: Email[];
  nickname?: string;
  contactEmail?: Email;
  /** ACH routing. address is required. */
  electronicRoutingInfo?: ElectronicRoutingInfoRaw;
  /** Domestic wire routing. address is required. */
  domesticWireRoutingInfo?: DomesticWireRoutingInfoRaw;
  checkInfo?: CheckInfoRaw;
  /** @deprecated use checkInfo */
  address?: AddressData;
}

export interface UpdateRecipientRequest {
  name?: string;
  emails?: Email[];
  nickname?: string;
  contactEmail?: Email;
  electronicRoutingInfo?: ElectronicRoutingInfoRaw;
  domesticWireRoutingInfo?: DomesticWireRoutingInfoRaw;
  checkInfo?: CheckInfoRaw;
}

export interface RecipientsPaginatedResponse {
  recipients: RecipientInfo[];
  page: PageInfo;
}

// ─── Invoices ────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: UUID;
  status: InvoiceStatus;
  invoiceNumber?: string | null;
  amount: number;
  currency: CurrencyCode;
  dueDate?: UTCTime | null;
  issueDate?: UTCTime | null;
  paidAt?: UTCTime | null;
  cancelledAt?: UTCTime | null;
  createdAt: UTCTime;
  updatedAt: UTCTime;
  recipientId?: UUID | null;
  memo?: string | null;
  lineItems?: InvoiceLineItem[];
  dashboardLink?: string;
}

export interface CreateInvoiceRequest {
  amount: number;
  currency?: CurrencyCode;
  recipientId?: UUID;
  dueDate?: string;
  memo?: string;
  lineItems?: { description: string; quantity: number; unitPrice: number }[];
}

export interface UpdateInvoiceRequest {
  amount?: number;
  dueDate?: string;
  memo?: string;
  lineItems?: { description: string; quantity: number; unitPrice: number }[];
}

export interface InvoicesPaginatedResponse {
  invoices: Invoice[];
  page: PageInfo;
}

export interface InvoiceAttachment {
  id: UUID;
  fileName: string;
  url: string;
  createdAt: UTCTime;
}

export interface InvoiceAttachmentsResponse {
  attachments: InvoiceAttachment[];
}

// ─── Categories ──────────────────────────────────────────────────────────

export interface Category {
  id: UUID;
  name: string;
  visibleForReimbursements: boolean;
  visibleForCardSpend: boolean;
  visibleForOther: boolean;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface CategoriesPaginatedResponse {
  categories: Category[];
  page: PageInfo;
}

// ─── Customers ───────────────────────────────────────────────────────────

export interface Customer {
  id: UUID;
  name: string;
  email?: string | null;
  createdAt: UTCTime;
  updatedAt: UTCTime;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
}

export interface CustomersPaginatedResponse {
  customers: Customer[];
  page: PageInfo;
}

// ─── Treasury ────────────────────────────────────────────────────────────

export interface TreasuryAccount {
  id: UUID;
  name: string;
  balance: number;
  currency: CurrencyCode;
  status: AccountStatus;
  createdAt: UTCTime;
}

export interface TreasuryAccountsPaginatedResponse {
  accounts: TreasuryAccount[];
  page: PageInfo;
}

export interface TreasuryTransaction {
  id: UUID;
  amount: number;
  status: TransactionStatus;
  createdAt: UTCTime;
  kind: string;
  description?: string | null;
}

export interface TreasuryTransactionsPaginatedResponse {
  transactions: TreasuryTransaction[];
  page: PageInfo;
}

export interface TreasuryStatement {
  id: UUID;
  period: string;
  documentType: string;
  url?: string | null;
  createdAt: UTCTime;
}

export interface TreasuryStatementsPaginatedResponse {
  statements: TreasuryStatement[];
  page: PageInfo;
}

// ─── Webhooks ────────────────────────────────────────────────────────────

export interface Webhook {
  id: UUID;
  url: string;
  status: WebhookStatus;
  eventTypes: string[];
  createdAt: UTCTime;
  updatedAt: UTCTime;
}

export interface CreateWebhookRequest {
  url: string;
  eventTypes: string[];
}

export interface UpdateWebhookRequest {
  url?: string;
  /** Setting to 'active' reactivates a disabled webhook */
  status?: WebhookStatus;
  eventTypes?: string[];
}

export interface VerifyWebhookRequest {
  /** Event type to test. Defaults to 'transaction.created' if omitted. */
  eventType?: string;
}

export interface WebhooksPaginatedResponse {
  webhooks: Webhook[];
  page: PageInfo;
}

// ─── Events ──────────────────────────────────────────────────────────────

export interface MercuryEvent {
  id: UUID;
  type: string;
  createdAt: UTCTime;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  resourceId?: UUID | null;
  resourceType?: string | null;
}

export interface EventsPaginatedResponse {
  events: MercuryEvent[];
  page: PageInfo;
}

// ─── Organization ─────────────────────────────────────────────────────────

export interface Organization {
  id: UUID;
  legalBusinessName: string;
  ein?: string | null;
  dbas?: string[];
}

// ─── Users ───────────────────────────────────────────────────────────────

export interface MercuryUser {
  id: UUID;
  name: string;
  email: Email;
  role: string;
  createdAt: UTCTime;
}

export interface UsersPaginatedResponse {
  users: MercuryUser[];
  page: PageInfo;
}

// ─── SAFEs ───────────────────────────────────────────────────────────────

export interface SafeRequest {
  id: UUID;
  status: string;
  amount: number;
  currency: CurrencyCode;
  createdAt: UTCTime;
  investorName?: string | null;
  documentUrl?: string | null;
}

// ─── Credit ───────────────────────────────────────────────────────────────

export interface CreditAccount {
  id: UUID;
  name: string;
  creditLimit: number;
  availableCredit: number;
  currentBalance: number;
  status: AccountStatus;
  createdAt: UTCTime;
}

// ─── Attachments ──────────────────────────────────────────────────────────

export interface Attachment {
  id: UUID;
  fileName: string;
  url: string;
  downloadUrl: string;
  createdAt: UTCTime;
  attachmentType?: TransactionAttachmentType;
}

export interface RecipientAttachmentsResponse {
  attachments: RecipientAttachment[];
  page: PageInfo;
}

// ─── OAuth2 ───────────────────────────────────────────────────────────────

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface OAuth2AuthorizeParams {
  client_id: string;
  redirect_uri: string;
  response_type: "code";
  scope?: string;
  state?: string;
}

export interface OAuth2TokenRequest {
  grant_type: "authorization_code";
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
}
