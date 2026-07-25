import type { ClientResponseDto } from './ClientResponseDto';

/**
 * Response DTO for the GDPR Data Portability export endpoint.
 *
 * Shape: { exportedAt, dataSubject: { client, pets[], appointments[], services[] } }
 *
 * All Date fields are ISO 8601 strings. Status fields are human-readable.
 * Soft-deleted records are excluded by the use case.
 */
export interface ExportResponseDto {
  /** ISO 8601 timestamp of when the export was generated */
  exportedAt: string;
  /** All non-deleted data belonging to the data subject */
  dataSubject: {
    client: ExportedClient;
    pets: ExportedPet[];
    appointments: ExportedAppointment[];
    services: ExportedService[];
  };
}

/** Client data in export format — mirrors ClientResponseDto shape */
export type ExportedClient = ClientResponseDto;

/** Pet data in export format — mirrors PetResponseDto shape */
export interface ExportedPet {
  id: number;
  clientId: number;
  name: string;
  species: string;
  breed: string;
  sex: 'unknown' | 'male' | 'female';
  dateOfBirth: string | null;
  weightKg: number | null;
  notes: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/** Appointment data in export format — excludes clientId (already in client) */
export interface ExportedAppointment {
  id: number;
  petId: number;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Service data in export format */
export interface ExportedService {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  price: number; // cents
  petId: number | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
