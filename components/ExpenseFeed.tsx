"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PublicCreator, PublicExpense, PublicSupport } from "@/lib/types";
import { PublicExpenseCard } from "./PublicExpenseCard";
import { Reveal } from "./Reveal";

const PAGE_SIZE = 8;

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== today.getFullYear() && { year: "numeric" }),
  });
}

export function ExpenseFeed({
  expenses,
  creator,
  reimbursements,
  visitorBlocked,
  visitorLimited,
}: {
  expenses: PublicExpense[];
  creator: PublicCreator;
  reimbursements: PublicSupport[];
  visitorBlocked: boolean;
  visitorLimited: boolean;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = expenses.slice(0, limit);

  const groups: { label: string; items: PublicExpense[] }[] = [];
  for (const e of visible) {
    const label = dayLabel(e.date);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }
  const remaining = expenses.length - limit;

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.label}>
          <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {g.label}
            <span className="h-px flex-1 bg-zinc-200/70" />
          </h2>
          <div className="mt-3 space-y-4">
            {g.items.map((expense, i) => (
              <Reveal key={expense.id} delay={Math.min(i, 3) * 70}>
                <PublicExpenseCard
                  expense={expense}
                  creator={creator}
                  reimbursements={reimbursements.filter((r) => r.expenseId === expense.id)}
                  visitorBlocked={visitorBlocked}
                  visitorLimited={visitorLimited}
                />
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      {remaining > 0 && (
        <button
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-3.5 text-sm font-medium text-zinc-600 shadow-sm transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <ChevronDown size={15} />
          Show more · {remaining} older {remaining === 1 ? "expense" : "expenses"}
        </button>
      )}
    </div>
  );
}
