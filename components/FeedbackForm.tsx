"use client";

import { useState } from "react";
import { CheckCircle2, HelpCircle, ImagePlus, Star, X } from "lucide-react";
import { submitFeedback, FeedbackState } from "@/app/actions";
import { downscaleImage } from "@/lib/image-client";

const inputCls =
  "w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

/** Web3Forms' free tier only accepts browser submissions, so after the server
 *  stores the message (the permanent record), the email leg fires from here.
 *  The access key is public by design — it can only send mail to the owner. */
function emailOwner(kind: string, message: string, email: string, imageUrl?: string) {
  const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
  if (!key) return;
  const payload: Record<string, string> = {
    access_key: key,
    subject: kind === "query" ? "Reimburser — new query" : "Reimburser — new review",
    from_name: "Reimburser feedback",
    message: `${message}\n\n— kind: ${kind}${email ? `\n— reply to: ${email}` : ""}${imageUrl ? `\n— screenshot: ${imageUrl}` : ""}`,
  };
  // only attach a reply-to when the sender gave one — a made-up fallback
  // address gets the whole notification spam-filtered
  if (email) payload.email = email;
  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function FeedbackForm() {
  const [kind, setKind] = useState<"query" | "review">("query");
  const [state, setState] = useState<FeedbackState>({ ok: false });
  const [pending, setPending] = useState(false);
  const [shot, setShot] = useState<Blob | null>(null);
  const [shotPreview, setShotPreview] = useState<string | null>(null);
  const [shotKey, setShotKey] = useState(0);

  async function onShotPicked(file: File | undefined) {
    if (!file) {
      setShot(null);
      setShotPreview(null);
      return;
    }
    const blob = await downscaleImage(file);
    setShot(blob);
    setShotPreview(URL.createObjectURL(blob));
  }

  async function handleSubmit(fd: FormData) {
    setPending(true);
    try {
      if (shot && kind === "query") fd.set("screenshot", shot, "screenshot.jpg");
      const res = await submitFeedback({ ok: false }, fd);
      if (res.ok) {
        emailOwner(
          String(fd.get("kind")),
          String(fd.get("message") ?? ""),
          String(fd.get("email") ?? "").trim(),
          res.imageUrl
        );
      }
      setState(res);
    } finally {
      setPending(false);
    }
  }

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-white border border-zinc-200/70 p-8 text-center shadow-sm">
        <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
        <h2 className="mt-3 font-semibold text-zinc-900">Got it — thank you! 💛</h2>
        <p className="mt-1 text-sm text-zinc-500">
          We read every message.
          {kind === "query" && " We'll get back to you on your email soon."}
        </p>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-2xl bg-white border border-zinc-200/70 p-6 shadow-sm space-y-4"
    >
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { id: "query", label: "Ask a question", desc: "Something unclear or not working", icon: <HelpCircle size={15} /> },
            { id: "review", label: "Share feedback", desc: "Tell us what you think", icon: <Star size={15} /> },
          ] as const
        ).map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
              kind === k.id
                ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
              {k.icon} {k.label}
            </span>
            <span className="mt-0.5 block text-[11px] leading-tight text-zinc-400">{k.desc}</span>
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />

      <div>
        <label className="text-sm font-medium text-zinc-700">
          Your email{" "}
          {kind === "query" ? (
            <span className="text-zinc-400 font-normal">— so we can reply</span>
          ) : (
            <span className="text-zinc-400 font-normal">(optional)</span>
          )}
        </label>
        <input
          name="email"
          type="email"
          required={kind === "query"}
          placeholder="you@example.com"
          className={`mt-1.5 ${inputCls}`}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700">
          {kind === "query" ? "What do you need help with?" : "What's on your mind?"}
        </label>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={1000}
          rows={4}
          placeholder={
            kind === "query"
              ? "Describe your question or the problem you ran into…"
              : "What do you like? What should be better?"
          }
          className={`mt-1.5 ${inputCls} resize-none`}
        />
      </div>

      {kind === "query" && (
        <div className="flex items-center gap-3">
          <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-dashed border-zinc-300 px-4 py-3 cursor-pointer hover:bg-zinc-50 hover:border-zinc-400 transition-colors">
            <ImagePlus size={16} className="shrink-0 text-indigo-500" />
            <span className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-800">Attach a screenshot</span>
              <span className="text-zinc-400"> (optional) — helps us see the problem.</span>
            </span>
            <input
              key={shotKey}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onShotPicked(e.target.files?.[0])}
            />
          </label>
          {shotPreview && (
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shotPreview}
                alt=""
                className="h-12 w-12 rounded-xl object-cover border border-zinc-200"
              />
              <button
                type="button"
                onClick={() => {
                  setShot(null);
                  setShotPreview(null);
                  setShotKey((k) => k + 1);
                }}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700"
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {pending ? "Sending…" : kind === "query" ? "Send question" : "Send feedback"}
      </button>
    </form>
  );
}
