import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

// Get all accounts
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single account
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Account not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    const { data, error } = await supabase
      .from('accounts')
      .insert({ name, type, balance: balance || 0 })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    const { data, error } = await supabase
      .from('accounts')
      .update({ name, type, balance, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Account not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', req.params.id)
      .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
