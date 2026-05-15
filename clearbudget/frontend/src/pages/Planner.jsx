import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBudgetOverview, getRecurring, getGoals, getSpendingByCategory, getCashFlowForecast } from '../api';
import CashFlowForecast from '../components/CashFlowForecast';
import { SkeletonCard } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';

function Metric({ label, value, description, tone = 'neutral' }) {
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
      <p className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}

function Recommendation({ title, description, to, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  };

  return (
    <Link to={to} className="flex items-start gap-3 rounded-lg border border-neutral-200/70 bg-white/70 p-3 transition-colors hover:bg-white dark:border-neutral-800/70 dark:bg-neutral-950/20 dark:hover:bg-neutral-900/40">
      <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${tones[tone]}`} />
      <div>
        <p className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
    </Link>
  );
}

function Planner() {
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState({ overview: null, recurring: [], goals: [], spending: [], forecast: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBudgetOverview(),
      getRecurring(),
      getGoals(),
      getSpendingByCategory(),
      getCashFlowForecast(30).catch(() => ({ data: null })),
    ])
      .then(([overviewRes, recurringRes, goalsRes, spendingRes, forecastRes]) => {
        setData({
          overview: overviewRes.data,
          recurring: recurringRes.data.filter((item) => item.enabled !== false),
          goals: goalsRes.data,
          spending: spendingRes.data,
          forecast: forecastRes.data,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const plan = useMemo(() => {
    const totalBalance = data.overview?.total_balance ?? 0;
    const ready = data.overview?.to_be_budgeted ?? 0;
    const available = data.overview?.available ?? 0;
    const monthlyBills = data.recurring.reduce((sum, item) => {
      const amount = Math.abs(parseFloat(item.amount) || 0);
      if (item.frequency === 'weekly') return sum + amount * 4.33;
      if (item.frequency === 'biweekly') return sum + amount * 2.17;
      if (item.frequency === 'yearly') return sum + amount / 12;
      return sum + amount;
    }, 0);
    const discretionarySpend = data.spending
      .filter((item) => !['Rent/Mortgage', 'Health Insurance', 'Phone Bill', 'Internet'].includes(item.category))
      .reduce((sum, item) => sum + (parseFloat(item.spent) || 0), 0);
    const goalGap = data.goals.reduce((sum, goal) => {
      const target = parseFloat(goal.target_amount) || 0;
      const current = parseFloat(goal.current_amount) || 0;
      return sum + Math.max(target - current, 0);
    }, 0);
    const monthlySavingsCapacity = Math.max(ready - monthlyBills, 0);
    const safeToSpend = Math.max(available - monthlyBills * 0.5, 0);
    const runwayMonths = monthlyBills > 0 ? totalBalance / monthlyBills : 0;
    const projectedGoalMonths = monthlySavingsCapacity > 0 && goalGap > 0 ? Math.ceil(goalGap / monthlySavingsCapacity) : null;
    const largestCategory = data.spending[0];
    const overBudget = data.spending.filter((item) => parseFloat(item.available) < 0);

    return {
      available,
      discretionarySpend,
      goalGap,
      largestCategory,
      monthlyBills,
      monthlySavingsCapacity,
      overBudget,
      projectedGoalMonths,
      ready,
      runwayMonths,
      safeToSpend,
      totalBalance,
    };
  }, [data]);

  const recommendations = [
    ...(plan.overBudget.length ? [{
      title: 'Cover overspent categories first',
      description: `${plan.overBudget[0].category} is short by ${formatCurrency(Math.abs(plan.overBudget[0].available))}. Move money before assigning new dollars.`,
      to: '/budget',
      tone: 'danger',
    }] : []),
    ...(plan.ready > 0 ? [{
      title: 'Give ready money a job',
      description: `${formatCurrency(plan.ready)} is still unassigned. Put it toward bills, goals, or true expenses.`,
      to: '/budget',
      tone: 'warning',
    }] : []),
    ...(plan.goalGap > 0 ? [{
      title: 'Accelerate active goals',
      description: `${formatCurrency(plan.goalGap)} remains across goals. Your current capacity suggests ${plan.projectedGoalMonths ? `${plan.projectedGoalMonths} month${plan.projectedGoalMonths === 1 ? '' : 's'}` : 'a manual plan'} to finish.`,
      to: '/goals',
      tone: 'good',
    }] : []),
    {
      title: 'Audit recurring bills',
      description: `${formatCurrency(plan.monthlyBills)} is committed each month. Review subscriptions and fixed costs regularly.`,
      to: '/recurring',
      tone: 'neutral',
    },
  ].slice(0, 4);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter">
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/70 bg-white/80 p-5 dark:border-neutral-800/70 dark:bg-[#111113]/90 lg:p-7">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12),transparent_58%)]" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-600 dark:text-orange-400">Planning Lab</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] text-[#09090b] dark:text-[#fafafa]">Turn the budget into next-month decisions.</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            This page combines account balances, committed bills, category spending, and goals into a practical plan for what to assign, protect, and review next.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Safe to Spend" value={formatCurrency(plan.safeToSpend)} description="Available after holding back half a month of bills." tone={plan.safeToSpend > 0 ? 'good' : 'warning'} />
        <Metric label="Monthly Bills" value={formatCurrency(plan.monthlyBills)} description={`${data.recurring.length} active recurring payment${data.recurring.length === 1 ? '' : 's'}.`} />
        <Metric label="Runway" value={`${plan.runwayMonths.toFixed(1)} mo`} description="How long balances cover fixed monthly bills." tone={plan.runwayMonths >= 3 ? 'good' : 'warning'} />
        <Metric label="Goal Gap" value={formatCurrency(plan.goalGap)} description="Remaining money needed for active goals." tone={plan.goalGap > 0 ? 'warning' : 'good'} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/50">
            <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Recommended Next Moves</h2>
          </div>
          <div className="grid gap-2 p-3">
            {recommendations.map((item) => <Recommendation key={item.title} {...item} />)}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Plan Snapshot</h2>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Bills vs balance</span>
                <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">{formatCurrency(plan.monthlyBills)} / {formatCurrency(plan.totalBalance)}</span>
              </div>
              <div className="progress">
                <div className="progress-fill bg-[#09090b] dark:bg-white" style={{ width: `${Math.min((plan.monthlyBills / Math.max(plan.totalBalance, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Discretionary spending</span>
                <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">{formatCurrency(plan.discretionarySpend)}</span>
              </div>
              <div className="progress">
                <div className="progress-fill bg-orange-500" style={{ width: `${Math.min((plan.discretionarySpend / Math.max(plan.monthlyBills + plan.discretionarySpend, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            {data.forecast && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">30-day cushion</span>
                  <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">{formatCurrency(data.forecast.safeToSpend || 0)}</span>
                </div>
                <div className="progress">
                  <div className={`progress-fill ${data.forecast.status === 'risk' ? 'bg-red-500' : data.forecast.status === 'tight' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(((data.forecast.safeToSpend || 0) / Math.max(data.forecast.startingBalance || 1, 1)) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/40">
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Largest category</p>
              <p className="mt-1 text-[13px] font-bold text-[#09090b] dark:text-[#fafafa]">{plan.largestCategory?.category || 'No spending yet'}</p>
              <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{plan.largestCategory ? `${formatCurrency(plan.largestCategory.spent)} spent` : 'Spending will appear here once transactions exist.'}</p>
            </div>
          </div>
        </div>
      </div>

      <CashFlowForecast forecast={data.forecast} />
    </div>
  );
}

export default Planner;
