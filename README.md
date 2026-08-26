# OmniTrack Cashbook

Personal cashbook for recording Ugandan Shilling inflows, expenses, transfers, budgets, savings, debts, and repayments. The React app is powered by **Supabase** (Supabase Auth and PostgreSQL database with Row-Level Security).

## Setup Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard and run [`db/migrations/0001_supabase_setup.sql`](db/migrations/0001_supabase_setup.sql).
   - This creates the `cashbook_records` table, triggers, and Row-Level Security policies ensuring each authenticated user only has access to their own data.
3. In **Project Settings → API**, copy your:
   - **Project URL** (`https://<project-id>.supabase.co`)
   - **anon / public key**

## Deploy to Netlify / Vercel

In your hosting dashboard (Netlify or Vercel), add the following environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase public anon key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase public anon key

### Local Development

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.
2. Install dependencies and start the dev server:

```powershell
npm install
npm run dev
```
