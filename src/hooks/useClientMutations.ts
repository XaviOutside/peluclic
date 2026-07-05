import { useState, useCallback } from 'react';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { HttpError } from '@/services/http';
import {
  createClient,
  updateClient,
  deleteClient,
  reactivateClient,
  deactivateClient,
} from '@/services/client';

interface MutationState {
  isLoading: boolean;
  error: string | null;
}

interface MutationResult<T> {
  mutate: (...args: unknown[]) => Promise<T | void>;
  isLoading: boolean;
  error: string | null;
}

function useMutation<TArgs extends unknown[], TResponse>(
  fn: (...args: TArgs) => Promise<TResponse>,
): MutationResult<TResponse> & { reset: () => void } {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResponse | void> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await fn(...args);
        setState({ isLoading: false, error: null });
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        const httpErr = err as HttpError;
        setState({ isLoading: false, error: message });
        // Re-throw so callers can catch and inspect field errors
        throw httpErr;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);

  return { mutate, isLoading: state.isLoading, error: state.error, reset };
}

export function useCreateClient() {
  return useMutation<[CreateClientDto], Client>((data) => createClient(data));
}

export function useUpdateClient() {
  return useMutation<[number, UpdateClientDto], Client>((id, data) =>
    updateClient(id, data),
  );
}

export function useDeleteClient() {
  return useMutation<[number], void>((id) => deleteClient(id));
}

export function useReactivateClient() {
  return useMutation<[number], Client>((id) => reactivateClient(id));
}

export function useDeactivateClient() {
  return useMutation<[number], Client>((id) => deactivateClient(id));
}
