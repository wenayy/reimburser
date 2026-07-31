import { resolveMerchant } from "./merchants";

/** Turns a raw bank/UPI debit alert into a clean, human-readable expense —
 *  resolving the recipient to a real brand, a "Shop", or a "Friend", and
 *  NEVER dumping a raw UPI id / phone number into the draft.
 *
 *  The companion app sends "TITLE — TEXT" (e.g. "VM-SLCBNK-S — Rs.1 sent…").
 *  Tested against slice, Bank of Baroda, Amazon Pay (Juspay), SBI, HDFC, and
 *  generic UPI/credit-card formats. */

/** DLT sender IDs → friendly names (the middle chunk of e.g. VM-SLCBNK-S). */
const BANK_SENDERS: Record<string, string> = {
  SLCBNK: "slice", HDFCBK: "HDFC Bank", SBIUPI: "SBI", SBIINB: "SBI", CBSSBI: "SBI",
  SBIBNK: "SBI", ATMSBI: "SBI",
  ICICIB: "ICICI Bank", ICICIT: "ICICI Bank", AXISBK: "Axis Bank", AXISBL: "Axis Bank",
  KOTAKB: "Kotak", PAYTMB: "Paytm Bank", PYTMPB: "Paytm Bank", IDFCFB: "IDFC First",
  YESBNK: "Yes Bank", PNBSMS: "PNB", PNBBNK: "PNB", CANBNK: "Canara Bank", CANBK: "Canara Bank",
  BOIIND: "Bank of India", FEDBNK: "Federal Bank", INDUSB: "IndusInd", AUBANK: "AU Bank",
  JUPITR: "Jupiter", FIMONY: "Fi", GPAY: "Google Pay", PHONPE: "PhonePe",
  BOBSMS: "Bank of Baroda", BOBTXN: "Bank of Baroda", BOBCRD: "Bank of Baroda", BOBIBN: "Bank of Baroda",
  UNIONB: "Union Bank", UBININ: "Union Bank", CENTBK: "Central Bank", IOBCHN: "Indian Overseas",
  UCOBNK: "UCO Bank", RBLBNK: "RBL Bank", BANDHN: "Bandhan Bank", DBSBNK: "DBS Bank",
  CITIBK: "Citi", SCBINB: "Standard Chartered", HSBCIN: "HSBC", DCBBNK: "DCB Bank",
  KARBNK: "Karnataka Bank", SIBSMS: "South Indian Bank", JAKBNK: "J&K Bank",
  EQUITS: "Equitas", UJJIVN: "Ujjivan", AIRBNK: "Airtel Payments", FINOBK: "Fino",
  CREDCB: "CRED", MOBWIK: "MobiKwik", PSBANK: "Punjab & Sind", KVBANK: "Karur Vysya",
};

/** UPI-app / bank PSP suffix (the part after @) → app name + logo domain, so a
 *  friend/shop payment shows the real app's logo instead of a generic icon. */
function upiAppLogo(psp: string): string | undefined {
  if (/^ok\w+/.test(psp)) return "pay.google.com";              // Google Pay (@okhdfcbank etc.)
  if (/^(ybl|ibl|axl)$/.test(psp)) return "phonepe.com";        // PhonePe
  if (/^(paytm|pty|ptys|ptybl|ptaxis|ptsbi|ptyes)$/.test(psp)) return "paytm.com";
  if (/^(apl|yapl|rapl)$/.test(psp)) return "amazon.in";        // Amazon Pay
  if (psp === "slc") return "sliceit.com";                      // slice
  if (psp === "cred" || psp === "axb") return "cred.club";      // CRED
  if (/^(mbk|ikwik)$/.test(psp)) return "mobikwik.com";         // MobiKwik
  if (/^wa\w+/.test(psp)) return "whatsapp.com";                // WhatsApp Pay
  if (/airtel/.test(psp)) return "airtel.in";                   // Airtel
  if (/^(fbl|freecharge)$/.test(psp)) return "freecharge.in";
  return undefined;
}

export interface ParsedAlert {
  /** display name for the card title */
  merchant: string;
  category: string;
  merchantDomain?: string;
  source?: string;
  /** clean human line (includes the amount) */
  rawText: string;
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatInr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

interface Recipient {
  title: string; // card title
  phrase: string; // "to Zomato" / "to a friend" / "at a shop"
  category: string;
  domain?: string;
}

const FRIEND: Recipient = { title: "Friend", phrase: "to a friend", category: "Transfer" };
const SHOP: Recipient = { title: "Shop", phrase: "at a shop", category: "Shop" };

/** Resolve a raw recipient string to something a human wants to read. */
function classifyRecipient(raw: string): Recipient | null {
  const p = raw.trim().replace(/[.,;:]+$/, "");
  if (!p || p.length > 60) return null;

  // ---- UPI VPA (handle@psp) ----
  if (p.includes("@")) {
    const [handleRaw, pspRaw = ""] = p.split("@");
    const handle = handleRaw.toLowerCase();
    const psp = pspRaw.toLowerCase();
    const appLogo = upiAppLogo(psp); // the paying app's logo, if we know it

    // known brand inside the handle wins (paytm-blinkit → Blinkit, …)
    const brand = resolveMerchant(handle.replace(/[._-]+/g, " "));
    if (brand.category !== "Other")
      return { title: brand.name, phrase: `to ${brand.name}`, category: brand.category, domain: brand.domain };

    // phone-number VPA → a friend (never show the number)
    if (/^\+?\d[\d-]{5,}$/.test(handleRaw))
      return { title: "Friend", phrase: "to a friend", category: "Transfer", domain: appLogo };

    // dynamic-QR merchants → a shop
    if (/^(paytmqr|bharatpe|bpqr|q[a-z0-9]{6,})/.test(handle))
      return { title: "Shop", phrase: "at a shop", category: "Shop", domain: appLogo };

    // merchant-side VPAs (razorpay, paytm/airtel business) → business name
    const merchantPsp = /^(ptys|ptybl|rxairtel|rapl|yapl|abfspay|pz|indus)$/.test(psp);
    if (/rzp/.test(handle) || merchantPsp) {
      const biz = titleCase(
        handle.replace(/\.?rzp\w*/g, " ").replace(/\d+/g, " ").replace(/[._-]+/g, " ").trim()
      );
      return biz.length >= 3
        ? { title: biz, phrase: `at ${biz}`, category: "Shop", domain: appLogo }
        : { title: "Shop", phrase: "at a shop", category: "Shop", domain: appLogo };
    }

    // personal bank handle (okicici, oksbi, slc, ybl…) or unknown → a friend,
    // tagged with the paying app's logo
    return { title: "Friend", phrase: "to a friend", category: "Transfer", domain: appLogo };
  }

  // ---- plain-text recipient ----
  if (/^merchant$/i.test(p)) return SHOP;
  if (/^(mr|mrs|ms|shri|smt|dr)\.?\s/i.test(p)) return FRIEND;

  const brand = resolveMerchant(p);
  if (brand.category !== "Other")
    return { title: brand.name, phrase: `to ${brand.name}`, category: brand.category, domain: brand.domain };

  const name = titleCase(p);
  return { title: name, phrase: `to ${name}`, category: "Other" };
}

export function parseBankAlert(raw: string, amount: number): ParsedAlert {
  let title = "";
  let text = raw.trim();
  const sep = text.indexOf(" — ");
  if (sep > 0 && sep < 30) {
    title = text.slice(0, sep).trim();
    text = text.slice(sep + 3).trim();
  }

  // ---- source (bank / app) ----
  let source: string | undefined;
  const tail = text.match(/[-–]\s*([A-Za-z][A-Za-z /]{1,18})\s*$/);
  if (tail) source = tail[1].trim();
  if (!source && title) {
    const id = title.match(/[A-Z]{2}-([A-Z]{4,8})/i)?.[1]?.toUpperCase();
    if (id && BANK_SENDERS[id]) source = BANK_SENDERS[id];
  }
  if (/\bBOB\b/.test(text)) source = "Bank of Baroda";
  if (/apay\s*balance|amazon\s?pay|juspay/i.test(text)) source = "Amazon Pay";
  if (source && /^slice$/i.test(source)) source = "slice";

  // ---- Amazon Pay balance payments ("at merchant", no name) ----
  if (/apay\s*balance|amazon\s?pay/i.test(text)) {
    return {
      merchant: "Amazon Pay",
      category: "Shopping",
      merchantDomain: "amazon.in",
      source: "Amazon Pay",
      rawText: `${formatInr(amount)} · via Amazon Pay`,
    };
  }

  // ---- recipient ----
  const m = text.match(
    /\b(?:cr\.?\s+to|paid\s+to|sent\s+to|to|at)\s+(.+?)(?=\s+on\b|\s+via\b|\s*\(|\.\s|\s+ref\b|\s+umn\b|\s*$)/i
  );
  const rec = m ? classifyRecipient(m[1]) : null;

  if (!rec) {
    return {
      merchant: "Payment",
      category: "Other",
      source,
      rawText: `${formatInr(amount)}${source ? ` · via ${source}` : ""}`,
    };
  }

  return {
    merchant: rec.title,
    category: rec.category,
    merchantDomain: rec.domain,
    source,
    rawText: `${formatInr(amount)} ${rec.phrase}${source ? ` · via ${source}` : ""}`,
  };
}
