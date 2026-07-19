import Link from "next/link";
import { ArrowRight, BadgeCheck, Eye, Wallet } from "lucide-react";
import { Logo } from "@/components/Logo";
import { OAuthButtons } from "./OAuthButtons";

const POINTS = [
  {
    icon: <Wallet size={16} className="text-indigo-500" />,
    title: "Zero fees, paid directly",
    body: "Supporters cover your expenses straight to your UPI, PayPal, or Wise — money never passes through us.",
  },
  {
    icon: <BadgeCheck size={16} className="text-indigo-500" />,
    title: "You verify everything",
    body: "Nothing counts toward your page until you confirm the payment actually arrived.",
  },
  {
    icon: <Eye size={16} className="text-indigo-500" />,
    title: "You choose what's public",
    body: "Publish, draft, or hide any expense. Your page, your call.",
  },
];

/** Login/signup with the product pitch alongside — a shared auth link should
 *  still teach a stranger what Reimburser is. */
export function AuthScreen({
  heading,
  sub,
  redirectTo,
  altPrompt,
  altHref,
  altLabel,
}: {
  heading: string;
  sub: string;
  redirectTo: string;
  altPrompt: string;
  altHref: string;
  altLabel: string;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Pitch */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 bg-white/60 border-b lg:border-b-0 lg:border-r border-zinc-200/70">
        <div className="mx-auto lg:mx-0 w-full max-w-md">
          <Logo size={48} tagline wordmarkClass="text-2xl" />
          <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.15]">
            Share your expenses.
            <br />
            <span className="text-zinc-400">Let supporters cover them.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">
            Your daily expenses become a beautiful public page. Fans cover a coffee or a cab
            ride directly — no middleman, no fees.
          </p>

          <div className="mt-8 space-y-5">
            {POINTS.map((p) => (
              <div key={p.title} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  {p.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{p.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link
              href="/riya"
              className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              See a live page <ArrowRight size={14} />
            </Link>
            <Link href="/" className="text-zinc-500 hover:text-zinc-900 transition-colors">
              How it works &amp; FAQs
            </Link>
          </div>
        </div>
      </div>

      {/* Auth card */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm rounded-2xl bg-white border border-zinc-200/70 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-zinc-900">{heading}</h2>
          <p className="mt-1 text-sm text-zinc-500">{sub}</p>
          <div className="mt-5">
            <OAuthButtons redirectTo={redirectTo} />
          </div>
          <p className="mt-5 text-center text-xs text-zinc-400">
            {altPrompt}{" "}
            <Link href={altHref} className="font-medium text-zinc-600 hover:text-zinc-900">
              {altLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
