import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

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
    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', account_id).single();
    if (acc) {
      await supabase
        .from('accounts')
        .update({ balance: parseFloat(acc.balance) + amount, updated_at: new Date().toISOString() })
        .eq('id', account_id);
    }

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
    const { data: newAcc } = await supabase.from('accounts').select('balance').eq('id', account_id).single();
    if (newAcc) {
      await supabase
        .from('accounts')
        .update({ balance: parseFloat(newAcc.balance) + amount, updated_at: new Date().toISOString() })
        .eq('id', account_id);
    }
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
