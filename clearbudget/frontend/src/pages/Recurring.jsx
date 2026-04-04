import { useState, useEffect, useCallback } from 'react';
import { getRecurring, createRecurring, updateRecurring, skipRecurring, deleteRecurring, getAccounts, getCategories } from '../api';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

function formatCurrency(amount) {
  return useCurrency ? '' : ''; // handled by hook below
}

function Recurring() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    account_id: '', category_id: '', payee: '', amount: '', frequency: 'monthly', next_due: new Date().toISOString().split('T')[0], enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([getRecurring(), getAccounts(), getCategories()])
      .then(([recRes, accRes, catRes]) => {
        setRecurring(recRes.data);
        setAccounts(accRes.data);
        setCategories(catRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (item = null) => {
    if (item) {
      setEditing(item);
      setFormData({
        account_id: item.account_id,
        category_id: item.category_id || '',
        payee: item.payee,
        amount: Math.abs(parseFloat(item.amount)),
        frequency: item.frequency,
        next_due: item.next_due?.split('T')[0] || '',
        enabled: item.enabled,
      });
    } else {
      setEditing(null);
      setFormData({
        account_id: accounts[0]?.id || '',
        category_id: '',
        payee: '',
        amount: '',
        frequency: 'monthly',
        next_due: new Date().toISOString().split('T')[0],
        enabled: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amount = formData.amount < 0 ? formData.amount : -Math.abs(formData.amount);
      if (editing) {
        const res = await updateRecurring(editing.id, { ...formData, amount });
        setRecurring(prev => prev.map(r => r.id === editing.id ? res.data : r));
        toast('Recurring bill updated', 'success');
      } else {
        const res = await createRecurring({ ...formData, amount });
        setRecurring(prev => [...prev, res.data]);
        toast('Recurring bill added', 'success');
      }
      setShowModal(false);
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async (id) => {
    try {
      const res = await skipRecurring(id);
      setRecurring(prev => prev.map(r => r.id === id ? res.data : r));
      toast('Skipped to next occurrence', 'info');
    } catch (err) {
      toast('Failed to skip: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring bill?')) return;
    try {
      await deleteRecurring(id);
      setRecurring(prev => prev.filter(r => r.id !== id));
      toast('Recurring bill deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await updateRecurring(item.id, { ...item, enabled: !item.enabled });
      setRecurring(prev => prev.map(r => r.id === item.id ? res.data : r));
      toast(item.enabled ? 'Disabled' : 'Enabled', 'info');
    } catch (err) {
      toast('Failed to update: ' + err.message, 'error');
    }
  };

  if (loading) return <SkeletonTable />;

  const upcoming = recurring.filter(r => r.enabled).sort((a, b) => new Date(a.next_due) - new Date(b.next_due));
  const disabled = recurring.filter(r => !r.enabled);
  const totalMonthly = recurring.filter(r => r.enabled && r.frequency === 'monthly').reduce((s, r) => s + Math.abs(parseFloat(r.amount)), 0);

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Recurring Bills</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{upcoming.length} active • {formatCurrency(totalMonthly)}/month</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Recurring
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Monthly Recurring</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">Next Due</p>
          {upcoming[0] ? (
            <div>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50">{upcoming[0].payee}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {new Date(upcoming[0].next_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' • '}
                {formatCurrency(upcoming[0].amount)}
              </p>
            </div>
          ) : (
            <p className="text-surface-400">No upcoming bills</p>
          )}
        </div>
        <div className="card">
          <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">This Week</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            {upcoming.filter(r => {
              const due = new Date(r.next_due);
              const week = new Date();
              week.setDate(week.getDate() + 7);
              return due >= new Date() && due <= week;
            }).length}
          </p>
        </div>
      </div>

      {/* Upcoming Bills */}
      <div className="card overflow-x-auto p-0">
        <h2 className="text-lg font-semibold px-6 pt-6 pb-3 text-surface-900 dark:text-surface-50">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-surface-500 dark:text-surface-400 mt-2">No upcoming recurring bills</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-3 px-6 text-xs font-semibold text-surface-500 uppercase">Due Date</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-surface-500 uppercase">Payee</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-surface-500 uppercase hidden sm:table-cell">Category</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-surface-500 uppercase hidden md:table-cell">Frequency</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-surface-500 uppercase">Amount</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((item) => {
                const due = new Date(item.next_due);
                const isOverdue = due < new Date();
                const isThisWeek = due >= new Date() && due <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return (
                  <tr key={item.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                    <td className="py-3 px-6">
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : isThisWeek ? 'text-amber-600 dark:text-amber-400' : 'text-surface-600 dark:text-surface-300'}`}>
                        {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {isOverdue && <span className="block text-xs text-red-500">Overdue</span>}
                    </td>
                    <td className="py-3 px-6 font-medium text-surface-900 dark:text-surface-100">{item.payee}</td>
                    <td className="py-3 px-6 text-sm text-surface-500 dark:text-surface-400 hidden sm:table-cell">{item.category_name || '—'}</td>
                    <td className="py-3 px-6 hidden md:table-cell">
                      <span className="badge-info capitalize">{item.frequency}</span>
                    </td>
                    <td className="py-3 px-6 text-right font-semibold text-red-600 dark:text-red-400">{formatCurrency(item.amount)}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-primary-600 transition-colors" onClick={() => handleSkip(item.id)} title="Skip to next">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-primary-600 transition-colors" onClick={() => openModal(item)} title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-surface-500 hover:text-red-600 transition-colors" onClick={() => handleDelete(item.id)} title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Disabled */}
      {disabled.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3 text-surface-500 dark:text-surface-400">Disabled</h2>
          <div className="space-y-2">
            {disabled.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-50 dark:bg-surface-700/30 opacity-60">
                <div>
                  <span className="font-medium line-through text-surface-500">{item.payee}</span>
                  <span className="text-sm text-surface-400 ml-2">{formatCurrency(item.amount)}</span>
                </div>
                <button className="btn-ghost text-sm" onClick={() => handleToggle(item)}>Re-enable</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Recurring Bill' : 'Add Recurring Bill'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rec-payee" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Payee</label>
            <input id="rec-payee" type="text" className="input" value={formData.payee} onChange={e => setFormData({...formData, payee: e.target.value})} placeholder="e.g., Netflix" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rec-amount" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Amount ($)</label>
              <input id="rec-amount" type="number" step="0.01" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
            </div>
            <div>
              <label htmlFor="rec-frequency" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Frequency</label>
              <select id="rec-frequency" className="input" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rec-account" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Account</label>
              <select id="rec-account" className="input" value={formData.account_id} onChange={e => setFormData({...formData, account_id: parseInt(e.target.value)})}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rec-category" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category</label>
              <select id="rec-category" className="input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value ? parseInt(e.target.value) : ''})}>
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="rec-due" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Next Due Date</label>
            <input id="rec-due" type="date" className="input" value={formData.next_due} onChange={e => setFormData({...formData, next_due: e.target.value})} required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rec-enabled" className="rounded" checked={formData.enabled} onChange={e => setFormData({...formData, enabled: e.target.checked})} />
            <label htmlFor="rec-enabled" className="text-sm text-surface-700 dark:text-surface-300">Enabled</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Recurring;
