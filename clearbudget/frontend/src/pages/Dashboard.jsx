import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBudgetOverview, getRecentTransactions, getSpendingByCategory } from '../api';
import { DashboardSkeleton } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';
import StatCard from './Dashboard/StatCard';
import TransactionList from './Dashboard/TransactionList';
import CategoryProgress from './Dashboard/CategoryProgress';
import BudgetAlert from './Dashboard/BudgetAlert';

function useDashboardData() {
  const [data, setData] = useState({
    overview: null,
    recentTransactions: [],
    spending: [],
    overBudget: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getBudgetOverview(),
      getRecentTransactions(5),
      getSpendingByCategory(),
    ])
      .then(([overviewRes, transactionsRes, spendingRes]) => {
        if (controller.signal.aborted) return;
        const over = spendingRes.data.filter(item => parseFloat(item.available) < 0);
        setData({
          overview: overviewRes.data,
          recentTransactions: transactionsRes.data.map(tx => ({
            ...tx,
            amount_formatted: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            }).format(Math.abs(tx.amount)),
          })),
          spending: spendingRes.data.slice(0, 5),
          overBudget: over,
        });
        setLoading(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { ...data, loading, error };
}

function DashboardContent({ overview, recentTransactions, spending, overBudget }) {
  const { formatCurrency } = useCurrency();
  const toBeBudgeted = overview?.to_be_budgeted ?? 0;
  const totalBalance = overview?.total_balance ?? 0;
  const totalBudgeted = overview?.total_budgeted ?? 0;
  const spentThisMonth = overview?.total_activity ?? 0;

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Dashboard</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link to="/transactions" className="btn-primary inline-flex items-center gap-2 self-start">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Quick Add
        </Link>
      </header>

      {/* Budget Alert */}
      {overBudget.length > 0 && (
        <BudgetAlert
          categories={overBudget}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Stats */}
      <section aria-label="Financial summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard
            label="Total Balance"
            value={formatCurrency(totalBalance)}
            variant={totalBalance >= 0 ? 'default' : 'negative'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
          <StatCard
            label="To Be Budgeted"
            value={formatCurrency(toBeBudgeted)}
            variant={toBeBudgeted >= 0 ? 'positive' : 'negative'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Budgeted"
            value={formatCurrency(totalBudgeted)}
            variant="default"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Spent This Month"
            value={formatCurrency(Math.abs(spentThisMonth))}
            variant="negative"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        <TransactionList transactions={recentTransactions} />
        <CategoryProgress categories={spending} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
}

function Dashboard() {
  const { overview, recentTransactions, spending, overBudget, loading, error } = useDashboardData();

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="card text-center py-12" role="alert">
        <svg className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Unable to load dashboard</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{error.message}</p>
        <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <DashboardContent
      overview={overview}
      recentTransactions={recentTransactions}
      spending={spending}
      overBudget={overBudget}
    />
  );
}

export default Dashboard;
