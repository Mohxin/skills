import { useState, useEffect, useCallback } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api';
import Modal from '../components/Modal';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

const accountTypeIcons = {
  checking: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  savings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  creditCard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  cash: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const accountTypeColors = {
  checking: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
  savings: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400' },
  creditCard: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400' },
  cash: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400' },
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
      .then(res => { setAccounts(res.data); setLoading(false); })
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
        setAccounts(prev => prev.map(a => a.id === editingAcc.id ? res.data : a));
        toast('Account updated', 'success');
      } else {
        const res = await createAccount({ ...formData, balance: parseFloat(formData.balance) || 0 });
        setAccounts(prev => [...prev, res.data]);
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
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast('Account deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Accounts</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage your financial accounts</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Net Worth */}
      <div className={`card ${totalBalance >= 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center gap-2 mb-2">
          <svg className={`w-5 h-5 ${totalBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p className={`text-sm font-medium ${totalBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>Net Worth</p>
        </div>
        <p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-surface-100">No accounts yet</h3>
          <p className="mt-2 text-surface-500 dark:text-surface-400">Add your first account to get started</p>
          <button className="btn-primary mt-4" onClick={() => openModal()}>Add Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {accounts.map((acc) => {
            const colors = accountTypeColors[acc.type] || accountTypeColors.checking;
            return (
              <div key={acc.id} className="card group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text}`}>
                      {accountTypeIcons[acc.type] || accountTypeIcons.checking}
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-surface-100">{acc.name}</h3>
                      <p className="text-sm text-surface-500 dark:text-surface-400 capitalize">{acc.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-primary-600 transition-colors" 
                      onClick={() => openModal(acc)}
                      aria-label={`Edit ${acc.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-surface-500 hover:text-red-600 transition-colors" 
                      onClick={() => handleDelete(acc.id)}
                      aria-label={`Delete ${acc.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className={`text-2xl font-bold mt-4 ${parseFloat(acc.balance) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
            <label htmlFor="acc-name" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Account Name</label>
            <input id="acc-name" type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Chase Checking" required />
          </div>
          <div>
            <label htmlFor="acc-type" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Account Type</label>
            <select id="acc-type" className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="creditCard">Credit Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label htmlFor="acc-balance" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Starting Balance ($)</label>
            <input id="acc-balance" type="number" step="0.01" className="input" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} placeholder="0.00" />
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
                editingAcc ? 'Update' : 'Add'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Accounts;
