import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        categories(name, budgeted, activity, category_groups(name))
      `)
      .gte('date', startOfMonth)
      .lt('date', startOfNextMonth)
      .lt('amount', 0);
    if (error) throw new Error(error.message);

    // Group by category
    const spendingMap = {};
    data?.forEach(tx => {
      const catId = tx.categories?.id;
      if (!catId) return;
      if (!spendingMap[catId]) {
        spendingMap[catId] = {
          category: tx.categories?.name,
          group_name: tx.categories?.category_groups?.name,
          spent: 0,
          budgeted: parseFloat(tx.categories?.budgeted || 0),
          available: parseFloat(tx.categories?.activity || 0) + parseFloat(tx.categories?.budgeted || 0),
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

export default router;
