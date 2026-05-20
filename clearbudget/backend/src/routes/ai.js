import { Router } from 'express';
import supabase from '../db/client.js';
import { buildFinancialSnapshot, generateAiInsights } from '../lib/aiInsights.js';

const router = Router();

router.post('/insights', async (req, res) => {
  try {
    const snapshot = await buildFinancialSnapshot(supabase);
    const insights = await generateAiInsights(snapshot);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
