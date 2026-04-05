import { useState, useEffect, useCallback } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getAccounts, getCategories } from '../api';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

const emptyForm = {
  account_id: '',
  category_id: '',
  date: new Date().toISOString().split('T')[0],
  payee: '',
  memo: '',
  amount: '',
  cleared: false,
  type: 'expense',
};

function exportToCSV(transactions, formatCurrency) {
  const headers = ['Date', 'Payee', 'Category', 'Memo', 'Amount', 'Account', 'Cleared'];
  const rows = transactions.map((tx) => [
    tx.date,
    tx.payee || '',
    tx.category_name || 'Uncategorized',
    tx.memo || '',
    tx.amount,
    tx.account_name || '',
    tx.cleared ? 'Yes' : 'No',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
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
      .then(([txRes, accRes, catRes]) => {
        setTransactions(txRes.data);
        setAccounts(accRes.data);
        setCategories(catRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (tx = null) => {
    if (tx) {
      setEditingTx(tx);
      setFormData({
        account_id: tx.account_id,
        category_id: tx.category_id || '',
        date: tx.date.split('T')[0],
        payee: tx.payee || '',
        memo: tx.memo || '',
        amount: Math.abs(parseFloat(tx.amount)),
        cleared: tx.cleared,
        type: tx.amount >= 0 ? 'income' : 'expense',
      });
    } else {
      setEditingTx(null);
      setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0], account_id: accounts[0]?.id || '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isExpense = formData.type === 'expense';
    const amount = isExpense ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));

    try {
      if (editingTx) {
        const res = await updateTransaction(editingTx.id, { ...formData, amount });
        setTransactions((prev) => prev.map((tx) => (tx.id === editingTx.id ? res.data : tx)));
        toast('Transaction updated', 'success');
      } else {
        const res = await createTransaction({ ...formData, amount });
        setTransactions((prev) => [res.data, ...prev]);
        toast('Transaction added', 'success');
      }
      setShowModal(false);
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      toast('Transaction deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter.account && tx.account_id !== parseInt(filter.account)) return false;
    if (filter.category && tx.category_id !== parseInt(filter.category)) return false;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      if (
        !tx.payee?.toLowerCase().includes(s) &&
        !tx.memo?.toLowerCase().includes(s) &&
        !tx.category_name?.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Transactions</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <button className="btn-secondary" onClick={() => exportToCSV(filteredTransactions, formatCurrency)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                id="search"
                type="text"
                className="input pl-9"
                placeholder="Search payees, categories, memos..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="filter-account" className="sr-only">Filter by account</label>
            <select id="filter-account" className="input" value={filter.account} onChange={(e) => setFilter({ ...filter, account: e.target.value })}>
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-category" className="sr-only">Filter by category</label>
            <select id="filter-category" className="input" value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">No transactions found</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Try adjusting your filters or add a new transaction.</p>
          </div>
        ) : (
          <table className="table" role="table" aria-label="Transactions">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Payee</th>
                <th scope="col" className="hidden sm:table-cell">Category</th>
                <th scope="col" className="hidden lg:table-cell">Memo</th>
                <th scope="col" className="text-right">Amount</th>
                <th scope="col" className="text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="font-medium text-neutral-900 dark:text-neutral-100">{tx.payee || <span className="text-neutral-400">—</span>}</td>
                  <td className="hidden sm:table-cell">
                    {tx.category_name ? (
                      <span className="badge-positive">{tx.category_name}</span>
                    ) : (
                      <span className="badge-warning">Uncategorized</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell text-neutral-500 dark:text-neutral-400 text-xs truncate max-w-[200px]">{tx.memo || <span className="text-neutral-400">—</span>}</td>
                  <td className={`text-right font-semibold tabular-nums ${tx.amount >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="btn-ghost" onClick={() => openModal(tx)} aria-label={`Edit ${tx.payee || 'transaction'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button className="btn-ghost text-negative-500 hover:text-negative-700" onClick={() => handleDelete(tx.id)} aria-label={`Delete ${tx.payee || 'transaction'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTx ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Type</label>
            <div className="flex gap-2">
              {['expense', 'income'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    formData.type === type
                      ? type === 'expense'
                        ? 'bg-negative-50 dark:bg-negative-900/30 text-negative-700 dark:text-negative-400 ring-1 ring-negative-200 dark:ring-negative-800'
                        : 'bg-positive-50 dark:bg-positive-900/30 text-positive-700 dark:text-positive-400 ring-1 ring-positive-200 dark:ring-positive-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                  onClick={() => setFormData({ ...formData, type })}
                >
                  {type === 'expense' ? '↓ Expense' : '↑ Income'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-account" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Account</label>
              <select id="tx-account" className="input" value={formData.account_id} onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })} required>
                {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tx-category" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Category</label>
              <select id="tx-category" className="input" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : '' })}>
                <option value="">No Category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-date" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Date</label>
              <input id="tx-date" type="date" className="input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="tx-amount" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Amount</label>
              <input id="tx-amount" type="number" step="0.01" min="0" className="input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" required />
            </div>
          </div>
          <div>
            <label htmlFor="tx-payee" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Payee</label>
            <input id="tx-payee" type="text" className="input" value={formData.payee} onChange={(e) => setFormData({ ...formData, payee: e.target.value })} placeholder="e.g., Whole Foods" />
          </div>
          <div>
            <label htmlFor="tx-memo" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Memo</label>
            <input id="tx-memo" type="text" className="input" value={formData.memo} onChange={(e) => setFormData({ ...formData, memo: e.target.value })} placeholder="Optional note" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="tx-cleared" className="rounded border-neutral-300 dark:border-neutral-600" checked={formData.cleared} onChange={(e) => setFormData({ ...formData, cleared: e.target.checked })} />
            <label htmlFor="tx-cleared" className="text-xs text-neutral-700 dark:text-neutral-300">Cleared</label>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              ) : editingTx ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Transactions;
