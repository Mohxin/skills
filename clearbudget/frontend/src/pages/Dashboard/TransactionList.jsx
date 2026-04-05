import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

function EmptyState() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent Transactions</h2>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <svg className="h-10 w-10 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
        <h3 className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">No transactions yet</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
          Record your first expense or income to start tracking your budget.
        </p>
        <Link to="/transactions" className="btn-primary mt-4">
          Add Your First Transaction
        </Link>
      </div>
    </div>
  );
}

function TransactionRow({ transaction, formatCurrency }) {
  const isIncome = transaction.amount >= 0;
  const dateStr = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {transaction.payee || 'No payee'}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {transaction.category_name || 'Uncategorized'}
          <span className="mx-1">·</span>
          {dateStr}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? 'text-positive-600 dark:text-positive-500' : 'text-negative-600 dark:text-negative-500'}`}>
        {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}

function TransactionList({ transactions }) {
  const { formatCurrency } = useCurrency();

  if (!transactions?.length) return <EmptyState />;

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent Transactions</h2>
        <Link to="/transactions" className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50 px-4">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} formatCurrency={formatCurrency} />
        ))}
      </div>
    </div>
  );
}

export default TransactionList;
