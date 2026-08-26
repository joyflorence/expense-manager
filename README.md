# OmniTrack Cashbook

Personal cashbook for recording Ugandan Shilling inflows, expenses, transfers, budgets, savings, debts, and repayments. The React app is hosted on Netlify and persists its data in Neon Postgres through a Netlify Function.

## Deploy to Netlify

1. Create a Neon project and enable **Auth** for its production branch. Copy the Auth URL from **Auth → Configuration**.
2. In **Settings → RLS**, configure Neon RLS with the JWKS URL displayed on the Auth configuration page. Use the `authenticated` database connection string for `DATABASE_URL`.
3. In Neon SQL Editor, run [`db/migrations/0001_cashbook_records.sql`](db/migrations/0001_cashbook_records.sql), [`db/migrations/0002_auth_and_row_security.sql`](db/migrations/0002_auth_and_row_security.sql), [`db/migrations/0003_transfer_kind.sql`](db/migrations/0003_transfer_kind.sql), and [`db/migrations/0004_ownership_hardening.sql`](db/migrations/0004_ownership_hardening.sql).
   If the table already contains rows from before Auth was enabled, inspect `owner_user_id IS NULL` rows and assign each one to the correct authenticated user's ID before validating the `cashbook_records_owner_required` constraint and making the column `NOT NULL`.
4. Import this Git repository into Netlify. Its build settings are already defined in [`netlify.toml`](netlify.toml).
5. In **Netlify → Site configuration → Environment variables**, add:
   - `DATABASE_URL`: the Neon connection string.
   - `VITE_NEON_AUTH_URL`: the Neon Auth URL. This is intentionally public browser configuration.
6. In Neon Console → Auth → Configuration → Domains, add every exact browser origin used by the app, including the Netlify production URL and any custom domain. Use `https://...` with no trailing slash. An `Invalid origin` error means the current `window.location.origin` is missing from this list. Configure email delivery if you require email verification or password reset emails.
7. Deploy. Netlify uses Node 20 and runs `npm install && npm run build`.

The Neon JS SDK is pinned to `0.1.0-beta.21` because this project uses its `BetterAuthReactAdapter`. If Netlify or Vercel previously built a different dependency tree, trigger a clean deploy after this pin so the browser does not keep an old Auth bundle.

Every cashbook record is now protected by Neon Auth identity and a Neon Row-Level Security policy. Each user can only read and change their own records.

## Optional local development

Install Node 20+ and run:

```powershell
npm install
npm run dev
```

For local access, set `DATABASE_URL` in `.env.local`.

## Deploy to Vercel

1. Import this repository into Vercel. The included [`vercel.json`](vercel.json) builds the Vite app and routes `/api/state` and `/api/records` through [`api/[...path].ts`](api/[...path].ts).
2. Add these Vercel environment variables for the Production, Preview, and Development environments as needed:
   - `DATABASE_URL`: the authenticated Neon connection string for the same branch as Auth.
   - `VITE_NEON_AUTH_URL`: the Neon Auth Base URL.
3. Add the Vercel deployment origin to Neon Console → Auth → Configuration → Domains. Add the custom domain separately if you use one.
4. Run migrations `0001` through `0004` on the same Neon branch before using the cashbook API.
