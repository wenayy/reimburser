"use client";

import { useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  ImagePlus, Plus, Eye, EyeOff, Trash2, Pencil, Sparkles, Upload, X,
} from "lucide-react";
import { Expense, ExpenseStatus, ExpenseTemplate, Reimbursement } from "@/lib/types";
import { useSwipeTabs } from "@/lib/use-swipe-tabs";
import { inr, fullDate } from "@/lib/format";
import { Card, ProgressBar, StatusBadge } from "@/components/ui";
import { MerchantLogo } from "@/components/MerchantLogo";
import {
  addExpense, deleteExpense, deleteTemplate, setExpenseStatus, updateExpense, useTemplate,
} from "@/app/actions";
import { downscaleImage } from "@/lib/image-client";

type Tab = "all" | "draft" | "published" | "hidden";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "hidden", label: "Hidden" },
];

export function ExpenseManager({
  expenses,
  reimbursements,
  templates,
}: {
  expenses: Expense[];
  reimbursements: Reimbursement[];
  templates: ExpenseTemplate[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const filtered = useMemo(
    () => (tab === "all" ? expenses : expenses.filter((e) => e.status === tab)),
    [expenses, tab]
  );
  const draftCount = expenses.filter((e) => e.status === "draft").length;

  const swipe = useSwipeTabs(
    TABS.map((t) => t.id),
    tab,
    setTab
  );

  return (
    <div className="space-y-6 animate-fade-up touch-pan-y" {...swipe}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Expenses</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {draftCount > 0
              ? `${draftCount} detected ${draftCount === 1 ? "expense" : "expenses"} awaiting your review.`
              : "Everything reviewed. Nothing goes public without you."}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
        >
          <Plus size={15} /> Add expense
        </button>
      </header>

      {templates.length > 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Daily templates — tap to add today&apos;s entry
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {templates.map((t) => (
              <TemplateChip key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
            {t.id === "draft" && draftCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                {draftCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div key={tab} className="space-y-3 animate-fade-up">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-zinc-400">No expenses here yet.</Card>
        )}
        {filtered.map((e) => (
          <ExpenseRow
            key={e.id}
            expense={e}
            reimbursed={reimbursements
              .filter((r) => r.expenseId === e.id && r.status === "verified")
              .reduce((s, r) => s + r.amount, 0)}
            onEdit={() => setEditing(e)}
          />
        ))}
      </div>

      {adding && <AddExpenseModal onClose={() => setAdding(false)} />}
      {editing && <EditExpenseModal expense={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TemplateChip({ template }: { template: ExpenseTemplate }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border pl-1.5 pr-1 py-1 transition-all duration-150 ${
        added
          ? "border-emerald-300 bg-emerald-50"
          : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
      } ${pending ? "opacity-50" : ""}`}
    >
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await useTemplate(template.id);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          })
        }
        className="inline-flex items-center gap-1.5"
        title={`Add ${template.merchant} ${inr(template.amount)} for today`}
      >
        <MerchantLogo domain={template.merchantDomain} category={template.category} size={22} />
        <span className="max-w-[130px] truncate text-sm font-medium text-zinc-800">{template.merchant}</span>
        <span className="text-sm tabular-nums text-zinc-500">{inr(template.amount)}</span>
        <span className={`text-xs font-semibold ${added ? "text-emerald-600" : "text-indigo-500"}`}>
          {added ? "Added ✓" : "+ Add"}
        </span>
      </button>
      <button
        onClick={() => startTransition(() => deleteTemplate(template.id))}
        className="rounded-full p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-colors"
        title="Delete template"
      >
        <X size={12} />
      </button>
    </span>
  );
}

function ExpenseRow({
  expense,
  reimbursed,
  onEdit,
}: {
  expense: Expense;
  reimbursed: number;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isDraft = expense.status === "draft";

  const act = (fn: () => Promise<void>) => () => startTransition(fn);

  return (
    <Card className={`p-4 sm:p-5 ${pending ? "opacity-50" : ""} ${isDraft ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex flex-1 items-start gap-3 sm:gap-4 min-w-0">
        <MerchantLogo domain={expense.merchantDomain} category={expense.category} size={40} image={expense.image} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-zinc-900">{expense.merchant}</span>
            <span className="font-semibold text-zinc-900 tabular-nums">{inr(expense.amount)}</span>
            <StatusBadge status={expense.status} />
            {expense.source === "auto" && (
              <span
                title="Captured automatically from a real transaction — amount can't be edited"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
              >
                ✓ Real spend
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600 flex items-start gap-1.5">
            {!expense.customDescription && <Sparkles size={13} className="mt-0.5 shrink-0 text-indigo-400" />}
            {expense.customDescription ?? expense.aiDescription}
          </p>
          <div className="mt-1 text-xs text-zinc-400">
            {fullDate(expense.date)} · <span className="font-mono">{expense.rawText}</span>
          </div>
          {reimbursed > 0 && (
            <div className="mt-2.5 max-w-xs space-y-1">
              <ProgressBar value={Math.min(reimbursed, expense.amount)} total={expense.amount} />
              <div className="text-xs text-zinc-400">
                {reimbursed >= expense.amount && expense.amount > 0
                  ? `Fully covered ${Math.floor(reimbursed / expense.amount)}× · ${inr(reimbursed)} total`
                  : `${inr(reimbursed)} of ${inr(expense.amount)} covered`}
              </div>
            </div>
          )}
        </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          {isDraft ? (
            <>
              <button
                onClick={act(() => setExpenseStatus(expense.id, "published"))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                <Upload size={12} /> Publish
              </button>
              <IconBtn title="Edit details" onClick={onEdit}><Pencil size={14} /></IconBtn>
              <IconBtn title="Delete expense" danger onClick={act(() => deleteExpense(expense.id))}><Trash2 size={14} /></IconBtn>
            </>
          ) : (
            <>
              {expense.status === "published" ? (
                <IconBtn title="Hide — take it off your public page" onClick={act(() => setExpenseStatus(expense.id, "hidden"))}>
                  <EyeOff size={14} />
                </IconBtn>
              ) : (
                <IconBtn title="Publish — show it on your public page" onClick={act(() => setExpenseStatus(expense.id, "published"))}>
                  <Eye size={14} />
                </IconBtn>
              )}
              <IconBtn title="Edit details" onClick={onEdit}><Pencil size={14} /></IconBtn>
              <IconBtn title="Delete expense" danger onClick={act(() => deleteExpense(expense.id))}><Trash2 size={14} /></IconBtn>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      className={`group relative rounded-lg p-2 transition-colors ${
        danger
          ? "text-zinc-400 hover:bg-red-50 hover:text-red-600"
          : active
            ? "bg-purple-100 text-purple-700"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {title}
      </span>
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // portal to <body>: fixed positioning must never be trapped by an
  // ancestor's transform/filter (e.g. entry animations)
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-6">
        <div
          className="animate-scale-in w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] sm:pb-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 pt-6 pb-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

const VISIBILITY: { value: ExpenseStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "published", label: "Publish now", desc: "Visible on your public page", icon: <Eye size={14} /> },
  { value: "draft", label: "Draft", desc: "Review and publish later", icon: <Pencil size={14} /> },
  { value: "hidden", label: "Hidden", desc: "Only you can see it", icon: <EyeOff size={14} /> },
];

function AddExpenseModal({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ExpenseStatus>("published");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  async function onPhotoPicked(file: File | undefined) {
    if (!file) {
      setPhotoPreview(null);
      setPhotoBlob(null);
      return;
    }
    const blob = await downscaleImage(file);
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
  }

  return (
    <Modal
      title="Add an expense"
      subtitle="Paste the raw transaction text or just type the merchant — AI cleans it up."
      onClose={onClose}
    >
      <form
        action={(fd) => {
          if (photoBlob) fd.set("billImage", photoBlob, "bill.jpg");
          startTransition(async () => { await addExpense(fd); onClose(); });
        }}
        className="px-6 py-5 space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <div>
            <label className="text-sm font-medium text-zinc-700">Merchant</label>
            <input
              name="rawText"
              required
              autoFocus
              placeholder="Starbucks, UBER INDIA, ZOMATO ORDER 99231…"
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Amount</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₹</span>
              <input
                name="amount"
                type="number"
                min={1}
                required
                placeholder="420"
                className={`${inputCls} pl-7`}
              />
            </div>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-zinc-400 -mt-2">
          <Sparkles size={11} className="text-indigo-400" />
          AI detects the merchant, logo and category, and writes the public description.
        </p>

        <div>
          <label className="text-sm font-medium text-zinc-700">Your description (optional)</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Leave empty and the AI description is used — you can edit it any time."
            className={`mt-1.5 ${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">Item link (optional)</label>
          <input
            name="link"
            placeholder="e.g. myntra.com/that-dress — supporters can open the exact item"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">Photo (optional)</label>
          <div className="mt-1.5 flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-dashed border-zinc-300 px-4 py-3 cursor-pointer hover:bg-zinc-50 hover:border-zinc-400 transition-colors">
              <ImagePlus size={16} className="shrink-0 text-indigo-500" />
              <span className="text-sm text-zinc-600">
                <span className="font-medium text-zinc-800">Add a photo</span>
                <span className="text-zinc-400"> — the bill of the expense, or the item you&apos;re buying (that dress, those heels). Supporters see it on the card and trust it more.</span>
              </span>
              <input
                key={photoInputKey}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPhotoPicked(e.target.files?.[0])}
              />
            </label>
            {photoPreview && (
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover border border-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null);
                    setPhotoBlob(null);
                    setPhotoInputKey((k) => k + 1); // clears the file input
                  }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">
            The photo shows on the expense card; without one we use the merchant&apos;s logo.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">Visibility</label>
          <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {VISIBILITY.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setStatus(v.value)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                  status === v.value
                    ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
                  {v.icon} {v.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-tight text-zinc-400">{v.desc}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="status" value={status} />
        </div>

        <label className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors">
          <input
            type="checkbox"
            name="saveTemplate"
            className="h-4 w-4 rounded accent-zinc-900"
          />
          <span className="text-sm text-zinc-700">
            <span className="font-medium">Save as daily template</span>
            <span className="text-zinc-400"> — recurring expense? Add it with one tap from now on.</span>
          </span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={pending}
            className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {pending
              ? "Adding…"
              : status === "published"
                ? "Add & publish"
                : status === "draft"
                  ? "Save as draft"
                  : "Add privately"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditExpenseModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const [merchant, setMerchant] = useState(expense.merchant);
  const [amount, setAmount] = useState(expense.amount);
  const [description, setDescription] = useState(expense.customDescription ?? expense.aiDescription);
  const [link, setLink] = useState(expense.link ?? "");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = expense.source === "auto";
  const shownPhoto = photoPreview ?? expense.image;

  async function onEditPhotoPicked(file: File | undefined) {
    if (!file) return;
    const blob = await downscaleImage(file);
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
  }

  return (
    <Modal title="Edit expense" onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {locked && (
          <p className="rounded-lg bg-indigo-50/60 border border-indigo-100 px-3 py-2 text-xs leading-relaxed text-indigo-900/80">
            Detected from a real transaction — the merchant and amount can&apos;t be changed.
            You can still edit the description, or hide/delete the expense.
          </p>
        )}
        <div>
          <label className="text-sm font-medium text-zinc-700">Merchant</label>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            disabled={locked}
            className={`mt-1.5 ${inputCls} disabled:bg-zinc-50 disabled:text-zinc-400`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Amount (₹)</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={locked}
            className={`mt-1.5 ${inputCls} disabled:bg-zinc-50 disabled:text-zinc-400`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={`mt-1.5 ${inputCls} resize-none`}
          />
          <button
            type="button"
            onClick={() => setDescription(expense.aiDescription)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Sparkles size={11} /> Reset to AI description
          </button>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Item link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="e.g. myntra.com/that-dress — supporters can open the exact item"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Photo (optional)</label>
          <div className="mt-1.5 flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-dashed border-zinc-300 px-4 py-3 cursor-pointer hover:bg-zinc-50 hover:border-zinc-400 transition-colors">
              <ImagePlus size={16} className="shrink-0 text-indigo-500" />
              <span className="text-sm text-zinc-600">
                <span className="font-medium text-zinc-800">
                  {shownPhoto ? "Change photo" : "Add a photo"}
                </span>
                <span className="text-zinc-400"> — the bill, or the item you&apos;re buying.</span>
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => onEditPhotoPicked(e.target.files?.[0])}
              />
            </label>
            {shownPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownPhoto} alt="" className="h-14 w-14 rounded-lg border border-zinc-200 object-cover" />
            )}
          </div>
        </div>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const fd = new FormData();
              fd.set("id", expense.id);
              fd.set("merchant", merchant);
              fd.set("amount", String(amount));
              fd.set("description", description === expense.aiDescription ? "" : description);
              fd.set("link", link);
              if (photoBlob) fd.set("billImage", photoBlob, "bill.jpg");
              await updateExpense(fd);
              onClose();
            })
          }
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
