/** Cleans raw bank/UPI alert text into something a human wants to read:
 *  who was paid, through what — no UPI refs, sender IDs, or "Not you?" tails.
 *  The companion app sends "TITLE — TEXT" (e.g. "VM-SLCBNK-S — Rs.1 sent…"). */

/** DLT sender IDs → friendly names (the middle chunk of e.g. VM-SLCBNK-S). */
const BANK_SENDERS: Record<string, string> = {
  SLCBNK: "slice",
  HDFCBK: "HDFC Bank",
  SBIUPI: "SBI",
  SBIINB: "SBI",
  CBSSBI: "SBI",
  ICICIB: "ICICI Bank",
  ICICIT: "ICICI Bank",
  AXISBK: "Axis Bank",
  KOTAKB: "Kotak",
  PAYTMB: "Paytm Bank",
  PYTMPB: "Paytm Bank",
  IDFCFB: "IDFC First",
  YESBNK: "Yes Bank",
  PNBSMS: "PNB",
  CANBNK: "Canara Bank",
  BOIIND: "Bank of India",
  FEDBNK: "Federal Bank",
  INDUSB: "IndusInd",
  AUBANK: "AU Bank",
  JUPITR: "Jupiter",
  FIMONY: "Fi",
  GPAY: "Google Pay",
  PHONPE: "PhonePe",
};

export interface ParsedAlert {
  /** cleaned, human-readable transaction line for display */
  cleaned: string;
  /** recipient/merchant the money went to, if detectable */
  payee?: string;
  /** bank or UPI app the alert came from, if detectable */
  source?: string;
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export function parseBankAlert(raw: string): ParsedAlert {
  let title = "";
  let text = raw.trim();
  const sep = text.indexOf(" — ");
  if (sep > 0 && sep < 30) {
    title = text.slice(0, sep).trim();
    text = text.slice(sep + 3).trim();
  }

  // source, best signal first: trailing "- slice" signature, then sender ID
  let source: string | undefined;
  const tail = text.match(/[-–]\s*([A-Za-z][A-Za-z ]{1,18})\s*$/);
  if (tail) source = tail[1].trim();
  if (!source && title) {
    const id = title.match(/^[A-Z]{2}-([A-Z]{4,8})-?[A-Z]?$/i)?.[1]?.toUpperCase();
    if (id) source = BANK_SENDERS[id] ?? undefined;
  }

  // strip the noise nobody should re-read
  let cleaned = text
    .replace(/\(?\s*(upi\s*)?ref[.:txn ]*\s*(no[.:]?\s*)?\d[\d ]*\)?/gi, "")
    .replace(/not you\?.*$/i, "")
    .replace(/if not (you|done).*$/i, "")
    .replace(/call \d[\d -]+.*$/i, "")
    .replace(/sms\s+block.*$/i, "")
    .replace(/[-–]\s*[A-Za-z][A-Za-z ]{1,18}\s*$/, "") // trailing "- slice"
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .trim()
    .replace(/[.,;: ]+$/, "");

  // who got paid: "to VINAY JOSHI (…" / "at ZOMATO on…" / "towards …"
  const payeeMatch = cleaned.match(
    /\b(?:to|at|towards)\s+([A-Za-z][A-Za-z0-9@._' -]{1,39}?)(?=\s+on\b|\s+via\b|\s*\(|\s*[.,]|$)/i
  );
  let payee = payeeMatch?.[1]?.trim();
  // VPA payees ("zomato@paytm") keep the handle; names get title-cased
  if (payee && !payee.includes("@")) payee = titleCase(payee);

  return { cleaned, payee, source };
}
