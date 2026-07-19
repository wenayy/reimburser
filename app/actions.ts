"use server";

import { revalidatePath } from "next/cache";
import { clientIp, hashIp } from "@/lib/request";
import {
  countPendingForExpense, countPendingFromSender, countVerifiedFromSender, getCreatorById,
  getExpense, getOwnedReimbursement, getOwnedTemplate, listPendingFromSender,
  removeExpense, removeTemplate, saveExpense, saveReimbursement, saveTemplate,
  uid, updateCreator, updateOwnedExpense, usernameTaken, verifiedTotal,
} from "@/lib/store";
import { getSessionCreator } from "@/lib/auth";
import { saveImage, deleteUpload } from "@/lib/uploads";
import {
  composeMethod, giftCodeWarning, minContribution, MAX_PENDING_PER_EXPENSE,
  PAYMENT_FIELDS, pendingAllowance, UPI_TRUST_THRESHOLD,
} from "@/lib/payments";
import { resolveMerchant } from "@/lib/merchants";
import { generateDescription } from "@/lib/ai";
import { Expense, ExpenseStatus, PaymentMethodType, Reimbursement } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/[username]", "page");
}

async function requireCreator() {
  const creator = await getSessionCreator();
  if (!creator) throw new Error("Not signed in");
  return creator;
}

export async function addExpense(formData: FormData) {
  const rawText = String(formData.get("rawText") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const customDescription = String(formData.get("description") ?? "").trim();
  const requested = String(formData.get("status") ?? "published") as ExpenseStatus;
  const status: ExpenseStatus = ["published", "draft", "hidden"].includes(requested)
    ? requested
    : "published";
  if (!rawText || !Number.isFinite(amount) || amount <= 0) return;

  const creator = await requireCreator();
  const info = resolveMerchant(rawText);
  const image = await saveImage(formData.get("billImage"), "expense");

  const link = sanitizeLink(String(formData.get("link") ?? ""));
  const date = new Date();
  const expense: Expense = {
    id: uid("e"),
    creatorId: creator.id,
    merchant: info.name,
    rawText,
    merchantDomain: info.domain,
    category: info.category,
    amount,
    date: date.toISOString(),
    aiDescription: generateDescription(info.name, info.category, amount, date),
    customDescription: customDescription || undefined,
    image,
    link,
    status,
    source: "manual",
  };
  await saveExpense(expense);
  if (formData.get("saveTemplate") === "on") {
    await saveTemplate({
      id: uid("t"),
      creatorId: creator.id,
      rawText,
      merchant: info.name,
      merchantDomain: info.domain,
      category: info.category,
      amount,
      customDescription: customDescription || undefined,
      status,
    });
  }
  revalidateAll();
}

/** One-tap add of a recurring expense (dated now, fresh AI description). */
export async function useTemplate(id: string) {
  const creator = await requireCreator();
  const t = await getOwnedTemplate(id, creator.id);
  if (!t) return;
  const date = new Date();
  await saveExpense({
    id: uid("e"),
    creatorId: creator.id,
    merchant: t.merchant,
    rawText: t.rawText,
    merchantDomain: t.merchantDomain,
    category: t.category,
    amount: t.amount,
    date: date.toISOString(),
    aiDescription: generateDescription(t.merchant, t.category, t.amount, date),
    customDescription: t.customDescription,
    status: t.status,
    source: "manual",
  });
  revalidateAll();
}

export async function deleteTemplate(id: string) {
  const creator = await requireCreator();
  await removeTemplate(id, creator.id);
  revalidateAll();
}

export async function setExpenseStatus(id: string, status: ExpenseStatus) {
  // params cross the client boundary — the type means nothing at runtime
  if (!["published", "draft", "hidden"].includes(status)) return;
  const creator = await requireCreator();
  await updateOwnedExpense(id, creator.id, (e) => {
    e.status = status;
  });
  revalidateAll();
}

export async function updateExpense(formData: FormData) {
  const creator = await requireCreator();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const merchant = String(formData.get("merchant") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const link = sanitizeLink(String(formData.get("link") ?? ""));
  const newImage = await saveImage(formData.get("billImage"), "expense");

  let oldImage: string | undefined;
  await updateOwnedExpense(id, creator.id, (e) => {
    // auto-captured expenses reflect a real transaction — merchant and amount
    // are immutable; the story around them (description, photo, link) can change
    if (e.source !== "auto") {
      if (merchant) e.merchant = merchant;
      if (Number.isFinite(amount) && amount > 0) e.amount = amount;
    }
    e.customDescription = description || undefined;
    e.link = link;
    if (newImage) {
      oldImage = e.image;
      e.image = newImage;
    }
  });
  if (newImage) await deleteUpload(oldImage);
  revalidateAll();
}

export async function deleteExpense(id: string) {
  const creator = await requireCreator();
  const orphanedProofs = await removeExpense(id, creator.id);
  for (const url of orphanedProofs) await deleteUpload(url);
  revalidateAll();
}

// In-memory rate limit for the public contribution endpoint. Per-instance on
// Fluid Compute and resets on cold start — enough to blunt drive-by spam until
// this moves to Redis/Upstash. The DB-backed pending caps below are the hard
// boundary either way.
const submitBuckets = new Map<string, number[]>();
const SUBMIT_WINDOW_MS = 10 * 60_000;
const SUBMIT_LIMIT = 5;
// even proven regulars have a ceiling — this pace is nobody's genuine behavior
const TRUSTED_WINDOW_MS = 60_000;
const TRUSTED_LIMIT = 10;

function rateLimited(key: string, windowMs: number, limit: number): boolean {
  const now = Date.now();
  const recent = (submitBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    submitBuckets.set(key, recent);
    return true;
  }
  recent.push(now);
  submitBuckets.set(key, recent);
  return false;
}

/** Same check without consuming a slot — for prechecks that record nothing. */
function rateLimitReached(key: string, windowMs: number, limit: number): boolean {
  const now = Date.now();
  return (submitBuckets.get(key) ?? []).filter((t) => now - t < windowMs).length >= limit;
}

const clip = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "").trim().slice(0, max);

/** User-supplied URLs end up in hrefs — allow only real http(s) links. */
function sanitizeLink(raw: string): string | undefined {
  const trimmed = raw.trim().slice(0, 300);
  if (!trimmed) return undefined;
  try {
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
  } catch {
    // not a URL — drop silently rather than fail the save
  }
  return undefined;
}

export type SubmitResult =
  | { ok: true }
  | {
      ok: false;
      reason: "rate_limit" | "queue_full" | "too_many_pending" | "blocked" | "proof_required" | "invalid";
    };

/** Passive rerun of submitReimbursement's gates — records nothing and consumes
 *  no rate-limit slot. The modal calls it before revealing payment details so
 *  nobody sends real money for a claim that would be refused afterwards. */
export async function precheckSubmit(expenseId: string): Promise<SubmitResult> {
  const expense = await getExpense(expenseId);
  if (!expense || expense.status !== "published") return { ok: false, reason: "invalid" };
  const owner = await getCreatorById(expense.creatorId);
  if (!owner) return { ok: false, reason: "invalid" };

  const ip = await clientIp();
  const ipHash = hashIp(ip);
  if (owner.blockedIps?.includes(ipHash)) return { ok: false, reason: "blocked" };

  const verifiedFromSender = await countVerifiedFromSender(expense.creatorId, ipHash);
  const trusted = verifiedFromSender > 0;
  if (!trusted && rateLimitReached(ip, SUBMIT_WINDOW_MS, SUBMIT_LIMIT))
    return { ok: false, reason: "rate_limit" };
  if (trusted && rateLimitReached(`trusted:${ip}`, TRUSTED_WINDOW_MS, TRUSTED_LIMIT))
    return { ok: false, reason: "rate_limit" };

  const myPending = await countPendingFromSender(expense.creatorId, ipHash);
  if (myPending >= pendingAllowance(verifiedFromSender))
    return { ok: false, reason: "too_many_pending" };

  const pendingCount = await countPendingForExpense(expenseId);
  if (pendingCount >= MAX_PENDING_PER_EXPENSE) return { ok: false, reason: "queue_full" };

  return { ok: true };
}

export async function submitReimbursement(formData: FormData): Promise<SubmitResult> {
  const ip = await clientIp();

  const amount = Number(formData.get("amount"));
  const expenseId = String(formData.get("expenseId") ?? "");
  const methodType = String(formData.get("methodType")) as PaymentMethodType;
  if (!expenseId || !methodType || !Number.isFinite(amount) || amount <= 0)
    return { ok: false, reason: "invalid" };

  // only published expenses accept contributions, and never more than the expense itself
  const expense = await getExpense(expenseId);
  if (!expense || expense.status !== "published") return { ok: false, reason: "invalid" };

  const ipHash = hashIp(ip);
  const owner = await getCreatorById(expense.creatorId);
  if (!owner) return { ok: false, reason: "invalid" };
  // a block always wins, even over earlier trust
  if (owner.blockedIps?.includes(ipHash)) return { ok: false, reason: "blocked" };

  // the claimed method must be one the creator actually offers
  const enabledMethods = owner.paymentMethods.filter((m) => m.enabled);
  const chosenMethod = enabledMethods.find((m) => m.type === methodType);
  if (!chosenMethod) return { ok: false, reason: "invalid" };

  // trusted sender: this creator has verified a payment from them before —
  // proven supporters aren't throttled like strangers
  const verifiedFromSender = await countVerifiedFromSender(expense.creatorId, ipHash);
  const trusted = verifiedFromSender > 0;

  // UPI is hidden until UPI_TRUST_THRESHOLD verified payments on the public
  // page; the modal is not the security boundary, so enforce the same rule
  // here — no only-method exception (matches the public page)
  const protectUpi = owner.preferences.protectUpi ?? true;
  if (methodType === "upi" && protectUpi && verifiedFromSender < UPI_TRUST_THRESHOLD)
    return { ok: false, reason: "invalid" };

  if (!trusted && rateLimited(ip, SUBMIT_WINDOW_MS, SUBMIT_LIMIT))
    return { ok: false, reason: "rate_limit" };
  if (trusted && rateLimited(`trusted:${ip}`, TRUSTED_WINDOW_MS, TRUSTED_LIMIT))
    return { ok: false, reason: "rate_limit" };

  // unverified-claim slots scale with proven history: a first-timer proves one
  // claim before sending another; verification releases the slots either way,
  // so genuine supporters are never stuck long
  const myPending = await countPendingFromSender(expense.creatorId, ipHash);
  if (myPending >= pendingAllowance(verifiedFromSender))
    return { ok: false, reason: "too_many_pending" };

  // hard cap on the unverified queue per expense — no bypass for anyone
  const pendingCount = await countPendingForExpense(expenseId);
  if (pendingCount >= MAX_PENDING_PER_EXPENSE) return { ok: false, reason: "queue_full" };

  // same 25%-of-remaining floor the UI shows — the button is not the security boundary
  const covered = await verifiedTotal(expenseId);
  const remaining = expense.amount - (expense.amount > 0 ? covered % expense.amount : 0);
  if (amount < minContribution(remaining)) return { ok: false, reason: "invalid" };

  // the toggles in Settings are enforced here, not just in the modal — when the
  // creator requires proof, no screenshot means no claim; for gift cards the
  // pasted code is proof in itself
  const giftCode = clip(formData.get("giftCode"), 40) || undefined;
  // a code that doesn't even look like one never enters the queue
  if (giftCode && giftCodeWarning(giftCode)) return { ok: false, reason: "invalid" };
  // gift-card method without a delivery email: the pasted code is the payment
  if (methodType === "amazon_gc" && !chosenMethod.details?.email && !giftCode)
    return { ok: false, reason: "invalid" };
  const proofImage = owner.preferences.allowProofUpload
    ? await saveImage(formData.get("proofImage"), "proof")
    : undefined;
  const proofRequired =
    owner.preferences.allowProofUpload && (owner.preferences.requireProof ?? true);
  const giftCodeIsProof = methodType === "amazon_gc" && !!giftCode;
  if (proofRequired && !proofImage && !giftCodeIsProof)
    return { ok: false, reason: "proof_required" };

  // a name is required — creators verify against real payments, and a queue of
  // anonymous claims is impossible to tell apart
  const supporterName = clip(formData.get("supporterName"), 40);
  if (!supporterName) return { ok: false, reason: "invalid" };

  const r: Reimbursement = {
    id: uid("r"),
    expenseId,
    supporterName,
    amount: Math.min(amount, expense.amount),
    methodType,
    note: clip(formData.get("note"), 200) || undefined,
    proofNote: clip(formData.get("proofNote"), 120) || undefined,
    proofImage,
    giftCode,
    ipHash,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await saveReimbursement(r, expense.creatorId);
  revalidateAll();
  return { ok: true };
}

export async function setReimbursementStatus(id: string, status: "verified" | "rejected") {
  if (!["verified", "rejected"].includes(status)) return;
  const creator = await requireCreator();
  const r = await getOwnedReimbursement(id, creator.id);
  if (!r) return;
  r.status = status;
  r.resolvedAt = new Date().toISOString();
  // the proof did its job either way — delete the file so nothing accumulates
  await deleteUpload(r.proofImage);
  r.proofImage = undefined;
  await saveReimbursement(r, creator.id);
  revalidateAll();
}

/** Reject a claim, block its sender, and sweep away every other pending claim
 *  from the same sender — one click cleans the whole spam batch. */
export async function rejectAndBlock(id: string) {
  const creator = await requireCreator();
  const r = await getOwnedReimbursement(id, creator.id);
  if (!r) return;

  const batch = r.ipHash ? await listPendingFromSender(creator.id, r.ipHash) : [];
  const targets = [r, ...batch.filter((x) => x.id !== r.id)];
  for (const t of targets) {
    t.status = "rejected";
    t.resolvedAt = new Date().toISOString();
    await deleteUpload(t.proofImage);
    t.proofImage = undefined;
    await saveReimbursement(t, creator.id);
  }
  if (r.ipHash) {
    const hash = r.ipHash;
    await updateCreator(creator.id, (c) => {
      c.blockedIps = [...new Set([...(c.blockedIps ?? []), hash])];
    });
  }
  revalidateAll();
}

export async function clearBlockedIps() {
  const creator = await requireCreator();
  await updateCreator(creator.id, (c) => {
    c.blockedIps = [];
  });
  revalidateAll();
}

/** Root paths a username must never shadow. */
const RESERVED_USERNAMES = [
  "dashboard", "login", "signup", "onboarding", "help", "api", "icons",
  "admin", "uploads", "manifest", "favicon", "robots", "sitemap",
  "terms", "privacy", "refunds", "contact", "settings", "about", "support", "demo", "faq",
];

export type UsernameResult = { ok: boolean; error?: string };

export async function updateUsername(formData: FormData): Promise<UsernameResult> {
  const creator = await requireCreator();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username))
    return { ok: false, error: "3–30 characters: letters, numbers, dashes or underscores." };
  if (username === creator.username) return { ok: true };
  if (RESERVED_USERNAMES.includes(username) || (await usernameTaken(username, creator.authId)))
    return { ok: false, error: "That name isn't available — try another." };
  try {
    await updateCreator(creator.id, (c) => {
      c.username = username;
    });
  } catch {
    // unique-constraint race: someone claimed it between check and save
    return { ok: false, error: "That name isn't available — try another." };
  }
  revalidateAll();
  return { ok: true };
}

export async function updateProfile(formData: FormData) {
  const creator = await requireCreator();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarEmoji = String(formData.get("avatarEmoji") ?? "").trim();
  const newImage = await saveImage(formData.get("avatarFile"), "avatar");

  let oldImage: string | undefined;
  await updateCreator(creator.id, (c) => {
    if (displayName) c.displayName = displayName;
    c.bio = bio;
    if (avatarEmoji) c.avatarEmoji = avatarEmoji;
    if (newImage) {
      oldImage = c.avatarImage;
      c.avatarImage = newImage;
    }
  });
  if (newImage) await deleteUpload(oldImage);
  revalidateAll();
}

/** Applies immediately — deletes the stored file and clears the reference. */
export async function removeProfilePhoto() {
  const creator = await requireCreator();
  let oldImage: string | undefined;
  await updateCreator(creator.id, (c) => {
    oldImage = c.avatarImage;
    c.avatarImage = undefined;
  });
  await deleteUpload(oldImage);
  revalidateAll();
}

export async function addPaymentMethod(formData: FormData) {
  const creator = await requireCreator();
  const type = String(formData.get("type")) as PaymentMethodType;
  if (!PAYMENT_FIELDS[type]) return;
  const fields: Record<string, string> = {};
  for (const f of PAYMENT_FIELDS[type]) {
    fields[f.key] = String(formData.get(`field_${f.key}`) ?? "");
  }
  const composed = composeMethod(type, fields);
  if (!composed) return;
  await updateCreator(creator.id, (c) => {
    c.paymentMethods.push({
      id: uid("pm"),
      type,
      ...composed,
      enabled: true,
    });
  });
  revalidateAll();
}

export async function togglePaymentMethod(id: string) {
  const creator = await requireCreator();
  await updateCreator(creator.id, (c) => {
    const pm = c.paymentMethods.find((p) => p.id === id);
    if (pm) pm.enabled = !pm.enabled;
  });
  revalidateAll();
}

export async function deletePaymentMethod(id: string) {
  const creator = await requireCreator();
  await updateCreator(creator.id, (c) => {
    c.paymentMethods = c.paymentMethods.filter((p) => p.id !== id);
  });
  revalidateAll();
}

export type FeedbackState = { ok: boolean; error?: string; imageUrl?: string };

/** Public help/feedback form: queries need an email (we reply), reviews don't. */
export async function submitFeedback(
  _prev: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const kind = String(formData.get("kind")) === "query" ? "query" : "review";
  const email = clip(formData.get("email"), 120);
  const message = clip(formData.get("message"), 1000);

  if (message.length < 5) return { ok: false, error: "Tell us a little more." };
  if (kind === "query") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: "Add a valid email so we can reply to you." };
  }

  const ip = await clientIp();
  if (rateLimited(`fb:${ip}`, SUBMIT_WINDOW_MS, SUBMIT_LIMIT)) return { ok: false, error: "That's a lot of messages in a row — please try again in a little while." };

  // an attached screenshot goes to Blob; its URL rides along in the email.
  // nothing else is stored — the email (sent client-side via Web3Forms) is
  // the record; this action validates, rate-limits, and hosts the image
  const imageUrl = await saveImage(formData.get("screenshot"), "feedback");
  return { ok: true, imageUrl };
}

const PREFERENCE_KEYS = [
  "autoImport", "autoPublish", "allowProofUpload", "requireProof", "showLeaderboard", "protectUpi",
] as const;

export async function setPreference(
  key: (typeof PREFERENCE_KEYS)[number],
  value: boolean
) {
  // runtime allowlist — typed params are still client input
  if (!PREFERENCE_KEYS.includes(key) || typeof value !== "boolean") return;
  const creator = await requireCreator();
  await updateCreator(creator.id, (c) => {
    c.preferences[key] = value;
  });
  revalidateAll();
}
