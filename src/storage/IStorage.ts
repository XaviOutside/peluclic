import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';
import type { CompanySettings, UpdateSettingsDto } from '@/types/settings';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Storage abstraction layer — decouples frontend data access from API transport.
 *
 * Two implementations:
 *   - ApiStorage: wraps http() for production (database-backed)
 *   - LocalStorage: browser localStorage for demo mode
 *
 * Every method signature MUST match the corresponding export in:
 *   src/services/{client,pet,service,appointments,settings}.ts
 */
export interface IStorage {
  /* ========================================================================
   * CLIENTS — 8 methods (matches src/services/client.ts)
   * ======================================================================== */

  /** Fetch paginated list of clients. */
  listClients(page?: number, limit?: number): Promise<PaginatedResponse<Client>>;

  /** Fetch a single client by ID. */
  getClient(id: number): Promise<Client>;

  /** Create a new client. */
  createClient(data: CreateClientDto): Promise<Client>;

  /** Update an existing client. */
  updateClient(id: number, data: UpdateClientDto): Promise<Client>;

  /** Soft-delete a client. */
  deleteClient(id: number): Promise<void>;

  /** Reactivate a client (set status = active). */
  reactivateClient(id: number): Promise<Client>;

  /** Deactivate a client (set status = inactive). */
  deactivateClient(id: number): Promise<Client>;

  /** Search clients by query string. */
  searchClients(query: string): Promise<Client[]>;

  /* ========================================================================
   * PETS — 7 methods (matches src/services/pet.ts)
   * ======================================================================== */

  /** Fetch paginated list of pets, optionally filtered by clientId. */
  listPets(page?: number, limit?: number, clientId?: number): Promise<PaginatedResponse<Pet>>;

  /** Fetch a single pet by ID. */
  getPet(id: number): Promise<Pet>;

  /** Create a new pet. */
  createPet(data: CreatePetInput): Promise<Pet>;

  /** Update an existing pet. */
  updatePet(id: number, data: UpdatePetInput): Promise<Pet>;

  /** Soft-delete a pet. */
  deletePet(id: number): Promise<void>;

  /** Deactivate a pet (set status = inactive). */
  deactivatePet(id: number): Promise<Pet>;

  /** Search pets by query string. */
  searchPets(query: string): Promise<Pet[]>;

  /* ========================================================================
   * SERVICES — 7 methods (matches src/services/service.ts)
   * ======================================================================== */

  /** Fetch paginated list of services, optionally filtered by petId. */
  listServices(page?: number, limit?: number, petId?: number): Promise<PaginatedResponse<Service>>;

  /** Fetch a single service by ID. */
  getService(id: number): Promise<Service>;

  /** Create a new service. */
  createService(data: CreateServiceInput): Promise<Service>;

  /** Update an existing service. */
  updateService(id: number, data: UpdateServiceInput): Promise<Service>;

  /** Soft-delete a service. */
  deleteService(id: number): Promise<void>;

  /** Deactivate a service (set status = inactive). */
  deactivateService(id: number): Promise<Service>;

  /** Search services by query string. */
  searchServices(query: string): Promise<Service[]>;

  /* ========================================================================
   * APPOINTMENTS — 5 methods (matches src/services/appointments.ts)
   * ======================================================================== */

  /** Fetch appointments within a date range. */
  listAppointments(start: string, end: string): Promise<Appointment[]>;

  /** Fetch a single appointment by ID. */
  getAppointment(id: number): Promise<Appointment>;

  /** Create a new appointment. */
  createAppointment(data: CreateAppointmentDto): Promise<Appointment>;

  /** Update an existing appointment. */
  updateAppointment(id: number, data: UpdateAppointmentDto): Promise<Appointment>;

  /** Cancel an appointment. */
  cancelAppointment(id: number): Promise<Appointment>;

  /* ========================================================================
   * SETTINGS — 3 methods (matches src/services/settings.ts)
   * ======================================================================== */

  /** Fetch current company settings. */
  getSettings(): Promise<CompanySettings>;

  /** Update company settings. */
  updateSettings(data: UpdateSettingsDto): Promise<CompanySettings>;

  /** Upload company logo (PNG, max 1MB). */
  uploadLogo(file: File): Promise<CompanySettings>;
}
