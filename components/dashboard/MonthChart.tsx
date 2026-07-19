"use client";

import { useState } from "react";
import { inr } from "@/lib/format";

export interface MonthPoint {
  label: string;
  spent: number;
  reimbursed: number;
}

/** Six-month bars: rise on load, tap/click a month to see its numbers. */
export function MonthChart({ months }: { months: MonthPoint[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(...months.map((m) => Math.max(m.spent, m.reimbursed)), 1);
  const sel = selected !== null ? months[selected] : null;

  return (
    <div>
      <div className="mt-6 flex items-end justify-between gap-2 sm:gap-4 h-36">
        {months.map((m, i) => {
          const active = selected === i;
          return (
            <button
              key={m.label}
              type="button"
              onClick={() => setSelected(active ? null : i)}
              className={`group flex flex-1 flex-col items-center gap-2 h-full rounded-xl pt-1 transition-colors duration-150 ${
                active ? "bg-indigo-50/70" : "hover:bg-zinc-50"
              }`}
            >
              <div className="flex flex-1 items-end gap-1 w-full justify-center">
                <div
                  className={`chart-bar w-3 sm:w-5 rounded-t-md transition-colors duration-150 ${
                    active ? "bg-zinc-400" : "bg-zinc-200 group-hover:bg-zinc-300"
                  }`}
                  style={{
                    height: `${Math.max(4, (m.spent / max) * 100)}%`,
                    animationDelay: `${i * 70}ms`,
                  }}
                />
                <div
                  className={`chart-bar w-3 sm:w-5 rounded-t-md transition-colors duration-150 ${
                    active ? "bg-indigo-600" : "bg-indigo-500 group-hover:bg-indigo-600"
                  }`}
                  style={{
                    height: `${Math.max(4, (m.reimbursed / max) * 100)}%`,
                    animationDelay: `${i * 70 + 35}ms`,
                  }}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-indigo-700" : "text-zinc-400"
                }`}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 h-8">
        {sel ? (
          <p className="animate-fade-up flex items-center justify-center gap-4 rounded-xl bg-zinc-50 border border-zinc-200/70 py-1.5 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-900">{sel.label}</span>
            <span>
              Spent <span className="font-semibold text-zinc-900">{inr(sel.spent)}</span>
            </span>
            <span>
              Covered <span className="font-semibold text-indigo-600">{inr(sel.reimbursed)}</span>
            </span>
          </p>
        ) : (
          <p className="py-1.5 text-center text-[11px] text-zinc-300">
            Tap a month for details
          </p>
        )}
      </div>
    </div>
  );
}
