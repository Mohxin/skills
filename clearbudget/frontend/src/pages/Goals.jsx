import { useState, useEffect, useCallback } from 'react';
import { getGoals, createGoal, updateGoal, contributeToGoal, deleteGoal, getCategories } from '../api';
import Modal from '../components/Modal';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';
import { TargetIllustration } from '../components/Illustrations';

function Goals() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributeGoalId, setContributeGoalId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [formData, setFormData] = useState({ category_id: '', name: '', target_amount: '', current_amount: '0', target_date: '' });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([getGoals(), getCategories()])
      .then(([goalsRes, catRes]) => {
        setGoals(goalsRes.data);
        setCategories(catRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({ category_id: goal.category_id || '', name: goal.name, target_amount: goal.target_amount.toString(), current_amount: goal.current_amount.toString(), target_date: goal.target_date?.split('T')[0] || '' });
    } else {
      setEditingGoal(null);
      setFormData({ category_id: '', name: '', target_amount: '', current_amount: '0', target_date: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingGoal) {
        const res = await updateGoal(editingGoal.id, { ...formData, target_amount: parseFloat(formData.target_amount), current_amount: parseFloat(formData.current_amount) });
        setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? res.data : g)));
        toast('Goal updated', 'success');
      } else {
        const res = await createGoal({ ...formData, target_amount: parseFloat(formData.target_amount), current_amount: parseFloat(formData.current_amount) || 0 });
        setGoals((prev) => [...prev, res.data]);
        toast('Goal created', 'success');
      }
      setShowModal(false);
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async (goalId) => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) return;
    try {
      const res = await contributeToGoal(goalId, { amount: parseFloat(contributeAmount) });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? res.data : g)));
      toast(`Added ${formatCurrency(contributeAmount)} to goal`, 'success');
      setContributeGoalId(null);
      setContributeAmount('');
    } catch (err) {
      toast('Failed to contribute: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast('Goal deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Goals</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{goals.length} goal{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary self-start" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card text-center py-20">
          <TargetIllustration />
          <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa] mt-2">No goals yet</h3>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Create your first savings goal.</p>
          <button className="btn-primary mt-4 text-[12px] px-3 py-[7px]" onClick={() => openModal()}>Create Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = Math.min((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100, 100);
            const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
            const isComplete = progress >= 100;

            return (
              <div key={goal.id} className={`card p-4 ${isComplete ? 'bg-positive-50 dark:bg-positive-900/20 border-positive-200 dark:border-positive-800' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{goal.name}</h3>
                    {goal.category_name && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{goal.category_name}</p>}
                  </div>
                  {isComplete && <span className="badge-positive">✓ Done</span>}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500 dark:text-neutral-400">Progress</span>
                    <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-positive-500' : 'bg-brand-500'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Saved</p>
                    <p className="font-semibold tabular-nums text-positive-600 dark:text-positive-500">{formatCurrency(goal.current_amount)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Target</p>
                    <p className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatCurrency(goal.target_amount)}</p>
                  </div>
                </div>

                {goal.target_date && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                {/* Actions */}
                {contributeGoalId === goal.id ? (
                  <div className="flex gap-2">
                    <input type="number" step="0.01" min="0" className="input" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} placeholder="Amount" autoFocus />
                    <button className="btn-primary" onClick={() => handleContribute(goal.id)}>Add</button>
                    <button className="btn-secondary" onClick={() => { setContributeGoalId(null); setContributeAmount(''); }}>✕</button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button className="btn-primary flex-1 text-xs" onClick={() => setContributeGoalId(goal.id)}>+ Contribute</button>
                    <button className="btn-ghost" onClick={() => openModal(goal)} aria-label={`Edit ${goal.name}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                    </button>
                    <button className="btn-ghost text-negative-500 hover:text-negative-700" onClick={() => handleDelete(goal.id)} aria-label={`Delete ${goal.name}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                )}

                {remaining > 0 && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">{formatCurrency(remaining)} remaining</p>}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingGoal ? 'Edit Goal' : 'Create Goal'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-name" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Name</label>
            <input id="goal-name" type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Emergency Fund" required />
          </div>
          <div>
            <label htmlFor="goal-category" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Category</label>
            <select id="goal-category" className="input" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : '' })}>
              <option value="">No Category</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-target" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Target Amount</label>
              <input id="goal-target" type="number" step="0.01" className="input" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} placeholder="10000" required />
            </div>
            <div>
              <label htmlFor="goal-current" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Current Amount</label>
              <input id="goal-current" type="number" step="0.01" className="input" value={formData.current_amount} onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div>
            <label htmlFor="goal-date" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Target Date</label>
            <input id="goal-date" type="date" className="input" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : editingGoal ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Goals;
