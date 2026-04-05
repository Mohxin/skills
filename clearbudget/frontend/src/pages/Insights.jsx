import { useState, useEffect } from 'react';
import { getInsights, getAccounts } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { SkeletonCard } from '../components/Skeleton';
import { ChartIllustration } from '../components/Illustrations';

function Insights() {
  const { formatCurrency } = useCurrency();
  const [insights, setInsights] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getInsights(), getAccounts()])
      .then(([insightsRes, accRes]) => {
        setInsights(insightsRes.data);
        setAccounts(accRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{<SkeletonCard />}{<SkeletonCard />}</div>;

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);
  const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedMonthly = (insights?.avgDaily || 0) * totalDaysInMonth;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Spending Insights</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Your financial habits this month</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Spent</p>
          <p className="text-xl font-semibold tabular-nums text-negative-600 dark:text-negative-500 mt-0.5">{formatCurrency(insights?.totalSpent || 0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Daily Average</p>
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">{formatCurrency(insights?.avgDaily || 0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Transactions</p>
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">{insights?.transactionCount || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Projected</p>
          <p className="text-xl font-semibold tabular-nums text-brand-600 dark:text-brand-500 mt-0.5">{formatCurrency(projectedMonthly)}</p>
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

      {/* Fun stats */}
      {insights && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">💡 Quick Facts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
