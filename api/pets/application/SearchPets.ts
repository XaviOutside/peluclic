import { Pet } from '../domain/Pet';
import { IPetRepository } from '../domain/IPetRepository';
import { sanitizeFtsQuery } from '@api/shared/utils/sanitizeFtsQuery';

export interface SearchPetsParams {
  query: string;
}

export class SearchPetsUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(params: SearchPetsParams): Promise<Pet[]> {
    const sanitized = sanitizeFtsQuery(params.query);

    if (!sanitized) {
      return [];
    }

    return this.repository.search(sanitized);
  }
}
