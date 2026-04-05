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
        setData({
          overview: o.data,
          recentTransactions: t.data,
          spending: s.data.slice(0, 5),
          overBudget: s.data.filter((i) => parseFloat(i.available) < 0),
        });
        setLoading(false);
      })
      .catch((e) => { if (!c.signal.aborted) { setError(e); setLoading(false); } });
    return () => c.abort();
  }, []);
  return { ...data, loading, error };
}

/* ---- Sparkline ---- */
function Sparkline({ positive = true }) {
  const d = positive
    ? 'M0 16 Q4 14 8 12 T16 10 T24 6 T32 8 T40 4 T48 7 T56 2'
    : 'M0 4 Q4 6 8 8 T16 10 T24 8 T32 12 T40 10 T48 14 T56 16';
  return (
    <svg className="w-14 h-5 shrink-0" viewBox="0 0 56 20" fill="none">
      <path d={d} stroke={positive ? '#10b981' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---- Stat Card ---- */
function Stat({ label, value, trend, trendUp, accent }) {
  const gradients = {
    orange: 'from-[#09090b] to-[#27272a] dark:from-white dark:to-neutral-300',
    emerald: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-indigo-600',
    violet: 'from-violet-500 to-purple-600',
  };
  return (
    <div className="card p-4 group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradients[accent]} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>
      <p className="text-[22px] font-bold tracking-[-0.03em] text-[#09090b] dark:text-[#fafafa] tabular-nums leading-none">{value}</p>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          <Sparkline positive={trendUp} />
          <span className={`text-[11px] font-semibold ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{trend}</span>
        </div>
      )}
    </div>
  );
}

/* ---- Alert ---- */
function BudgetAlert({ categories, formatCurrency }) {
  return (
    <div className="card border-red-200/60 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 p-3 animate-slideUp" role="alert">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-red-800 dark:text-red-300">Over Budget</h3>
          <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">
            {categories.length > 1 ? `${categories.length} categories exceed their budget` : `${categories[0].category} is overspending`}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {categories.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-100/80 dark:bg-red-900/40 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                {item.category} <span className="tabular-nums">{formatCurrency(item.available)}</span>
              </span>
            ))}
          </div>
        </div>
        <Link to="/budget" className="text-[11px] font-semibold text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline underline-offset-2 shrink-0 mt-0.5">Adjust →</Link>
      </div>
    </div>
  );
}

/* ---- Dashboard ---- */
function Dashboard() {
  const { formatCurrency } = useCurrency();
  const { overview, recentTransactions, spending, overBudget, loading, error } = useDashboardData();
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Unable to load</h3>
        <p className="text-[12px] text-neutral-500 mt-1">{error.message}</p>
        <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const toBeBudgeted = overview?.to_be_budgeted ?? 0;
  const totalBalance = overview?.total_balance ?? 0;
  const totalBudgeted = overview?.total_budgeted ?? 0;
  const totalActivity = overview?.total_activity ?? 0;

  return (
    <div className="space-y-5 stagger">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#09090b] dark:text-[#fafafa]">{monthLabel}</h1>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {toBeBudgeted >= 0 ? `You have ${formatCurrency(toBeBudgeted)} ready to assign` : 'Some categories are over budget'}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <Link to="/transactions" className="btn-primary text-[12px] px-3 py-[7px]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Transaction
          </Link>
          <Link to="/budget" className="btn-secondary text-[12px] px-3 py-[7px]">Review Budget</Link>
        </div>
      </div>

      {/* Alert */}
      {overBudget.length > 0 && <BudgetAlert categories={overBudget} formatCurrency={formatCurrency} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat label="Ready to Assign" value={formatCurrency(toBeBudgeted)} trend={toBeBudgeted >= 0 ? '+12%' : 'Over'} trendUp={toBeBudgeted >= 0} accent="orange" />
        <Stat label="Total Balance" value={formatCurrency(totalBalance)} trend="+3.2%" trendUp accent="emerald" />
        <Stat label="Budgeted" value={formatCurrency(totalBudgeted)} accent="blue" />
        <Stat label="Spent" value={formatCurrency(Math.abs(totalActivity))} trend="62%" trendUp={Math.abs(totalActivity) < totalBudgeted} accent="violet" />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 stagger">
        {/* Transactions */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/50">
              <div>
                <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Recent Transactions</h2>
              </div>
              <Link to="/transactions" className="text-[11px] font-semibold text-neutral-400 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors">View all</Link>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-neutral-200 dark:text-neutral-800 mb-4" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="14" width="48" height="38" rx="8" stroke="currentColor" strokeWidth="2" />
                  <rect x="16" y="24" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="44" cy="28" r="2.5" fill="currentColor" />
                  <circle cx="16" cy="58" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="28" cy="60" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="40" cy="57" r="4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">No transactions yet</h3>
                <p className="text-[12px] text-neutral-500 mt-0.5 max-w-[240px]">Record your first expense or income to start tracking.</p>
                <Link to="/transactions" className="btn-primary mt-4 text-[12px] px-3 py-[7px]">Add Your First Transaction</Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50 dark:divide-neutral-800/30">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.amount >= 0;
                  return (
                    <div key={tx.id} className="flex items-center justify-between gap-4 px-4 py-[10px] hover:bg-neutral-50/50 dark:hover:bg-neutral-800/15 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#09090b] dark:text-[#fafafa]">{tx.payee || 'No payee'}</p>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {tx.category_name || 'Uncategorized'}
                          <span className="mx-1.5">·</span>
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <p className={`shrink-0 text-[13px] font-bold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#09090b] dark:text-[#fafafa]'}`}>
                        {isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/50">
              <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Budget Progress</h2>
              <Link to="/reports" className="text-[11px] font-semibold text-neutral-400 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors">Reports</Link>
            </div>
            {spending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-neutral-200 dark:text-neutral-800 mb-4" viewBox="0 0 64 64" fill="none">
                  <rect x="12" y="32" width="6" height="18" rx="1.5" stroke="currentColor" strokeWidth="2" />
                  <rect x="22" y="22" width="6" height="28" rx="1.5" stroke="currentColor" strokeWidth="2" />
                  <rect x="32" y="16" width="6" height="34" rx="1.5" stroke="currentColor" strokeWidth="2" />
                  <rect x="42" y="24" width="6" height="26" rx="1.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M14 30l10-8 10-10 10-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">No spending data</h3>
                <p className="text-[12px] text-neutral-500 mt-0.5 max-w-[200px]">Set up budgets to track progress.</p>
                <Link to="/budget" className="btn-primary mt-4 text-[12px] px-3 py-[7px]">Set Up Budgets</Link>
              </div>
            ) : (
              <div className="p-4 space-y-3.5">
                {spending.map((item, index) => {
                  const available = parseFloat(item.available);
                  const pct = parseFloat(item.budgeted) > 0 ? Math.min((parseFloat(item.spent) / parseFloat(item.budgeted)) * 100, 100) : 0;
                  const over = available < 0;
                  return (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-medium text-[#09090b] dark:text-[#fafafa]">{item.category}</span>
                        <span className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
                          {formatCurrency(item.spent)} <span className="text-neutral-300 dark:text-neutral-700">/</span> {formatCurrency(item.budgeted)}
                        </span>
                      </div>
                      <div className="progress">
                        <div className={`progress-fill ${over ? 'bg-red-500' : 'bg-[#09090b] dark:bg-white'}`} style={{ width: `${pct}%` }} />
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

export default Dashboard;
