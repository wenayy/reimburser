"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 15_000;

/** Keeps the dashboard live without manual reloads: re-fetches server data on
 *  an interval while the tab is visible, and immediately when the creator
 *  returns to the tab. router.refresh() preserves client state (open tab,
 *  scroll, form input) — only the server-rendered data updates. */
export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  return null;
}
