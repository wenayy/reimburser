"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { inr } from "@/lib/format";

export interface LeaderboardEntry {
  name: string;
  amount: number;
  createdAt: string;
}

type Period = "week" | "month" | "all";
const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
  { id: "all", label: "All time", days: Infinity },
];

const MEDALS = [
  { emoji: "🥇", ring: "ring-amber-200 bg-amber-50" },
  { emoji: "🥈", ring: "ring-zinc-200 bg-zinc-50" },
  { emoji: "🥉", ring: "ring-orange-200 bg-orange-50" },
];

function topFor(entries: LeaderboardEntry[], days: number) {
  const cutoff = Date.now() - days * 86_400_000;
  const totals = new Map<string, { total: number; count: number }>();
  for (const e of entries) {
    if (days !== Infinity && new Date(e.createdAt).getTime() < cutoff) continue;
    const cur = totals.get(e.name) ?? { total: 0, count: 0 };
    totals.set(e.name, { total: cur.total + e.amount, count: cur.count + 1 });
  }
  return [...totals.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 3);
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  // anonymous contributions still count toward progress — just not toward glory
  const named = useMemo(() => entries.filter((e) => e.name !== "Anonymous"), [entries]);
  const [period, setPeriod] = useState<Period>(() => {
    for (const p of PERIODS) if (topFor(named, p.days).length > 0) return p.id;
    return "all";
  });

  const top = topFor(named, PERIODS.find((p) => p.id === period)!.days);

  return (
    <div className="animate-fade-up rounded-2xl bg-white border border-zinc-200/70 shadow-sm p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 whitespace-nowrap">
          <Trophy size={15} className="text-amber-500" /> Top supporters
        </h2>
        <div className="flex gap-0.5 rounded-lg bg-zinc-100 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                period === p.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {top.length === 0 ? (
        <p className="mt-5 rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm leading-relaxed text-zinc-400">
          No supporters {period === "all" ? "yet" : `this ${period}`}.
          <br />
          Cover an expense with your name to claim 🥇
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-zinc-100">
          {top.map(([name, s], i) => (
            <li
              key={name}
              className={`flex items-center gap-4 px-3 py-3 first:rounded-xl ${
                i === 0 ? "bg-amber-50/60 rounded-xl border border-amber-100" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 text-lg ${MEDALS[i].ring}`}
              >
                {MEDALS[i].emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-[15px] font-semibold text-zinc-900">{name}</div>
                <div className="text-xs text-zinc-400">
                  {s.count} {s.count === 1 ? "cover" : "covers"}
                </div>
              </div>
              <span className="text-base font-semibold tabular-nums text-zinc-900">{inr(s.total)}</span>
            </li>
          ))}
        </ol>
      )}

    </div>
  );
}
