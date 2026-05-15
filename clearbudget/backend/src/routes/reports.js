import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

const toNumber = (value) => parseFloat(value || 0);

const isoDate = (date) => date.toISOString().split('T')[0];

const addByFrequency = (date, frequency) => {
  const next = new Date(date);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'biweekly') next.setDate(next.getDate() + 14);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

// Get budget overview
router.get('/overview', async (req, res) => {
  try {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('balance');
    const { data: categories } = await supabase
      .from('categories')
      .select('budgeted, activity');

    const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) || 0;
    const totalBudgeted = categories?.reduce((sum, cat) => sum + parseFloat(cat.budgeted || 0), 0) || 0;
    const totalActivity = categories?.reduce((sum, cat) => sum + parseFloat(cat.activity || 0), 0) || 0;

    res.json({
      total_balance: totalBalance,
      total_budgeted: totalBudgeted,
      total_activity: totalActivity,
      to_be_budgeted: totalBalance - totalBudgeted,
      available: totalBudgeted + totalActivity,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get spending by category for current month
router.get('/spending-by-category', async (req, res) => {
  try {
    const now = new Date();
    let reportDate = now;

    const fetchMonthTransactions = async (date) => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().split('T')[0];

      return supabase
        .from('transactions')
        .select('amount, category_id')
        .gte('date', startOfMonth)
        .lt('date', startOfNextMonth)
        .lt('amount', 0);
    };

    let { data, error } = await fetchMonthTransactions(reportDate);
    if (!error && !data?.length) {
      const { data: latest } = await supabase
        .from('transactions')
        .select('date')
        .lt('amount', 0)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.date) {
        reportDate = new Date(`${latest.date}T00:00:00`);
        ({ data, error } = await fetchMonthTransactions(reportDate));
      }
    }
    if (error) throw new Error(error.message);

    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, budgeted, activity, category_groups(name)');
    if (categoryError) throw new Error(categoryError.message);

    const categoryMap = {};
    categories?.forEach(category => {
      categoryMap[category.id] = category;
    });

    // Group by category
    const spendingMap = {};
    data?.forEach(tx => {
      const catId = tx.category_id;
      const category = categoryMap[catId];
      if (!catId || !category) return;
      if (!spendingMap[catId]) {
        spendingMap[catId] = {
          month: reportDate.toISOString().slice(0, 7),
          category: category.name,
          group_name: category.category_groups?.name,
          spent: 0,
          budgeted: parseFloat(category.budgeted || 0),
          available: parseFloat(category.activity || 0) + parseFloat(category.budgeted || 0),
        };
      }
      spendingMap[catId].spent += Math.abs(parseFloat(tx.amount));
    });

    const result = Object.values(spendingMap).sort((a, b) => b.spent - a.spent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly spending trends (last 6 months)
router.get('/monthly-trends', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        date,
        amount,
        categories(name)
      `)
      .gte('date', sixMonthsAgo.toISOString().split('T')[0])
      .lt('amount', 0);
    if (error) throw new Error(error.message);

    // Group by month and category
    const trendsMap = {};
    data?.forEach(tx => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      const key = `${month}-${tx.categories?.name}`;
      if (!trendsMap[key]) {
        trendsMap[key] = {
          month,
          category: tx.categories?.name,
          spent: 0,
        };
      }
      trendsMap[key].spent += Math.abs(parseFloat(tx.amount));
    });

    const result = Object.values(trendsMap).sort((a, b) => b.month.localeCompare(a.month) || b.spent - a.spent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent transactions
router.get('/recent-transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts(name),
        categories(name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    const formatted = data.map(tx => ({
      ...tx,
      account_name: tx.accounts?.name,
      category_name: tx.categories?.name,
      accounts: undefined,
      categories: undefined,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly insights for coaching views
router.get('/insights', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const startOfNextMonth = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, payee, categories(name)')
      .gte('date', startOfMonth)
      .lt('date', startOfNextMonth)
      .lt('amount', 0);
    if (error) throw new Error(error.message);

    const merchantMap = {};
    const categoryMap = {};
    let totalSpent = 0;

    data?.forEach((tx) => {
      const amount = Math.abs(toNumber(tx.amount));
      totalSpent += amount;

      const payee = tx.payee || 'Unknown';
      if (!merchantMap[payee]) merchantMap[payee] = { payee, total: 0, count: 0 };
      merchantMap[payee].total += amount;
      merchantMap[payee].count += 1;

      const category = tx.categories?.name || 'Uncategorized';
      if (!categoryMap[category]) categoryMap[category] = { category, total: 0 };
      categoryMap[category].total += amount;
    });

    const dayOfMonth = Math.max(now.getDate(), 1);
    res.json({
      totalSpent,
      avgDaily: totalSpent / dayOfMonth,
      topMerchants: Object.values(merchantMap).sort((a, b) => b.total - a.total).slice(0, 5),
      topCategories: Object.values(categoryMap).sort((a, b) => b.total - a.total).slice(0, 5),
      transactionCount: data?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forecast balance pressure across the next 30 days using recurring items and recent spend pace.
router.get('/cash-flow-forecast', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 90);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const recentStart = new Date(today);
    recentStart.setDate(recentStart.getDate() - 30);

    const [{ data: accounts, error: accountError }, { data: recurring, error: recurringError }, { data: transactions, error: txError }] = await Promise.all([
      supabase.from('accounts').select('balance, type'),
      supabase.from('recurring_transactions').select('payee, amount, frequency, next_due, enabled').eq('enabled', true),
      supabase.from('transactions').select('amount, date').gte('date', isoDate(recentStart)).lt('amount', 0),
    ]);

    if (accountError) throw new Error(accountError.message);
    if (recurringError) throw new Error(recurringError.message);
    if (txError) throw new Error(txError.message);

    const startingBalance = accounts?.reduce((sum, account) => {
      const isDebt = ['creditCard', 'loan', 'debt'].includes(account.type);
      return isDebt ? sum : sum + Math.max(toNumber(account.balance), 0);
    }, 0) || 0;

    const recentSpend = transactions?.reduce((sum, tx) => sum + Math.abs(toNumber(tx.amount)), 0) || 0;
    const dailyAverageSpend = recentSpend / 30;
    const events = [];

    recurring?.forEach((item) => {
      if (!item.next_due) return;
      let due = new Date(`${item.next_due}T00:00:00`);
      while (due < today) due = addByFrequency(due, item.frequency);

      while (due <= endDate) {
        events.push({
          date: isoDate(due),
          payee: item.payee,
          amount: toNumber(item.amount),
          frequency: item.frequency,
        });
        due = addByFrequency(due, item.frequency);
      }
    });

    events.sort((a, b) => a.date.localeCompare(b.date));

    const eventMap = events.reduce((map, event) => {
      map[event.date] = (map[event.date] || 0) + event.amount;
      return map;
    }, {});

    const points = [];
    let balance = startingBalance;
    let lowBalance = startingBalance;
    let lowDate = isoDate(today);

    for (let offset = 0; offset <= days; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dateKey = isoDate(date);

      if (offset > 0) balance -= dailyAverageSpend;
      balance += eventMap[dateKey] || 0;

      if (balance < lowBalance) {
        lowBalance = balance;
        lowDate = dateKey;
      }

      if (offset % 5 === 0 || offset === days) {
        points.push({ date: dateKey, balance });
      }
    }

    const committedOutflow = events
      .filter((event) => event.amount < 0)
      .reduce((sum, event) => sum + Math.abs(event.amount), 0);
    const safeToSpend = Math.max(startingBalance - committedOutflow - dailyAverageSpend * days, 0);
    const dailyOutflow = dailyAverageSpend + committedOutflow / days;
    const runwayDays = dailyOutflow > 0 ? Math.floor(startingBalance / dailyOutflow) : null;
    const status = lowBalance < 0 ? 'risk' : safeToSpend < startingBalance * 0.1 ? 'tight' : 'healthy';

    res.json({
      days,
      startingBalance,
      dailyAverageSpend,
      committedOutflow,
      safeToSpend,
      projectedLowBalance: lowBalance,
      projectedLowDate: lowDate,
      runwayDays,
      status,
      upcomingEvents: events.slice(0, 8),
      points,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
