# Reimburser — MVP

Creators share daily expenses transparently; supporters voluntarily cover them by paying the
creator **directly** (UPI, PayPal, Wise, Amazon.in gift cards, crypto). The platform never
touches money — it's a display + link-out layer, which is what makes it viable to run solo
without company registration or a payment aggregator license.

## Run it

```bash
npm install
npm run dev
```

- `/` — landing page
- `/riya` — example public page (no login)
- `/signup` — create an account (Clerk: Google / X / email) → onboarding
  (claim username → profile → payment methods)
- `/dashboard` — creator dashboard (requires login)

Auth is **Auth.js (NextAuth v5)** with Google and X sign-in — JWT sessions, no user cap,
no auth database. Config is `auth.ts` at the repo root; the seam is `lib/auth.ts`; the
local creator record is linked via `authId` (`"<provider>:<providerAccountId>"`) and
created during onboarding. Required env: `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`, `AUTH_TWITTER_ID`, `AUTH_TWITTER_SECRET`. OAuth callback URLs are
`<origin>/api/auth/callback/google` and `<origin>/api/auth/callback/twitter`.

Data lives in **Neon Postgres** (`DATABASE_URL`) and uploads in **Vercel Blob**
(`BLOB_READ_WRITE_TOKEN`), both provisioned through the Vercel project — run
`vercel env pull .env.local` to get the values locally, then `npm run db:setup` once
to create the schema and seed the /riya demo page.

## What's implemented

- **Public page** (`/[username]`): expense cards with merchant logo, amount, AI description,
  progress bar, remaining amount, supporters, status pill, and a "Cover this" flow —
  amount → pick payment method → UPI QR / deep link / PayPal link / copyable details →
  "I've sent it" with optional proof reference.

  Wording note: visitor-facing copy says **cover / support / contribution** (a stranger won't
  "reimburse" someone they don't owe). "Reimbursement" survives only in internal code
  (`Reimbursement` type, actions, store).
- **Dashboard**: analytics (today / total / covered / remaining / supporters / top merchant,
  6-month chart, recent activity), expense manager (tabs, publish / hide / edit / delete,
  manual add with publish/draft/hidden visibility), support verification (verify / reject
  pending contributions, blurred-until-clicked proof images), settings (profile with photo
  upload, payment methods with enable toggles, publishing preferences, one-click share link).
  Fully covered expenses accept repeat covers and show a "Fully covered N×" count.
- **"AI" descriptions**: deterministic template engine in `lib/ai.ts` so the app runs with zero
  API keys. The file header shows the one-function swap to a real LLM via Vercel AI Gateway.
- **Merchant logos**: Google favicon service by domain, graceful fallback to category emoji.

## v0.2 status

- [x] Proof screenshot upload — supporters attach a payment screenshot in the "I've sent it"
      step; files are stored in Vercel Blob (public URLs); the creator sees the thumbnail on
      the Support page when verifying, and the blob is deleted once the claim is resolved.
- [x] Partial contribution quick-picks (25% / 50% / Full) in the payment modal.
- [x] Real auth + multi-creator: signup, login, logout, per-creator data scoping and
      ownership checks in every action, onboarding wizard. In-house email/password → Clerk →
      **Auth.js (NextAuth v5)**, Google + X; `lib/auth.ts` stayed the seam through both swaps.
- [x] Rate limiting + spam protection on the public contribution endpoint: 5 submissions
      per 10 min per salted-hashed IP (in-memory per instance — see Later), plus upload
      validation (image-type allowlist, 5 MB cap) and DB-backed pending-claim caps.
- [x] Swapped `data/db.json` for Neon Postgres (via Vercel Marketplace): `lib/store.ts` is now
      an async repository (jsonb documents + indexed key columns; types in `lib/types.ts` stay
      the source of truth). Uploads moved to Vercel Blob; schema + demo seed live in
      `scripts/db-setup.mjs` (`npm run db:setup`, idempotent).

## Security model

- **Ownership**: every mutating action re-derives the creator from the Clerk session and
  scopes queries by `creator_id` — foreign IDs match zero rows.
- **Progress is verified-only**: strangers can only create *pending* claims (capped: 3 per
  sender, 10 per expense, auto-expired after 7 days); nothing counts until the owner verifies.
- **Public page allowlist**: `/[username]` passes only the `Public*` DTO types
  (`lib/types.ts`) to client components — the full Creator/Reimbursement objects (email,
  gift codes, proof URLs, IP hashes) never enter the serialized page payload.
- **UPI protection** (default on, Settings toggle): a creator's UPI ID is shown only to
  senders with `UPI_TRUST_THRESHOLD` (3) verified payments with that creator; enforced again
  inside `submitReimbursement`, and skipped when UPI is the creator's only method. The
  claimed payment method must be one the creator actually offers.
- **Proof uploads**: image-type allowlist, 5 MB cap, the "allow proof" preference is
  enforced server-side, and blobs are deleted when claims resolve.

## Later

1. Real transaction import: Gmail API (bank alert emails) or an Android SMS-forwarder app —
   parse merchant + amount and create draft expenses (the "Auto-import" preference in
   Settings gates this pipeline; the fake demo sync button was removed).
2. Real AI descriptions via AI Gateway (see `lib/ai.ts`).
   Bill scanning (photo → auto-filled merchant/amount) was prototyped with
   `generateObject` + `google/gemini-2.5-flash` and works — parked for v1 because
   AI Gateway needs a credit card on the Vercel account. Restore from git history
   (`lib/scan.ts`, `scanBill` action) when ready.
3. Durable rate limiting (Redis/Upstash) — the current in-memory limiter resets on restart.
