import { useState, useEffect, useCallback } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api';
import Modal from '../components/Modal';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

const accountStyles = {
  checking: { icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z', gradient: 'from-sky-400 to-blue-500', bg: 'bg-sky-50 dark:bg-sky-950/30' },
  savings: { icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  creditCard: { icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z', gradient: 'from-violet-400 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  cash: { icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
    getAccounts().then((r) => { setAccounts(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const openModal = (acc = null) => {
    if (acc) { setEditingAcc(acc); setFormData({ name: acc.name, type: acc.type, balance: acc.balance.toString() }); }
    else { setEditingAcc(null); setFormData({ name: '', type: 'checking', balance: '' }); }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingAcc) {
        const res = await updateAccount(editingAcc.id, { ...formData, balance: parseFloat(formData.balance) || 0 });
        setAccounts((p) => p.map((a) => (a.id === editingAcc.id ? res.data : a))); toast('Updated', 'success');
      } else {
        const res = await createAccount({ ...formData, balance: parseFloat(formData.balance) || 0 });
        setAccounts((p) => [...p, res.data]); toast('Added', 'success');
      }
      setShowModal(false);
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    try { await deleteAccount(id); setAccounts((p) => p.filter((a) => a.id !== id)); toast('Deleted', 'info'); }
    catch (err) { toast('Failed: ' + err.message, 'error'); }
  };

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Accounts</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{accounts.length} accounts</p>
        </div>
        <button className="btn-primary self-start" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Account
        </button>
      </div>

      {/* Net worth */}
      <div className={`rounded-xl p-6 ${totalBalance >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border border-red-200 dark:border-red-800'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${totalBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>Net Worth</p>
        <p className={`text-4xl font-black tracking-tight mt-1 tabular-nums ${totalBalance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(totalBalance)}</p>
      </div>

      {/* Grid */}
      {accounts.length === 0 ? (
        <div className="card text-center py-20">
          <svg className="w-20 h-20 mx-auto text-neutral-200 dark:text-neutral-700 mb-4" viewBox="0 0 80 80" fill="none"><rect x="12" y="20" width="56" height="44" rx="10" stroke="currentColor" strokeWidth="2.5" /><rect x="22" y="32" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="2" /><circle cx="56" cy="38" r="3" fill="currentColor" /></svg>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No accounts yet</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Add your first account to start tracking.</p>
          <button className="btn-primary mt-4" onClick={() => openModal()}>Add Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const style = accountStyles[acc.type] || accountStyles.checking;
            return (
              <div key={acc.id} className="card p-5 group hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={style.icon} /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{acc.name}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{acc.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" onClick={() => openModal(acc)} aria-label="Edit"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500" onClick={() => handleDelete(acc.id)} aria-label="Delete"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                  </div>
                </div>
                <p className={`text-2xl font-black tracking-tight tabular-nums mt-4 ${parseFloat(acc.balance) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(acc.balance)}</p>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAcc ? 'Edit Account' : 'Add Account'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Name</label><input type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Chase Checking" required /></div>
          <div><label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Type</label><select className="input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option value="checking">Checking</option><option value="savings">Savings</option><option value="creditCard">Credit Card</option><option value="cash">Cash</option></select></div>
          <div><label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Starting Balance</label><input type="number" step="0.01" className="input" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} placeholder="0.00" /></div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : editingAcc ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Accounts;
