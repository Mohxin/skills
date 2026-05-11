import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

const nextDateFromFrequency = (date, frequency) => {
  const next = new Date(date);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'biweekly') next.setDate(next.getDate() + 14);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
};

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, accounts(name), categories(name)')
      .order('next_due', { ascending: true });

    if (error) throw new Error(error.message);

    res.json(data.map((item) => ({
      ...item,
      account_name: item.accounts?.name,
      category_name: item.categories?.name,
      accounts: undefined,
      categories: undefined,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { account_id, category_id, payee, amount, frequency, start_date, next_due, enabled } = req.body;
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        account_id,
        category_id: category_id || null,
        payee,
        amount,
        frequency: frequency || 'monthly',
        start_date,
        next_due,
        enabled: enabled !== false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { account_id, category_id, payee, amount, frequency, next_due, enabled } = req.body;
    const { data, error } = await supabase
      .from('recurring_transactions')
      .update({
        account_id,
        category_id: category_id || null,
        payee,
        amount,
        frequency,
        next_due,
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Recurring transaction not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/skip', async (req, res) => {
  try {
    const { data: recurring, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('next_due, frequency')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (!recurring) return res.status(404).json({ error: 'Recurring transaction not found' });

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update({ next_due: nextDateFromFrequency(recurring.next_due, recurring.frequency) })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', req.params.id)
      .select();

    if (error) throw new Error(error.message);
    if (!data?.length) return res.status(404).json({ error: 'Recurring transaction not found' });
    res.json({ message: 'Recurring transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
