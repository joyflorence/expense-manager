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
6. In Neon Auth configuration, add your Netlify production URL to the allowed redirect domains and configure email delivery if you require email verification or password reset emails.
7. Deploy. Netlify uses Node 20 and runs `npm install && npm run build`.

Every cashbook record is now protected by Neon Auth identity and a Neon Row-Level Security policy. Each user can only read and change their own records.

## Optional local development

Install Node 20+ and run:

```powershell
npm install
npm run dev
```

For local access, set `DATABASE_URL` in `.env.local`.
