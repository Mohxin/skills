import { useState, useEffect } from 'react';
import { getAccounts, getGoals, getInsights, getRecurring, getSpendingByCategory } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { SkeletonCard } from '../components/Skeleton';
import AiInsightsPanel from '../components/AiInsightsPanel';

function InsightMetric({ label, value, helper, tone = 'neutral' }) {
  const tones = {
    neutral: 'text-[#09090b] dark:text-[#fafafa]',
    good: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-red-700 dark:text-red-300',
  };

  return (
    <div className="metric-tile">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className={`mt-1 text-[22px] font-black tracking-[-0.04em] tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{helper}</p>
    </div>
  );
}

function CoachCard({ title, description, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200/70 bg-white/70 p-3 dark:border-neutral-800/70 dark:bg-neutral-950/20">
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${tones[tone]}`} />
      <div>
        <p className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
    </div>
  );
}

function Insights() {
  const { formatCurrency } = useCurrency();
  const [insights, setInsights] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [goals, setGoals] = useState([]);
  const [spending, setSpending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const emptyInsights = { totalSpent: 0, avgDaily: 0, topMerchants: [], topCategories: [], transactionCount: 0 };
    Promise.all([
      getInsights().catch(() => ({ data: emptyInsights })),
      getAccounts(),
      getRecurring(),
      getGoals(),
      getSpendingByCategory(),
    ])
      .then(([insightsRes, accRes, recurringRes, goalsRes, spendingRes]) => {
        setInsights(insightsRes.data);
        setAccounts(accRes.data);
        setRecurring(recurringRes.data.filter((item) => item.enabled !== false));
        setGoals(goalsRes.data);
        setSpending(spendingRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{<SkeletonCard />}{<SkeletonCard />}</div>;

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);
  const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const projectedMonthly = (insights?.avgDaily || 0) * totalDaysInMonth;
  const monthProgress = dayOfMonth / totalDaysInMonth;
  const spendingPace = projectedMonthly > 0 && insights?.totalSpent ? insights.totalSpent / (projectedMonthly * monthProgress) : 0;
  const monthlyBills = recurring.reduce((sum, item) => {
    const amount = Math.abs(parseFloat(item.amount) || 0);
    if (item.frequency === 'weekly') return sum + amount * 4.33;
    if (item.frequency === 'biweekly') return sum + amount * 2.17;
    if (item.frequency === 'yearly') return sum + amount / 12;
    return sum + amount;
  }, 0);
  const billPressure = totalBalance > 0 ? monthlyBills / totalBalance : 0;
  const goalGap = goals.reduce((sum, goal) => {
    const target = parseFloat(goal.target_amount) || 0;
    const current = parseFloat(goal.current_amount) || 0;
    return sum + Math.max(target - current, 0);
  }, 0);
  const topCategory = spending[0];
  const cashAccounts = accounts.filter((account) => ['checking', 'savings', 'cash'].includes(account.type));
  const liquidBalance = cashAccounts.reduce((sum, account) => sum + Math.max(parseFloat(account.balance) || 0, 0), 0);
  const runwayMonths = monthlyBills > 0 ? liquidBalance / monthlyBills : 0;
  const topMerchant = insights?.topMerchants?.[0];
  const coachItems = [
    ...(spendingPace > 1.1 ? [{
      title: 'Spending pace is running warm',
      description: `At this pace you are tracking toward ${formatCurrency(projectedMonthly)} this month. Review the largest flexible categories before they harden into habits.`,
      tone: 'warning',
    }] : [{
      title: 'Spending pace looks controlled',
      description: `Daily spend is averaging ${formatCurrency(insights?.avgDaily || 0)}, which keeps this month near ${formatCurrency(projectedMonthly)}.`,
      tone: 'good',
    }]),
    ...(billPressure > 0.35 ? [{
      title: 'Fixed bills are taking a large share',
      description: `${formatCurrency(monthlyBills)} in recurring bills is meaningful against your liquid balance. Subscriptions are worth reviewing.`,
      tone: 'warning',
    }] : [{
      title: 'Recurring bills look manageable',
      description: `${formatCurrency(monthlyBills)} is committed monthly, with about ${runwayMonths.toFixed(1)} months of liquid runway.`,
      tone: 'good',
    }]),
    ...(goalGap > 0 ? [{
      title: 'Goals need a funding plan',
      description: `${formatCurrency(goalGap)} remains across active goals. Move surplus into goals after bills and overspending are covered.`,
      tone: 'neutral',
    }] : []),
    ...(topMerchant ? [{
      title: `${topMerchant.payee} is your top merchant`,
      description: `${formatCurrency(topMerchant.total)} across ${topMerchant.count} transaction${topMerchant.count === 1 ? '' : 's'}. Decide if that matches your priorities.`,
      tone: 'neutral',
    }] : []),
  ].slice(0, 4);

  return (
    <div className="space-y-5 page-enter">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/70 bg-white/80 dark:border-neutral-800/70 dark:bg-[#111113]/90">
        <img src="/insights.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 dark:opacity-16" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40 dark:from-[#09090b]/95 dark:via-[#09090b]/82 dark:to-[#09090b]/50" />
        <div className="relative grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-600 dark:text-orange-400">Money Coach</p>
            <h1 className="mt-2 max-w-2xl text-[32px] font-black leading-[0.98] tracking-[-0.045em] text-[#09090b] dark:text-[#fafafa] lg:text-[42px]">
              See the habits behind the numbers.
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              Insights now combines spending pace, recurring bills, goals, merchant concentration, and account runway into practical coaching signals.
            </p>
          </div>
          <div className="surface p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Month Pace</p>
            <p className={`mt-1 text-[28px] font-black tracking-[-0.05em] ${spendingPace > 1.1 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {spendingPace > 1.1 ? 'Ahead' : 'Steady'}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
              {dayOfMonth} of {totalDaysInMonth} days elapsed. Projected spending is {formatCurrency(projectedMonthly)}.
            </p>
          </div>
        </div>
      </div>

      <AiInsightsPanel />

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InsightMetric label="Total Spent" value={formatCurrency(insights?.totalSpent || 0)} helper={`${insights?.transactionCount || 0} transactions this month`} tone="danger" />
        <InsightMetric label="Daily Average" value={formatCurrency(insights?.avgDaily || 0)} helper={`${formatCurrency((insights?.avgDaily || 0) * 7)} weekly rhythm`} />
        <InsightMetric label="Runway" value={`${runwayMonths.toFixed(1)} mo`} helper="Liquid accounts divided by monthly bills" tone={runwayMonths >= 3 ? 'good' : 'warning'} />
        <InsightMetric label="Goal Gap" value={formatCurrency(goalGap)} helper={`${goals.length} active goal${goals.length === 1 ? '' : 's'} tracked`} tone={goalGap > 0 ? 'warning' : 'good'} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="card overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/50">
            <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Coach Recommendations</h2>
          </div>
          <div className="grid gap-2 p-3">
            {coachItems.map((item) => <CoachCard key={item.title} {...item} />)}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Account Mix</h2>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Liquid balance</span>
                <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">{formatCurrency(liquidBalance)}</span>
              </div>
              <div className="progress">
                <div className="progress-fill bg-emerald-500" style={{ width: `${Math.min((liquidBalance / Math.max(totalBalance, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Monthly bill pressure</span>
                <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">{formatCurrency(monthlyBills)}</span>
              </div>
              <div className="progress">
                <div className="progress-fill bg-orange-500" style={{ width: `${Math.min(billPressure * 100, 100)}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/40">
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Largest spending category</p>
              <p className="mt-1 text-[13px] font-bold text-[#09090b] dark:text-[#fafafa]">{topCategory?.category || 'No spending yet'}</p>
              <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{topCategory ? `${formatCurrency(topCategory.spent)} this month` : 'Add transactions to reveal patterns.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Merchants */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Top Merchants</h2>
          </div>
          {!insights?.topMerchants?.length ? (
            <div className="text-center py-8 text-neutral-400 text-xs">No data yet</div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {insights.topMerchants.map((m, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-300 dark:text-neutral-600 w-4">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.payee}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{m.count} transaction{m.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatCurrency(m.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Top Categories</h2>
          </div>
          {!insights?.topCategories?.length ? (
            <div className="text-center py-8 text-neutral-400 text-xs">No data yet</div>
          ) : (
            <div className="p-4 space-y-3">
              {insights.topCategories.map((c, i) => {
                const pct = insights.totalSpent > 0 ? (c.total / insights.totalSpent * 100).toFixed(0) : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{c.category}</span>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="text-neutral-500 dark:text-neutral-400">{pct}%</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(c.total)}</span>
                      </div>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick facts */}
      {insights && (
        <div className="card p-4">
          <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa] mb-3">Quick Facts</h2>
          <div className="grid grid-cols-1 gap-4 text-[13px] sm:grid-cols-2">
            <p className="text-neutral-700 dark:text-neutral-300">
              You spend an average of <span className="font-semibold tabular-nums">{formatCurrency(insights.avgDaily)}</span> per day
            </p>
            <p className="text-neutral-700 dark:text-neutral-300">
              That's about <span className="font-semibold tabular-nums">{formatCurrency(insights.avgDaily * 7)}</span> per week
            </p>
            <p className="text-neutral-700 dark:text-neutral-300">
              Top merchant is <span className="font-semibold">{insights.topMerchants?.[0]?.payee || '—'}</span>
            </p>
            <p className="text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold tabular-nums">{insights.transactionCount}</span> transactions this month
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Insights;
