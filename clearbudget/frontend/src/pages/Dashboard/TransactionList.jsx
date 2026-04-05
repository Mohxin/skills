import { Link } from 'react-router-dom';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
      <svg className="h-12 w-12 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <h3 className="mt-3 text-sm font-medium text-surface-900 dark:text-surface-50">No transactions yet</h3>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Record your first expense or income to get started.</p>
      <Link to="/transactions" className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
        Add your first transaction →
      </Link>
    </div>
  );
}

function TransactionRow({ transaction }) {
  const isIncome = transaction.amount >= 0;
  const dateStr = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
          {transaction.payee || 'No payee'}
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {transaction.category_name || 'Uncategorized'}
          {' · '}
          {dateStr}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isIncome ? '+' : ''}{transaction.amount_formatted}
      </p>
    </li>
  );
}

function TransactionList({ transactions }) {
  if (!transactions?.length) return <EmptyState />;

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
      <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">Recent Transactions</h2>
        <Link to="/transactions" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
          View all →
        </Link>
      </div>
      <ul role="list" className="divide-y divide-surface-100 dark:divide-surface-700/50 px-4">
        {transactions.map(tx => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </ul>
    </div>
  );
}

export default TransactionList;
