import { http, HttpError } from '@/services/http';
import type { IStorage } from '@/storage/IStorage';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';
import type { CompanySettings, UpdateSettingsDto } from '@/types/settings';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Production storage implementation — delegates all IStorage methods to the REST API
 * via the existing http() transport.
 *
 * Behavior is IDENTICAL to the current src/services/*.ts functions.
 * No observable difference for any consumer.
 */
export class ApiStorage implements IStorage {
  /* ========================================================================
   * CLIENTS
   * ======================================================================== */

  listClients(page = 1, limit = 20): Promise<PaginatedResponse<Client>> {
    return http<PaginatedResponse<Client>>(`/clients?page=${page}&limit=${limit}`);
  }

  getClient(id: number): Promise<Client> {
    return http<Client>(`/clients/${id}`);
  }

  createClient(data: CreateClientDto): Promise<Client> {
    return http<Client>('/clients', { method: 'POST', body: data });
  }

  updateClient(id: number, data: UpdateClientDto): Promise<Client> {
    return http<Client>(`/clients/${id}`, { method: 'PUT', body: data });
  }

  deleteClient(id: number): Promise<void> {
    return http<void>(`/clients/${id}`, { method: 'DELETE' });
  }

  reactivateClient(id: number): Promise<Client> {
    return http<Client>(`/clients/${id}/reactivate`, { method: 'PATCH' });
  }

  deactivateClient(id: number): Promise<Client> {
    return http<Client>(`/clients/${id}/deactivate`, { method: 'PATCH' });
  }

  searchClients(query: string): Promise<Client[]> {
    const encoded = encodeURIComponent(query);
    return http<Client[]>(`/clients/search?q=${encoded}`);
  }

  /* ========================================================================
   * PETS
   * ======================================================================== */

  listPets(page = 1, limit = 20, clientId?: number): Promise<PaginatedResponse<Pet>> {
    let url = `/pets?page=${page}&limit=${limit}`;
    if (clientId !== undefined) {
      url += `&clientId=${clientId}`;
    }
    return http<PaginatedResponse<Pet>>(url);
  }

  getPet(id: number): Promise<Pet> {
    return http<Pet>(`/pets/${id}`);
  }

  createPet(data: CreatePetInput): Promise<Pet> {
    return http<Pet>('/pets', { method: 'POST', body: data });
  }

  updatePet(id: number, data: UpdatePetInput): Promise<Pet> {
    return http<Pet>(`/pets/${id}`, { method: 'PUT', body: data });
  }

  deletePet(id: number): Promise<void> {
    return http<void>(`/pets/${id}`, { method: 'DELETE' });
  }

  deactivatePet(id: number): Promise<Pet> {
    return http<Pet>(`/pets/${id}/deactivate`, { method: 'PATCH' });
  }

  searchPets(query: string): Promise<Pet[]> {
    const encoded = encodeURIComponent(query);
    return http<Pet[]>(`/pets/search?q=${encoded}`);
  }

  /* ========================================================================
   * SERVICES
   * ======================================================================== */

  listServices(page = 1, limit = 20, petId?: number): Promise<PaginatedResponse<Service>> {
    let url = `/services?page=${page}&limit=${limit}`;
    if (petId !== undefined) {
      url += `&petId=${petId}`;
    }
    return http<PaginatedResponse<Service>>(url);
  }

  getService(id: number): Promise<Service> {
    return http<Service>(`/services/${id}`);
  }

  createService(data: CreateServiceInput): Promise<Service> {
    return http<Service>('/services', { method: 'POST', body: data });
  }

  updateService(id: number, data: UpdateServiceInput): Promise<Service> {
    return http<Service>(`/services/${id}`, { method: 'PUT', body: data });
  }

  deleteService(id: number): Promise<void> {
    return http<void>(`/services/${id}`, { method: 'DELETE' });
  }

  deactivateService(id: number): Promise<Service> {
    return http<Service>(`/services/${id}/deactivate`, { method: 'PATCH' });
  }

  searchServices(query: string): Promise<Service[]> {
    const encoded = encodeURIComponent(query);
    return http<Service[]>(`/services/search?q=${encoded}`);
  }

  /* ========================================================================
   * APPOINTMENTS
   * ======================================================================== */

  listAppointments(start: string, end: string): Promise<Appointment[]> {
    const params = new URLSearchParams({ start, end });
    return http<Appointment[]>(`/appointments?${params.toString()}`);
  }

  getAppointment(id: number): Promise<Appointment> {
    return http<Appointment>(`/appointments/${id}`);
  }

  createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    return http<Appointment>('/appointments', { method: 'POST', body: data });
  }

  updateAppointment(id: number, data: UpdateAppointmentDto): Promise<Appointment> {
    return http<Appointment>(`/appointments/${id}`, { method: 'PATCH', body: data });
  }

  cancelAppointment(id: number): Promise<Appointment> {
    return http<Appointment>(`/appointments/${id}`, { method: 'DELETE' });
  }

  /* ========================================================================
   * SETTINGS
   * ======================================================================== */

  getSettings(): Promise<CompanySettings> {
    return http<CompanySettings>('/settings');
  }

  updateSettings(data: UpdateSettingsDto): Promise<CompanySettings> {
    return http<CompanySettings>('/settings', { method: 'PUT', body: data });
  }

  /** uploadLogo uses native fetch with FormData (not http()) — same as settings.ts */
  async uploadLogo(file: File): Promise<CompanySettings> {
    const formData = new FormData();
    formData.append('logo', file);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/v1/settings/logo', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new HttpError(response.status, error.error ?? 'Upload failed');
    }

    return response.json();
  }
}
