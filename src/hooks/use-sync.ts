/**
 * useSync Hook
 * 
 * Hook React para gerir sincronização no ExpenseFlow
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  initializeSyncEngine,
  cleanupSyncEngine,
  syncAll,
  pushToCloud,
  pullFromCloud,
  forceFullSync,
  getSyncStatus,
  getLastSyncAt,
  isAuthenticated,
  isOnline,
  type SyncStatus,
  type SyncResult,
} from '@/lib/sync';
import { getConflictCount, getPendingConflicts, type Conflict } from '@/lib/sync/conflict';

interface UseSyncReturn {
  // Estado
  status: SyncStatus;
  lastSyncAt: Date | null;
  isOnline: boolean;
  isAuthenticated: boolean;
  conflictCount: number;
  pendingConflicts: Conflict[];
  
  // Ações
  sync: () => Promise<SyncResult>;
  push: () => Promise<SyncResult>;
  pull: () => Promise<SyncResult>;
  forceSync: () => Promise<SyncResult>;
  
  // Estado do último sync
  lastResult: SyncResult | null;
  error: string | null;
}

export function useSync(): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [online, setOnline] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar sync engine
  useEffect(() => {
    initializeSyncEngine();
    
    // Verificar estado inicial
    setOnline(isOnline());
    setLastSyncAt(getLastSyncAt());
    
    // Verificar autenticação
    isAuthenticated().then(setAuthenticated);
    
    // Verificar conflitos
    getConflictCount().then(setConflictCount);
    setPendingConflicts(getPendingConflicts());
    
    // Listeners para mudanças de conectividade
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      cleanupSyncEngine();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Atualizar estado periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getSyncStatus());
      setLastSyncAt(getLastSyncAt());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Sync completo
  const sync = useCallback(async (): Promise<SyncResult> => {
    setError(null);
    setStatus('syncing');
    
    try {
      const result = await syncAll();
      setLastResult(result);
      setStatus(result.success ? 'idle' : 'error');
      setLastSyncAt(getLastSyncAt());
      
      // Atualizar conflitos
      const conflicts = await getConflictCount();
      setConflictCount(conflicts);
      setPendingConflicts(getPendingConflicts());
      
      if (!result.success && result.errors.length > 0) {
        setError(result.errors[0]);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMsg);
      setStatus('error');
      throw err;
    }
  }, []);
  
  // Push apenas
  const push = useCallback(async (): Promise<SyncResult> => {
    setError(null);
    setStatus('syncing');
    
    try {
      const result = await pushToCloud();
      setLastResult(result);
      setStatus(result.success ? 'idle' : 'error');
      setLastSyncAt(getLastSyncAt());
      
      if (!result.success && result.errors.length > 0) {
        setError(result.errors[0]);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Push failed';
      setError(errorMsg);
      setStatus('error');
      throw err;
    }
  }, []);
  
  // Pull apenas
  const pull = useCallback(async (): Promise<SyncResult> => {
    setError(null);
    setStatus('syncing');
    
    try {
      const result = await pullFromCloud();
      setLastResult(result);
      setStatus(result.success ? 'idle' : 'error');
      setLastSyncAt(getLastSyncAt());
      
      // Atualizar conflitos
      const conflicts = await getConflictCount();
      setConflictCount(conflicts);
      setPendingConflicts(getPendingConflicts());
      
      if (!result.success && result.errors.length > 0) {
        setError(result.errors[0]);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Pull failed';
      setError(errorMsg);
      setStatus('error');
      throw err;
    }
  }, []);
  
  // Força sync completo
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    setError(null);
    setStatus('syncing');
    
    try {
      const result = await forceFullSync();
      setLastResult(result);
      setStatus(result.success ? 'idle' : 'error');
      setLastSyncAt(getLastSyncAt());
      
      // Atualizar conflitos
      const conflicts = await getConflictCount();
      setConflictCount(conflicts);
      setPendingConflicts(getPendingConflicts());
      
      if (!result.success && result.errors.length > 0) {
        setError(result.errors[0]);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Force sync failed';
      setError(errorMsg);
      setStatus('error');
      throw err;
    }
  }, []);
  
  return {
    status,
    lastSyncAt,
    isOnline: online,
    isAuthenticated: authenticated,
    conflictCount,
    pendingConflicts,
    sync,
    push,
    pull,
    forceSync,
    lastResult,
    error,
  };
}

/**
 * Hook para auto-sync periódico
 */
export function useAutoSync(intervalMinutes: number = 5): void {
  const { sync, isOnline, isAuthenticated } = useSync();
  
  useEffect(() => {
    if (!isOnline || !isAuthenticated) {
      return;
    }
    
    const interval = setInterval(() => {
      console.log('[AutoSync] Triggering periodic sync...');
      sync().catch(console.error);
    }, intervalMinutes * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sync, isOnline, isAuthenticated, intervalMinutes]);
}

/**
 * Hook para sync ao fazer login
 */
export function useSyncOnLogin(): void {
  const { pull, isAuthenticated } = useSync();
  const [hasInitialSync, setHasInitialSync] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated && !hasInitialSync) {
      console.log('[SyncOnLogin] User authenticated, pulling data...');
      pull()
        .then(() => setHasInitialSync(true))
        .catch(console.error);
    }
  }, [isAuthenticated, hasInitialSync, pull]);
}
