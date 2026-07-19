"use client";

import { useState } from "react";
import { Receipt, Trophy } from "lucide-react";
import { PublicCreator, PublicExpense, PublicSupport } from "@/lib/types";
import { ExpenseFeed } from "./ExpenseFeed";
import { Leaderboard, LeaderboardEntry } from "./Leaderboard";

export function PublicPageTabs({
  expenses,
  creator,
  reimbursements,
  entries,
  showLeaderboard,
  visitorBlocked,
  visitorLimited,
}: {
  expenses: PublicExpense[];
  creator: PublicCreator;
  reimbursements: PublicSupport[];
  entries: LeaderboardEntry[];
  showLeaderboard: boolean;
  visitorBlocked: boolean;
  visitorLimited: boolean;
}) {
  const [tab, setTab] = useState<"expenses" | "supporters">("expenses");

  const feed =
    expenses.length === 0 ? (
      <p className="py-16 text-center text-sm text-zinc-400">No public expenses yet.</p>
    ) : (
      <ExpenseFeed
        expenses={expenses}
        creator={creator}
        reimbursements={reimbursements}
        visitorBlocked={visitorBlocked}
        visitorLimited={visitorLimited}
      />
    );

  if (!showLeaderboard) return feed;

  return (
    <div>
      <div className="flex justify-center">
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
          <button
            onClick={() => setTab("expenses")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
              tab === "expenses" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Receipt size={14} /> Expenses
          </button>
          <button
            onClick={() => setTab("supporters")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
              tab === "supporters" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Trophy size={14} className={tab === "supporters" ? "text-amber-500" : ""} /> Top supporters
          </button>
        </div>
      </div>

      <div className="mt-6">
        {tab === "expenses" ? feed : <Leaderboard entries={entries} />}
      </div>
    </div>
  );
}
