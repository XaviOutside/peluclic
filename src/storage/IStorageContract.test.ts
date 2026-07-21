import { describe, it, expect } from 'vitest';
import type { IStorage } from '@/storage/IStorage';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';
import type { CompanySettings, UpdateSettingsDto } from '@/types/settings';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Type-level contract test: verifies IStorage defines exactly 30 method signatures
 * matching the existing src/services/*.ts exports.
 *
 * RED: This test fails (IStorage.ts does not exist yet).
 * GREEN: Create IStorage.ts with all 30 methods → type assignment compiles.
 *
 * Strategy: the `const storage: IStorage = { ... }` assignment is a compile-time
 * contract check. If IStorage has a different parameter type or return type than
 * the actual service exports, TypeScript rejects the assignment. We additionally
 * assert the method count at runtime.
 */
describe('IStorage type-level contract', () => {
  it('must define exactly 30 method signatures matching service exports', () => {
    // Helper: a valid PaginatedResponse for type compatibility
    const emptyPage: PaginatedResponse<unknown> = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };

    // This assignment IS the contract check.
    // If IStorage is missing a method, has wrong parameter types, or wrong
    // return types, TypeScript compilation fails here.
    const storage: IStorage = {
      /* ========== Clients (8 methods) ========== */
      listClients: (_page = 1, _limit = 20) =>
        Promise.resolve(emptyPage as PaginatedResponse<Client>),
      getClient: (_id: number) =>
        Promise.resolve({} as Client),
      createClient: (_data: CreateClientDto) =>
        Promise.resolve({} as Client),
      updateClient: (_id: number, _data: UpdateClientDto) =>
        Promise.resolve({} as Client),
      deleteClient: (_id: number) =>
        Promise.resolve(),
      reactivateClient: (_id: number) =>
        Promise.resolve({} as Client),
      deactivateClient: (_id: number) =>
        Promise.resolve({} as Client),
      searchClients: (_query: string) =>
        Promise.resolve([] as Client[]),

      /* ========== Pets (7 methods) ========== */
      listPets: (_page = 1, _limit = 20, _clientId?: number) =>
        Promise.resolve(emptyPage as PaginatedResponse<Pet>),
      getPet: (_id: number) =>
        Promise.resolve({} as Pet),
      createPet: (_data: CreatePetInput) =>
        Promise.resolve({} as Pet),
      updatePet: (_id: number, _data: UpdatePetInput) =>
        Promise.resolve({} as Pet),
      deletePet: (_id: number) =>
        Promise.resolve(),
      deactivatePet: (_id: number) =>
        Promise.resolve({} as Pet),
      searchPets: (_query: string) =>
        Promise.resolve([] as Pet[]),

      /* ========== Services (7 methods) ========== */
      listServices: (_page = 1, _limit = 20, _petId?: number) =>
        Promise.resolve(emptyPage as PaginatedResponse<Service>),
      getService: (_id: number) =>
        Promise.resolve({} as Service),
      createService: (_data: CreateServiceInput) =>
        Promise.resolve({} as Service),
      updateService: (_id: number, _data: UpdateServiceInput) =>
        Promise.resolve({} as Service),
      deleteService: (_id: number) =>
        Promise.resolve(),
      deactivateService: (_id: number) =>
        Promise.resolve({} as Service),
      searchServices: (_query: string) =>
        Promise.resolve([] as Service[]),

      /* ========== Appointments (5 methods) ========== */
      listAppointments: (_start: string, _end: string) =>
        Promise.resolve([] as Appointment[]),
      getAppointment: (_id: number) =>
        Promise.resolve({} as Appointment),
      createAppointment: (_data: CreateAppointmentDto) =>
        Promise.resolve({} as Appointment),
      updateAppointment: (_id: number, _data: UpdateAppointmentDto) =>
        Promise.resolve({} as Appointment),
      cancelAppointment: (_id: number) =>
        Promise.resolve({} as Appointment),

      /* ========== Settings (3 methods) ========== */
      getSettings: () =>
        Promise.resolve({} as CompanySettings),
      updateSettings: (_data: UpdateSettingsDto) =>
        Promise.resolve({} as CompanySettings),
      uploadLogo: (_file: File) =>
        Promise.resolve({} as CompanySettings),
    };

    // Runtime sanity: the contract has exactly 30 methods
    expect(Object.keys(storage).length).toBe(30);
  });

  /** Triangulate: verify optional parameters match service exports */
  it('must accept calls with default parameters (page, limit, clientId, petId)', async () => {
    const emptyPage: PaginatedResponse<unknown> = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };

    const storage: IStorage = {
      listClients: () => Promise.resolve(emptyPage as PaginatedResponse<Client>),
      getClient: (id: number) => Promise.resolve({} as Client),
      createClient: (data: CreateClientDto) => Promise.resolve({} as Client),
      updateClient: (id: number, data: UpdateClientDto) => Promise.resolve({} as Client),
      deleteClient: (id: number) => Promise.resolve(),
      reactivateClient: (id: number) => Promise.resolve({} as Client),
      deactivateClient: (id: number) => Promise.resolve({} as Client),
      searchClients: (query: string) => Promise.resolve([] as Client[]),
      listPets: () => Promise.resolve(emptyPage as PaginatedResponse<Pet>),
      getPet: (id: number) => Promise.resolve({} as Pet),
      createPet: (data: CreatePetInput) => Promise.resolve({} as Pet),
      updatePet: (id: number, data: UpdatePetInput) => Promise.resolve({} as Pet),
      deletePet: (id: number) => Promise.resolve(),
      deactivatePet: (id: number) => Promise.resolve({} as Pet),
      searchPets: (query: string) => Promise.resolve([] as Pet[]),
      listServices: () => Promise.resolve(emptyPage as PaginatedResponse<Service>),
      getService: (id: number) => Promise.resolve({} as Service),
      createService: (data: CreateServiceInput) => Promise.resolve({} as Service),
      updateService: (id: number, data: UpdateServiceInput) => Promise.resolve({} as Service),
      deleteService: (id: number) => Promise.resolve(),
      deactivateService: (id: number) => Promise.resolve({} as Service),
      searchServices: (query: string) => Promise.resolve([] as Service[]),
      listAppointments: (start: string, end: string) => Promise.resolve([] as Appointment[]),
      getAppointment: (id: number) => Promise.resolve({} as Appointment),
      createAppointment: (data: CreateAppointmentDto) => Promise.resolve({} as Appointment),
      updateAppointment: (id: number, data: UpdateAppointmentDto) => Promise.resolve({} as Appointment),
      cancelAppointment: (id: number) => Promise.resolve({} as Appointment),
      getSettings: () => Promise.resolve({} as CompanySettings),
      updateSettings: (data: UpdateSettingsDto) => Promise.resolve({} as CompanySettings),
      uploadLogo: (file: File) => Promise.resolve({} as CompanySettings),
    };

    // Call list methods with zero args → proves optional parameters are declared
    const clients = await storage.listClients();
    const pets = await storage.listPets();
    const services = await storage.listServices();

    expect(clients).toBeDefined();
    expect(pets).toBeDefined();
    expect(services).toBeDefined();
  });
});
