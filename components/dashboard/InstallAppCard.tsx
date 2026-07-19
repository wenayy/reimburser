"use client";

import { useEffect, useState } from "react";
import { Check, MonitorDown } from "lucide-react";
import { Card } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const INSTALLED_KEY = "reimburser-app-installed";

/** Second chance at the browser's one-time install popup, adapted per
 *  platform: Android/desktop get a one-tap Install button (captured event);
 *  iPhone/iPad — where the OS forbids programmatic install — get the manual
 *  Share → Add to Home Screen steps. After installing, the card flips to a
 *  confirmed "Installed" state (remembered across visits) instead of
 *  disappearing. Renders nothing inside the installed app itself. */
export function InstallAppCard() {
  const [state, setState] = useState<"hidden" | "installable" | "installed" | "ios">("hidden");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // inside the installed app there is nothing to say
    const nav = navigator as Navigator & { standalone?: boolean };
    if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) return;

    // iOS never fires install events — show the manual path instead
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setState("ios");
      return;
    }

    if (localStorage.getItem(INSTALLED_KEY) === "1") setState("installed");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      // the browser only offers install when it isn't installed — a stale
      // "installed" memory (e.g. after uninstalling) is corrected here
      localStorage.removeItem(INSTALLED_KEY);
      setState("installable");
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setInstallEvent(null);
      setState("installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (state === "hidden") return null;

  if (state === "ios") {
    return (
      <Card className="flex items-start gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <MonitorDown size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-900">Get the app</div>
          <div className="mt-0.5 text-xs leading-relaxed text-zinc-400">
            Add Reimburser to your home screen — it opens full-screen, one tap away. Tap the{" "}
            <span className="font-medium text-zinc-600">Share</span> button{" "}
            <span aria-hidden>(the square with the ↑ arrow)</span>, then choose{" "}
            <span className="font-medium text-zinc-600">&ldquo;Add to Home Screen&rdquo;</span>.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex items-center gap-3 p-4 sm:p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          state === "installed" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
        }`}
      >
        {state === "installed" ? <Check size={18} /> : <MonitorDown size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-900">
          {state === "installed" ? "App installed" : "Get the app"}
        </div>
        <div className="mt-0.5 text-xs text-zinc-400">
          {state === "installed"
            ? "Reimburser is on your device — find it on your home screen or dock."
            : "Add Reimburser to your home screen — opens full-screen, one tap away."}
        </div>
      </div>
      {state === "installed" ? (
        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          ✓ Installed
        </span>
      ) : (
        <button
          onClick={() => installEvent?.prompt()}
          className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
        >
          Install
        </button>
      )}
    </Card>
  );
}
