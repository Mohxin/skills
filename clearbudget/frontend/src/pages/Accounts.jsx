import { useState, useEffect, useCallback } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api';
import Modal from '../components/Modal';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

const accountTypeColors = {
  checking: { bg: 'bg-sky-50 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
  savings: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  creditCard: { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  cash: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
};

const accountTypeIcons = {
  checking: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  savings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  creditCard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  cash: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function Accounts() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'checking', balance: '' });
  const [saving, setSaving] = useState(false);

  const loadAccounts = useCallback(() => {
    getAccounts()
      .then((res) => { setAccounts(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const openModal = (acc = null) => {
    if (acc) {
      setEditingAcc(acc);
      setFormData({ name: acc.name, type: acc.type, balance: acc.balance.toString() });
    } else {
      setEditingAcc(null);
      setFormData({ name: '', type: 'checking', balance: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAcc) {
        const res = await updateAccount(editingAcc.id, { ...formData, balance: parseFloat(formData.balance) || 0 });
        setAccounts((prev) => prev.map((a) => (a.id === editingAcc.id ? res.data : a)));
        toast('Account updated', 'success');
      } else {
        const res = await createAccount({ ...formData, balance: parseFloat(formData.balance) || 0 });
        setAccounts((prev) => [...prev, res.data]);
        toast('Account added', 'success');
      }
      setShowModal(false);
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account? Related transactions will be affected.')) return;
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast('Account deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Accounts</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary self-start" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Net worth */}
      <div className={`rounded-lg px-4 py-3 ${totalBalance >= 0 ? 'bg-positive-50 dark:bg-positive-900/20 border border-positive-200 dark:border-positive-800' : 'bg-negative-50 dark:bg-negative-900/20 border border-negative-200 dark:border-negative-800'}`}>
        <p className={`text-xs font-medium ${totalBalance >= 0 ? 'text-positive-700 dark:text-positive-400' : 'text-negative-700 dark:text-negative-400'}`}>Net Worth</p>
        <p className={`text-2xl font-semibold tabular-nums mt-0.5 ${totalBalance >= 0 ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}`}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {/* Accounts grid */}
      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">No accounts yet</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Add your first account to start tracking.</p>
          <button className="btn-primary mt-4" onClick={() => openModal()}>Add Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => {
            const colors = accountTypeColors[acc.type] || accountTypeColors.checking;
            return (
              <div key={acc.id} className="card group p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                      {accountTypeIcons[acc.type] || accountTypeIcons.checking}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{acc.name}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{acc.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors" onClick={() => openModal(acc)} aria-label={`Edit ${acc.name}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button className="p-1.5 rounded hover:bg-negative-50 dark:hover:bg-negative-900/30 text-neutral-400 hover:text-negative-500 transition-colors" onClick={() => handleDelete(acc.id)} aria-label={`Delete ${acc.name}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className={`text-lg font-semibold tabular-nums mt-3 ${parseFloat(acc.balance) >= 0 ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}`}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAcc ? 'Edit Account' : 'Add Account'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="acc-name" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Name</label>
            <input id="acc-name" type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Chase Checking" required />
          </div>
          <div>
            <label htmlFor="acc-type" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Type</label>
            <select id="acc-type" className="input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="creditCard">Credit Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label htmlFor="acc-balance" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Starting Balance</label>
            <input id="acc-balance" type="number" step="0.01" className="input" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} placeholder="0.00" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingAcc ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Accounts;
