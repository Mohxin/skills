const variantStyles = {
  default: {
    value: 'text-neutral-900 dark:text-neutral-100',
    iconBg: 'bg-neutral-100 dark:bg-neutral-800',
    iconText: 'text-neutral-500 dark:text-neutral-400',
  },
  positive: {
    value: 'text-positive-600 dark:text-positive-500',
    iconBg: 'bg-positive-50 dark:bg-positive-900/30',
    iconText: 'text-positive-600 dark:text-positive-500',
  },
  negative: {
    value: 'text-negative-600 dark:text-negative-500',
    iconBg: 'bg-negative-50 dark:bg-negative-900/30',
    iconText: 'text-negative-600 dark:text-negative-500',
  },
};

function StatCard({ label, value, variant = 'default' }) {
  const styles = variantStyles[variant] ?? variantStyles.default;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{label}</p>
      <p className={`text-xl font-semibold tabular-nums mt-0.5 ${styles.value}`}>
        {value}
      </p>
    </div>
  );
}

export default StatCard;
