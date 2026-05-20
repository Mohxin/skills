import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBudgetOverview, getRecentTransactions, getSpendingByCategory, getRecurring, getGoals, getCashFlowForecast } from '../api';
import { DashboardSkeleton } from '../components/Skeleton';
import CashFlowForecast from '../components/CashFlowForecast';
import AiInsightsPanel from '../components/AiInsightsPanel';
import { useCurrency } from '../context/CurrencyContext';

function useDashboardData() {
  const [data, setData] = useState({ overview: null, recentTransactions: [], spending: [], overBudget: [], recurring: [], goals: [], forecast: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      getBudgetOverview(),
      getRecentTransactions(5),
      getSpendingByCategory(),
      getRecurring(),
      getGoals(),
      getCashFlowForecast(30).catch(() => ({ data: null })),
    ])
      .then(([o, t, s, r, g, f]) => {
        if (c.signal.aborted) return;
        setData({
          overview: o.data,
          recentTransactions: t.data,
          spending: s.data.slice(0, 5),
          overBudget: s.data.filter((i) => parseFloat(i.available) < 0),
          recurring: r.data.filter((item) => item.enabled !== false),
          goals: g.data,
          forecast: f.data,
        });
        setLoading(false);
      })
      .catch((e) => { if (!c.signal.aborted) { setError(e); setLoading(false); } });
    return () => c.abort();
  }, []);
  return { ...data, loading, error };
}

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

function BudgetHealth({ score, status, statusClass }) {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Budget Health</p>
          <p className={`mt-1 text-[13px] font-semibold ${statusClass}`}>{status}</p>
        </div>
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="7" fill="none" className="text-neutral-100 dark:text-neutral-800" />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${score * 1.63} 163`}
              className={score >= 75 ? 'text-emerald-500' : score >= 45 ? 'text-amber-500' : 'text-red-500'}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[16px] font-black tracking-[-0.04em] text-[#09090b] dark:text-[#fafafa]">{score}</span>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ label, value, description, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-neutral-700 dark:text-neutral-200',
    good: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-red-700 dark:text-red-300',
  };
  return (
    <div className="metric-tile">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className={`mt-1 text-[16px] font-bold tracking-[-0.02em] tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}

function BannerMetric({ label, value, helper, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-[#09090b] dark:text-[#fafafa]',
    good: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-red-700 dark:text-red-300',
  };

  return (
    <div className="rounded-lg border border-white/60 bg-white/72 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/35">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className={`mt-1 text-[17px] font-black leading-none tracking-[-0.04em] tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">{helper}</p>
    </div>
  );
}

function SectionTitle({ title, action, to }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/50">
      <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">{title}</h2>
      {action && to && (
        <Link to={to} className="text-[11px] font-semibold text-neutral-400 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors">
          {action}
        </Link>
      )}
    </div>
  );
}

function PriorityPanel({ priorities }) {
  return (
    <div className="card overflow-hidden">
      <SectionTitle title="Today's Focus" action="Open Budget" to="/budget" />
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
        {priorities.map((item) => (
          <Link key={item.title} to={item.to} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/20">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.tone}`}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">{item.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{item.description}</p>
            </div>
            <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

function UpcomingBills({ bills, formatCurrency }) {
  return (
    <div className="card overflow-hidden">
      <SectionTitle title="Upcoming Bills" action="Manage" to="/recurring" />
      {bills.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">No upcoming bills</p>
          <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">Recurring payments will show here.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
          {bills.map((bill) => {
            const due = new Date(`${bill.next_due}T00:00:00`);
            const days = Math.ceil((due - new Date()) / 86400000);
            const dueLabel = days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : `${days}d`;
            return (
              <div key={bill.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">{bill.payee}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{bill.category_name || bill.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold tabular-nums text-[#09090b] dark:text-[#fafafa]">{formatCurrency(Math.abs(bill.amount))}</p>
                  <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${days <= 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                    {dueLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalMomentum({ goals, formatCurrency }) {
  return (
    <div className="card overflow-hidden">
      <SectionTitle title="Goal Momentum" action="View Goals" to="/goals" />
      {goals.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">No active goals</p>
          <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">Create a target to track progress.</p>
        </div>
      ) : (
        <div className="p-4 space-y-3.5">
          {goals.map((goal) => {
            const target = parseFloat(goal.target_amount) || 0;
            const current = parseFloat(goal.current_amount) || 0;
            const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            return (
              <div key={goal.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="truncate text-[12px] font-semibold text-[#09090b] dark:text-[#fafafa]">{goal.name}</span>
                  <span className="text-[11px] font-semibold tabular-nums text-neutral-500 dark:text-neutral-400">{progress.toFixed(0)}%</span>
                </div>
                <div className="progress">
                  <div className="progress-fill bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{formatCurrency(current)} saved of {formatCurrency(target)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExecutiveBrief({ score, forecast, overBudget, goals, monthlyBills, available, formatCurrency }) {
  const goalGap = goals.reduce((sum, goal) => {
    const target = parseFloat(goal.target_amount) || 0;
    const current = parseFloat(goal.current_amount) || 0;
    return sum + Math.max(target - current, 0);
  }, 0);
  const forecastStatus = forecast?.status || 'unknown';
  const readiness = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        score
        - (forecastStatus === 'risk' ? 18 : forecastStatus === 'tight' ? 8 : 0)
        - Math.min(overBudget.length * 8, 24)
        + (forecastStatus === 'healthy' ? 5 : 0)
      )
    )
  );
  const scoreTone = readiness >= 78 ? 'text-emerald-700 dark:text-emerald-300' : readiness >= 55 ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300';
  const levers = [
    overBudget.length
      ? { label: 'Budget risk', value: `${overBudget.length} categor${overBudget.length === 1 ? 'y' : 'ies'} over`, tone: 'danger' }
      : { label: 'Budget risk', value: 'Covered', tone: 'good' },
    { label: 'Bill load', value: formatCurrency(monthlyBills), tone: monthlyBills > Math.max(available, 1) ? 'warning' : 'neutral' },
    { label: 'Goal capital', value: formatCurrency(goalGap), tone: goalGap > 0 ? 'warning' : 'good' },
    { label: 'Cash floor', value: forecast ? formatCurrency(forecast.projectedLowBalance || 0) : 'Pending', tone: forecast?.projectedLowBalance < 0 ? 'danger' : 'good' },
  ];
  const nextAction = overBudget.length
    ? `Cover ${overBudget[0].category} before moving money elsewhere.`
    : forecastStatus === 'risk'
      ? 'Reduce flexible spend or move cash before the projected low date.'
      : goalGap > 0
        ? 'Turn surplus into automatic goal funding.'
        : 'Keep the plan on autopilot and review upcoming bills weekly.';

  const toneClasses = {
    good: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-red-700 dark:text-red-300',
    neutral: 'text-[#09090b] dark:text-[#fafafa]',
  };

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:p-5">
        <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/80 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/35">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Executive Brief</p>
          <p className={`mt-2 text-[48px] font-black leading-none tracking-[-0.06em] tabular-nums ${scoreTone}`}>{readiness}</p>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">Readiness score blending budget health, cash-flow risk, and goal pressure.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {levers.map((item) => (
            <div key={item.label} className="metric-tile">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">{item.label}</p>
              <p className={`mt-1 text-[15px] font-black tracking-[-0.03em] tabular-nums ${toneClasses[item.tone]}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200/70 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-950/30">
          <p className="text-[11px] font-semibold text-[#09090b] dark:text-[#fafafa]">Next best action</p>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{nextAction}</p>
          <div className="mt-3 flex gap-2">
            <Link to="/planner" className="btn-primary flex-1 px-3 py-2 text-[12px]">Open Planner</Link>
            <Link to="/insights" className="btn-secondary flex-1 px-3 py-2 text-[12px]">Insights</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Dashboard ---- */
function Dashboard() {
  const { formatCurrency } = useCurrency();
  const { overview, recentTransactions, spending, overBudget, recurring, goals, forecast, loading, error } = useDashboardData();
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
  const available = overview?.available ?? 0;
  const spent = Math.abs(totalActivity);
  const budgetUtilization = totalBudgeted > 0 ? Math.min((spent / totalBudgeted) * 100, 100) : 0;
  const overBudgetPenalty = Math.min(overBudget.length * 12, 36);
  const readyPenalty = toBeBudgeted < 0 ? 20 : 0;
  const healthScore = Math.max(0, Math.round(100 - budgetUtilization * 0.45 - overBudgetPenalty - readyPenalty));
  const healthStatus = healthScore >= 75 ? 'Healthy and on track' : healthScore >= 45 ? 'Needs attention' : 'Action needed';
  const healthStatusClass = healthScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const topSpending = spending[0];
  const unassignedTone = toBeBudgeted >= 0 ? 'good' : 'danger';
  const upcomingBills = [...recurring]
    .filter((item) => item.next_due)
    .sort((a, b) => new Date(a.next_due) - new Date(b.next_due))
    .slice(0, 4);
  const activeGoals = [...goals]
    .filter((goal) => parseFloat(goal.current_amount || 0) < parseFloat(goal.target_amount || 0))
    .sort((a, b) => {
      const aPct = (parseFloat(a.current_amount || 0) / Math.max(parseFloat(a.target_amount || 0), 1));
      const bPct = (parseFloat(b.current_amount || 0) / Math.max(parseFloat(b.target_amount || 0), 1));
      return bPct - aPct;
    })
    .slice(0, 3);
  const nextBill = upcomingBills[0];
  const nextBillDate = nextBill?.next_due ? new Date(`${nextBill.next_due}T00:00:00`) : null;
  const nextBillDays = nextBillDate ? Math.ceil((nextBillDate - new Date()) / 86400000) : null;
  const monthlyBills = recurring.reduce((sum, item) => {
    const amount = Math.abs(parseFloat(item.amount) || 0);
    if (item.frequency === 'weekly') return sum + amount * 4.33;
    if (item.frequency === 'biweekly') return sum + amount * 2.17;
    if (item.frequency === 'yearly') return sum + amount / 12;
    return sum + amount;
  }, 0);
  const bannerStatus = overBudget.length > 0 ? 'Action needed' : toBeBudgeted > 0 ? 'Ready to assign' : 'Balanced';
  const bannerStatusClass = overBudget.length > 0
    ? 'border-red-200/70 bg-red-50/80 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
    : toBeBudgeted > 0
      ? 'border-orange-200/70 bg-orange-50/80 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300'
      : 'border-emerald-200/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';
  const primaryMessage = overBudget.length > 0
    ? `${overBudget[0].category} needs attention before the plan is balanced.`
    : toBeBudgeted > 0
      ? `${formatCurrency(toBeBudgeted)} is waiting to be assigned.`
      : 'Your available dollars are assigned and the plan is balanced.';
  const priorities = [
    ...(overBudget.length > 0 ? [{
      title: `Cover ${overBudget.length} overspent categor${overBudget.length === 1 ? 'y' : 'ies'}`,
      description: `${overBudget[0].category} needs ${formatCurrency(Math.abs(overBudget[0].available))}${overBudget.length > 1 ? ' first' : ''}.`,
      to: '/budget',
      icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
      tone: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    }] : []),
    ...(toBeBudgeted > 0 ? [{
      title: 'Assign ready money',
      description: `${formatCurrency(toBeBudgeted)} is not assigned to categories yet.`,
      to: '/budget',
      icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5M4.5 9.75h15M6.75 15h10.5',
      tone: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
    }] : []),
    ...(nextBill ? [{
      title: `${nextBill.payee} is coming up`,
      description: `${formatCurrency(Math.abs(nextBill.amount))} due ${nextBillDays <= 0 ? 'today' : `in ${nextBillDays} day${nextBillDays === 1 ? '' : 's'}`}.`,
      to: '/recurring',
      icon: 'M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M4.5 6.75h15A1.5 1.5 0 0121 8.25v10.5A1.5 1.5 0 0119.5 20.25h-15A1.5 1.5 0 013 18.75V8.25A1.5 1.5 0 014.5 6.75z',
      tone: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    }] : []),
    {
      title: 'Review recent activity',
      description: recentTransactions.length ? `${recentTransactions.length} latest transactions are ready to scan.` : 'Add your first transaction to start tracking.',
      to: '/transactions',
      icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
      tone: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    },
  ].slice(0, 3);

  return (
    <div className="space-y-4 page-enter">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/70 bg-[#f5f1ea] shadow-[0_18px_42px_-34px_rgba(15,23,42,0.45)] dark:border-neutral-800/70 dark:bg-[#0d0d0f]">
        <img src="/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-24 mix-blend-multiply dark:opacity-20 dark:mix-blend-normal" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.86)_46%,rgba(255,255,255,0.46)_100%)] dark:bg-[linear-gradient(110deg,rgba(9,9,11,0.98)_0%,rgba(9,9,11,0.84)_50%,rgba(9,9,11,0.48)_100%)]" aria-hidden="true" />
        <div className="absolute -right-20 top-8 hidden h-56 w-56 rounded-full border border-orange-200/50 bg-orange-200/20 blur-3xl dark:border-orange-500/10 dark:bg-orange-500/10 lg:block" aria-hidden="true" />
        <div className="relative z-10 grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-7">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${bannerStatusClass}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {bannerStatus}
                </span>
                <span className="rounded-full border border-neutral-200/80 bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500 dark:border-neutral-800/70 dark:bg-neutral-950/30 dark:text-neutral-400">
                  {monthLabel}
                </span>
              </div>
              <h1 className="max-w-2xl text-[32px] font-black leading-[0.98] tracking-[-0.045em] text-[#09090b] dark:text-[#fafafa] lg:text-[44px]">
                Your money plan, ready at a glance.
              </h1>
              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {primaryMessage} Track the next bill, assign new money, and keep spending aligned from this screen.
              </p>
            </div>
            <div className="grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-3">
              <BannerMetric label="Ready" value={formatCurrency(toBeBudgeted)} helper={toBeBudgeted >= 0 ? 'Still needs a job' : 'Needs coverage'} tone={unassignedTone} />
              <BannerMetric label="Available" value={formatCurrency(available)} helper={`${budgetUtilization.toFixed(0)}% of budget used`} tone={available >= 0 ? 'good' : 'danger'} />
              <BannerMetric label="Bills" value={formatCurrency(monthlyBills)} helper="Estimated monthly fixed cost" />
            </div>
          </div>
          <div className="space-y-3">
            <BudgetHealth score={healthScore} status={healthStatus} statusClass={healthStatusClass} />
            <div className="surface p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-[#09090b] dark:text-[#fafafa]">Next Move</p>
                  <p className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {overBudget.length > 0 ? 'Cover overspending first.' : toBeBudgeted > 0 ? 'Assign ready money now.' : 'Review activity and stay on pace.'}
                  </p>
                </div>
                {nextBill && (
                  <div className="rounded-lg bg-white/80 px-2.5 py-1.5 text-right dark:bg-neutral-950/35">
                    <p className="max-w-[96px] truncate text-[10px] font-bold text-[#09090b] dark:text-[#fafafa]">{nextBill.payee}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{nextBillDays <= 0 ? 'Due today' : `${nextBillDays}d`}</p>
                  </div>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Link to="/transactions" className="btn-primary flex-1 text-[12px] px-3 py-[7px]">
                  Add Transaction
                </Link>
                <Link to="/budget" className="btn-secondary flex-1 text-[12px] px-3 py-[7px]">Assign</Link>
              </div>
              <Link to="/planner" className="mt-2 flex items-center justify-between rounded-lg border border-neutral-200/70 bg-white/70 px-3 py-2 text-[12px] font-semibold text-[#09090b] transition-colors hover:bg-white dark:border-neutral-800/70 dark:bg-neutral-950/20 dark:text-[#fafafa] dark:hover:bg-neutral-900/40">
                Open Planner
                <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Alert */}
      {overBudget.length > 0 && <BudgetAlert categories={overBudget} formatCurrency={formatCurrency} />}

      <ExecutiveBrief
        score={healthScore}
        forecast={forecast}
        overBudget={overBudget}
        goals={goals}
        monthlyBills={monthlyBills}
        available={available}
        formatCurrency={formatCurrency}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <PriorityPanel priorities={priorities} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
          <UpcomingBills bills={upcomingBills} formatCurrency={formatCurrency} />
          <GoalMomentum goals={activeGoals} formatCurrency={formatCurrency} />
        </div>
      </div>

      <CashFlowForecast forecast={forecast} compact />

      <AiInsightsPanel compact />

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
                <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                </div>
                <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">No transactions yet</h3>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[240px]">Record your first expense or income to start tracking.</p>
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
                <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="12" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="12" rx="1" /><rect x="17" y="4" width="4" height="16" rx="1" /></svg>
                </div>
                <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">No spending data</h3>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[200px]">Set up budgets to track progress.</p>
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
