"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { generateDeviceKey } from "@/app/actions";

/** One-tap: generate a capture key and hand it to the native app via the
 *  reimburser://pair deep link. */
export function ConnectPhone({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // once connected, take the creator back to Settings so they're never stuck
  // on a dead-end screen — after a beat, or immediately via the button
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/dashboard/settings"), 3500);
    return () => clearTimeout(t);
  }, [done, router]);

  function connect() {
    startTransition(async () => {
      const key = await generateDeviceKey();
      setDone(true);
      // hand off to the app; if it isn't installed this simply does nothing
      window.location.href = `reimburser://pair?key=${encodeURIComponent(key)}`;
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <Logo size={34} />
      <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        {done ? <Check size={30} /> : <Smartphone size={28} />}
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">
        {done ? "Phone connected 🎉" : "Turn on auto-capture"}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-500">
        {done
          ? `Your real expenses will now appear on your page automatically, ${displayName.split(" ")[0]} — as drafts for you to review.`
          : "Connect this phone so your bank payment alerts become expense drafts automatically. Nothing is shared except the amount and a clean description — you review everything."}
      </p>
      {!done ? (
        <button
          onClick={connect}
          disabled={pending}
          className="mt-7 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {pending ? "Connecting…" : "Connect this phone"}
        </button>
      ) : (
        <>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="mt-7 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            Back to Settings
          </button>
          <p className="mt-3 text-xs text-zinc-400">Taking you back automatically…</p>
        </>
      )}
    </div>
  );
}
