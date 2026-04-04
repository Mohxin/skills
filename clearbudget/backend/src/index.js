import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import accountsRouter from './routes/accounts.js';
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import goalsRouter from './routes/goals.js';
import reportsRouter from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 ClearBudget API server running on http://localhost:${PORT}`);
});
