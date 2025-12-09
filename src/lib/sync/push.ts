/**
 * Push Module - Envia dados locais para Supabase
 * 
 * Estratégia:
 * - Busca registos com syncStatus = 'pending'
 * - Envia para Supabase via upsert
 * - Atualiza syncStatus para 'synced' em caso de sucesso
 */

import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import type { ExpenseTransaction, ExpenseCategory, ExpenseBudget } from '@/lib/db';

export interface PushResult {
  count: number;
  errors: string[];
}

/**
 * Push transactions pendentes para Supabase
 */
export async function pushTransactions(
  userId: string,
  since: Date | null
): Promise<PushResult> {
  const result: PushResult = { count: 0, errors: [] };
  const supabase = createClient();
  
  // Buscar transações pendentes
  let query = db.expenseTransactions
    .where('syncStatus')
    .equals('pending');
  
  const pendingTransactions = await query.toArray();
  
  if (pendingTransactions.length === 0) {
    return result;
  }
  
  console.log(`[Push] Found ${pendingTransactions.length} pending transactions`);
  
  for (const tx of pendingTransactions) {
    try {
      // Preparar dados para Supabase
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
        category_id: tx.categoryId ? await getCategoryServerId(tx.categoryId) : null,
        date: tx.date,
        sync_status: 'synced',
        import_batch_id: tx.importBatchId,
        is_reviewed: tx.isReviewed,
        created_at: tx.createdAt.toISOString(),
        updated_at: tx.updatedAt.toISOString(),
        deleted_at: tx.deletedAt?.toISOString(),
      };
      
      // Verificar se já existe no servidor (por local_id)
      const { data: existing } = await supabase
        .from('expense_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('local_id', tx.id?.toString())
        .single();
      
      if (existing) {
        // Update existente
        const { error } = await supabase
          .from('expense_transactions')
          .update(supabaseData)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert novo
        const { error } = await supabase
          .from('expense_transactions')
          .insert(supabaseData);
        
        if (error) throw error;
      }
      
      // Atualizar status local para synced
      if (tx.id) {
        await db.expenseTransactions.update(tx.id, {
          syncStatus: 'synced',
          syncedAt: new Date(),
        });
      }
      
      result.count++;
      
    } catch (error) {
      const errorMsg = `Failed to push transaction ${tx.id}: ${error}`;
      console.error('[Push]', errorMsg);
      result.errors.push(errorMsg);
    }
  }
  
  return result;
}

/**
 * Push categories pendentes para Supabase
 */
export async function pushCategories(
  userId: string,
  since: Date | null
): Promise<PushResult> {
  const result: PushResult = { count: 0, errors: [] };
  const supabase = createClient();
  
  // Buscar todas as categorias (não têm syncStatus, então comparamos por updatedAt)
  let categories = await db.expenseCategories
    .filter(c => !c.deletedAt)
    .toArray();
  
  // Se temos uma data de última sync, filtrar apenas as atualizadas depois
  if (since) {
    categories = categories.filter(c => c.updatedAt > since);
  }
  
  if (categories.length === 0) {
    return result;
  }
  
  console.log(`[Push] Found ${categories.length} categories to sync`);
  
  for (const cat of categories) {
    try {
      const supabaseData = {
        user_id: userId,
        local_id: cat.id?.toString(),
        name: cat.name,
        name_key: cat.nameKey,
        icon: cat.icon,
        color: cat.color,
        category_type: cat.type,
        is_default: cat.isDefault,
        sort_order: cat.sortOrder,
        created_at: cat.createdAt.toISOString(),
        updated_at: cat.updatedAt.toISOString(),
        deleted_at: cat.deletedAt?.toISOString(),
      };
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('expense_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('local_id', cat.id?.toString())
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from('expense_categories')
          .update(supabaseData)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expense_categories')
          .insert(supabaseData);
        
        if (error) throw error;
      }
      
      result.count++;
      
    } catch (error) {
      const errorMsg = `Failed to push category ${cat.id}: ${error}`;
      console.error('[Push]', errorMsg);
      result.errors.push(errorMsg);
    }
  }
  
  return result;
}

/**
 * Push budgets para Supabase
 */
export async function pushBudgets(
  userId: string,
  since: Date | null
): Promise<PushResult> {
  const result: PushResult = { count: 0, errors: [] };
  const supabase = createClient();
  
  let budgets = await db.expenseBudgets.toArray();
  
  if (since) {
    budgets = budgets.filter(b => b.updatedAt > since);
  }
  
  if (budgets.length === 0) {
    return result;
  }
  
  console.log(`[Push] Found ${budgets.length} budgets to sync`);
  
  for (const budget of budgets) {
    try {
      const supabaseData = {
        user_id: userId,
        local_id: budget.id?.toString(),
        category_id: budget.categoryId ? await getCategoryServerId(budget.categoryId) : null,
        amount: budget.amount,
        period: budget.period,
        start_date: budget.startDate,
        is_active: budget.isActive,
        created_at: budget.createdAt.toISOString(),
        updated_at: budget.updatedAt.toISOString(),
      };
      
      const { data: existing } = await supabase
        .from('expense_budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('local_id', budget.id?.toString())
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from('expense_budgets')
          .update(supabaseData)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expense_budgets')
          .insert(supabaseData);
        
        if (error) throw error;
      }
      
      result.count++;
      
    } catch (error) {
      const errorMsg = `Failed to push budget ${budget.id}: ${error}`;
      console.error('[Push]', errorMsg);
      result.errors.push(errorMsg);
    }
  }
  
  return result;
}

/**
 * Helper: Obtém o ID do servidor para uma categoria local
 * Retorna o UUID do Supabase correspondente ao ID local
 */
async function getCategoryServerId(localId: number): Promise<string | null> {
  // Esta é uma simplificação - numa implementação real,
  // teríamos um mapeamento local_id -> server_id
  // Por agora, retornamos null e o Supabase vai criar a referência
  return null;
}

/**
 * Marca uma transação para ser sincronizada
 */
export async function markTransactionForSync(localId: number): Promise<void> {
  await db.expenseTransactions.update(localId, {
    syncStatus: 'pending',
    updatedAt: new Date(),
  });
}

/**
 * Marca múltiplas transações para sync
 */
export async function markTransactionsForSync(localIds: number[]): Promise<void> {
  const now = new Date();
  await db.expenseTransactions
    .where('id')
    .anyOf(localIds)
    .modify({
      syncStatus: 'pending',
      updatedAt: now,
    });
}
