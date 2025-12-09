/**
 * Conflict Resolution Module
 * 
 * Estratégias de resolução:
 * 1. Last-Write-Wins (automático) - padrão
 * 2. Manual - marca para revisão do utilizador
 * 
 * Conflitos ocorrem quando:
 * - Local foi modificado (syncStatus = 'pending')
 * - E servidor também foi modificado depois da última sync
 */

import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import type { ExpenseTransaction } from '@/lib/db';

export type ConflictResolutionStrategy = 'local-wins' | 'server-wins' | 'manual';

export interface Conflict {
  id: number;
  localData: ExpenseTransaction;
  serverData: ServerTransaction;
  detectedAt: Date;
}

interface ServerTransaction {
  id: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  description?: string;
  date: string;
  updated_at: string;
}

// Cache de conflitos para resolução manual
const pendingConflicts: Map<number, Conflict> = new Map();

/**
 * Resolve todos os conflitos pendentes com estratégia last-write-wins
 */
export async function resolveConflicts(userId: string): Promise<number> {
  const conflictTransactions = await db.expenseTransactions
    .where('syncStatus')
    .equals('conflict')
    .toArray();
  
  if (conflictTransactions.length === 0) {
    return 0;
  }
  
  console.log(`[Conflict] Found ${conflictTransactions.length} conflicts to resolve`);
  
  let resolved = 0;
  
  for (const tx of conflictTransactions) {
    try {
      // Por padrão, usamos last-write-wins (local ganha se foi modificado mais recentemente)
      await resolveConflict(tx.id!, 'local-wins');
      resolved++;
    } catch (error) {
      console.error(`[Conflict] Failed to resolve conflict for ${tx.id}:`, error);
    }
  }
  
  return resolved;
}

/**
 * Resolve um conflito específico
 */
export async function resolveConflict(
  localId: number,
  strategy: ConflictResolutionStrategy
): Promise<void> {
  const localTx = await db.expenseTransactions.get(localId);
  
  if (!localTx || localTx.syncStatus !== 'conflict') {
    throw new Error('Transaction not found or not in conflict state');
  }
  
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  switch (strategy) {
    case 'local-wins':
      // Enviar versão local para o servidor
      await pushLocalToServer(localTx, userId);
      await db.expenseTransactions.update(localId, {
        syncStatus: 'synced',
        syncedAt: new Date(),
      });
      break;
      
    case 'server-wins':
      // Buscar versão do servidor e aplicar localmente
      await pullServerToLocal(localTx, userId);
      break;
      
    case 'manual':
      // Guardar na cache para resolução manual pelo utilizador
      const serverData = await getServerVersion(localTx, userId);
      if (serverData) {
        pendingConflicts.set(localId, {
          id: localId,
          localData: localTx,
          serverData,
          detectedAt: new Date(),
        });
      }
      break;
  }
  
  // Remover da cache de conflitos pendentes
  pendingConflicts.delete(localId);
}

/**
 * Push versão local para o servidor (local ganha)
 */
async function pushLocalToServer(tx: ExpenseTransaction, userId: string): Promise<void> {
  const supabase = createClient();
  
  const supabaseData = {
    user_id: userId,
    local_id: tx.id?.toString(),
    amount: tx.amount,
    currency: tx.currency,
    amount_in_base: tx.amountInBase,
    exchange_rate: tx.exchangeRate,
    transaction_type: tx.type,
    description: tx.description,
    notes: tx.notes,
    date: tx.date,
    sync_status: 'synced',
    is_reviewed: tx.isReviewed,
    updated_at: new Date().toISOString(),
    deleted_at: tx.deletedAt?.toISOString(),
  };
  
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('expense_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('local_id', tx.id?.toString())
    .single();
  
  if (existing) {
    const { error } = await supabase
      .from('expense_transactions')
      .update(supabaseData)
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('expense_transactions')
      .insert(supabaseData);
    
    if (error) throw error;
  }
}

/**
 * Pull versão do servidor para local (servidor ganha)
 */
async function pullServerToLocal(tx: ExpenseTransaction, userId: string): Promise<void> {
  const serverData = await getServerVersion(tx, userId);
  
  if (!serverData || !tx.id) {
    throw new Error('Could not get server version');
  }
  
  await db.expenseTransactions.update(tx.id, {
    amount: serverData.amount,
    currency: serverData.currency,
    type: serverData.type,
    description: serverData.description,
    date: serverData.date,
    syncStatus: 'synced',
    updatedAt: new Date(serverData.updated_at),
    syncedAt: new Date(),
  });
}

/**
 * Obtém a versão do servidor para uma transação
 */
async function getServerVersion(
  tx: ExpenseTransaction,
  userId: string
): Promise<ServerTransaction | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('expense_transactions')
    .select('id, amount, currency, transaction_type, description, date, updated_at')
    .eq('user_id', userId)
    .eq('local_id', tx.id?.toString())
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    amount: parseFloat(data.amount),
    currency: data.currency,
    type: data.transaction_type as 'income' | 'expense',
    description: data.description,
    date: data.date,
    updated_at: data.updated_at,
  };
}

/**
 * Obtém lista de conflitos pendentes para resolução manual
 */
export function getPendingConflicts(): Conflict[] {
  return Array.from(pendingConflicts.values());
}

/**
 * Verifica se há conflitos pendentes
 */
export function hasConflicts(): boolean {
  return pendingConflicts.size > 0;
}

/**
 * Obtém contagem de conflitos
 */
export async function getConflictCount(): Promise<number> {
  return db.expenseTransactions
    .where('syncStatus')
    .equals('conflict')
    .count();
}

/**
 * Resolve conflito escolhendo versão local
 */
export async function keepLocalVersion(localId: number): Promise<void> {
  await resolveConflict(localId, 'local-wins');
}

/**
 * Resolve conflito escolhendo versão do servidor
 */
export async function keepServerVersion(localId: number): Promise<void> {
  await resolveConflict(localId, 'server-wins');
}

/**
 * Merge manual - permite ao utilizador escolher campos específicos
 */
export async function mergeVersions(
  localId: number,
  mergedData: Partial<ExpenseTransaction>
): Promise<void> {
  const localTx = await db.expenseTransactions.get(localId);
  
  if (!localTx || localTx.syncStatus !== 'conflict') {
    throw new Error('Transaction not found or not in conflict state');
  }
  
  // Atualizar localmente com dados merged
  await db.expenseTransactions.update(localId, {
    ...mergedData,
    syncStatus: 'pending', // Vai ser enviado para o servidor
    updatedAt: new Date(),
  });
  
  // Remover da cache
  pendingConflicts.delete(localId);
}
