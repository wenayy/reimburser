import { NextResponse } from "next/server";
import { getCreatorByDeviceKey, saveExpense, uid } from "@/lib/store";
import { resolveMerchant } from "@/lib/merchants";
import { generateDescription } from "@/lib/ai";
import { Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Companion-app capture endpoint: the phone parses a bank/UPI debit alert
 *  on-device and posts { rawText, amount, date? } here with the creator's
 *  device key. The transaction lands as a DRAFT with source "auto" — the
 *  creator publishes/hides it from the dashboard; amount and merchant are
 *  locked because they came from a real transaction. */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (key.length < 20) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creator = await getCreatorByDeviceKey(key);
  if (!creator) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!creator.preferences.autoImport)
    return NextResponse.json({ error: "auto-import disabled" }, { status: 403 });

  let body: { rawText?: unknown; amount?: unknown; date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const rawText = String(body.rawText ?? "").trim().slice(0, 200);
  const amount = Number(body.amount);
  if (!rawText || !Number.isFinite(amount) || amount <= 0 || amount > 10_00_000)
    return NextResponse.json({ error: "invalid transaction" }, { status: 400 });

  const parsedDate = body.date ? new Date(String(body.date)) : new Date();
  const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const info = resolveMerchant(rawText);
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
    // auto-publish preference decides whether review is needed
    status: creator.preferences.autoPublish ? "published" : "draft",
    source: "auto",
  };
  await saveExpense(expense);

  return NextResponse.json({ ok: true, id: expense.id, merchant: info.name, status: expense.status });
}
