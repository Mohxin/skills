const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const defaultCategoryGroups = [
  {
    name: 'Income',
    icon: 'trending-up',
    sort_order: 1,
    categories: ['Income', 'Salary', 'Interest & Dividends', 'Refunds'],
  },
  {
    name: 'Essentials',
    icon: 'home',
    sort_order: 2,
    categories: ['Housing', 'Groceries', 'Transport', 'Bills & Utilities', 'Insurance', 'Healthcare'],
  },
  {
    name: 'Lifestyle',
    icon: 'sparkles',
    sort_order: 3,
    categories: ['Food & Coffee', 'Shopping', 'Subscriptions & Software', 'Entertainment', 'Travel'],
  },
  {
    name: 'Money Movement',
    icon: 'repeat',
    sort_order: 4,
    categories: ['Transfers', 'Savings & Investments', 'Fees & Memberships', 'Donations', 'Uncategorized'],
  },
];

const categoryRules = [
  { category: 'Salary', income: true, patterns: ['salary', 'lon', 'loneutbetalning', 'techcorp', 'arbetsgivare'] },
  { category: 'Interest & Dividends', income: true, patterns: ['interest', 'ranta', 'utdelning', 'dividend'] },
  { category: 'Refunds', income: true, patterns: ['refund', 'aterbetalning', 'retur'] },

  { category: 'Housing', patterns: ['stadshypotek', 'fastum', 'hyra', 'rent', 'mortgage', 'brf', 'bostad', 'property management'] },
  { category: 'Groceries', patterns: ['willys', 'hemkop', 'ica', 'coop', 'lidl', 'city gross', 'mathem', 'livs', 'grocery', 'groceries', 'supermarket'] },
  { category: 'Transport', patterns: ['ab storstockho', 'storstockho', 'preem', 'ingo', 'shell', 'din x', 'taxi', 'uber', 'bolt', 'parkering', 'fuel', 'metro', 'transport'] },
  { category: 'Bills & Utilities', patterns: ['vattenfall', 'e on', 'tele2', 'telia', 'telenor', 'comhem', 'bredband', 'electric', 'utility', 'internet', 'phone'] },
  { category: 'Insurance', patterns: ['forsakring', 'if skadefors', 'cardif', 'trygg hansa', 'folksam', 'insurance'] },
  { category: 'Healthcare', patterns: ['apotek', 'varden', 'doktor', 'tandlakare', 'pharmacy', 'medical', 'dentist', 'cvs'] },

  { category: 'Food & Coffee', patterns: ['demiatti', 'tazagrill', 'mangal', 'mcd', 'cafe', 'kryddo', 'rattviksglass', 'restaurant', 'starbucks', 'pizza', 'sushi', 'coffee', 'grill'] },
  { category: 'Shopping', patterns: ['clas ohl', 'clasohl', 'amazon', 'jula', 'biltema', 'target', 'nike', 'best buy', 'shopping', 'store'] },
  { category: 'Subscriptions & Software', patterns: ['openai', 'chatgpt', 'pdfeditor', 'netflix', 'spotify', 'icloud', 'youtube', 'subscription', 'software', 'apple com bill'] },
  { category: 'Entertainment', patterns: ['steam', 'bio', 'cinema', 'amc', 'playstation', 'entertainment', 'game'] },
  { category: 'Travel', patterns: ['booking', 'airbnb', 'hotel', 'sas', 'norwegian', 'ryanair', 'travel'] },

  { category: 'Transfers', patterns: ['overf', 'overforing', 'wise', 'ziklo', 'transfer', 'swish', 'mobil', 'kontanten', 'atm'] },
  { category: 'Savings & Investments', patterns: ['nordnet', 'avanza', 'fidelity', 'isk', 'investment', 'savings'] },
  { category: 'Fees & Memberships', patterns: ['unionen', 'akassa', 'avgift', 'fee', 'membership', 'biblioteket'] },
  { category: 'Donations', patterns: ['islamic relief', 'edhi', 'charity', 'donation'] },
];

const buildCategoryLookup = (categories) => categories.reduce((lookup, category) => {
  lookup[normalize(category.name)] = category;
  return lookup;
}, {});

const buildMerchantHistory = (transactions) => transactions.reduce((history, transaction) => {
  if (!transaction.payee || !transaction.category_id) return history;
  history[normalize(transaction.payee)] = transaction.category_id;
  return history;
}, {});

const findCategoryByName = (categoryName, lookup) => lookup[normalize(categoryName)] || null;

const matchRule = (row) => {
  const text = normalize(`${row.payee} ${row.memo}`);
  const amount = Number(row.amount) || 0;
  return categoryRules.find((rule) => {
    if (rule.income && amount <= 0) return false;
    if (!rule.income && amount > 0) return false;
    return rule.patterns.some((pattern) => text.includes(normalize(pattern)));
  });
};

export const categorizeTransaction = (row, categories, transactions = []) => {
  const categoryLookup = buildCategoryLookup(categories);
  const merchantHistory = buildMerchantHistory(transactions);
  const exactMerchantMatch = merchantHistory[normalize(row.payee)];
  if (exactMerchantMatch) {
    const category = categories.find((item) => item.id === exactMerchantMatch);
    if (category) return { category_id: category.id, category_name: category.name, confidence: 'learned' };
  }

  const rule = matchRule(row);
  if (rule) {
    const category = findCategoryByName(rule.category, categoryLookup);
    if (category) return { category_id: category.id, category_name: category.name, confidence: 'rule' };
  }

  const fallbackName = Number(row.amount) > 0 ? 'Income' : 'Uncategorized';
  const fallback = findCategoryByName(fallbackName, categoryLookup);
  return fallback ? { category_id: fallback.id, category_name: fallback.name, confidence: 'fallback' } : {};
};

export const categorizeImportedRows = (rows, categories, transactions = []) => rows.map((row) => ({
  ...row,
  ...categorizeTransaction(row, categories, transactions),
}));
