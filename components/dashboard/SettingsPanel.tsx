"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2, Check, ExternalLink, Link2, ImagePlus, ShieldCheck } from "lucide-react";
import { Creator, PaymentMethodType } from "@/lib/types";
import { Card } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { HelpCard } from "@/components/dashboard/HelpCard";
import { SITE_URL } from "@/lib/site";
import { InstallAppCard } from "@/components/dashboard/InstallAppCard";
import { GIFT_CARD_EMAIL_HINT, PAYMENT_FIELDS, PAYMENT_META } from "@/lib/payments";
import {
  addPaymentMethod, clearBlockedIps, deletePaymentMethod, removeProfilePhoto,
  setPreference, togglePaymentMethod, updateProfile, updateUsername,
} from "@/app/actions";

const EMOJIS = ["🧑‍💻", "🎨", "📸", "🎬", "✍️", "🎙️", "🎮", "🧑‍🍳", "🎧", "🚀", "🌱", "☕️"];

const inputCls =
  "w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

export function SettingsPanel({
  creator,
  phoneConnected = false,
  showAutoCapture = false,
}: {
  creator: Creator;
  phoneConnected?: boolean;
  showAutoCapture?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const enabledMethods = creator.paymentMethods.filter((m) => m.enabled);
  const upiOnly =
    enabledMethods.length > 0 && enabledMethods.every((m) => m.type === "upi");

  function copyLink() {
    navigator.clipboard.writeText(`${SITE_URL}/${creator.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Payment methods, publishing preferences, and your public link.</p>
      </header>

      {/* Share */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Your public page</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Everything you publish lives here — see it as your supporters do, or share the link anywhere.
        </p>
        <div className="mt-3 flex gap-2">
          <a
            href={`/${creator.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink size={15} /> View my page
          </a>
          <button
            onClick={copyLink}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Link2 size={15} />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <UsernameForm creator={creator} />
      </Card>

      <InstallAppCard />

      {/* Auto-capture — needs the native app; hidden until it's on the Play Store */}
      {showAutoCapture && (
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Auto-capture your expenses</h2>
          {phoneConnected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              ✓ Connected
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
          {phoneConnected
            ? "Auto-capture is on. Your bank payment alerts turn into expense drafts automatically — review and publish them anytime. Set up a new phone? Reconnect it below."
            : "Using the Reimburser Android app? Connect your phone once, and your bank payment alerts become expense drafts automatically — you just review and publish."}
        </p>
        <a
          href="/connect"
          className={`mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            phoneConnected
              ? "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          {phoneConnected ? "Reconnect this phone" : "Connect this phone"}
        </a>
      </Card>
      )}

      <ProfileCard creator={creator} />

      {/* Payment methods */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Payment methods</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Supporters pay you directly on these — the platform never touches the money.
        </p>

        <div className="mt-4 space-y-2">
          {creator.paymentMethods.filter((m) => m.type in PAYMENT_META).map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                m.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50 opacity-60"
              }`}
            >
              <span className="text-xl">{PAYMENT_META[m.type].emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-zinc-900">
                  {m.label}
                  {PAYMENT_META[m.type].international && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">
                      works internationally
                    </span>
                  )}
                  {m.type === "upi" && (creator.preferences.protectUpi ?? true) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      <ShieldCheck size={11} /> Protected
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 truncate font-mono">{m.value}</div>
              </div>
              <Toggle
                checked={m.enabled}
                onChange={() => startTransition(() => togglePaymentMethod(m.id))}
              />
              <button
                onClick={() => startTransition(() => deletePaymentMethod(m.id))}
                className="rounded-lg p-2 text-zinc-300 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <AddMethodForm />
      </Card>

      {/* Preferences */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Publishing preferences</h2>
        <div className="mt-4 divide-y divide-zinc-100">
          <PrefRow
            title="Public supporter leaderboard"
            desc="Show a Top Supporters section on your public page, ranked by total verified support. A little thrill for your biggest fans."
            checked={creator.preferences.showLeaderboard}
            onChange={(v) => startTransition(() => setPreference("showLeaderboard", v))}
          />
          <PrefRow
            title="Allow payment proof"
            desc="Let supporters attach a payment reference or a screenshot when they mark their contribution as sent."
            checked={creator.preferences.allowProofUpload}
            onChange={(v) => startTransition(() => setPreference("allowProofUpload", v))}
          />
          {creator.preferences.allowProofUpload && (
            <PrefRow
              title="Require payment proof"
              desc="Supporters must attach a payment screenshot before they can mark a contribution as sent. Fake claims become easy to spot — a mismatched screenshot is one “Block sender” away."
              checked={creator.preferences.requireProof ?? true}
              onChange={(v) => startTransition(() => setPreference("requireProof", v))}
            />
          )}
          <PrefRow
            title="Protect your UPI ID"
            desc="Show UPI only to your proven supporters — people whose payments you've already verified. New visitors use your other methods — keeps your UPI ID away from spammers."
            checked={creator.preferences.protectUpi ?? true}
            onChange={(v) => startTransition(() => setPreference("protectUpi", v))}
            note={
              upiOnly && (creator.preferences.protectUpi ?? true)
                ? "Heads-up: UPI is your only payment method and it's hidden from new visitors — right now strangers see no way to pay you at all. Add one more method above (the Amazon gift card needs no email) so new supporters can still pay you while your UPI stays protected."
                : undefined
            }
          />
          <PrefRow
            title="Auto-import transactions"
            soon
            desc="Detect new expenses from bank notifications (Gmail / SMS) and create drafts for your review. For now, add expenses manually."
            checked={creator.preferences.autoImport}
            onChange={(v) => startTransition(() => setPreference("autoImport", v))}
          />
          <PrefRow
            title="Auto-publish detected expenses"
            soon
            desc="Skip the draft step — detected expenses go public immediately. Off means you review everything."
            checked={creator.preferences.autoPublish}
            onChange={(v) => startTransition(() => setPreference("autoPublish", v))}
          />
        </div>

        {(creator.blockedIps?.length ?? 0) > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 border border-zinc-200/70 px-4 py-3">
            <div className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{creator.blockedIps!.length}</span> blocked{" "}
              {creator.blockedIps!.length === 1 ? "sender" : "senders"}
              <span className="text-zinc-400"> — blocked via “Block sender” on the Support page</span>
            </div>
            <button
              onClick={() => startTransition(() => clearBlockedIps())}
              disabled={pending}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              Unblock all
            </button>
          </div>
        )}
      </Card>

      <HelpCard />
    </div>
  );
}

function UsernameForm({ creator }: { creator: Creator }) {
  const [value, setValue] = useState(creator.username);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const cleaned = value.trim().toLowerCase();
  const dirty = cleaned !== creator.username;

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const result = await updateUsername(fd);
          setError(result.error ?? null);
          if (result.ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }
        })
      }
      className="mt-4 border-t border-zinc-100 pt-4"
    >
      <label className="text-sm font-medium text-zinc-700">Your handle</label>
      <div className="mt-1.5 flex gap-2">
        <div className="flex flex-1 min-w-0 items-center rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400">
          <span className="pl-3.5 text-sm text-zinc-400 whitespace-nowrap">reimburser.in/</span>
          <input
            name="username"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            maxLength={30}
            className="w-full min-w-0 bg-transparent py-2.5 pr-3.5 text-base sm:text-sm focus:outline-none"
          />
        </div>
        {(dirty || saved) && (
          <button
            disabled={pending || (!dirty && !saved)}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {pending ? "Saving…" : saved ? "Saved!" : "Save"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 border border-red-200/70 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
      {dirty && !error && (
        <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200/70 px-3 py-2 text-xs font-medium text-amber-800">
          Changing your handle changes your link — reimburser.in/{creator.username} will stop
          working, so share the new link everywhere after saving.
        </p>
      )}
    </form>
  );
}

function AddMethodForm() {
  const [type, setType] = useState<PaymentMethodType>("upi");
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await addPaymentMethod(fd);
          setValues({});
        })
      }
      className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 space-y-3"
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">＋ Add another payment method</h3>
        <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
          Pick a type from the list below — UPI, PayPal, Wise, Amazon.in gift card, Throne
          wishlist, or bank transfer. The more ways you offer, the easier it is for
          supporters anywhere in the world to pay you.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 items-start">
        <select
          name="type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as PaymentMethodType);
            setValues({});
          }}
          className={`${inputCls} bg-white`}
        >
          {Object.entries(PAYMENT_META).map(([t, meta]) => (
            <option key={t} value={t}>
              {meta.emoji} {meta.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PAYMENT_FIELDS[type].map((f) => (
            <div key={f.key} className={PAYMENT_FIELDS[type].length === 1 ? "sm:col-span-2" : ""}>
              <label className="text-xs font-medium text-zinc-500">{f.label}</label>
              <input
                name={`field_${f.key}`}
                required={!f.optional}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={`mt-1 ${inputCls} bg-white`}
              />
            </div>
          ))}
        </div>
      </div>
      {type === "amazon_gc" && (
        <p className="rounded-lg bg-indigo-50/60 border border-indigo-100 px-3 py-2 text-xs leading-relaxed text-indigo-900/80">
          {GIFT_CARD_EMAIL_HINT}
        </p>
      )}
      <div className="flex justify-end">
        <button
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <Plus size={15} /> Add method
        </button>
      </div>
    </form>
  );
}

function ProfileCard({ creator }: { creator: Creator }) {
  const [emoji, setEmoji] = useState(creator.avatarEmoji);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const shownImage = preview ?? creator.avatarImage;

  function handleRemovePhoto() {
    if (preview) {
      // unsaved file selection — just discard it locally
      URL.revokeObjectURL(preview);
      setPreview(null);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    // stored photo — delete on the server right away
    startTransition(() => removeProfilePhoto());
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-zinc-900">Profile</h2>
      <p className="mt-1 text-xs text-zinc-400">How you appear on your public page.</p>

      <form
        action={(fd) =>
          startTransition(async () => {
            await updateProfile(fd);
            setPreview(null);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          })
        }
        className="mt-4 space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {shownImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownImage}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover border border-zinc-200 shadow-sm"
              />
            ) : (
              <Avatar emoji={emoji} size={64} />
            )}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full bg-zinc-900 p-1.5 text-white hover:bg-zinc-700 transition-colors"
              title="Upload photo"
            >
              <ImagePlus size={12} />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-base transition-all ${
                    emoji === e && !shownImage
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-500/20"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
              <span>Upload a photo or pick an emoji.</span>
              {shownImage && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleRemovePhoto}
                  className="font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {pending ? "Removing…" : "Remove photo"}
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          name="avatarFile"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (preview) URL.revokeObjectURL(preview);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
        <input type="hidden" name="avatarEmoji" value={emoji} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-zinc-700">Display name</label>
            <input name="displayName" defaultValue={creator.displayName} required className={`mt-1.5 ${inputCls}`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-zinc-700">Bio</label>
            <textarea name="bio" defaultValue={creator.bio} rows={2} className={`mt-1.5 ${inputCls} resize-none`} />
          </div>
        </div>

        <button
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {saved ? <Check size={15} /> : null}
          {pending ? "Saving…" : saved ? "Saved!" : "Save profile"}
        </button>
      </form>
    </Card>
  );
}

function PrefRow({
  title, desc, checked, onChange, soon = false, note,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  /** feature isn't active yet — badge it, but keep the toggle usable */
  soon?: boolean;
  /** amber callout under the description, e.g. why the setting is dormant */
  note?: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
          {title}
          {soon && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
              Live soon
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-zinc-400 leading-relaxed">{desc}</div>
        {note && (
          <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200/70 px-3 py-2 text-xs font-medium leading-relaxed text-amber-800">
            {note}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={() => onChange(!checked)} />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
