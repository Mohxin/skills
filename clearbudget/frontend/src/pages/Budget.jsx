import { useState, useEffect, useCallback } from 'react';
import { getCategoryGroups, updateCategoryBudget, getBudgetOverview } from '../api';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';
import { DashboardSkeleton } from '../components/Skeleton';

function Budget() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');

  const loadData = useCallback(() => {
    Promise.all([getCategoryGroups(), getBudgetOverview()])
      .then(([groupsRes, overviewRes]) => {
        setGroups(groupsRes.data);
        setOverview(overviewRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditingAmount(category.budgeted.toString());
  };

  const saveBudget = async (categoryId) => {
    try {
      await updateCategoryBudget(categoryId, { budgeted: parseFloat(editingAmount) });
      const [groupsRes, overviewRes] = await Promise.all([getCategoryGroups(), getBudgetOverview()]);
      setGroups(groupsRes.data);
      setOverview(overviewRes.data);
      toast('Budget updated', 'success');
    } catch (err) {
      toast('Failed to update budget', 'error');
    }
    setEditingId(null);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Budget</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Give every dollar a job</p>
        </div>
      </div>

      {/* Budget Summary */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          <div className={`card ${overview.to_be_budgeted >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-5 h-5 ${overview.to_be_budgeted >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className={`text-sm font-medium ${overview.to_be_budgeted >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>To Be Budgeted</p>
            </div>
            <p className={`text-3xl font-bold ${overview.to_be_budgeted >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {formatCurrency(overview.to_be_budgeted)}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Total Budgeted</p>
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">{formatCurrency(overview.total_budgeted)}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-5 h-5 ${overview.available >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Available to Spend</p>
            </div>
            <p className={`text-3xl font-bold ${overview.available >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(overview.available)}
            </p>
          </div>
        </div>
      )}

      {/* Category Groups */}
      {groups.map((group) => {
        const groupBudgeted = group.categories.reduce((sum, cat) => sum + parseFloat(cat.budgeted), 0);
        const groupActivity = group.categories.reduce((sum, cat) => sum + parseFloat(cat.activity), 0);
        const groupAvailable = groupBudgeted + groupActivity;

        return (
          <div key={group.id} className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-surface-200 dark:border-surface-700 gap-2">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">{group.name}</h2>
              <div className="flex gap-4 text-sm text-surface-500 dark:text-surface-400">
                <span>Budgeted: <span className="font-medium text-surface-700 dark:text-surface-300">{formatCurrency(groupBudgeted)}</span></span>
                <span>Available: <span className={`font-medium ${groupAvailable >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(groupAvailable)}</span></span>
              </div>
            </div>

            <div className="space-y-1">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider py-2 px-4">
                <div className="col-span-5">Category</div>
                <div className="col-span-2 text-right">Budgeted</div>
                <div className="col-span-2 text-right">Activity</div>
                <div className="col-span-3 text-right">Available</div>
              </div>

              {/* Category Rows */}
              {group.categories.map((category) => {
                const available = parseFloat(category.budgeted) + parseFloat(category.activity);
                const isEditing = editingId === category.id;
                const progress = parseFloat(category.budgeted) > 0 
                  ? Math.min((Math.abs(parseFloat(category.activity)) / parseFloat(category.budgeted)) * 100, 100) 
                  : 0;

                return (
                  <div 
                    key={category.id} 
                    className="grid grid-cols-12 gap-4 items-center py-3 px-4 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors group"
                  >
                    <div className="col-span-5">
                      <p className="font-medium text-surface-900 dark:text-surface-100">{category.name}</p>
                      <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full progress-bar ${available < 0 ? 'bg-red-500' : 'bg-primary-500'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="input text-right w-full text-sm py-1"
                          value={editingAmount}
                          onChange={e => setEditingAmount(e.target.value)}
                          onBlur={() => saveBudget(category.id)}
                          onKeyDown={e => { if (e.key === 'Enter') saveBudget(category.id); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                          aria-label={`Budget for ${category.name}`}
                        />
                      ) : (
                        <button 
                          className="text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm py-1 px-2 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                          onClick={() => startEditing(category)}
                        >
                          {formatCurrency(category.budgeted)}
                        </button>
                      )}
                    </div>
                    <div className="col-span-2 text-right text-red-600 dark:text-red-400 font-medium text-sm">
                      {formatCurrency(category.activity)}
                    </div>
                    <div className={`col-span-3 text-right font-semibold text-sm ${available >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(available)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Budget;
