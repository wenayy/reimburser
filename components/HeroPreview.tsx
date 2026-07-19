import { BadgeCheck } from "lucide-react";
import { MerchantLogo } from "./MerchantLogo";
import { Reveal } from "./Reveal";

/** Static, pixel-real mock of the product for the landing hero — same visual
 *  language as PublicExpenseCard, none of the interactivity. Pieces reveal
 *  when scrolled into view (instantly when already visible). */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md select-none" aria-hidden>
      {/* back card — a finished expense peeking out */}
      <Reveal delay={220} className="absolute -top-8 right-0 w-[85%]">
        <div className="rotate-2 rounded-2xl bg-white border border-zinc-200/70 shadow-sm p-4 opacity-90">
        <div className="flex items-center gap-3">
          <MerchantLogo domain="netflix.com" category="Subscription" size={34} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900">Netflix</span>
              <span className="text-sm font-semibold tabular-nums text-zinc-900">₹649</span>
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full w-full rounded-full bg-emerald-500" />
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          Complete 🎉 <span className="text-emerald-600 font-medium">· 2× full</span>
        </div>
        </div>
      </Reveal>

      {/* front card — the product in one glance */}
      <Reveal delay={60} className="relative mt-6">
        <div className="-rotate-1 rounded-2xl bg-white border border-zinc-200/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_48px_-16px_rgba(0,0,0,0.18)]">
        <div className="flex items-start gap-3.5">
          <MerchantLogo domain="starbucks.com" category="Coffee" size={42} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-zinc-900">Starbucks</h3>
              <span className="text-lg font-semibold tabular-nums text-zinc-900">₹420</span>
            </div>
            <div className="mt-0.5 text-xs text-zinc-400">2h ago · Coffee</div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Afternoon coffee while editing today&apos;s video.
        </p>

        <div className="mt-4 h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full w-[71%] rounded-full bg-indigo-500" />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>
            <span className="font-medium text-zinc-700">₹300</span> covered
          </span>
          <span>
            <span className="font-medium text-zinc-700">₹120</span> remaining
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-400 truncate">Alex, Priya +3 more</span>
          <span className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white whitespace-nowrap">
            Cover this
          </span>
        </div>
        </div>
      </Reveal>

      {/* floating proof-of-life toast */}
      <Reveal delay={420} className="absolute -bottom-5 -left-2 sm:-left-6">
        <div className="flex items-center gap-2 rounded-full bg-white border border-zinc-200/70 py-2 pl-2.5 pr-4 shadow-lg">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <BadgeCheck size={14} className="text-emerald-600" />
          </span>
          <span className="text-xs text-zinc-600">
            <span className="font-semibold text-zinc-900">₹300 from Sarah</span> — verified ✓
          </span>
        </div>
      </Reveal>
    </div>
  );
}
