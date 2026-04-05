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
        const over = spendingRes.data.filter((item) => parseFloat(item.available) < 0);
        setData({
          overview: overviewRes.data,
          recentTransactions: transactionsRes.data,
          spending: spendingRes.data.slice(0, 5),
          overBudget: over,
        });
        setLoading(false);
      })
      .catch((err) => {
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

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {monthLabel}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {toBeBudgeted >= 0
              ? 'You\'re on track this month'
              : 'Some categories are over budget'}
          </p>
        </div>
        <Link to="/transactions" className="btn-primary self-start">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Transaction
        </Link>
      </div>

      {/* Budget Alert */}
      {overBudget.length > 0 && (
        <BudgetAlert categories={overBudget} formatCurrency={formatCurrency} />
      )}

      {/* Stats */}
      <section aria-label="Financial summary" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Ready to Assign"
          value={formatCurrency(toBeBudgeted)}
          variant={toBeBudgeted >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="Total Balance"
          value={formatCurrency(totalBalance)}
          variant="default"
        />
        <StatCard
          label="Budgeted"
          value={formatCurrency(totalBudgeted)}
          variant="default"
        />
        <StatCard
          label="Spent This Month"
          value={formatCurrency(Math.abs(spentThisMonth))}
          variant="negative"
        />
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <svg className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Unable to load dashboard</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{error.message}</p>
        <button className="btn-primary mt-4" onClick={() => window.location.reload()}>
          Try Again
        </button>
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
