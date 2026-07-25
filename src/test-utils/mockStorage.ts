import { vi } from 'vitest';
import type { IStorage } from '@/storage/IStorage';

/**
 * Creates a full mock IStorage where every method is a vitest mock.
 * Tests can override individual methods as needed:
 *
 *   const storage = createMockStorage();
 *   storage.listClients.mockResolvedValue({ data: [], meta: { ... } });
 *
 * Use with vi.mock hoisting:
 *
 *   const { createMockStorage } = await import('@/test-utils/mockStorage');
 *   const mockStorage = createMockStorage();
 *   mockStorage.listClients.mockResolvedValue(...);
 *
 *   vi.mock('@/storage/storageContext', () => ({
 *     getStorage: () => mockStorage,
 *   }));
 */
export function createMockStorage(): Record<keyof IStorage, ReturnType<typeof vi.fn>> {
  return {
    // Clients (9)
    listClients: vi.fn(),
    getClient: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    reactivateClient: vi.fn(),
    deactivateClient: vi.fn(),
    searchClients: vi.fn(),
    exportClient: vi.fn(),

    // Pets (7)
    listPets: vi.fn(),
    getPet: vi.fn(),
    createPet: vi.fn(),
    updatePet: vi.fn(),
    deletePet: vi.fn(),
    deactivatePet: vi.fn(),
    searchPets: vi.fn(),

    // Services (7)
    listServices: vi.fn(),
    getService: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn(),
    deactivateService: vi.fn(),
    searchServices: vi.fn(),

    // Appointments (5)
    listAppointments: vi.fn(),
    getAppointment: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    cancelAppointment: vi.fn(),

    // Settings (3)
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    uploadLogo: vi.fn(),
  };
}
