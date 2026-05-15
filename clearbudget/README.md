# ClearBudget — YNAB Style Budgeting App

A modern, full-featured envelope budgeting app built with React, Supabase, and deployed on Vercel.

## ✨ Features

### 💰 Budgeting
- 🎯 **Envelope Budgeting** — Give every dollar a job
- 📅 **Monthly Rollover** — Unspent money carries forward
- ⚠️ **Over-Budget Alerts** — Real-time warnings on dashboard
- 📊 **Category Groups** — Organized budget categories

### 💳 Transactions
- ➕ **Quick Add** — Fast transaction entry
- 🔍 **Search & Filter** — By payee, category, account
- 📥 **CSV Export** — Download your data anytime
- 🏷️ **Tags** — Organize transactions with custom tags
- ✏️ **Full CRUD** — Edit, delete, clear transactions

### 🔄 Recurring Bills
- 📋 **Bill Tracker** — Never miss a payment
- 📆 **Multiple Frequencies** — Weekly, bi-weekly, monthly, yearly
- ⏭️ **Skip Forward** — Advance to next occurrence
- 🔇 **Enable/Disable** — Toggle without deleting
- 📊 **Monthly Summary** — Total recurring costs

### 🎯 Goals
- 🏔️ **Savings Targets** — Track progress visually
- 💵 **Contributions** — Add money incrementally
- 📅 **Target Dates** — Set deadlines for your goals
- 📈 **Progress Bars** — See how close you are

### 💱 Multi-Currency
- 🌍 **20 Currencies** — USD, EUR, GBP, JPY, CAD, AUD, and more
- 💾 **Persistent** — Your choice is saved
- 🔄 **Auto-Format** — Correct locale formatting

### 🌙 Modern UI
- 🎨 **Dark Mode** — Toggle or auto-detect from system
- 📱 **Responsive** — Mobile, tablet, desktop
- ✨ **Smooth Animations** — Page transitions, staggered cards
- ♿ **Accessible** — ARIA labels, keyboard navigation, focus trapping
- 🔔 **Toast Notifications** — Success/error feedback

### 📊 Insights & Reports
- 🧠 **Spending Insights** — Top merchants, daily average, projected spend
- 🥧 **Pie Charts** — Spending by category
- 📊 **Bar Charts** — Monthly spending trends
- 📋 **Summary Tables** — Budget vs actual with percentages

### 🏦 Accounts
- 💼 **Multiple Types** — Checking, savings, credit, cash
- 💎 **Net Worth** — Automatic calculation
- 🎨 **Colored Icons** — Visual distinction

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Set up Supabase (run SQL in backend/src/db/migrate.sql)

# Optional: clear all app data while keeping the tables
cd backend && npm install && npm run db:clear

# Start dev server
cd frontend && npm run dev
```

## 🔌 Use Real Data

ClearBudget reads and writes to Supabase through the backend API. To use your own real data:

1. Create a Supabase project.
2. Run `backend/src/db/migrate.sql` in the Supabase SQL Editor.
3. Create `backend/.env` with:

```bash
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Run `npm run db:clear` if you want empty tables before importing real data.
5. Start the backend and frontend:

```bash
cd backend && npm run start
cd ../frontend && npm run dev
```

6. Add your real accounts, categories, transactions, recurring bills, and goals from the app UI.

For deployment, add the same Supabase environment variables in Vercel. The frontend uses `/api` in production, so it will talk to the deployed serverless API automatically.

## 📦 Deploy to Vercel

```bash
npx vercel
```

Add these environment variables in Vercel:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

## 📁 Project Structure

```
clearbudget/
├── api/index.js              # Vercel serverless API (all routes)
├── frontend/
│   ├── src/
│   │   ├── components/       # Sidebar, Modal, Toast, Skeleton
│   │   ├── context/          # Currency context
│   │   ├── hooks/            # Custom hooks (keyboard shortcuts)
│   │   ├── pages/            # 8 pages
│   │   ├── api.js            # API client
│   │   └── App.jsx           # Main app
│   └── package.json
├── backend/
│   └── src/db/
│       ├── migrate.sql       # Database schema
│       └── clear-data.js     # Clears app data while keeping tables
├── vercel.json
└── package.json
```

## 🔑 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/accounts` | Account CRUD |
| GET/POST | `/api/transactions` | Transaction CRUD |
| GET/POST | `/api/categories/groups` | Category groups |
| GET/POST/PUT/DELETE | `/api/recurring` | Recurring bills |
| GET/POST/PUT/DELETE | `/api/goals` | Goals CRUD |
| GET | `/api/reports/overview` | Budget overview |
| GET | `/api/reports/insights` | Spending insights |
| GET | `/api/reports/spending-by-category` | Monthly spending |
| GET | `/api/reports/monthly-trends` | 6-month trends |

## 🌍 Supported Currencies

USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL, MXN, SGD, NZD, SEK, NOK, DKK, ZAR, AED, SAR, KRW
