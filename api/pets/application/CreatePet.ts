import { Pet, CreatePetInput, PET_STATUS } from '../domain/Pet';
import { IPetRepository } from '../domain/IPetRepository';
import { PetValidationError } from '../domain/PetErrors';

const MAX_NAME_LENGTH = 100;
const MAX_SPECIES_LENGTH = 100;

export class CreatePetUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(input: CreatePetInput): Promise<Pet> {
    if (!input.name || !input.name.trim()) {
      throw new PetValidationError('Name is required');
    }

    if (input.name.trim().length > MAX_NAME_LENGTH) {
      throw new PetValidationError(`Name must be at most ${MAX_NAME_LENGTH} characters`);
    }

    if (!input.species || !input.species.trim()) {
      throw new PetValidationError('Species is required');
    }

    if (input.species.trim().length > MAX_SPECIES_LENGTH) {
      throw new PetValidationError(`Species must be at most ${MAX_SPECIES_LENGTH} characters`);
    }

    const clientIsActive = await this.repository.clientExistsAndIsActive(input.client_id);

    if (!clientIsActive) {
      throw new PetValidationError('client_id is not an active client');
    }

    return this.repository.create(input);
  }
}
