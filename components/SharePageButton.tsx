"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { SITE_URL } from "@/lib/site";

/** Supporter-side share: native share sheet where available, copy elsewhere. */
export function SharePageButton({ displayName }: { displayName: string }) {
  const [copied, setCopied] = useState(false);

  function share() {
    const url = SITE_URL + window.location.pathname;
    if (navigator.share) {
      navigator
        .share({
          title: `${displayName} on Reimburser`,
          text: `${displayName} shares their daily expenses transparently — cover one if their work helps you ☕`,
          url,
        })
        .catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
