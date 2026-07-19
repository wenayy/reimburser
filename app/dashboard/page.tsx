import Link from "next/link";
import { listExpenses, listReimbursements } from "@/lib/store";
import { requireOnboarded } from "@/lib/auth";
import { inr, timeAgo } from "@/lib/format";
import { Card, StatusBadge } from "@/components/ui";
import { MonthChart } from "@/components/dashboard/MonthChart";
import { HelpCard } from "@/components/dashboard/HelpCard";
import { PAYMENT_META } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const creator = await requireOnboarded();
  const [expenses, reimbursements] = await Promise.all([
    listExpenses(creator.id),
    listReimbursements(creator.id),
  ]);
  const verified = reimbursements.filter((r) => r.status === "verified");

  const today = new Date().toDateString();
  const todaysTotal = expenses
    .filter((e) => new Date(e.date).toDateString() === today)
    .reduce((s, e) => s + e.amount, 0);
  const publicExpenses = expenses.filter((e) => e.status === "published");
  const totalExpenses = publicExpenses.reduce((s, e) => s + e.amount, 0);
  const totalReimbursed = verified
    .filter((r) => publicExpenses.some((e) => e.id === r.expenseId))
    .reduce((s, r) => s + r.amount, 0);
  const remaining = Math.max(0, totalExpenses - totalReimbursed);
  const supporterCount = new Set(verified.map((r) => r.supporterName)).size;

  // Most reimbursed merchant
  const byMerchant = new Map<string, number>();
  for (const r of verified) {
    const e = expenses.find((x) => x.id === r.expenseId);
    if (e) byMerchant.set(e.merchant, (byMerchant.get(e.merchant) ?? 0) + r.amount);
  }
  const topMerchant = [...byMerchant.entries()].sort((a, b) => b[1] - a[1])[0];

  // Last 6 months chart data
  const months: { label: string; spent: number; reimbursed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const spent = expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return `${ed.getFullYear()}-${ed.getMonth()}` === key;
      })
      .reduce((s, e) => s + e.amount, 0);
    const reimbursed = verified
      .filter((r) => {
        const rd = new Date(r.createdAt);
        return `${rd.getFullYear()}-${rd.getMonth()}` === key;
      })
      .reduce((s, r) => s + r.amount, 0);
    months.push({ label, spent, reimbursed });
  }

  const recent = reimbursements.slice(0, 6);

  const stats = [
    { label: "Today's expenses", value: inr(todaysTotal) },
    { label: "Total shared", value: inr(totalExpenses) },
    { label: "Total covered", value: inr(totalReimbursed), accent: "text-emerald-600" },
    { label: "Remaining", value: inr(remaining) },
    { label: "Supporters", value: String(supporterCount) },
    {
      label: "Top merchant",
      value: topMerchant ? topMerchant[0] : "—",
      sub: topMerchant ? inr(topMerchant[1]) : undefined,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">How your shared expenses are doing.</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 sm:p-5">
            <div className="text-xs font-medium text-zinc-400">{s.label}</div>
            <div className={`mt-1 text-xl sm:text-2xl font-semibold tabular-nums ${s.accent ?? "text-zinc-900"} truncate`}>
              {s.value}
            </div>
            {s.sub && <div className="text-xs text-zinc-400">{s.sub}</div>}
          </Card>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Last 6 months</h2>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-300" /> Spent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Covered
            </span>
          </div>
        </div>
        <MonthChart months={months} />
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Recent support</h2>
          <Link href="/dashboard/support" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
            View all →
          </Link>
        </div>
        <div className="mt-4 divide-y divide-zinc-100">
          {recent.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-400">No support received yet.</p>
          )}
          {recent.map((r) => {
            const e = expenses.find((x) => x.id === r.expenseId);
            return (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm">
                  {PAYMENT_META[r.methodType].emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-900 truncate">
                    <span className="font-medium">{r.supporterName}</span>
                    <span className="text-zinc-400"> · {e?.merchant ?? "deleted expense"}</span>
                  </div>
                  <div className="text-xs text-zinc-400">{timeAgo(r.createdAt)}</div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-zinc-900">{inr(r.amount)}</span>
                <StatusBadge status={r.status} />
              </div>
            );
          })}
        </div>
      </Card>

      <HelpCard />
    </div>
  );
}
