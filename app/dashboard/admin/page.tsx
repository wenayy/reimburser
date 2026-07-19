import { notFound } from "next/navigation";
import { listCreators } from "@/lib/store";
import { requireOnboarded } from "@/lib/auth";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

/** Private growth stats at /dashboard/admin — only emails in ADMIN_EMAILS see
 *  it; everyone else gets a 404, so the URL reveals nothing. */
export default async function AdminStats() {
  const me = await requireOnboarded();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!admins.includes(me.email.toLowerCase())) notFound();

  const creators = await listCreators();
  const now = Date.now();
  const day = 86_400_000;
  const signedUpSince = (ms: number) =>
    creators.filter((c) => c.createdAt && now - Date.parse(c.createdAt) < ms).length;

  const stats = [
    { label: "Total creators", value: creators.length },
    { label: "Onboarded", value: creators.filter((c) => c.onboarded).length },
    { label: "Last 24 hours", value: signedUpSince(day) },
    { label: "Last 7 days", value: signedUpSince(7 * day) },
    { label: "Last 30 days", value: signedUpSince(30 * day) },
  ];

  // signups per day, newest first, last 14 days
  const perDay = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now - i * day);
    perDay.set(d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), 0);
  }
  for (const c of creators) {
    if (!c.createdAt) continue;
    const key = new Date(c.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Admin — growth</h1>
        <p className="mt-1 text-sm text-zinc-500">Only you can see this page.</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs font-medium text-zinc-400">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Signups — last 14 days</h2>
        <div className="mt-3 divide-y divide-zinc-100">
          {[...perDay.entries()].map(([label, n]) => (
            <div key={label} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className={`font-semibold tabular-nums ${n > 0 ? "text-zinc-900" : "text-zinc-300"}`}>
                {n}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-900">All creators</h2>
        <div className="mt-3 divide-y divide-zinc-100">
          {creators.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
              <span className="font-medium text-zinc-900">{c.displayName || "—"}</span>
              <span className="text-zinc-400">@{c.username}</span>
              <span className="text-zinc-500">{c.email}</span>
              <span className="ml-auto text-xs text-zinc-400">
                {c.createdAt
                  ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "unknown"}
                {!c.onboarded && " · not onboarded"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
