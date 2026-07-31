"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { X, Check, Clock, Copy, ExternalLink, ImagePlus, ShieldAlert } from "lucide-react";
import { PaymentMethod, PublicCreator, PublicExpense } from "@/lib/types";
import {
  approxUsd, giftCodeWarning, minContribution, PAYMENT_META, upiDeepLink,
} from "@/lib/payments";
import { inr } from "@/lib/format";
import { precheckSubmit, submitReimbursement } from "@/app/actions";

export function ReimburseModal({
  expense,
  creator,
  remaining,
  blocked = false,
  limited = false,
  onClose,
}: {
  expense: PublicExpense;
  creator: PublicCreator;
  remaining: number;
  /** known-blocked sender: open straight on the notice, never show payment details */
  blocked?: boolean;
  /** sender at their unverified-claim capacity: same treatment, gentler notice */
  limited?: boolean;
  onClose: () => void;
}) {
  const methods = creator.paymentMethods.filter((m) => m.enabled);
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"amount" | "pay" | "done" | "denied">(
    blocked || limited ? "denied" : "amount"
  );
  const [denyReason, setDenyReason] = useState<
    "rate_limit" | "queue_full" | "too_many_pending" | "blocked" | "proof_required" | "invalid"
  >(blocked ? "blocked" : limited ? "too_many_pending" : "invalid");
  const [copied, setCopied] = useState(false);
  const [showUsd, setShowUsd] = useState(false);
  const [pending, startTransition] = useTransition();

  const minAmount = minContribution(remaining);
  const fullOnly = remaining <= 100;
  const belowMin = amount > 0 && amount < minAmount;
  // gift-card method saved without an email: the pasted claim code is the
  // only way the value reaches the creator, so it becomes required
  const giftCodeOnly = method?.type === "amazon_gc" && !method.details?.email;
  const missingCode = giftCodeOnly && !giftCode.trim();

  const needProof = creator.preferences.requireProof;
  // for gift cards the pasted code is proof in itself — either it or a screenshot
  // satisfies, but only when the code actually looks like one
  const giftWarning = method?.type === "amazon_gc" ? giftCodeWarning(giftCode) : null;
  const hasGiftCodeProof =
    method?.type === "amazon_gc" && giftCode.trim().length > 0 && !giftWarning;
  const missingProof = needProof && !proofFile && !hasGiftCodeProof;

  const upiLink = useMemo(
    () =>
      method?.type === "upi"
        ? upiDeepLink(method.value, creator.displayName, amount, `Cover ${expense.merchant}`)
        : null,
    [method, amount, creator.displayName, expense.merchant]
  );

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function pickProof(file: File | null) {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(file);
    setProofPreview(file ? URL.createObjectURL(file) : null);
  }

  function markPaid() {
    if (!method) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("expenseId", expense.id);
      fd.set("supporterName", name);
      fd.set("amount", String(amount));
      fd.set("methodType", method.type);
      fd.set("note", note);
      if (method.type === "amazon_gc") fd.set("giftCode", giftCode);
      if (creator.preferences.allowProofUpload) {
        fd.set("proofNote", proofNote);
        if (proofFile) fd.set("proofImage", proofFile);
      }
      const result = await submitReimbursement(fd);
      if (result.ok) {
        setStep("done");
      } else {
        setDenyReason(result.reason);
        setStep("denied");
      }
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-6">
      <div
        className="animate-scale-in w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h3 className="font-semibold text-zinc-900">Cover {expense.merchant}</h3>
            <p className="text-sm text-zinc-500">{inr(remaining)} remaining</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {step === "amount" && methods.length === 0 && (
          <div className="px-6 pb-8 pt-2 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
              <Clock size={28} className="text-zinc-500" />
            </div>
            <h4 className="font-semibold text-zinc-900">Check back soon</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {creator.displayName.split(" ")[0]}&apos;s payment options aren&apos;t available to
              you just yet. They may have added new ones since you opened this page — refresh to
              see the latest.
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Refresh page
              </button>
            </div>
          </div>
        )}

        {step === "amount" && methods.length > 0 && (
          <div className="px-6 pb-6 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700">Amount</label>
                <button
                  type="button"
                  onClick={() => setShowUsd((v) => !v)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    showUsd
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  $ USD
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">₹</span>
                  <input
                    type="number"
                    min={1}
                    max={remaining}
                    disabled={fullOnly}
                    value={amount || ""}
                    onChange={(e) => setAmount(Math.min(remaining, Number(e.target.value)))}
                    className="w-full rounded-xl border border-zinc-200 py-2.5 pl-8 pr-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
              </div>
              {showUsd && amount > 0 && (
                <p className="mt-1.5 text-xs font-medium text-emerald-700">
                  ≈ ${approxUsd(amount)} USD
                </p>
              )}
              {fullOnly ? (
                <p className="mt-2 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs text-zinc-500">
                  {`Small expense — it can only be covered in full (${inr(remaining)}).`}
                </p>
              ) : (
                <>
                  <div className="mt-2 flex gap-1.5">
                    {([
                      ["25%", minAmount],
                      ["50%", Math.max(minAmount, Math.round(remaining * 0.5))],
                      [`Full ${inr(remaining)}`, remaining],
                    ] as const).map(([label, value]) => (
                      <button
                        key={label}
                        onClick={() => setAmount(value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          amount === value
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {belowMin && (
                    <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200/70 px-3 py-2 text-xs font-medium text-amber-800">
                      {`You can cover a minimum of 25% — that's ${inr(minAmount)} here.`}
                    </p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">Pay with</label>
              <div className="mt-1.5 grid gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      method?.id === m.id
                        ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-xl">{PAYMENT_META[m.type].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900">{m.label}</div>
                      <div className="text-xs text-zinc-500 truncate">{m.value}</div>
                    </div>
                    {PAYMENT_META[m.type].international && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Intl</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                placeholder="Your name — shown to the creator"
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              <input
                placeholder="Message (optional) — e.g. Love your videos!"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>

            <button
              disabled={pending || !method || !amount || belowMin || !name.trim()}
              onClick={() =>
                // a last freshness check before payment details are revealed —
                // nobody should pay for a claim that can't be recorded
                startTransition(async () => {
                  const check = await precheckSubmit(expense.id);
                  if (check.ok) {
                    setStep("pay");
                  } else {
                    setDenyReason(check.reason);
                    setStep("denied");
                  }
                })
              }
              className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending
                ? "One moment…"
                : belowMin
                  ? `Minimum ${inr(minAmount)}`
                  : method && amount && !name.trim()
                    ? "Add your name to continue"
                    : !method && amount
                      ? "Pick a payment method"
                      : "Continue"}
            </button>
          </div>
        )}

        {step === "pay" && method && (
          <div className="px-6 pb-6 space-y-5">
            <div className="rounded-2xl bg-zinc-50 border border-zinc-200/70 p-5 text-center space-y-4">
              <div>
                <div className="text-2xl font-semibold text-zinc-900">{inr(amount)}</div>
                {showUsd && (
                  <div className="mt-0.5 text-sm font-medium text-zinc-500">
                    ≈ ${approxUsd(amount)} USD
                  </div>
                )}
              </div>

              {method.type === "upi" && upiLink && (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-2xl bg-white p-3 border border-zinc-200 shadow-sm">
                      <QRCodeSVG value={upiLink} size={160} />
                    </div>
                  </div>
                  <a
                    href={upiLink}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Open UPI app <ExternalLink size={14} />
                  </a>
                </>
              )}

              {(method.type === "paypal" || method.type === "throne") && (
                <a
                  href={(() => {
                    const base = method.value.startsWith("http") ? method.value : `https://${method.value}`;
                    return method.type === "paypal" && base.includes("paypal.me")
                      ? `${base}/${approxUsd(amount)}USD`
                      : base;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Open {method.type === "paypal" ? "PayPal" : "Throne wishlist"} <ExternalLink size={14} />
                </a>
              )}

              {(method.type === "wise" || method.type === "bank" ||
                (method.type === "amazon_gc" && !giftCodeOnly)) && (
                <button
                  onClick={() => copy(method.value)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors font-mono"
                >
                  {method.value.length > 28 ? `${method.value.slice(0, 28)}…` : method.value}
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              )}

              <p className="text-xs text-zinc-500 leading-relaxed">
                {giftCodeOnly
                  ? "Buy an Amazon.in eGift Card (amazon.in/gift-cards) with any international card, email it to yourself, then paste the claim code below."
                  : PAYMENT_META[method.type].instructions}
              </p>
            </div>

            {method.type === "amazon_gc" && (
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  {giftCodeOnly ? "Gift card code" : "Gift card code (optional)"}
                </label>
                <input
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                  placeholder="e.g. 6QXX-XXXXXX-XXXX"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
                {giftWarning ? (
                  <p className="mt-1.5 rounded-lg bg-red-50 border border-red-200/70 px-3 py-2 text-xs font-medium text-red-700">
                    {giftWarning}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-zinc-400">
                    {giftCodeOnly
                      ? `Paste the claim code from your gift card — it's all ${creator.displayName.split(" ")[0]} needs, and only they can see it.`
                      : `Bought a gift card code instead of emailing one? Paste it here — only ${creator.displayName.split(" ")[0]} can see it.`}
                  </p>
                )}
              </div>
            )}

            {creator.preferences.allowProofUpload && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    placeholder="Reference — e.g. UPI ref 4482 1039"
                    maxLength={120}
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    className="flex-1 min-w-0 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors whitespace-nowrap"
                  >
                    <ImagePlus size={15} />
                    {proofFile ? "Change" : "Screenshot"}
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => pickProof(e.target.files?.[0] ?? null)}
                  />
                </div>
                {proofPreview && (
                  <div className="relative w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofPreview}
                      alt="Payment proof preview"
                      className="h-24 rounded-xl border border-zinc-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => pickProof(null)}
                      className="absolute -top-2 -right-2 rounded-full bg-zinc-900 p-1 text-white hover:bg-zinc-700 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-zinc-400">
                  {needProof
                    ? method.type === "amazon_gc"
                      ? `Attach a screenshot — or paste the gift card code above, either works. ${creator.displayName.split(" ")[0]} confirms each contribution against it.`
                      : `Attach a screenshot of the payment — ${creator.displayName.split(" ")[0]} confirms each contribution against it.`
                    : `Optionally attach a screenshot of the payment — it helps ${creator.displayName.split(" ")[0]} verify faster.`}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep("amount")}
                className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={markPaid}
                disabled={pending || missingProof || missingCode || !!giftWarning}
                className="flex-[2] rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending
                  ? "Saving…"
                  : giftWarning
                    ? "Fix the gift card code"
                    : missingCode
                      ? "Paste the gift card code"
                      : missingProof
                        ? method.type === "amazon_gc"
                          ? "Attach proof — code or screenshot"
                          : "Attach proof to finish"
                        : "I've sent it ✓"}
              </button>
            </div>
            <p className="text-center text-xs text-zinc-400">
              The creator will verify your payment before it counts toward the progress bar.
            </p>
          </div>
        )}

        {step === "denied" && (
          <div className="px-6 pb-8 pt-2 text-center space-y-3">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                denyReason === "blocked" ? "bg-amber-50" : "bg-zinc-100"
              }`}
            >
              {denyReason === "blocked" ? (
                <ShieldAlert size={28} className="text-amber-600" />
              ) : (
                <Clock size={28} className="text-zinc-500" />
              )}
            </div>
            <h4 className="font-semibold text-zinc-900">
              {denyReason === "rate_limit" && "Let's take a breather"}
              {denyReason === "queue_full" && "This one's being reviewed"}
              {denyReason === "too_many_pending" && "Almost there"}
              {denyReason === "blocked" && "You've been blocked"}
              {denyReason === "proof_required" && "One more thing"}
              {denyReason === "invalid" && "Couldn't record that"}
            </h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {denyReason === "rate_limit" &&
                "That was a few submissions in a row, so we've paused new ones for a little while. Nothing extra was recorded — please try again later."}
              {denyReason === "too_many_pending" &&
                `Your earlier support is still waiting for ${creator.displayName.split(" ")[0]}'s verification. Once it's confirmed, you can send more — thanks for your patience. If they've just confirmed it, refresh this page to see the update.`}
              {denyReason === "queue_full" &&
                "This expense has several payments awaiting the creator's review. Check back a little later."}
              {denyReason === "proof_required" &&
                `${creator.displayName.split(" ")[0]} asks for a payment screenshot with every contribution. Attach one and try again — nothing was recorded yet.`}
              {denyReason === "blocked" &&
                "You've been blocked on this page because earlier payment claims from you couldn't be verified or looked like spam. You can no longer contribute here — anything you submit will not be recorded."}
              {denyReason === "invalid" &&
                "This contribution couldn't be recorded — the expense may have changed. Refresh the page and try again."}
            </p>
            <button
              onClick={denyReason === "too_many_pending" ? () => window.location.reload() : onClose}
              className="mt-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              {denyReason === "too_many_pending" ? "Refresh" : "Close"}
            </button>
            <p className="text-xs text-zinc-400">
              Need a hand?{" "}
              <Link href="/help" className="font-medium text-indigo-500 hover:text-indigo-700">
                Help &amp; support
              </Link>
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="px-6 pb-8 pt-2 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <Check size={28} className="text-emerald-600" />
            </div>
            <h4 className="font-semibold text-zinc-900">Thank you{name ? `, ${name}` : ""}! 💛</h4>
            <p className="text-sm text-zinc-500">
              Your {inr(amount)} contribution was recorded and is awaiting verification by {creator.displayName}.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
      </div>
    </div>,
    document.body
  );
}
