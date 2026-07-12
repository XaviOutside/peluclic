import { Service } from '../domain/Service';
import { IServiceRepository, FindAllParams } from '../domain/IServiceRepository';
import { ValidationError } from '@api/shared/domain/errors';
import { PaginatedResult } from '@api/shared/domain/PaginatedResult';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ListServicesParams {
  page?: number;
  limit?: number;
  petId?: number;
}

export class ListServicesUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(params: ListServicesParams): Promise<PaginatedResult<Service>> {
    const page = params.page ?? DEFAULT_PAGE;
    const rawLimit = params.limit ?? DEFAULT_LIMIT;

    if (page < 1) {
      throw new ValidationError('Page must be at least 1');
    }

    if (rawLimit < 1) {
      throw new ValidationError('Limit must be at least 1');
    }

    const limit = Math.min(rawLimit, MAX_LIMIT);

    const findAllParams: FindAllParams = { page, limit };
    if (params.petId !== undefined) {
      findAllParams.petId = params.petId;
    }

    return this.repository.findAll(findAllParams);
  }
}
