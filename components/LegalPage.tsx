import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Shared shell for the legal/compliance pages (/terms, /privacy, /refunds,
 *  /contact) — payment partners and app reviews expect these to exist. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-5">
        <Logo size={30} wordmarkClass="text-base" />
        <Link
          href="/"
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
        >
          ← Home
        </Link>
      </nav>
      <main className="mx-auto max-w-2xl px-6 pb-20 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-400">Last updated: {updated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-zinc-600 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {children}
        </div>
        <footer className="mt-14 border-t border-zinc-200/70 pt-6 text-xs text-zinc-400">
          <Link href="/terms" className="hover:text-zinc-700">Terms</Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:text-zinc-700">Privacy</Link>
          <span className="mx-2">·</span>
          <Link href="/refunds" className="hover:text-zinc-700">Refunds</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="hover:text-zinc-700">Contact</Link>
        </footer>
      </main>
    </div>
  );
}
