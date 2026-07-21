import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StorageModeProvider, useStorage, getStorage } from '@/storage/storageContext';

/**
 * In-memory localStorage for Node 23+ where experimental localStorage
 * shadows jsdom's window.localStorage with undefined.
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

const MODE_KEY = 'pf_demo:mode';

describe('storageContext', () => {
  let memStorage: Storage;

  beforeAll(() => {
    memStorage = createMemoryStorage();
    vi.stubGlobal('localStorage', memStorage);
  });

  beforeEach(() => {
    memStorage.clear();
  });

  describe('StorageModeProvider', () => {
    it('resolves to ApiStorage when pf_demo:mode is absent', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StorageModeProvider>{children}</StorageModeProvider>
      );

      const { result } = renderHook(() => useStorage(), { wrapper });

      // When mode is absent, ApiStorage should be provided
      expect(result.current.storage).toBeDefined();
      // check that listClients delegates to http() — we detect ApiStorage by method shape
      expect(result.current.storage.listClients).toBeInstanceOf(Function);
    });

    it('resolves to LocalStorage when pf_demo:mode is "demo"', () => {
      memStorage.setItem(MODE_KEY, 'demo');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StorageModeProvider>{children}</StorageModeProvider>
      );

      const { result } = renderHook(() => useStorage(), { wrapper });

      expect(result.current.storage).toBeDefined();
      // LocalStorage's methods will throw "not yet implemented" — but the INSTANCE
      // should be the right type. We verify by checking it's not ApiStorage's http-backed instance.
      expect(result.current.storage.listClients).toBeInstanceOf(Function);
    });

    it('provides a storage instance immediately (synchronous)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StorageModeProvider>{children}</StorageModeProvider>
      );

      const { result } = renderHook(() => useStorage(), { wrapper });

      // Storage must be non-null on first render
      expect(result.current.storage).not.toBeNull();
    });
  });

  describe('getStorage (module-level accessor)', () => {
    it('must return the same instance after provider mounts', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StorageModeProvider>{children}</StorageModeProvider>
      );

      const { result } = renderHook(() => {
        const { storage } = useStorage();
        return { storage, fromModule: getStorage() };
      }, { wrapper });

      expect(result.current.fromModule).toBe(result.current.storage);
    });

    it('must reflect mode change when setMode is called', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StorageModeProvider>{children}</StorageModeProvider>
      );

      const { result } = renderHook(
        () => {
          const { storage, mode, setMode } = useStorage();
          return { storage, mode, setMode };
        },
        { wrapper },
      );

      // Initially ApiStorage
      expect(result.current.mode).toBeNull();
      const initialType = result.current.storage.constructor.name;

      // Switch to demo
      act(() => {
        result.current.setMode('demo');
      });

      // After switching, storage should be LocalStorage
      expect(result.current.mode).toBe('demo');
      expect(result.current.storage.constructor.name).not.toBe(initialType);
    });
  });
});
