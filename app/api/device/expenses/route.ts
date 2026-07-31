import { NextResponse } from "next/server";
import { getCreatorByDeviceKey, getCreatorByMobileToken, saveExpense, findRecentAutoDuplicate, uid } from "@/lib/store";
import { parseBankAlert } from "@/lib/bank-alert";
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

  // the native app authenticates with its login token (mob_…); the legacy
  // companion utility uses a device key — accept either
  const creator = key.startsWith("mob_")
    ? await getCreatorByMobileToken(key)
    : await getCreatorByDeviceKey(key);
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

  // one payment can raise two alerts (the UPI/wallet app AND the bank both
  // notify) — if we already captured this amount moments ago, don't duplicate it
  const dup = await findRecentAutoDuplicate(creator.id, amount, date);
  if (dup) {
    // same payment, second alert. If the one we kept is the generic "Payment"
    // fallback but this alert resolved a real merchant, upgrade it in place —
    // so the result is the same regardless of which alert arrived first.
    const better = parseBankAlert(rawText, amount);
    if (dup.merchant === "Payment" && better.merchant !== "Payment") {
      dup.merchant = better.merchant;
      dup.category = better.category;
      dup.merchantDomain = better.merchantDomain;
      dup.rawText = better.rawText;
      dup.aiDescription = generateDescription(better.merchant, better.category, amount, date);
      await saveExpense(dup);
    }
    return NextResponse.json({ ok: true, id: dup.id, merchant: dup.merchant, status: dup.status, deduped: true });
  }

  // clean the alert: resolve the recipient to a brand / shop / friend, never a
  // raw UPI id, and produce a readable line — all in one place
  const alert = parseBankAlert(rawText, amount);

  const expense: Expense = {
    id: uid("e"),
    creatorId: creator.id,
    merchant: alert.merchant,
    rawText: alert.rawText,
    merchantDomain: alert.merchantDomain,
    category: alert.category,
    amount,
    date: date.toISOString(),
    aiDescription: generateDescription(alert.merchant, alert.category, amount, date),
    // auto-publish preference decides whether review is needed
    status: creator.preferences.autoPublish ? "published" : "draft",
    source: "auto",
  };
  await saveExpense(expense);

  return NextResponse.json({
    ok: true,
    id: expense.id,
    merchant: alert.merchant,
    status: expense.status,
  });
}
