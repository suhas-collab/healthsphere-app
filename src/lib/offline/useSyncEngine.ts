'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDb, LocalPatient, LocalEncounter, SyncQueueItem } from './db';
import { getAuthHeaders } from '@/lib/auth/client';
import { useToast } from '@/lib/notifications/ToastContext';

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
  const { notifyStoredLocally, notifyOffline, notifyOnline } = useToast();
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
      let syncStatus: 'synced' | 'pending_sync' = 'pending_sync';
      let entityId = newId;

      // 1. If online, attempt direct persistence to backend /api/patients
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          const res = await fetch('/api/patients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders('ASHA'),
            },
            body: JSON.stringify({
              id: newId,
              ...patientData,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.patient?.id) {
              entityId = data.patient.id;
            }
            syncStatus = 'synced';
          }
        } catch (netErr) {
          console.warn('Direct server patient save failed, queueing offline:', netErr);
        }
      }

      const newPatient: LocalPatient = {
        ...patientData,
        id: entityId,
        syncStatus,
        createdAt: new Date().toISOString(),
      };

      // 2. Persist to Dexie / IndexedDB
      await offlineDb.patients.put(newPatient);

      // 3. Notify user that data is saved locally and available offline (only AFTER successful Dexie put)
      notifyStoredLocally();

      // 4. Only queue for background sync if not already persisted to server
      if (syncStatus === 'pending_sync') {
        await offlineDb.syncQueue.add({
          actionType: 'REGISTER_PATIENT',
          entityId: newPatient.id,
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
      } else {
        await refreshPendingCount();
      }

      return newPatient;
    },
    [refreshPendingCount, syncNow, notifyStoredLocally]
  );

  // Save new clinical triage offline & queue sync
  const saveLocalEncounter = useCallback(
    async (encounterData: any): Promise<LocalEncounter> => {
      const newId = `enc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let syncStatus: 'synced' | 'pending_sync' = 'pending_sync';

      // 1. If online, attempt direct persistence to backend /api/encounters immediately
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          const res = await fetch('/api/encounters', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders('ASHA'),
            },
            body: JSON.stringify({
              id: newId,
              ...encounterData,
              status: (encounterData as any).status || 'WAITING_FOR_DOCTOR',
            }),
          });
          if (res.ok) {
            syncStatus = 'synced';
          }
        } catch (netErr) {
          console.warn('Direct server encounter save failed, queueing offline:', netErr);
        }
      }

      const newEncounter: LocalEncounter = {
        ...encounterData,
        id: newId,
        syncStatus,
      };

      // 2. Persist to Dexie / IndexedDB
      await offlineDb.triageEncounters.put(newEncounter);

      // 3. Notify user that encounter is saved locally and available offline
      notifyStoredLocally();

      // 4. If offline/pending, queue for background sync
      if (syncStatus === 'pending_sync') {
        await offlineDb.syncQueue.add({
          actionType: 'TRIAGE_ENCOUNTER',
          entityId: newId,
          payload: newEncounter,
          createdAt: Date.now(),
          retryCount: 0,
          status: 'pending',
        });

        await refreshPendingCount();

        // Trigger auto-sync if connection restored
        if (navigator.onLine) {
          setTimeout(() => {
            syncNow();
          }, 300);
        }
      } else {
        await refreshPendingCount();
      }

      return newEncounter;
    },
    [refreshPendingCount, syncNow, notifyStoredLocally]
  );

  // Monitor online / offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncError(null);
      notifyOnline();
      // Auto-sync immediately upon reconnection
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      notifyOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshPendingCount, syncNow, notifyOnline, notifyOffline]);

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
