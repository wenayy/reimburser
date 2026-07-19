"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Clock, ExternalLink, X } from "lucide-react";
import { PublicCreator, PublicExpense, PublicSupport } from "@/lib/types";
import { inr, timeAgo } from "@/lib/format";
import { MerchantLogo } from "./MerchantLogo";
import { Card, ProgressBar, StatusPill } from "./ui";
import { ReimburseModal } from "./ReimburseModal";
import { approxUsd, MAX_PENDING_PER_EXPENSE } from "@/lib/payments";

export function PublicExpenseCard({
  expense,
  creator,
  reimbursements,
  visitorBlocked,
  visitorLimited,
}: {
  expense: PublicExpense;
  creator: PublicCreator;
  reimbursements: PublicSupport[];
  visitorBlocked: boolean;
  visitorLimited: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const verified = reimbursements.filter((r) => r.status === "verified");
  const reimbursed = verified.reduce((s, r) => s + r.amount, 0);
  // supporters can keep covering a finished expense — track full covers ("2×")
  // and progress within the current round
  const timesCovered = expense.amount > 0 ? Math.floor(reimbursed / expense.amount) : 0;
  const cycle = reimbursed % expense.amount;
  const fullyCovered = timesCovered >= 1;
  const remaining = expense.amount - cycle;
  const supporters = [...new Set(verified.map((r) => r.supporterName))];
  const queueFull =
    reimbursements.filter((r) => r.status === "pending").length >= MAX_PENDING_PER_EXPENSE;
  const description = expense.customDescription ?? expense.aiDescription;

  return (
    <>
      <Card className="p-5 sm:p-6 transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_16px_40px_-16px_rgba(0,0,0,0.16)] hover:-translate-y-1">
        <div>
          <div className="flex items-start gap-4">
            <MerchantLogo domain={expense.merchantDomain} category={expense.category} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-zinc-900 truncate">{expense.merchant}</h3>
                <span className="text-right whitespace-nowrap">
                  <span className="text-lg font-semibold text-zinc-900 tabular-nums">
                    {inr(expense.amount)}
                  </span>
                  <span className="ml-1.5 text-xs font-medium text-zinc-400 tabular-nums">
                    ≈ ${approxUsd(expense.amount)}
                  </span>
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                <Clock size={12} />
                {timeAgo(expense.date)}
                <span className="text-zinc-300">·</span>
                {expense.category}
                {expense.source === "auto" && (
                  <span
                    title="Captured automatically from a real transaction"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                  >
                    ✓ Real spend
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{description}</p>

          {expense.link && (
            <a
              href={expense.link}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <ExternalLink size={12} />
              View item
              {(() => {
                try {
                  return ` · ${new URL(expense.link).hostname.replace(/^www\./, "")}`;
                } catch {
                  return "";
                }
              })()}
            </a>
          )}

          {expense.image && (
            <button
              type="button"
              onClick={() => setShowImage(true)}
              title="Tap to view full image"
              className="mt-3 block w-fit max-w-full overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50 cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expense.image}
                alt={`${expense.merchant} — attached photo`}
                loading="lazy"
                className="h-28 w-auto max-w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
              />
            </button>
          )}

          <div className="mt-4 space-y-2">
            <ProgressBar
              value={fullyCovered && cycle === 0 ? expense.amount : cycle}
              total={expense.amount}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                <span className="font-medium text-zinc-700">{inr(reimbursed)}</span> covered
                {timesCovered > 1 && <span className="text-emerald-600 font-medium"> · {timesCovered}× full</span>}
              </span>
              <span className="text-zinc-500">
                {!fullyCovered ? (
                  <>
                    <span className="font-medium text-zinc-700">{inr(remaining)}</span> remaining
                  </>
                ) : cycle === 0 ? (
                  "Complete 🎉"
                ) : (
                  <>
                    <span className="font-medium text-zinc-700">{inr(remaining)}</span> to {timesCovered + 1}× 🎉
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 gap-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusPill reimbursed={reimbursed} total={expense.amount} />
              {supporters.length > 0 && (
                <span className="hidden sm:block text-xs text-zinc-400 truncate">
                  {supporters.slice(0, 3).join(", ")}
                  {supporters.length > 3 ? ` +${supporters.length - 3} more` : ""}
                </span>
              )}
            </div>
            {queueFull ? (
              <button
                disabled
                title="Contributions to this expense are briefly paused — check back soon."
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-400 whitespace-nowrap cursor-not-allowed"
              >
                Back soon
              </button>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-[transform,background-color] duration-150 ease-out hover:scale-[1.04] active:scale-[0.97] whitespace-nowrap ${
                  fullyCovered
                    ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                {fullyCovered ? "Cover again" : "Cover this"}
              </button>
            )}
          </div>
        </div>
      </Card>

      {showImage && expense.image &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/85 backdrop-blur-sm p-4 cursor-zoom-out"
            onClick={() => setShowImage(false)}
          >
            <button
              onClick={() => setShowImage(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Close image"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expense.image}
              alt={`${expense.merchant} — full image`}
              className="animate-scale-in max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>,
          document.body
        )}

      {open && (
        <ReimburseModal
          expense={expense}
          creator={creator}
          remaining={remaining}
          blocked={visitorBlocked}
          limited={visitorLimited}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
