/**
 * Service domain entity — zero framework or DB imports.
 *
 * Status values are stored as TINYINT in MySQL: 0 = inactive, 1 = active.
 * Price values are stored as integer cents in MySQL.
 */
export type ServiceStatus = 0 | 1;

export const SERVICE_STATUS = {
  INACTIVE: 0 as ServiceStatus,
  ACTIVE: 1 as ServiceStatus,
} as const;

export interface Service {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  price: number; // stored as integer cents (e.g. 2500 = $25.00)
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateServiceInput {
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  price: number; // integer cents
}

export interface UpdateServiceInput {
  name?: string;
  description?: string | null;
  durationMinutes?: number | null;
  price?: number; // integer cents
  /** Only set by DeactivateService use case — not exposed via UpdateServiceDto */
  status?: ServiceStatus;
}
