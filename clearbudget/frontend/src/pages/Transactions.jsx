import { useState, useEffect, useCallback } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, importTransactions, getAccounts, getCategories, getCategoryGroups, createCategoryGroup, createCategory } from '../api';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';
import { readImportRows } from '../utils/transactionImport';
import { categorizeImportedRows, defaultCategoryGroups } from '../utils/categorization';

const emptyForm = { account_id: '', category_id: '', date: new Date().toISOString().split('T')[0], payee: '', memo: '', amount: '', cleared: false, type: 'expense' };

function exportToCSV(txns) {
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
  const [filter, setFilter] = useState({ search: '', account: '', category: '', type: '', startDate: '', endDate: '', sort: 'newest' });
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importAccountId, setImportAccountId] = useState('');
  const [importCategoryId, setImportCategoryId] = useState('');
  const [statementStartBalance, setStatementStartBalance] = useState('');
  const [statementEndBalance, setStatementEndBalance] = useState('');
  const [syncStatementBalance, setSyncStatementBalance] = useState(false);
  const [smartCategorize, setSmartCategorize] = useState(true);
  const [importing, setImporting] = useState(false);

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

  const openImportModal = () => {
    setImportRows([]);
    setImportFileName('');
    setImportAccountId(accounts[0]?.id || '');
    setImportCategoryId('');
    setStatementStartBalance('');
    setStatementEndBalance('');
    setSyncStatementBalance(false);
    setSmartCategorize(true);
    setShowImportModal(true);
  };

  const ensureSmartCategories = async () => {
    const [groupsResponse, categoriesResponse] = await Promise.all([getCategoryGroups(), getCategories()]);
    let nextGroups = groupsResponse.data || [];
    let nextCategories = categoriesResponse.data || [];
    const categoryNames = new Set(nextCategories.map((category) => category.name.toLowerCase()));

    for (const group of defaultCategoryGroups) {
      let savedGroup = nextGroups.find((item) => item.name.toLowerCase() === group.name.toLowerCase());
      if (!savedGroup) {
        const createdGroup = await createCategoryGroup({ name: group.name, icon: group.icon, sort_order: group.sort_order });
        savedGroup = { ...createdGroup.data, categories: [] };
        nextGroups = [...nextGroups, savedGroup];
      }

      for (const categoryName of group.categories) {
        if (categoryNames.has(categoryName.toLowerCase())) continue;
        const createdCategory = await createCategory({ category_group_id: savedGroup.id, name: categoryName, budgeted: 0 });
        nextCategories = [...nextCategories, { ...createdCategory.data, group_name: savedGroup.name }];
        categoryNames.add(categoryName.toLowerCase());
      }
    }

    setCategories(nextCategories);
    return nextCategories;
  };

  const applySmartCategories = async (rows, enabled = smartCategorize) => {
    if (!enabled) return rows;
    const availableCategories = await ensureSmartCategories();
    return categorizeImportedRows(rows, availableCategories, transactions);
  };

  const updateImportRowCategory = (index, categoryId) => {
    const category = categories.find((item) => item.id === parseInt(categoryId, 10));
    setImportRows((rows) => rows.map((row, rowIndex) => (
      rowIndex === index
        ? { ...row, category_id: category?.id || null, category_name: category?.name || '', confidence: category ? 'manual' : '' }
        : row
    )));
  };

  const rerunSmartCategories = async () => {
    if (!importRows.length) return;
    try {
      const categorized = await applySmartCategories(importRows.map(({ category_id, category_name, confidence, ...row }) => row), true);
      setImportRows(categorized);
      toast('Categories suggested', 'success');
    } catch (err) {
      toast('Could not suggest categories: ' + err.message, 'error');
    }
  };

  const stripImportMetadata = ({ source, category_name, confidence, ...row }) => row;
  const parseBalanceInput = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const importTotal = importRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const statementStart = parseBalanceInput(statementStartBalance);
  const statementEnd = parseBalanceInput(statementEndBalance);
  const hasStatementBalances = statementStart !== null && statementEnd !== null;
  const expectedStatementEnd = hasStatementBalances ? statementStart + importTotal : null;
  const reconciliationDifference = hasStatementBalances ? statementEnd - expectedStatementEnd : null;
  const reconciliationMatched = hasStatementBalances && Math.abs(reconciliationDifference) < 0.01;

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const normalized = await readImportRows(file);
      const categorized = await applySmartCategories(normalized);
      setImportFileName(file.name);
      setImportRows(categorized);
      setSyncStatementBalance(false);
      if (!categorized.length) toast('No valid transactions found. Check date and amount columns.', 'error');
      else toast(`Found ${categorized.length} transaction${categorized.length === 1 ? '' : 's'} with smart categories`, 'success');
    } catch (err) {
      toast('Failed to read file: ' + err.message, 'error');
    } finally {
      event.target.value = '';
    }
  };

  const handleImportSubmit = async (event) => {
    event.preventDefault();
    if (!importAccountId) {
      toast('Choose the account these transactions belong to.', 'error');
      return;
    }
    if (!importRows.length) {
      toast('Choose an Excel or CSV file first.', 'error');
      return;
    }
    if (syncStatementBalance && !reconciliationMatched) {
      toast('Statement balances must match the imported total before updating the account balance.', 'error');
      return;
    }

    setImporting(true);
    try {
      const rowsToImport = smartCategorize
        ? await applySmartCategories(importRows.map(stripImportMetadata), true)
        : importRows;
      const res = await importTransactions({
        account_id: parseInt(importAccountId, 10),
        category_id: importCategoryId ? parseInt(importCategoryId, 10) : null,
        reconcile_balance: syncStatementBalance && reconciliationMatched,
        statement_start_balance: statementStart,
        statement_end_balance: statementEnd,
        transactions: rowsToImport.map(stripImportMetadata),
      });
      const balanceMessage = res.data.reconciled ? ' and updated the account balance' : '';
      toast(`Imported ${res.data.imported} transaction${res.data.imported === 1 ? '' : 's'}${balanceMessage}`, 'success');
      setShowImportModal(false);
      loadData();
    } catch (err) {
      toast('Import failed: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    if (filter.account && tx.account_id !== parseInt(filter.account)) return false;
    if (filter.category && tx.category_id !== parseInt(filter.category)) return false;
    if (filter.type === 'income' && tx.amount < 0) return false;
    if (filter.type === 'expense' && tx.amount >= 0) return false;
    if (filter.type === 'uncleared' && tx.cleared) return false;
    if (filter.startDate && tx.date.split('T')[0] < filter.startDate) return false;
    if (filter.endDate && tx.date.split('T')[0] > filter.endDate) return false;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      if (!tx.payee?.toLowerCase().includes(s) && !tx.memo?.toLowerCase().includes(s) && !tx.category_name?.toLowerCase().includes(s) && !tx.account_name?.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (filter.sort === 'oldest') return new Date(a.date) - new Date(b.date);
    if (filter.sort === 'amount-high') return Math.abs(b.amount) - Math.abs(a.amount);
    if (filter.sort === 'amount-low') return Math.abs(a.amount) - Math.abs(b.amount);
    if (filter.sort === 'payee') return (a.payee || '').localeCompare(b.payee || '');
    return new Date(b.date) - new Date(a.date);
  });

  const totals = filtered.reduce((acc, tx) => {
    const amount = parseFloat(tx.amount) || 0;
    if (amount >= 0) acc.income += amount;
    else acc.spending += Math.abs(amount);
    acc.net += amount;
    return acc;
  }, { income: 0, spending: 0, net: 0 });
  const activeFilterCount = ['search', 'account', 'category', 'type', 'startDate', 'endDate'].filter((key) => filter[key]).length;
  const resetFilters = () => setFilter({ search: '', account: '', category: '', type: '', startDate: '', endDate: '', sort: 'newest' });

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-5 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#09090b] dark:text-[#fafafa]">Transactions</h1>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}{activeFilterCount ? ` across ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}` : ''}</p>
        </div>
        <div className="flex gap-2 self-start">
          <button className="btn-secondary text-[12px] px-3 py-[7px]" onClick={openImportModal}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
            Import
          </button>
          <button className="btn-secondary text-[12px] px-3 py-[7px]" onClick={() => exportToCSV(filtered)}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export
          </button>
          <button className="btn-primary text-[12px] px-3 py-[7px]" onClick={() => openModal()}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="metric-tile">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Income</p>
          <p className="mt-1 text-[20px] font-bold tracking-[-0.03em] tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.income)}</p>
        </div>
        <div className="metric-tile">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Spending</p>
          <p className="mt-1 text-[20px] font-bold tracking-[-0.03em] tabular-nums text-[#09090b] dark:text-[#fafafa]">{formatCurrency(totals.spending)}</p>
        </div>
        <div className="metric-tile">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Net Flow</p>
          <p className={`mt-1 text-[20px] font-bold tracking-[-0.03em] tabular-nums ${totals.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(totals.net)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <div className="sm:col-span-2 relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input className="input pl-8 input-sm" placeholder="Search payee, memo, category, account..." value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} aria-label="Search" />
          </div>
          <select className="input input-sm" value={filter.account} onChange={(e) => setFilter({ ...filter, account: e.target.value })} aria-label="Account"><option value="">All Accounts</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <select className="input input-sm" value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} aria-label="Category"><option value="">All Categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className="input input-sm" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} aria-label="Transaction type">
            <option value="">Any Type</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
            <option value="uncleared">Uncleared</option>
          </select>
          <select className="input input-sm" value={filter.sort} onChange={(e) => setFilter({ ...filter, sort: e.target.value })} aria-label="Sort transactions">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Largest Amount</option>
            <option value="amount-low">Smallest Amount</option>
            <option value="payee">Payee A-Z</option>
          </select>
          <input className="input input-sm" type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} aria-label="Start date" />
          <input className="input input-sm" type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} aria-label="End date" />
          <button className="btn-secondary text-[12px] px-3 py-[7px] lg:col-span-2" type="button" onClick={resetFilters} disabled={!activeFilterCount && filter.sort === 'newest'}>Clear Filters</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>
            </div>
            <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">No transactions found</h3>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Try adjusting your filters or add a new transaction.</p>
            <button className="btn-secondary mt-4 text-[12px] px-3 py-[7px]" onClick={resetFilters}>Reset Filters</button>
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

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Bank File">
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/70 p-4 text-center dark:border-neutral-700 dark:bg-neutral-900/30">
            <input id="transaction-import-file" type="file" className="sr-only" accept=".xlsx,.xls,.csv,.txt" onChange={handleImportFile} />
            <label htmlFor="transaction-import-file" className="btn-secondary inline-flex cursor-pointer px-3 py-2 text-[12px]">
              Choose Excel or CSV
            </label>
            <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              Supports Handelsbanken and common bank exports with date, text/description, amount, debit, or credit columns.
            </p>
            {importFileName && <p className="mt-2 text-[11px] font-semibold text-[#09090b] dark:text-[#fafafa]">{importFileName}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-400">Destination account</label>
              <select className="input" value={importAccountId} onChange={(e) => setImportAccountId(e.target.value)} required>
                <option value="">Choose account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-400">Default category</label>
              <select className="input" value={importCategoryId} onChange={(e) => setImportCategoryId(e.target.value)}>
                <option value="">Leave uncategorized</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-lg bg-emerald-50/70 p-3 text-[12px] text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-emerald-300 dark:border-emerald-700"
              checked={smartCategorize}
              onChange={async (event) => {
                setSmartCategorize(event.target.checked);
                if (event.target.checked && importRows.length) await rerunSmartCategories();
              }}
            />
            <span className="flex-1">
              Smart categorize imported transactions.
              <span className="mt-0.5 block text-[11px] text-emerald-700/80 dark:text-emerald-300/80">Creates a clean starter budget category set if needed, then matches merchants like Willys, ICA, SL, Vattenfall, Amazon, OpenAI, and more.</span>
            </span>
            {importRows.length > 0 && smartCategorize && (
              <button type="button" className="text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300" onClick={rerunSmartCategories}>
                Re-run
              </button>
            )}
          </label>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-semibold text-[#09090b] dark:text-[#fafafa]">Statement balance check</p>
                <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">Use this when the file covers the full statement period. Otherwise your account balance stays unchanged.</p>
              </div>
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Import total: {formatCurrency(importTotal)}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-400">Statement start balance</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={statementStartBalance}
                  onChange={(event) => {
                    setStatementStartBalance(event.target.value);
                    setSyncStatementBalance(false);
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-400">Statement end balance</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={statementEndBalance}
                  onChange={(event) => {
                    setStatementEndBalance(event.target.value);
                    setSyncStatementBalance(false);
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {hasStatementBalances && (
              <div className={`mt-3 rounded-lg border p-3 text-[12px] ${reconciliationMatched ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200'}`}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.06em] opacity-70">Expected end</span>
                    <span className="font-bold tabular-nums">{formatCurrency(expectedStatementEnd)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.06em] opacity-70">Statement end</span>
                    <span className="font-bold tabular-nums">{formatCurrency(statementEnd)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.06em] opacity-70">Difference</span>
                    <span className="font-bold tabular-nums">{formatCurrency(reconciliationDifference)}</span>
                  </div>
                </div>
                <p className="mt-2 text-[11px]">{reconciliationMatched ? 'Matched. You can set the account balance to the statement end balance after import.' : 'Not matched yet. Check whether the file is missing rows, duplicated rows, or uses the opposite sign convention.'}</p>
              </div>
            )}

            <label className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-[12px] ${reconciliationMatched ? 'bg-white text-neutral-700 ring-1 ring-neutral-200 dark:bg-neutral-950/40 dark:text-neutral-300 dark:ring-neutral-800' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-950/20 dark:text-neutral-500'}`}>
              <input
                type="checkbox"
                className="mt-0.5 rounded border-neutral-300 dark:border-neutral-600"
                checked={syncStatementBalance && reconciliationMatched}
                disabled={!reconciliationMatched}
                onChange={(event) => setSyncStatementBalance(event.target.checked)}
              />
              <span>
                Set account balance to statement end balance after import.
                <span className="mt-0.5 block text-[11px] text-neutral-500 dark:text-neutral-400">This replaces the old imported-total adjustment and only unlocks after the statement math matches.</span>
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
              <p className="text-[12px] font-semibold text-[#09090b] dark:text-[#fafafa]">Preview</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {importRows.length} row{importRows.length === 1 ? '' : 's'}
                {importRows.length > 0 ? `, ${importRows.filter((row) => row.category_id).length} categorized` : ''}
              </p>
            </div>
            <div className="max-h-72 overflow-auto">
              {importRows.length === 0 ? (
                <p className="p-4 text-center text-[12px] text-neutral-500 dark:text-neutral-400">Choose a file to preview transactions.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Payee</th>
                      <th>Category</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 12).map((row, index) => (
                      <tr key={`${row.date}-${row.payee}-${index}`}>
                        <td className="whitespace-nowrap text-[11px] text-neutral-500">{row.date}</td>
                        <td className="text-[12px] font-medium text-[#09090b] dark:text-[#fafafa]">{row.payee}</td>
                        <td>
                          <select
                            className="input input-sm min-w-[150px]"
                            value={row.category_id || ''}
                            onChange={(event) => updateImportRowCategory(index, event.target.value)}
                            aria-label={`Category for ${row.payee}`}
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                          </select>
                          {row.confidence && row.category_id && (
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-neutral-400 dark:text-neutral-500">{row.confidence}</span>
                          )}
                        </td>
                        <td className={`text-right text-[12px] font-bold tabular-nums ${row.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" className="btn-secondary text-[12px] px-3 py-[7px]" onClick={() => setShowImportModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary text-[12px] px-3 py-[7px]" disabled={importing || !importRows.length}>{importing ? 'Importing...' : 'Import Transactions'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Transactions;
