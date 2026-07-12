import { useState, useEffect, useCallback, useRef } from 'react';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import {
  listServices,
  getService,
  createService as apiCreate,
  updateService as apiUpdate,
  deactivateService as apiDeactivate,
  deleteService as apiDelete,
  searchServices,
} from '@/services/service';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';

interface UseServicesState {
  services: Service[];
  service: Service | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEBOUNCE_MS = 300;

export interface UseServicesOptions {
  /** Filter services linked to this pet */
  petId?: number;
}

export function useServices(options: UseServicesOptions = {}) {
  const { petId } = options;

  const [state, setState] = useState<UseServicesState>({
    services: [],
    service: null,
    isLoading: true,
    error: null,
    page: DEFAULT_PAGE,
    limit: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  });
  const fetchIdRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(async (page: number, limit: number) => {
    const id = ++fetchIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await listServices(page, limit, petId);
      if (id === fetchIdRef.current) {
        setState((prev) => ({
          ...prev,
          services: result.data,
          page: result.meta.page,
          totalCount: result.meta.total,
          totalPages: result.meta.totalPages,
          isLoading: false,
          error: null,
        }));
      }
    } catch (err) {
      if (id === fetchIdRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load services';
        setState((prev) => ({
          ...prev,
          services: [],
          isLoading: false,
          error: message,
        }));
      }
    }
  }, [petId]);

  const refresh = useCallback(() => {
    fetchList(state.page, state.limit);
  }, [fetchList, state.page, state.limit]);

  const goToPage = useCallback(
    (n: number) => {
      setState((prev) => ({ ...prev, page: n }));
      fetchList(n, state.limit);
    },
    [fetchList, state.limit],
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

  const search = useCallback(
    (query: string) => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      if (!query.trim()) {
        // Revert to list view, reset page to 1
        fetchList(1, DEFAULT_PAGE_SIZE);
        return;
      }

      searchTimerRef.current = setTimeout(async () => {
        const id = ++fetchIdRef.current;
        setState((prev) => ({ ...prev, isLoading: true, error: null, page: 1 }));

        try {
          const data = await searchServices(query);
          if (id === fetchIdRef.current) {
            setState((prev) => ({
              ...prev,
              services: data,
              isLoading: false,
              error: null,
            }));
          }
        } catch (err) {
          if (id === fetchIdRef.current) {
            const message = err instanceof Error ? err.message : 'Search failed';
            setState((prev) => ({
              ...prev,
              services: [],
              isLoading: false,
              error: message,
            }));
          }
        }
      }, DEBOUNCE_MS);
    },
    [fetchList],
  );

  const fetchService = useCallback(async (id: number) => {
    const fetchId = ++fetchIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await getService(id);
      if (fetchId === fetchIdRef.current) {
        setState((prev) => ({
          ...prev,
          service: data,
          isLoading: false,
          error: null,
        }));
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load service';
        setState((prev) => ({
          ...prev,
          service: null,
          isLoading: false,
          error: message,
        }));
      }
    }
  }, []);

  const handleCreateService = useCallback(
    async (input: CreateServiceInput): Promise<Service | void> => {
      try {
        const created = await apiCreate(input);
        // Optimistic update: add to local list
        setState((prev) => ({
          ...prev,
          services: [...prev.services, created],
        }));
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create service';
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [],
  );

  const handleUpdateService = useCallback(
    async (id: number, input: UpdateServiceInput): Promise<Service | void> => {
      try {
        const updated = await apiUpdate(id, input);
        // Update local state
        setState((prev) => ({
          ...prev,
          services: prev.services.map((s) => (s.id === id ? updated : s)),
          service: prev.service?.id === id ? updated : prev.service,
        }));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update service';
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [],
  );

  const handleDeactivateService = useCallback(
    async (id: number): Promise<Service | void> => {
      try {
        const deactivated = await apiDeactivate(id);
        setState((prev) => ({
          ...prev,
          services: prev.services.map((s) => (s.id === id ? deactivated : s)),
          service: prev.service?.id === id ? deactivated : prev.service,
        }));
        return deactivated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to deactivate service';
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [],
  );

  const handleDeleteService = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiDelete(id);
        // Remove from local state
        setState((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== id),
          service: prev.service?.id === id ? null : prev.service,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete service';
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [],
  );

  // Auto-fetch on mount
  useEffect(() => {
    fetchList(DEFAULT_PAGE, DEFAULT_PAGE_SIZE);
  }, [fetchList]);

  return {
    services: state.services,
    service: state.service,
    isLoading: state.isLoading,
    error: state.error,
    page: state.page,
    limit: state.limit,
    totalCount: state.totalCount,
    totalPages: state.totalPages,
    hasNextPage: state.page < state.totalPages,
    hasPreviousPage: state.page > 1,
    search,
    fetchService,
    refresh,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    createService: handleCreateService,
    updateService: handleUpdateService,
    deactivateService: handleDeactivateService,
    deleteService: handleDeleteService,
  };
}
