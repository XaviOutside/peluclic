/**
 * Repository interface for the clients bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { Client, CreateClientInput, UpdateClientInput } from './Client';
import { PaginatedResult } from '@api/shared/domain/PaginatedResult';
import type { Prisma } from '@prisma/client';

export interface IClientRepository {
  create(data: CreateClientInput): Promise<Client>;
  findById(id: number): Promise<Client | null>;
  findByIdIncludeDeleted(id: number): Promise<Client | null>;
  existsById(id: number): Promise<boolean>;
  findAll(page: number, limit: number): Promise<PaginatedResult<Client>>;
  update(id: number, data: UpdateClientInput): Promise<Client>;
  softDelete(id: number): Promise<void>;
  hardDelete(id: number, tx?: Prisma.TransactionClient): Promise<void>;
  search(sanitizedQuery: string): Promise<Client[]>;
}
