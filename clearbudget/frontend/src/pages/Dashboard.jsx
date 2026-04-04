import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBudgetOverview, getRecentTransactions, getSpendingByCategory } from '../api';
import { DashboardSkeleton } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';

const statCards = [
  {
    key: 'total_balance',
    label: 'Total Balance',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'to_be_budgeted',
    label: 'To Be Budgeted',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    key: 'total_budgeted',
    label: 'Budgeted',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    key: 'total_activity',
    label: 'Spent This Month',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
  },
];

function Dashboard() {
  const { formatCurrency } = useCurrency();
  const [overview, setOverview] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [spending, setSpending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBudgetOverview(),
      getRecentTransactions(5),
      getSpendingByCategory()
    ]).then(([overviewRes, transactionsRes, spendingRes]) => {
      setOverview(overviewRes.data);
      setRecentTransactions(transactionsRes.data);
      setSpending(spendingRes.data.slice(0, 5));
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load dashboard data:', err);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Dashboard</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Your financial overview at a glance</p>
        </div>
        <Link to="/transactions" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Quick Add
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {statCards.map((stat) => {
          const value = overview?.[stat.key] || 0;
          const isPositive = stat.key === 'to_be_budgeted' ? value >= 0 : stat.key !== 'total_activity';
          
          return (
            <div key={stat.key} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    stat.key === 'to_be_budgeted' 
                      ? (value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
                      : stat.key === 'total_activity'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-surface-900 dark:text-surface-50'
                  }`}>
                    {formatCurrency(value)}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              View all →
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <p className="text-surface-500 dark:text-surface-400 mt-2">No transactions yet</p>
              <Link to="/transactions" className="text-primary-600 dark:text-primary-400 text-sm font-medium">Add your first →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-surface-900 dark:text-surface-100 truncate">{tx.payee || 'No payee'}</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {tx.category_name || 'Uncategorized'} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <p className={`font-semibold ml-4 ${tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Spending */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Top Spending This Month</h2>
            <Link to="/reports" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              View reports →
            </Link>
          </div>
          {spending.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-surface-500 dark:text-surface-400 mt-2">No spending data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {spending.map((item, index) => {
                const available = parseFloat(item.available);
                const percentage = parseFloat(item.budgeted) > 0 
                  ? Math.min((parseFloat(item.spent) / parseFloat(item.budgeted)) * 100, 100) 
                  : 0;
                return (
                  <div key={index} className="py-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">{item.category}</p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {formatCurrency(item.spent)} <span className="text-surface-400">/ {formatCurrency(item.budgeted)}</span>
                      </p>
                    </div>
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full progress-bar ${available < 0 ? 'bg-red-500' : 'bg-primary-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
