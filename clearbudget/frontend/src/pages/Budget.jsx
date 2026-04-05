import { useState, useEffect, useCallback } from 'react';
import { getCategoryGroups, updateCategoryBudget, getBudgetOverview } from '../api';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';
import { DashboardSkeleton } from '../components/Skeleton';

function useBudgetData() {
  const [groups, setGroups] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

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
  return { groups, overview, loading, setGroups, setOverview, refetch: loadData };
}

function CategoryRow({ category, editingId, editingAmount, onStartEdit, onSave }) {
  const { formatCurrency } = useCurrency();
  const available = parseFloat(category.budgeted) + parseFloat(category.activity);
  const isEditing = editingId === category.id;
  const progress = parseFloat(category.budgeted) > 0
    ? Math.min((Math.abs(parseFloat(category.activity)) / parseFloat(category.budgeted)) * 100, 100)
    : 0;

  return (
    <div className="grid grid-cols-12 items-center py-2 px-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
      <div className="col-span-4">
        <p className="text-sm text-neutral-900 dark:text-neutral-100">{category.name}</p>
        <div className="h-0.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${available < 0 ? 'bg-negative-500' : 'bg-brand-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="col-span-3 text-right">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            className="w-20 text-right text-sm px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={editingAmount}
            onChange={(e) => onStartEdit(category.id, e.target.value)}
            onBlur={() => onSave(category.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(category.id);
              if (e.key === 'Escape') onStartEdit(null, '');
            }}
            autoFocus
            aria-label={`Budget for ${category.name}`}
          />
        ) : (
          <button
            className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors tabular-nums"
            onClick={() => onStartEdit(category.id, category.budgeted.toString())}
          >
            {formatCurrency(category.budgeted)}
          </button>
        )}
      </div>
      <div className="col-span-3 text-right text-sm tabular-nums text-negative-600 dark:text-negative-500">
        {formatCurrency(category.activity)}
      </div>
      <div className={`col-span-2 text-right text-sm font-semibold tabular-nums ${available >= 0 ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}`}>
        {formatCurrency(available)}
      </div>
    </div>
  );
}

function CategoryGroupCard({ group, editingId, editingAmount, onStartEdit, onSave }) {
  const { formatCurrency } = useCurrency();
  const [collapsed, setCollapsed] = useState(false);
  const groupBudgeted = group.categories.reduce((s, c) => s + parseFloat(c.budgeted), 0);
  const groupActivity = group.categories.reduce((s, c) => s + parseFloat(c.activity), 0);
  const groupAvailable = groupBudgeted + groupActivity;

  return (
    <div className="card overflow-hidden">
      {/* Group header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <svg className={`w-3 h-3 text-neutral-400 transition-transform ${collapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{group.name}</h2>
        </div>
        <div className="flex items-center gap-4 text-xs tabular-nums">
          <span className="text-neutral-500 dark:text-neutral-400">
            Budgeted: <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(groupBudgeted)}</span>
          </span>
          <span className={groupAvailable >= 0 ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}>
            Available: <span className="font-semibold">{formatCurrency(groupAvailable)}</span>
          </span>
        </div>
      </button>

      {/* Categories */}
      {!collapsed && (
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          {/* Column headers */}
          <div className="grid grid-cols-12 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <div className="col-span-4">Category</div>
            <div className="col-span-3 text-right">Budgeted</div>
            <div className="col-span-3 text-right">Activity</div>
            <div className="col-span-2 text-right">Available</div>
          </div>

          {/* Category rows */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
            {group.categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                editingId={editingId}
                editingAmount={editingAmount}
                onStartEdit={onStartEdit}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Budget() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const { groups, overview, loading, setGroups, setOverview, refetch } = useBudgetData();
  const [editingId, setEditingId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');

  const handleStartEdit = (id, amount) => {
    setEditingId(id);
    setEditingAmount(amount);
  };

  const handleSave = async (categoryId) => {
    try {
      await updateCategoryBudget(categoryId, { budgeted: parseFloat(editingAmount) });
      await refetch();
      toast('Budget updated', 'success');
    } catch {
      toast('Failed to update budget', 'error');
    }
    setEditingId(null);
    setEditingAmount('');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Budget</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Give every dollar a job — tap a budgeted amount to edit
        </p>
      </div>

      {/* Summary */}
      {overview && (
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-lg px-4 py-3 ${overview.to_be_budgeted >= 0 ? 'bg-positive-50 dark:bg-positive-900/20 border border-positive-200 dark:border-positive-800' : 'bg-negative-50 dark:bg-negative-900/20 border border-negative-200 dark:border-negative-800'}`}>
            <p className={`text-xs font-medium ${overview.to_be_budgeted >= 0 ? 'text-positive-700 dark:text-positive-400' : 'text-negative-700 dark:text-negative-400'}`}>
              Ready to Assign
            </p>
            <p className={`text-xl font-semibold tabular-nums mt-0.5 ${overview.to_be_budgeted >= 0 ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}`}>
              {formatCurrency(overview.to_be_budgeted)}
            </p>
          </div>
          <div className="rounded-lg px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Budgeted</p>
            <p className="text-xl font-semibold tabular-nums mt-0.5 text-neutral-900 dark:text-neutral-100">
              {formatCurrency(overview.total_budgeted)}
            </p>
          </div>
          <div className="rounded-lg px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Available</p>
            <p className={`text-xl font-semibold tabular-nums mt-0.5 ${overview.available >= 0 ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}`}>
              {formatCurrency(overview.available)}
            </p>
          </div>
        </div>
      )}

      {/* Category Groups */}
      <div className="space-y-3">
        {groups.map((group) => (
          <CategoryGroupCard
            key={group.id}
            group={group}
            editingId={editingId}
            editingAmount={editingAmount}
            onStartEdit={handleStartEdit}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}

export default Budget;
