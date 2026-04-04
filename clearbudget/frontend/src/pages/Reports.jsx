import { useState, useEffect } from 'react';
import { getSpendingByCategory, getMonthlyTrends } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { SkeletonCard } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  // Will be overridden by the Reports component's formatCurrency
  return (
    <div className="bg-white dark:bg-surface-800 shadow-lg rounded-lg p-3 border border-surface-200 dark:border-surface-700">
      <p className="font-semibold text-surface-900 dark:text-surface-50">{payload[0].name}</p>
      <p className="text-sm text-surface-600 dark:text-surface-400">{payload[0].value}</p>
    </div>
  );
};

function Reports() {
  const { formatCurrency } = useCurrency();
  const [spendingData, setSpendingData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSpendingByCategory(), getMonthlyTrends()])
      .then(([spendingRes, trendsRes]) => {
        setSpendingData(spendingRes.data);
        setTrendsData(trendsRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pieData = spendingData.map(item => ({
    name: item.category,
    value: parseFloat(item.spent),
    budgeted: parseFloat(item.budgeted),
    available: parseFloat(item.available),
  }));

  // Transform trends data for bar chart
  const trendsByMonth = {};
  trendsData.forEach(item => {
    if (!trendsByMonth[item.month]) {
      trendsByMonth[item.month] = { month: item.month };
    }
    trendsByMonth[item.month][item.category] = parseFloat(item.spent);
  });
  const barData = Object.values(trendsByMonth).reverse();
  const topCategories = spendingData.slice(0, 5).map(c => c.category);

  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Reports</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Visualize your spending patterns</p>
        </div>
      </div>

      {/* Spending by Category */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6 text-surface-900 dark:text-surface-50">Spending by Category (This Month)</h2>
        {pieData.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-surface-500 dark:text-surface-400 mt-2">No spending data this month</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={3}
                    stroke="white"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {pieData.map((item, index) => {
                const overBudget = item.value > item.budgeted;
                return (
                  <div key={index} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-surface-900 dark:text-surface-100 truncate">{item.name}</p>
                        <span className={overBudget ? 'badge-negative text-xs' : 'badge-positive text-xs'}>
                          {overBudget ? 'Over' : 'On track'}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {formatCurrency(item.value)} spent of {formatCurrency(item.budgeted)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Trends */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-50">Monthly Spending Trends</h2>
        {barData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-surface-500 dark:text-surface-400">Not enough data to show trends</p>
          </div>
        ) : (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {topCategories.map((category, index) => (
                  <Bar key={index} dataKey={category} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>

            {/* Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Spending summary">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Category</th>
                    <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Budgeted</th>
                    <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Spent</th>
                    <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Available</th>
                    <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">% Used</th>
                  </tr>
                </thead>
                <tbody>
                  {spendingData.map((item, index) => {
                    const percentUsed = parseFloat(item.budgeted) > 0 
                      ? (parseFloat(item.spent) / parseFloat(item.budgeted)) * 100 
                      : 0;
                    return (
                      <tr key={index} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="font-medium text-surface-900 dark:text-surface-100">{item.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-surface-600 dark:text-surface-300">{formatCurrency(item.budgeted)}</td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400 font-medium">{formatCurrency(item.spent)}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${parseFloat(item.available) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(item.available)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={percentUsed > 100 ? 'badge-negative text-xs' : 'badge-positive text-xs'}>
                            {percentUsed.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
