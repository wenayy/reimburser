"use client";

import { useEffect } from "react";

/** WhatsApp-style unseen count for claims awaiting verification:
 *  - number on the installed app's icon (Badging API — Android/desktop Chromium)
 *  - "(3) Reimburser" prefix in the browser tab title
 *  Count arrives from the dashboard layout, which AutoRefresh keeps current. */
export function PendingBadge({ count }: { count: number }) {
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (count > 0) nav.setAppBadge?.(count).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});

    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
  }, [count]);

  return null;
}
