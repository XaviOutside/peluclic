import { Client } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { ClientValidationError } from '../domain/ClientErrors';
import { PaginatedResult } from '@api/shared/domain/PaginatedResult';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ListClientsParams {
  page?: number;
  limit?: number;
}

export class ListClientsUseCase {
  constructor(private readonly repository: IClientRepository) {}

  async execute(params: ListClientsParams): Promise<PaginatedResult<Client>> {
    const page = params.page ?? DEFAULT_PAGE;
    const rawLimit = params.limit ?? DEFAULT_LIMIT;

    if (page < 1) {
      throw new ClientValidationError('Page must be greater than or equal to 1');
    }

    if (rawLimit < 1) {
      throw new ClientValidationError('Limit must be greater than or equal to 1');
    }

    const limit = Math.min(rawLimit, MAX_LIMIT);

    return this.repository.findAll(page, limit);
  }
}
