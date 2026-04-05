import { useState, useEffect, useCallback } from 'react';
import { getRecurring, createRecurring, updateRecurring, skipRecurring, deleteRecurring, getAccounts, getCategories } from '../api';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

function Recurring() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ account_id: '', category_id: '', payee: '', amount: '', frequency: 'monthly', next_due: new Date().toISOString().split('T')[0], enabled: true });
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
      setFormData({ account_id: item.account_id, category_id: item.category_id || '', payee: item.payee, amount: Math.abs(parseFloat(item.amount)), frequency: item.frequency, next_due: item.next_due?.split('T')[0] || '', enabled: item.enabled });
    } else {
      setEditing(null);
      setFormData({ account_id: accounts[0]?.id || '', category_id: '', payee: '', amount: '', frequency: 'monthly', next_due: new Date().toISOString().split('T')[0], enabled: true });
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
        setRecurring((prev) => prev.map((r) => (r.id === editing.id ? res.data : r)));
        toast('Recurring bill updated', 'success');
      } else {
        const res = await createRecurring({ ...formData, amount });
        setRecurring((prev) => [...prev, res.data]);
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
      setRecurring((prev) => prev.map((r) => (r.id === id ? res.data : r)));
      toast('Skipped to next occurrence', 'info');
    } catch (err) {
      toast('Failed to skip: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring bill?')) return;
    try {
      await deleteRecurring(id);
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      toast('Recurring bill deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await updateRecurring(item.id, { ...item, enabled: !item.enabled });
      setRecurring((prev) => prev.map((r) => (r.id === item.id ? res.data : r)));
      toast(item.enabled ? 'Disabled' : 'Enabled', 'info');
    } catch (err) {
      toast('Failed to update: ' + err.message, 'error');
    }
  };

  if (loading) return <SkeletonTable />;

  const upcoming = recurring.filter((r) => r.enabled).sort((a, b) => new Date(a.next_due) - new Date(b.next_due));
  const disabled = recurring.filter((r) => !r.enabled);
  const totalMonthly = recurring.filter((r) => r.enabled && r.frequency === 'monthly').reduce((s, r) => s + Math.abs(parseFloat(r.amount)), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Recurring Bills</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{upcoming.length} active · {formatCurrency(totalMonthly)}/month</p>
        </div>
        <button className="btn-primary self-start" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Recurring
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Monthly Total</p>
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="rounded-lg px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Next Due</p>
          {upcoming[0] ? (
            <div className="mt-0.5">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{upcoming[0].payee}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{new Date(upcoming[0].next_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {formatCurrency(upcoming[0].amount)}</p>
            </div>
          ) : <p className="text-xs text-neutral-400 mt-0.5">None</p>}
        </div>
        <div className="rounded-lg px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Due This Week</p>
          <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
            {upcoming.filter((r) => { const d = new Date(r.next_due); const w = new Date(); w.setDate(w.getDate() + 7); return d >= new Date() && d <= w; }).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold px-4 pt-3 text-neutral-900 dark:text-neutral-100">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No upcoming recurring bills</p>
          </div>
        ) : (
          <table className="table" role="table" aria-label="Recurring bills">
            <thead>
              <tr>
                <th scope="col">Due</th>
                <th scope="col">Payee</th>
                <th scope="col" className="hidden sm:table-cell">Category</th>
                <th scope="col" className="hidden md:table-cell">Frequency</th>
                <th scope="col" className="text-right">Amount</th>
                <th scope="col" className="text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((item) => {
                const due = new Date(item.next_due);
                const isOverdue = due < new Date();
                const isThisWeek = due >= new Date() && due <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return (
                  <tr key={item.id}>
                    <td>
                      <span className={`text-xs font-medium ${isOverdue ? 'text-negative-600 dark:text-negative-500' : isThisWeek ? 'text-amber-600 dark:text-amber-500' : 'text-neutral-600 dark:text-neutral-400'}`}>
                        {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {isOverdue && <span className="block text-[10px] text-negative-500">Overdue</span>}
                    </td>
                    <td className="font-medium text-neutral-900 dark:text-neutral-100">{item.payee}</td>
                    <td className="hidden sm:table-cell text-neutral-500 dark:text-neutral-400 text-xs">{item.category_name || '—'}</td>
                    <td className="hidden md:table-cell"><span className="badge-info capitalize">{item.frequency}</span></td>
                    <td className="text-right font-semibold tabular-nums text-negative-600 dark:text-negative-500">{formatCurrency(item.amount)}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="btn-ghost" onClick={() => handleSkip(item.id)} title="Skip">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        </button>
                        <button className="btn-ghost" onClick={() => openModal(item)} title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>
                        <button className="btn-ghost text-negative-500" onClick={() => handleDelete(item.id)} title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
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

      {disabled.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">Disabled</h2>
          <div className="space-y-2">
            {disabled.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-neutral-50 dark:bg-neutral-800/30 opacity-60">
                <div>
                  <span className="text-sm line-through text-neutral-500">{item.payee}</span>
                  <span className="text-xs text-neutral-400 ml-2 tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
                <button className="btn-ghost text-xs" onClick={() => handleToggle(item)}>Re-enable</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Recurring Bill' : 'Add Recurring Bill'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rec-payee" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Payee</label>
            <input id="rec-payee" type="text" className="input" value={formData.payee} onChange={(e) => setFormData({ ...formData, payee: e.target.value })} placeholder="e.g., Netflix" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rec-amount" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Amount</label>
              <input id="rec-amount" type="number" step="0.01" className="input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" required />
            </div>
            <div>
              <label htmlFor="rec-frequency" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Frequency</label>
              <select id="rec-frequency" className="input" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rec-account" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Account</label>
              <select id="rec-account" className="input" value={formData.account_id} onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rec-category" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Category</label>
              <select id="rec-category" className="input" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : '' })}>
                <option value="">No Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="rec-due" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Next Due</label>
            <input id="rec-due" type="date" className="input" value={formData.next_due} onChange={(e) => setFormData({ ...formData, next_due: e.target.value })} required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rec-enabled" className="rounded border-neutral-300 dark:border-neutral-600" checked={formData.enabled} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} />
            <label htmlFor="rec-enabled" className="text-xs text-neutral-700 dark:text-neutral-300">Enabled</label>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Recurring;
