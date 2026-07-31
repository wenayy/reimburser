"use client";

import { useState, useTransition } from "react";
import { useSwipeTabs } from "@/lib/use-swipe-tabs";
import { Check, X, MessageSquare, FileCheck, Gift, Copy, Eye, Ban, Search } from "lucide-react";
import { Expense, Reimbursement } from "@/lib/types";
import { inr, timeAgo } from "@/lib/format";
import { Card, StatusBadge } from "@/components/ui";
import { PAYMENT_META } from "@/lib/payments";
import { rejectAndBlock, setReimbursementStatus } from "@/app/actions";

type RTab = "all" | "pending" | "verified" | "rejected";

export function ReimbursementList({
  reimbursements,
  expenses,
}: {
  reimbursements: Reimbursement[];
  expenses: Expense[];
}) {
  const counts = {
    all: reimbursements.length,
    pending: reimbursements.filter((r) => r.status === "pending").length,
    verified: reimbursements.filter((r) => r.status === "verified").length,
    rejected: reimbursements.filter((r) => r.status === "rejected").length,
  };
  const [tab, setTab] = useState<RTab>(counts.pending > 0 ? "pending" : "all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = (tab === "all" ? reimbursements : reimbursements.filter((r) => r.status === tab))
    .filter((r) => {
      if (!q) return true;
      const merchant = expenses.find((e) => e.id === r.expenseId)?.merchant ?? "";
      return (
        r.supporterName.toLowerCase().includes(q) || merchant.toLowerCase().includes(q)
      );
    });

  const TABS: { id: RTab; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "verified", label: "Verified" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All" },
  ];

  const swipe = useSwipeTabs(
    TABS.map((t) => t.id),
    tab,
    setTab
  );

  return (
    <div className="space-y-6 animate-fade-up touch-pan-y" {...swipe}>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Support received</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {counts.pending > 0
            ? `${counts.pending} awaiting verification — confirm you actually received the money. Spam? “Block sender” clears all their claims at once and stops future ones.`
            : "All contributions verified."}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 w-fit max-w-full overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                tab === t.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    t.id === "pending" && counts.pending > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-zinc-200/70 text-zinc-500"
                  }`}
                >
                  {counts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name to find a supporter's request"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-8 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div key={tab} className="space-y-3 animate-fade-up">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-zinc-400">
            {q
              ? `No ${tab === "all" ? "" : `${tab} `}contributions matching “${query.trim()}”.`
              : counts.all === 0
                ? "No support yet. Share your page to get started."
                : `No ${tab === "all" ? "" : tab} contributions here.`}
          </Card>
        )}
        {filtered.map((r) => (
          <Row key={r.id} r={r} expense={expenses.find((e) => e.id === r.expenseId)} />
        ))}
      </div>

      {(tab === "rejected" || tab === "all") && counts.rejected > 0 && (
        <p className="text-center text-xs text-zinc-400">
          Rejected entries are tidied away automatically after a little while. Verified ones are
          kept — they back your progress bars and leaderboard.
        </p>
      )}
    </div>
  );
}

/** Uploaded by strangers — stays blurred until the creator chooses to look. */
function ProofImage({ src }: { src: string }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Payment proof"
          className="h-20 rounded-lg border border-zinc-200 object-cover transition-transform hover:scale-[1.03]"
        />
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="relative mt-2 block overflow-hidden rounded-lg border border-zinc-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-20 blur-xl scale-110 object-cover" />
      <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-zinc-900/30 text-[11px] font-medium text-white">
        <Eye size={12} /> Click to view proof
      </span>
    </button>
  );
}

function GiftCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/70 px-2.5 py-1.5">
      <Gift size={13} className="text-amber-600" />
      <code className="text-xs font-medium text-amber-900">{code}</code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-amber-500 hover:text-amber-800 transition-colors"
        title="Copy gift card code"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function Row({ r, expense }: { r: Reimbursement; expense?: Expense }) {
  const [pending, startTransition] = useTransition();
  const [confirmBlock, setConfirmBlock] = useState(false);

  return (
    <Card className={`p-4 sm:p-5 ${pending ? "opacity-50" : ""} ${r.status === "pending" ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex flex-1 items-start gap-3 sm:gap-4 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-lg shrink-0">
          {PAYMENT_META[r.methodType]?.emoji ?? "💳"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-zinc-900">{r.supporterName}</span>
            <span className="text-sm text-zinc-400">
              → {expense?.merchant ?? "deleted expense"} · via {PAYMENT_META[r.methodType]?.label ?? r.methodType}
            </span>
            <StatusBadge status={r.status} />
            {r.autoExpired && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                auto-expired
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">{timeAgo(r.createdAt)}</div>
          {r.note && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-zinc-600">
              <MessageSquare size={13} className="mt-0.5 shrink-0 text-zinc-300" /> “{r.note}”
            </p>
          )}
          {r.status !== "rejected" && (
            <>
              {r.giftCode && <GiftCode code={r.giftCode} />}
              {r.proofNote && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-zinc-500">
                  <FileCheck size={13} className="mt-0.5 shrink-0 text-emerald-500" /> Proof: {r.proofNote}
                </p>
              )}
              {r.proofImage && <ProofImage src={r.proofImage} />}
            </>
          )}
        </div>
        </div>
        <div className="flex flex-row-reverse flex-wrap sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <span className="text-base font-semibold tabular-nums text-zinc-900">{inr(r.amount)}</span>
          {r.status === "pending" && (
            <div className="flex gap-1.5">
              <button
                onClick={() => startTransition(() => setReimbursementStatus(r.id, "verified"))}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <Check size={12} /> Verify
              </button>
              <button
                onClick={() => startTransition(() => setReimbursementStatus(r.id, "rejected"))}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <X size={12} /> Reject
              </button>
              {r.ipHash && (
                <button
                  onClick={() => setConfirmBlock(true)}
                  title="Rejects all pending claims from this sender and blocks them from submitting again"
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Ban size={12} /> Block sender
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmBlock && (
        <div className="animate-scale-in mt-3 rounded-xl border border-red-200 bg-red-50/60 p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-xs leading-relaxed text-red-800">
            Block <span className="font-semibold">{r.supporterName}</span>? They will no longer
            be able to contribute to any of your expenses, and all their pending claims will be
            rejected. You can unblock them later in Settings.
          </p>
          <div className="mt-2.5 sm:mt-0 flex gap-1.5 shrink-0">
            <button
              onClick={() => setConfirmBlock(false)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmBlock(false);
                startTransition(() => rejectAndBlock(r.id));
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              <Ban size={12} /> Yes, block them
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
