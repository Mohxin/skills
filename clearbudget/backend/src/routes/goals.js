import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

// Get all goals
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        categories(name, category_groups(name))
      `)
      .order('target_date', { ascending: true });
    if (error) throw new Error(error.message);
    const formatted = data.map(goal => ({
      ...goal,
      category_name: goal.categories?.name,
      group_name: goal.categories?.category_groups?.name,
      categories: undefined,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single goal
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Goal not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create goal
router.post('/', async (req, res) => {
  try {
    const { category_id, name, target_amount, current_amount, target_date } = req.body;
    const { data, error } = await supabase
      .from('goals')
      .insert({ category_id, name, target_amount, current_amount: current_amount || 0, target_date })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update goal
router.put('/:id', async (req, res) => {
  try {
    const { name, target_amount, current_amount, target_date } = req.body;
    const { data, error } = await supabase
      .from('goals')
      .update({ name, target_amount, current_amount, target_date, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Goal not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contribute to goal
router.post('/:id/contribute', async (req, res) => {
  try {
    const { amount } = req.body;
    const { data: goal } = await supabase
      .from('goals')
      .select('current_amount')
      .eq('id', req.params.id)
      .single();
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const { data, error } = await supabase
      .from('goals')
      .update({ current_amount: parseFloat(goal.current_amount) + amount, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', req.params.id)
      .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
