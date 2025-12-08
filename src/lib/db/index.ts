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

// App-specific data interfaces
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

  constructor() {
    super('BreathOfNowDB');
    
    this.version(1).stores({
      preferences: '++id, theme, locale',
      expenses: '++id, date, category, amount, currency',
      investments: '++id, symbol, type, broker',
      workouts: '++id, date, type, name',
      recipes: '++id, title, isFavorite, *tags',
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
