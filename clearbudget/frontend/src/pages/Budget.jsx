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
      .then(([g, o]) => { setGroups(g.data); setOverview(o.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { loadData(); }, [loadData]);
  return { groups, overview, loading, refetch: loadData };
}

function CategoryRow({ category, editingId, editingAmount, onStartEdit, onSave }) {
  const { formatCurrency } = useCurrency();
  const available = parseFloat(category.budgeted) + parseFloat(category.activity);
  const isEditing = editingId === category.id;
  const progress = parseFloat(category.budgeted) > 0 ? Math.min((Math.abs(parseFloat(category.activity)) / parseFloat(category.budgeted)) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-12 items-center py-2 px-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/15 transition-colors group">
      <div className="col-span-4">
        <p className="text-[13px] font-medium text-[#09090b] dark:text-[#fafafa]">{category.name}</p>
        <div className="progress mt-1.5">
          <div className={`progress-fill ${available < 0 ? 'bg-red-500' : 'bg-[#09090b] dark:bg-white'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="col-span-3 text-right">
        {isEditing ? (
          <input type="number" step="0.01" className="w-20 text-right text-[12px] px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[#09090b] dark:text-[#fafafa] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/10 tabular-nums font-semibold"
            value={editingAmount} onChange={(e) => onStartEdit(category.id, e.target.value)}
            onBlur={() => onSave(category.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave(category.id); if (e.key === 'Escape') onStartEdit(null, ''); }}
            autoFocus aria-label={`Budget for ${category.name}`} />
        ) : (
          <button className="text-[12px] text-neutral-600 dark:text-neutral-400 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors tabular-nums font-semibold" onClick={() => onStartEdit(category.id, category.budgeted.toString())}>
            {formatCurrency(category.budgeted)}
          </button>
        )}
      </div>
      <div className="col-span-3 text-right text-[12px] tabular-nums text-red-500 dark:text-red-400 font-medium">{formatCurrency(category.activity)}</div>
      <div className={`col-span-2 text-right text-[12px] font-bold tabular-nums ${available >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(available)}</div>
    </div>
  );
}

function CategoryGroupCard({ group, editingId, editingAmount, onStartEdit, onSave }) {
  const { formatCurrency } = useCurrency();
  const [collapsed, setCollapsed] = useState(false);
  const budgeted = group.categories.reduce((s, c) => s + parseFloat(c.budgeted), 0);
  const activity = group.categories.reduce((s, c) => s + parseFloat(c.activity), 0);
  const available = budgeted + activity;

  return (
    <div className="card overflow-hidden">
      <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/15 transition-colors" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
        <div className="flex items-center gap-2">
          <svg className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">{group.name}</h2>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-medium">{group.categories.length}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] tabular-nums">
          <span className="text-neutral-500 dark:text-neutral-400">Budgeted <span className="font-semibold text-[#09090b] dark:text-[#fafafa]">{formatCurrency(budgeted)}</span></span>
          <span className={available >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>Available <span className="font-bold">{formatCurrency(available)}</span></span>
        </div>
      </button>
      {!collapsed && (
        <div className="border-t border-neutral-100 dark:border-neutral-800/50">
          <div className="grid grid-cols-12 px-4 py-1.5 bg-neutral-50/40 dark:bg-neutral-900/20 text-[9px] font-semibold uppercase tracking-[0.06em] text-neutral-400 dark:text-neutral-600">
            <div className="col-span-4">Category</div>
            <div className="col-span-3 text-right">Budgeted</div>
            <div className="col-span-3 text-right">Activity</div>
            <div className="col-span-2 text-right">Available</div>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/20">
            {group.categories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} editingId={editingId} editingAmount={editingAmount} onStartEdit={onStartEdit} onSave={onSave} />
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
  const { groups, overview, loading, refetch } = useBudgetData();
  const [editingId, setEditingId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');

  const handleStartEdit = (id, amount) => { setEditingId(id); setEditingAmount(amount); };
  const handleSave = async (categoryId) => {
    try {
      await updateCategoryBudget(categoryId, { budgeted: parseFloat(editingAmount) });
      await refetch();
      toast('Budget updated', 'success');
    } catch { toast('Failed to update', 'error'); }
    setEditingId(null); setEditingAmount('');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 page-enter">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#09090b] dark:text-[#fafafa]">Monthly Budget</h1>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">Give every dollar a job — tap any amount to edit</p>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="px-3 py-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Income</span>
            <p className="text-[15px] font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatCurrency(overview?.total_balance ?? 0)}</p>
          </div>
          <div className={`px-3 py-2 rounded-lg border ${(overview?.to_be_budgeted ?? 0) >= 0 ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/40' : 'bg-red-50/60 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/40'}`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${(overview?.to_be_budgeted ?? 0) >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>Ready</span>
            <p className={`text-[15px] font-bold tabular-nums ${(overview?.to_be_budgeted ?? 0) >= 0 ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(overview?.to_be_budgeted ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 stagger">
        {groups.map((group) => (
          <CategoryGroupCard key={group.id} group={group} editingId={editingId} editingAmount={editingAmount} onStartEdit={handleStartEdit} onSave={handleSave} />
        ))}
      </div>
    </div>
  );
}

export default Budget;
