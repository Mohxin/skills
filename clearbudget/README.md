# ClearBudget - YNAB Style Budgeting App

A full-stack YNAB-style envelope budgeting app built with React, Supabase, and deployed on Vercel.

## Features

- 🎯 **Envelope Budgeting** — Assign every dollar a job
- 💳 **Transaction Management** — Track income & expenses across accounts
- 🏦 **Account Management** — Checking, savings, credit cards, cash
- 🎯 **Goals Tracking** — Savings targets with progress tracking
- 📊 **Reports & Charts** — Pie charts, bar graphs, spending trends
- 🌙 **Dark Mode** — Toggle or auto-detect from system preference
- 💱 **Multi-Currency** — 20 currencies supported
- 📱 **Responsive** — Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> clearbudget
cd clearbudget
npm install
cd frontend && npm install && cd ..
```

### 2. Set Up Supabase

1. Go to your Supabase SQL Editor
2. Paste contents of `backend/src/db/migrate.sql` and click Run
3. This creates all tables and disables Row Level Security

### 3. Set Environment Variables

```bash
# Root .env (for Vercel API routes)
cp .env.example .env
# Fill in your Supabase URL and keys

# Frontend .env (for client-side)
cp frontend/.env.example frontend/.env
# Fill in Supabase URL and anon key
```

### 4. Run Locally

```bash
# Option A: Frontend only (uses Supabase directly)
cd frontend && npm run dev

# Option B: Full stack (frontend + local Express backend)
cd backend && npm install && npm run dev
# In another terminal:
cd frontend && npm run dev
```

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Required Environment Variables (Vercel)

Add these in Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (for serverless API) |

## Project Structure

```
clearbudget/
├── api/
│   └── index.js              # Vercel serverless API (all routes)
├── frontend/
│   ├── src/
│   │   ├── components/       # Sidebar, Modal, Toast, Skeleton
│   │   ├── context/          # Currency context (20 currencies)
│   │   ├── pages/            # Dashboard, Budget, Transactions, etc.
│   │   ├── api.js            # Axios API client
│   │   ├── App.jsx           # Main app with routing + dark mode
│   │   └── main.jsx          # Entry point
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/                   # Local Express (dev only)
├── vercel.json
└── package.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create account |
| PUT | `/api/accounts?id=1` | Update account |
| DELETE | `/api/accounts?id=1` | Delete account |
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions?id=1` | Update transaction |
| DELETE | `/api/transactions?id=1` | Delete transaction |
| GET | `/api/categories/groups` | Category groups with categories |
| PUT | `/api/categories/1/budget` | Update category budget |
| GET | `/api/goals` | List all goals |
| POST | `/api/goals` | Create goal |
| POST | `/api/goals/1/contribute` | Add to goal |
| GET | `/api/reports/overview` | Budget overview |
| GET | `/api/reports/spending-by-category` | Monthly spending |
| GET | `/api/reports/monthly-trends` | 6-month trends |

## Supported Currencies

USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL, MXN, SGD, NZD, SEK, NOK, DKK, ZAR, AED, SAR, KRW
