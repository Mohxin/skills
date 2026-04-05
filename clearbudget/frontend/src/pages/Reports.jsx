import { useState, useEffect } from 'react';
import { getSpendingByCategory, getMonthlyTrends } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { SkeletonCard } from '../components/Skeleton';
import { useCurrency } from '../context/CurrencyContext';

const COLORS = ['#ed6d00', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-md p-2 border border-neutral-200 dark:border-neutral-700">
      <p className="font-medium text-xs text-neutral-900 dark:text-neutral-100">{payload[0].name}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{formatCurrency(payload[0].value)}</p>
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

  const pieData = spendingData.map((item) => ({
    name: item.category,
    value: parseFloat(item.spent),
    budgeted: parseFloat(item.budgeted),
    available: parseFloat(item.available),
  }));

  const trendsByMonth = {};
  trendsData.forEach((item) => {
    if (!trendsByMonth[item.month]) trendsByMonth[item.month] = { month: item.month };
    trendsByMonth[item.month][item.category] = parseFloat(item.spent);
  });
  const barData = Object.values(trendsByMonth).reverse();
  const topCategories = spendingData.slice(0, 5).map((c) => c.category);

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{<SkeletonCard />}{<SkeletonCard />}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
        <img src="/insights.jpg" alt="" className="w-full h-32 object-cover opacity-50 dark:opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-[#09090b] dark:via-[#09090b]/60" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-xl font-bold text-[#09090b] dark:text-[#fafafa]">Reports</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Visualize your spending patterns</p>
        </div>
      </div>

      {/* Pie chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Spending by Category</h2>
        </div>
        {pieData.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-xs">No spending data this month</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} strokeWidth={2} stroke="white" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={(props) => <CustomTooltip {...props} formatCurrency={formatCurrency} />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {pieData.map((item, index) => {
                const overBudget = item.value > item.budgeted;
                return (
                  <div key={index} className="flex items-center gap-2.5 py-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.name}</p>
                        <span className={overBudget ? 'badge-negative' : 'badge-positive'}>{overBudget ? 'Over' : 'On track'}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 tabular-nums">{formatCurrency(item.value)} of {formatCurrency(item.budgeted)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Monthly Trends</h2>
        </div>
        {barData.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-xs">Not enough data</div>
        ) : (
          <div className="space-y-4 p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={(props) => <CustomTooltip {...props} formatCurrency={formatCurrency} />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {topCategories.map((category, index) => (
                  <Bar key={index} dataKey={category} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col" className="text-right">Budgeted</th>
                    <th scope="col" className="text-right">Spent</th>
                    <th scope="col" className="text-right">Available</th>
                    <th scope="col" className="text-right">% Used</th>
                  </tr>
                </thead>
                <tbody>
                  {spendingData.map((item, index) => {
                    const pct = parseFloat(item.budgeted) > 0 ? (parseFloat(item.spent) / parseFloat(item.budgeted)) * 100 : 0;
                    return (
                      <tr key={index}>
                        <td className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.category}</span>
                        </td>
                        <td className="text-right text-neutral-600 dark:text-neutral-400 tabular-nums">{formatCurrency(item.budgeted)}</td>
                        <td className="text-right tabular-nums text-negative-600 dark:text-negative-500">{formatCurrency(item.spent)}</td>
                        <td className={`text-right font-semibold tabular-nums ${parseFloat(item.available) >= 0 ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}`}>{formatCurrency(item.available)}</td>
                        <td className="text-right"><span className={pct > 100 ? 'badge-negative' : 'badge-positive'}>{pct.toFixed(0)}%</span></td>
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
