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
        setTransactions(prev => prev.map(tx => tx.id === editingTx.id ? res.data : tx));
        toast('Transaction updated successfully', 'success');
      } else {
        const res = await createTransaction({ ...formData, amount });
        setTransactions(prev => [res.data, ...prev]);
        toast('Transaction added successfully', 'success');
      }
      setShowModal(false);
    } catch (err) {
      toast('Failed to save transaction: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      toast('Transaction deleted', 'info');
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter.account && tx.account_id !== parseInt(filter.account)) return false;
    if (filter.category && tx.category_id !== parseInt(filter.category)) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      const matches = 
        tx.payee?.toLowerCase().includes(search) ||
        tx.memo?.toLowerCase().includes(search) ||
        tx.category_name?.toLowerCase().includes(search);
      if (!matches) return false;
    }
    return true;
  });

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Transactions</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{filteredTransactions.length} transactions</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search"
                type="text"
                className="input pl-10"
                placeholder="Search payees, categories, memos..."
                value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="filter-account" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Account</label>
            <select id="filter-account" className="input" value={filter.account} onChange={e => setFilter({ ...filter, account: e.target.value })}>
              <option value="">All Accounts</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-category" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category</label>
            <select id="filter-category" className="input" value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full" role="table" aria-label="Transactions">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Date</th>
              <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Payee</th>
              <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Category</th>
              <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider hidden lg:table-cell">Memo</th>
              <th scope="col" className="text-right py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Amount</th>
              <th scope="col" className="text-center py-3 px-4 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-surface-500 dark:text-surface-400 mt-2">No transactions found</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                  <td className="py-3 px-4 text-sm text-surface-600 dark:text-surface-300">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 font-medium text-surface-900 dark:text-surface-100">{tx.payee || <span className="text-surface-400">—</span>}</td>
                  <td className="py-3 px-4">
                    {tx.category_name ? (
                      <span className="badge-positive">{tx.category_name}</span>
                    ) : (
                      <span className="badge-warning">Uncategorized</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-surface-500 dark:text-surface-400 text-sm hidden lg:table-cell max-w-[200px] truncate">{tx.memo || <span className="text-surface-400">—</span>}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-primary-600 transition-colors" 
                        onClick={() => openModal(tx)}
                        aria-label={`Edit transaction for ${tx.payee || 'unknown'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-surface-500 hover:text-red-600 transition-colors" 
                        onClick={() => handleDelete(tx.id)}
                        aria-label={`Delete transaction for ${tx.payee || 'unknown'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTx ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-type" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${formData.type === 'expense' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'}`}
                  onClick={() => setFormData({...formData, type: 'expense'})}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${formData.type === 'income' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'}`}
                  onClick={() => setFormData({...formData, type: 'income'})}
                >
                  Income
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="tx-account" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Account</label>
              <select id="tx-account" className="input" value={formData.account_id} onChange={e => setFormData({...formData, account_id: parseInt(e.target.value)})} required>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="tx-category" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category</label>
            <select id="tx-category" className="input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value ? parseInt(e.target.value) : ''})}>
              <option value="">No Category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-date" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Date</label>
              <input id="tx-date" type="date" className="input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div>
              <label htmlFor="tx-amount" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Amount ($)</label>
              <input id="tx-amount" type="number" step="0.01" min="0" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
            </div>
          </div>
          <div>
            <label htmlFor="tx-payee" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Payee</label>
            <input id="tx-payee" type="text" className="input" value={formData.payee} onChange={e => setFormData({...formData, payee: e.target.value})} placeholder="e.g., Whole Foods" />
          </div>
          <div>
            <label htmlFor="tx-memo" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Memo</label>
            <input id="tx-memo" type="text" className="input" value={formData.memo} onChange={e => setFormData({...formData, memo: e.target.value})} placeholder="Optional note" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="tx-cleared" className="rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked={formData.cleared} onChange={e => setFormData({...formData, cleared: e.target.checked})} />
            <label htmlFor="tx-cleared" className="text-sm text-surface-700 dark:text-surface-300">Cleared</label>
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
                editingTx ? 'Update' : 'Add'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Transactions;
