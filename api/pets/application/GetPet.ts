import { Pet } from '../domain/Pet';
import { IPetRepository } from '../domain/IPetRepository';
import { PetNotFoundError } from '../domain/PetErrors';

export class GetPetUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(id: number): Promise<Pet> {
    const pet = await this.repository.findById(id);

    if (!pet || pet.deletedAt !== null) {
      throw new PetNotFoundError(id);
    }

    return pet;
  }
}
