import { Link } from 'react-router-dom';

function EmptyState() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Budget Progress</h2>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <svg className="h-10 w-10 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <h3 className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">No spending data</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
          Assign budgets to categories and start tracking your spending.
        </p>
        <Link to="/budget" className="btn-primary mt-4">
          Set Up Budgets
        </Link>
      </div>
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{category}</span>
        <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
          {formatCurrency(spent)}
          <span className="mx-0.5">/</span>
          {formatCurrency(budgeted)}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${overBudget ? 'bg-negative-500' : 'bg-brand-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </li>
  );
}

function CategoryProgress({ categories, formatCurrency }) {
  if (!categories?.length) return <EmptyState />;

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Budget Progress</h2>
        <Link to="/reports" className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300">
          View reports →
        </Link>
      </div>
      <ul role="list" className="space-y-3 p-4">
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
