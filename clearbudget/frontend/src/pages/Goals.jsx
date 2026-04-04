import { useState, useEffect, useCallback } from 'react';
import { getGoals, createGoal, updateGoal, contributeToGoal, deleteGoal, getCategories } from '../api';
import Modal from '../components/Modal';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

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
  const [formData, setFormData] = useState({
    category_id: '', name: '', target_amount: '', current_amount: '0', target_date: '',
  });
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
      setFormData({
        category_id: goal.category_id || '',
        name: goal.name,
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        target_date: goal.target_date?.split('T')[0] || '',
      });
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
        const res = await updateGoal(editingGoal.id, {
          ...formData,
          target_amount: parseFloat(formData.target_amount),
          current_amount: parseFloat(formData.current_amount),
        });
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? res.data : g));
        toast('Goal updated', 'success');
      } else {
        const res = await createGoal({
          ...formData,
          target_amount: parseFloat(formData.target_amount),
          current_amount: parseFloat(formData.current_amount) || 0,
        });
        setGoals(prev => [...prev, res.data]);
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
      setGoals(prev => prev.map(g => g.id === goalId ? res.data : g));
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
      setGoals(prev => prev.filter(g => g.id !== id));
      toast('Goal deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Goals</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Track your savings targets</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-surface-100">No goals yet</h3>
          <p className="mt-2 text-surface-500 dark:text-surface-400">Create your first savings goal to get started</p>
          <button className="btn-primary mt-4" onClick={() => openModal()}>Create Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {goals.map((goal) => {
            const progress = Math.min((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100, 100);
            const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
            const isComplete = progress >= 100;

            return (
              <div key={goal.id} className={`card ${isComplete ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-50">{goal.name}</h3>
                    {goal.category_name && (
                      <p className="text-sm text-surface-500 dark:text-surface-400">{goal.category_name}</p>
                    )}
                  </div>
                  {isComplete && (
                    <span className="badge-positive">✓ Done!</span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-surface-500 dark:text-surface-400">Progress</span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full progress-bar ${isComplete ? 'bg-green-500' : 'bg-primary-500'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-surface-500 dark:text-surface-400">Saved</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(goal.current_amount)}</p>
                  </div>
                  <div>
                    <p className="text-surface-500 dark:text-surface-400">Target</p>
                    <p className="font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(goal.target_amount)}</p>
                  </div>
                </div>

                {goal.target_date && (
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-4 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                {/* Contribute Section */}
                {contributeGoalId === goal.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      value={contributeAmount}
                      onChange={e => setContributeAmount(e.target.value)}
                      placeholder="Amount"
                      autoFocus
                    />
                    <button className="btn-primary" onClick={() => handleContribute(goal.id)}>Add</button>
                    <button className="btn-secondary" onClick={() => { setContributeGoalId(null); setContributeAmount(''); }}>✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1" onClick={() => setContributeGoalId(goal.id)}>
                      + Contribute
                    </button>
                    <button className="btn-ghost" onClick={() => openModal(goal)} aria-label={`Edit ${goal.name}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="btn-ghost text-red-500 hover:text-red-600" onClick={() => handleDelete(goal.id)} aria-label={`Delete ${goal.name}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}

                {remaining > 0 && (
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-3">
                    {formatCurrency(remaining)} remaining
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingGoal ? 'Edit Goal' : 'Create Goal'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-name" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Goal Name</label>
            <input id="goal-name" type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Emergency Fund" required />
          </div>
          <div>
            <label htmlFor="goal-category" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category (optional)</label>
            <select id="goal-category" className="input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value ? parseInt(e.target.value) : ''})}>
              <option value="">No Category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-target" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Target Amount ($)</label>
              <input id="goal-target" type="number" step="0.01" className="input" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} placeholder="10000" required />
            </div>
            <div>
              <label htmlFor="goal-current" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Current Amount ($)</label>
              <input id="goal-current" type="number" step="0.01" className="input" value={formData.current_amount} onChange={e => setFormData({...formData, current_amount: e.target.value})} placeholder="0" />
            </div>
          </div>
          <div>
            <label htmlFor="goal-date" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Target Date</label>
            <input id="goal-date" type="date" className="input" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              ) : (
                editingGoal ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Goals;
