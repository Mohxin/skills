import { useState, useEffect } from 'react';
import { getInsights, getSpendingByCategory, getAccounts } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { SkeletonCard } from '../components/Skeleton';

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
  const savingsRate = insights?.totalSpent > 0 ? ((totalBalance / (insights.totalSpent + totalBalance)) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Spending Insights</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Your financial habits this month</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">Total Spent</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(insights?.totalSpent || 0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">Daily Average</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{formatCurrency(insights?.avgDaily || 0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">Transactions</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{insights?.transactionCount || 0}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">Projected Monthly</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency((insights?.avgDaily || 0) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Merchants */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-50">Top Merchants</h2>
          {!insights?.topMerchants?.length ? (
            <p className="text-surface-400 text-center py-8">No spending data yet</p>
          ) : (
            <div className="space-y-3">
              {insights.topMerchants.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-surface-300 dark:text-surface-600 w-6">{i + 1}</span>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">{m.payee}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{m.count} transactions</p>
                    </div>
                  </div>
                  <p className="font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(m.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-50">Top Categories</h2>
          {!insights?.topCategories?.length ? (
            <p className="text-surface-400 text-center py-8">No spending data yet</p>
          ) : (
            <div className="space-y-3">
              {insights.topCategories.map((c, i) => {
                const pct = insights.totalSpent > 0 ? (c.total / insights.totalSpent * 100).toFixed(0) : 0;
                return (
                  <div key={i} className="py-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-medium text-surface-900 dark:text-surface-100">{c.category}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-surface-500 dark:text-surface-400">{pct}%</span>
                        <span className="font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(c.total)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-primary-500 progress-bar" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fun Stats */}
      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <h2 className="text-lg font-semibold mb-4 text-purple-900 dark:text-purple-300">💡 Did You Know?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-purple-800 dark:text-purple-300">
              You spend an average of <span className="font-bold">{formatCurrency(insights?.avgDaily || 0)}</span> per day this month
            </p>
            <p className="text-purple-800 dark:text-purple-300">
              That's about <span className="font-bold">{formatCurrency((insights?.avgDaily || 0) * 7)}</span> per week
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-purple-800 dark:text-purple-300">
              Your top merchant is <span className="font-bold">{insights?.topMerchants?.[0]?.payee || '—'}</span> at {formatCurrency(insights?.topMerchants?.[0]?.total || 0)}
            </p>
            <p className="text-purple-800 dark:text-purple-300">
              You've made <span className="font-bold">{insights?.transactionCount || 0}</span> transactions this month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Insights;
