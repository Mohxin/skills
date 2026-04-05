import { Link } from 'react-router-dom';

function BudgetAlert({ categories, formatCurrency }) {
  return (
    <div
      className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4"
      role="alert"
      aria-labelledby="budget-alert-title"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50" aria-hidden="true">
          <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 id="budget-alert-title" className="text-sm font-semibold text-red-900 dark:text-red-200">
            Over Budget
          </h3>
          <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
            {categories.length > 1
              ? `${categories.length} categories are overspending this month`
              : `${categories[0].category} is over budget`
            }
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/50 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-200"
              >
                {item.category}
                <span className="text-red-600 dark:text-red-400 tabular-nums">
                  {formatCurrency(item.available)}
                </span>
              </span>
            ))}
          </div>
        </div>
        <Link
          to="/budget"
          className="shrink-0 text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline"
        >
          Adjust →
        </Link>
      </div>
    </div>
  );
}

export default BudgetAlert;
