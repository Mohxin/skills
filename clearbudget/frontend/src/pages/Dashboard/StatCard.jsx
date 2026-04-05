const variantStyles = {
  default: {
    text: 'text-surface-900 dark:text-surface-50',
    iconBg: 'bg-surface-100 dark:bg-surface-800',
    iconText: 'text-surface-600 dark:text-surface-400',
  },
  positive: {
    text: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconText: 'text-green-600 dark:text-green-400',
  },
  negative: {
    text: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-50 dark:bg-red-900/30',
    iconText: 'text-red-600 dark:text-red-400',
  },
};

function StatCard({ label, value, variant = 'default', icon }) {
  const styles = variantStyles[variant] ?? variantStyles.default;

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
          <p className={`text-2xl font-semibold tabular-nums ${styles.text}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconText}`} aria-hidden="true">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
