// Comprehensive seed data — realistic finances over 6 months
import supabase from './client.js';

const today = new Date();
const d = (daysAgo) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};
const m = (monthsAgo) => {
  const date = new Date(today);
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString().split('T')[0];
};

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // === Accounts ===
    const { data: accounts, error: accErr } = await supabase.from('accounts').insert([
      { name: 'Chase Checking', type: 'checking', balance: 4823.67, icon: 'credit-card', color: 'blue' },
      { name: 'Ally Savings', type: 'savings', balance: 15420.00, icon: 'piggy-bank', color: 'green' },
      { name: 'Chase Sapphire', type: 'creditCard', balance: -1247.33, icon: 'credit-card', color: 'purple' },
      { name: 'Apple Cash', type: 'cash', balance: 127.50, icon: 'smartphone', color: 'gray' },
      { name: 'Fidelity 401k', type: 'savings', balance: 67890.00, icon: 'chart', color: 'emerald' },
    ]).select();

    if (accErr) {
      console.error('❌ Failed to insert accounts:', accErr.message);
      console.error('  Code:', accErr.code);
      console.error('  Details:', accErr.details);
      console.error('  Hint:', accErr.hint);
      console.error('\n💡 Make sure:');
      console.error('  1. You ran migrate.sql in the Supabase SQL Editor');
      console.error('  2. SUPABASE_SERVICE_ROLE_KEY is set in backend/.env');
      console.error('  3. Row Level Security is disabled on all tables');
      process.exit(1);
    }

    // === Category Groups ===
    const { data: groups } = await supabase.from('category_groups').insert([
      { name: 'Immediate Obligations', icon: 'home', sort_order: 1 },
      { name: 'True Expenses', icon: 'calendar', sort_order: 2 },
      { name: 'Quality of Life Goals', icon: 'star', sort_order: 3 },
      { name: 'Just for Fun', icon: 'sparkles', sort_order: 4 },
    ]).select();

    const groupMap = {};
    groups.forEach(g => groupMap[g.name] = g.id);

    // === Categories ===
    const categories = [
      { group: 'Immediate Obligations', name: 'Rent/Mortgage', budgeted: 1500, activity: -1500 },
      { group: 'Immediate Obligations', name: 'Groceries', budgeted: 500, activity: -387.42 },
      { group: 'Immediate Obligations', name: 'Transportation', budgeted: 200, activity: -156.80 },
      { group: 'Immediate Obligations', name: 'Phone Bill', budgeted: 85, activity: -85 },
      { group: 'Immediate Obligations', name: 'Internet', budgeted: 79, activity: -79 },
      { group: 'True Expenses', name: 'Car Insurance', budgeted: 150, activity: 0 },
      { group: 'True Expenses', name: 'Health Insurance', budgeted: 320, activity: -320 },
      { group: 'True Expenses', name: 'Home Maintenance', budgeted: 100, activity: -45.99 },
      { group: 'True Expenses', name: 'Car Maintenance', budgeted: 75, activity: 0 },
      { group: 'True Expenses', name: 'Medical', budgeted: 50, activity: -25.00 },
      { group: 'Quality of Life Goals', name: 'Dining Out', budgeted: 250, activity: -189.45 },
      { group: 'Quality of Life Goals', name: 'Entertainment', budgeted: 100, activity: -31.98 },
      { group: 'Quality of Life Goals', name: 'Gym Membership', budgeted: 50, activity: -49.99 },
      { group: 'Quality of Life Goals', name: 'Subscriptions', budgeted: 45, activity: -44.97 },
      { group: 'Just for Fun', name: 'Shopping', budgeted: 200, activity: -156.78 },
      { group: 'Just for Fun', name: 'Hobbies', budgeted: 75, activity: -34.99 },
      { group: 'Just for Fun', name: 'Travel Fund', budgeted: 300, activity: 0 },
    ];

    for (const cat of categories) {
      const { data } = await supabase.from('categories').insert({
        category_group_id: groupMap[cat.group],
        name: cat.name,
        budgeted: cat.budgeted,
        activity: cat.activity,
      });
    }

    console.log(`  ✅ ${categories.length} categories created`);

    // === Get all IDs for transactions ===
    const { data: allAccounts } = await supabase.from('accounts').select('id, name');
    const { data: allCategories } = await supabase.from('categories').select('id, name');

    const acc = (name) => allAccounts.find(a => a.name === name)?.id;
    const cat = (name) => allCategories.find(c => c.name === name)?.id;

    // === Transactions (6 months of realistic data) ===
    const transactions = [
      // === Current Month (0-30 days ago) ===
      // Rent
      { acc: 'Chase Checking', cat: 'Rent/Mortgage', date: d(1), payee: 'Property Management', amount: -1500, memo: 'Monthly rent', cleared: true },
      // Groceries (multiple trips)
      { acc: 'Chase Checking', cat: 'Groceries', date: d(0), payee: 'Whole Foods', amount: -87.43, memo: 'Weekly groceries', cleared: false },
      { acc: 'Chase Sapphire', cat: 'Groceries', date: d(2), payee: 'Trader Joe\'s', amount: -62.18, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Groceries', date: d(5), payee: 'Costco', amount: -143.67, memo: 'Bulk shopping', cleared: true },
      { acc: 'Apple Cash', cat: 'Groceries', date: d(8), payee: 'Local Farmers Market', amount: -34.14, memo: 'Fresh produce', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: d(12), payee: 'Whole Foods', amount: -60.00, memo: '', cleared: true },
      // Dining Out
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: d(1), payee: 'Chipotle', amount: -15.90, memo: 'Quick lunch', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: d(3), payee: 'Olive Garden', amount: -42.50, memo: 'Dinner with Sarah', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: d(7), payee: 'Starbucks', amount: -6.75, memo: '', cleared: true },
      { acc: 'Apple Cash', cat: 'Dining Out', date: d(10), payee: 'Pizza Hut', amount: -28.30, memo: 'Movie night', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: d(14), payee: 'Sushi Palace', amount: -67.00, memo: 'Anniversary dinner', cleared: false },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: d(18), payee: 'Starbucks', amount: -7.50, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Dining Out', date: d(22), payee: 'Sweetgreen', amount: -14.50, memo: 'Lunch with team', cleared: true },
      // Income
      { acc: 'Chase Checking', cat: null, date: d(0), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
      { acc: 'Chase Checking', cat: null, date: d(14), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
      { acc: 'Ally Savings', cat: null, date: d(5), payee: 'Dividend Income', amount: 47.32, memo: 'VTSAX quarterly', cleared: true },
      // Subscriptions
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: d(3), payee: 'Netflix', amount: -15.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: d(7), payee: 'Spotify', amount: -10.99, memo: 'Family plan', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: d(10), payee: 'iCloud', amount: -2.99, memo: '50GB storage', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: d(12), payee: 'YouTube Premium', amount: -14.99, memo: '', cleared: true },
      // Entertainment
      { acc: 'Chase Sapphire', cat: 'Entertainment', date: d(4), payee: 'AMC Theaters', amount: -24.00, memo: 'Dune Part 2', cleared: true },
      { acc: 'Apple Cash', cat: 'Entertainment', date: d(9), payee: 'Steam', amount: -7.99, memo: 'Game sale', cleared: true },
      // Bills
      { acc: 'Chase Checking', cat: 'Phone Bill', date: d(5), payee: 'T-Mobile', amount: -85.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Internet', date: d(10), payee: 'Xfinity', amount: -79.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Health Insurance', date: d(1), payee: 'BlueCross', amount: -320.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Gym Membership', date: d(1), payee: 'Planet Fitness', amount: -49.99, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Medical', date: d(15), payee: 'CVS Pharmacy', amount: -25.00, memo: 'Prescription', cleared: true },
      // Shopping & Hobbies
      { acc: 'Chase Sapphire', cat: 'Shopping', date: d(6), payee: 'Amazon', amount: -89.99, memo: 'Kitchen items', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Shopping', date: d(11), payee: 'Target', amount: -43.79, memo: 'Household stuff', cleared: true },
      { acc: 'Apple Cash', cat: 'Shopping', date: d(20), payee: 'Apple Store', amount: -23.00, memo: 'USB-C cable', cleared: false },
      { acc: 'Chase Sapphire', cat: 'Hobbies', date: d(13), payee: 'Michaels', amount: -34.99, memo: 'Art supplies', cleared: true },
      // Transportation
      { acc: 'Chase Sapphire', cat: 'Transportation', date: d(2), payee: 'Shell', amount: -52.30, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Transportation', date: d(16), payee: 'Shell', amount: -48.50, memo: '', cleared: true },
      { acc: 'Apple Cash', cat: 'Transportation', date: d(20), payee: 'Metro Card', amount: -56.00, memo: 'Monthly pass', cleared: true },

      // === Previous Month ===
      { acc: 'Chase Checking', cat: 'Rent/Mortgage', date: m(1), payee: 'Property Management', amount: -1500, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: null, date: m(1), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
      { acc: 'Chase Checking', cat: null, date: m(15), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: m(2), payee: 'Whole Foods', amount: -112.45, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Groceries', date: m(5), payee: 'Costco', amount: -156.78, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: m(8), payee: 'Trader Joe\'s', amount: -78.90, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: m(12), payee: 'Whole Foods', amount: -95.32, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Groceries', date: m(15), payee: 'Instacart', amount: -67.45, memo: 'Delivery', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: m(20), payee: 'Trader Joe\'s', amount: -54.21, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(1), payee: 'Chipotle', amount: -14.50, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(4), payee: 'Olive Garden', amount: -38.90, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(8), payee: 'Starbucks', amount: -6.75, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(12), payee: 'Texas Roadhouse', amount: -72.00, memo: 'Birthday', cleared: true },
      { acc: 'Apple Cash', cat: 'Dining Out', date: m(18), payee: 'Domino\'s', amount: -22.50, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(22), payee: 'Sweetgreen', amount: -15.80, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(25), payee: 'Five Guys', amount: -18.40, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Phone Bill', date: m(5), payee: 'T-Mobile', amount: -85.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Internet', date: m(10), payee: 'Xfinity', amount: -79.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Health Insurance', date: m(1), payee: 'BlueCross', amount: -320.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Gym Membership', date: m(1), payee: 'Planet Fitness', amount: -49.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(3), payee: 'Netflix', amount: -15.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(7), payee: 'Spotify', amount: -10.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(10), payee: 'iCloud', amount: -2.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(12), payee: 'YouTube Premium', amount: -14.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Entertainment', date: m(6), payee: 'AMC Theaters', amount: -24.00, memo: '', cleared: true },
      { acc: 'Apple Cash', cat: 'Entertainment', date: m(14), payee: 'PlayStation Store', amount: -69.99, memo: 'New game', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Shopping', date: m(4), payee: 'Amazon', amount: -45.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Shopping', date: m(9), payee: 'Nike', amount: -129.00, memo: 'New shoes', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Shopping', date: m(20), payee: 'Home Depot', amount: -67.50, memo: 'Tools', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Transportation', date: m(3), payee: 'Shell', amount: -51.20, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Transportation', date: m(17), payee: 'Shell', amount: -47.80, memo: '', cleared: true },
      { acc: 'Apple Cash', cat: 'Transportation', date: m(20), payee: 'Metro Card', amount: -56.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Travel Fund', date: m(1), payee: 'Transfer', amount: -300.00, memo: 'Vacation savings', cleared: true },
      { acc: 'Chase Checking', cat: 'Home Maintenance', date: m(15), payee: 'Home Depot', amount: -45.99, memo: 'Lightbulbs', cleared: true },

      // === 2 months ago ===
      { acc: 'Chase Checking', cat: 'Rent/Mortgage', date: m(2), payee: 'Property Management', amount: -1500, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: null, date: m(2), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
      { acc: 'Chase Checking', cat: null, date: m(2), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: m(2), payee: 'Whole Foods', amount: -98.76, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Groceries', date: m(2), payee: 'Costco', amount: -134.50, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: m(2), payee: 'Trader Joe\'s', amount: -67.89, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Groceries', date: m(2), payee: 'Whole Foods', amount: -88.45, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(2), payee: 'Cheesecake Factory', amount: -56.70, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(2), payee: 'Starbucks', amount: -6.75, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(2), payee: 'Panera', amount: -18.90, memo: '', cleared: true },
      { acc: 'Apple Cash', cat: 'Dining Out', date: m(2), payee: 'Uber Eats', amount: -34.50, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Phone Bill', date: m(2), payee: 'T-Mobile', amount: -85.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Internet', date: m(2), payee: 'Xfinity', amount: -79.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Health Insurance', date: m(2), payee: 'BlueCross', amount: -320.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Gym Membership', date: m(2), payee: 'Planet Fitness', amount: -49.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(2), payee: 'Netflix', amount: -15.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(2), payee: 'Spotify', amount: -10.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(2), payee: 'iCloud', amount: -2.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(2), payee: 'YouTube Premium', amount: -14.99, memo: '', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Shopping', date: m(2), payee: 'Best Buy', amount: -199.99, memo: 'AirPods', cleared: true },
      { acc: 'Chase Sapphire', cat: 'Transportation', date: m(2), payee: 'Shell', amount: -49.30, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Travel Fund', date: m(2), payee: 'Transfer', amount: -300.00, memo: '', cleared: true },
      { acc: 'Chase Checking', cat: 'Medical', date: m(2), payee: 'Dentist', amount: -150.00, memo: 'Checkup', cleared: true },

      // === 3-6 months ago (monthly recurring) ===
      ...[3, 4, 5].map(ma => [
        { acc: 'Chase Checking', cat: 'Rent/Mortgage', date: m(ma), payee: 'Property Management', amount: -1500, memo: '', cleared: true },
        { acc: 'Chase Checking', cat: null, date: m(ma), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
        { acc: 'Chase Checking', cat: null, date: m(ma), payee: 'TechCorp Inc', amount: 4250.00, memo: 'Salary', cleared: true },
        { acc: 'Chase Checking', cat: 'Groceries', date: m(ma), payee: 'Whole Foods', amount: -105.23, memo: '', cleared: true },
        { acc: 'Chase Sapphire', cat: 'Groceries', date: m(ma), payee: 'Costco', amount: -145.67, memo: '', cleared: true },
        { acc: 'Chase Checking', cat: 'Groceries', date: m(ma), payee: 'Trader Joe\'s', amount: -72.45, memo: '', cleared: true },
        { acc: 'Chase Sapphire', cat: 'Dining Out', date: m(ma), payee: 'Various Restaurants', amount: -120.00, memo: '', cleared: true },
        { acc: 'Chase Checking', cat: 'Phone Bill', date: m(ma), payee: 'T-Mobile', amount: -85.00, memo: '', cleared: true },
        { acc: 'Chase Checking', cat: 'Internet', date: m(ma), payee: 'Xfinity', amount: -79.00, memo: '', cleared: true },
        { acc: 'Chase Checking', cat: 'Health Insurance', date: m(ma), payee: 'BlueCross', amount: -320.00, memo: '', cleared: true },
        { acc: 'Chase Checking', cat: 'Gym Membership', date: m(ma), payee: 'Planet Fitness', amount: -49.99, memo: '', cleared: true },
        { acc: 'Chase Sapphire', cat: 'Subscriptions', date: m(ma), payee: 'Subscriptions', amount: -44.97, memo: '', cleared: true },
        { acc: 'Chase Sapphire', cat: 'Shopping', date: m(ma), payee: 'Amazon', amount: -75.00, memo: '', cleared: true },
        { acc: 'Chase Sapphire', cat: 'Transportation', date: m(ma), payee: 'Shell', amount: -50.00, memo: '', cleared: true },
        { acc: 'Chase Checking', cat: 'Travel Fund', date: m(ma), payee: 'Transfer', amount: -300.00, memo: '', cleared: true },
      ]).flat(),
    ];

    // Insert transactions in batches
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize).map(tx => ({
        account_id: acc(tx.acc),
        category_id: tx.cat ? cat(tx.cat) : null,
        date: tx.date,
        payee: tx.payee,
        memo: tx.memo || '',
        amount: tx.amount,
        cleared: tx.cleared !== false,
        tags: tx.tags || [],
      }));
      const { error } = await supabase.from('transactions').insert(batch);
      if (error && !error.message.includes('duplicate')) {
        console.log('  ⚠️  Transactions batch error:', error.message);
      }
    }

    console.log(`  ✅ ${transactions.length} transactions created`);

    // === Goals ===
    const { data: goalCats } = await supabase.from('categories').select('id').eq('name', 'Travel Fund');
    const { data: goalCats2 } = await supabase.from('categories').select('id').eq('name', 'Home Maintenance');

    await supabase.from('goals').insert([
      {
        category_id: goalCats?.[0]?.id,
        name: 'Hawaii Vacation 🌺',
        target_amount: 5000,
        current_amount: 2400,
        target_date: d(-150), // ~5 months from now
        monthly_contribution: 300,
      },
      {
        category_id: goalCats2?.[0]?.id,
        name: 'Emergency Fund',
        target_amount: 15000,
        current_amount: 8750,
        target_date: d(-300),
        monthly_contribution: 500,
      },
      {
        category_id: null,
        name: 'New Car Down Payment 🚗',
        target_amount: 8000,
        current_amount: 3200,
        target_date: d(-240),
        monthly_contribution: 400,
      },
      {
        category_id: null,
        name: 'Home Down Payment 🏠',
        target_amount: 60000,
        current_amount: 18500,
        target_date: d(-730),
        monthly_contribution: 1000,
      },
    ]);

    console.log('  ✅ 4 goals created');

    // === Recurring Transactions ===
    const recAcc = (name) => allAccounts.find(a => a.name === name)?.id;
    const recCat = (name) => allCategories.find(c => c.name === name)?.id;

    await supabase.from('recurring_transactions').insert([
      { account_id: recAcc('Chase Checking'), category_id: recCat('Rent/Mortgage'), payee: 'Property Management', amount: -1500, frequency: 'monthly', start_date: m(12), next_due: d(-1), enabled: true },
      { account_id: recAcc('Chase Checking'), category_id: recCat('Phone Bill'), payee: 'T-Mobile', amount: -85, frequency: 'monthly', start_date: m(12), next_due: d(5), enabled: true },
      { account_id: recAcc('Chase Checking'), category_id: recCat('Internet'), payee: 'Xfinity', amount: -79, frequency: 'monthly', start_date: m(12), next_due: d(10), enabled: true },
      { account_id: recAcc('Chase Checking'), category_id: recCat('Health Insurance'), payee: 'BlueCross', amount: -320, frequency: 'monthly', start_date: m(12), next_due: d(1), enabled: true },
      { account_id: recAcc('Chase Checking'), category_id: recCat('Gym Membership'), payee: 'Planet Fitness', amount: -49.99, frequency: 'monthly', start_date: m(12), next_due: d(1), enabled: true },
      { account_id: recAcc('Chase Sapphire'), category_id: recCat('Subscriptions'), payee: 'Netflix', amount: -15.99, frequency: 'monthly', start_date: m(12), next_due: d(3), enabled: true },
      { account_id: recAcc('Chase Sapphire'), category_id: recCat('Subscriptions'), payee: 'Spotify', amount: -10.99, frequency: 'monthly', start_date: m(12), next_due: d(7), enabled: true },
      { account_id: recAcc('Chase Sapphire'), category_id: recCat('Subscriptions'), payee: 'iCloud', amount: -2.99, frequency: 'monthly', start_date: m(12), next_due: d(10), enabled: true },
      { account_id: recAcc('Chase Checking'), category_id: null, payee: 'TechCorp Inc', amount: 4250, frequency: 'biweekly', start_date: m(12), next_due: d(0), enabled: true },
      { account_id: recAcc('Chase Checking'), category_id: recCat('Car Insurance'), payee: 'Geico', amount: -150, frequency: 'monthly', start_date: m(12), next_due: d(15), enabled: true },
      { account_id: recAcc('Chase Checking'), category_id: recCat('Travel Fund'), payee: 'Transfer to Savings', amount: -300, frequency: 'monthly', start_date: m(6), next_due: d(1), enabled: true },
    ]);

    console.log('  ✅ 11 recurring transactions created');

    // === Budget Month ===
    await supabase.from('budget_months').insert([
      { month: new Date().toISOString().substring(0, 7), income: 8500, to_be_budgeted: 2347.67 },
    ]);

    console.log('  ✅ Budget month created');

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
