"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
  /** show a red "Important" tag next to the question */
  important?: boolean;
}

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mt-8 space-y-3">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            className={`rounded-2xl border bg-white transition-all duration-300 ${
              isOpen
                ? "border-indigo-200 shadow-[0_12px_32px_-16px_rgba(79,70,229,0.25)]"
                : "border-zinc-200/70 shadow-sm hover:border-zinc-300"
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  isOpen ? "text-indigo-700" : "text-zinc-900"
                }`}
              >
                {f.q}
                {f.important && (
                  <span className="ml-2 inline-block align-middle rounded-full bg-red-50 border border-red-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                    Important
                  </span>
                )}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  isOpen ? "rotate-45 bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <Plus size={13} />
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p
                  className={`px-5 pb-5 text-sm leading-relaxed text-zinc-500 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
