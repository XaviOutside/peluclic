/**
 * Client domain entity — zero framework or DB imports.
 * Status values are stored as TINYINT in MySQL: 0 = inactive, 1 = active.
 */
export type ClientStatus = 0 | 1;

export const CLIENT_STATUS = {
  INACTIVE: 0 as ClientStatus,
  ACTIVE: 1 as ClientStatus,
} as const;

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: ClientStatus;
  lastServiceDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone: string;
  phone2?: string | null;
  address?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  phone2?: string | null;
  address?: string | null;
  /** Only set by DeactivateClient use case — not exposed via UpdateClientDto */
  status?: ClientStatus;
}
