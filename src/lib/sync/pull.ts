/**
 * Pull Module - Recebe dados do Supabase para IndexedDB local
 * 
 * Estratégia:
 * - Busca registos do servidor atualizados desde última sync
 * - Compara com dados locais para detectar conflitos
 * - Aplica atualizações ou marca para resolução manual
 */

import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import type { ExpenseTransaction, ExpenseCategory, ExpenseBudget } from '@/lib/db';

export interface PullResult {
  count: number;
  conflicts: number;
  errors: string[];
}

/**
 * Pull transactions do Supabase para local
 */
export async function pullTransactions(
  userId: string,
  since: Date | null
): Promise<PullResult> {
  const result: PullResult = { count: 0, conflicts: 0, errors: [] };
  const supabase = createClient();
  
  try {
    // Buscar transações do servidor
    let query = supabase
      .from('expense_transactions')
      .select('*')
      .eq('user_id', userId);
    
    if (since) {
      query = query.gt('updated_at', since.toISOString());
    }
    
    const { data: serverTransactions, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!serverTransactions || serverTransactions.length === 0) {
      return result;
    }
    
    console.log(`[Pull] Found ${serverTransactions.length} transactions from server`);
    
    for (const serverTx of serverTransactions) {
      try {
        // Verificar se existe localmente (por local_id ou por server_id)
        let localTx: ExpenseTransaction | undefined;
        
        if (serverTx.local_id) {
          localTx = await db.expenseTransactions.get(parseInt(serverTx.local_id));
        }
        
        if (!localTx) {
          // Não existe localmente - criar novo
          const newTx: Omit<ExpenseTransaction, 'id'> = {
            amount: parseFloat(serverTx.amount),
            currency: serverTx.currency,
            amountInBase: serverTx.amount_in_base ? parseFloat(serverTx.amount_in_base) : undefined,
            exchangeRate: serverTx.exchange_rate ? parseFloat(serverTx.exchange_rate) : undefined,
            type: serverTx.transaction_type as 'income' | 'expense',
            description: serverTx.description,
            notes: serverTx.notes,
            categoryId: serverTx.category_id ? await getLocalCategoryId(serverTx.category_id, userId) : undefined,
            date: serverTx.date,
            syncStatus: 'synced',
            importBatchId: serverTx.import_batch_id,
            isReviewed: serverTx.is_reviewed ?? true,
            createdAt: new Date(serverTx.created_at),
            updatedAt: new Date(serverTx.updated_at),
            syncedAt: new Date(),
            deletedAt: serverTx.deleted_at ? new Date(serverTx.deleted_at) : undefined,
          };
          
          await db.expenseTransactions.add(newTx as ExpenseTransaction);
          result.count++;
          
        } else {
          // Existe localmente - verificar conflito
          const serverUpdatedAt = new Date(serverTx.updated_at);
          const localUpdatedAt = localTx.updatedAt;
          
          // Se o local foi modificado depois do servidor e ainda está pendente, há conflito
          if (localTx.syncStatus === 'pending' && localUpdatedAt > serverUpdatedAt) {
            // Marcar como conflito para resolução manual
            if (localTx.id) {
              await db.expenseTransactions.update(localTx.id, {
                syncStatus: 'conflict',
              });
            }
            result.conflicts++;
            
          } else {
            // Servidor é mais recente ou local já está synced - aplicar do servidor
            if (localTx.id) {
              await db.expenseTransactions.update(localTx.id, {
                amount: parseFloat(serverTx.amount),
                currency: serverTx.currency,
                amountInBase: serverTx.amount_in_base ? parseFloat(serverTx.amount_in_base) : undefined,
                exchangeRate: serverTx.exchange_rate ? parseFloat(serverTx.exchange_rate) : undefined,
                type: serverTx.transaction_type as 'income' | 'expense',
                description: serverTx.description,
                notes: serverTx.notes,
                categoryId: serverTx.category_id ? await getLocalCategoryId(serverTx.category_id, userId) : undefined,
                date: serverTx.date,
                syncStatus: 'synced',
                isReviewed: serverTx.is_reviewed ?? true,
                updatedAt: new Date(serverTx.updated_at),
                syncedAt: new Date(),
                deletedAt: serverTx.deleted_at ? new Date(serverTx.deleted_at) : undefined,
              });
            }
            result.count++;
          }
        }
        
      } catch (error) {
        const errorMsg = `Failed to pull transaction ${serverTx.id}: ${error}`;
        console.error('[Pull]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
    
  } catch (error) {
    result.errors.push(`Pull transactions failed: ${error}`);
  }
  
  return result;
}

/**
 * Pull categories do Supabase para local
 */
export async function pullCategories(
  userId: string,
  since: Date | null
): Promise<PullResult> {
  const result: PullResult = { count: 0, conflicts: 0, errors: [] };
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', userId);
    
    if (since) {
      query = query.gt('updated_at', since.toISOString());
    }
    
    const { data: serverCategories, error } = await query;
    
    if (error) throw error;
    
    if (!serverCategories || serverCategories.length === 0) {
      return result;
    }
    
    console.log(`[Pull] Found ${serverCategories.length} categories from server`);
    
    for (const serverCat of serverCategories) {
      try {
        let localCat: ExpenseCategory | undefined;
        
        if (serverCat.local_id) {
          localCat = await db.expenseCategories.get(parseInt(serverCat.local_id));
        }
        
        if (!localCat) {
          // Criar nova categoria local
          const newCat: Omit<ExpenseCategory, 'id'> = {
            name: serverCat.name,
            nameKey: serverCat.name_key,
            icon: serverCat.icon,
            color: serverCat.color,
            type: serverCat.category_type as 'income' | 'expense' | 'both',
            isDefault: serverCat.is_default,
            sortOrder: serverCat.sort_order,
            createdAt: new Date(serverCat.created_at),
            updatedAt: new Date(serverCat.updated_at),
            deletedAt: serverCat.deleted_at ? new Date(serverCat.deleted_at) : undefined,
          };
          
          await db.expenseCategories.add(newCat as ExpenseCategory);
          result.count++;
          
        } else {
          // Atualizar categoria existente
          // Categorias normalmente não têm conflitos - servidor ganha
          if (localCat.id) {
            await db.expenseCategories.update(localCat.id, {
              name: serverCat.name,
              nameKey: serverCat.name_key,
              icon: serverCat.icon,
              color: serverCat.color,
              type: serverCat.category_type as 'income' | 'expense' | 'both',
              isDefault: serverCat.is_default,
              sortOrder: serverCat.sort_order,
              updatedAt: new Date(serverCat.updated_at),
              deletedAt: serverCat.deleted_at ? new Date(serverCat.deleted_at) : undefined,
            });
          }
          result.count++;
        }
        
      } catch (error) {
        const errorMsg = `Failed to pull category ${serverCat.id}: ${error}`;
        console.error('[Pull]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
    
  } catch (error) {
    result.errors.push(`Pull categories failed: ${error}`);
  }
  
  return result;
}

/**
 * Pull budgets do Supabase para local
 */
export async function pullBudgets(
  userId: string,
  since: Date | null
): Promise<PullResult> {
  const result: PullResult = { count: 0, conflicts: 0, errors: [] };
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('expense_budgets')
      .select('*')
      .eq('user_id', userId);
    
    if (since) {
      query = query.gt('updated_at', since.toISOString());
    }
    
    const { data: serverBudgets, error } = await query;
    
    if (error) throw error;
    
    if (!serverBudgets || serverBudgets.length === 0) {
      return result;
    }
    
    console.log(`[Pull] Found ${serverBudgets.length} budgets from server`);
    
    for (const serverBudget of serverBudgets) {
      try {
        let localBudget: ExpenseBudget | undefined;
        
        if (serverBudget.local_id) {
          localBudget = await db.expenseBudgets.get(parseInt(serverBudget.local_id));
        }
        
        if (!localBudget) {
          const newBudget: Omit<ExpenseBudget, 'id'> = {
            categoryId: serverBudget.category_id ? await getLocalCategoryId(serverBudget.category_id, userId) : undefined,
            amount: parseFloat(serverBudget.amount),
            period: serverBudget.period as 'monthly' | 'yearly',
            startDate: serverBudget.start_date,
            isActive: serverBudget.is_active,
            createdAt: new Date(serverBudget.created_at),
            updatedAt: new Date(serverBudget.updated_at),
          };
          
          await db.expenseBudgets.add(newBudget as ExpenseBudget);
          result.count++;
          
        } else {
          if (localBudget.id) {
            await db.expenseBudgets.update(localBudget.id, {
              categoryId: serverBudget.category_id ? await getLocalCategoryId(serverBudget.category_id, userId) : undefined,
              amount: parseFloat(serverBudget.amount),
              period: serverBudget.period as 'monthly' | 'yearly',
              startDate: serverBudget.start_date,
              isActive: serverBudget.is_active,
              updatedAt: new Date(serverBudget.updated_at),
            });
          }
          result.count++;
        }
        
      } catch (error) {
        const errorMsg = `Failed to pull budget ${serverBudget.id}: ${error}`;
        console.error('[Pull]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
    
  } catch (error) {
    result.errors.push(`Pull budgets failed: ${error}`);
  }
  
  return result;
}

/**
 * Helper: Obtém o ID local de uma categoria a partir do ID do servidor
 */
async function getLocalCategoryId(serverId: string, userId: string): Promise<number | undefined> {
  // Tentar encontrar por uma categoria que tenha sido sincronizada com este ID
  // Numa implementação completa, teríamos um mapeamento server_id -> local_id
  // Por agora, retornamos undefined (a categoria será undefined na transação)
  
  // Alternativa: buscar a categoria no Supabase e encontrar pelo local_id
  const supabase = createClient();
  const { data } = await supabase
    .from('expense_categories')
    .select('local_id')
    .eq('id', serverId)
    .single();
  
  if (data?.local_id) {
    return parseInt(data.local_id);
  }
  
  return undefined;
}

/**
 * Pull inicial completo (para novo login)
 */
export async function pullInitial(userId: string): Promise<{
  transactions: number;
  categories: number;
  budgets: number;
  errors: string[];
}> {
  const errors: string[] = [];
  
  // Pull sem filtro de data (tudo)
  const catResult = await pullCategories(userId, null);
  errors.push(...catResult.errors);
  
  const txResult = await pullTransactions(userId, null);
  errors.push(...txResult.errors);
  
  const budgetResult = await pullBudgets(userId, null);
  errors.push(...budgetResult.errors);
  
  return {
    transactions: txResult.count,
    categories: catResult.count,
    budgets: budgetResult.count,
    errors,
  };
}
