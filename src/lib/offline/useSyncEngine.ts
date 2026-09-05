'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDb, LocalPatient, LocalEncounter, SyncQueueItem } from './db';
import { getAuthHeaders } from '@/lib/auth/client';

export interface SyncEngineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncNow: () => Promise<number>;
  saveLocalPatient: (patient: Omit<LocalPatient, 'id' | 'syncStatus' | 'createdAt'>) => Promise<LocalPatient>;
  saveLocalEncounter: (encounter: Omit<LocalEncounter, 'id' | 'syncStatus'>) => Promise<LocalEncounter>;
}

export function useSyncEngine(): SyncEngineState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Update pending queue count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await offlineDb.syncQueue.where('status').equals('pending').count();
      setPendingCount(count);
    } catch {
      // IndexedDB might not be ready yet in SSR
    }
  }, []);

  // Main synchronization routine
  const syncNow = useCallback(async (): Promise<number> => {
    if (typeof window === 'undefined' || !navigator.onLine) {
      setSyncError('Device is currently offline. Queue saved locally.');
      return 0;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      // Get pending items
      const pendingItems = await offlineDb.syncQueue
        .where('status')
        .equals('pending')
        .limit(50)
        .toArray();

      if (pendingItems.length === 0) {
        setIsSyncing(false);
        return 0;
      }

      // Send to server /api/sync
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: getAuthHeaders('ASHA'),
        body: JSON.stringify({ items: pendingItems }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.statusText}`);
      }

      const result = await response.json();
      const syncedIds: number[] = result.syncedIds || [];

      // Update Dexie database
      for (const item of pendingItems) {
        if (item.id && syncedIds.includes(item.id)) {
          await offlineDb.syncQueue.delete(item.id);

          if (item.actionType === 'TRIAGE_ENCOUNTER') {
            await offlineDb.triageEncounters.update(item.entityId, {
              syncStatus: 'synced',
              syncedAt: new Date().toISOString(),
            });
          } else if (item.actionType === 'REGISTER_PATIENT') {
            await offlineDb.patients.update(item.entityId, {
              syncStatus: 'synced',
            });
          }
        }
      }

      setLastSyncTime(new Date());
      await refreshPendingCount();
      setIsSyncing(false);
      return syncedIds.length;
    } catch (err: any) {
      console.error('Offline Sync Error:', err);
      setSyncError(err.message || 'Auto-sync encounter error');
      setIsSyncing(false);
      return 0;
    }
  }, [refreshPendingCount]);

  // Save new patient offline & queue sync
  const saveLocalPatient = useCallback(
    async (patientData: Omit<LocalPatient, 'id' | 'syncStatus' | 'createdAt'>): Promise<LocalPatient> => {
      const newId = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newPatient: LocalPatient = {
        ...patientData,
        id: newId,
        syncStatus: 'pending_sync',
        createdAt: new Date().toISOString(),
      };

      await offlineDb.patients.put(newPatient);

      await offlineDb.syncQueue.add({
        actionType: 'REGISTER_PATIENT',
        entityId: newId,
        payload: newPatient,
        createdAt: Date.now(),
        retryCount: 0,
        status: 'pending',
      });

      await refreshPendingCount();

      // Trigger auto-sync if currently online
      if (navigator.onLine) {
        setTimeout(() => {
          syncNow();
        }, 300);
      }

      return newPatient;
    },
    [refreshPendingCount, syncNow]
  );

  // Save new clinical triage offline & queue sync
  const saveLocalEncounter = useCallback(
    async (encounterData: Omit<LocalEncounter, 'id' | 'syncStatus'>): Promise<LocalEncounter> => {
      const newId = `enc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newEncounter: LocalEncounter = {
        ...encounterData,
        id: newId,
        syncStatus: 'pending_sync',
      };

      await offlineDb.triageEncounters.put(newEncounter);

      await offlineDb.syncQueue.add({
        actionType: 'TRIAGE_ENCOUNTER',
        entityId: newId,
        payload: newEncounter,
        createdAt: Date.now(),
        retryCount: 0,
        status: 'pending',
      });

      await refreshPendingCount();

      // Trigger auto-sync if online
      if (navigator.onLine) {
        setTimeout(() => {
          syncNow();
        }, 300);
      }

      return newEncounter;
    },
    [refreshPendingCount, syncNow]
  );

  // Monitor online / offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncError(null);
      // Auto-sync immediately upon reconnection
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshPendingCount, syncNow]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    syncNow,
    saveLocalPatient,
    saveLocalEncounter,
  };
}
