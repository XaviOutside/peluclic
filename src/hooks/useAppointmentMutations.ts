import { useState, useCallback } from 'react';
import type { Appointment, UpdateAppointmentDto } from '@/types/appointment';
import type { HttpError } from '@/services/http';
import { updateAppointment, cancelAppointment } from '@/services/appointments';

// ── Generic mutation (same pattern as useClientMutations.ts) ────────────

interface MutationState {
  isLoading: boolean;
  error: string | null;
}

interface MutationResult<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: (...args: any[]) => Promise<T | void>;
  isLoading: boolean;
  error: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ── Appointment-specific hooks ──────────────────────────────────────────

export function useUpdateAppointment() {
  return useMutation<[number, UpdateAppointmentDto], Appointment>((id, data) =>
    updateAppointment(id, data),
  );
}

export function useCancelAppointment() {
  return useMutation<[number], Appointment>((id) => cancelAppointment(id));
}
