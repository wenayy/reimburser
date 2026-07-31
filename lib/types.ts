export type PaymentMethodType =
  | "upi"
  | "paypal"
  | "wise"
  | "amazon_gc"
  | "throne"
  | "bank";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  /** the copy/pay value shown to supporters (VPA, link, email, address, or composed bank details) */
  value: string;
  /** structured per-type fields, e.g. { address, network, coin } or { account, ifsc, holder } */
  details?: Record<string, string>;
  enabled: boolean;
}

export type ExpenseStatus = "draft" | "published" | "hidden";

export interface Expense {
  id: string;
  creatorId: string;
  merchant: string;
  /** raw transaction text, e.g. "STARBUCKS STORE 98231" */
  rawText: string;
  merchantDomain?: string;
  category: string;
  amount: number; // in INR
  date: string; // ISO
  aiDescription: string;
  customDescription?: string;
  /** optional creator-attached photo (bill scan etc.), shown instead of the merchant logo */
  image?: string;
  /** optional product/item URL (http(s) only) — "View item" on the public card */
  link?: string;
  status: ExpenseStatus;
  source: "manual" | "auto";
}

export type ReimbursementStatus = "pending" | "verified" | "rejected";

export interface Reimbursement {
  id: string;
  expenseId: string;
  supporterName: string; // "Anonymous" if not given
  amount: number;
  methodType: PaymentMethodType;
  note?: string;
  proofNote?: string;
  /** served via /uploads/[name] from data/uploads */
  proofImage?: string;
  /** Amazon gift card code, if the supporter chose to share one */
  giftCode?: string;
  /** salted hash of the submitter's IP — for creator-side blocking, never displayed */
  ipHash?: string;
  /** true when a pending claim was auto-rejected after sitting unverified too long */
  autoExpired?: boolean;
  status: ReimbursementStatus;
  createdAt: string; // ISO
  /** when the claim was verified/rejected — rejected rows are purged 7 days after this */
  resolvedAt?: string;
}

export interface Creator {
  id: string;
  username: string;
  email: string;
  /** Auth.js identity: "<provider>:<providerAccountId>", e.g. "google:123…" */
  authId?: string;
  /** ISO signup time — for growth stats (backfilled from id for early rows) */
  createdAt?: string;
  onboarded: boolean;
  displayName: string;
  bio: string;
  avatarEmoji: string;
  /** uploaded profile photo (/uploads/…); takes precedence over the emoji */
  avatarImage?: string;
  /** IP hashes this creator has blocked from submitting contributions */
  blockedIps?: string[];
  /** secret for the companion app's expense-capture API (auto-import) */
  deviceKey?: string;
  /** opaque session tokens issued to the native app after Google login */
  mobileTokens?: string[];
  paymentMethods: PaymentMethod[];
  preferences: {
    autoImport: boolean;
    autoPublish: boolean;
    allowProofUpload: boolean;
    /** proof upload becomes mandatory — no claim without a screenshot (needs allowProofUpload; default true) */
    requireProof?: boolean;
    /** show the Top Supporters section on the public page */
    showLeaderboard: boolean;
    /** show UPI only to supporters with a previously verified payment (default true) */
    protectUpi?: boolean;
  };
}

// ---- public page DTOs ----
// Everything passed to a client component on /[username] serializes into the
// page payload, readable by anyone via View Source. These shapes are the whole
// allowlist — never pass the full Creator/Expense/Reimbursement there.

export type PublicSupport = Pick<
  Reimbursement,
  "id" | "expenseId" | "supporterName" | "amount" | "status" | "createdAt"
>;

export type PublicExpense = Pick<
  Expense,
  "id" | "merchant" | "merchantDomain" | "category" | "amount" | "date"
  | "aiDescription" | "customDescription" | "image" | "link" | "source"
>;

export interface PublicCreator {
  displayName: string;
  /** enabled methods only, UPI already trust-filtered server-side */
  paymentMethods: PaymentMethod[];
  preferences: { allowProofUpload: boolean; requireProof: boolean };
}

/** A recurring expense the creator adds with one tap instead of retyping daily. */
export interface ExpenseTemplate {
  id: string;
  creatorId: string;
  rawText: string;
  merchant: string;
  merchantDomain?: string;
  category: string;
  amount: number;
  customDescription?: string;
  status: ExpenseStatus;
}

export interface Database {
  creators: Creator[];
  expenses: Expense[];
  reimbursements: Reimbursement[];
  templates: ExpenseTemplate[];
}
