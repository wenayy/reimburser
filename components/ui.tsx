import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const color = pct >= 100 ? "bg-emerald-500" : "bg-indigo-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
      <div className={`progress-fill h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatusPill({ reimbursed, total }: { reimbursed: number; total: number }) {
  const times = total > 0 ? Math.floor(reimbursed / total) : 0;
  if (times >= 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        ● Fully covered{times > 1 ? ` ${times}×` : ""}
      </span>
    );
  if (reimbursed > 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
        ● Partially covered
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
      ○ Not started
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-amber-50 text-amber-700",
    published: "bg-emerald-50 text-emerald-700",
    hidden: "bg-zinc-100 text-zinc-500",
    pending: "bg-amber-50 text-amber-700",
    verified: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-zinc-100 text-zinc-500"}`}>
      {status}
    </span>
  );
}
