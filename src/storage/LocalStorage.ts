import type { IStorage } from '@/storage/IStorage';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import type { Appointment, AppointmentStatus, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';
import type { CompanySettings, UpdateSettingsDto } from '@/types/settings';
import type { PaginatedResponse } from '@/types/pagination';

/* --------------------------------------------------------------------------
 * Internal types — localStorage stores entities with optional deletedAt
 * -------------------------------------------------------------------------- */

type Storable<T> = T & { deletedAt?: string | null };

type NextIds = {
  clients: number;
  pets: number;
  services: number;
  appointments: number;
};

/* ==========================================================================
 * LocalStorage — full browser localStorage implementation of IStorage
 * ========================================================================== */

export class LocalStorage implements IStorage {
  /* ------------------------------------------------------------------------
   * Private helpers — read/write collections, ID generation
   * ------------------------------------------------------------------------ */

  private readCollection<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeCollection<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // localStorage unavailable (private browsing) — silently noop
    }
  }

  private getNextId(entity: keyof NextIds): number {
    try {
      const raw = localStorage.getItem('pf_demo:nextIds');
      const ids: NextIds = raw ? JSON.parse(raw) : { clients: 0, pets: 0, services: 0, appointments: 0 };
      ids[entity] = (ids[entity] || 0) + 1;
      localStorage.setItem('pf_demo:nextIds', JSON.stringify(ids));
      return ids[entity];
    } catch {
      // On corruption, reset and start from 1
      const fresh: NextIds = { clients: 0, pets: 0, services: 0, appointments: 0 };
      fresh[entity] = 1;
      localStorage.setItem('pf_demo:nextIds', JSON.stringify(fresh));
      return 1;
    }
  }

  /** Filter out records where deletedAt is set. */
  private filterActive<T>(records: Storable<T>[]): T[] {
    return records.filter(r => !r.deletedAt) as unknown as T[];
  }

  private now(): string {
    return new Date().toISOString();
  }

  /* ========================================================================
   * CLIENTS — 8 methods
   * ======================================================================== */

  async listClients(page = 1, limit = 20): Promise<PaginatedResponse<Client>> {
    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    const active = this.filterActive(all);
    const total = active.length;
    const start = (page - 1) * limit;
    const data = active.slice(start, start + limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async getClient(id: number): Promise<Client> {
    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    const found = all.find(c => c.id === id && !c.deletedAt);
    if (!found) {
      throw new Error(`Client with id ${id} not found`);
    }
    return found;
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    const id = this.getNextId('clients');
    const now = this.now();
    const client: Client = {
      id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      phone2: data.phone2 ?? null,
      address: data.address ?? null,
      status: 'active',
      lastServiceDate: null,
      notes: data.notes ?? null,
      consentGivenAt: data.consentGivenAt ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    all.push(client);
    this.writeCollection('pf_demo:clients', all);
    return client;
  }

  async updateClient(id: number, data: UpdateClientDto): Promise<Client> {
    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    const idx = all.findIndex(c => c.id === id && !c.deletedAt);
    if (idx === -1) {
      throw new Error(`Client with id ${id} not found`);
    }

    const existing = all[idx];

    // Handle nullable fields explicitly — undefined means "don't change",
    // null means "set to null" (if allowed by the DTO).
    const updated: Client = {
      ...existing,
      name: data.name ?? existing.name,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      phone2: data.phone2 !== undefined ? data.phone2 : existing.phone2,
      address: data.address !== undefined ? data.address : existing.address,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: this.now(),
    };

    all[idx] = updated;
    this.writeCollection('pf_demo:clients', all);
    return updated;
  }

  async deleteClient(id: number): Promise<void> {
    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    const found = all.find(c => c.id === id && !c.deletedAt);
    if (!found) {
      throw new Error(`Client with id ${id} not found`);
    }
    (found as Storable<Client>).deletedAt = this.now();
    this.writeCollection('pf_demo:clients', all);
  }

  async hardDeleteClient(id: number): Promise<void> {
    const clients = this.readCollection<Storable<Client>>('pf_demo:clients');
    const idx = clients.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Client with id ${id} not found`);
    }
    clients.splice(idx, 1);
    this.writeCollection('pf_demo:clients', clients);

    // Also remove associated pets
    const pets = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const remainingPets = pets.filter(p => p.clientId !== id);
    this.writeCollection('pf_demo:pets', remainingPets);
  }

  async reactivateClient(id: number): Promise<Client> {
    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    const found = all.find(c => c.id === id && !c.deletedAt);
    if (!found) {
      throw new Error(`Client with id ${id} not found`);
    }
    found.status = 'active';
    found.updatedAt = this.now();
    this.writeCollection('pf_demo:clients', all);
    return found;
  }

  async deactivateClient(id: number): Promise<Client> {
    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    const found = all.find(c => c.id === id && !c.deletedAt);
    if (!found) {
      throw new Error(`Client with id ${id} not found`);
    }
    found.status = 'inactive';
    found.updatedAt = this.now();
    this.writeCollection('pf_demo:clients', all);
    return found;
  }

  async searchClients(query: string): Promise<Client[]> {
    const all = this.readCollection<Storable<Client>>('pf_demo:clients');
    const q = query.toLowerCase();
    return all
      .filter(c => {
        if (c.deletedAt) return false;
        const name = (c.name ?? '').toLowerCase();
        const email = (c.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
  }

  async exportClient(id: number): Promise<Record<string, unknown>> {
    // In demo mode, construct export from localStorage data
    const client = await this.getClient(id);
    const allPets = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const allServices = this.readCollection<Storable<Service>>('pf_demo:services');
    const allAppointments = this.readCollection<Storable<Appointment>>('pf_demo:appointments');

    const pets = this.filterActive(allPets).filter(p => p.clientId === id);
    const petIds = pets.map(p => p.id);

    const services = this.filterActive(allServices).filter(s =>
      s.petId !== null && petIds.includes(s.petId),
    );
    const appointments = this.filterActive(allAppointments).filter(a =>
      a.clientId === id,
    );

    return {
      exportedAt: this.now(),
      dataSubject: {
        client,
        pets,
        appointments,
        services,
      },
    };
  }

  /* ========================================================================
   * PETS — 7 methods
   * ======================================================================== */

  async listPets(page = 1, limit = 20, clientId?: number): Promise<PaginatedResponse<Pet>> {
    const all = this.readCollection<Storable<Pet>>('pf_demo:pets');
    let active = this.filterActive(all);
    if (clientId !== undefined) {
      active = active.filter(p => p.clientId === clientId);
    }
    const total = active.length;
    const start = (page - 1) * limit;
    const data = active.slice(start, start + limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async getPet(id: number): Promise<Pet> {
    const all = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const found = all.find(p => p.id === id && !p.deletedAt);
    if (!found) {
      throw new Error(`Pet with id ${id} not found`);
    }
    return found;
  }

  async createPet(data: CreatePetInput): Promise<Pet> {
    const id = this.getNextId('pets');
    const now = this.now();
    const pet: Pet = {
      id,
      clientId: data.clientId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      sex: data.sex ?? 'unknown',
      dateOfBirth: data.dateOfBirth ?? null,
      weightKg: data.weightKg ?? null,
      notes: data.notes ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const all = this.readCollection<Storable<Pet>>('pf_demo:pets');
    all.push(pet);
    this.writeCollection('pf_demo:pets', all);
    return pet;
  }

  async updatePet(id: number, data: UpdatePetInput): Promise<Pet> {
    const all = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const idx = all.findIndex(p => p.id === id && !p.deletedAt);
    if (idx === -1) {
      throw new Error(`Pet with id ${id} not found`);
    }

    const existing = all[idx];
    const updated: Pet = {
      ...existing,
      name: data.name ?? existing.name,
      species: data.species ?? existing.species,
      breed: data.breed ?? existing.breed,
      sex: data.sex ?? existing.sex,
      dateOfBirth: data.dateOfBirth !== undefined ? data.dateOfBirth : existing.dateOfBirth,
      weightKg: data.weightKg !== undefined ? data.weightKg : existing.weightKg,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: this.now(),
    };

    all[idx] = updated;
    this.writeCollection('pf_demo:pets', all);
    return updated;
  }

  async deletePet(id: number): Promise<void> {
    const all = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const found = all.find(p => p.id === id && !p.deletedAt);
    if (!found) {
      throw new Error(`Pet with id ${id} not found`);
    }
    (found as Storable<Pet>).deletedAt = this.now();
    this.writeCollection('pf_demo:pets', all);
  }

  async deactivatePet(id: number): Promise<Pet> {
    const all = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const found = all.find(p => p.id === id && !p.deletedAt);
    if (!found) {
      throw new Error(`Pet with id ${id} not found`);
    }
    found.status = 'inactive';
    found.updatedAt = this.now();
    this.writeCollection('pf_demo:pets', all);
    return found;
  }

  async searchPets(query: string): Promise<Pet[]> {
    const all = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const q = query.toLowerCase();
    return all
      .filter(p => {
        if (p.deletedAt) return false;
        const name = (p.name ?? '').toLowerCase();
        const breed = (p.breed ?? '').toLowerCase();
        const notes = (p.notes ?? '').toLowerCase();
        return name.includes(q) || breed.includes(q) || notes.includes(q);
      });
  }

  /* ========================================================================
   * SERVICES — 7 methods
   * ======================================================================== */

  async listServices(page = 1, limit = 20, petId?: number): Promise<PaginatedResponse<Service>> {
    const all = this.readCollection<Storable<Service>>('pf_demo:services');
    let active = this.filterActive(all);
    if (petId !== undefined) {
      active = active.filter(s => (s as Service).petId === petId);
    }
    const total = active.length;
    const start = (page - 1) * limit;
    const data = active.slice(start, start + limit) as Service[];
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async getService(id: number): Promise<Service> {
    const all = this.readCollection<Storable<Service>>('pf_demo:services');
    const found = all.find(s => s.id === id && !s.deletedAt);
    if (!found) {
      throw new Error(`Service with id ${id} not found`);
    }
    return found;
  }

  async createService(data: CreateServiceInput): Promise<Service> {
    const id = this.getNextId('services');
    const now = this.now();
    const service: Service = {
      id,
      name: data.name,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes ?? null,
      price: data.price,
      petId: data.petId ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const all = this.readCollection<Storable<Service>>('pf_demo:services');
    all.push(service);
    this.writeCollection('pf_demo:services', all);
    return service;
  }

  async updateService(id: number, data: UpdateServiceInput): Promise<Service> {
    const all = this.readCollection<Storable<Service>>('pf_demo:services');
    const idx = all.findIndex(s => s.id === id && !s.deletedAt);
    if (idx === -1) {
      throw new Error(`Service with id ${id} not found`);
    }

    const existing = all[idx];
    const updated: Service = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      durationMinutes: data.durationMinutes !== undefined ? data.durationMinutes : existing.durationMinutes,
      price: data.price ?? existing.price,
      petId: data.petId !== undefined ? data.petId : existing.petId,
      updatedAt: this.now(),
    };

    all[idx] = updated;
    this.writeCollection('pf_demo:services', all);
    return updated;
  }

  async deleteService(id: number): Promise<void> {
    const all = this.readCollection<Storable<Service>>('pf_demo:services');
    const found = all.find(s => s.id === id && !s.deletedAt);
    if (!found) {
      throw new Error(`Service with id ${id} not found`);
    }
    (found as Storable<Service>).deletedAt = this.now();
    this.writeCollection('pf_demo:services', all);
  }

  async deactivateService(id: number): Promise<Service> {
    const all = this.readCollection<Storable<Service>>('pf_demo:services');
    const found = all.find(s => s.id === id && !s.deletedAt);
    if (!found) {
      throw new Error(`Service with id ${id} not found`);
    }
    found.status = 'inactive';
    found.updatedAt = this.now();
    this.writeCollection('pf_demo:services', all);
    return found;
  }

  async searchServices(query: string): Promise<Service[]> {
    const all = this.readCollection<Storable<Service>>('pf_demo:services');
    const q = query.toLowerCase();
    return all
      .filter(s => {
        if (s.deletedAt) return false;
        const name = (s.name ?? '').toLowerCase();
        const description = (s.description ?? '').toLowerCase();
        return name.includes(q) || description.includes(q);
      });
  }

  /* ========================================================================
   * APPOINTMENTS — 5 methods
   * ======================================================================== */

  async listAppointments(start: string, end: string): Promise<Appointment[]> {
    const all = this.readCollection<Storable<Appointment>>('pf_demo:appointments');
    return all
      .filter(a => {
        if (a.deletedAt) return false;
        return a.scheduledAt >= start && a.scheduledAt <= end;
      });
  }

  async getAppointment(id: number): Promise<Appointment> {
    const all = this.readCollection<Storable<Appointment>>('pf_demo:appointments');
    const found = all.find(a => a.id === id && !a.deletedAt);
    if (!found) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    return found;
  }

  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    const id = this.getNextId('appointments');
    const now = this.now();

    // Resolve pet name
    const pets = this.readCollection<Storable<Pet>>('pf_demo:pets');
    const pet = pets.find(p => p.id === data.petId && !p.deletedAt);
    const petName = pet?.name ?? `Pet #${data.petId}`;

    // Resolve client info from pet's owner
    const clientId = pet?.clientId ?? 0;
    let clientName = 'Unknown Client';
    if (clientId > 0) {
      const clients = this.readCollection<Storable<Client>>('pf_demo:clients');
      const client = clients.find(c => c.id === clientId && !c.deletedAt);
      clientName = client?.name ?? 'Unknown Client';
    }

    const appointment: Appointment = {
      id,
      petId: data.petId,
      petName,
      clientId,
      clientName,
      scheduledAt: data.scheduledAt,
      status: 0 as AppointmentStatus,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const all = this.readCollection<Storable<Appointment>>('pf_demo:appointments');
    all.push(appointment);
    this.writeCollection('pf_demo:appointments', all);
    return appointment;
  }

  async updateAppointment(id: number, data: UpdateAppointmentDto): Promise<Appointment> {
    const all = this.readCollection<Storable<Appointment>>('pf_demo:appointments');
    const idx = all.findIndex(a => a.id === id && !a.deletedAt);
    if (idx === -1) {
      throw new Error(`Appointment with id ${id} not found`);
    }

    const existing = all[idx];
    const updated: Appointment = {
      ...existing,
      scheduledAt: data.scheduledAt ?? existing.scheduledAt,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      status: data.status ?? existing.status,
      updatedAt: this.now(),
    };

    all[idx] = updated;
    this.writeCollection('pf_demo:appointments', all);
    return updated;
  }

  async cancelAppointment(id: number): Promise<Appointment> {
    const all = this.readCollection<Storable<Appointment>>('pf_demo:appointments');
    const found = all.find(a => a.id === id && !a.deletedAt);
    if (!found) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    found.status = 3 as AppointmentStatus;
    found.updatedAt = this.now();
    this.writeCollection('pf_demo:appointments', all);
    return found;
  }

  /* ========================================================================
   * SETTINGS — 3 methods
   * ======================================================================== */

  private readonly SETTINGS_KEY = 'pf_demo:settings';

  private defaultSettings(): CompanySettings {
    return {
      id: 1,
      companyName: 'My Pet Grooming',
      tagline: null,
      workdays: [1, 2, 3, 4, 5],
      workStartTime: '09:00',
      workEndTime: '17:00',
      defaultLang: 0,
      logoUrl: null,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
  }

  async getSettings(): Promise<CompanySettings> {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (!raw) return this.defaultSettings();
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.companyName === 'string') {
        return parsed;
      }
      return this.defaultSettings();
    } catch {
      return this.defaultSettings();
    }
  }

  async updateSettings(data: UpdateSettingsDto): Promise<CompanySettings> {
    const current = await this.getSettings();
    const updated: CompanySettings = {
      ...current,
      companyName: data.companyName,
      tagline: data.tagline !== undefined ? data.tagline : current.tagline,
      workdays: data.workdays,
      workStartTime: data.workStartTime,
      workEndTime: data.workEndTime,
      defaultLang: data.defaultLang,
      updatedAt: this.now(),
    };
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable — silently noop
    }
    return updated;
  }

  async uploadLogo(file: File): Promise<CompanySettings> {
    const current = await this.getSettings();
    const updated: CompanySettings = {
      ...current,
      logoUrl: file.name,
      updatedAt: this.now(),
    };
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable — silently noop
    }
    return updated;
  }
}
