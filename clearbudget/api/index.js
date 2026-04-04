import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(data);
}
const ok = (res, d) => json(res, 200, d);
const created = (res, d) => json(res, 201, d);
const notFound = (res, m = 'Not found') => json(res, 404, { error: m });
const serverErr = (res, m, s = 500) => json(res, s, { error: m });

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

// --- Account helpers ---
async function getAccounts() { return supabase.from('accounts').select('*').order('name'); }
async function updateAccBalance(id, delta) {
  const { data } = await supabase.from('accounts').select('balance').eq('id', id).single();
  if (data) await supabase.from('accounts').update({ balance: parseFloat(data.balance) + delta, updated_at: new Date().toISOString() }).eq('id', id);
}
async function updateCatActivity(id, delta) {
  const { data } = await supabase.from('categories').select('activity').eq('id', id).single();
  if (data) await supabase.from('categories').update({ activity: parseFloat(data.activity) + delta }).eq('id', id);
}

const txSelect = '*, accounts(name), categories(name)';
const fmtTx = (tx) => ({ ...tx, account_name: tx.accounts?.name, category_name: tx.categories?.name, accounts: undefined, categories: undefined });

export default async function handler(req, res) {
  // Parse URL path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '').split('/').filter(Boolean);
  const query = Object.fromEntries(url.searchParams);

  try {
    // === HEALTH ===
    if (path[0] === 'health' && req.method === 'GET') {
      return ok(res, { status: 'ok', timestamp: new Date().toISOString() });
    }

    // === ACCOUNTS ===
    if (path[0] === 'accounts') {
      if (req.method === 'GET') {
        const { data, error: e } = query.id
          ? await supabase.from('accounts').select('*').eq('id', query.id).single()
          : await getAccounts();
        if (e) return serverErr(res, e.message);
        if (!data) return notFound(res, 'Account not found');
        return ok(res, data);
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { data, error: e } = await supabase.from('accounts').insert({ name: body.name, type: body.type, balance: body.balance || 0 }).select().single();
        if (e) return serverErr(res, e.message);
        return created(res, data);
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const { data, error: e } = await supabase.from('accounts').update({ name: body.name, type: body.type, balance: body.balance, updated_at: new Date().toISOString() }).eq('id', query.id || path[1]).select().single();
        if (e) return serverErr(res, e.message);
        if (!data) return notFound(res);
        return ok(res, data);
      }
      if (req.method === 'DELETE') {
        const { data, error: e } = await supabase.from('accounts').delete().eq('id', query.id || path[1]).select();
        if (e) return serverErr(res, e.message);
        if (!data?.length) return notFound(res);
        return ok(res, { message: 'Account deleted' });
      }
    }

    // === CATEGORIES ===
    if (path[0] === 'categories') {
      if (req.method === 'GET' && path[1] === 'groups') {
        const { data: groups, error: ge } = await supabase.from('category_groups').select('*').order('id');
        if (ge) return serverErr(res, ge.message);
        const { data: cats, error: ce } = await supabase.from('categories').select('*').order('id');
        if (ce) return serverErr(res, ce.message);
        return ok(res, groups.map(g => ({ ...g, categories: cats.filter(c => c.category_group_id === g.id) })));
      }
      if (req.method === 'GET') {
        const { data, error: e } = await supabase.from('categories').select('*, category_groups(name)').order('id');
        if (e) return serverErr(res, e.message);
        return ok(res, data.map(c => ({ ...c, group_name: c.category_groups?.name, category_groups: undefined })));
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { data, error: e } = await supabase.from('categories').insert({ category_group_id: body.category_group_id, name: body.name, budgeted: body.budgeted || 0 }).select().single();
        if (e) return serverErr(res, e.message);
        return created(res, data);
      }
      if (req.method === 'PUT') {
        const id = path[2] === 'budget' ? path[1] : path[1];
        const body = await parseBody(req);
        if (path[2] === 'budget') {
          const { data, error: e } = await supabase.from('categories').update({ budgeted: body.budgeted }).eq('id', id).select().single();
          if (e) return serverErr(res, e.message);
          if (!data) return notFound(res);
          return ok(res, data);
        }
        const { data, error: e } = await supabase.from('categories').update({ name: body.name, budgeted: body.budgeted }).eq('id', id).select().single();
        if (e) return serverErr(res, e.message);
        if (!data) return notFound(res);
        return ok(res, data);
      }
      if (req.method === 'DELETE') {
        const { data, error: e } = await supabase.from('categories').delete().eq('id', path[1]).select();
        if (e) return serverErr(res, e.message);
        if (!data?.length) return notFound(res);
        return ok(res, { message: 'Category deleted' });
      }
    }

    // === TRANSACTIONS ===
    if (path[0] === 'transactions') {
      if (req.method === 'GET') {
        const { data, error: e } = query.id
          ? await supabase.from('transactions').select(txSelect).eq('id', query.id).single()
          : await supabase.from('transactions').select(txSelect).order('date', { ascending: false }).order('created_at', { ascending: false });
        if (e) return serverErr(res, e.message);
        if (!data) return notFound(res);
        return ok(res, Array.isArray(data) ? data.map(fmtTx) : fmtTx(data));
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { data: tx, error: te } = await supabase.from('transactions').insert({ account_id: body.account_id, category_id: body.category_id || null, date: body.date, payee: body.payee, memo: body.memo, amount: body.amount, cleared: body.cleared || false }).select().single();
        if (te) return serverErr(res, te.message);
        await updateAccBalance(body.account_id, body.amount);
        if (body.category_id) await updateCatActivity(body.category_id, body.amount);
        return created(res, tx);
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const id = query.id || path[1];
        const { data: old } = await supabase.from('transactions').select('*').eq('id', id).single();
        if (!old) return notFound(res);
        await updateAccBalance(old.account_id, -parseFloat(old.amount));
        if (old.category_id) await updateCatActivity(old.category_id, -parseFloat(old.amount));
        const { data: tx, error: te } = await supabase.from('transactions').update({ account_id: body.account_id, category_id: body.category_id || null, date: body.date, payee: body.payee, memo: body.memo, amount: body.amount, cleared: body.cleared || false, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (te) return serverErr(res, te.message);
        await updateAccBalance(body.account_id, body.amount);
        if (body.category_id) await updateCatActivity(body.category_id, body.amount);
        return ok(res, tx);
      }
      if (req.method === 'DELETE') {
        const id = query.id || path[1];
        const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
        if (!tx) return notFound(res);
        await updateAccBalance(tx.account_id, -parseFloat(tx.amount));
        if (tx.category_id) await updateCatActivity(tx.category_id, -parseFloat(tx.amount));
        await supabase.from('transactions').delete().eq('id', id);
        return ok(res, { message: 'Transaction deleted' });
      }
    }

    // === GOALS ===
    if (path[0] === 'goals') {
      if (req.method === 'GET') {
        const { data, error: e } = await supabase.from('goals').select('*, categories(name, category_groups(name))').order('target_date', { ascending: true });
        if (e) return serverErr(res, e.message);
        return ok(res, data.map(g => ({ ...g, category_name: g.categories?.name, group_name: g.categories?.category_groups?.name, categories: undefined })));
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (path[2] === 'contribute') {
          const { data: goal } = await supabase.from('goals').select('current_amount').eq('id', path[1]).single();
          if (!goal) return notFound(res);
          const { data, error: e } = await supabase.from('goals').update({ current_amount: parseFloat(goal.current_amount) + body.amount, updated_at: new Date().toISOString() }).eq('id', path[1]).select().single();
          if (e) return serverErr(res, e.message);
          return ok(res, data);
        }
        const { data, error: e } = await supabase.from('goals').insert({ category_id: body.category_id, name: body.name, target_amount: body.target_amount, current_amount: body.current_amount || 0, target_date: body.target_date }).select().single();
        if (e) return serverErr(res, e.message);
        return created(res, data);
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const { data, error: e } = await supabase.from('goals').update({ name: body.name, target_amount: body.target_amount, current_amount: body.current_amount, target_date: body.target_date, updated_at: new Date().toISOString() }).eq('id', path[1]).select().single();
        if (e) return serverErr(res, e.message);
        if (!data) return notFound(res);
        return ok(res, data);
      }
      if (req.method === 'DELETE') {
        const { data, error: e } = await supabase.from('goals').delete().eq('id', path[1]).select();
        if (e) return serverErr(res, e.message);
        if (!data?.length) return notFound(res);
        return ok(res, { message: 'Goal deleted' });
      }
    }

    // === REPORTS ===
    if (path[0] === 'reports') {
      if (path[1] === 'overview') {
        const { data: accounts } = await supabase.from('accounts').select('balance');
        const { data: categories } = await supabase.from('categories').select('budgeted, activity');
        const tb = accounts?.reduce((s, a) => s + parseFloat(a.balance || 0), 0) || 0;
        const bud = categories?.reduce((s, c) => s + parseFloat(c.budgeted || 0), 0) || 0;
        const act = categories?.reduce((s, c) => s + parseFloat(c.activity || 0), 0) || 0;
        return ok(res, { total_balance: tb, total_budgeted: bud, total_activity: act, to_be_budgeted: tb - bud, available: bud + act });
      }
      if (path[1] === 'spending-by-category') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

        // Get transactions
        const { data: txns, error: e } = await supabase.from('transactions').select('amount, category_id').gte('date', start).lt('date', end).lt('amount', 0);
        if (e) return serverErr(res, e.message);

        // Get categories separately
        const { data: cats } = await supabase.from('categories').select('id, name, budgeted, activity, category_groups(name)');
        const catMap = {};
        cats?.forEach(c => { catMap[c.id] = c; });

        const map = {};
        txns?.forEach(tx => {
          const id = tx.category_id;
          if (!id || !catMap[id]) return;
          const cat = catMap[id];
          if (!map[id]) map[id] = { category: cat.name, group_name: cat.category_groups?.name, spent: 0, budgeted: parseFloat(cat.budgeted || 0), available: parseFloat(cat.activity || 0) + parseFloat(cat.budgeted || 0) };
          map[id].spent += Math.abs(parseFloat(tx.amount));
        });
        return ok(res, Object.values(map).sort((a, b) => b.spent - a.spent));
      }
      if (path[1] === 'monthly-trends') {
        const ago = new Date(); ago.setMonth(ago.getMonth() - 5); ago.setDate(1);
        const { data: txns, error: e } = await supabase.from('transactions').select('date, amount, category_id').gte('date', ago.toISOString().split('T')[0]).lt('amount', 0);
        if (e) return serverErr(res, e.message);

        const { data: cats } = await supabase.from('categories').select('id, name');
        const catMap = {};
        cats?.forEach(c => { catMap[c.id] = c.name; });

        const map = {};
        txns?.forEach(tx => {
          const catName = catMap[tx.category_id] || 'Uncategorized';
          const k = `${tx.date.substring(0, 7)}-${catName}`;
          if (!map[k]) map[k] = { month: tx.date.substring(0, 7), category: catName, spent: 0 };
          map[k].spent += Math.abs(parseFloat(tx.amount));
        });
        return ok(res, Object.values(map).sort((a, b) => b.month.localeCompare(a.month) || b.spent - a.spent));
      }
      if (path[1] === 'recent-transactions') {
        const limit = parseInt(query.limit) || 10;
        const { data, error: e } = await supabase.from('transactions').select(txSelect).order('date', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
        if (e) return serverErr(res, e.message);
        return ok(res, data.map(fmtTx));
      }
      // GET /api/reports/insights
      if (path[1] === 'insights') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
        const { data: txns } = await supabase.from('transactions').select('payee, amount, date, category_id').gte('date', start).lt('date', end).lt('amount', 0);
        if (!txns?.length) return ok(res, { totalSpent: 0, avgDaily: 0, topMerchants: [], topCategories: [], transactionCount: 0 });

        const totalSpent = txns.reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);
        const daysSoFar = Math.max(now.getDate(), 1);
        const avgDaily = totalSpent / daysSoFar;

        // Top merchants
        const merchantMap = {};
        txns.forEach(tx => {
          if (!tx.payee) return;
          if (!merchantMap[tx.payee]) merchantMap[tx.payee] = { payee: tx.payee, total: 0, count: 0 };
          merchantMap[tx.payee].total += Math.abs(parseFloat(tx.amount));
          merchantMap[tx.payee].count++;
        });
        const topMerchants = Object.values(merchantMap).sort((a, b) => b.total - a.total).slice(0, 5);

        // Top categories
        const { data: cats } = await supabase.from('categories').select('id, name');
        const catNameMap = {};
        cats?.forEach(c => { catNameMap[c.id] = c.name; });
        const catMap = {};
        txns.forEach(tx => {
          const name = catNameMap[tx.category_id] || 'Uncategorized';
          if (!catMap[name]) catMap[name] = { category: name, total: 0 };
          catMap[name].total += Math.abs(parseFloat(tx.amount));
        });
        const topCategories = Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 5);

        return ok(res, { totalSpent, avgDaily, topMerchants, topCategories, transactionCount: txns.length });
      }
    }

    // === RECURRING TRANSACTIONS ===
    if (path[0] === 'recurring') {
      if (req.method === 'GET') {
        const { data, error: e } = await supabase.from('recurring_transactions').select('*, accounts(name), categories(name)').order('next_due', { ascending: true });
        if (e) return serverErr(res, e.message);
        return ok(res, data.map(r => ({
          ...r,
          account_name: r.accounts?.name,
          category_name: r.categories?.name,
          accounts: undefined,
          categories: undefined,
        })));
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { data, error: e } = await supabase.from('recurring_transactions').insert({
          account_id: body.account_id,
          category_id: body.category_id || null,
          payee: body.payee,
          amount: body.amount,
          frequency: body.frequency || 'monthly',
          start_date: body.start_date || d(0),
          next_due: body.next_due,
          enabled: body.enabled !== false,
        }).select().single();
        if (e) return serverErr(res, e.message);
        return created(res, data);
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const { data, error: e } = await supabase.from('recurring_transactions').update({
          account_id: body.account_id,
          category_id: body.category_id || null,
          payee: body.payee,
          amount: body.amount,
          frequency: body.frequency,
          next_due: body.next_due,
          enabled: body.enabled,
          updated_at: new Date().toISOString(),
        }).eq('id', path[1]).select().single();
        if (e) return serverErr(res, e.message);
        if (!data) return notFound(res);
        return ok(res, data);
      }
      if (req.method === 'DELETE') {
        const { data, error: e } = await supabase.from('recurring_transactions').delete().eq('id', path[1]).select();
        if (e) return serverErr(res, e.message);
        if (!data?.length) return notFound(res);
        return ok(res, { message: 'Recurring transaction deleted' });
      }
      if (req.method === 'PATCH' && path[2] === 'skip') {
        // Skip to next occurrence
        const { data: rec } = await supabase.from('recurring_transactions').select('next_due, frequency').eq('id', path[1]).single();
        if (!rec) return notFound(res);
        const next = new Date(rec.next_due);
        if (rec.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
        else if (rec.frequency === 'weekly') next.setDate(next.getDate() + 7);
        else if (rec.frequency === 'biweekly') next.setDate(next.getDate() + 14);
        else if (rec.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
        const { data, error: e } = await supabase.from('recurring_transactions').update({ next_due: next.toISOString().split('T')[0] }).eq('id', path[1]).select().single();
        if (e) return serverErr(res, e.message);
        return ok(res, data);
      }
    }

    return json(res, 404, { error: 'Endpoint not found' });
  } catch (e) {
    return serverErr(res, e.message);
  }
}
