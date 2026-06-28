import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet } from '@/types/pet';
import { listPets } from '@/services/pet';

interface UsePetsState {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  clientId: number | undefined;
}

export function usePets(initialClientId?: number) {
  const [state, setState] = useState<UsePetsState>({
    pets: [],
    isLoading: true,
    error: null,
    page: 1,
    limit: 20,
    clientId: initialClientId,
  });
  const fetchIdRef = useRef(0);

  const fetchPets = useCallback(async (page: number, clientId?: number) => {
    const id = ++fetchIdRef.current;
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await listPets(page, 20, clientId);
      if (id === fetchIdRef.current) {
        setState((prev) => ({
          ...prev,
          pets: data,
          isLoading: false,
          error: null,
        }));
      }
    } catch (err) {
      if (id === fetchIdRef.current) {
        const message =
          err instanceof Error ? err.message : 'Failed to load pets';
        setState((prev) => ({
          ...prev,
          pets: [],
          isLoading: false,
          error: message,
        }));
      }
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPets(state.page, state.clientId);
  }, [fetchPets, state.page, state.clientId]);

  const goToPage = useCallback(
    (n: number) => {
      setState((prev) => ({ ...prev, page: n }));
      fetchPets(n, state.clientId);
    },
    [fetchPets, state.clientId],
  );

  const setClientId = useCallback(
    (id: number | undefined) => {
      setState((prev) => ({ ...prev, clientId: id, page: 1 }));
      fetchPets(1, id);
    },
    [fetchPets],
  );

  // Auto-fetch on mount
  useEffect(() => {
    fetchPets(1, initialClientId);
  }, [fetchPets, initialClientId]);

  return {
    pets: state.pets,
    isLoading: state.isLoading,
    error: state.error,
    page: state.page,
    limit: state.limit,
    clientId: state.clientId,
    refresh,
    goToPage,
    setClientId,
  };
}
