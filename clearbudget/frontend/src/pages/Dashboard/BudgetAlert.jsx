import { Link } from 'react-router-dom';

function BudgetAlert({ categories, formatCurrency }) {
  return (
    <div
      className="rounded-lg border border-negative-200 dark:border-negative-800 bg-negative-50 dark:bg-negative-900/20 p-3"
      role="alert"
      aria-labelledby="budget-alert-title"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-negative-100 dark:bg-negative-900/50" aria-hidden="true">
          <svg className="h-3.5 w-3.5 text-negative-600 dark:text-negative-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="budget-alert-title" className="text-sm font-semibold text-negative-800 dark:text-negative-200">
            Over Budget
          </h3>
          <p className="mt-0.5 text-xs text-negative-700 dark:text-negative-300">
            {categories.length > 1
              ? `${categories.length} categories are overspending this month`
              : `${categories[0].category} is over budget`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categories.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-negative-100 dark:bg-negative-900/50 px-2 py-0.5 text-xs font-medium text-negative-800 dark:text-negative-200"
              >
                {item.category}
                <span className="text-negative-600 dark:text-negative-400 tabular-nums">
                  {formatCurrency(item.available)}
                </span>
              </span>
            ))}
          </div>
        </div>
        <Link
          to="/budget"
          className="shrink-0 text-xs font-medium text-negative-700 dark:text-negative-300 hover:text-negative-900 dark:hover:text-negative-100 underline"
        >
          Adjust →
        </Link>
      </div>
    </div>
  );
}

export default BudgetAlert;
