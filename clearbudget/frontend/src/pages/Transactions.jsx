import { useState, useEffect, useCallback } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getAccounts, getCategories } from '../api';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';
import { DocumentIllustration } from '../components/Illustrations';

const emptyForm = { account_id: '', category_id: '', date: new Date().toISOString().split('T')[0], payee: '', memo: '', amount: '', cleared: false, type: 'expense' };

function exportToCSV(txns, fc) {
  const rows = txns.map((t) => [t.date, t.payee || '', t.category_name || 'Uncategorized', t.memo || '', t.amount, t.account_name || '', t.cleared ? 'Yes' : 'No']);
  const csv = [['Date','Payee','Category','Memo','Amount','Account','Cleared'], ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function Transactions() {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [filter, setFilter] = useState({ search: '', account: '', category: '' });
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([getTransactions(), getAccounts(), getCategories()])
      .then(([t, a, c]) => { setTransactions(t.data); setAccounts(a.data); setCategories(c.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (tx = null) => {
    if (tx) {
      setEditingTx(tx);
      setFormData({ account_id: tx.account_id, category_id: tx.category_id || '', date: tx.date.split('T')[0], payee: tx.payee || '', memo: tx.memo || '', amount: Math.abs(parseFloat(tx.amount)), cleared: tx.cleared, type: tx.amount >= 0 ? 'income' : 'expense' });
    } else {
      setEditingTx(null);
      setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0], account_id: accounts[0]?.id || '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const amount = formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
    try {
      if (editingTx) {
        const res = await updateTransaction(editingTx.id, { ...formData, amount });
        setTransactions((p) => p.map((t) => (t.id === editingTx.id ? res.data : t)));
        toast('Updated', 'success');
      } else {
        const res = await createTransaction({ ...formData, amount });
        setTransactions((p) => [res.data, ...p]);
        toast('Added', 'success');
      }
      setShowModal(false);
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try { await deleteTransaction(id); setTransactions((p) => p.filter((t) => t.id !== id)); toast('Deleted', 'info'); }
    catch (err) { toast('Failed: ' + err.message, 'error'); }
  };

  const filtered = transactions.filter((tx) => {
    if (filter.account && tx.account_id !== parseInt(filter.account)) return false;
    if (filter.category && tx.category_id !== parseInt(filter.category)) return false;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      if (!tx.payee?.toLowerCase().includes(s) && !tx.memo?.toLowerCase().includes(s) && !tx.category_name?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-5 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#09090b] dark:text-[#fafafa]">Transactions</h1>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 self-start">
          <button className="btn-secondary text-[12px] px-3 py-[7px]" onClick={() => exportToCSV(filtered, formatCurrency)}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export
          </button>
          <button className="btn-primary text-[12px] px-3 py-[7px]" onClick={() => openModal()}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="sm:col-span-2 relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input className="input pl-8 input-sm" placeholder="Search..." value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} aria-label="Search" />
          </div>
          <select className="input input-sm" value={filter.account} onChange={(e) => setFilter({ ...filter, account: e.target.value })} aria-label="Account"><option value="">All Accounts</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <select className="input input-sm" value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} aria-label="Category"><option value="">All Categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <DocumentIllustration />
            <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa] mt-2">No transactions found</h3>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="table" role="table" aria-label="Transactions">
            <thead>
              <tr><th scope="col">Date</th><th scope="col">Payee</th><th scope="col" className="hidden sm:table-cell">Category</th><th scope="col" className="hidden lg:table-cell">Memo</th><th scope="col" className="text-right">Amount</th><th scope="col" className="text-center w-16">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const isIncome = tx.amount >= 0;
                return (
                  <tr key={tx.id}>
                    <td className="whitespace-nowrap text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="font-medium text-[13px] text-[#09090b] dark:text-[#fafafa]">{tx.payee || <span className="text-neutral-400">—</span>}</td>
                    <td className="hidden sm:table-cell">{tx.category_name ? <span className="badge-positive">{tx.category_name}</span> : <span className="badge-warning">Uncategorized</span>}</td>
                    <td className="hidden lg:table-cell text-neutral-400 dark:text-neutral-500 text-[12px] truncate max-w-[160px]">{tx.memo || <span className="text-neutral-400">—</span>}</td>
                    <td className={`text-right font-bold tabular-nums text-[13px] ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#09090b] dark:text-[#fafafa]'}`}>{formatCurrency(tx.amount)}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="btn-ghost" onClick={() => openModal(tx)} aria-label="Edit"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg></button>
                        <button className="btn-ghost text-red-500" onClick={() => handleDelete(tx.id)} aria-label="Delete"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTx ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Type</label>
            <div className="flex gap-2">
              {['expense', 'income'].map((t) => (
                <button key={t} type="button" className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all ${formData.type === t ? (t === 'expense' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 ring-1 ring-red-200/50 dark:ring-red-800/40' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/40') : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 ring-1 ring-neutral-200/50 dark:ring-neutral-700/50'}`} onClick={() => setFormData({ ...formData, type: t })}>{t === 'expense' ? '↓ Expense' : '↑ Income'}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Account</label><select className="input" value={formData.account_id} onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })} required>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div><label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Category</label><select className="input" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : '' })}><option value="">No Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Date</label><input type="date" className="input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
            <div><label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Amount</label><input type="number" step="0.01" min="0" className="input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" required /></div>
          </div>
          <div><label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Payee</label><input type="text" className="input" value={formData.payee} onChange={(e) => setFormData({ ...formData, payee: e.target.value })} placeholder="e.g., Whole Foods" /></div>
          <div><label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Memo</label><input type="text" className="input" value={formData.memo} onChange={(e) => setFormData({ ...formData, memo: e.target.value })} placeholder="Optional note" /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="tx-cleared" className="rounded border-neutral-300 dark:border-neutral-600" checked={formData.cleared} onChange={(e) => setFormData({ ...formData, cleared: e.target.checked })} /><label htmlFor="tx-cleared" className="text-[12px] text-neutral-600 dark:text-neutral-400">Cleared</label></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" className="btn-secondary text-[12px] px-3 py-[7px]" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary text-[12px] px-3 py-[7px]" disabled={saving}>{saving ? 'Saving...' : editingTx ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Transactions;
