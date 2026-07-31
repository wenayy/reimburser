import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata = { title: "Help & feedback — Reimburser" };

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <nav className="mx-auto flex max-w-xl items-center justify-between px-4 pt-5">
        <Logo size={26} wordmarkClass="text-sm" />
        <Link
          href="/"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          ← Back to home
        </Link>
      </nav>
      <div className="mx-auto max-w-xl px-4 pb-16 pt-10">
        <header className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Help &amp; feedback
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Stuck on something, found a bug, or just want to tell us what you think? Write to
            us — a human reads every message.
          </p>
        </header>
        <div className="mt-8">
          <FeedbackForm />
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500">
          Prefer email? Reach us any time at{" "}
          <a
            href="mailto:help@reimburser.in"
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            help@reimburser.in
          </a>
        </p>
      </div>
    </div>
  );
}
