/**
 * ExpenseFlow Sync Engine
 * 
 * Orquestrador principal de sincronização entre IndexedDB (local) e Supabase (cloud)
 * 
 * Princípios:
 * - IndexedDB é SEMPRE a fonte de verdade
 * - Sync é background e opcional (requer autenticação)
 * - Offline-first: todas as operações funcionam sem internet
 */

import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import { pushTransactions, pushCategories, pushBudgets } from './push';
import { pullTransactions, pullCategories, pullBudgets } from './pull';
import { resolveConflicts } from './conflict';
import { SyncQueue } from './queue';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
export type SyncDirection = 'push' | 'pull' | 'both';

export interface SyncResult {
  success: boolean;
  pushed: {
    transactions: number;
    categories: number;
    budgets: number;
  };
  pulled: {
    transactions: number;
    categories: number;
    budgets: number;
  };
  conflicts: number;
  errors: string[];
}

export interface SyncOptions {
  direction?: SyncDirection;
  force?: boolean; // Ignora timestamp de última sync
}

// Estado global de sync
let syncStatus: SyncStatus = 'idle';
let lastSyncAt: Date | null = null;
let syncQueue: SyncQueue | null = null;

/**
 * Inicializa o sync engine
 */
export async function initializeSyncEngine(): Promise<void> {
  syncQueue = new SyncQueue();
  
  // Carregar última sync do localStorage
  const storedLastSync = localStorage.getItem('expenseflow_last_sync');
  if (storedLastSync) {
    lastSyncAt = new Date(storedLastSync);
  }
  
  // Listener para quando voltar online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }
}

/**
 * Handler quando volta online
 */
async function handleOnline(): Promise<void> {
  console.log('[Sync] Back online, triggering sync...');
  syncStatus = 'idle';
  
  // Processar fila de operações pendentes
  if (syncQueue) {
    await syncQueue.processQueue();
  }
  
  // Trigger sync automático
  await syncAll({ direction: 'both' });
}

/**
 * Handler quando fica offline
 */
function handleOffline(): void {
  console.log('[Sync] Gone offline');
  syncStatus = 'offline';
}

/**
 * Verifica se o utilizador está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
}

/**
 * Verifica se está online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Obtém o ID do utilizador autenticado
 */
export async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Sincronização completa (push + pull)
 */
export async function syncAll(options: SyncOptions = {}): Promise<SyncResult> {
  const { direction = 'both', force = false } = options;
  
  const result: SyncResult = {
    success: false,
    pushed: { transactions: 0, categories: 0, budgets: 0 },
    pulled: { transactions: 0, categories: 0, budgets: 0 },
    conflicts: 0,
    errors: [],
  };
  
  // Verificações iniciais
  if (!isOnline()) {
    result.errors.push('Device is offline');
    syncStatus = 'offline';
    return result;
  }
  
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    result.errors.push('User not authenticated');
    return result;
  }
  
  const userId = await getUserId();
  if (!userId) {
    result.errors.push('Could not get user ID');
    return result;
  }
  
  // Evitar syncs simultâneos
  if (syncStatus === 'syncing') {
    result.errors.push('Sync already in progress');
    return result;
  }
  
  syncStatus = 'syncing';
  console.log('[Sync] Starting sync...', { direction, force });
  
  try {
    const since = force ? null : lastSyncAt;
    
    // PUSH: Local → Supabase
    if (direction === 'push' || direction === 'both') {
      try {
        const pushCatResult = await pushCategories(userId, since);
        result.pushed.categories = pushCatResult.count;
        if (pushCatResult.errors.length) {
          result.errors.push(...pushCatResult.errors);
        }
      } catch (err) {
        result.errors.push(`Push categories failed: ${err}`);
      }
      
      try {
        const pushTxResult = await pushTransactions(userId, since);
        result.pushed.transactions = pushTxResult.count;
        if (pushTxResult.errors.length) {
          result.errors.push(...pushTxResult.errors);
        }
      } catch (err) {
        result.errors.push(`Push transactions failed: ${err}`);
      }
      
      try {
        const pushBudgetResult = await pushBudgets(userId, since);
        result.pushed.budgets = pushBudgetResult.count;
        if (pushBudgetResult.errors.length) {
          result.errors.push(...pushBudgetResult.errors);
        }
      } catch (err) {
        result.errors.push(`Push budgets failed: ${err}`);
      }
    }
    
    // PULL: Supabase → Local
    if (direction === 'pull' || direction === 'both') {
      try {
        const pullCatResult = await pullCategories(userId, since);
        result.pulled.categories = pullCatResult.count;
        result.conflicts += pullCatResult.conflicts;
        if (pullCatResult.errors.length) {
          result.errors.push(...pullCatResult.errors);
        }
      } catch (err) {
        result.errors.push(`Pull categories failed: ${err}`);
      }
      
      try {
        const pullTxResult = await pullTransactions(userId, since);
        result.pulled.transactions = pullTxResult.count;
        result.conflicts += pullTxResult.conflicts;
        if (pullTxResult.errors.length) {
          result.errors.push(...pullTxResult.errors);
        }
      } catch (err) {
        result.errors.push(`Pull transactions failed: ${err}`);
      }
      
      try {
        const pullBudgetResult = await pullBudgets(userId, since);
        result.pulled.budgets = pullBudgetResult.count;
        result.conflicts += pullBudgetResult.conflicts;
        if (pullBudgetResult.errors.length) {
          result.errors.push(...pullBudgetResult.errors);
        }
      } catch (err) {
        result.errors.push(`Pull budgets failed: ${err}`);
      }
    }
    
    // Resolver conflitos pendentes
    if (result.conflicts > 0) {
      try {
        await resolveConflicts(userId);
      } catch (err) {
        result.errors.push(`Conflict resolution failed: ${err}`);
      }
    }
    
    // Atualizar timestamp de última sync
    lastSyncAt = new Date();
    localStorage.setItem('expenseflow_last_sync', lastSyncAt.toISOString());
    
    result.success = result.errors.length === 0;
    syncStatus = 'idle';
    
    console.log('[Sync] Completed', result);
    
  } catch (error) {
    syncStatus = 'error';
    result.errors.push(`Sync failed: ${error}`);
    console.error('[Sync] Failed', error);
  }
  
  return result;
}

/**
 * Push manual (só envia para cloud)
 */
export async function pushToCloud(): Promise<SyncResult> {
  return syncAll({ direction: 'push' });
}

/**
 * Pull manual (só recebe da cloud)
 */
export async function pullFromCloud(): Promise<SyncResult> {
  return syncAll({ direction: 'pull' });
}

/**
 * Força sync completo (ignora timestamps)
 */
export async function forceFullSync(): Promise<SyncResult> {
  return syncAll({ direction: 'both', force: true });
}

/**
 * Obtém o estado atual do sync
 */
export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

/**
 * Obtém a data da última sync
 */
export function getLastSyncAt(): Date | null {
  return lastSyncAt;
}

/**
 * Agenda uma operação para sync quando online
 */
export function scheduleForSync(
  operation: 'create' | 'update' | 'delete',
  table: 'transactions' | 'categories' | 'budgets',
  localId: number
): void {
  if (syncQueue) {
    syncQueue.add({ operation, table, localId, timestamp: new Date() });
  }
}

/**
 * Cleanup ao desmontar
 */
export function cleanupSyncEngine(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }
}
