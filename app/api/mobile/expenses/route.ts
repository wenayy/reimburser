import { NextResponse } from "next/server";
import { creatorFromBearer } from "@/lib/mobile-auth";
import { listExpenses, listReimbursements, saveExpense, uid } from "@/lib/store";
import { resolveMerchant } from "@/lib/merchants";
import { generateDescription } from "@/lib/ai";
import { Expense, ExpenseStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET — the creator's expenses, each with how much has been covered so far. */
export async function GET(req: Request) {
  const creator = await creatorFromBearer(req);
  if (!creator) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [expenses, reimbursements] = await Promise.all([
    listExpenses(creator.id),
    listReimbursements(creator.id),
  ]);
  const coveredBy = new Map<string, number>();
  for (const r of reimbursements) {
    if (r.status === "verified")
      coveredBy.set(r.expenseId, (coveredBy.get(r.expenseId) ?? 0) + r.amount);
  }

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      merchant: e.merchant,
      amount: e.amount,
      description: e.customDescription ?? e.aiDescription,
      category: e.category,
      merchantDomain: e.merchantDomain ?? null,
      image: e.image ?? null,
      status: e.status,
      source: e.source,
      date: e.date,
      covered: coveredBy.get(e.id) ?? 0,
    })),
  });
}

/** POST { rawText, amount, description?, status? } — add a manual expense. */
export async function POST(req: Request) {
  const creator = await creatorFromBearer(req);
  if (!creator) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { rawText?: unknown; amount?: unknown; description?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawText = String(body.rawText ?? "").trim().slice(0, 200);
  const amount = Number(body.amount);
  if (!rawText || !Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: "invalid" }, { status: 400 });

  const requested = String(body.status ?? "published") as ExpenseStatus;
  const status: ExpenseStatus = ["published", "draft", "hidden"].includes(requested)
    ? requested
    : "published";
  const description = String(body.description ?? "").trim().slice(0, 280);

  const info = resolveMerchant(rawText);
  const date = new Date();
  const expense: Expense = {
    id: uid("e"),
    creatorId: creator.id,
    merchant: info.name,
    rawText,
    merchantDomain: info.domain,
    category: info.category,
    amount,
    date: date.toISOString(),
    aiDescription: generateDescription(info.name, info.category, amount, date),
    customDescription: description || undefined,
    status,
    source: "manual",
  };
  await saveExpense(expense);
  return NextResponse.json({ ok: true, id: expense.id });
}
