/**
 * Repository interface for the clients bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { Client, CreateClientInput, UpdateClientInput } from './Client';

export interface IClientRepository {
  create(data: CreateClientInput): Promise<Client>;
  findById(id: number): Promise<Client | null>;
  existsById(id: number): Promise<boolean>;
  findAll(page: number, limit: number): Promise<Client[]>;
  update(id: number, data: UpdateClientInput): Promise<Client>;
  softDelete(id: number): Promise<void>;
  search(sanitizedQuery: string): Promise<Client[]>;
}
