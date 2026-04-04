import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

// Get all category groups with their categories
router.get('/groups', async (req, res) => {
  try {
    const { data: groups, error: groupsError } = await supabase
      .from('category_groups')
      .select('*')
      .order('id');
    if (groupsError) throw new Error(groupsError.message);

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id');
    if (catError) throw new Error(catError.message);

    const result = groups.map(group => ({
      ...group,
      categories: categories.filter(cat => cat.category_group_id === group.id),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        category_groups(name)
      `)
      .order('id');
    if (error) throw new Error(error.message);
    const formatted = data.map(cat => ({
      ...cat,
      group_name: cat.category_groups?.name,
      category_groups: undefined,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { category_group_id, name, budgeted } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert({ category_group_id, name, budgeted: budgeted || 0 })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category budget
router.put('/:id/budget', async (req, res) => {
  try {
    const { budgeted } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .update({ budgeted })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Category not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, budgeted } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .update({ name, budgeted })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Category not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id)
      .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
