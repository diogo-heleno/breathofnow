import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExpenseCategory, ExpenseTransaction } from '@/lib/db';

// Types for the store
interface MonthSummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  transactionCount: number;
  byCategory: Record<number, number>;
}

interface ExpenseState {
  // Current view state
  selectedMonth: number; // 1-12
  selectedYear: number;
  setSelectedMonth: (month: number, year: number) => void;

  // Quick Add state
  quickAddType: 'expense' | 'income';
  setQuickAddType: (type: 'expense' | 'income') => void;

  // Categories cache
  categories: ExpenseCategory[];
  setCategories: (categories: ExpenseCategory[]) => void;
  getCategoryById: (id: number) => ExpenseCategory | undefined;

  // Current month summary (cached for performance)
  monthSummary: MonthSummary | null;
  setMonthSummary: (summary: MonthSummary | null) => void;

  // Recent transactions for quick display
  recentTransactions: ExpenseTransaction[];
  setRecentTransactions: (transactions: ExpenseTransaction[]) => void;

  // Settings
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
  favoriteCurrencies: string[];
  setFavoriteCurrencies: (currencies: string[]) => void;

  // UI State
  isQuickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;

  // Filters
  filterCategoryId: number | null;
  setFilterCategoryId: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;
}

const now = new Date();

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      // Current view state
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      setSelectedMonth: (month, year) => set({ selectedMonth: month, selectedYear: year }),

      // Quick Add state
      quickAddType: 'expense',
      setQuickAddType: (quickAddType) => set({ quickAddType }),

      // Categories
      categories: [],
      setCategories: (categories) => set({ categories }),
      getCategoryById: (id) => {
        const state = get();
        return state.categories.find((c) => c.id === id);
      },

      // Month summary
      monthSummary: null,
      setMonthSummary: (monthSummary) => set({ monthSummary }),

      // Recent transactions
      recentTransactions: [],
      setRecentTransactions: (recentTransactions) => set({ recentTransactions }),

      // Settings
      baseCurrency: 'EUR',
      setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
      favoriteCurrencies: ['EUR', 'USD', 'GBP', 'BRL'],
      setFavoriteCurrencies: (favoriteCurrencies) => set({ favoriteCurrencies }),

      // UI State
      isQuickAddOpen: false,
      setQuickAddOpen: (isQuickAddOpen) => set({ isQuickAddOpen }),

      // Filters
      filterCategoryId: null,
      setFilterCategoryId: (filterCategoryId) => set({ filterCategoryId }),
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      // Loading
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      isInitialized: false,
      setIsInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'expenseflow-storage',
      partialize: (state) => ({
        baseCurrency: state.baseCurrency,
        favoriteCurrencies: state.favoriteCurrencies,
        quickAddType: state.quickAddType,
      }),
    }
  )
);

// Selectors for common queries
export const selectExpenseCategories = (state: ExpenseState) =>
  state.categories.filter((c) => c.type === 'expense' || c.type === 'both');

export const selectIncomeCategories = (state: ExpenseState) =>
  state.categories.filter((c) => c.type === 'income' || c.type === 'both');

export const selectCategoriesForType = (type: 'expense' | 'income') => (state: ExpenseState) =>
  type === 'expense' ? selectExpenseCategories(state) : selectIncomeCategories(state);
