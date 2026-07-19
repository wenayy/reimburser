// One-off: copy all rows from the old US database (DATABASE_URL) to the new
// Singapore one (NEONSG_DATABASE_URL). Idempotent — existing ids are skipped.
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=["']?(.*?)["']?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const src = neon(process.env.DATABASE_URL);
const dst = neon(process.env.NEONSG_DATABASE_URL);

const creators = await src`SELECT * FROM creators`;
for (const r of creators) {
  await dst`INSERT INTO creators (id, username, auth_id, data)
    VALUES (${r.id}, ${r.username}, ${r.auth_id}, ${JSON.stringify(r.data)}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
}
const expenses = await src`SELECT * FROM expenses`;
for (const r of expenses) {
  await dst`INSERT INTO expenses (id, creator_id, status, date, data)
    VALUES (${r.id}, ${r.creator_id}, ${r.status}, ${r.date}, ${JSON.stringify(r.data)}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
}
const reimb = await src`SELECT * FROM reimbursements`;
for (const r of reimb) {
  await dst`INSERT INTO reimbursements (id, creator_id, expense_id, status, ip_hash, created_at, data)
    VALUES (${r.id}, ${r.creator_id}, ${r.expense_id}, ${r.status}, ${r.ip_hash}, ${r.created_at}, ${JSON.stringify(r.data)}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
}
const templates = await src`SELECT * FROM templates`;
for (const r of templates) {
  await dst`INSERT INTO templates (id, creator_id, data)
    VALUES (${r.id}, ${r.creator_id}, ${JSON.stringify(r.data)}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
}

for (const t of ["creators", "expenses", "reimbursements", "templates"]) {
  const [s] = await src.query(`SELECT count(*)::int AS n FROM ${t}`);
  const [d] = await dst.query(`SELECT count(*)::int AS n FROM ${t}`);
  console.log(`${t}: source ${s.n} → target ${d.n}`);
}
