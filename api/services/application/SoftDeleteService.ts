import { IServiceRepository } from '../domain/IServiceRepository';
import { NotFoundError, AlreadyDeletedError } from '@api/shared/domain/errors';

export class SoftDeleteServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(id: number): Promise<void> {
    const exists = await this.repository.existsById(id);

    if (!exists) {
      throw new NotFoundError('Service', id);
    }

    const service = await this.repository.findById(id);

    if (!service) {
      throw new AlreadyDeletedError('Service', id);
    }

    await this.repository.softDelete(id);
  }
}
