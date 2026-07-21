import { useState, useCallback, useEffect } from 'react';

const MODE_KEY = 'pf_demo:mode';
type StorageMode = 'demo' | 'api' | null;

interface UseStorageModeResult {
  /** Active mode or null if unresolved */
  mode: StorageMode;
  /** Persist mode to localStorage and update state */
  setMode: (mode: 'demo' | 'api') => void;
  /** True when mode has been resolved (not null) */
  isResolved: boolean;
}

function readMode(): StorageMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'demo' || stored === 'api') {
      return stored;
    }
    return null;
  } catch {
    // SecurityError (Safari private browsing) — return null gracefully
    return null;
  }
}

/** Hook for reading and updating the storage mode from localStorage key `pf_demo:mode`. */
export function useStorageMode(): UseStorageModeResult {
  const [mode, setModeState] = useState<StorageMode>(() => readMode());

  useEffect(() => {
    // Sync state if localStorage changes externally (e.g. another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === MODE_KEY) {
        setModeState(readMode());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setMode = useCallback((newMode: 'demo' | 'api') => {
    try {
      localStorage.setItem(MODE_KEY, newMode);
    } catch {
      // SecurityError (Safari private browsing) — silently fail without updating state
      return;
    }
    setModeState(newMode);
  }, []);

  return {
    mode,
    setMode,
    isResolved: mode !== null,
  };
}
