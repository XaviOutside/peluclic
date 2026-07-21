import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiStorage } from '@/storage/ApiStorage';
import { http } from '@/services/http';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';
import type { CompanySettings, UpdateSettingsDto } from '@/types/settings';

// Mock the http() module so we can assert delegation without real network calls
vi.mock('@/services/http', () => ({
  http: vi.fn(),
}));

const mockedHttp = vi.mocked(http);

describe('ApiStorage', () => {
  let storage: ApiStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new ApiStorage();
  });

  /* ========================================================================
   * CLIENTS — 8 methods
   * ======================================================================== */

  describe('client methods', () => {
    it('listClients delegates GET /clients?page=&limit=', async () => {
      mockedHttp.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await storage.listClients(1, 20);
      expect(mockedHttp).toHaveBeenCalledWith('/clients?page=1&limit=20');
    });

    it('listClients uses default page=1, limit=20', async () => {
      mockedHttp.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await storage.listClients();
      expect(mockedHttp).toHaveBeenCalledWith('/clients?page=1&limit=20');
    });

    it('getClient delegates GET /clients/:id', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Client);
      await storage.getClient(1);
      expect(mockedHttp).toHaveBeenCalledWith('/clients/1');
    });

    it('createClient delegates POST /clients with body', async () => {
      const data: CreateClientDto = { name: 'Alice', email: 'a@b.com', phone: '123' };
      mockedHttp.mockResolvedValue({ id: 1 } as Client);
      await storage.createClient(data);
      expect(mockedHttp).toHaveBeenCalledWith('/clients', { method: 'POST', body: data });
    });

    it('updateClient delegates PUT /clients/:id with body', async () => {
      const data: UpdateClientDto = { name: 'Bob' };
      mockedHttp.mockResolvedValue({ id: 1 } as Client);
      await storage.updateClient(1, data);
      expect(mockedHttp).toHaveBeenCalledWith('/clients/1', { method: 'PUT', body: data });
    });

    it('deleteClient delegates DELETE /clients/:id', async () => {
      mockedHttp.mockResolvedValue(undefined);
      await storage.deleteClient(1);
      expect(mockedHttp).toHaveBeenCalledWith('/clients/1', { method: 'DELETE' });
    });

    it('reactivateClient delegates PATCH /clients/:id/reactivate', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Client);
      await storage.reactivateClient(1);
      expect(mockedHttp).toHaveBeenCalledWith('/clients/1/reactivate', { method: 'PATCH' });
    });

    it('deactivateClient delegates PATCH /clients/:id/deactivate', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Client);
      await storage.deactivateClient(1);
      expect(mockedHttp).toHaveBeenCalledWith('/clients/1/deactivate', { method: 'PATCH' });
    });

    it('searchClients delegates GET /clients/search?q= with encoded query', async () => {
      mockedHttp.mockResolvedValue([]);
      await storage.searchClients('Alice & Bob');
      expect(mockedHttp).toHaveBeenCalledWith('/clients/search?q=Alice%20%26%20Bob');
    });
  });

  /* ========================================================================
   * PETS — 7 methods
   * ======================================================================== */

  describe('pet methods', () => {
    it('listPets delegates GET /pets?page=&limit=', async () => {
      mockedHttp.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await storage.listPets(1, 20);
      expect(mockedHttp).toHaveBeenCalledWith('/pets?page=1&limit=20');
    });

    it('listPets appends clientId when provided', async () => {
      mockedHttp.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await storage.listPets(1, 20, 5);
      expect(mockedHttp).toHaveBeenCalledWith('/pets?page=1&limit=20&clientId=5');
    });

    it('getPet delegates GET /pets/:id', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Pet);
      await storage.getPet(1);
      expect(mockedHttp).toHaveBeenCalledWith('/pets/1');
    });

    it('createPet delegates POST /pets with body', async () => {
      const data: CreatePetInput = { clientId: 1, name: 'Rex', species: 'Dog', breed: 'Lab' };
      mockedHttp.mockResolvedValue({ id: 1 } as Pet);
      await storage.createPet(data);
      expect(mockedHttp).toHaveBeenCalledWith('/pets', { method: 'POST', body: data });
    });

    it('updatePet delegates PUT /pets/:id with body', async () => {
      const data: UpdatePetInput = { name: 'Rex Jr' };
      mockedHttp.mockResolvedValue({ id: 1 } as Pet);
      await storage.updatePet(1, data);
      expect(mockedHttp).toHaveBeenCalledWith('/pets/1', { method: 'PUT', body: data });
    });

    it('deletePet delegates DELETE /pets/:id', async () => {
      mockedHttp.mockResolvedValue(undefined);
      await storage.deletePet(1);
      expect(mockedHttp).toHaveBeenCalledWith('/pets/1', { method: 'DELETE' });
    });

    it('deactivatePet delegates PATCH /pets/:id/deactivate', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Pet);
      await storage.deactivatePet(1);
      expect(mockedHttp).toHaveBeenCalledWith('/pets/1/deactivate', { method: 'PATCH' });
    });

    it('searchPets delegates GET /pets/search?q= with encoded query', async () => {
      mockedHttp.mockResolvedValue([]);
      await storage.searchPets('Golden');
      expect(mockedHttp).toHaveBeenCalledWith('/pets/search?q=Golden');
    });
  });

  /* ========================================================================
   * SERVICES — 7 methods
   * ======================================================================== */

  describe('service methods', () => {
    it('listServices delegates GET /services?page=&limit=', async () => {
      mockedHttp.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await storage.listServices(1, 20);
      expect(mockedHttp).toHaveBeenCalledWith('/services?page=1&limit=20');
    });

    it('listServices appends petId when provided', async () => {
      mockedHttp.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      await storage.listServices(1, 20, 10);
      expect(mockedHttp).toHaveBeenCalledWith('/services?page=1&limit=20&petId=10');
    });

    it('getService delegates GET /services/:id', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Service);
      await storage.getService(1);
      expect(mockedHttp).toHaveBeenCalledWith('/services/1');
    });

    it('createService delegates POST /services with body', async () => {
      const data: CreateServiceInput = { name: 'Bath', price: 25.0 };
      mockedHttp.mockResolvedValue({ id: 1 } as Service);
      await storage.createService(data);
      expect(mockedHttp).toHaveBeenCalledWith('/services', { method: 'POST', body: data });
    });

    it('updateService delegates PUT /services/:id with body', async () => {
      const data: UpdateServiceInput = { price: 30.0 };
      mockedHttp.mockResolvedValue({ id: 1 } as Service);
      await storage.updateService(1, data);
      expect(mockedHttp).toHaveBeenCalledWith('/services/1', { method: 'PUT', body: data });
    });

    it('deleteService delegates DELETE /services/:id', async () => {
      mockedHttp.mockResolvedValue(undefined);
      await storage.deleteService(1);
      expect(mockedHttp).toHaveBeenCalledWith('/services/1', { method: 'DELETE' });
    });

    it('deactivateService delegates PATCH /services/:id/deactivate', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Service);
      await storage.deactivateService(1);
      expect(mockedHttp).toHaveBeenCalledWith('/services/1/deactivate', { method: 'PATCH' });
    });

    it('searchServices delegates GET /services/search?q= with encoded query', async () => {
      mockedHttp.mockResolvedValue([]);
      await storage.searchServices('haircut');
      expect(mockedHttp).toHaveBeenCalledWith('/services/search?q=haircut');
    });
  });

  /* ========================================================================
   * APPOINTMENTS — 5 methods
   * ======================================================================== */

  describe('appointment methods', () => {
    it('listAppointments delegates GET /appointments?start=&end=', async () => {
      mockedHttp.mockResolvedValue([]);
      await storage.listAppointments('2026-01-01', '2026-01-31');
      // URLSearchParams encodes the query — we assert the call was made with a URL
      // that contains both parameters
      expect(mockedHttp).toHaveBeenCalled();
      const [endpoint] = mockedHttp.mock.calls[0] as [string];
      expect(endpoint).toContain('/appointments?');
      expect(endpoint).toContain('start=2026-01-01');
      expect(endpoint).toContain('end=2026-01-31');
    });

    it('getAppointment delegates GET /appointments/:id', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Appointment);
      await storage.getAppointment(1);
      expect(mockedHttp).toHaveBeenCalledWith('/appointments/1');
    });

    it('createAppointment delegates POST /appointments with body', async () => {
      const data: CreateAppointmentDto = { petId: 1, scheduledAt: '2026-01-01T10:00:00Z' };
      mockedHttp.mockResolvedValue({ id: 1 } as Appointment);
      await storage.createAppointment(data);
      expect(mockedHttp).toHaveBeenCalledWith('/appointments', { method: 'POST', body: data });
    });

    it('updateAppointment delegates PATCH /appointments/:id with body', async () => {
      const data: UpdateAppointmentDto = { notes: 'use hypoallergenic shampoo' };
      mockedHttp.mockResolvedValue({ id: 1 } as Appointment);
      await storage.updateAppointment(1, data);
      expect(mockedHttp).toHaveBeenCalledWith('/appointments/1', { method: 'PATCH', body: data });
    });

    it('cancelAppointment delegates DELETE /appointments/:id', async () => {
      mockedHttp.mockResolvedValue({ id: 1 } as Appointment);
      await storage.cancelAppointment(1);
      expect(mockedHttp).toHaveBeenCalledWith('/appointments/1', { method: 'DELETE' });
    });
  });

  /* ========================================================================
   * SETTINGS — 3 methods
   * ======================================================================== */

  describe('settings methods', () => {
    it('getSettings delegates GET /settings', async () => {
      mockedHttp.mockResolvedValue({ id: 1, companyName: 'Test' } as CompanySettings);
      await storage.getSettings();
      expect(mockedHttp).toHaveBeenCalledWith('/settings');
    });

    it('updateSettings delegates PUT /settings with body', async () => {
      const data: UpdateSettingsDto = {
        companyName: 'New Name',
        workdays: [1, 2, 3, 4, 5],
        workStartTime: '09:00',
        workEndTime: '17:00',
        defaultLang: 0,
      };
      mockedHttp.mockResolvedValue({ id: 1 } as CompanySettings);
      await storage.updateSettings(data);
      expect(mockedHttp).toHaveBeenCalledWith('/settings', { method: 'PUT', body: data });
    });

    it('uploadLogo delegates POST /settings/logo via fetch with FormData (not http)', async () => {
      // uploadLogo uses native fetch, not http(). We mock global fetch.
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ logoUrl: '/logo.png' } as CompanySettings),
      });
      vi.stubGlobal('fetch', mockFetch);

      const file = new File(['fake-content'], 'logo.png', { type: 'image/png' });
      await storage.uploadLogo(file);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/settings/logo', {
        method: 'POST',
        body: expect.any(FormData),
      });

      vi.unstubAllGlobals();
    });
  });
});
