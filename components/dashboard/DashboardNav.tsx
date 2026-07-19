"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Receipt, HandCoins, Settings, ExternalLink, Check, HelpCircle, Link2, LogOut, Share2 } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { SITE_URL } from "@/lib/site";
import { Logo } from "@/components/Logo";
import { Creator } from "@/lib/types";
import { Avatar } from "@/components/Avatar";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt, badge: "drafts" as const },
  { href: "/dashboard/support", label: "Support", icon: HandCoins, badge: "pending" as const },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({
  creator,
  pendingCount,
  draftCount,
}: {
  creator: Creator;
  pendingCount: number;
  draftCount: number;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  function sharePage() {
    const url = `${SITE_URL}/${creator.username}`;
    // native share sheet (WhatsApp, X, …) where available; copy elsewhere
    if (navigator.share) {
      navigator
        .share({
          title: `${creator.displayName} on Reimburser`,
          text: "I share my daily expenses here — cover one if my work helped you ☕",
          url,
        })
        .catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const badgeCount = (b?: "drafts" | "pending") =>
    b === "drafts" ? draftCount : b === "pending" ? pendingCount : 0;

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors";

  return (
    <>
      {/* Mobile top bar: view / share / logout — the sidebar actions, pocket-sized */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200/70 bg-white/85 backdrop-blur-lg px-4 py-2">
        <Logo size={28} wordmarkClass="text-base" />
        <div className="flex items-center gap-0.5">
          <Link
            href={`/${creator.username}`}
            target="_blank"
            title="View public page"
            className={iconBtn}
          >
            <ExternalLink size={18} />
          </Link>
          <button onClick={sharePage} title="Share my page" className={iconBtn}>
            {copied ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
          </button>
          <button title="Log out" onClick={() => setConfirmLogout(true)} className={iconBtn}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-200/70 bg-white/60 px-4 py-6 sticky top-0 h-screen">
        <div className="px-3">
          <Logo size={34} wordmarkClass="text-lg" />
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-200/60 px-3 py-3">
          <Avatar emoji={creator.avatarEmoji} image={creator.avatarImage} size={36} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-900 truncate">{creator.displayName}</div>
            <div className="text-xs text-zinc-400 truncate">reimburser.in/{creator.username}</div>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href;
            const count = badgeCount(badge);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <button
            onClick={sharePage}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {copied ? <Check size={15} /> : <Link2 size={15} />}
            {copied ? "Link copied!" : "Share my page"}
          </button>
          <Link
            href={`/${creator.username}`}
            target="_blank"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <ExternalLink size={15} /> View public page
          </Link>
          <div className="flex items-center">
            <Link
              href="/help"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <HelpCircle size={13} /> Help
            </Link>
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <LogOut size={13} /> Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Logout confirmation — one stray tap shouldn't end the session */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-6"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="animate-scale-in w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-zinc-900">Log out?</h3>
            <p className="mt-1 text-sm text-zinc-500">
              You&apos;ll need to sign in with Google again to manage your page.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <form action={logout} className="flex-1">
                <button className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200/70 bg-white/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href;
            const count = badgeCount(badge);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                  active ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                <Icon size={20} />
                {label}
                {count > 0 && (
                  <span className="absolute top-1 right-[calc(50%-18px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
