import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Creator, Expense, ExpenseTemplate, Reimbursement } from "./types";

// Lazy init so `next build` doesn't crash before DATABASE_URL is provisioned.
let _sql: NeonQueryFunction<false, false> | null = null;
function sql(): NeonQueryFunction<false, false> {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

// Every table is a jsonb document plus the columns we filter/sort/constrain on.
// The TypeScript types in lib/types.ts stay the source of truth; the key
// columns are always rewritten from the document on save. Schema lives in
// scripts/db-setup.mjs.

const json = (v: unknown) => JSON.stringify(v);

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// ---------- creators ----------

export async function getCreatorByUsername(username: string): Promise<Creator | null> {
  const rows = await sql()`
    SELECT data FROM creators WHERE username = ${username.toLowerCase()}`;
  return (rows[0]?.data as Creator) ?? null;
}

export async function getCreatorByAuthId(authId: string): Promise<Creator | null> {
  const rows = await sql()`SELECT data FROM creators WHERE auth_id = ${authId}`;
  return (rows[0]?.data as Creator) ?? null;
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  const rows = await sql()`SELECT data FROM creators WHERE id = ${id}`;
  return (rows[0]?.data as Creator) ?? null;
}

export async function getCreatorByDeviceKey(key: string): Promise<Creator | null> {
  const rows = await sql()`SELECT data FROM creators WHERE data->>'deviceKey' = ${key}`;
  return (rows[0]?.data as Creator) ?? null;
}

export async function getCreatorByMobileToken(token: string): Promise<Creator | null> {
  const rows = await sql()`
    SELECT data FROM creators
    WHERE data->'mobileTokens' @> ${JSON.stringify([token])}::jsonb`;
  return (rows[0]?.data as Creator) ?? null;
}

export async function listCreators(): Promise<Creator[]> {
  const rows = await sql()`SELECT data FROM creators ORDER BY id DESC`;
  return rows.map((r) => r.data as Creator);
}

export async function usernameTaken(username: string, excludeAuthId?: string): Promise<boolean> {
  const rows = await sql()`
    SELECT 1 FROM creators
    WHERE username = ${username.toLowerCase()}
      AND (auth_id IS DISTINCT FROM ${excludeAuthId ?? null})`;
  return rows.length > 0;
}

/** Upsert. Throws on a username unique-constraint race — callers surface "taken". */
export async function saveCreator(c: Creator): Promise<void> {
  await sql()`
    INSERT INTO creators (id, username, auth_id, data)
    VALUES (${c.id}, ${c.username.toLowerCase()}, ${c.authId ?? null}, ${json(c)}::jsonb)
    ON CONFLICT (id) DO UPDATE
      SET username = excluded.username, auth_id = excluded.auth_id, data = excluded.data`;
}

/** Read-modify-write against the current row (not a possibly stale session copy). */
export async function updateCreator(id: string, fn: (c: Creator) => void): Promise<void> {
  const c = await getCreatorById(id);
  if (!c) return;
  fn(c);
  await saveCreator(c);
}

// ---------- expenses ----------

export async function listExpenses(creatorId: string): Promise<Expense[]> {
  const rows = await sql()`
    SELECT data FROM expenses WHERE creator_id = ${creatorId} ORDER BY date DESC`;
  return rows.map((r) => r.data as Expense);
}

export async function listPublishedExpenses(creatorId: string): Promise<Expense[]> {
  const rows = await sql()`
    SELECT data FROM expenses
    WHERE creator_id = ${creatorId} AND status = 'published'
    ORDER BY date DESC`;
  return rows.map((r) => r.data as Expense);
}

export async function getExpense(id: string): Promise<Expense | null> {
  const rows = await sql()`SELECT data FROM expenses WHERE id = ${id}`;
  return (rows[0]?.data as Expense) ?? null;
}

export async function saveExpense(e: Expense): Promise<void> {
  await sql()`
    INSERT INTO expenses (id, creator_id, status, date, data)
    VALUES (${e.id}, ${e.creatorId}, ${e.status}, ${e.date}, ${json(e)}::jsonb)
    ON CONFLICT (id) DO UPDATE
      SET status = excluded.status, date = excluded.date, data = excluded.data`;
}

export async function updateOwnedExpense(
  id: string,
  creatorId: string,
  fn: (e: Expense) => void
): Promise<void> {
  const rows = await sql()`
    SELECT data FROM expenses WHERE id = ${id} AND creator_id = ${creatorId}`;
  const e = rows[0]?.data as Expense | undefined;
  if (!e) return;
  fn(e);
  await saveExpense(e);
}

/** Deletes an owned expense and its claims; returns image URLs to clean up. */
export async function removeExpense(id: string, creatorId: string): Promise<string[]> {
  const owned = await sql()`
    DELETE FROM expenses WHERE id = ${id} AND creator_id = ${creatorId}
    RETURNING data->>'image' AS image`;
  if (owned.length === 0) return [];
  const rows = await sql()`
    DELETE FROM reimbursements WHERE expense_id = ${id}
    RETURNING data->>'proofImage' AS proof`;
  return [owned[0].image as string | null, ...rows.map((r) => r.proof as string | null)]
    .filter((p): p is string => !!p);
}

export async function countDrafts(creatorId: string): Promise<number> {
  const rows = await sql()`
    SELECT count(*)::int AS n FROM expenses
    WHERE creator_id = ${creatorId} AND status = 'draft'`;
  return rows[0].n as number;
}

// ---------- reimbursements ----------

export async function listReimbursements(creatorId: string): Promise<Reimbursement[]> {
  const rows = await sql()`
    SELECT data FROM reimbursements
    WHERE creator_id = ${creatorId} ORDER BY created_at DESC`;
  return rows.map((r) => r.data as Reimbursement);
}

export async function getOwnedReimbursement(
  id: string,
  creatorId: string
): Promise<Reimbursement | null> {
  const rows = await sql()`
    SELECT data FROM reimbursements WHERE id = ${id} AND creator_id = ${creatorId}`;
  return (rows[0]?.data as Reimbursement) ?? null;
}

export async function saveReimbursement(r: Reimbursement, creatorId: string): Promise<void> {
  await sql()`
    INSERT INTO reimbursements (id, creator_id, expense_id, status, ip_hash, created_at, data)
    VALUES (${r.id}, ${creatorId}, ${r.expenseId}, ${r.status}, ${r.ipHash ?? null},
            ${r.createdAt}, ${json(r)}::jsonb)
    ON CONFLICT (id) DO UPDATE
      SET status = excluded.status, data = excluded.data`;
}

export async function countPendingForCreator(creatorId: string): Promise<number> {
  const rows = await sql()`
    SELECT count(*)::int AS n FROM reimbursements
    WHERE creator_id = ${creatorId} AND status = 'pending'`;
  return rows[0].n as number;
}

export async function countPendingForExpense(expenseId: string): Promise<number> {
  const rows = await sql()`
    SELECT count(*)::int AS n FROM reimbursements
    WHERE expense_id = ${expenseId} AND status = 'pending'`;
  return rows[0].n as number;
}

export async function countPendingFromSender(creatorId: string, ipHash: string): Promise<number> {
  const rows = await sql()`
    SELECT count(*)::int AS n FROM reimbursements
    WHERE creator_id = ${creatorId} AND ip_hash = ${ipHash} AND status = 'pending'`;
  return rows[0].n as number;
}

export async function countVerifiedFromSender(creatorId: string, ipHash: string): Promise<number> {
  const rows = await sql()`
    SELECT count(*)::int AS n FROM reimbursements
    WHERE creator_id = ${creatorId} AND ip_hash = ${ipHash} AND status = 'verified'`;
  return rows[0].n as number;
}

export async function verifiedTotal(expenseId: string): Promise<number> {
  const rows = await sql()`
    SELECT coalesce(sum((data->>'amount')::numeric), 0)::float AS total
    FROM reimbursements WHERE expense_id = ${expenseId} AND status = 'verified'`;
  return rows[0].total as number;
}

export async function listPendingFromSender(
  creatorId: string,
  ipHash: string
): Promise<Reimbursement[]> {
  const rows = await sql()`
    SELECT data FROM reimbursements
    WHERE creator_id = ${creatorId} AND ip_hash = ${ipHash} AND status = 'pending'`;
  return rows.map((r) => r.data as Reimbursement);
}

// ---------- templates ----------

export async function listTemplates(creatorId: string): Promise<ExpenseTemplate[]> {
  const rows = await sql()`
    SELECT data FROM templates WHERE creator_id = ${creatorId} ORDER BY id`;
  return rows.map((r) => r.data as ExpenseTemplate);
}

export async function getOwnedTemplate(
  id: string,
  creatorId: string
): Promise<ExpenseTemplate | null> {
  const rows = await sql()`
    SELECT data FROM templates WHERE id = ${id} AND creator_id = ${creatorId}`;
  return (rows[0]?.data as ExpenseTemplate) ?? null;
}

export async function saveTemplate(t: ExpenseTemplate): Promise<void> {
  await sql()`
    INSERT INTO templates (id, creator_id, data)
    VALUES (${t.id}, ${t.creatorId}, ${json(t)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = excluded.data`;
}

export async function removeTemplate(id: string, creatorId: string): Promise<void> {
  await sql()`DELETE FROM templates WHERE id = ${id} AND creator_id = ${creatorId}`;
}

// ---------- maintenance ----------

/**
 * Housekeeping for one creator's claim queue, run from the dashboard layout:
 * pending claims nobody verified in 7 days auto-expire; rejected rows are
 * purged 2 days after rejection (verified rows are never purged — they back
 * progress bars and the leaderboard). Returns proof-image URLs whose rows are
 * gone so the caller can delete the blobs.
 */
export async function runMaintenance(creatorId: string): Promise<string[]> {
  // RETURNING on an UPDATE sees the new row, so grab the proof URLs first.
  const expired = await sql()`
    SELECT data->>'proofImage' AS proof FROM reimbursements
    WHERE creator_id = ${creatorId} AND status = 'pending'
      AND created_at < now() - interval '7 days'`;
  await sql()`
    UPDATE reimbursements
    SET status = 'rejected',
        data = data || jsonb_build_object(
          'status', 'rejected',
          'autoExpired', true,
          'resolvedAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ) - 'proofImage'
    WHERE creator_id = ${creatorId} AND status = 'pending'
      AND created_at < now() - interval '7 days'`;
  const purged = await sql()`
    DELETE FROM reimbursements
    WHERE creator_id = ${creatorId} AND status = 'rejected'
      AND coalesce((data->>'resolvedAt')::timestamptz, created_at) < now() - interval '2 days'
    RETURNING data->>'proofImage' AS proof`;
  return [...expired, ...purged]
    .map((r) => r.proof as string | null)
    .filter((p): p is string => !!p);
}
