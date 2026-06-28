import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useServices } from './useServices';
import * as serviceApi from '@/services/service';
import type { Service } from '@/types/service';

const mockService: Service = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming',
  durationMinutes: 60,
  price: 50.00,
  petId: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockService2: Service = {
  ...mockService,
  id: 2,
  name: 'Nail Trim',
  price: 15.00,
  durationMinutes: 30,
};

// Mock all API functions
vi.mock('@/services/service');

const mockedApi = vi.mocked(serviceApi);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: list returns 2 services
  (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValue([mockService, mockService2]);
});

describe('useServices', () => {
  describe('initial fetch', () => {
    it('loads services on mount', async () => {
      const { result } = renderHook(() => useServices());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.services).toEqual([mockService, mockService2]);
      expect(result.current.error).toBeNull();
    });

    it('sets error state on fetch failure', async () => {
      (mockedApi.listServices as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useServices());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.services).toEqual([]);
    });
  });

  describe('createService', () => {
    it('creates a service and updates local state', async () => {
      (mockedApi.createService as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockService,
        id: 3,
        name: 'New Service',
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.createService({ name: 'New Service', price: 30 });
      });

      expect(mockedApi.createService).toHaveBeenCalledWith({ name: 'New Service', price: 30 });

      // New service should be in the local state
      await waitFor(() => {
        expect(result.current.services).toContainEqual(
          expect.objectContaining({ id: 3, name: 'New Service' }),
        );
      });
    });
  });

  describe('updateService', () => {
    it('updates a service and refreshes local state', async () => {
      (mockedApi.updateService as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockService,
        name: 'Updated',
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateService(1, { name: 'Updated' });
      });

      // After update, state should reflect the change
      await waitFor(() => {
        const updated = result.current.services.find((s) => s.id === 1);
        expect(updated?.name).toBe('Updated');
      });
    });
  });

  describe('deactivateService', () => {
    it('deactivates and refreshes local state', async () => {
      (mockedApi.deactivateService as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockService,
        status: 'inactive',
      });

      const { result } = renderHook(() => useServices());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deactivateService(1);
      });

      await waitFor(() => {
        const deactivated = result.current.services.find((s) => s.id === 1);
        expect(deactivated?.status).toBe('inactive');
      });
    });
  });

  describe('deleteService', () => {
    it('deletes and refreshes local state', async () => {
      (mockedApi.deleteService as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useServices());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deleteService(1);
      });

      await waitFor(() => {
        expect(result.current.services.find((s) => s.id === 1)).toBeUndefined();
      });
    });
  });

  describe('petId filtering', () => {
    it('passes petId to listServices when provided', async () => {
      (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockService]);

      const { result } = renderHook(() => useServices({ petId: 5 }));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockedApi.listServices).toHaveBeenCalledWith(1, 20, 5);
    });

    it('calls listServices without petId when not provided', async () => {
      (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockService, mockService2]);

      const { result } = renderHook(() => useServices());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockedApi.listServices).toHaveBeenCalledWith(1, 20, undefined);
    });

    it('re-fetches when petId changes', async () => {
      (mockedApi.listServices as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([mockService])
        .mockResolvedValueOnce([mockService2]);

      const { result, rerender } = renderHook(
        ({ petId }) => useServices({ petId }),
        { initialProps: { petId: 5 as number | undefined } },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockedApi.listServices).toHaveBeenCalledWith(1, 20, 5);

      // Change petId
      rerender({ petId: 7 });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockedApi.listServices).toHaveBeenCalledWith(1, 20, 7);
    });
  });

  describe('search / refresh / pagination', () => {
    it('exposes refresh function', async () => {
      const { result } = renderHook(() => useServices());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      vi.clearAllMocks();
      (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockService]);

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(mockedApi.listServices).toHaveBeenCalledWith(1, 20, undefined);
      });
    });

    it('handles goToPage', async () => {
      (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useServices());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      vi.clearAllMocks();

      await act(async () => {
        result.current.goToPage(2);
      });

      await waitFor(() => {
        expect(mockedApi.listServices).toHaveBeenCalledWith(2, 20, undefined);
      });
    });
  });
});
