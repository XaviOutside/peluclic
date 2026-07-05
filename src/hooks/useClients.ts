import { useState, useEffect, useCallback, useRef } from 'react';
import type { Client } from '@/types/client';
import { listClients, searchClients } from '@/services/client';

interface UseClientsState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

export function useClients() {
  const [state, setState] = useState<UseClientsState>({
    clients: [],
    isLoading: true,
    error: null,
    searchQuery: '',
  });
  const fetchIdRef = useRef(0);

  const fetchClients = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await listClients();
      // Only update if this is still the latest request
      if (id === fetchIdRef.current) {
        setState((prev) => ({
          ...prev,
          clients: data,
          isLoading: false,
          error: null,
        }));
      }
    } catch (err) {
      if (id === fetchIdRef.current) {
        const message =
          err instanceof Error ? err.message : 'Failed to load clients';
        setState((prev) => ({
          ...prev,
          clients: [],
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
      searchQuery: query,
    }));

    if (!query.trim()) {
      // Empty query — just list all
      try {
        const data = await listClients();
        if (id === fetchIdRef.current) {
          setState((prev) => ({
            ...prev,
            clients: data,
            isLoading: false,
            error: null,
          }));
        }
      } catch (err) {
        if (id === fetchIdRef.current) {
          const message =
            err instanceof Error ? err.message : 'Failed to load clients';
          setState((prev) => ({
            ...prev,
            clients: [],
            isLoading: false,
            error: message,
          }));
        }
      }
    } else {
      try {
        const data = await searchClients(query);
        if (id === fetchIdRef.current) {
          setState((prev) => ({
            ...prev,
            clients: data,
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
            clients: [],
            isLoading: false,
            error: message,
          }));
        }
      }
    }
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients: state.clients,
    isLoading: state.isLoading,
    error: state.error,
    searchQuery: state.searchQuery,
    fetchClients,
    search,
    setSearchQuery,
  };
}
