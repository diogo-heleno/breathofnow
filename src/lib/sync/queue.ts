/**
 * Sync Queue Module
 * 
 * Gere uma fila de operações para sincronizar quando online.
 * Persiste em localStorage para sobreviver a recarregamentos.
 */

export interface QueuedOperation {
  operation: 'create' | 'update' | 'delete';
  table: 'transactions' | 'categories' | 'budgets';
  localId: number;
  timestamp: Date;
}

const QUEUE_STORAGE_KEY = 'expenseflow_sync_queue';

export class SyncQueue {
  private queue: QueuedOperation[] = [];
  
  constructor() {
    this.loadFromStorage();
  }
  
  /**
   * Carrega a fila do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue = parsed.map((op: QueuedOperation) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        }));
      }
    } catch (error) {
      console.error('[SyncQueue] Failed to load from storage:', error);
      this.queue = [];
    }
  }
  
  /**
   * Guarda a fila no localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[SyncQueue] Failed to save to storage:', error);
    }
  }
  
  /**
   * Adiciona uma operação à fila
   */
  add(operation: QueuedOperation): void {
    // Verificar se já existe uma operação para o mesmo item
    const existingIndex = this.queue.findIndex(
      (op) => op.table === operation.table && op.localId === operation.localId
    );
    
    if (existingIndex >= 0) {
      // Se já existe uma operação, substituir ou remover conforme lógica
      const existing = this.queue[existingIndex];
      
      // Se tinha create e agora é delete, remover ambos (o item nunca chegou ao servidor)
      if (existing.operation === 'create' && operation.operation === 'delete') {
        this.queue.splice(existingIndex, 1);
        this.saveToStorage();
        return;
      }
      
      // Se tinha create/update e agora é update, manter create/update mais recente
      this.queue[existingIndex] = operation;
    } else {
      this.queue.push(operation);
    }
    
    this.saveToStorage();
    console.log('[SyncQueue] Operation added:', operation);
  }
  
  /**
   * Remove uma operação da fila
   */
  remove(table: string, localId: number): void {
    this.queue = this.queue.filter(
      (op) => !(op.table === table && op.localId === localId)
    );
    this.saveToStorage();
  }
  
  /**
   * Obtém todas as operações pendentes
   */
  getAll(): QueuedOperation[] {
    return [...this.queue];
  }
  
  /**
   * Obtém operações por tabela
   */
  getByTable(table: 'transactions' | 'categories' | 'budgets'): QueuedOperation[] {
    return this.queue.filter((op) => op.table === table);
  }
  
  /**
   * Verifica se há operações pendentes
   */
  hasPending(): boolean {
    return this.queue.length > 0;
  }
  
  /**
   * Obtém contagem de operações pendentes
   */
  count(): number {
    return this.queue.length;
  }
  
  /**
   * Limpa toda a fila
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }
  
  /**
   * Processa a fila (chamado quando volta online)
   */
  async processQueue(): Promise<{
    processed: number;
    errors: string[];
  }> {
    const result = { processed: 0, errors: [] as string[] };
    
    if (this.queue.length === 0) {
      return result;
    }
    
    console.log(`[SyncQueue] Processing ${this.queue.length} queued operations...`);
    
    // Ordenar por timestamp (mais antigos primeiro)
    const sorted = [...this.queue].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Processar por ordem: categories primeiro, depois transactions, depois budgets
    const categoriesOps = sorted.filter((op) => op.table === 'categories');
    const transactionsOps = sorted.filter((op) => op.table === 'transactions');
    const budgetsOps = sorted.filter((op) => op.table === 'budgets');
    
    // Processar cada grupo
    for (const op of [...categoriesOps, ...transactionsOps, ...budgetsOps]) {
      try {
        // A operação real é feita pelo sync engine principal
        // Aqui apenas marcamos como processada
        this.remove(op.table, op.localId);
        result.processed++;
      } catch (error) {
        result.errors.push(`Failed to process ${op.operation} on ${op.table}:${op.localId}`);
      }
    }
    
    console.log(`[SyncQueue] Processed ${result.processed} operations`);
    
    return result;
  }
  
  /**
   * Obtém estatísticas da fila
   */
  getStats(): {
    total: number;
    byTable: Record<string, number>;
    byOperation: Record<string, number>;
    oldestTimestamp: Date | null;
  } {
    const stats = {
      total: this.queue.length,
      byTable: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      oldestTimestamp: null as Date | null,
    };
    
    for (const op of this.queue) {
      stats.byTable[op.table] = (stats.byTable[op.table] || 0) + 1;
      stats.byOperation[op.operation] = (stats.byOperation[op.operation] || 0) + 1;
      
      if (!stats.oldestTimestamp || op.timestamp < stats.oldestTimestamp) {
        stats.oldestTimestamp = op.timestamp;
      }
    }
    
    return stats;
  }
}

// Singleton para uso global
let queueInstance: SyncQueue | null = null;

export function getSyncQueue(): SyncQueue {
  if (!queueInstance) {
    queueInstance = new SyncQueue();
  }
  return queueInstance;
}
