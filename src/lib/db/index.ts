import Dexie, { type Table } from 'dexie';

// Base interface for all entities
export interface BaseEntity {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

// User preferences stored locally
export interface UserPreferences extends BaseEntity {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  currency: string;
  country: string;
  isPremium: boolean;
  premiumUntil?: Date;
  showAds: boolean;
}

// ============================================
// EXPENSEFLOW TYPES
// ============================================

export interface ExpenseTransaction extends BaseEntity {
  amount: number;
  currency: string;
  amountInBase?: number;
  exchangeRate?: number;
  type: 'income' | 'expense';
  description?: string;
  notes?: string;
  categoryId?: number;
  date: string; // YYYY-MM-DD format for easier querying
  syncStatus: 'pending' | 'synced' | 'conflict';
  importBatchId?: string;
  isReviewed: boolean;
  deletedAt?: Date;
}

export interface ExpenseCategory extends BaseEntity {
  name: string;
  nameKey?: string; // i18n key for default categories
  icon: string; // Lucide icon name
  color: string; // Hex color
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  sortOrder: number;
  deletedAt?: Date;
}

export interface ExpenseBudget extends BaseEntity {
  categoryId?: number; // null = total budget
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string; // YYYY-MM-DD
  createdAt: Date;
}

export interface ImportMapping extends BaseEntity {
  name: string; // "CGD Portugal", "Nubank BR"
  mappingJson: string; // JSON com mapeamento de colunas
  delimiter: string;
  dateFormat: string;
  decimalSeparator: ',' | '.';
  hasHeader: boolean;
  negativeIsExpense: boolean;
  useCount: number;
}

export interface ExpenseSettings {
  key: string;
  value: string;
  updatedAt: Date;
}

// Legacy Expense type (kept for backwards compatibility)
export interface Expense extends BaseEntity {
  amount: number;
  currency: string;
  category: string;
  description?: string;
  date: Date;
  tags?: string[];
  isRecurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Investment extends BaseEntity {
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'crypto' | 'bond' | 'other';
  quantity: number;
  averagePrice: number;
  currency: string;
  broker?: string;
  notes?: string;
}

export interface Workout extends BaseEntity {
  name: string;
  type: string;
  duration: number; // minutes
  calories?: number;
  exercises?: WorkoutExercise[];
  notes?: string;
  date: Date;
}

export interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
}

export interface Recipe extends BaseEntity {
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  servings: number;
  prepTime?: number;
  cookTime?: number;
  tags?: string[];
  imageUrl?: string;
  sourceUrl?: string;
  isFavorite?: boolean;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
}

// Main database class
export class BreathOfNowDB extends Dexie {
  preferences!: Table<UserPreferences>;
  expenses!: Table<Expense>;
  investments!: Table<Investment>;
  workouts!: Table<Workout>;
  recipes!: Table<Recipe>;
  // ExpenseFlow tables
  expenseTransactions!: Table<ExpenseTransaction>;
  expenseCategories!: Table<ExpenseCategory>;
  expenseBudgets!: Table<ExpenseBudget>;
  exchangeRates!: Table<ExchangeRate>;
  importMappings!: Table<ImportMapping>;
  expenseSettings!: Table<ExpenseSettings>;

  constructor() {
    super('BreathOfNowDB');

    this.version(1).stores({
      preferences: '++id, theme, locale',
      expenses: '++id, date, category, amount, currency',
      investments: '++id, symbol, type, broker',
      workouts: '++id, date, type, name',
      recipes: '++id, title, isFavorite, *tags',
    });

    // Version 2: Add ExpenseFlow tables
    this.version(2).stores({
      preferences: '++id, theme, locale',
      expenses: '++id, date, category, amount, currency',
      investments: '++id, symbol, type, broker',
      workouts: '++id, date, type, name',
      recipes: '++id, title, isFavorite, *tags',
      // ExpenseFlow tables
      expenseTransactions: '++id, date, categoryId, type, syncStatus, deletedAt',
      expenseCategories: '++id, type, isDefault, sortOrder, deletedAt',
      expenseBudgets: '++id, categoryId, isActive, period',
      exchangeRates: '[fromCurrency+toCurrency+date], date',
      importMappings: '++id, name, useCount',
      expenseSettings: 'key',
    });
  }
}

// Singleton instance
export const db = new BreathOfNowDB();

// Helper functions
export async function getPreferences(): Promise<UserPreferences | undefined> {
  return await db.preferences.toCollection().first();
}

export async function setPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const existing = await getPreferences();
  if (existing?.id) {
    await db.preferences.update(existing.id, {
      ...prefs,
      updatedAt: new Date(),
    });
  } else {
    await db.preferences.add({
      theme: 'system',
      locale: 'en',
      currency: 'EUR',
      country: 'PT',
      isPremium: false,
      showAds: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...prefs,
    });
  }
}

// Export/Import functionality for backup
export async function exportAllData(): Promise<string> {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    preferences: await db.preferences.toArray(),
    expenses: await db.expenses.toArray(),
    investments: await db.investments.toArray(),
    workouts: await db.workouts.toArray(),
    recipes: await db.recipes.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);

  await db.transaction('rw', [db.preferences, db.expenses, db.investments, db.workouts, db.recipes], async () => {
    // Clear existing data
    await Promise.all([
      db.preferences.clear(),
      db.expenses.clear(),
      db.investments.clear(),
      db.workouts.clear(),
      db.recipes.clear(),
    ]);

    // Import new data
    if (data.preferences?.length) await db.preferences.bulkAdd(data.preferences);
    if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
    if (data.investments?.length) await db.investments.bulkAdd(data.investments);
    if (data.workouts?.length) await db.workouts.bulkAdd(data.workouts);
    if (data.recipes?.length) await db.recipes.bulkAdd(data.recipes);
  });
}

// ============================================
// EXPENSEFLOW HELPERS
// ============================================

// Default categories configuration
export const DEFAULT_EXPENSE_CATEGORIES: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Expense categories
  { name: 'Alimentação', nameKey: 'food', icon: 'utensils', color: '#f97316', type: 'expense', isDefault: true, sortOrder: 1 },
  { name: 'Transportes', nameKey: 'transport', icon: 'car', color: '#3b82f6', type: 'expense', isDefault: true, sortOrder: 2 },
  { name: 'Casa', nameKey: 'home', icon: 'home', color: '#8b5cf6', type: 'expense', isDefault: true, sortOrder: 3 },
  { name: 'Saúde', nameKey: 'health', icon: 'heart-pulse', color: '#ef4444', type: 'expense', isDefault: true, sortOrder: 4 },
  { name: 'Lazer', nameKey: 'leisure', icon: 'gamepad-2', color: '#22c55e', type: 'expense', isDefault: true, sortOrder: 5 },
  { name: 'Compras', nameKey: 'shopping', icon: 'shopping-bag', color: '#ec4899', type: 'expense', isDefault: true, sortOrder: 6 },
  { name: 'Educação', nameKey: 'education', icon: 'graduation-cap', color: '#14b8a6', type: 'expense', isDefault: true, sortOrder: 7 },
  { name: 'Outros', nameKey: 'otherExpense', icon: 'ellipsis', color: '#6b7280', type: 'expense', isDefault: true, sortOrder: 8 },
  // Income categories
  { name: 'Salário', nameKey: 'salary', icon: 'briefcase', color: '#22c55e', type: 'income', isDefault: true, sortOrder: 1 },
  { name: 'Freelance', nameKey: 'freelance', icon: 'laptop', color: '#3b82f6', type: 'income', isDefault: true, sortOrder: 2 },
  { name: 'Investimentos', nameKey: 'investments', icon: 'trending-up', color: '#8b5cf6', type: 'income', isDefault: true, sortOrder: 3 },
  { name: 'Outros', nameKey: 'otherIncome', icon: 'plus-circle', color: '#6b7280', type: 'income', isDefault: true, sortOrder: 4 },
];

// Default settings
export const DEFAULT_EXPENSE_SETTINGS: Record<string, string> = {
  base_currency: 'EUR',
  default_transaction_type: 'expense',
  favorite_currencies: JSON.stringify(['EUR', 'USD', 'GBP', 'BRL']),
  date_format: 'DD/MM/YYYY',
  first_day_of_week: '1', // Monday
  show_decimals: 'true',
};

// Initialize ExpenseFlow default data
export async function initializeExpenseFlow(): Promise<void> {
  const categoriesCount = await db.expenseCategories.count();

  if (categoriesCount === 0) {
    const now = new Date();
    const categories = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      createdAt: now,
      updatedAt: now,
    }));
    await db.expenseCategories.bulkAdd(categories);
  }

  // Initialize default settings if not present
  for (const [key, value] of Object.entries(DEFAULT_EXPENSE_SETTINGS)) {
    const existing = await db.expenseSettings.get(key);
    if (!existing) {
      await db.expenseSettings.put({
        key,
        value,
        updatedAt: new Date(),
      });
    }
  }
}

// Get expense setting
export async function getExpenseSetting(key: string): Promise<string | undefined> {
  const setting = await db.expenseSettings.get(key);
  return setting?.value;
}

// Set expense setting
export async function setExpenseSetting(key: string, value: string): Promise<void> {
  await db.expenseSettings.put({
    key,
    value,
    updatedAt: new Date(),
  });
}

// Get all expense categories (excluding deleted)
export async function getExpenseCategories(type?: 'income' | 'expense'): Promise<ExpenseCategory[]> {
  let query = db.expenseCategories.where('deletedAt').equals(undefined as unknown as Date);

  if (type) {
    const categories = await db.expenseCategories
      .filter(cat => !cat.deletedAt && (cat.type === type || cat.type === 'both'))
      .sortBy('sortOrder');
    return categories;
  }

  return db.expenseCategories
    .filter(cat => !cat.deletedAt)
    .sortBy('sortOrder');
}

// Add transaction helper
export async function addExpenseTransaction(
  transaction: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'isReviewed'>
): Promise<number> {
  const now = new Date();
  return db.expenseTransactions.add({
    ...transaction,
    syncStatus: 'pending',
    isReviewed: true,
    createdAt: now,
    updatedAt: now,
  });
}

// Get transactions for a date range
export async function getExpenseTransactions(
  startDate: string,
  endDate: string,
  type?: 'income' | 'expense'
): Promise<ExpenseTransaction[]> {
  let transactions = await db.expenseTransactions
    .where('date')
    .between(startDate, endDate, true, true)
    .filter(t => !t.deletedAt)
    .toArray();

  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}

// Get monthly summary
export async function getMonthlyExpenseSummary(year: number, month: number): Promise<{
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  transactionCount: number;
  byCategory: Record<number, number>;
}> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const transactions = await getExpenseTransactions(startDate, endDate);

  let totalExpenses = 0;
  let totalIncome = 0;
  const byCategory: Record<number, number> = {};

  for (const t of transactions) {
    const amount = t.amountInBase ?? t.amount;
    if (t.type === 'expense') {
      totalExpenses += amount;
    } else {
      totalIncome += amount;
    }

    if (t.categoryId) {
      byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + amount;
    }
  }

  return {
    totalExpenses,
    totalIncome,
    balance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    byCategory,
  };
}

// Export ExpenseFlow data
export async function exportExpenseFlowData(): Promise<string> {
  const data = {
    version: 1,
    app: 'ExpenseFlow',
    exportedAt: new Date().toISOString(),
    transactions: await db.expenseTransactions.filter(t => !t.deletedAt).toArray(),
    categories: await db.expenseCategories.filter(c => !c.deletedAt).toArray(),
    budgets: await db.expenseBudgets.toArray(),
    settings: await db.expenseSettings.toArray(),
  };
  return JSON.stringify(data, null, 2);
}
