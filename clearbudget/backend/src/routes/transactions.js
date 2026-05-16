import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const applyAccountDelta = async (accountId, delta) => {
  if (!accountId || !delta) return;
  const { data: account } = await supabase.from('accounts').select('balance').eq('id', accountId).single();
  if (!account) return;
  await supabase
    .from('accounts')
    .update({ balance: parseFloat(account.balance) + delta, updated_at: new Date().toISOString() })
    .eq('id', accountId);
};

const setAccountBalance = async (accountId, balance) => {
  await supabase
    .from('accounts')
    .update({ balance, updated_at: new Date().toISOString() })
    .eq('id', accountId);
};

const applyCategoryDeltas = async (categoryDeltas) => {
  await Promise.all(Object.entries(categoryDeltas).map(async ([categoryId, delta]) => {
    if (!categoryId || !delta) return;
    const { data: category } = await supabase.from('categories').select('activity').eq('id', categoryId).single();
    if (!category) return;
    await supabase
      .from('categories')
      .update({ activity: parseFloat(category.activity) + delta })
      .eq('id', categoryId);
  }));
};

// Get all transactions (with joins)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts(name),
        categories(name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
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

// Bulk import transactions from CSV/Excel-mapped rows
router.post('/import', async (req, res) => {
  try {
    const {
      account_id,
      category_id,
      transactions = [],
      reconcile_balance = false,
      statement_start_balance,
      statement_end_balance,
    } = req.body;
    const accountId = parseInt(account_id, 10);
    const defaultCategoryId = category_id ? parseInt(category_id, 10) : null;

    if (!accountId) return res.status(400).json({ error: 'account_id is required' });
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions must contain at least one row' });
    }

    const rows = transactions
      .map((tx) => {
        const amount = toNumber(tx.amount);
        const date = String(tx.date || '').slice(0, 10);
        if (!date || !amount) return null;
        return {
          account_id: accountId,
          category_id: tx.category_id ? parseInt(tx.category_id, 10) : defaultCategoryId,
          date,
          payee: tx.payee || 'Imported transaction',
          memo: tx.memo || null,
          amount,
          cleared: tx.cleared !== false,
        };
      })
      .filter(Boolean);

    if (!rows.length) return res.status(400).json({ error: 'No valid transactions found to import' });

    const importTotal = rows.reduce((sum, tx) => sum + tx.amount, 0);
    const statementStartBalance = parseOptionalNumber(statement_start_balance);
    const statementEndBalance = parseOptionalNumber(statement_end_balance);

    if (reconcile_balance) {
      if (statementStartBalance === null || statementEndBalance === null) {
        return res.status(400).json({ error: 'statement_start_balance and statement_end_balance are required to reconcile an import' });
      }

      const expectedEndBalance = statementStartBalance + importTotal;
      if (Math.abs(expectedEndBalance - statementEndBalance) > 0.01) {
        return res.status(400).json({ error: 'Statement balances do not match the imported transaction total' });
      }
    }

    const { data: imported, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select(`
        *,
        accounts(name),
        categories(name)
      `);
    if (error) throw new Error(error.message);

    const categoryDeltas = rows.reduce((map, tx) => {
      if (tx.category_id) map[tx.category_id] = (map[tx.category_id] || 0) + tx.amount;
      return map;
    }, {});
    await applyCategoryDeltas(categoryDeltas);

    if (reconcile_balance) await setAccountBalance(accountId, statementEndBalance);

    const formatted = imported.map(tx => ({
      ...tx,
      account_name: tx.accounts?.name,
      category_name: tx.categories?.name,
      accounts: undefined,
      categories: undefined,
    }));

    res.status(201).json({ imported: formatted.length, transactions: formatted, reconciled: Boolean(reconcile_balance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts(name),
        categories(name)
      `)
      .eq('id', req.params.id)
      .single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Transaction not found' });
    const formatted = {
      ...data,
      account_name: data.accounts?.name,
      category_name: data.categories?.name,
      accounts: undefined,
      categories: undefined,
    };
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const { account_id, category_id, date, payee, memo, amount, cleared } = req.body;

    // Insert transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        account_id,
        category_id: category_id || null,
        date,
        payee,
        memo,
        amount,
        cleared: cleared || false,
      })
      .select()
      .single();
    if (txError) throw new Error(txError.message);

    // Update account balance (fetch current, then update)
    await applyAccountDelta(account_id, amount);

    // Update category activity
    if (category_id) {
      const { data: cat } = await supabase.from('categories').select('activity').eq('id', category_id).single();
      if (cat) {
        await supabase
          .from('categories')
          .update({ activity: parseFloat(cat.activity) + amount })
          .eq('id', category_id);
      }
    }

    res.status(201).json(tx);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const { account_id, category_id, date, payee, memo, amount, cleared } = req.body;

    // Get old transaction
    const { data: oldTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (!oldTx) return res.status(404).json({ error: 'Transaction not found' });

    // Reverse old effects on account
    const { data: oldAcc } = await supabase.from('accounts').select('balance').eq('id', oldTx.account_id).single();
    if (oldAcc) {
      await supabase
        .from('accounts')
        .update({ balance: parseFloat(oldAcc.balance) - parseFloat(oldTx.amount), updated_at: new Date().toISOString() })
        .eq('id', oldTx.account_id);
    }
    // Reverse old effects on category
    if (oldTx.category_id) {
      const { data: oldCat } = await supabase.from('categories').select('activity').eq('id', oldTx.category_id).single();
      if (oldCat) {
        await supabase
          .from('categories')
          .update({ activity: parseFloat(oldCat.activity) - parseFloat(oldTx.amount) })
          .eq('id', oldTx.category_id);
      }
    }

    // Update transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .update({
        account_id,
        category_id: category_id || null,
        date,
        payee,
        memo,
        amount,
        cleared: cleared || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (txError) throw new Error(txError.message);

    // Apply new effects on account
    await applyAccountDelta(account_id, amount);
    // Apply new effects on category
    if (category_id) {
      const { data: newCat } = await supabase.from('categories').select('activity').eq('id', category_id).single();
      if (newCat) {
        await supabase
          .from('categories')
          .update({ activity: parseFloat(newCat.activity) + amount })
          .eq('id', category_id);
      }
    }

    res.json(tx);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    // Reverse effects on account
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).single();
    if (acc) {
      await supabase
        .from('accounts')
        .update({ balance: parseFloat(acc.balance) - parseFloat(tx.amount), updated_at: new Date().toISOString() })
        .eq('id', tx.account_id);
    }
    // Reverse effects on category
    if (tx.category_id) {
      const { data: cat } = await supabase.from('categories').select('activity').eq('id', tx.category_id).single();
      if (cat) {
        await supabase
          .from('categories')
          .update({ activity: parseFloat(cat.activity) - parseFloat(tx.amount) })
          .eq('id', tx.category_id);
      }
    }

    await supabase.from('transactions').delete().eq('id', req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
