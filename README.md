# 🤖 Topgee Bots — Trading Platform

A professional investment/trading platform built with Next.js 14, Supabase, and TradingView.

## Features

- 🔐 **Auth** — Email/password signup & login
- 📊 **Dashboard** — Live XAUUSD TradingView chart, portfolio stats
- 💰 **Deposits** — EasyPaisa, JazzCash, Bank Transfer, USDT with proof upload
- 💸 **Withdrawals** — Request withdrawals with account details
- 👑 **Admin Panel** — Approve/reject deposits & withdrawals, distribute profit, adjust balances

---

## Setup Guide

### 1. Clone & Install

```bash
cd topgee-bots
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for it to initialize

### 3. Run Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Paste the contents of `supabase-migration.sql`
3. Click **Run**

### 4. Get Your API Keys

In Supabase go to **Settings → API**:
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials.

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Make Yourself Admin

After creating your account, go to Supabase **SQL Editor** and run:

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'your@email.com';
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

---

## Platform Structure

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/auth/login` | Login |
| `/auth/signup` | Signup |
| `/dashboard` | Main dashboard with chart |
| `/dashboard/deposit` | Deposit funds |
| `/dashboard/withdraw` | Withdraw funds |
| `/admin` | Admin panel (admins only) |

---

## Customization

- **Payment Details** — Update in `app/dashboard/deposit/page.tsx` (EasyPaisa number, USDT wallet, etc.)
- **Logo/Branding** — Search for "Topgee Bots" across files
- **Stats on Landing Page** — Edit `app/page.tsx`
- **Chart Symbol** — Change `OANDA:XAUUSD` in `components/TradingViewChart.tsx`
