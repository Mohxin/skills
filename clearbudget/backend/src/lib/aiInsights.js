const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const isoDate = (date) => date.toISOString().split('T')[0];

const monthBounds = (date) => ({
  period: date.toISOString().slice(0, 7),
  start: isoDate(new Date(date.getFullYear(), date.getMonth(), 1)),
  end: isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 1)),
});

const estimateMonthlyAmount = (amount, frequency) => {
  const absolute = Math.abs(toNumber(amount));
  if (frequency === 'weekly') return absolute * 4.33;
  if (frequency === 'biweekly') return absolute * 2.17;
  if (frequency === 'yearly') return absolute / 12;
  return absolute;
};

const sortDesc = (key) => (a, b) => toNumber(b[key]) - toNumber(a[key]);

export async function buildFinancialSnapshot(supabase) {
  const now = new Date();
  let current = monthBounds(now);

  const latestResult = await supabase
    .from('transactions')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestResult.data?.date) {
    const latestMonth = latestResult.data.date.slice(0, 7);
    const nowMonth = now.toISOString().slice(0, 7);
    if (latestMonth !== nowMonth) current = monthBounds(new Date(`${latestResult.data.date}T00:00:00`));
  }

  const previousDate = new Date(`${current.start}T00:00:00`);
  previousDate.setMonth(previousDate.getMonth() - 1);
  const previous = monthBounds(previousDate);
  const historyStart = isoDate(new Date(previousDate.getFullYear(), previousDate.getMonth() - 2, 1));

  const [
    accountsResult,
    categoriesResult,
    currentTxResult,
    previousTxResult,
    historyTxResult,
    recurringResult,
    goalsResult,
  ] = await Promise.all([
    supabase.from('accounts').select('type, balance'),
    supabase.from('categories').select('id, name, budgeted, activity, category_groups(name)'),
    supabase.from('transactions').select('date, payee, amount, category_id, categories(name, category_groups(name))').gte('date', current.start).lt('date', current.end),
    supabase.from('transactions').select('amount').gte('date', previous.start).lt('date', previous.end),
    supabase.from('transactions').select('date, payee, amount, category_id, categories(name)').gte('date', historyStart).lt('date', current.end),
    supabase.from('recurring_transactions').select('payee, amount, frequency, next_due, enabled').eq('enabled', true),
    supabase.from('goals').select('name, target_amount, current_amount, target_date'),
  ]);

  const firstError = [
    accountsResult.error,
    categoriesResult.error,
    currentTxResult.error,
    previousTxResult.error,
    historyTxResult.error,
    recurringResult.error,
    goalsResult.error,
  ].find(Boolean);
  if (firstError) throw new Error(firstError.message);

  const accounts = accountsResult.data || [];
  const categories = categoriesResult.data || [];
  const currentTransactions = currentTxResult.data || [];
  const previousTransactions = previousTxResult.data || [];
  const historyTransactions = historyTxResult.data || [];
  const recurring = recurringResult.data || [];
  const goals = goalsResult.data || [];

  const categoryMap = {};
  categories.forEach((category) => {
    categoryMap[category.id] = {
      category: category.name,
      group: category.category_groups?.name || 'Ungrouped',
      budgeted: toNumber(category.budgeted),
      spent: 0,
      income: 0,
      transaction_count: 0,
    };
  });

  const merchantMap = {};
  let income = 0;
  let spending = 0;
  let uncategorized_total = 0;
  let uncategorized_count = 0;

  currentTransactions.forEach((tx) => {
    const amount = toNumber(tx.amount);
    const absolute = Math.abs(amount);
    if (amount >= 0) income += amount;
    else spending += absolute;

    const categoryName = tx.categories?.name || 'Uncategorized';
    const category = categoryMap[tx.category_id] || {
      category: categoryName,
      group: tx.categories?.category_groups?.name || 'Ungrouped',
      budgeted: 0,
      spent: 0,
      income: 0,
      transaction_count: 0,
    };

    if (amount < 0) category.spent += absolute;
    else category.income += amount;
    category.transaction_count += 1;
    categoryMap[tx.category_id || `uncategorized-${categoryName}`] = category;

    if (!tx.category_id || categoryName === 'Uncategorized') {
      uncategorized_total += absolute;
      uncategorized_count += 1;
    }

    if (amount < 0 && tx.payee) {
      if (!merchantMap[tx.payee]) merchantMap[tx.payee] = { merchant: tx.payee, total: 0, count: 0 };
      merchantMap[tx.payee].total += absolute;
      merchantMap[tx.payee].count += 1;
    }
  });

  const previousSpending = previousTransactions
    .filter((tx) => toNumber(tx.amount) < 0)
    .reduce((sum, tx) => sum + Math.abs(toNumber(tx.amount)), 0);

  const accountByType = accounts.reduce((map, account) => {
    const type = account.type || 'other';
    map[type] = (map[type] || 0) + toNumber(account.balance);
    return map;
  }, {});

  const category_history = {};
  historyTransactions.forEach((tx) => {
    if (toNumber(tx.amount) >= 0) return;
    const month = tx.date.slice(0, 7);
    const category = tx.categories?.name || 'Uncategorized';
    const key = `${month}:${category}`;
    if (!category_history[key]) category_history[key] = { month, category, spent: 0 };
    category_history[key].spent += Math.abs(toNumber(tx.amount));
  });

  const unusual_transactions = currentTransactions
    .filter((tx) => toNumber(tx.amount) < 0)
    .map((tx) => ({
      date: tx.date,
      payee: tx.payee || 'Unknown',
      category: tx.categories?.name || 'Uncategorized',
      amount: Math.abs(toNumber(tx.amount)),
    }))
    .sort(sortDesc('amount'))
    .slice(0, 8);

  const recurring_monthly_total = recurring.reduce((sum, item) => sum + estimateMonthlyAmount(item.amount, item.frequency), 0);
  const goal_gap = goals.reduce((sum, goal) => {
    const target = toNumber(goal.target_amount);
    const currentAmount = toNumber(goal.current_amount);
    return sum + Math.max(target - currentAmount, 0);
  }, 0);

  return {
    period: current.period,
    currency: 'user_selected',
    totals: {
      income,
      spending,
      net: income - spending,
      previous_month_spending: previousSpending,
      transaction_count: currentTransactions.length,
      recurring_monthly_total,
      goal_gap,
      total_account_balance: accounts.reduce((sum, account) => sum + toNumber(account.balance), 0),
    },
    accounts_by_type: accountByType,
    categories: Object.values(categoryMap)
      .map((category) => ({
        ...category,
        available: category.budgeted - category.spent,
        budget_variance: category.budgeted - category.spent,
      }))
      .sort(sortDesc('spent'))
      .slice(0, 14),
    merchants: Object.values(merchantMap).sort(sortDesc('total')).slice(0, 12),
    category_history: Object.values(category_history).sort((a, b) => b.month.localeCompare(a.month) || b.spent - a.spent).slice(0, 30),
    recurring: recurring
      .map((item) => ({
        merchant: item.payee || 'Recurring item',
        monthly_amount: estimateMonthlyAmount(item.amount, item.frequency),
        frequency: item.frequency || 'monthly',
        next_due: item.next_due || null,
      }))
      .sort(sortDesc('monthly_amount'))
      .slice(0, 10),
    unusual_transactions,
    uncategorized: {
      count: uncategorized_count,
      total: uncategorized_total,
    },
    goals: goals
      .map((goal) => ({
        name: goal.name,
        target_amount: toNumber(goal.target_amount),
        current_amount: toNumber(goal.current_amount),
        remaining: Math.max(toNumber(goal.target_amount) - toNumber(goal.current_amount), 0),
        target_date: goal.target_date || null,
      }))
      .slice(0, 8),
  };
}

export function buildLocalInsights(snapshot) {
  const topCategory = snapshot.categories.find((category) => category.spent > 0);
  const overBudget = snapshot.categories.filter((category) => category.budgeted > 0 && category.spent > category.budgeted);
  const topMerchant = snapshot.merchants[0];
  const spendChange = snapshot.totals.previous_month_spending > 0
    ? ((snapshot.totals.spending - snapshot.totals.previous_month_spending) / snapshot.totals.previous_month_spending) * 100
    : 0;
  const suggestions = [];
  const alerts = [];

  if (overBudget[0]) {
    suggestions.push({
      type: 'budget_adjustment',
      title: `Review ${overBudget[0].category}`,
      impact: 'high',
      amount: Math.round(overBudget[0].spent - overBudget[0].budgeted),
      reason: `${overBudget[0].category} is above budget for ${snapshot.period}.`,
      action_label: 'Open Budget',
      action_path: '/budget',
    });
  }

  if (topMerchant) {
    suggestions.push({
      type: 'merchant_review',
      title: `Check ${topMerchant.merchant}`,
      impact: topMerchant.total > snapshot.totals.spending * 0.25 ? 'medium' : 'low',
      amount: Math.round(topMerchant.total),
      reason: `${topMerchant.merchant} is your largest merchant this period.`,
      action_label: 'View Transactions',
      action_path: '/transactions',
    });
  }

  if (snapshot.uncategorized.count > 0) {
    suggestions.push({
      type: 'categorization',
      title: 'Clean up uncategorized transactions',
      impact: 'medium',
      amount: Math.round(snapshot.uncategorized.total),
      reason: `${snapshot.uncategorized.count} transactions need categories before the budget can be trusted.`,
      action_label: 'Review Categories',
      action_path: '/transactions',
    });
  }

  if (!suggestions.length && topCategory) {
    suggestions.push({
      type: 'savings_opportunity',
      title: `Keep an eye on ${topCategory.category}`,
      impact: 'low',
      amount: Math.round(topCategory.spent),
      reason: `${topCategory.category} is the largest spending category this period.`,
      action_label: 'Open Insights',
      action_path: '/insights',
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      type: 'categorization',
      title: 'Import real transactions',
      impact: 'low',
      amount: 0,
      reason: 'The coach needs imported or manually entered transactions before it can find spending patterns.',
      action_label: 'Import Transactions',
      action_path: '/transactions',
    });
  }

  if (Math.abs(spendChange) >= 15) {
    alerts.push({
      type: 'spending_trend',
      title: spendChange > 0 ? 'Spending increased' : 'Spending decreased',
      impact: spendChange > 0 ? 'medium' : 'low',
      reason: `Total spending changed ${Math.abs(spendChange).toFixed(0)}% compared with the previous month.`,
    });
  }

  if (snapshot.unusual_transactions[0]) {
    alerts.push({
      type: 'unusual_spend',
      title: `Largest transaction: ${snapshot.unusual_transactions[0].payee}`,
      impact: 'medium',
      reason: `${snapshot.unusual_transactions[0].payee} was the largest outflow in ${snapshot.period}.`,
    });
  }

  return {
    period: snapshot.period,
    provider: 'local_fallback',
    generated_at: new Date().toISOString(),
    summary: suggestions[0]?.reason || 'Add more real transactions to unlock stronger budget suggestions.',
    suggestions: suggestions.slice(0, 5),
    alerts: alerts.slice(0, 4),
    snapshot,
  };
}

const insightsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    suggestions: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['budget_adjustment', 'spending_trend', 'recurring_review', 'unusual_spend', 'categorization', 'savings_opportunity', 'cash_flow'] },
          title: { type: 'string' },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          amount: { type: 'number' },
          reason: { type: 'string' },
          action_label: { type: 'string' },
          action_path: { type: 'string' },
        },
        required: ['type', 'title', 'impact', 'amount', 'reason', 'action_label', 'action_path'],
      },
    },
    alerts: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['budget_risk', 'spending_trend', 'recurring_cost', 'unusual_spend', 'categorization'] },
          title: { type: 'string' },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' },
        },
        required: ['type', 'title', 'impact', 'reason'],
      },
    },
  },
  required: ['summary', 'suggestions', 'alerts'],
};

const extractResponseText = (response) => {
  if (response.output_text) return response.output_text;
  const message = response.output?.find((item) => item.type === 'message');
  const text = message?.content?.find((item) => item.type === 'output_text' || item.type === 'text');
  return text?.text || '';
};

export async function generateAiInsights(snapshot) {
  if (!process.env.OPENAI_API_KEY) return buildLocalInsights(snapshot);

  try {
    const model = process.env.OPENAI_INSIGHTS_MODEL || 'gpt-5-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: process.env.OPENAI_INSIGHTS_REASONING_EFFORT || 'medium' },
        input: [
          {
            role: 'system',
            content: 'You are a budgeting assistant inside a personal finance app. Analyze aggregated spending patterns, budget gaps, recurring costs, categorization quality, and cash-flow pressure. Give practical, conservative suggestions. Do not provide tax, legal, investment, credit, or debt restructuring advice. Do not shame the user. Return only JSON that matches the schema.',
          },
          {
            role: 'user',
            content: JSON.stringify(snapshot),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'clearbudget_ai_insights',
            strict: true,
            schema: insightsSchema,
          },
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'OpenAI insights request failed');

    const parsed = JSON.parse(extractResponseText(payload));
    return {
      period: snapshot.period,
      provider: 'openai',
      model,
      generated_at: new Date().toISOString(),
      ...parsed,
      snapshot,
    };
  } catch (error) {
    return {
      ...buildLocalInsights(snapshot),
      warning: `OpenAI unavailable: ${error.message}`,
    };
  }
}
