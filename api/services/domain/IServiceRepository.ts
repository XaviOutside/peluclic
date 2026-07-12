/**
 * Repository interface for the services bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { Service, CreateServiceInput, UpdateServiceInput } from './Service';
import { PaginatedResult } from '@api/shared/domain/PaginatedResult';

export interface FindAllParams {
  page: number;
  limit: number;
  petId?: number;
}

export interface IServiceRepository {
  create(data: CreateServiceInput): Promise<Service>;
  findById(id: number): Promise<Service | null>;
  existsById(id: number): Promise<boolean>;
  findAll(params: FindAllParams): Promise<PaginatedResult<Service>>;
  update(id: number, data: UpdateServiceInput): Promise<Service>;
  softDelete(id: number): Promise<void>;
  search(sanitizedQuery: string): Promise<Service[]>;
  /**
   * Sets pet_id = NULL on all non-deleted services linked to the given pet.
   * Called by SoftDeletePetUseCase before soft-deleting a pet.
   */
  unlinkAllByPetId(petId: number): Promise<void>;
}
