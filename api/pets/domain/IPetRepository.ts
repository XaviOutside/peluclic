/**
 * Repository interface for the pets bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { Pet, CreatePetInput, UpdatePetInput } from './Pet';
import { PaginatedResult } from '@api/shared/domain/PaginatedResult';
import type { Prisma } from '@prisma/client';

export interface IPetRepository {
  create(data: CreatePetInput): Promise<Pet>;
  findById(id: number): Promise<Pet | null>;
  existsById(id: number): Promise<boolean>;
  findAll(page: number, limit: number): Promise<PaginatedResult<Pet>>;
  findAllByClientId(clientId: number, page: number, limit: number): Promise<PaginatedResult<Pet>>;
  findByClientIdIncludeDeleted(clientId: number): Promise<Pet[]>;
  update(id: number, data: UpdatePetInput): Promise<Pet>;
  softDelete(id: number): Promise<void>;
  hardDelete(id: number, tx?: Prisma.TransactionClient): Promise<void>;
  search(sanitizedQuery: string): Promise<Pet[]>;
  clientExistsAndIsActive(clientId: number): Promise<boolean>;
  deactivateAllByClientId(clientId: number): Promise<void>;
  softDeleteAllByClientId(clientId: number): Promise<void>;
}
