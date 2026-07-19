import { useState, useEffect, useCallback, useRef } from 'react';
import type { Client } from '@/types/client';
import { listClients, searchClients } from '@/services/client';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';

interface UseClientsState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export function useClients() {
  const [state, setState] = useState<UseClientsState>({
    clients: [],
    isLoading: true,
    error: null,
    searchQuery: '',
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  });
  const fetchIdRef = useRef(0);

  const fetchClients = useCallback(async (page = 1) => {
    const id = ++fetchIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await listClients(page, DEFAULT_PAGE_SIZE);
      // Only update if this is still the latest request
      if (id === fetchIdRef.current) {
        setState((prev) => ({
          ...prev,
          clients: result.data,
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
      page: 1, // search resets page to 1
    }));

    if (!query.trim()) {
      // Empty query — just list all with page reset
      try {
        const result = await listClients(1, DEFAULT_PAGE_SIZE);
        if (id === fetchIdRef.current) {
          setState((prev) => ({
            ...prev,
            clients: result.data,
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

  const goToPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
    fetchClients(page);
  }, [fetchClients]);

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

  /** Clear search results without making an API call (3-char gate). */
  const clearSearchResults = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      clients: [],
      searchQuery: query,
      isLoading: false,
      error: null,
    }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchClients(1);
  }, [fetchClients]);

  return {
    clients: state.clients,
    isLoading: state.isLoading,
    error: state.error,
    searchQuery: state.searchQuery,
    page: state.page,
    totalCount: state.totalCount,
    totalPages: state.totalPages,
    hasNextPage: state.page < state.totalPages,
    hasPreviousPage: state.page > 1,
    fetchClients: () => fetchClients(state.page),
    search,
    setSearchQuery,
    clearSearchResults,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  };
}
