import supabase from './client.js';

const tableOrder = [
  'budget_months',
  'recurring_transactions',
  'goals',
  'transactions',
  'categories',
  'category_groups',
  'accounts',
];

async function clearTable(table) {
  const { count: beforeCount, error: countError } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (countError) throw new Error(`${table}: ${countError.message}`);
  if (!beforeCount) return { table, deleted: 0 };

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .gte('id', 0);

  if (deleteError) throw new Error(`${table}: ${deleteError.message}`);
  return { table, deleted: beforeCount };
}

async function clearData() {
  try {
    console.log('Clearing app data while keeping tables...');
    const results = [];

    for (const table of tableOrder) {
      results.push(await clearTable(table));
    }

    results.forEach(({ table, deleted }) => {
      console.log(`  ${table}: deleted ${deleted} row${deleted === 1 ? '' : 's'}`);
    });

    console.log('\nDone. The schema is still in place and ready for real imports.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear data:', error.message);
    process.exit(1);
  }
}

clearData();
