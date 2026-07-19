import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Globe, Link2, Percent, Repeat, Sparkles, Trophy, Wallet, Zap,
} from "lucide-react";
import { getSessionCreator } from "@/lib/auth";
import { Faq } from "@/components/Faq";
import { HeroPreview } from "@/components/HeroPreview";
import { Logo, LogoMark } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const creator = await getSessionCreator();
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="mx-auto w-full max-w-5xl flex items-center justify-between px-6 py-5">
        <Logo size={40} />
        {creator ? (
          <Link
            href="/dashboard"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            Log in
          </Link>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="grid w-full max-w-5xl items-center gap-14 lg:grid-cols-2 lg:gap-10 lg:text-left">
          <div className="animate-fade-up">
            <div className="mb-6 flex justify-center lg:hidden">
              <LogoMark size={72} />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
              <Sparkles size={12} className="text-indigo-500" /> No payment processing · No fees · No middleman
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl lg:text-5xl xl:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.1]">
              Share your expenses.
              <br />
              <span className="text-zinc-400">Let supporters cover them.</span>
            </h1>
            <p className="mx-auto lg:mx-0 mt-5 max-w-lg text-lg text-zinc-500 leading-relaxed">
              Your daily expenses become a beautiful public page. Supporters cover them directly
              over UPI, PayPal, Throne, Wise, gift cards or crypto.
            </p>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-3">
              <Link
                href={creator ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-all hover:scale-[1.02]"
              >
                {creator ? "Open your dashboard" : "Claim your page"} <ArrowRight size={16} />
              </Link>
              <Link
                href="/riya"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                See a live page
              </Link>
            </div>
            <p className="mt-5 text-xs text-zinc-400">
              Zero fees · Payments land straight in your UPI or PayPal · Only what you verify counts
            </p>
          </div>

          <div className="px-2 pb-6 lg:pb-0">
            <HeroPreview />
          </div>
        </div>

        {/* How it works */}
        <section className="mt-20 w-full max-w-3xl">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">How it works</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              {
                step: "1",
                title: "Add your expenses",
                body: "Type what you bought and how much. Regulars like coffee become one-tap templates.",
              },
              {
                step: "2",
                title: "Share your link",
                body: "Claim reimburser.in/you. Your expenses show up there — you choose what's public.",
              },
              {
                step: "3",
                title: "Get paid directly",
                body: "Supporters cover any expense straight to your UPI or PayPal. No fees, no middleman.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 90} className="h-full">
                <div className="h-full rounded-2xl bg-white border border-zinc-200/70 p-5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                    {s.step}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-zinc-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500 leading-relaxed">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 w-full max-w-3xl pb-16">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Built for daily sharing
            </h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 70} className="h-full">
                <div className="h-full rounded-2xl bg-white border border-zinc-200/70 p-5 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">{f.icon}</div>
                  <h3 className="mt-3 text-sm font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500 leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full max-w-2xl pb-20 text-left">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900">
              Frequently asked questions
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <h3 className="mt-10 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              For creators
            </h3>
            <Faq items={CREATOR_FAQS} />
          </Reveal>
          <Reveal>
            <h3 className="mt-10 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              For supporters
            </h3>
            <Faq items={SUPPORTER_FAQS} />
          </Reveal>
        </section>
      </main>

      <footer className="space-y-2 border-t border-zinc-200/70 py-6 text-center text-xs text-zinc-400">
        <p>Reimburser — voluntary support, sent directly to creators. We never touch the money.</p>
        <p>
          <Link href="/help" className="font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Help &amp; feedback
          </Link>
          <span className="mx-2 text-zinc-300">·</span>
          <Link href="/terms" className="hover:text-zinc-700 transition-colors">Terms</Link>
          <span className="mx-2 text-zinc-300">·</span>
          <Link href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</Link>
          <span className="mx-2 text-zinc-300">·</span>
          <Link href="/refunds" className="hover:text-zinc-700 transition-colors">Refunds</Link>
          <span className="mx-2 text-zinc-300">·</span>
          <Link href="/contact" className="hover:text-zinc-700 transition-colors">Contact</Link>
        </p>
      </footer>
    </div>
  );
}

const FEATURES = [
   
  {
    icon: <Wallet size={18} className="text-indigo-500" />,
    title: "Zero fees",
    body: "Money goes straight to you — UPI, PayPal, Wise, gift cards, Throne, crypto.",
  },
  {
    icon: <BadgeCheck size={18} className="text-indigo-500" />,
    title: "Verified support",
    body: "You confirm each payment arrived before it counts. No fake progress.",
  },
  {
    icon: <Percent size={18} className="text-indigo-500" />,
    title: "Partial covers welcome",
    body: "Supporters can cover part of any expense — 25%, 50%, or full. Every bit moves the progress bar.",
  },
  // {
  //   icon: <Trophy size={18} className="text-indigo-500" />,
  //   title: "Supporter leaderboard",
  //   body: "Top fans of the week, month, and all time. Yours to turn off.",
  // },
  {
    icon: <Repeat size={18} className="text-indigo-500" />,
    title: "Cover again",
    body: "Finished expenses stay open — supporters can cover them again.",
  },
  // {
  //   icon: <Link2 size={18} className="text-indigo-500" />,
  //   title: "You stay in control",
  //   body: "Publish, draft, or hide anything. Nothing goes public without you.",
  // },
  {
    icon: <Globe size={18} className="text-indigo-500" />,
    title: "Works worldwide",
    body: "UPI at home; PayPal, Wise, gift cards, or crypto from anywhere.",
  },
  // {
  //   icon: <ArrowRight size={18} className="text-indigo-500" />,
  //   title: "A living page",
  //   body: "Expenses group by day — Today, Yesterday — like a daily log.",
  // },
];

const CREATOR_FAQS = [
  {
    q: "Do you process payments or take a fee?",
    a: "No — zero fees, ever. Supporters pay you directly on your own UPI, PayPal, Wise, gift card, or wallet. Reimburser never touches, holds, or routes the money — it just shows your payment details and tracks what's been covered. Every rupee goes to you.",
  },
  {
    q: "Are my funds and payment details safe?",
    important: true,
    a: "Yes. Your money lands straight in your own account — it never passes through us, so there's nothing to lose in between. You choose exactly which payment methods appear on your page, and your UPI ID gets special protection: it's only shown to your proven supporters — strangers and spammers never see it. We never ask for bank passwords, card numbers, or OTPs.",
  },
  {
    q: "Why should I add a payment method besides UPI?",
    important: true,
    a: "Because your UPI ID is always protected — it's never shown to new visitors, only to supporters whose payments you've already verified. That keeps it safely away from spammers, but it also means that if UPI is your only method, first-time supporters see no way to pay you at all. Add just one more option — the Amazon gift card even works without sharing any email — and new supporters can pay you from day one while your UPI stays hidden. Your dashboard will remind you if this ever applies to you.",
  },
  {
    q: "How secure is my account and my data?",
    a: "Very — and safe by default, from day one. You sign in with Google, so there's no password for us to store or for anyone to steal. Your personal details stay private: your public page shows only the expenses you chose to publish — never your email, never your documents, never anything you didn't put there yourself. Payment screenshots supporters send are visible to you alone and deleted after you verify. Every protection — verified-only progress, UPI privacy, one-click blocking — is built in and switched on before your first supporter ever arrives.",
  },
  {
    q: "What if someone spams fake payment claims?",
    important: true,
    a: "They can't touch you. Nothing appears on your page until you verify it, so fake claims never reach your progress bar or leaderboard. Built-in protections quietly slow down suspicious activity before it gets to you — and if junk does arrive, one click rejects it and blocks that sender for good, sweeping away everything else they sent too. You're always in control.",
  },
  {
    q: "How do I know a payment actually arrived?",
    important: true,
    a: "You confirm it yourself, so you're never guessing. Supporters mark a payment as sent and can attach a reference or screenshot (screenshots stay blurred until you choose to look). Check your own bank or PayPal, then tap Verify or Reject. Only what you approve counts — no fake progress, ever.",
  },
  {
    q: "Are my expenses published automatically?",
    a: "No — never without your say. Every expense is published, saved as a draft, or kept hidden: your choice when you add it, changeable anytime. Drafts and hidden expenses are visible only to you.",
  },
  {
    q: "How do supporters outside India pay me?",
    a: "Easily. PayPal and Wise work from most countries. Anyone with an international card can buy an Amazon.in eGift card and email it to you — or paste the gift card code right into the payment flow. Throne wishlists and crypto work from anywhere.",
  },
  {
    q: "Can I install Reimburser as an app on my phone?",
    important: true,
    a: "Yes — in two steps, no app store needed. Register on the web, then open Settings and tap Install on the “Get the app” card (on iPhone: tap Share, then “Add to Home Screen”). You get the Reimburser icon on your home screen, it opens full-screen straight to your dashboard, and the icon even shows a little badge when payments are waiting for your review.",
  },
];

const SUPPORTER_FAQS = [
  {
    q: "Do I need an account or app to support someone?",
    a: "No — no account, no app, no fees. Open the creator's link, pick an expense, tap 25%, 50%, or Full, and pay in your own UPI or PayPal app (UPI even shows a scannable QR). Tap \"I've sent it\" and you're done — the whole thing takes about a minute.",
  },
  {
    q: "Do I have to cover the full expense?",
    a: "No — yes to partial covers! You can cover as little as 25% of any expense, and every contribution moves the progress bar. Tap 25%, 50%, or Full, or type your own amount. And if an expense is already fully covered, you can happily cover it again — the card celebrates every extra round.",
  },
  {
    q: "Will people see my support?",
    a: "Yes — and that's the fun part! Your name appears on the creator's Top Supporters leaderboard, with weekly, monthly, and all-time rankings and medals for the top three. Cover regularly and the 🥇 spot is yours. It's just the name you type — any name or nickname works, and no account or profile is created.",
  },
  {
    q: "How do I know the creator actually spent this money?",
    important: true,
    a: "Honest answer: you're supporting a person, not buying a product — so at its heart it's the same trust you give any creator you follow. But you're not guessing blind. Creators can attach the actual bill or a photo of the item to an expense — tap it and see it full-size. Every page also shows a track record built over time: verified support history, totals, and returning supporters. Support whoever feels genuine to you, at whatever amount feels right — and if something ever feels off, tell us on the Help page; we take it seriously.",
  },
  {
    q: "Is my information safe when I support someone?",
    important: true,
    a: "Yes. You pay in your own UPI, PayPal, or bank app, so your payment details never pass through this site. All we ask for is a name — any nickname you like. And if you attach a screenshot, only the creator can see it, and it's deleted once they've verified your payment.",
  },
  {
    q: "What happens when an expense is fully covered?",
    a: "It celebrates 🎉 — and stays open. You can keep cover it again.",
  },
];
