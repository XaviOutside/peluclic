import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet } from '@/types/pet';
import { getPet } from '@/services/pet';

interface UsePetState {
  pet: Pet | null;
  isLoading: boolean;
  error: string | null;
}

export function usePet(id?: number) {
  const [state, setState] = useState<UsePetState>({
    pet: null,
    isLoading: !!id,
    error: null,
  });
  const fetchIdRef = useRef(0);

  const fetch = useCallback(async (petId: number) => {
    const currentId = ++fetchIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await getPet(petId);
      if (currentId === fetchIdRef.current) {
        setState({
          pet: data,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      if (currentId === fetchIdRef.current) {
        const message =
          err instanceof Error ? err.message : 'Failed to load pet';
        setState({
          pet: null,
          isLoading: false,
          error: message,
        });
      }
    }
  }, []);

  // Fetch when id changes or on mount
  useEffect(() => {
    if (id !== undefined && id > 0) {
      fetch(id);
    } else {
      setState({ pet: null, isLoading: false, error: null });
    }
  }, [id, fetch]);

  return {
    pet: state.pet,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetch,
  };
}
