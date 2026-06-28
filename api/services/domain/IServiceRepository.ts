/**
 * Repository interface for the services bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { Service, CreateServiceInput, UpdateServiceInput } from './Service';

export interface IServiceRepository {
  create(data: CreateServiceInput): Promise<Service>;
  findById(id: number): Promise<Service | null>;
  existsById(id: number): Promise<boolean>;
  findAll(page: number, limit: number): Promise<Service[]>;
  update(id: number, data: UpdateServiceInput): Promise<Service>;
  softDelete(id: number): Promise<void>;
  search(sanitizedQuery: string): Promise<Service[]>;
}
