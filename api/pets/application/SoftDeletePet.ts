import { IPetRepository } from '../domain/IPetRepository';
import { PetNotFoundError, PetAlreadyDeletedError } from '../domain/PetErrors';

export class SoftDeletePetUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(id: number): Promise<void> {
    const exists = await this.repository.existsById(id);

    if (!exists) {
      throw new PetNotFoundError(id);
    }

    const pet = await this.repository.findById(id);

    if (!pet) {
      throw new PetAlreadyDeletedError(id);
    }

    await this.repository.softDelete(id);
  }
}
