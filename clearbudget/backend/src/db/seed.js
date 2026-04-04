// Run this after running migrate.sql in the Supabase SQL Editor
// This seed file uses the Supabase client to insert sample data

import supabase from './client.js';

async function seed() {
  try {
    // Insert category groups
    const { data: groups, error: groupsError } = await supabase
      .from('category_groups')
      .insert([
        { name: 'Immediate Obligations' },
        { name: 'True Expenses' },
        { name: 'Debt Payments' },
        { name: 'Quality of Life Goals' },
      ])
      .select();

    if (groupsError && !groupsError.message.includes('duplicate')) {
      console.log('Category groups note:', groupsError?.message || 'inserted');
    }

    // Insert categories
    const { data: immediateGroup } = await supabase.from('category_groups').select('id').eq('name', 'Immediate Obligations').single();
    const { data: trueExpensesGroup } = await supabase.from('category_groups').select('id').eq('name', 'True Expenses').single();
    const { data: debtGroup } = await supabase.from('category_groups').select('id').eq('name', 'Debt Payments').single();
    const { data: qualityGroup } = await supabase.from('category_groups').select('id').eq('name', 'Quality of Life Goals').single();

    const categoriesToInsert = [
      { category_group_id: immediateGroup?.id, name: 'Rent/Mortgage', budgeted: 1500, activity: 0 },
      { category_group_id: immediateGroup?.id, name: 'Groceries', budgeted: 500, activity: 0 },
      { category_group_id: trueExpensesGroup?.id, name: 'Utilities', budgeted: 200, activity: 0 },
      { category_group_id: trueExpensesGroup?.id, name: 'Insurance', budgeted: 300, activity: 0 },
      { category_group_id: debtGroup?.id, name: 'Car Payment', budgeted: 350, activity: 0 },
      { category_group_id: qualityGroup?.id, name: 'Entertainment', budgeted: 150, activity: 0 },
      { category_group_id: qualityGroup?.id, name: 'Dining Out', budgeted: 200, activity: 0 },
    ];

    for (const cat of categoriesToInsert) {
      const { error } = await supabase.from('categories').insert(cat);
      if (error && !error.message.includes('duplicate')) {
        console.log('Category note:', error.message);
      }
    }

    // Insert accounts
    const { error: accError } = await supabase.from('accounts').insert([
      { name: 'Checking Account', type: 'checking', balance: 5000 },
      { name: 'Savings Account', type: 'savings', balance: 10000 },
      { name: 'Credit Card', type: 'creditCard', balance: -450 },
    ]);
    if (accError && !accError.message.includes('duplicate')) {
      console.log('Accounts note:', accError.message);
    }

    // Get IDs for transactions
    const { data: checkingAcc } = await supabase.from('accounts').select('id').eq('name', 'Checking Account').single();
    const { data: savingsAcc } = await supabase.from('accounts').select('id').eq('name', 'Savings Account').single();
    const { data: creditAcc } = await supabase.from('accounts').select('id').eq('name', 'Credit Card').single();
    const { data: groceriesCat } = await supabase.from('categories').select('id').eq('name', 'Groceries').single();
    const { data: diningCat } = await supabase.from('categories').select('id').eq('name', 'Dining Out').single();
    const { data: entertainmentCat } = await supabase.from('categories').select('id').eq('name', 'Entertainment').single();

    const today = new Date();
    const daysAgo = (n) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { error: txError } = await supabase.from('transactions').insert([
      { account_id: checkingAcc?.id, category_id: groceriesCat?.id, date: daysAgo(2), payee: 'Whole Foods', memo: 'Weekly groceries', amount: -127.43, cleared: true },
      { account_id: checkingAcc?.id, category_id: diningCat?.id, date: daysAgo(1), payee: 'Chipotle', memo: 'Lunch with team', amount: -23.50, cleared: true },
      { account_id: checkingAcc?.id, category_id: entertainmentCat?.id, date: daysAgo(3), payee: 'Netflix', memo: 'Monthly subscription', amount: -15.99, cleared: true },
      { account_id: creditAcc?.id, category_id: groceriesCat?.id, date: daysAgo(0), payee: 'Target', memo: 'Household items', amount: -67.82, cleared: false },
      { account_id: savingsAcc?.id, category_id: null, date: daysAgo(5), payee: 'Employer', memo: 'Paycheck', amount: 3500, cleared: true },
    ]);
    if (txError) {
      console.log('Transactions note:', txError.message);
    }

    // Insert goals
    const { data: groceriesCatForGoal } = await supabase.from('categories').select('id').eq('name', 'Groceries').single();
    const { error: goalError } = await supabase.from('goals').insert([
      { category_id: groceriesCatForGoal?.id, name: 'Emergency Fund', target_amount: 10000, current_amount: 4500, target_date: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    ]);
    if (goalError && !goalError.message.includes('duplicate')) {
      console.log('Goals note:', goalError.message);
    }

    console.log('✅ Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
