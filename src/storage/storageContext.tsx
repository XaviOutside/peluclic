import React, { createContext, useContext, useMemo } from 'react';
import type { IStorage } from '@/storage/IStorage';
import { ApiStorage } from '@/storage/ApiStorage';
import { LocalStorage } from '@/storage/LocalStorage';
import { useStorageMode } from '@/storage/useStorageMode';

/* ---------------------------------------------------------------------- */

interface StorageContextValue {
  /** Active storage instance (ApiStorage or LocalStorage) */
  storage: IStorage;
  /** Resolved mode — null until user selects */
  mode: ReturnType<typeof useStorageMode>['mode'];
  /** Persist mode to localStorage */
  setMode: ReturnType<typeof useStorageMode>['setMode'];
}

const StorageContext = createContext<StorageContextValue | null>(null);

/* ---------------------------------------------------------------------- */

/** Module-scoped reference — set during provider mount, read by service files. */
let _currentStorage: IStorage | null = null;

/**
 * Synchronous accessor for service files.
 * Must only be called AFTER `<StorageModeProvider>` has mounted (i.e. inside
 * an event handler, effect, or hook — never at module top-level in services).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getStorage(): IStorage {
  if (!_currentStorage) {
    throw new Error(
      'getStorage() called before StorageModeProvider mounted. ' +
      'Wrap your app in <StorageModeProvider> in main.tsx.',
    );
  }
  return _currentStorage;
}

/* ---------------------------------------------------------------------- */

export interface UseStorageResult extends StorageContextValue {
  /** True when mode has been resolved (not null) */
  isResolved: boolean;
}

/** React hook — consumes the storage context. */
// eslint-disable-next-line react-refresh/only-export-components
export function useStorage(): UseStorageResult {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error('useStorage() must be used inside <StorageModeProvider>');
  }
  return { ...ctx, isResolved: ctx.mode !== null };
}

/* ---------------------------------------------------------------------- */

/**
 * Top-level provider — detects active storage mode from `pf_demo:mode`
 * and supplies the correct `IStorage` instance to the entire app.
 *
 * Place in `main.tsx`: `<StorageModeProvider><App /></StorageModeProvider>`
 */
export function StorageModeProvider({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useStorageMode();

  const storage = useMemo<IStorage>(() => {
    const instance = mode === 'demo' ? new LocalStorage() : new ApiStorage();
    _currentStorage = instance;
    return instance;
  }, [mode]);

  const value = useMemo<StorageContextValue>(
    () => ({ storage, mode, setMode }),
    [storage, mode, setMode],
  );

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}
