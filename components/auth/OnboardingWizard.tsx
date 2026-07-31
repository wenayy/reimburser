"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ImagePlus, X } from "lucide-react";
import { AuthState, completeOnboarding } from "@/app/auth/actions";
import {
  composeMethod, GIFT_CARD_EMAIL_HINT, PAYMENT_FIELDS, PAYMENT_META,
} from "@/lib/payments";
import { PaymentMethodType } from "@/lib/types";

const EMOJIS = ["🧑‍💻", "🎨", "📸", "🎬", "✍️", "🎙️", "🎮", "🧑‍🍳", "🎧", "🚀", "🌱", "☕️"];

const inputCls =
  "w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

export function OnboardingWizard({
  initialUsername,
  initialName,
}: {
  initialUsername: string;
  initialName: string;
}) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarEmoji, setAvatarEmoji] = useState(EMOJIS[0]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState("");
  const [pmType, setPmType] = useState<PaymentMethodType>("upi");
  // per-type field values, so switching types never loses or mixes input
  const [pmValues, setPmValues] = useState<
    Partial<Record<PaymentMethodType, Record<string, string>>>
  >({});
  const [state, action, pending] = useActionState<AuthState, FormData>(completeOnboarding, {
    error: "",
  });

  const isComplete = (t: PaymentMethodType) => composeMethod(t, pmValues[t] ?? {}) !== null;
  const filledMethods = (Object.keys(pmValues) as PaymentMethodType[])
    .filter(isComplete)
    .map((type) => ({ type, fields: pmValues[type]! }));

  const setField = (t: PaymentMethodType, key: string, value: string) =>
    setPmValues((v) => ({ ...v, [t]: { ...v[t], [key]: value } }));

  return (
    <div className="animate-fade-up w-full max-w-md">
      <div className="flex items-center gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-zinc-900" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>

      <form action={action} className="mt-8">
        {/* Step 1: profile */}
        <div className={step === 0 ? "space-y-5" : "hidden"}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Set up your page
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Claim your link and tell visitors who you are.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Your page link</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400">
              <span className="pl-3.5 text-sm text-zinc-400">reimburser.in/</span>
              <input
                name="username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20))
                }
                placeholder="riya"
                className="flex-1 min-w-0 rounded-r-xl px-1 py-2.5 text-base sm:text-sm focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              This becomes your public page — share it anywhere.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Your name</label>
            <input
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Riya Sharma"
              className={`mt-1.5 ${inputCls}`}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Profile picture</label>
            <div className="mt-1.5 flex items-start gap-3">
              {avatarPreview ? (
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full object-cover border border-zinc-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null);
                      if (avatarInput.current) avatarInput.current.value = "";
                    }}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-zinc-900 p-1 text-white hover:bg-zinc-700 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-dashed border-zinc-300 text-zinc-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  <ImagePlus size={18} />
                  <span className="text-[9px] font-medium">Photo</span>
                </button>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setAvatarEmoji(e)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all ${
                        avatarEmoji === e && !avatarPreview
                          ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-500/20"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  Upload your own photo, or pick an emoji.
                </p>
              </div>
            </div>
            <input
              ref={avatarInput}
              type="file"
              name="avatarFile"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                setAvatarPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            <input type="hidden" name="avatarEmoji" value={avatarEmoji} />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Short bio (optional)</label>
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="e.g. I make free design tutorials on YouTube — if they help you, cover one of my daily expenses."
              className={`mt-1.5 ${inputCls} resize-none`}
            />
          </div>

          <button
            type="button"
            disabled={!displayName.trim() || username.length < 3}
            onClick={() => setStep(1)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            Continue <ArrowRight size={15} />
          </button>
        </div>

        {/* Step 2: first payment method */}
        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              How should supporters pay you?
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Payments go directly to you — we never touch the money. Fill in as many methods as
              you like — and the Amazon gift card option is included for you automatically, no
              details needed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PAYMENT_META) as PaymentMethodType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPmType(t)}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all ${
                  pmType === t
                    ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <span className="text-lg">{PAYMENT_META[t].emoji}</span>
                <span className="flex-1 text-sm font-medium text-zinc-800">{PAYMENT_META[t].label}</span>
                {isComplete(t) && (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <input type="hidden" name="paymentMethods" value={JSON.stringify(filledMethods)} />

          <div className="space-y-3">
            {PAYMENT_FIELDS[pmType].map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium text-zinc-700">{f.label}</label>
                <input
                  value={pmValues[pmType]?.[f.key] ?? ""}
                  onChange={(e) => setField(pmType, f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>
            ))}
            {pmType === "amazon_gc" ? (
              <p className="rounded-lg bg-indigo-50/60 border border-indigo-100 px-3 py-2 text-xs leading-relaxed text-indigo-900/80">
                This one&apos;s already included on your page — supporters paste their gift
                card&apos;s claim code and you redeem it yourself. {GIFT_CARD_EMAIL_HINT}
              </p>
            ) : pmType === "upi" ? (
              <p className="rounded-lg bg-emerald-50 border border-emerald-200/70 px-3 py-2 text-xs leading-relaxed text-emerald-800">
                🔒 Your UPI ID gets special protection — it stays hidden from strangers and is
                shown only to supporters whose payments you&apos;ve verified. New supporters can
                still pay you right away via the gift card option, included by default.
              </p>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed">
                {PAYMENT_META[pmType].instructions}
              </p>
            )}
          </div>

          {state.error && (
            <p className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              disabled={pending}
              className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              {pending
                ? "Creating your page…"
                : filledMethods.length === 0
                  ? "Finish — gift card included by default"
                  : `Finish with ${filledMethods.length} ${filledMethods.length === 1 ? "method" : "methods"}${
                      filledMethods.some((m) => m.type === "amazon_gc") ? "" : " + gift card"
                    }`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
