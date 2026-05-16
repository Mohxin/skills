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
- 📥 **Bank File Import** — Import Excel or CSV exports from Handelsbanken and common bank formats
- 🧠 **Smart Categorization** — Automatically suggests categories for imported merchants and learns from existing data
- ✅ **Statement Reconciliation** — Optionally update account balances only when statement start/end balances match the imported total
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
- 💎 **Net Worth** — Calculated from the latest account balance snapshots
- 🧾 **Manual Balance Snapshots** — Keep balances aligned with your real bank account without requiring bank API access
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

6. Add your real accounts with their current balances.
7. Import transactions from bank exports, or add transactions manually.

For deployment, add the same Supabase environment variables in Vercel. The frontend uses `/api` in production, so it will talk to the deployed serverless API automatically.

## 📥 Import Bank Files

ClearBudget is designed to work even when direct bank integrations are unavailable. Export transactions from your bank as Excel or CSV, then import them from the Transactions page.

Supported import behavior:

- Reads Excel (`.xlsx`, `.xls`) and CSV/TXT files.
- Supports Handelsbanken exports and common columns such as date, description/text, amount, debit, and credit.
- Lets you choose the destination account before importing.
- Suggests categories automatically for merchants such as grocery stores, transit, utilities, subscriptions, donations, and transfers.
- Lets you manually adjust categories in the preview before saving.

### Balance Handling

Imported transactions do not automatically change an account balance by adding the transaction total. This prevents partial exports from making the balance wrong.

Use this workflow instead:

1. Set the real current balance on the Accounts page when you create or edit an account.
2. Import transaction files to build your spending history.
3. If your import covers a full statement period, enter:
   - Statement start balance
   - Statement end balance
4. ClearBudget calculates:

```text
expected end balance = statement start balance + imported transaction total
```

5. The app unlocks "Set account balance to statement end balance" only when the expected end balance matches the statement end balance within 0.01.

If the numbers do not match, the import is still useful for transaction history, but the account balance stays unchanged.

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
| POST | `/api/transactions/import` | Import bank file rows with optional statement reconciliation |
| GET/POST | `/api/categories/groups` | Category groups |
| GET/POST/PUT/DELETE | `/api/recurring` | Recurring bills |
| GET/POST/PUT/DELETE | `/api/goals` | Goals CRUD |
| GET | `/api/reports/overview` | Budget overview |
| GET | `/api/reports/insights` | Spending insights |
| GET | `/api/reports/spending-by-category` | Monthly spending |
| GET | `/api/reports/monthly-trends` | 6-month trends |

## 🌍 Supported Currencies

USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL, MXN, SGD, NZD, SEK, NOK, DKK, ZAR, AED, SAR, KRW
