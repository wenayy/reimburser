import { PaymentMethodType } from "./types";

export const PAYMENT_META: Record<
  PaymentMethodType,
  { label: string; emoji: string; international: boolean; instructions: string }
> = {
  upi: {
    label: "UPI",
    emoji: "🇮🇳",
    international: false,
    instructions: "Scan the QR or tap the button to open any UPI app (GPay, PhonePe, Paytm).",
  },
  paypal: {
    label: "PayPal",
    emoji: "🅿️",
    international: true,
    instructions: "Works from most countries. Opens the creator's PayPal.Me page.",
  },
  wise: {
    label: "Wise",
    emoji: "🌍",
    international: true,
    instructions: "Send money to this email on wise.com — low fees, converts to INR automatically.",
  },
  amazon_gc: {
    label: "Amazon.in Gift Card",
    emoji: "🎁",
    international: true,
    instructions:
      "Buy an Amazon.in eGift Card (amazon.in/gift-cards) with any international card and email it to this address. No PayPal or bank needed.",
  },
  throne: {
    label: "Throne",
    emoji: "👑",
    international: true,
    instructions:
      "Opens the creator's Throne wishlist — buy them a gift with your local payment method. Throne keeps their address private.",
  },
  crypto: {
    label: "Crypto",
    emoji: "🪙",
    international: true,
    instructions: "Send stablecoins (USDC/USDT) to this address. Double-check the network before sending.",
  },
  bank: {
    label: "Bank Transfer",
    emoji: "🏦",
    international: true,
    instructions: "Direct bank transfer using these account details.",
  },
};

export interface PaymentField {
  key: string;
  label: string;
  placeholder: string;
  optional?: boolean;
}

/** What each payment type actually needs from the creator. */
export const PAYMENT_FIELDS: Record<PaymentMethodType, PaymentField[]> = {
  upi: [{ key: "vpa", label: "UPI ID", placeholder: "e.g. riya@okhdfcbank" }],
  paypal: [{ key: "link", label: "PayPal.Me link", placeholder: "e.g. paypal.me/riyasharma" }],
  wise: [{ key: "email", label: "Email on your Wise account", placeholder: "e.g. riya@example.com" }],
  amazon_gc: [
    {
      key: "email",
      label: "Email where gift cards arrive (optional)",
      placeholder: "e.g. riya@example.com",
      optional: true,
    },
  ],
  throne: [{ key: "link", label: "Throne wishlist link", placeholder: "e.g. throne.com/riya" }],
  crypto: [
    { key: "address", label: "Wallet address", placeholder: "e.g. 0x1a2b…9f0c" },
    { key: "network", label: "Network / chain", placeholder: "e.g. Polygon, Ethereum, Solana" },
    { key: "coin", label: "Coin (optional)", placeholder: "e.g. USDC", optional: true },
  ],
  bank: [
    { key: "account", label: "Account number", placeholder: "e.g. 50100234567890" },
    { key: "ifsc", label: "IFSC / SWIFT code", placeholder: "e.g. HDFC0001234" },
    { key: "holder", label: "Account holder (optional)", placeholder: "e.g. Riya Sharma", optional: true },
  ],
};

/** Validates raw field input and composes the label + supporter-facing value.
 *  Returns null if a required field is missing. */
export function composeMethod(
  type: PaymentMethodType,
  fields: Record<string, string>
): { label: string; value: string; details: Record<string, string> } | null {
  const spec = PAYMENT_FIELDS[type];
  if (!spec) return null;
  const clean: Record<string, string> = {};
  for (const f of spec) {
    const v = (fields[f.key] ?? "").trim();
    if (!v && !f.optional) return null;
    if (v) clean[f.key] = v.slice(0, 120);
  }
  switch (type) {
    case "amazon_gc":
      // email is optional — without one, supporters paste the claim code and
      // the creator redeems it directly
      return {
        label: PAYMENT_META.amazon_gc.label,
        value: clean.email ?? "Code only — shared in the payment flow",
        details: clean,
      };
    case "crypto":
      return {
        label: clean.coin ? `${clean.coin} (${clean.network})` : `Crypto (${clean.network})`,
        value: clean.address,
        details: clean,
      };
    case "bank":
      return {
        label: "Bank Transfer",
        value: [`A/C ${clean.account}`, `IFSC ${clean.ifsc}`, clean.holder]
          .filter(Boolean)
          .join(" · "),
        details: clean,
      };
    default:
      return { label: PAYMENT_META[type].label, value: Object.values(clean)[0], details: clean };
  }
}

/** Shown wherever a creator sets up the gift card method — the email is a
 *  convenience, not a requirement. */
export const GIFT_CARD_EMAIL_HINT =
  "Don't want to share your email? Leave it blank — supporters will paste their gift card's claim code instead, and you redeem it yourself on amazon.in.";

/** Shown wherever a creator enters a wallet address — supporters send to
 *  exactly what's published, and crypto transfers can't be undone. */
export const CRYPTO_ADDRESS_DISCLAIMER =
  "Double-check every character of your address and network before saving. Crypto transfers are irreversible — funds sent to a wrong address are gone forever. Supporters send to exactly what you enter here, so its accuracy is your responsibility.";

const ADDRESS_PATTERNS: { chain: RegExp; shape: RegExp; expected: string }[] = [
  {
    chain: /ethereum|eth\b|polygon|matic|arbitrum|optimism|base|bsc|binance|avalanche|avax|evm|erc-?20/i,
    shape: /^0x[a-fA-F0-9]{40}$/,
    expected: "an EVM address (0x followed by 40 hex characters)",
  },
  {
    chain: /solana|sol\b|spl/i,
    shape: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    expected: "a Solana address (32–44 base58 characters, no 0x)",
  },
  {
    chain: /tron|trc-?20/i,
    shape: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    expected: "a Tron address (starts with T, 34 characters)",
  },
  {
    chain: /bitcoin|btc\b/i,
    shape: /^(bc1[a-z0-9]{25,62}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/,
    expected: "a Bitcoin address (starts with bc1, 1 or 3)",
  },
];

/** Soft check that a wallet address matches the shape of the named network.
 *  Returns a warning string on mismatch, null when fine or the chain is unknown. */
export function cryptoAddressWarning(address: string, network: string): string | null {
  const addr = address.trim();
  const net = network.trim();
  if (!addr || !net) return null;
  const spec = ADDRESS_PATTERNS.find((p) => p.chain.test(net));
  if (!spec || spec.shape.test(addr)) return null;
  return `This doesn't look like ${spec.expected}. Double-check it — funds sent to a wrong ${net} address can't be recovered.`;
}

/** Soft check that a pasted code matches the shape of an Amazon.in gift card
 *  claim code: 14–16 letters/digits, usually grouped 4-6-4 with dashes.
 *  Returns a warning string when it clearly doesn't, null when fine or empty. */
export function giftCodeWarning(code: string): string | null {
  const stripped = code.replace(/[\s-]/g, "");
  if (!stripped || /^[A-Za-z0-9]{14,16}$/.test(stripped)) return null;
  return "This code isn't valid — Amazon.in gift card codes look like 6QXT-HJRLGQ-K9LT. Check it against your card or email.";
}

/** Max unverified claims one expense can hold before new ones are refused. */
export const MAX_PENDING_PER_EXPENSE = 10;

/** Max unverified claims a once-verified sender can have with one creator —
 *  verification releases the slots. First-timers get 1, veterans get more. */
export const MAX_PENDING_PER_SENDER = 3;

/** Verified payments after which a sender is considered a proven regular. */
export const VETERAN_TRUST_THRESHOLD = 10;

/** How many unverified claims a sender may hold with one creator at once,
 *  scaled by how many of their payments that creator has already verified:
 *  a stranger proves one claim before sending another; a known supporter
 *  gets a few slots; a proven regular is barely throttled. */
export function pendingAllowance(verifiedCount: number): number {
  if (verifiedCount >= VETERAN_TRUST_THRESHOLD) return 10;
  if (verifiedCount >= 1) return MAX_PENDING_PER_SENDER;
  return 1;
}

/** Verified payments a sender needs with a creator before UPI is shown to them. */
export const UPI_TRUST_THRESHOLD = 3;

/** Pending claims older than this get auto-rejected so the queue self-cleans. */
export const PENDING_EXPIRY_DAYS = 7;

/** Fully covered expenses leave the public list after this many quiet days
 *  (no new verified support) — keeps the page short; the dashboard keeps all. */
export const COVERED_PUBLIC_TTL_DAYS = 3;

/** Anti-spam floor: above ₹100 remaining, contributions must be at least 25%
 *  of what's left; at ₹100 or below the expense can only be covered in full. */
export function minContribution(remaining: number): number {
  return remaining > 100 ? Math.ceil(remaining * 0.25) : remaining;
}

/** Rough INR→USD rate for display hints and PayPal links — not a live quote. */
export const INR_PER_USD = 83;

/** Clean whole-dollar equivalent, rounded up so the creator never falls short. */
export function approxUsd(amountInr: number): number {
  return Math.max(1, Math.ceil(amountInr / INR_PER_USD));
}

export function upiDeepLink(vpa: string, name: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: String(amount),
    cu: "INR",
    tn: note.slice(0, 50),
  });
  return `upi://pay?${params.toString()}`;
}
