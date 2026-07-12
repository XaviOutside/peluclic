import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet } from '@/types/pet';
import { listPets, searchPets } from '@/services/pet';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';

interface UsePetsState {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  clientId: number | undefined;
  totalCount: number;
  totalPages: number;
}

export function usePets(initialClientId?: number) {
  const [state, setState] = useState<UsePetsState>({
    pets: [],
    isLoading: true,
    error: null,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    clientId: initialClientId,
    totalCount: 0,
    totalPages: 0,
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
      const result = await listPets(page, DEFAULT_PAGE_SIZE, clientId);
      if (id === fetchIdRef.current) {
        setState((prev) => ({
          ...prev,
          pets: result.data,
          page: result.meta.page,
          totalCount: result.meta.total,
          totalPages: result.meta.totalPages,
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

  const search = useCallback(async (query: string) => {
    const id = ++fetchIdRef.current;
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      page: 1, // search resets page to 1
    }));

    if (!query.trim()) {
      // Empty query — revert to list with page reset
      try {
        const result = await listPets(1, DEFAULT_PAGE_SIZE, state.clientId);
        if (id === fetchIdRef.current) {
          setState((prev) => ({
            ...prev,
            pets: result.data,
            page: 1,
            totalCount: result.meta.total,
            totalPages: result.meta.totalPages,
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
    } else {
      try {
        const data = await searchPets(query);
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
            err instanceof Error ? err.message : 'Search failed';
          setState((prev) => ({
            ...prev,
            pets: [],
            isLoading: false,
            error: message,
          }));
        }
      }
    }
  }, [state.clientId]);

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

  const goToNextPage = useCallback(() => {
    if (state.page < state.totalPages) {
      goToPage(state.page + 1);
    }
  }, [state.page, state.totalPages, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (state.page > 1) {
      goToPage(state.page - 1);
    }
  }, [state.page, goToPage]);

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
    totalCount: state.totalCount,
    totalPages: state.totalPages,
    hasNextPage: state.page < state.totalPages,
    hasPreviousPage: state.page > 1,
    refresh,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setClientId,
    search,
  };
}
