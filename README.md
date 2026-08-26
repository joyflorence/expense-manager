# OmniTrack Cashbook

Personal cashbook for recording Ugandan Shilling inflows, expenses, transfers, budgets, savings, debts, and repayments. The React app is hosted on Netlify and persists its data in Neon Postgres through a Netlify Function.

## Deploy to Netlify

1. Create a Neon project and copy its pooled connection string.
2. In Neon SQL Editor, run [`db/migrations/0001_cashbook_records.sql`](db/migrations/0001_cashbook_records.sql).
3. Import this Git repository into Netlify. Its build settings are already defined in [`netlify.toml`](netlify.toml).
4. In **Netlify → Site configuration → Environment variables**, add:
   - `DATABASE_URL`: the Neon connection string.
5. Deploy. Netlify uses Node 20 and runs `npm install && npm run build`.

This is a single-user setup without authentication. Keep the Netlify site URL private; anyone who can reach the site's API endpoint can read or change the cashbook data.

## Optional local development

Install Node 20+ and run:

```powershell
npm install
npm run dev
```

For local access, set `DATABASE_URL` in `.env.local`.
