import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBudgetOverview, getRecentTransactions, getSpendingByCategory } from '../api';
import { DashboardSkeleton } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';

function useDashboardData() {
  const [data, setData] = useState({ overview: null, recentTransactions: [], spending: [], overBudget: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const c = new AbortController();
    Promise.all([getBudgetOverview(), getRecentTransactions(5), getSpendingByCategory()])
      .then(([o, t, s]) => {
        if (c.signal.aborted) return;
        const over = s.data.filter((i) => parseFloat(i.available) < 0);
        setData({ overview: o.data, recentTransactions: t.data, spending: s.data.slice(0, 5), overBudget: over });
        setLoading(false);
      })
      .catch((e) => { if (!c.signal.aborted) { setError(e); setLoading(false); } });
    return () => c.abort();
  }, []);

  return { ...data, loading, error };
}

function StatCard({ label, value, trend, trendUp, accent = 'orange' }) {
  const accentColors = {
    orange: 'from-orange-500 to-amber-500',
    emerald: 'from-emerald-500 to-green-500',
    blue: 'from-blue-500 to-cyan-500',
    red: 'from-red-500 to-rose-500',
  };
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1 tabular-nums">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={trendUp ? 'M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25' : 'M4.5 4.5l15 15m0 0V8.25m0 11.25H4.5'} />
              </svg>
              {trend}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentColors[accent]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>
    </div>
  );
}

function BudgetAlert({ categories, formatCurrency }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-red-200 dark:border-red-900/50 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 p-4 animate-slide-up" role="alert">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(239,68,68,0.08),transparent_50%)]" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
          <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Over Budget Alert</h3>
          <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
            {categories.length > 1 ? `${categories.length} categories exceed their budget` : `${categories[0].category} is overspending`}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {categories.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/50 px-2.5 py-1 text-xs font-medium text-red-800 dark:text-red-200">
                {item.category} <span className="tabular-nums">{formatCurrency(item.available)}</span>
              </span>
            ))}
          </div>
        </div>
        <Link to="/budget" className="shrink-0 text-xs font-semibold text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline underline-offset-2">
          Adjust →
        </Link>
      </div>
    </div>
  );
}

function DashboardContent({ overview, recentTransactions, spending, overBudget }) {
  const { formatCurrency } = useCurrency();
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const toBeBudgeted = overview?.to_be_budgeted ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">Welcome back</p>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              {monthLabel}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-md">
              {toBeBudgeted >= 0
                ? `You have ${formatCurrency(toBeBudgeted)} ready to assign. Every dollar should have a job.`
                : 'Some categories are over budget. Review and adjust to stay on track.'}
            </p>
          </div>
          <div className="flex gap-3 self-start lg:self-auto">
            <Link to="/transactions" className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Transaction
            </Link>
            <Link to="/budget" className="btn-secondary">Review Budget</Link>
          </div>
        </div>
      </div>

      {/* Alert */}
      {overBudget.length > 0 && <BudgetAlert categories={overBudget} formatCurrency={formatCurrency} />}

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger" aria-label="Financial summary">
        <StatCard label="Ready to Assign" value={formatCurrency(toBeBudgeted)} trend={toBeBudgeted >= 0 ? '+12% from last month' : 'Over by ' + formatCurrency(Math.abs(toBeBudgeted))} trendUp={toBeBudgeted >= 0} accent="orange" />
        <StatCard label="Total Balance" value={formatCurrency(overview?.total_balance ?? 0)} trend="+3.2%" trendUp accent="emerald" />
        <StatCard label="Budgeted" value={formatCurrency(overview?.total_budgeted ?? 0)} accent="blue" />
        <StatCard label="Spent" value={formatCurrency(Math.abs(overview?.total_activity ?? 0))} trend="62% of budget" trendUp={Math.abs(overview?.total_activity ?? 0) < (overview?.total_budgeted ?? 0)} accent="red" />
      </section>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Transactions — 3 cols */}
        <div className="lg:col-span-3">
          <div className="card h-full">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Recent Transactions</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Your latest activity</p>
              </div>
              <Link to="/transactions" className="text-xs font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">View all →</Link>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-20 h-20 text-neutral-200 dark:text-neutral-700 mb-4" viewBox="0 0 80 80" fill="none">
                  <rect x="12" y="20" width="56" height="44" rx="10" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="22" y="32" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
                  <circle cx="56" cy="38" r="3" fill="currentColor" />
                  <circle cx="20" cy="72" r="5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="36" cy="74" r="5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="52" cy="71" r="5" stroke="currentColor" strokeWidth="2" />
                </svg>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No transactions yet</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">Start tracking your finances by adding your first transaction.</p>
                <Link to="/transactions" className="btn-primary mt-4">Add Your First Transaction</Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.amount >= 0;
                  return (
                    <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors group">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{tx.payee || 'No payee'}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {tx.category_name || 'Uncategorized'}
                          <span className="mx-1.5">·</span>
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <p className={`shrink-0 text-sm font-bold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Budget Progress — 2 cols */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Budget Progress</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Spending vs. budgeted</p>
              </div>
              <Link to="/reports" className="text-xs font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400">Reports →</Link>
            </div>
            {spending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-20 h-20 text-neutral-200 dark:text-neutral-700 mb-4" viewBox="0 0 80 80" fill="none">
                  <rect x="16" y="40" width="8" height="24" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="28" y="28" width="8" height="36" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="40" y="20" width="8" height="44" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="52" y="32" width="8" height="32" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M18 36l12-8 12-16 12-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No spending data</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">Set up budgets to start tracking your progress.</p>
                <Link to="/budget" className="btn-primary mt-4">Set Up Budgets</Link>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {spending.map((item, index) => {
                  const available = parseFloat(item.available);
                  const pct = parseFloat(item.budgeted) > 0 ? Math.min((parseFloat(item.spent) / parseFloat(item.budgeted)) * 100, 100) : 0;
                  const over = available < 0;
                  return (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.category}</span>
                        </div>
                        <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                          {formatCurrency(item.spent)} <span className="text-neutral-300 dark:text-neutral-600">/</span> {formatCurrency(item.budgeted)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { overview, recentTransactions, spending, overBudget, loading, error } = useDashboardData();
  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Unable to load dashboard</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{error.message}</p>
        <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  return <DashboardContent overview={overview} recentTransactions={recentTransactions} spending={spending} overBudget={overBudget} />;
}

export default Dashboard;
