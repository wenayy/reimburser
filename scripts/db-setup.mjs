// One-time database setup: creates the schema and seeds the /riya demo page
// the landing page links to. Idempotent — safe to re-run.
//
//   npm run db:setup
//
// Needs DATABASE_URL (pull it with `vercel env pull .env.local`).

import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

// only Next.js auto-loads .env.local; plain node scripts must do it themselves
if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=["']?(.*?)["']?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log("Creating schema…");
await sql`
  CREATE TABLE IF NOT EXISTS creators (
    id text PRIMARY KEY,
    username text UNIQUE NOT NULL,
    auth_id text UNIQUE,
    data jsonb NOT NULL
  )`;

// migrate databases created in the Clerk era: rename the id column and drop
// creator rows tied to Clerk identities (Auth.js ids are "<provider>:<sub>",
// so those rows can never log in again)
const cols = await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name = 'creators'`;
const names = cols.map((c) => c.column_name);
if (names.includes("clerk_id") && !names.includes("auth_id")) {
  console.log("Migrating clerk_id → auth_id…");
  await sql`ALTER TABLE creators RENAME COLUMN clerk_id TO auth_id`;
}
const orphans = await sql`
  SELECT id, username FROM creators WHERE auth_id LIKE 'user_%'`;
for (const o of orphans) {
  console.log(`Removing Clerk-era creator @${o.username} (cannot log in anymore)…`);
  await sql`DELETE FROM reimbursements WHERE creator_id = ${o.id}`;
  await sql`DELETE FROM expenses WHERE creator_id = ${o.id}`;
  await sql`DELETE FROM templates WHERE creator_id = ${o.id}`;
  await sql`DELETE FROM creators WHERE id = ${o.id}`;
}
await sql`
  CREATE TABLE IF NOT EXISTS expenses (
    id text PRIMARY KEY,
    creator_id text NOT NULL,
    status text NOT NULL,
    date timestamptz NOT NULL,
    data jsonb NOT NULL
  )`;
await sql`CREATE INDEX IF NOT EXISTS expenses_creator_idx ON expenses (creator_id, date DESC)`;
await sql`
  CREATE TABLE IF NOT EXISTS reimbursements (
    id text PRIMARY KEY,
    creator_id text NOT NULL,
    expense_id text NOT NULL,
    status text NOT NULL,
    ip_hash text,
    created_at timestamptz NOT NULL,
    data jsonb NOT NULL
  )`;
await sql`CREATE INDEX IF NOT EXISTS reimb_creator_idx ON reimbursements (creator_id, created_at DESC)`;
await sql`CREATE INDEX IF NOT EXISTS reimb_expense_idx ON reimbursements (expense_id)`;
await sql`
  CREATE TABLE IF NOT EXISTS templates (
    id text PRIMARY KEY,
    creator_id text NOT NULL,
    data jsonb NOT NULL
  )`;
await sql`CREATE INDEX IF NOT EXISTS templates_creator_idx ON templates (creator_id)`;

console.log("Seeding demo creator /riya…");

const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString();

const creator = {
  id: "c1",
  username: "riya",
  email: "demo@example.com",
  onboarded: true,
  displayName: "Riya Sharma",
  bio: "I make free web-development tutorials on YouTube. Every rupee I spend on work shows up here — if a video saved you time, cover a coffee or a cab ride. ☕",
  avatarEmoji: "🧑‍💻",
  paymentMethods: [
    { id: "pm1", type: "upi", label: "UPI", value: "riya@okhdfcbank", enabled: true },
    { id: "pm2", type: "paypal", label: "PayPal", value: "https://paypal.me/riyasharma", enabled: true },
    { id: "pm3", type: "wise", label: "Wise", value: "demo@example.com", enabled: true },
    { id: "pm4", type: "amazon_gc", label: "Amazon.in Gift Card", value: "demo@example.com", enabled: true },
    {
      id: "pm5",
      type: "crypto",
      label: "USDC (Polygon)",
      value: "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b",
      details: { address: "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b", network: "Polygon", coin: "USDC" },
      enabled: false,
    },
  ],
  preferences: { autoImport: true, autoPublish: false, allowProofUpload: true, showLeaderboard: true, protectUpi: true },
};

const mk = (id, rawText, merchant, domain, category, amount, hrs, status, description, source = "auto") => ({
  id,
  creatorId: "c1",
  merchant,
  rawText,
  merchantDomain: domain,
  category,
  amount,
  date: hoursAgo(hrs),
  aiDescription: description,
  status,
  source,
});

const expenses = [
  mk("e1", "STARBUCKS STORE 98231", "Starbucks", "starbucks.com", "Coffee", 420, 4, "published",
    "Afternoon coffee at Starbucks — fuel for the edit on today's video."),
  mk("e2", "UBER INDIA SYSTEMS", "Uber", "uber.com", "Transport", 284, 7, "published",
    "Uber to a shoot location — camera bag and all."),
  mk("e3", "SWIGGY*ORDER 8812734", "Swiggy", "swiggy.com", "Food", 512, 26, "published",
    "Late-night Swiggy order while rendering the week's upload."),
  mk("e4", "OPENAI *CHATGPT SUBSCR", "OpenAI", "openai.com", "Software", 1999, 50, "published",
    "Monthly OpenAI subscription — script drafts and code review for tutorials."),
  mk("e5", "BLINKIT COMMERCE", "Blinkit", "blinkit.com", "Groceries", 867, 74, "published",
    "Blinkit grocery run to keep the desk snacks stocked."),
  mk("e6", "NETFLIX.COM", "Netflix", "netflix.com", "Subscription", 649, 120, "published",
    "Netflix — research for the 'how streaming UIs are built' series, honest."),
  mk("e7", "AMAZON PAY INDIA 44121", "Amazon", "amazon.in", "Shopping", 2450, 96, "hidden",
    "New desk lamp and cable organizers from Amazon."),
  mk("e8", "APOLLO PHARMACY 2231", "Apollo Pharmacy", undefined, "Other", 340, 30, "hidden",
    "Pharmacy run at Apollo.", "manual"),
  mk("e9", "ZOMATO LTD ORDER 99231", "Zomato", "zomato.com", "Food", 389, 2, "draft",
    "Lunch from Zomato between recording takes."),
  mk("e10", "VERCEL INC.", "Vercel", "vercel.com", "Software", 1660, 1, "draft",
    "Vercel hosting for the tutorial demo sites."),
];

const reimbursements = [
  { id: "r1", expenseId: "e1", supporterName: "Alex", amount: 300, methodType: "upi", status: "verified", createdAt: hoursAgo(3) },
  { id: "r2", expenseId: "e2", supporterName: "Anonymous", amount: 284, methodType: "upi", status: "verified", createdAt: hoursAgo(5) },
  { id: "r3", expenseId: "e4", supporterName: "Sarah", amount: 1000, methodType: "paypal", note: "Love your tutorials!", status: "verified", createdAt: hoursAgo(40) },
  { id: "r4", expenseId: "e4", supporterName: "Dev", amount: 500, methodType: "amazon_gc", status: "pending", proofNote: "Sent GC to your email, order #403-991", createdAt: hoursAgo(12) },
  { id: "r5", expenseId: "e3", supporterName: "Priya", amount: 200, methodType: "upi", status: "verified", createdAt: hoursAgo(20) },
  { id: "r6", expenseId: "e6", supporterName: "Anonymous", amount: 649, methodType: "wise", status: "verified", createdAt: hoursAgo(100) },
];

await sql`
  INSERT INTO creators (id, username, auth_id, data)
  VALUES (${creator.id}, ${creator.username}, ${null}, ${JSON.stringify(creator)}::jsonb)
  ON CONFLICT (id) DO NOTHING`;
for (const e of expenses) {
  await sql`
    INSERT INTO expenses (id, creator_id, status, date, data)
    VALUES (${e.id}, ${e.creatorId}, ${e.status}, ${e.date}, ${JSON.stringify(e)}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
}
for (const r of reimbursements) {
  await sql`
    INSERT INTO reimbursements (id, creator_id, expense_id, status, ip_hash, created_at, data)
    VALUES (${r.id}, ${"c1"}, ${r.expenseId}, ${r.status}, ${null}, ${r.createdAt}, ${JSON.stringify(r)}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
}

const [{ n }] = await sql`SELECT count(*)::int AS n FROM creators`;
console.log(`Done. ${n} creator(s) in the database.`);
