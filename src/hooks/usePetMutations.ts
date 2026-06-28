import { useState, useCallback } from 'react';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';
import type { HttpError } from '@/services/http';
import {
  createPet,
  updatePet,
  deletePet,
  deactivatePet,
} from '@/services/pet';

interface MutationState {
  isLoading: boolean;
  error: string | null;
}

interface MutationResult<T> {
  mutate: (...args: any[]) => Promise<T | void>;
  isLoading: boolean;
  error: string | null;
}

function useMutation<TArgs extends any[], TResponse>(
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

export function useCreatePet() {
  return useMutation<[CreatePetInput], Pet>((data) => createPet(data));
}

export function useUpdatePet() {
  return useMutation<[number, UpdatePetInput], Pet>((id, data) =>
    updatePet(id, data),
  );
}

export function useDeletePet() {
  return useMutation<[number], void>((id) => deletePet(id));
}

export function useDeactivatePet() {
  return useMutation<[number], Pet>((id) => deactivatePet(id));
}
