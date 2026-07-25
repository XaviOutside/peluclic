import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdateAppointment, useCancelAppointment } from './useAppointmentMutations';
import type { Appointment } from '@/types/appointment';

const mockAppointment: Appointment = {
  id: 1,
  petId: 10,
  petName: 'Max',
  clientId: 5,
  clientName: 'John',
  scheduledAt: '2024-01-15T10:00:00Z',
  status: 0,
  notes: 'Use gentle shampoo',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockStorage = {
  updateAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
};

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Spec §1: useUpdateAppointment ──────────────────────────────────────

describe('useUpdateAppointment', () => {
  it('updates an appointment and returns the updated data (success)', async () => {
    mockStorage.updateAppointment.mockResolvedValueOnce(mockAppointment);

    const { result } = renderHook(() => useUpdateAppointment());

    let updated: Appointment | void;
    await act(async () => {
      updated = await result.current.mutate(1, { notes: 'new notes' });
    });

    expect(updated).toEqual(mockAppointment);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles validation error (422) with error message', async () => {
    const err = new Error('Validation failed');
    (err as Record<string, unknown>).statusCode = 422;
    (err as Record<string, unknown>).fieldErrors = { scheduledAt: 'Invalid date format' };
    mockStorage.updateAppointment.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useUpdateAppointment());

    await act(async () => {
      try {
        await result.current.mutate(1, { scheduledAt: 'invalid' });
      } catch {
        // re-throw expected
      }
    });

    expect(result.current.error).toBe('Validation failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles server error (500) with error message', async () => {
    mockStorage.updateAppointment.mockRejectedValueOnce(new Error('Internal server error'));

    const { result } = renderHook(() => useUpdateAppointment());

    await act(async () => {
      try {
        await result.current.mutate(1, { notes: 'test' });
      } catch {
        // re-throw expected
      }
    });

    expect(result.current.error).toBe('Internal server error');
    expect(result.current.isLoading).toBe(false);
  });

  it('transitions isLoading true → false during a successful mutation', async () => {
    let resolvePromise!: (value: Appointment) => void;
    const deferred = new Promise<Appointment>((resolve) => {
      resolvePromise = resolve;
    });
    mockStorage.updateAppointment.mockReturnValueOnce(deferred);

    const { result } = renderHook(() => useUpdateAppointment());

    // Start the mutation — isLoading should flip to true synchronously
    act(() => {
      result.current.mutate(1, { notes: 'test' });
    });

    expect(result.current.isLoading).toBe(true);

    // Resolve the deferred — isLoading should flip to false
    await act(async () => {
      resolvePromise(mockAppointment);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('re-throws the error so callers can inspect status codes', async () => {
    const err = new Error('Conflict');
    (err as Record<string, unknown>).statusCode = 409;
    mockStorage.updateAppointment.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useUpdateAppointment());

    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.mutate(1, { notes: 'test' });
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBeDefined();
    expect((caught as Error).message).toBe('Conflict');
    expect((caught as Record<string, unknown>).statusCode).toBe(409);
  });
});

// ── Spec §2: useCancelAppointment ──────────────────────────────────────

describe('useCancelAppointment', () => {
  it('cancels an appointment successfully', async () => {
    const cancelled = { ...mockAppointment, status: 3 as const };
    mockStorage.cancelAppointment.mockResolvedValueOnce(cancelled);

    const { result } = renderHook(() => useCancelAppointment());

    await act(async () => {
      await result.current.mutate(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles not found error (404)', async () => {
    const err = new Error('Appointment not found');
    (err as Record<string, unknown>).statusCode = 404;
    mockStorage.cancelAppointment.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useCancelAppointment());

    await act(async () => {
      try {
        await result.current.mutate(999);
      } catch {
        // re-throw expected
      }
    });

    expect(result.current.error).toBe('Appointment not found');
    expect(result.current.isLoading).toBe(false);
  });
});

// ── Spec §3: Error State Reset ─────────────────────────────────────────

describe('reset', () => {
  it('clears error without triggering a new mutation', async () => {
    mockStorage.updateAppointment.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useUpdateAppointment());

    await act(async () => {
      try {
        await result.current.mutate(1, { notes: 'test' });
      } catch {
        // re-throw expected
      }
    });

    expect(result.current.error).toBe('Server error');
    expect(mockStorage.updateAppointment).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    // reset must NOT trigger another mutation
    expect(mockStorage.updateAppointment).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when called with no active error', () => {
    const { result } = renderHook(() => useUpdateAppointment());

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
