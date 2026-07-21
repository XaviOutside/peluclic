import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStorageMode } from '@/storage/useStorageMode';

const MODE_KEY = 'pf_demo:mode';

/**
 * In-memory localStorage implementation.
 * Node.js 23+ shadows jsdom's window.localStorage with an undefined global,
 * so we create our own and stub it for the test process.
 */
function createMemoryStorage(): Storage {
  let store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store = new Map(); },
    get length() { return store.size; },
    key: (index: number) => {
      const keys = [...store.keys()];
      return keys[index] ?? null;
    },
  };
}

describe('useStorageMode', () => {
  let memStorage: Storage;

  beforeAll(() => {
    memStorage = createMemoryStorage();
    vi.stubGlobal('localStorage', memStorage);
  });

  beforeEach(() => {
    memStorage.clear();
  });

  describe('initial state (mode absent)', () => {
    it('must return mode=null and isResolved=false when pf_demo:mode is absent', () => {
      const { result } = renderHook(() => useStorageMode());

      expect(result.current.mode).toBeNull();
      expect(result.current.isResolved).toBe(false);
    });
  });

  describe('existing mode', () => {
    it('must return mode="demo" and isResolved=true when pf_demo:mode is "demo"', () => {
      memStorage.setItem(MODE_KEY, 'demo');

      const { result } = renderHook(() => useStorageMode());

      expect(result.current.mode).toBe('demo');
      expect(result.current.isResolved).toBe(true);
    });
  });

  describe('setMode', () => {
    it('setMode("demo") persists to localStorage and updates mode', () => {
      const { result } = renderHook(() => useStorageMode());

      act(() => {
        result.current.setMode('demo');
      });

      expect(memStorage.getItem(MODE_KEY)).toBe('demo');
      expect(result.current.mode).toBe('demo');
      expect(result.current.isResolved).toBe(true);
    });

    it('setMode is stable across renders (same reference)', () => {
      const { result, rerender } = renderHook(() => useStorageMode());
      const firstSetMode = result.current.setMode;

      rerender();
      expect(result.current.setMode).toBe(firstSetMode);
    });
  });

  describe('persistence on remount', () => {
    it('subsequent mount reads persisted "demo" mode', () => {
      // First mount sets mode
      const { result: first, unmount } = renderHook(() => useStorageMode());
      act(() => {
        first.current.setMode('demo');
      });
      unmount();

      // Second mount reads from localStorage
      const { result: second } = renderHook(() => useStorageMode());
      expect(second.current.mode).toBe('demo');
      expect(second.current.isResolved).toBe(true);
    });
  });

  describe('SecurityError fallback', () => {
    it('setMode catches SecurityError and does not crash', () => {
      const { result } = renderHook(() => useStorageMode());

      // Simulate localStorage.setItem throwing SecurityError
      const setItemSpy = vi.spyOn(memStorage, 'setItem');
      setItemSpy.mockImplementationOnce(() => {
        throw new DOMException('Blocked', 'SecurityError');
      });

      // Should not throw
      act(() => {
        result.current.setMode('demo');
      });

      // mode stays null because persistence failed
      expect(result.current.mode).toBeNull();

      setItemSpy.mockRestore();
    });

    it('useStorageMode reads mode as null when localStorage.getItem throws', () => {
      const getItemSpy = vi.spyOn(memStorage, 'getItem');
      getItemSpy.mockImplementationOnce(() => {
        throw new DOMException('Blocked', 'SecurityError');
      });

      const { result } = renderHook(() => useStorageMode());
      expect(result.current.mode).toBeNull();
      expect(result.current.isResolved).toBe(false);

      getItemSpy.mockRestore();
    });
  });
});
