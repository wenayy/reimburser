"use client";

import { useRef } from "react";

/** Thumb-swipe between tabs. Spread the returned handlers on the swipe area
 *  and give it the `touch-pan-y` class — that reserves horizontal gestures for
 *  us (the browser otherwise claims them for scrolling after the first swipe).
 *  The switch fires mid-gesture as soon as the motion is clearly horizontal,
 *  so it feels immediate; a gesture that starts as a vertical scroll is left
 *  alone for the rest of its life. Ends clamp rather than wrap. */
export function useSwipeTabs<T extends string>(
  order: readonly T[],
  current: T,
  onChange: (next: T) => void
) {
  const start = useRef<{ x: number; y: number } | null>(null);
  // a gesture acts at most once: either it switched a tab or it's a scroll
  const settled = useRef(false);

  const reset = () => {
    start.current = null;
  };

  return {
    onTouchStart(e: React.TouchEvent) {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      settled.current = false;
    },
    onTouchMove(e: React.TouchEvent) {
      if (settled.current || !start.current) return;
      const dx = e.touches[0].clientX - start.current.x;
      const dy = e.touches[0].clientY - start.current.y;
      // clearly vertical first — it's a scroll, stay out of its way
      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) {
        settled.current = true;
        return;
      }
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      settled.current = true;
      const i = order.indexOf(current);
      const next = dx < 0 ? Math.min(i + 1, order.length - 1) : Math.max(i - 1, 0);
      if (next !== i) onChange(order[next]);
    },
    onTouchEnd: reset,
    onTouchCancel: reset,
  };
}
