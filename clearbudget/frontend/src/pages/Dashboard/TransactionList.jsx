import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { EmptyStateIllustration } from '../../components/Illustrations';

function EmptyState() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent Transactions</h2>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
        <EmptyStateIllustration />
        <h3 className="mt-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">No transactions yet</h3>
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
