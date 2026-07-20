import { NextResponse } from "next/server";
import { creatorFromBearer } from "@/lib/mobile-auth";
import { removeExpense, updateOwnedExpense } from "@/lib/store";
import { deleteUpload } from "@/lib/uploads";
import { ExpenseStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** PATCH { status?, merchant?, amount?, description? } — publish/hide/edit.
 *  Auto-captured expenses keep their amount locked (verified-spend guarantee). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const creator = await creatorFromBearer(req);
  if (!creator) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { status?: unknown; merchant?: unknown; amount?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  await updateOwnedExpense(id, creator.id, (e) => {
    if (body.status !== undefined) {
      const s = String(body.status) as ExpenseStatus;
      if (["published", "draft", "hidden"].includes(s)) e.status = s;
    }
    if (body.merchant !== undefined) {
      const m = String(body.merchant).trim();
      if (m) e.merchant = m;
    }
    // amount is immutable for auto-captured (real transaction) expenses
    if (body.amount !== undefined && e.source !== "auto") {
      const a = Number(body.amount);
      if (Number.isFinite(a) && a > 0) e.amount = a;
    }
    if (body.description !== undefined) {
      e.customDescription = String(body.description).trim().slice(0, 280) || undefined;
    }
  });

  return NextResponse.json({ ok: true });
}

/** DELETE — remove an expense and clean up any attached images. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const creator = await creatorFromBearer(req);
  if (!creator) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const orphaned = await removeExpense(id, creator.id);
  for (const url of orphaned) await deleteUpload(url);
  return NextResponse.json({ ok: true });
}
