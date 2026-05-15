import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

function MiniLine({ points = [], status = 'healthy' }) {
  if (points.length < 2) {
    return <div className="h-16 rounded-lg bg-neutral-50 dark:bg-neutral-900/40" />;
  }

  const balances = points.map((point) => Number(point.balance) || 0);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const range = Math.max(max - min, 1);
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 44 - ((Number(point.balance) - min) / range) * 38;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const stroke = status === 'risk' ? '#ef4444' : status === 'tight' ? '#f59e0b' : '#10b981';

  return (
    <svg className="h-16 w-full" viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 44H100" stroke="currentColor" strokeWidth="1" className="text-neutral-200 dark:text-neutral-800" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function statusCopy(status) {
  if (status === 'risk') return { label: 'Risk', className: 'badge-negative', text: 'Projected balance dips below zero.' };
  if (status === 'tight') return { label: 'Tight', className: 'badge-warning', text: 'Forecast leaves a thin cushion.' };
  return { label: 'Healthy', className: 'badge-positive', text: 'Forecast keeps a working cushion.' };
}

function CashFlowForecast({ forecast, compact = false }) {
  const { formatCurrency } = useCurrency();

  if (!forecast) {
    return (
      <div className="card p-4">
        <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">30-Day Forecast</h2>
        <p className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">Forecast data will appear after accounts, transactions, and recurring bills load.</p>
      </div>
    );
  }

  const status = statusCopy(forecast.status);
  const lowDate = forecast.projectedLowDate
    ? new Date(`${forecast.projectedLowDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Next 30d';
  const upcoming = (forecast.upcomingEvents || []).slice(0, compact ? 3 : 5);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/50">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">30-Day Forecast</h2>
            <span className={status.className}>{status.label}</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{status.text}</p>
        </div>
        <Link to="/planner" className="text-[11px] font-semibold text-neutral-400 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors">
          Planner
        </Link>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <MiniLine points={forecast.points} status={forecast.status} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="metric-tile">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Safe to Spend</p>
              <p className="mt-1 text-[18px] font-black tracking-[-0.04em] tabular-nums text-emerald-700 dark:text-emerald-300">{formatCurrency(forecast.safeToSpend || 0)}</p>
            </div>
            <div className="metric-tile">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Lowest Point</p>
              <p className={`mt-1 text-[18px] font-black tracking-[-0.04em] tabular-nums ${(forecast.projectedLowBalance || 0) < 0 ? 'text-red-700 dark:text-red-300' : 'text-[#09090b] dark:text-[#fafafa]'}`}>
                {formatCurrency(forecast.projectedLowBalance || 0)}
              </p>
              <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">{lowDate}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/40">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-[#09090b] dark:text-[#fafafa]">Upcoming cash events</p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{formatCurrency(forecast.committedOutflow || 0)} due</p>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-[11px] text-neutral-500 dark:text-neutral-400">No recurring bills in this window.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {upcoming.map((event, index) => (
                <div key={`${event.date}-${event.payee}-${index}`} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-[#09090b] dark:text-[#fafafa]">{event.payee}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{new Date(`${event.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <p className={`shrink-0 text-[12px] font-bold tabular-nums ${event.amount < 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                    {formatCurrency(event.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CashFlowForecast;
