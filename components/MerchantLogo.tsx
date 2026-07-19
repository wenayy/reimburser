"use client";

import { useState } from "react";
import { logoUrl, CATEGORY_EMOJI } from "@/lib/merchants";

export function MerchantLogo({
  domain,
  category,
  size = 44,
  image,
}: {
  domain?: string;
  category: string;
  size?: number;
  /** creator-attached photo (bill scan etc.) — shown instead of the merchant logo */
  image?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = logoUrl(domain);

  if (image) {
    return (
      <div
        className="rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (!url || failed) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200/60"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {CATEGORY_EMOJI[category] ?? "💳"}
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-white border border-zinc-200/60 shadow-sm overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        width={size * 0.6}
        height={size * 0.6}
        onError={() => setFailed(true)}
        className="rounded-md"
      />
    </div>
  );
}
