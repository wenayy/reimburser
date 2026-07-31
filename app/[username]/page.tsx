import { notFound } from "next/navigation";
import Link from "next/link";
import {
  countVerifiedFromSender, getCreatorByUsername, listPublishedExpenses, listReimbursements,
} from "@/lib/store";
import { clientIp, hashIp } from "@/lib/request";
import { inr } from "@/lib/format";
import { PublicCreator, PublicExpense, PublicSupport } from "@/lib/types";
import { PublicPageTabs } from "@/components/PublicPageTabs";
import { SharePageButton } from "@/components/SharePageButton";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import {
  AUTO_PUBLIC_TTL_DAYS, COVERED_PUBLIC_TTL_DAYS, PAYMENT_META, pendingAllowance,
  UPI_TRUST_THRESHOLD,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function PublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const [expenses, allReimbursements] = await Promise.all([
    listPublishedExpenses(creator.id),
    listReimbursements(creator.id),
  ]);

  const publishedIds = new Set(expenses.map((e) => e.id));
  const reimbursements = allReimbursements.filter((r) => publishedIds.has(r.expenseId));
  const verified = reimbursements.filter((r) => r.status === "verified");
  const totalReimbursed = verified.reduce((s, r) => s + r.amount, 0);
  const supporterCount = new Set(verified.map((r) => r.supporterName)).size;

  const showLeaderboard =
    creator.preferences.showLeaderboard &&
    verified.some((r) => r.supporterName !== "Anonymous");

  const ipHash = hashIp(await clientIp());
  // a blocked or at-capacity sender learns it on the first click — before
  // seeing payment details or sending money (submitReimbursement and
  // precheckSubmit enforce both regardless)
  const visitorBlocked = creator.blockedIps?.includes(ipHash) ?? false;
  const myPending = allReimbursements.filter(
    (r) => r.ipHash === ipHash && r.status === "pending"
  ).length;
  const myVerified = allReimbursements.filter(
    (r) => r.ipHash === ipHash && r.status === "verified"
  ).length;
  const visitorLimited = myPending >= pendingAllowance(myVerified);

  // UPI is only shown to proven supporters (UPI_TRUST_THRESHOLD verified
  // payments with this creator) — no exceptions, even when UPI is the only
  // method (the dashboard warns the creator). submitReimbursement enforces
  // the same rule.
  // filter to methods we still offer (drops any legacy/removed types)
  let enabledMethods = creator.paymentMethods.filter((m) => m.enabled && m.type in PAYMENT_META);
  const protectUpi = creator.preferences.protectUpi ?? true;
  if (protectUpi) {
    const verifiedCount = await countVerifiedFromSender(creator.id, ipHash);
    if (verifiedCount < UPI_TRUST_THRESHOLD)
      enabledMethods = enabledMethods.filter((m) => m.type !== "upi");
  }

  // Keep the public page a fresh, uncluttered daily log — the dashboard always
  // keeps everything; only public visibility expires:
  //   • fully covered expenses retire a few quiet days after their last support
  //   • auto-captured routine spends retire a couple of days after the spend
  //     (unless support is still active on them)
  //   • manually-added expenses stay until the creator hides them
  const coveredStaleMs = COVERED_PUBLIC_TTL_DAYS * 86_400_000;
  const autoStaleMs = AUTO_PUBLIC_TTL_DAYS * 86_400_000;
  const displayExpenses = expenses.filter((e) => {
    if (e.amount <= 0) return true;
    const support = reimbursements.filter((r) => r.expenseId === e.id && r.status !== "rejected");
    const coveredTotal = support
      .filter((r) => r.status === "verified")
      .reduce((s, r) => s + r.amount, 0);
    const lastActivity = Math.max(
      Date.parse(e.date),
      ...support.map((r) => Date.parse(r.resolvedAt ?? r.createdAt))
    );
    if (coveredTotal >= e.amount) return Date.now() - lastActivity < coveredStaleMs;
    if (e.source === "auto") return Date.now() - lastActivity < autoStaleMs;
    return true;
  });

  // strip everything client components don't render — these props end up in
  // the page payload, readable by anyone (see the PublicX types)
  const publicCreator: PublicCreator = {
    displayName: creator.displayName,
    paymentMethods: enabledMethods,
    preferences: {
      allowProofUpload: creator.preferences.allowProofUpload,
      requireProof:
        creator.preferences.allowProofUpload && (creator.preferences.requireProof ?? true),
    },
  };
  const publicExpenses: PublicExpense[] = displayExpenses.map((e) => ({
    id: e.id,
    merchant: e.merchant,
    merchantDomain: e.merchantDomain,
    category: e.category,
    amount: e.amount,
    date: e.date,
    aiDescription: e.aiDescription,
    customDescription: e.customDescription,
    image: e.image,
    link: e.link,
    source: e.source,
  }));
  const publicSupport: PublicSupport[] = reimbursements.map((r) => ({
    id: r.id,
    expenseId: r.expenseId,
    supporterName: r.supporterName,
    amount: r.amount,
    status: r.status,
    createdAt: r.createdAt,
  }));

  return (
    <div className="min-h-screen">
      {/* way back home for visitors — and a quiet invitation to join */}
      <nav className="mx-auto flex max-w-xl items-center justify-between px-4 pt-5">
        <Logo size={26} wordmarkClass="text-sm" />
        <div className="flex items-center gap-2">
          <SharePageButton displayName={creator.displayName} />
          <Link
            href="/signup"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
          >
            Claim your page →
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-xl px-4 pb-10 pt-8 sm:pb-16 sm:pt-12">
        {/* Header */}
        <header className="text-center animate-fade-up">
          <div className="flex justify-center">
            <Avatar emoji={creator.avatarEmoji} image={creator.avatarImage} size={80} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            {creator.displayName}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-zinc-600">
            {creator.bio}
          </p>

          <div className="mt-5 flex items-center justify-center gap-6 text-sm">
            <div>
              <div className="font-semibold text-zinc-900">{inr(totalReimbursed)}</div>
              <div className="text-xs text-zinc-400">covered</div>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <div className="font-semibold text-zinc-900">{supporterCount}</div>
              <div className="text-xs text-zinc-400">supporters</div>
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <div className="font-semibold text-zinc-900">{expenses.length}</div>
              <div className="text-xs text-zinc-400">expenses</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {enabledMethods.map((m) => (
              <span
                key={m.id}
                className="rounded-full bg-white border border-zinc-200/70 px-2.5 py-1 text-xs text-zinc-500"
              >
                {PAYMENT_META[m.type].emoji} {m.label}
              </span>
            ))}
          </div>
        </header>

        {/* How it works */}
        <div className="animate-fade-up mt-8 rounded-2xl bg-indigo-50/60 border border-indigo-100 px-5 py-4 text-center">
          <p className="text-sm leading-relaxed text-indigo-900/80">
            These are {creator.displayName.split(" ")[0]}&apos;s real daily expenses, shared
            transparently. If their work helps you, pick any expense and cover part or all of it —
            payments go <strong>directly to them</strong>, this page never touches your money.
          </p>
        </div>

        {/* Expenses / Top supporters */}
        <main className="mt-8">
          <PublicPageTabs
            expenses={publicExpenses}
            creator={publicCreator}
            reimbursements={publicSupport}
            visitorBlocked={visitorBlocked}
            visitorLimited={visitorLimited}
            entries={verified.map((r) => ({
              name: r.supporterName,
              amount: r.amount,
              createdAt: r.createdAt,
            }))}
            showLeaderboard={showLeaderboard}
          />
        </main>

        <footer className="mt-12 space-y-1.5 text-center text-xs text-zinc-400">
          <p>
            Powered by{" "}
            <Link href="/" className="font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
              Reimburser
            </Link>{" "}
            · Voluntary support, sent directly to the creator
          </p>
          <p>
            Questions or something not working?{" "}
            <Link
              href="/help"
              className="font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Help &amp; support
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
