import { Link } from 'react-router-dom';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
      <svg className="h-12 w-12 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <h3 className="mt-3 text-sm font-medium text-surface-900 dark:text-surface-50">No spending data</h3>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Assign budgets to categories and start tracking.</p>
      <Link to="/budget" className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
        Set up budgets →
      </Link>
    </div>
  );
}

function CategoryBar({ category, spent, budgeted, available, formatCurrency }) {
  const overBudget = parseFloat(available) < 0;
  const progress = parseFloat(budgeted) > 0
    ? Math.min((parseFloat(spent) / parseFloat(budgeted)) * 100, 100)
    : 0;

  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-surface-900 dark:text-surface-50">{category}</span>
        <span className="text-surface-500 dark:text-surface-400 tabular-nums">
          {formatCurrency(spent)}{' '}
          <span className="text-surface-400 dark:text-surface-500">of {formatCurrency(budgeted)}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${overBudget ? 'bg-red-500' : 'bg-primary-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </li>
  );
}

function CategoryProgress({ categories, formatCurrency }) {
  if (!categories?.length) return <EmptyState />;

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
      <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">Budget Progress</h2>
        <Link to="/reports" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
          View reports →
        </Link>
      </div>
      <ul role="list" className="space-y-4 p-4">
        {categories.map((item, index) => (
          <CategoryBar
            key={index}
            category={item.category}
            spent={item.spent}
            budgeted={item.budgeted}
            available={item.available}
            formatCurrency={formatCurrency}
          />
        ))}
      </ul>
    </div>
  );
}

export default CategoryProgress;
