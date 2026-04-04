import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Accounts
export const getAccounts = () => api.get('/accounts');
export const getAccount = (id) => api.get(`/accounts/${id}`);
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Transactions
export const getTransactions = () => api.get('/transactions');
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Categories
export const getCategoryGroups = () => api.get('/categories/groups');
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategoryBudget = (id, data) => api.put(`/categories/${id}/budget`, data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Goals
export const getGoals = () => api.get('/goals');
export const getGoal = (id) => api.get(`/goals/${id}`);
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const contributeToGoal = (id, data) => api.post(`/goals/${id}/contribute`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// Reports
export const getBudgetOverview = () => api.get('/reports/overview');
export const getSpendingByCategory = () => api.get('/reports/spending-by-category');
export const getMonthlyTrends = () => api.get('/reports/monthly-trends');
export const getRecentTransactions = (limit = 10) => api.get(`/reports/recent-transactions?limit=${limit}`);

export default api;
