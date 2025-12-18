/**
 * Storage API - Unified Interface for All Apps
 * 
 * This module provides a consistent API for data storage across all Breath of Now apps.
 * Following the offline-first principle: IndexedDB is always the source of truth.
 * 
 * Key Principles:
 * - Operations happen locally first (via Dexie.js)
 * - Sync to cloud is optional and transparent
 * - Each app has its own namespace
 * - Last-write-wins conflict resolution
 */

import { db } from '@/lib/db';

// Types
export interface SyncableItem {
  id: string;
  updatedAt: number;      // Unix timestamp
  deletedAt?: number;     // Soft delete timestamp
  syncedAt?: number;      // Last sync timestamp
}

export interface StorageItem<T = unknown> {
  id: string;
  namespace: string;
  key: string;
  data: T;
  updatedAt: number;
  deletedAt?: number;
  syncedAt?: number;
}

export type FilterFn<T> = (item: T) => boolean;

export interface StorageAPI {
  // Basic operations
  get<T>(namespace: string, key: string): Promise<T | null>;
  set<T>(namespace: string, key: string, value: T): Promise<void>;
  delete(namespace: string, key: string): Promise<void>;
  
  // Queries
  getAll<T>(namespace: string): Promise<T[]>;
  query<T>(namespace: string, filter: FilterFn<T>): Promise<T[]>;
  
  // Bulk operations
  bulkSet<T>(namespace: string, items: Record<string, T>): Promise<void>;
  clear(namespace: string): Promise<void>;
  
  // Count
  count(namespace: string): Promise<number>;
}

// Internal storage using existing Dexie tables with namespace approach
class LocalStorage implements StorageAPI {
  private getStorageKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      // For expenses, use the existing expenseTransactions table
      if (namespace === 'expenses') {
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          const item = await db.expenseTransactions.get(id);
          return item as T | null;
        }
        return null;
      }
      
      // For categories
      if (namespace === 'expenseCategories') {
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          const item = await db.expenseCategories.get(id);
          return item as T | null;
        }
        return null;
      }

      // For investments
      if (namespace === 'investments') {
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          const item = await db.investments.get(id);
          return item as T | null;
        }
        return null;
      }

      // For workouts
      if (namespace === 'workouts') {
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          const item = await db.workouts.get(id);
          return item as T | null;
        }
        return null;
      }

      // For recipes
      if (namespace === 'recipes') {
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          const item = await db.recipes.get(id);
          return item as T | null;
        }
        return null;
      }

      // For preferences
      if (namespace === 'preferences') {
        const prefs = await db.preferences.toCollection().first();
        return prefs as T | null;
      }

      // Generic fallback using localStorage for simple key-value
      const stored = localStorage.getItem(this.getStorageKey(namespace, key));
      if (stored) {
        return JSON.parse(stored) as T;
      }
      return null;
    } catch (error) {
      console.error('[Storage] Error getting item:', error);
      return null;
    }
  }

  async set<T>(namespace: string, key: string, value: T): Promise<void> {
    try {
      const now = new Date();

      // For expenses
      if (namespace === 'expenses') {
        const data = value as Record<string, unknown>;
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          await db.expenseTransactions.update(id, {
            ...data,
            updatedAt: now,
          });
        } else {
          await db.expenseTransactions.add({
            ...data,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
            isReviewed: true,
          } as Parameters<typeof db.expenseTransactions.add>[0]);
        }
        return;
      }

      // For categories
      if (namespace === 'expenseCategories') {
        const data = value as Record<string, unknown>;
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          await db.expenseCategories.update(id, {
            ...data,
            updatedAt: now,
          });
        } else {
          await db.expenseCategories.add({
            ...data,
            createdAt: now,
            updatedAt: now,
          } as Parameters<typeof db.expenseCategories.add>[0]);
        }
        return;
      }

      // For investments
      if (namespace === 'investments') {
        const data = value as Record<string, unknown>;
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          await db.investments.update(id, {
            ...data,
            updatedAt: now,
          });
        } else {
          await db.investments.add({
            ...data,
            createdAt: now,
            updatedAt: now,
          } as Parameters<typeof db.investments.add>[0]);
        }
        return;
      }

      // For workouts
      if (namespace === 'workouts') {
        const data = value as Record<string, unknown>;
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          await db.workouts.update(id, {
            ...data,
            updatedAt: now,
          });
        } else {
          await db.workouts.add({
            ...data,
            createdAt: now,
            updatedAt: now,
          } as Parameters<typeof db.workouts.add>[0]);
        }
        return;
      }

      // For recipes
      if (namespace === 'recipes') {
        const data = value as Record<string, unknown>;
        const id = parseInt(key, 10);
        if (!isNaN(id)) {
          await db.recipes.update(id, {
            ...data,
            updatedAt: now,
          });
        } else {
          await db.recipes.add({
            ...data,
            createdAt: now,
            updatedAt: now,
          } as Parameters<typeof db.recipes.add>[0]);
        }
        return;
      }

      // For preferences
      if (namespace === 'preferences') {
        const existing = await db.preferences.toCollection().first();
        if (existing?.id) {
          await db.preferences.update(existing.id, {
            ...(value as Record<string, unknown>),
            updatedAt: now,
          });
        } else {
          await db.preferences.add({
            ...(value as Record<string, unknown>),
            createdAt: now,
            updatedAt: now,
          } as Parameters<typeof db.preferences.add>[0]);
        }
        return;
      }

      // Generic fallback using localStorage
      localStorage.setItem(
        this.getStorageKey(namespace, key),
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('[Storage] Error setting item:', error);
      throw error;
    }
  }

  async delete(namespace: string, key: string): Promise<void> {
    try {
      const id = parseInt(key, 10);
      const now = new Date();

      // Soft delete for synced tables
      if (namespace === 'expenses' && !isNaN(id)) {
        await db.expenseTransactions.update(id, {
          deletedAt: now,
          updatedAt: now,
          syncStatus: 'pending',
        });
        return;
      }

      if (namespace === 'expenseCategories' && !isNaN(id)) {
        await db.expenseCategories.update(id, {
          deletedAt: now,
          updatedAt: now,
        });
        return;
      }

      if (namespace === 'investments' && !isNaN(id)) {
        await db.investments.delete(id);
        return;
      }

      if (namespace === 'workouts' && !isNaN(id)) {
        await db.workouts.delete(id);
        return;
      }

      if (namespace === 'recipes' && !isNaN(id)) {
        await db.recipes.delete(id);
        return;
      }

      // Generic fallback
      localStorage.removeItem(this.getStorageKey(namespace, key));
    } catch (error) {
      console.error('[Storage] Error deleting item:', error);
      throw error;
    }
  }

  async getAll<T>(namespace: string): Promise<T[]> {
    try {
      if (namespace === 'expenses') {
        const items = await db.expenseTransactions
          .filter(t => !t.deletedAt)
          .toArray();
        return items as T[];
      }

      if (namespace === 'expenseCategories') {
        const items = await db.expenseCategories
          .filter(c => !c.deletedAt)
          .toArray();
        return items as T[];
      }

      if (namespace === 'investments') {
        const items = await db.investments.toArray();
        return items as T[];
      }

      if (namespace === 'workouts') {
        const items = await db.workouts.toArray();
        return items as T[];
      }

      if (namespace === 'recipes') {
        const items = await db.recipes.toArray();
        return items as T[];
      }

      if (namespace === 'preferences') {
        const prefs = await db.preferences.toArray();
        return prefs as T[];
      }

      // Generic fallback - scan localStorage
      const items: T[] = [];
      const prefix = `${namespace}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            items.push(JSON.parse(value));
          }
        }
      }
      return items;
    } catch (error) {
      console.error('[Storage] Error getting all items:', error);
      return [];
    }
  }

  async query<T>(namespace: string, filter: FilterFn<T>): Promise<T[]> {
    const all = await this.getAll<T>(namespace);
    return all.filter(filter);
  }

  async bulkSet<T>(namespace: string, items: Record<string, T>): Promise<void> {
    const entries = Object.entries(items);
    for (const [key, value] of entries) {
      await this.set(namespace, key, value);
    }
  }

  async clear(namespace: string): Promise<void> {
    try {
      if (namespace === 'expenses') {
        await db.expenseTransactions.clear();
        return;
      }

      if (namespace === 'expenseCategories') {
        await db.expenseCategories.clear();
        return;
      }

      if (namespace === 'investments') {
        await db.investments.clear();
        return;
      }

      if (namespace === 'workouts') {
        await db.workouts.clear();
        return;
      }

      if (namespace === 'recipes') {
        await db.recipes.clear();
        return;
      }

      if (namespace === 'preferences') {
        await db.preferences.clear();
        return;
      }

      // Generic fallback
      const prefix = `${namespace}:`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('[Storage] Error clearing namespace:', error);
      throw error;
    }
  }

  async count(namespace: string): Promise<number> {
    try {
      if (namespace === 'expenses') {
        return await db.expenseTransactions.filter(t => !t.deletedAt).count();
      }

      if (namespace === 'expenseCategories') {
        return await db.expenseCategories.filter(c => !c.deletedAt).count();
      }

      if (namespace === 'investments') {
        return await db.investments.count();
      }

      if (namespace === 'workouts') {
        return await db.workouts.count();
      }

      if (namespace === 'recipes') {
        return await db.recipes.count();
      }

      // Generic fallback
      let count = 0;
      const prefix = `${namespace}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          count++;
        }
      }
      return count;
    } catch (error) {
      console.error('[Storage] Error counting items:', error);
      return 0;
    }
  }
}

// Singleton instance
export const storage = new LocalStorage();

// App-specific namespaces (constants for type safety)
export const NAMESPACES = {
  EXPENSES: 'expenses',
  EXPENSE_CATEGORIES: 'expenseCategories',
  INVESTMENTS: 'investments',
  WORKOUTS: 'workouts',
  RECIPES: 'recipes',
  PREFERENCES: 'preferences',
} as const;

export type Namespace = typeof NAMESPACES[keyof typeof NAMESPACES];
