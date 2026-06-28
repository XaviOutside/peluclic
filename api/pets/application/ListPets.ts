import { Pet } from '../domain/Pet';
import { IPetRepository } from '../domain/IPetRepository';
import { PetValidationError } from '../domain/PetErrors';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ListPetsParams {
  page?: number;
  limit?: number;
  clientId?: number;
}

export class ListPetsUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(params: ListPetsParams): Promise<Pet[]> {
    const page = params.page ?? DEFAULT_PAGE;
    const rawLimit = params.limit ?? DEFAULT_LIMIT;

    if (page < 1) {
      throw new PetValidationError('Page must be greater than or equal to 1');
    }

    if (rawLimit < 1) {
      throw new PetValidationError('Limit must be greater than or equal to 1');
    }

    const limit = Math.min(rawLimit, MAX_LIMIT);

    if (params.clientId !== undefined) {
      return this.repository.findAllByClientId(params.clientId, page, limit);
    }

    return this.repository.findAll(page, limit);
  }
}
