import { Link } from 'react-router-dom';
import { generateAiInsights } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from './Toast';
import { useState } from 'react';

const impactClasses = {
  high: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

const typeLabels = {
  budget_adjustment: 'Budget',
  spending_trend: 'Trend',
  recurring_review: 'Recurring',
  unusual_spend: 'Unusual',
  categorization: 'Categories',
  savings_opportunity: 'Savings',
  cash_flow: 'Cash flow',
  merchant_review: 'Merchant',
};

function SuggestionCard({ suggestion, formatCurrency }) {
  const amount = Number(suggestion.amount || 0);
  return (
    <div className="rounded-lg border border-neutral-200/70 bg-white/80 p-3 dark:border-neutral-800/70 dark:bg-neutral-950/25">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {typeLabels[suggestion.type] || suggestion.type}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${impactClasses[suggestion.impact] || impactClasses.low}`}>
          {suggestion.impact}
        </span>
        {amount > 0 && (
          <span className="ml-auto text-[11px] font-bold tabular-nums text-neutral-500 dark:text-neutral-400">{formatCurrency(amount)}</span>
        )}
      </div>
      <p className="mt-2 text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">{suggestion.title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{suggestion.reason}</p>
      {suggestion.action_path && suggestion.action_label && (
        <Link to={suggestion.action_path} className="mt-3 inline-flex text-[11px] font-semibold text-orange-700 underline-offset-2 hover:underline dark:text-orange-300">
          {suggestion.action_label}
        </Link>
      )}
    </div>
  );
}

function AlertRow({ alert }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-900/35">
      <span className={`mt-0.5 h-2 w-2 rounded-full ${alert.impact === 'high' ? 'bg-red-500' : alert.impact === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      <div>
        <p className="text-[12px] font-semibold text-[#09090b] dark:text-[#fafafa]">{alert.title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{alert.reason}</p>
      </div>
    </div>
  );
}

function EmptyState({ compact }) {
  return (
    <div className={`rounded-lg border border-dashed border-neutral-300 bg-neutral-50/70 text-center dark:border-neutral-800 dark:bg-neutral-900/30 ${compact ? 'p-4' : 'p-8'}`}>
      <p className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">Generate AI suggestions</p>
      <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        The model analyzes summarized spending, budgets, merchants, recurring costs, and uncategorized totals. Your OpenAI key stays on the backend.
      </p>
    </div>
  );
}

function AiInsightsPanel({ compact = false }) {
  const { formatCurrency } = useCurrency();
  const toast = useToast();
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await generateAiInsights();
      setAi(response.data);
      toast(response.data.provider === 'openai' ? 'AI suggestions generated' : 'Local suggestions generated', 'success');
    } catch (error) {
      toast('AI insights failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ai?.suggestions || [];
  const alerts = ai?.alerts || [];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/50">
        <div>
          <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa]">AI Money Coach</h2>
          <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            {ai ? `${ai.period} · ${ai.provider === 'openai' ? ai.model || 'OpenAI' : 'local fallback'}` : 'Reasoned suggestions from real transaction patterns'}
          </p>
        </div>
        <button type="button" className="btn-primary px-3 py-[7px] text-[12px]" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Thinking...' : ai ? 'Refresh' : 'Generate'}
        </button>
      </div>

      <div className={compact ? 'p-3' : 'p-4'}>
        {!ai ? (
          <EmptyState compact={compact} />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-orange-50/80 p-3 text-[12px] leading-relaxed text-orange-900 dark:bg-orange-500/10 dark:text-orange-100">
              {ai.summary}
            </div>
            {ai.warning && (
              <div className="rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                {ai.warning}
              </div>
            )}
            <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
              {suggestions.map((suggestion, index) => (
                <SuggestionCard key={`${suggestion.title}-${index}`} suggestion={suggestion} formatCurrency={formatCurrency} />
              ))}
            </div>
            {alerts.length > 0 && (
              <div className="grid gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Watchlist</p>
                {alerts.map((alert, index) => <AlertRow key={`${alert.title}-${index}`} alert={alert} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AiInsightsPanel;
